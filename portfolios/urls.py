from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PortfolioViewSet, StockViewSet, PositionViewSet, register_user, top_portfolios, portfolio_news, market_movers

router = DefaultRouter()
router.register(r'portfolios', PortfolioViewSet, basename='portfolio')
router.register(r'stocks', StockViewSet)
router.register(r'positions', PositionViewSet, basename='position')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/register/', register_user, name='register'),
    path('api/top-portfolios/', top_portfolios, name='top_portfolios'),
    path('api/portfolios/<int:portfolio_id>/news/', portfolio_news, name='portfolio_news'),
    path('api/market-movers/', market_movers, name='market_movers'),
]