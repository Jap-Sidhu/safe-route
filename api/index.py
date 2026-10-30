"""Vercel entry point: exposes the Flask app as a serverless function.

vercel.json rewrites every /api/* request here; the React app is served as static files.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app import create_app  # noqa: E402

app = create_app()
