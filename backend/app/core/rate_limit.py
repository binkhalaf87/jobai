"""Rate limiting via slowapi (in-memory store, no Redis required).

slowapi >= 0.1.9 dropped the pkg_resources dependency that caused
Python 3.12-slim incompatibility.

Proxy-aware IP resolution
--------------------------
Behind Railway, Vercel, or any reverse-proxy that terminates TLS,
``request.client.host`` is always the proxy's IP, not the user's.
``get_real_ip`` reads the standard forwarding headers so each end-user
is rate-limited independently rather than all sharing the same bucket.

Uvicorn must be started with ``proxy_headers=True`` and
``forwarded_allow_ips="*"`` (see serve.py and .env.example) so that
Starlette populates the headers before slowapi reads them.
"""
from __future__ import annotations

from fastapi import Request
from slowapi import Limiter


def get_real_ip(request: Request) -> str:
    """Return the real client IP, respecting reverse-proxy forwarding headers.

    Resolution order:
    1. ``X-Forwarded-For`` — standard header set by Railway, Vercel, nginx, etc.
       The leftmost value is the original client; any right-hand entries are
       intermediate proxies and must not be trusted for rate-limiting.
    2. ``X-Real-IP`` — set by nginx / some PaaS providers as a single IP.
    3. ``request.client.host`` — direct TCP peer; fallback for local dev.
    """
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()

    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=get_real_ip, headers_enabled=True)
