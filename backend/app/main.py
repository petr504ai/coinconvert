from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth, transactions
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

logger.info("=" * 80)
logger.info("STARTING COINCONVERT API")
logger.info("=" * 80)

try:
    from .utils.exchange_rate import get_pricing_info
    has_pricing = True
    logger.info("✅ Exchange rate module loaded successfully")
except Exception as e:
    print(f"Warning: Could not load exchange_rate module: {e}")
    logger.error(f"❌ Could not load exchange_rate module: {e}")
    has_pricing = False

app = FastAPI(title="CoinConvert API")
logger.info("FastAPI app created")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "https://coinconvert.ru",  # Production domain
        "http://coinconvert.ru",   # Production domain (HTTP)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to CoinConvert"}

# Include routers twice - with and without /api prefix to support both local dev and production proxy
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(transactions.router, prefix="/api", tags=["transactions"])  # For local dev (with /api)
app.include_router(transactions.router, tags=["transactions"])  # For production proxy (strips /api)

@app.get("/pricing")
def get_pricing():
    """Get current exchange rates and pricing"""
    if not has_pricing:
        return {"error": "Pricing service unavailable"}
    try:
        return get_pricing_info()
    except Exception as e:
        print(f"Error in pricing endpoint: {e}")
        return {"error": str(e)}