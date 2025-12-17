from fastapi import FastAPI

app = FastAPI(title="Root API")


@app.get("/api")
def root():
    return {"message": "Movies API", "endpoints": ["/api/movies", "/api/movies/{slug}"]}

