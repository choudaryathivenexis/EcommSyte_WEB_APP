"""Development server.

    python run.py                 # http://127.0.0.1:5000 (debug on)
    PORT=8000 python run.py

For production use a real WSGI server instead — see wsgi.py / Procfile.
"""
from __future__ import annotations

import os

from ecommsyte import create_app
from ecommsyte.config import DevelopmentConfig

app = create_app(DevelopmentConfig)

if __name__ == "__main__":
    app.run(
        host=os.environ.get("HOST", "127.0.0.1"),
        port=int(os.environ.get("PORT", "5000")),
        debug=True,
    )
