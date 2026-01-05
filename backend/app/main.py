from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from .models import Base
from .routes import auth, transactions

try:
    from .utils.exchange_rate import get_pricing_info
    has_pricing = True
except Exception as e:
    print(f"Warning: Could not load exchange_rate module: {e}")
    has_pricing = False

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CoinConvert API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to CoinConvert"}

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

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(transactions.router, prefix="/api", tags=["transactions"])

@app.get("/")
def read_root():
    return {"message": "Welcome to CoinConvert"}