"""Production WSGI entry point.

    gunicorn wsgi:app                       # Linux / macOS
    waitress-serve --port=8000 wsgi:app     # Windows
"""
from ecommsyte import create_app

app = create_app()

if __name__ == "__main__":
    app.run()
