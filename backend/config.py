"""Runtime settings, read once from environment variables."""

import os
from dataclasses import dataclass, field


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    firms_map_key: str = field(default_factory=lambda: os.getenv("FIRMS_MAP_KEY", ""))
    ors_api_key: str = field(default_factory=lambda: os.getenv("ORS_API_KEY", ""))

    # How often the background worker refreshes hazard data, and how long cached data lives.
    refresh_interval: int = field(default_factory=lambda: _int("REFRESH_INTERVAL_SECONDS", 600))
    cache_ttl: int = field(default_factory=lambda: _int("CACHE_TTL_SECONDS", 1800))
    lock_ttl: int = field(default_factory=lambda: _int("REFRESH_LOCK_SECONDS", 120))

    # NASA FIRMS: days of detections to pull (1-10) and minimum fire radiative power (MW).
    firms_days: int = field(default_factory=lambda: _int("FIRMS_DAYS", 2))
    firms_min_frp: float = field(default_factory=lambda: float(os.getenv("FIRMS_MIN_FRP", "0")))
    # USGS: days of earthquakes to pull.
    usgs_days: int = field(default_factory=lambda: _int("USGS_DAYS", 30))

    run_worker: bool = field(default_factory=lambda: os.getenv("RUN_REFRESH_WORKER", "1") != "0")


# Coverage area: Canada for fires, North America (north of 24°N) for earthquakes.
FIRE_BBOX = (-141.0, 42.0, -52.0, 83.0)            # west, south, east, north
QUAKE_BBOX = (-180.0, 24.0, -52.0, 83.0)

FIRMS_SOURCES = ("VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT")

KEY_FIRES = "hazards:fires"
KEY_QUAKES = "hazards:earthquakes"
KEY_LOCK = "hazards:refresh:lock"
