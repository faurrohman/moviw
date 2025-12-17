import os
from functools import lru_cache
from typing import List, Optional

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT = os.path.dirname(__file__)
CSV_PATH = os.path.join(ROOT, "..", "movie_details_FINAL.csv")


@lru_cache(maxsize=1)
def load_df() -> pd.DataFrame:
    return pd.read_csv(CSV_PATH)


NUMERIC_FIELDS = [
    "rating",
    "votes",
    "jumlah_cast",
    "hydrax_count",
    "turbovip_count",
    "p2p_count",
    "cast_count",
    "other_count",
    "total_servers",
]


class Movie(BaseModel):
    slug: str
    judul: Optional[str] = None
    url: Optional[str] = None
    tahun: Optional[str] = None
    genre: Optional[str] = None
    rating: Optional[float] = None
    quality: Optional[str] = None
    durasi: Optional[str] = None
    negara: Optional[str] = None
    sutradara: Optional[str] = None
    cast: Optional[str] = None
    jumlah_cast: Optional[int] = None
    sinopsis: Optional[str] = None
    poster_url: Optional[str] = None
    votes: Optional[float] = None
    release_date: Optional[str] = None
    hydrax_servers: Optional[str] = None
    turbovip_servers: Optional[str] = None
    p2p_servers: Optional[str] = None
    cast_servers: Optional[str] = None
    other_servers: Optional[str] = None
    total_servers: Optional[int] = None


app = FastAPI(title="Movies API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def filtered(df: pd.DataFrame, q: Optional[str], min_rating: Optional[float]) -> pd.DataFrame:
    data = df
    if q:
        qlower = q.lower()
        data = data[data.apply(
            lambda r: qlower in str(r.get("judul", "")).lower()
            or qlower in str(r.get("slug", "")).lower()
            or qlower in str(r.get("genre", "")).lower(),
            axis=1
        )]
    if min_rating is not None:
        ratings = pd.to_numeric(data["rating"], errors="coerce")
        data = data[ratings >= min_rating]
    return data


def clean_records(df: pd.DataFrame) -> list[dict]:
    data = df.copy()
    for col in NUMERIC_FIELDS:
        if col in data.columns:
            data[col] = pd.to_numeric(data[col], errors="coerce")
    data = data.where(pd.notna(data), None)
    for col in data.columns:
        data[col] = data[col].apply(lambda v: None if v == "" else v)
    return data.to_dict(orient="records")


@app.get("/api/movies", response_model=List[Movie])
def list_movies(
    q: Optional[str] = Query(None, description="Cari judul/slug/genre"),
    min_rating: Optional[float] = Query(None, ge=0, le=10),
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    df = load_df()
    data = filtered(df, q, min_rating)
    sliced = data.iloc[offset: offset + limit]
    return clean_records(sliced)


@app.get("/api/movies/{slug}", response_model=Movie)
def get_movie(slug: str):
    df = load_df()
    row = df[df["slug"] == slug]
    if row.empty:
        raise HTTPException(status_code=404, detail="Movie not found")
    return clean_records(row)[0]

