import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import sources  # noqa: E402
from app import create_app  # noqa: E402
from cache import MemoryCache  # noqa: E402
from config import KEY_FIRES, KEY_LOCK, KEY_QUAKES, Settings  # noqa: E402
from refresher import refresh_once  # noqa: E402

FIRE = {"lat": 50.1, "lng": -120.2, "properties": {"brightness": "330", "fp": 12.5, "confidence": "h",
                                                   "date": "2026-10-29", "time": "0930", "satellite": "N", "daynight": "D"}}
QUAKE = {"lat": 49.0, "lng": -123.0, "properties": {"magnitude": 3.1, "depth": 10.0, "place": "near Vancouver",
                                                    "time": 1, "url": "", "tsunami": 0, "type": "earthquake", "id": "x"}}


@pytest.fixture
def settings():
    # Explicit values so tests never pick up real keys from backend/.env
    return Settings(firms_map_key="test", ors_api_key="", redis_url="", run_worker=False)


@pytest.fixture
def cache():
    return MemoryCache()


@pytest.fixture
def client(cache, settings, monkeypatch):
    monkeypatch.setattr(sources, "fetch_fires", lambda *a, **k: [FIRE])
    monkeypatch.setattr(sources, "fetch_earthquakes", lambda *a, **k: [QUAKE])
    return create_app(cache=cache, settings=settings).test_client()


def test_cold_start_fills_cache(client, cache):
    res = client.get("/api/hazards/fires")
    assert res.status_code == 200
    assert res.json["data"] == [FIRE]
    assert cache.get(KEY_QUAKES) is None  # only the requested dataset is fetched inline


def test_serves_from_cache_without_refetch(client, cache, monkeypatch):
    client.get("/api/hazards/earthquakes")

    def boom(*a, **k):
        raise AssertionError("should not refetch")
    monkeypatch.setattr(sources, "fetch_earthquakes", boom)
    assert client.get("/api/hazards/earthquakes").json["count"] == 1


def test_failed_source_keeps_previous_cache(cache, settings, monkeypatch):
    monkeypatch.setattr(sources, "fetch_fires", lambda *a, **k: [FIRE])
    monkeypatch.setattr(sources, "fetch_earthquakes", lambda *a, **k: [QUAKE])
    refresh_once(cache, settings)

    def down(*a, **k):
        raise sources.SourceError("USGS down")
    monkeypatch.setattr(sources, "fetch_earthquakes", down)
    monkeypatch.setattr(sources, "fetch_fires", lambda *a, **k: [FIRE, FIRE])
    status = refresh_once(cache, settings)

    assert status[KEY_QUAKES].startswith("failed")
    assert json.loads(cache.get(KEY_QUAKES))["data"] == [QUAKE]          # old data kept
    assert json.loads(cache.get(KEY_FIRES))["count"] == 2                 # other source still updated


def test_lock_prevents_duplicate_refresh(cache, settings):
    cache.set(KEY_LOCK, "someone-else", ex=60)
    assert refresh_once(cache, settings) == {"lock": "busy"}


def test_lock_released_after_refresh(cache, settings, monkeypatch):
    monkeypatch.setattr(sources, "fetch_fires", lambda *a, **k: [])
    monkeypatch.setattr(sources, "fetch_earthquakes", lambda *a, **k: [])
    refresh_once(cache, settings)
    assert cache.get(KEY_LOCK) is None


def test_unavailable_when_nothing_cached(cache, settings, monkeypatch):
    def down(*a, **k):
        raise sources.SourceError("down")
    monkeypatch.setattr(sources, "fetch_fires", down)
    monkeypatch.setattr(sources, "fetch_earthquakes", down)
    res = create_app(cache=cache, settings=settings).test_client().get("/api/hazards/fires")
    assert res.status_code == 503


def test_route_rejects_unknown_profile(client):
    assert client.post("/api/route/walking", json={}).status_code == 400


def test_route_requires_key(client):
    res = client.post("/api/route/driving-car", json={"coordinates": [[0, 0], [1, 1]]})
    assert res.status_code == 503



def test_parse_firms_csv_filters_by_area_and_confidence():
    csv_text = (
        "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight\n"
        "50.0,-120.0,330.1,0.4,0.4,2026-10-29,0930,N,VIIRS,h,2.0NRT,290.0,15.2,D\n"   # kept
        "50.0,-120.0,330.1,0.4,0.4,2026-10-29,0930,N,VIIRS,l,2.0NRT,290.0,15.2,D\n"   # low confidence
        "10.0,-120.0,330.1,0.4,0.4,2026-10-29,0930,N,VIIRS,n,2.0NRT,290.0,15.2,D\n"   # outside Canada
    )
    fires = sources.parse_firms_csv(csv_text)
    assert len(fires) == 1
    assert fires[0]["properties"]["fp"] == 15.2


def test_normalize_quakes_skips_missing_magnitude():
    geo = {"features": [
        {"id": "a", "geometry": {"coordinates": [-123, 49, 10]}, "properties": {"mag": 2.5, "time": 5}},
        {"id": "b", "geometry": {"coordinates": [-123, 49, 10]}, "properties": {"mag": None}},
    ]}
    quakes = sources.normalize_quakes(geo)
    assert [q["properties"]["id"] for q in quakes] == ["a"]
