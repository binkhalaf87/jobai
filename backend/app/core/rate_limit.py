"""Rate limiting via slowapi (in-memory store, no Redis required).

slowapi >= 0.1.9 dropped the pkg_resources dependency that caused
Python 3.12-slim incompatibility.

Production note: get_remote_address reads request.client.host. Behind a
reverse proxy (Railway, Vercel), ensure FORWARDED_ALLOW_IPS is set or
configure slowapi to read X-Forwarded-For.
"""
from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, headers_enabled=True)
