"""HTTP request logging middleware with detailed request/response information."""

import time
import json
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from core.utils.logging_config import get_logger

logger = get_logger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging HTTP requests and responses with detailed information."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.logger = get_logger("http")
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and log detailed information."""
        start_time = time.time()
        
        # Extract request information
        method = request.method
        url = str(request.url)
        path = request.url.path
        query_params = dict(request.query_params)
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "Unknown")
        
        # Get request body for POST/PUT/PATCH requests
        request_body = None
        if method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                if body:
                    # Try to parse as JSON, fallback to string
                    try:
                        request_body = json.loads(body.decode())
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        request_body = body.decode()[:500]  # Limit size
            except Exception as e:
                request_body = f"Error reading body: {str(e)}"
        
        # Log incoming request
        self.logger.info(
            f"REQUEST {method} {path} | "
            f"IP: {client_ip} | "
            f"User-Agent: {user_agent[:50]}... | "
            f"Query: {query_params if query_params else 'None'}"
        )
        
        if request_body:
            self.logger.debug(f"Request Body: {request_body}")
        
        # Process request
        try:
            response = await call_next(request)
        except Exception as e:
            # Log error
            process_time = time.time() - start_time
            self.logger.error(
                f"ERROR {method} {path} | "
                f"Error: {str(e)} | "
                f"Time: {process_time:.3f}s"
            )
            raise
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Extract response information
        status_code = response.status_code
        response_size = response.headers.get("content-length", "Unknown")
        
        # Determine log level based on status code
        if status_code >= 500:
            log_level = "error"
        elif status_code >= 400:
            log_level = "warning"
        else:
            log_level = "info"
        
        # Log response
        log_message = (
            f"RESPONSE {method} {path} | "
            f"Status: {status_code} | "
            f"Time: {process_time:.3f}s | "
            f"Size: {response_size}"
        )
        
        if log_level == "error":
            self.logger.error(log_message)
        elif log_level == "warning":
            self.logger.warning(log_message)
        else:
            self.logger.info(log_message)
        
        # Log slow requests
        if process_time > 2.0:
            self.logger.warning(f"SLOW REQUEST: {method} {path} took {process_time:.3f}s")
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request."""
        # Check for forwarded headers first
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection
        if hasattr(request.client, "host"):
            return request.client.host
        
        return "Unknown"
    
