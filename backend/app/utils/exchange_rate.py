import requests
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from ..config import settings

logger = logging.getLogger(__name__)

class ExchangeRateCache:
    """Cache for exchange rates to avoid excessive API calls"""
    def __init__(self):
        self.rate = None
        self.last_update = None
    
    def is_expired(self):
        if self.last_update is None:
            return True
        cache_duration = timedelta(minutes=settings.exchange_rate_cache_minutes)
        return datetime.now() - self.last_update > cache_duration
    
    def get(self):
        if not self.is_expired() and self.rate:
            return self.rate
        return None
    
    def set(self, rate):
        self.rate = rate
        self.last_update = datetime.now()

# Create cache instance
cache = ExchangeRateCache()

def get_usdt_rub_rate() -> Decimal:
    """
    Fetch current USDT/RUB exchange rate from CoinGecko API (free, no auth needed)
    Returns Decimal price of 1 USDT in RUB
    """
    # Check cache first
    cached_rate = cache.get()
    if cached_rate:
        logger.info(f"Using cached exchange rate: {cached_rate}")
        return cached_rate
    
    try:
        # Use CoinGecko API (free, no API key needed)
        response = requests.get(
            'https://api.coingecko.com/api/v3/simple/price',
            params={
                'ids': 'tether',
                'vs_currencies': 'rub',
                'include_market_cap': 'false',
                'include_24hr_vol': 'false',
                'include_24hr_change': 'false'
            },
            timeout=10
        )
        response.raise_for_status()
        
        data = response.json()
        rate = Decimal(str(data['tether']['rub']))
        
        # Cache the rate
        cache.set(rate)
        logger.info(f"Fetched exchange rate from CoinGecko: 1 USDT = {rate} RUB")
        return rate
        
    except Exception as e:
        logger.error(f"Error fetching exchange rate: {e}")
        # Return fallback rate if API fails
        fallback_rate = Decimal('95.0')  # Approximate rate as fallback
        logger.warning(f"Using fallback rate: {fallback_rate} RUB")
        return fallback_rate

def calculate_buy_price(exchange_rate: Decimal = None) -> Decimal:
    """
    Calculate the price we charge users when they buy USDT from us
    Formula: exchange_rate * (1 + buy_margin)
    """
    if exchange_rate is None:
        exchange_rate = get_usdt_rub_rate()
    
    buy_price = exchange_rate * (Decimal(1) + Decimal(str(settings.buy_margin)))
    return buy_price.quantize(Decimal('0.01'))

def calculate_sell_price(exchange_rate: Decimal = None) -> Decimal:
    """
    Calculate the price we pay users when they sell USDT to us
    Formula: exchange_rate * (1 - sell_margin)
    """
    if exchange_rate is None:
        exchange_rate = get_usdt_rub_rate()
    
    sell_price = exchange_rate * (Decimal(1) - Decimal(str(settings.sell_margin)))
    return sell_price.quantize(Decimal('0.01'))

def get_pricing_info():
    """Get current pricing information"""
    exchange_rate = get_usdt_rub_rate()
    buy_price = calculate_buy_price(exchange_rate)
    sell_price = calculate_sell_price(exchange_rate)
    
    return {
        'market_rate': float(exchange_rate),
        'buy_price': float(buy_price),  # Price per USDT when user buys
        'sell_price': float(sell_price),  # Price per USDT when user sells
        'buy_margin': settings.buy_margin * 100,  # In percentage
        'sell_margin': settings.sell_margin * 100,  # In percentage
        'spread': float((buy_price - sell_price).quantize(Decimal('0.01')))
    }
