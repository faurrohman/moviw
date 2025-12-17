from fastapi import FastAPI, Response

app = FastAPI()


@app.get("/api/favicon")
def favicon():
    return Response(status_code=204)

