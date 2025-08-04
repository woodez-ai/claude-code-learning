from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.db.models import Q
from django.contrib.auth.models import User
from .models import Portfolio, Stock, Position
from .serializers import (
    PortfolioSerializer, PortfolioSummarySerializer,
    StockSerializer, PositionSerializer, UserRegistrationSerializer
)
import yfinance as yf
from datetime import datetime, timedelta
from django.utils import timezone
import requests
from django.core.cache import cache


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
                    stock.save()
                    updated_stocks.append(stock.symbol)
                    
            except Exception as e:
                continue
        
        return Response({
            'message': f'Updated prices for {len(updated_stocks)} stocks',
            'updated_stocks': updated_stocks
        })


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
        'LLY', 'AVGO', 'TXN', 'QCOM', 'COST', 'HON', 'UPS', 'IBM', 'GS', 'BA'
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
