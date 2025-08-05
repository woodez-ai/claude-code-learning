from rest_framework import serializers
from .models import Portfolio, Stock, Position
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = [
            'id', 'symbol', 'name', 'exchange', 'current_price', 'last_updated',
            'analyst_recommendation', 'analyst_target_price', 'analyst_count',
            'put_call_ratio', 'options_last_updated'
        ]
        read_only_fields = [
            'id', 'current_price', 'last_updated', 'analyst_recommendation', 
            'analyst_target_price', 'analyst_count', 'put_call_ratio', 'options_last_updated'
        ]


class PositionSerializer(serializers.ModelSerializer):
    stock = StockSerializer(read_only=True)
    stock_symbol = serializers.CharField(write_only=True)
    total_cost = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    current_value = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    gain_loss = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    gain_loss_percentage = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)

    class Meta:
        model = Position
        fields = [
            'id', 'stock', 'stock_symbol', 'quantity', 'purchase_price', 
            'purchase_date', 'total_cost', 'current_value', 'gain_loss', 
            'gain_loss_percentage', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        stock_symbol = validated_data.pop('stock_symbol')
        stock, created = Stock.objects.get_or_create(
            symbol=stock_symbol.upper(),
            defaults={'name': stock_symbol.upper()}
        )
        validated_data['stock'] = stock
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Remove stock_symbol if provided during update since we can't change the stock
        validated_data.pop('stock_symbol', None)
        return super().update(instance, validated_data)


class PortfolioSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    positions = PositionSerializer(many=True, read_only=True)
    total_value = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_cost = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_gain_loss = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    position_count = serializers.SerializerMethodField()

    class Meta:
        model = Portfolio
        fields = [
            'id', 'name', 'description', 'user', 'positions', 'total_value', 
            'total_cost', 'total_gain_loss', 'position_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_position_count(self, obj):
        return obj.positions.count()


class PortfolioSummarySerializer(serializers.ModelSerializer):
    total_value = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_cost = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_gain_loss = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    position_count = serializers.SerializerMethodField()

    class Meta:
        model = Portfolio
        fields = [
            'id', 'name', 'description', 'total_value', 'total_cost', 
            'total_gain_loss', 'position_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_position_count(self, obj):
        return obj.positions.count()