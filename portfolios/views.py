from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.db.models import Q
from django.contrib.auth.models import User
from .models import Portfolio, Stock, Position, PortfolioImport
from .serializers import (
    PortfolioSerializer, PortfolioSummarySerializer,
    StockSerializer, PositionSerializer, UserRegistrationSerializer
)
import yfinance as yf
from datetime import datetime, timedelta
from django.utils import timezone
import requests
from django.core.cache import cache
import pandas as pd


class PortfolioViewSet(viewsets.ModelViewSet):
    serializer_class = PortfolioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Portfolio.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return PortfolioSummarySerializer
        return PortfolioSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def add_position(self, request, pk=None):
        portfolio = self.get_object()
        serializer = PositionSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(portfolio=portfolio)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def refresh_prices(self, request, pk=None):
        portfolio = self.get_object()
        updated_stocks = []
        
        for position in portfolio.positions.all():
            stock = position.stock
            try:
                ticker = yf.Ticker(stock.symbol)
                info = ticker.info
                current_price = info.get('currentPrice') or info.get('regularMarketPrice')
                
                if current_price:
                    stock.current_price = current_price
                    stock.name = info.get('longName', stock.name)
                    stock.exchange = info.get('exchange', stock.exchange)
                    stock.last_updated = timezone.now()
                    
                    # Also update analyst and options data
                    fetch_analyst_and_options_data(stock)
                    
                    stock.save()
                    updated_stocks.append(stock.symbol)
                    
            except Exception as e:
                continue
        
        return Response({
            'message': f'Updated prices for {len(updated_stocks)} stocks',
            'updated_stocks': updated_stocks
        })

    @action(detail=False, methods=['post'])
    def sell_position(self, request):
        position_id = request.data.get('position_id')
        quantity_to_sell = request.data.get('quantity', 0)
        sell_price = request.data.get('sell_price')
        
        try:
            position = Position.objects.get(id=position_id, portfolio__user=request.user)
            
            if not sell_price:
                sell_price = position.stock.current_price
                if not sell_price:
                    return Response(
                        {'error': 'No sell price provided and no current price available'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            quantity_to_sell = float(quantity_to_sell)
            sell_price = float(sell_price)
            
            if quantity_to_sell <= 0:
                return Response(
                    {'error': 'Quantity to sell must be greater than 0'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if quantity_to_sell > float(position.quantity):
                return Response(
                    {'error': 'Cannot sell more shares than owned'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calculate cash from sale
            cash_from_sale = quantity_to_sell * sell_price
            
            # Update portfolio cash balance
            position.portfolio.cash_balance += cash_from_sale
            position.portfolio.save()
            
            # Update or delete position
            if quantity_to_sell == float(position.quantity):
                # Selling all shares, delete position
                position.delete()
                position_action = 'deleted'
            else:
                # Partial sell, update quantity
                position.quantity = float(position.quantity) - quantity_to_sell
                position.save()
                position_action = 'updated'
            
            return Response({
                'message': f'Successfully sold {quantity_to_sell} shares of {position.stock.symbol}',
                'cash_from_sale': cash_from_sale,
                'new_cash_balance': float(position.portfolio.cash_balance),
                'position_action': position_action
            })
            
        except Position.DoesNotExist:
            return Response(
                {'error': 'Position not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to sell position: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Stock.objects.all()
        symbol = self.request.query_params.get('symbol', None)
        search = self.request.query_params.get('search', None)
        
        if symbol:
            queryset = queryset.filter(symbol__iexact=symbol)
        elif search:
            queryset = queryset.filter(
                Q(symbol__icontains=search) | Q(name__icontains=search)
            )
        
        return queryset

    @action(detail=False, methods=['post'])
    def search_yahoo(self, request):
        symbol = request.data.get('symbol', '').upper()
        if not symbol:
            return Response(
                {'error': 'Symbol is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            if not info.get('symbol'):
                return Response(
                    {'error': 'Stock not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            stock_data = {
                'symbol': symbol,
                'name': info.get('longName', symbol),
                'exchange': info.get('exchange', ''),
                'current_price': info.get('currentPrice') or info.get('regularMarketPrice'),
            }
            
            stock, created = Stock.objects.get_or_create(
                symbol=symbol,
                defaults=stock_data
            )
            
            if not created:
                for key, value in stock_data.items():
                    if value:
                        setattr(stock, key, value)
                stock.last_updated = timezone.now()
                stock.save()
            
            return Response(StockSerializer(stock).data)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch stock data: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PositionViewSet(viewsets.ModelViewSet):
    serializer_class = PositionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Position.objects.filter(portfolio__user=self.request.user)

    def perform_create(self, serializer):
        portfolio_id = self.request.data.get('portfolio')
        portfolio = Portfolio.objects.get(id=portfolio_id, user=self.request.user)
        serializer.save(portfolio=portfolio)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    Register a new user and return an authentication token
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'token': token.key
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def top_portfolios(request):
    """
    Get top 10 portfolios by total gain/loss for leaderboard
    """
    portfolios = Portfolio.objects.select_related('user').all()
    
    # Calculate gains and create leaderboard data
    leaderboard_data = []
    for portfolio in portfolios:
        total_gain_loss = portfolio.total_gain_loss
        total_cost = portfolio.total_cost
        if total_gain_loss is not None and total_cost and total_cost > 0:
            # Calculate percentage gain
            percentage_gain = (float(total_gain_loss) / float(total_cost)) * 100
            leaderboard_data.append({
                'id': portfolio.id,
                'name': portfolio.name,
                'username': portfolio.user.username,
                'total_gain_loss': float(total_gain_loss),
                'total_value': float(portfolio.total_value or 0),
                'total_cost': float(portfolio.total_cost or 0),
                'percentage_gain': percentage_gain,
            })
    
    # Sort by percentage gain descending and take top 10
    leaderboard_data.sort(key=lambda x: x['percentage_gain'], reverse=True)
    top_10 = leaderboard_data[:10]
    
    return Response(top_10)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def portfolio_news(request, portfolio_id):
    """
    Get financial news for tickers in a specific portfolio
    """
    try:
        portfolio = Portfolio.objects.get(id=portfolio_id, user=request.user)
    except Portfolio.DoesNotExist:
        return Response(
            {'error': 'Portfolio not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get unique tickers from portfolio positions
    tickers = list(portfolio.positions.values_list('stock__symbol', flat=True).distinct())
    
    if not tickers:
        return Response([])
    
    # Cache key for this portfolio's news
    cache_key = f'portfolio_news_{portfolio_id}'
    cached_news = cache.get(cache_key)
    
    if cached_news:
        return Response(cached_news)
    
    all_news = []
    
    # Get news for each ticker using yfinance
    for ticker in tickers[:5]:  # Limit to first 5 tickers to avoid rate limits
        try:
            stock = yf.Ticker(ticker)
            news = stock.news
            
            for article in news[:3]:  # Get top 3 articles per ticker
                content = article.get('content', {})
                thumbnail = content.get('thumbnail', {})
                resolutions = thumbnail.get('resolutions', [])
                image_url = resolutions[-1].get('url', '') if resolutions else ''
                
                # Convert pubDate to timestamp
                pub_date = content.get('pubDate', '')
                published_timestamp = 0
                if pub_date:
                    try:
                        from datetime import datetime
                        dt = datetime.fromisoformat(pub_date.replace('Z', '+00:00'))
                        published_timestamp = int(dt.timestamp())
                    except:
                        published_timestamp = 0
                
                all_news.append({
                    'ticker': ticker,
                    'title': content.get('title', ''),
                    'summary': content.get('summary', ''),
                    'url': content.get('canonicalUrl', {}).get('url', ''),
                    'published': published_timestamp,
                    'publisher': content.get('provider', {}).get('displayName', ''),
                    'image': image_url,
                })
        except Exception as e:
            continue
    
    # Sort by published time (most recent first)
    all_news.sort(key=lambda x: x['published'], reverse=True)
    
    # Take top 10 most recent articles
    recent_news = all_news[:10]
    
    # Cache for 30 minutes
    cache.set(cache_key, recent_news, 1800)
    
    return Response(recent_news)


@api_view(['GET'])
@permission_classes([AllowAny])
def market_movers(request):
    """
    Get top 10 stock gainers and losers from popular stocks
    """
    # Cache key for market movers
    cache_key = 'market_movers_data'
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return Response(cached_data)
    
    # Popular stocks to check for movers (mix of large cap stocks)
    popular_tickers = [
        'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'JPM', 'JNJ', 'V',
        'WMT', 'PG', 'UNH', 'DIS', 'HD', 'PYPL', 'ADBE', 'NFLX', 'CRM', 'INTC',
        'AMD', 'CSCO', 'PFE', 'KO', 'PEP', 'TMO', 'ABBV', 'ACN', 'NKE', 'MRK',
        'LLY', 'AVGO', 'TXN', 'QCOM', 'COST', 'HON', 'UPS', 'IBM', 'GS', 'BA',
        'PLTR'
    ]
    
    movers_data = []
    
    for ticker in popular_tickers:
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            hist = stock.history(period='2d')
            
            if len(hist) >= 2:
                current_price = float(hist['Close'].iloc[-1])
                prev_price = float(hist['Close'].iloc[-2])
                change = current_price - prev_price
                change_pct = (change / prev_price) * 100
                
                movers_data.append({
                    'symbol': ticker,
                    'name': info.get('longName', ticker),
                    'price': current_price,
                    'change': change,
                    'change_percent': change_pct,
                    'volume': int(hist['Volume'].iloc[-1]) if 'Volume' in hist.columns else 0,
                    'market_cap': info.get('marketCap', 0),
                })
        except Exception as e:
            continue
    
    # Get top 10 gainers - filter positive gains and sort by highest first
    all_gainers = [stock for stock in movers_data if stock['change_percent'] > 0]
    all_gainers.sort(key=lambda x: x['change_percent'], reverse=True)  # Sort descending (highest first)
    gainers = all_gainers[:10]
    
    # Get top 10 losers - filter negative gains and sort by most negative first
    all_losers = [stock for stock in movers_data if stock['change_percent'] < 0]
    all_losers.sort(key=lambda x: x['change_percent'])  # Sort ascending (most negative first)
    losers = all_losers[:10]
    
    result = {
        'gainers': gainers,
        'losers': losers,
        'last_updated': timezone.now().isoformat()
    }
    
    # Cache for 15 minutes
    cache.set(cache_key, result, 900)
    
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def portfolio_performance(request, portfolio_id):
    """
    Get historical performance data for a portfolio using Yahoo Finance data
    """
    try:
        portfolio = Portfolio.objects.get(id=portfolio_id, user=request.user)
    except Portfolio.DoesNotExist:
        return Response(
            {'error': 'Portfolio not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get time period from query params (default to 1 month)
    period = request.GET.get('period', '1mo')  # 1mo, 3mo, 6mo, 1y, 2y, 5y
    
    # Cache key for this portfolio's performance data
    cache_key = f'portfolio_performance_{portfolio_id}_{period}'
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return Response(cached_data)
    
    # Get unique tickers from portfolio positions
    positions = portfolio.positions.all()
    if not positions:
        return Response({'dates': [], 'values': [], 'initial_value': 0})
    
    try:
        # Calculate portfolio value over time
        portfolio_history = []
        
        # Get the earliest position date or use a default lookback
        from datetime import datetime, timedelta
        
        # Map period to days for consistent lookback
        period_days = {
            '1mo': 30, '3mo': 90, '6mo': 180, 
            '1y': 365, '2y': 730, '5y': 1825
        }
        days_back = period_days.get(period, 30)
        
        # Get historical data for all stocks in portfolio
        tickers = [pos.stock.symbol for pos in positions]
        
        # Create a master date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        # Get historical data for the longest-held position to establish date range
        sample_ticker = tickers[0]
        sample_stock = yf.Ticker(sample_ticker)
        sample_hist = sample_stock.history(period=period)
        
        if sample_hist.empty:
            return Response({'dates': [], 'values': [], 'initial_value': 0})
        
        # Use the actual dates from Yahoo Finance
        dates = sample_hist.index.tolist()
        
        # Calculate portfolio value for each date
        portfolio_values = []
        
        for date in dates:
            total_value = 0
            valid_data = True
            
            for position in positions:
                ticker = position.stock.symbol
                quantity = float(position.quantity)
                
                try:
                    stock = yf.Ticker(ticker)
                    hist = stock.history(period=period)
                    
                    if date in hist.index:
                        price_on_date = float(hist.loc[date]['Close'])
                        total_value += price_on_date * quantity
                    else:
                        # If no data for this date, use the closest available price
                        available_dates = hist.index[hist.index <= date]
                        if len(available_dates) > 0:
                            closest_date = available_dates[-1]
                            price_on_date = float(hist.loc[closest_date]['Close'])
                            total_value += price_on_date * quantity
                        else:
                            valid_data = False
                            break
                except Exception as e:
                    valid_data = False
                    break
            
            if valid_data:
                portfolio_values.append(total_value)
            else:
                # Use previous value or current portfolio value as fallback
                if portfolio_values:
                    portfolio_values.append(portfolio_values[-1])
                else:
                    portfolio_values.append(float(portfolio.total_value or 0))
        
        # Format dates for frontend
        formatted_dates = [date.strftime('%Y-%m-%d') for date in dates]
        
        # Calculate initial value and performance metrics
        initial_value = portfolio_values[0] if portfolio_values else 0
        current_value = portfolio_values[-1] if portfolio_values else 0
        total_return = current_value - initial_value
        total_return_pct = (total_return / initial_value * 100) if initial_value > 0 else 0
        
        result = {
            'dates': formatted_dates,
            'values': portfolio_values,
            'initial_value': initial_value,
            'current_value': current_value,
            'total_return': total_return,
            'total_return_percent': total_return_pct,
            'period': period
        }
        
        # Cache for 1 hour
        cache.set(cache_key, result, 3600)
        
        return Response(result)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to calculate portfolio performance: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def fetch_analyst_and_options_data(stock):
    """
    Fetch analyst consensus and options data for a stock using yfinance
    """
    try:
        ticker = yf.Ticker(stock.symbol)
        
        # Get analyst recommendations
        try:
            recommendations = ticker.recommendations
            if recommendations is not None and not recommendations.empty:
                # Get the most recent recommendation
                latest_rec = recommendations.iloc[-1]
                
                # Calculate consensus (simplified approach)
                strong_buy = latest_rec.get('strongBuy', 0)
                buy = latest_rec.get('buy', 0)
                hold = latest_rec.get('hold', 0)
                sell = latest_rec.get('sell', 0)
                strong_sell = latest_rec.get('strongSell', 0)
                
                total_analysts = strong_buy + buy + hold + sell + strong_sell
                
                if total_analysts > 0:
                    # Determine consensus based on majority
                    if (strong_buy + buy) > (sell + strong_sell + hold/2):
                        consensus = "Buy"
                    elif (sell + strong_sell) > (strong_buy + buy + hold/2):
                        consensus = "Sell"
                    else:
                        consensus = "Hold"
                    
                    stock.analyst_recommendation = consensus
                    stock.analyst_count = int(total_analysts)
        except Exception as e:
            print(f"Failed to get recommendations for {stock.symbol}: {e}")
        
        # Get analyst target price
        try:
            info = ticker.info
            target_price = info.get('targetMeanPrice')
            if target_price:
                stock.analyst_target_price = float(target_price)
        except Exception as e:
            print(f"Failed to get target price for {stock.symbol}: {e}")
        
        # Get options data for put/call ratio
        try:
            # Get options chain
            options_dates = ticker.options
            
            if options_dates and len(options_dates) > 0:
                # Use the nearest expiration date
                nearest_date = options_dates[0]
                options_chain = ticker.option_chain(nearest_date)
                
                if options_chain.calls is not None and options_chain.puts is not None:
                    calls_df = options_chain.calls
                    puts_df = options_chain.puts
                    
                    # Calculate volume-based put/call ratio
                    calls_volume = 0
                    puts_volume = 0
                    
                    # Try to get volume data
                    if 'volume' in calls_df.columns and 'volume' in puts_df.columns:
                        calls_volume = calls_df['volume'].fillna(0).sum()
                        puts_volume = puts_df['volume'].fillna(0).sum()
                    
                    # If no volume data or very low volume, use open interest
                    if calls_volume <= 10 and 'openInterest' in calls_df.columns:
                        calls_volume = calls_df['openInterest'].fillna(0).sum()
                        puts_volume = puts_df['openInterest'].fillna(0).sum()
                    
                    # Calculate ratio if we have sufficient data
                    if calls_volume > 0:
                        put_call_ratio = puts_volume / calls_volume
                        stock.put_call_ratio = float(put_call_ratio)
                        stock.options_last_updated = timezone.now()
                        # Only print for debugging
                        # print(f"P/C ratio for {stock.symbol}: {put_call_ratio:.4f} (calls: {calls_volume}, puts: {puts_volume})")
                    
        except Exception as e:
            print(f"Failed to get options data for {stock.symbol}: {e}")
        
        return True
    except Exception as e:
        print(f"Failed to fetch analyst/options data for {stock.symbol}: {e}")
        return False


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refresh_stock_analysis(request):
    """
    Refresh analyst consensus and options data for stocks in user's portfolios
    """
    try:
        # Get all unique stocks from user's portfolios
        user_portfolios = Portfolio.objects.filter(user=request.user)
        stock_ids = set()
        
        for portfolio in user_portfolios:
            for position in portfolio.positions.all():
                stock_ids.add(position.stock.id)
        
        stocks = Stock.objects.filter(id__in=stock_ids)
        updated_stocks = []
        failed_stocks = []
        
        for stock in stocks:
            if fetch_analyst_and_options_data(stock):
                stock.save()
                updated_stocks.append(stock.symbol)
            else:
                failed_stocks.append(stock.symbol)
        
        return Response({
            'message': f'Updated analysis data for {len(updated_stocks)} stocks',
            'updated_stocks': updated_stocks,
            'failed_stocks': failed_stocks
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to refresh stock analysis: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_stock_options(request):
    """
    Test options data for a specific stock symbol
    """
    symbol = request.data.get('symbol', '').upper()
    if not symbol:
        return Response({'error': 'Symbol is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get or create stock
        stock, created = Stock.objects.get_or_create(
            symbol=symbol,
            defaults={'name': symbol}
        )
        
        # Fetch options data
        success = fetch_analyst_and_options_data(stock)
        stock.save()
        
        if success:
            return Response({
                'symbol': stock.symbol,
                'analyst_recommendation': stock.analyst_recommendation,
                'analyst_target_price': float(stock.analyst_target_price) if stock.analyst_target_price else None,
                'analyst_count': stock.analyst_count,
                'put_call_ratio': float(stock.put_call_ratio) if stock.put_call_ratio else None,
                'options_last_updated': stock.options_last_updated.isoformat() if stock.options_last_updated else None
            })
        else:
            return Response({'error': 'Failed to fetch stock data'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_portfolio_csv(request, portfolio_id):
    """
    Import CSV file into existing portfolio
    Step 1: Parse and validate CSV, return preview
    """
    try:
        portfolio = Portfolio.objects.get(id=portfolio_id, user=request.user)
    except Portfolio.DoesNotExist:
        return Response(
            {'error': 'Portfolio not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    if 'csv_file' not in request.FILES:
        return Response(
            {'error': 'No CSV file provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        csv_file = request.FILES['csv_file']
        
        # Validate file type
        if not csv_file.name.endswith('.csv'):
            return Response(
                {'error': 'File must be a CSV file'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (max 10MB)
        if csv_file.size > 10 * 1024 * 1024:
            return Response(
                {'error': 'File size must be less than 10MB'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Read file content
        csv_content = csv_file.read().decode('utf-8')
        
        # Create import record
        portfolio_import = PortfolioImport.objects.create(
            portfolio=portfolio,
            filename=csv_file.name,
            status='parsing'
        )
        
        # Parse and validate CSV
        from .csv_parser import CSVPortfolioParser
        parser = CSVPortfolioParser(csv_content, csv_file.name, portfolio_import)
        result = parser.parse_and_validate()
        
        if result['success']:
            return Response({
                'import_id': portfolio_import.id,
                'preview': {
                    'total_rows': result['total_rows'],
                    'valid_rows': result['valid_rows'],
                    'error_rows': result['error_rows'],
                    'sample_data': result['data'][:10],  # First 10 rows for preview
                    'column_mapping': result['column_mapping'],
                    'errors': result['errors']
                }
            })
        else:
            return Response(
                {'error': result['error']}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        return Response(
            {'error': f'Failed to process CSV: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_csv_import(request, import_id):
    """
    Confirm and execute the CSV import after preview
    """
    try:
        portfolio_import = PortfolioImport.objects.get(
            id=import_id,
            portfolio__user=request.user
        )
    except PortfolioImport.DoesNotExist:
        return Response(
            {'error': 'Import not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    if portfolio_import.status != 'preview':
        return Response(
            {'error': 'Import is not in preview status'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        from .csv_parser import create_positions_from_import
        result = create_positions_from_import(portfolio_import)
        
        return Response({
            'success': result['success'],
            'created_positions': result['created_positions'],
            'errors': result.get('errors', []),
            'import_id': import_id
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to create positions: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_import_status(request, import_id):
    """
    Get import status and details
    """
    try:
        portfolio_import = PortfolioImport.objects.get(
            id=import_id,
            portfolio__user=request.user
        )
        
        return Response({
            'id': portfolio_import.id,
            'filename': portfolio_import.filename,
            'status': portfolio_import.status,
            'total_rows': portfolio_import.total_rows,
            'successful_imports': portfolio_import.successful_imports,
            'failed_imports': portfolio_import.failed_imports,
            'import_date': portfolio_import.import_date,
            'errors': portfolio_import.error_log or []
        })
        
    except PortfolioImport.DoesNotExist:
        return Response(
            {'error': 'Import not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
