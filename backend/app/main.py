from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from .models import Base
from .routes import auth, transactions

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CoinConvert API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(transactions.router, prefix="/api", tags=["transactions"])

@app.get("/")
def read_root():
    return {"message": "Welcome to CoinConvert"}