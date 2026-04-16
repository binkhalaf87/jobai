"""Rate limiting placeholder.

SlowAPI was removed due to pkg_resources incompatibility with Python 3.12-slim.
Rate limiting will be re-implemented via middleware when a compatible solution is identified.

This module is kept so existing imports do not break — all decorators are no-ops.
"""
from __future__ import annotations

from collections.abc import Callable
from typing import Any


class _NoOpLimiter:
    """Drop-in replacement that makes @limiter.limit(...) a no-op decorator."""

    def limit(self, limit_string: str, *args: Any, **kwargs: Any) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
        def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
            return func
        return decorator


limiter = _NoOpLimiter()
