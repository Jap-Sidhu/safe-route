"""Fetch and normalize hazard data from NASA FIRMS and USGS."""

import csv
import io
import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

import requests

from config import FIRE_BBOX, FIRMS_SOURCES, QUAKE_BBOX

log = logging.getLogger(__name__)

FIRMS_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/{key}/{source}/{area}/{days}"
USGS_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"
TIMEOUT = 30


class SourceError(Exception):
    pass


def parse_firms_csv(text: str, min_frp: float = 0.0) -> list[dict]:
    """Turn a FIRMS VIIRS CSV into map points, keeping nominal/high confidence detections."""
    west, south, east, north = FIRE_BBOX
    fires = []
    for row in csv.DictReader(io.StringIO(text)):
        try:
            lat = float(row["latitude"])
            lng = float(row["longitude"])
            frp = float(row.get("frp") or 0)
        except (KeyError, TypeError, ValueError):
            continue
        confidence = (row.get("confidence") or "").strip().lower()
        if not (south <= lat <= north and west <= lng <= east):
            continue
        if confidence not in ("h", "n") or frp < min_frp:
            continue
        fires.append({
            "lat": lat,
            "lng": lng,
            "properties": {
                "brightness": row.get("bright_ti4", ""),
                "fp": frp,
                "confidence": confidence,
                "date": row.get("acq_date", ""),
                "time": row.get("acq_time", ""),
                "satellite": row.get("satellite", ""),
                "daynight": row.get("daynight", ""),
            },
        })
    return fires


def fetch_fires(map_key: str, days: int = 2, min_frp: float = 0.0) -> list[dict]:
    if not map_key:
        raise SourceError("FIRMS_MAP_KEY (or FIRMS_API_KEY) is not set")
    area = ",".join(str(v) for v in FIRE_BBOX)

    errors: list[str] = []

    def fetch_source(source: str) -> list[dict] | None:
        url = FIRMS_URL.format(key=map_key, source=source, area=area, days=max(1, min(days, 10)))
        try:
            res = requests.get(url, timeout=TIMEOUT)
            res.raise_for_status()
            # FIRMS reports bad keys and quota errors as plain text with a 200 status.
            if not res.text.startswith("latitude"):
                raise SourceError(res.text.strip()[:120] or "empty response")
            return parse_firms_csv(res.text, min_frp)
        except Exception as exc:  # noqa: BLE001
            reason = f"{type(exc).__name__}: {exc}".replace(map_key, "***")  # request URLs contain the key
            log.warning("FIRMS %s failed: %s", source, reason)
            errors.append(f"{source}: {reason}")
            return None

    # Each satellite is a separate request, so fetch them at the same time.
    with ThreadPoolExecutor(max_workers=len(FIRMS_SOURCES)) as pool:
        results = list(pool.map(fetch_source, FIRMS_SOURCES))
    if all(r is None for r in results):
        raise SourceError("all FIRMS sources failed. " + " | ".join(errors))
    return [fire for r in results if r for fire in r]


def normalize_quakes(geojson: dict) -> list[dict]:
    quakes = []
    for feature in geojson.get("features", []):
        try:
            lng, lat, depth = feature["geometry"]["coordinates"][:3]
            props = feature["properties"]
        except (KeyError, TypeError, ValueError):
            continue
        if props.get("mag") is None:
            continue
        quakes.append({
            "lat": lat,
            "lng": lng,
            "properties": {
                "magnitude": props["mag"],
                "depth": depth or 0,
                "place": props.get("place") or "Unknown location",
                "time": props.get("time"),  # epoch milliseconds
                "url": props.get("url") or "",
                "tsunami": props.get("tsunami") or 0,
                "type": props.get("type") or "earthquake",
                "id": feature.get("id", ""),
            },
        })
    return quakes


def fetch_earthquakes(days: int = 30) -> list[dict]:
    west, south, east, north = QUAKE_BBOX
    start = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    params = {
        "format": "geojson", "starttime": start, "minmagnitude": 0,
        "minlatitude": south, "maxlatitude": north, "minlongitude": west, "maxlongitude": east,
    }
    try:
        res = requests.get(USGS_URL, params=params, timeout=TIMEOUT)
        res.raise_for_status()
        return normalize_quakes(res.json())
    except Exception as exc:  # noqa: BLE001
        raise SourceError(f"USGS failed: {exc}") from exc
