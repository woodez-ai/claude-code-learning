from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal


class Portfolio(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='portfolios')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"
    
    @property
    def total_value(self):
        return sum(position.current_value for position in self.positions.all())
    
    @property
    def total_cost(self):
        return sum(position.total_cost for position in self.positions.all())
    
    @property
    def total_gain_loss(self):
        return self.total_value - self.total_cost


class Stock(models.Model):
    symbol = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=200)
    exchange = models.CharField(max_length=50, blank=True)
    current_price = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    last_updated = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['symbol']
    
    def __str__(self):
        return f"{self.symbol} - {self.name}"


class Position(models.Model):
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='positions')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=12, decimal_places=4)
    purchase_price = models.DecimalField(max_digits=12, decimal_places=4)
    purchase_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['portfolio', 'stock']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.portfolio.name} - {self.stock.symbol} ({self.quantity} shares)"
    
    @property
    def total_cost(self):
        return self.quantity * self.purchase_price
    
    @property
    def current_value(self):
        if self.stock.current_price:
            return self.quantity * self.stock.current_price
        return Decimal('0.00')
    
    @property
    def gain_loss(self):
        return self.current_value - self.total_cost
    
    @property
    def gain_loss_percentage(self):
        if self.total_cost > 0:
            return ((self.current_value - self.total_cost) / self.total_cost) * 100
        return Decimal('0.00')
