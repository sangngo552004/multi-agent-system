from fastapi import FastAPI
import uvicorn

app = FastAPI(title="TTTN AI Service")

@app.get("/")
def read_root():
    return {"message": "AI Service is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
