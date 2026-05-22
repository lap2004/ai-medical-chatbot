import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from loguru import logger

class RequestLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        try:
            response: Response = await call_next(request)
            status = response.status_code
        except Exception as exc:
            status = 500
            logger.exception("Unhandled error while processing request")
            raise exc
        finally:
            dur_ms = (time.perf_counter() - start) * 1000.0
            logger.info(f"{request.method} {request.url.path} -> {status} ({dur_ms:.1f} ms)")
        return response
