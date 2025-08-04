from django.contrib import admin
from .models import Portfolio, Stock, Position


@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'created_at', 'total_value', 'total_gain_loss']
    list_filter = ['user', 'created_at']
    search_fields = ['name', 'user__username']
    readonly_fields = ['created_at', 'updated_at', 'total_value', 'total_cost', 'total_gain_loss']


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ['symbol', 'name', 'exchange', 'current_price', 'last_updated']
    list_filter = ['exchange', 'last_updated']
    search_fields = ['symbol', 'name']
    readonly_fields = ['last_updated']


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ['portfolio', 'stock', 'quantity', 'purchase_price', 'current_value', 'gain_loss']
    list_filter = ['portfolio__user', 'stock', 'purchase_date']
    search_fields = ['portfolio__name', 'stock__symbol']
    readonly_fields = ['created_at', 'updated_at', 'total_cost', 'current_value', 'gain_loss', 'gain_loss_percentage']
