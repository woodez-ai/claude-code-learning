from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PortfolioViewSet, StockViewSet, PositionViewSet, register_user, top_portfolios, portfolio_news, market_movers, portfolio_performance, refresh_stock_analysis, test_stock_options, import_portfolio_csv, confirm_csv_import, get_import_status

router = DefaultRouter()
router.register(r'portfolios', PortfolioViewSet, basename='portfolio')
router.register(r'stocks', StockViewSet)
router.register(r'positions', PositionViewSet, basename='position')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/register/', register_user, name='register'),
    path('api/top-portfolios/', top_portfolios, name='top_portfolios'),
    path('api/portfolios/<int:portfolio_id>/news/', portfolio_news, name='portfolio_news'),
    path('api/portfolios/<int:portfolio_id>/performance/', portfolio_performance, name='portfolio_performance'),
    path('api/market-movers/', market_movers, name='market_movers'),
    path('api/refresh-stock-analysis/', refresh_stock_analysis, name='refresh_stock_analysis'),
    path('api/test-stock-options/', test_stock_options, name='test_stock_options'),
    path('api/portfolios/<int:portfolio_id>/import-csv/', import_portfolio_csv, name='import_portfolio_csv'),
    path('api/imports/<int:import_id>/confirm/', confirm_csv_import, name='confirm_csv_import'),
    path('api/imports/<int:import_id>/status/', get_import_status, name='get_import_status'),
]