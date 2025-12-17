import json
import pandas as pd

CSV_PATH = "movie_details_FINAL.csv"
JSON_PATH = "movie_details_FINAL.json"

# Kolom yang sebaiknya numerik
NUMERIC_COLS = [
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

def main():
    df = pd.read_csv(CSV_PATH)

    # Paksa kolom numerik ke numeric (NaN jika gagal)
    for col in NUMERIC_COLS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # NaN -> None
    df = df.where(pd.notna(df), None)

    # Kolom non-numerik: pastikan tipe string (kecuali None)
    for col in df.columns:
        if col not in NUMERIC_COLS:
            df[col] = df[col].apply(lambda v: str(v) if v is not None else None)

    records = df.to_dict(orient="records")

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False)

    print(f"Saved {len(records)} records to {JSON_PATH}")


if __name__ == "__main__":
    main()

