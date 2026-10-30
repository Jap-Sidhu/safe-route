"""SafeRoute API: cached hazard data plus a server-side routing proxy."""

import logging
import os
from pathlib import Path

import requests
from dotenv import load_dotenv
from flask import Flask, abort, jsonify, request, send_from_directory

load_dotenv()

from cache import get_json, make_cache  # noqa: E402
from config import KEY_FIRES, KEY_QUAKES, Settings  # noqa: E402
from refresher import refresh_once, start_worker  # noqa: E402

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(name)s: %(message)s")

ORS_URL = "https://api.openrouteservice.org/v2/directions/{profile}/geojson"
ORS_PROFILES = {"driving-car", "driving-hgv"}
DIST_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"


def create_app(cache=None, settings: Settings | None = None) -> Flask:
    settings = settings or Settings()
    cache = cache if cache is not None else make_cache(settings.redis_url)

    app = Flask(__name__, static_folder=None)
    app.config["CACHE"] = cache
    app.config["SETTINGS"] = settings

    if settings.run_worker:
        start_worker(cache, settings)

    def hazard_response(key: str):
        raw = cache.get(key)
        if raw is None:
            # Cold start: nothing cached yet, so refresh this dataset inline once.
            refresh_once(cache, settings, only=key)
            raw = cache.get(key)
        if raw is None:
            return jsonify(error="Hazard data is temporarily unavailable. Try again in a minute."), 503
        # The cache already holds serialized JSON, so send it as-is instead of decoding and re-encoding.
        res = app.response_class(raw, mimetype="application/json")
        res.headers["Cache-Control"] = "public, max-age=60"
        return res

    @app.get("/api/health")
    def health():
        datasets = {}
        for key in (KEY_FIRES, KEY_QUAKES):
            payload = get_json(cache, key)
            datasets[key] = {"updated_at": payload["updated_at"], "count": payload["count"]} if payload else None
        return jsonify(status="ok", cache=cache.name, cache_reachable=cache.ping(), datasets=datasets)

    @app.get("/api/hazards/fires")
    def fires():
        return hazard_response(KEY_FIRES)

    @app.get("/api/hazards/earthquakes")
    def earthquakes():
        return hazard_response(KEY_QUAKES)

    @app.post("/api/route/<profile>")
    def route(profile: str):
        if profile not in ORS_PROFILES:
            return jsonify(error=f"Unsupported profile. Use one of: {', '.join(sorted(ORS_PROFILES))}"), 400
        if not settings.ors_api_key:
            return jsonify(error="Routing is not configured (ORS_API_KEY missing)."), 503
        body = request.get_json(silent=True) or {}
        coords = body.get("coordinates")
        if not (isinstance(coords, list) and len(coords) == 2
                and all(isinstance(c, list) and len(c) == 2 for c in coords)):
            return jsonify(error="Body needs 'coordinates': [[lng, lat], [lng, lat]]."), 400

        # Forward only the options the frontend uses.
        allowed = {"coordinates", "radiuses", "instructions", "elevation", "extra_info"}
        try:
            upstream = requests.post(
                ORS_URL.format(profile=profile),
                json={k: v for k, v in body.items() if k in allowed},
                headers={"Authorization": settings.ors_api_key, "Accept": "application/geo+json"},
                timeout=20,
            )
        except requests.RequestException:
            return jsonify(error="Routing service is unreachable right now."), 502
        return app.response_class(upstream.content, status=upstream.status_code,
                                  mimetype=upstream.headers.get("Content-Type", "application/json"))

    # Serve the built React app from the same origin, so the frontend can call /api directly.
    @app.get("/", defaults={"path": ""})
    @app.get("/<path:path>")
    def frontend(path: str):
        if path.startswith("api/"):
            abort(404)
        if not DIST_DIR.exists():
            return jsonify(message="SafeRoute API is running. Build the frontend to serve it here."), 200
        if path and (DIST_DIR / path).is_file():
            return send_from_directory(DIST_DIR, path)
        return send_from_directory(DIST_DIR, "index.html")

    return app


if __name__ == "__main__":
    create_app().run(host="0.0.0.0", port=int(os.getenv("PORT", "5050")), debug=False)
