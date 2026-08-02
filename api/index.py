"""
Vercel serverless entry point.

Per `vercel.json`, every request is routed to this function, which exposes the Flask
WSGI app. Flask renders the pages from `templates/` and serves the assets from
`static/` (both bundled into the function via `includeFiles`) — identical to running
locally, byte-for-byte.
"""
import os
import sys

# Make the project root importable so `import ecommsyte` resolves inside the function.
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from ecommsyte import create_app  # noqa: E402

# Vercel's @vercel/python runtime serves this WSGI callable named `app`.
app = create_app()
