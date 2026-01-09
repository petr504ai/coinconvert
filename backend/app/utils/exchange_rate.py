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

# Separate cache for Bybit P2P snapshot (can be dict)
bybit_p2p_cache = ExchangeRateCache()


def _parse_decimal(value) -> Decimal:
    try:
        return Decimal(str(value))
    except Exception:
        return None


def _fetch_bybit_p2p_prices(token_id: str, currency_id: str, side: str, size: int = 10):
    """Fetch raw prices list from Bybit P2P public endpoint.

    Notes:
    - Bybit P2P endpoints are not officially stable; response shapes may vary.
    - We keep this function defensive and return an empty list on any unexpected shape.
    """
    url = "https://api2.bybit.com/fiat/otc/item/online"

    # Observed payload format for this endpoint
    payload = {
        "userId": "",
        "tokenId": token_id,
        "currencyId": currency_id,
        "payment": [],
        "side": str(side),
        "size": str(size),
        "page": "1",
        "amount": "",
        "authMaker": False,
        "canTrade": False,
    }

    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()

        # Common shapes seen:
        # {"result": {"items": [...]}}
        # {"result": {"data": [...]}}
        result = data.get("result") if isinstance(data, dict) else None
        if not isinstance(result, dict):
            return []

        items = result.get("items")
        if items is None:
            items = result.get("data")
        if not isinstance(items, list):
            return []

        prices = []
        for item in items:
            if not isinstance(item, dict):
                continue
            price = item.get("price")
            dec = _parse_decimal(price)
            if dec is None:
                continue
            prices.append(dec)

        return prices
    except Exception as e:
        logger.error(f"Error fetching Bybit P2P prices (side={side}): {e}")
        return []


def get_bybit_p2p_usdt_rub_rates():
    """Get Bybit P2P snapshot for USDT/RUB.

    Returns dict:
      {
        'buy_usdt_rub': float | None,   # user buys USDT for RUB
        'sell_usdt_rub': float | None,  # user sells USDT for RUB
        'source': 'bybit_p2p'
      }

    We interpret:
    - buy_usdt_rub  as the lowest available sell-offer price (best for buying)
    - sell_usdt_rub as the highest available buy-offer price (best for selling)
    
    Because Bybit's 'side' semantics can vary, we try both sides and then apply
    min/max logic on the returned lists.
    """
    cached = bybit_p2p_cache.get()
    if cached:
        return cached

    # Try both sides; one usually corresponds to sell offers, the other to buy offers.
    prices_side_0 = _fetch_bybit_p2p_prices("USDT", "RUB", side="0", size=10)
    prices_side_1 = _fetch_bybit_p2p_prices("USDT", "RUB", side="1", size=10)

    buy_usdt = None
    sell_usdt = None

    # Heuristic:
    # - buy_usdt should come from the side with cheaper prices (min)
    # - sell_usdt should come from the side with more expensive prices (max)
    
    # Collect candidate mins/maxes
    side0_min = min(prices_side_0) if prices_side_0 else None
    side0_max = max(prices_side_0) if prices_side_0 else None
    side1_min = min(prices_side_1) if prices_side_1 else None
    side1_max = max(prices_side_1) if prices_side_1 else None

    # Choose buy price as the smallest min among available sides
    candidate_mins = [x for x in [side0_min, side1_min] if x is not None]
    if candidate_mins:
        buy_usdt = min(candidate_mins)

    # Choose sell price as the largest max among available sides
    candidate_maxs = [x for x in [side0_max, side1_max] if x is not None]
    if candidate_maxs:
        sell_usdt = max(candidate_maxs)

    result = {
        "buy_usdt_rub": float(buy_usdt) if buy_usdt is not None else None,
        "sell_usdt_rub": float(sell_usdt) if sell_usdt is not None else None,
        "source": "bybit_p2p",
    }
    bybit_p2p_cache.set(result)
    return result

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

    bybit_p2p = get_bybit_p2p_usdt_rub_rates()
    
    return {
        'market_rate': float(exchange_rate),
        'buy_price': float(buy_price),  # Price per USDT when user buys
        'sell_price': float(sell_price),  # Price per USDT when user sells
        'buy_margin': settings.buy_margin * 100,  # In percentage
        'sell_margin': settings.sell_margin * 100,  # In percentage
        'spread': float((buy_price - sell_price).quantize(Decimal('0.01'))),

        # Extra info for UI (header): external snapshots
        'coingecko_usdt_rub': float(exchange_rate),
        'bybit_p2p_buy_usdt_rub': bybit_p2p.get('buy_usdt_rub'),
        'bybit_p2p_sell_usdt_rub': bybit_p2p.get('sell_usdt_rub'),
    }
