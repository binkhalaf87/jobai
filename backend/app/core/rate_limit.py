"""Central rate-limiter instance shared across all route modules.

Uses slowapi (a Starlette/FastAPI wrapper around limits/ratelimit).
The key function is the client IP address, so limits are per-IP.

Usage in a route module
-----------------------
    from app.core.rate_limit import limiter
    from fastapi import Request

    @router.post("/login")
    @limiter.limit("5/minute")
    def login(request: Request, ...):
        ...

The `request: Request` parameter is required by slowapi — FastAPI injects it
automatically; you do not need to pass it manually in tests or clients.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=[])
