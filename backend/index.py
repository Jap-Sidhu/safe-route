"""Serverless entry point (Vercel's "api" service).

Exposes a module-level Flask app. Gunicorn and `python app.py` keep using the
create_app() factory in app.py directly.
"""

from app import create_app

app = create_app()
