import os

import uvicorn
from fastapi import FastAPI

app = FastAPI(title="TTTN AI Service")


@app.get("/")
def read_root():
    return {"message": "AI Service is running"}


if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run(app, host=host, port=8000)
