"""Database query logging utilities."""

import logging
import time
from typing import Any, Dict, List, Optional
from sqlalchemy import event, Engine
from sqlalchemy.engine import Engine as SQLAlchemyEngine
from sqlalchemy.pool import Pool
from sqlalchemy.orm import Session

from core.utils.logging_config import get_logger

logger = get_logger(__name__)


class DatabaseLogger:
    """Database query logger with performance tracking."""
    
    def __init__(self):
        self.query_count = 0
        self.total_time = 0.0
        self.slow_queries = []
    
    def log_query(self, statement: str, parameters: Optional[Dict] = None, 
                  duration: Optional[float] = None, connection: Optional[Any] = None):
        """Log a database query with details."""
        self.query_count += 1
        
        if duration:
            self.total_time += duration
            
            # Log slow queries
            if duration > 1.0:  # Queries taking more than 1 second
                self.slow_queries.append({
                    'query': statement[:200] + "..." if len(statement) > 200 else statement,
                    'duration': duration,
                    'parameters': parameters
                })
                logger.warning(f"SLOW QUERY ({duration:.3f}s): {statement[:100]}...")
        
        # Log query details
        query_preview = statement[:100] + "..." if len(statement) > 100 else statement
        logger.debug(f"Query #{self.query_count}: {query_preview}")
        
        if parameters:
            logger.debug(f"Parameters: {parameters}")
        
        if duration:
            logger.debug(f"Duration: {duration:.3f}s")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get database query statistics."""
        return {
            'total_queries': self.query_count,
            'total_time': self.total_time,
            'average_time': self.total_time / self.query_count if self.query_count > 0 else 0,
            'slow_queries': len(self.slow_queries)
        }
    
    def log_stats(self):
        """Log database query statistics."""
        stats = self.get_stats()
        logger.info(
            f"DB Stats: {stats['total_queries']} queries, "
            f"{stats['total_time']:.3f}s total, "
            f"{stats['average_time']:.3f}s avg, "
            f"{stats['slow_queries']} slow"
        )


# Global database logger instance
db_logger = DatabaseLogger()


def setup_database_event_listeners(engine: Engine):
    """Set up SQLAlchemy event listeners for query logging."""
    from core.config.config import settings
    
    # Only set up if database logging is enabled
    if not settings.LOG_DATABASE_QUERIES:
        return
    
    @event.listens_for(engine, "before_cursor_execute")
    def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        """Log before query execution."""
        context._query_start_time = time.time()
        context._statement = statement
        context._parameters = parameters
    
    @event.listens_for(engine, "after_cursor_execute")
    def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        """Log after query execution."""
        if hasattr(context, '_query_start_time'):
            duration = time.time() - context._query_start_time
            db_logger.log_query(
                statement=statement,
                parameters=parameters,
                duration=duration,
                connection=conn
            )
    
    # Disabled connection logging for minimal output
    # @event.listens_for(engine, "connect")
    # def receive_connect(dbapi_connection, connection_record):
    #     """Log database connection."""
    #     logger.info("Database connection established")
    
    # @event.listens_for(engine, "checkout")
    # def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    #     """Log connection checkout from pool."""
    #     logger.debug("Connection checked out from pool")
    
    # @event.listens_for(engine, "checkin")
    # def receive_checkin(dbapi_connection, connection_record):
    #     """Log connection checkin to pool."""
    #     logger.debug("Connection checked in to pool")


class LoggingSession(Session):
    """Custom SQLAlchemy session with enhanced logging."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._operation_count = 0
    
    def execute(self, statement, params=None, *, execution_options=None, bind_arguments=None, _parent_execute_state=None, _add_event=None):
        """Override execute to add logging."""
        self._operation_count += 1
        logger.debug(f"Session operation #{self._operation_count}: {type(statement).__name__}")
        # Use the correct method signature for SQLAlchemy 2.0
        return super().execute(statement, params, execution_options=execution_options, bind_arguments=bind_arguments, _parent_execute_state=_parent_execute_state, _add_event=_add_event)
    
    def commit(self):
        """Override commit to add logging."""
        logger.debug("Committing transaction")
        result = super().commit()
        logger.info("Transaction committed successfully")
        return result
    
    def rollback(self):
        """Override rollback to add logging."""
        logger.warning("Rolling back transaction")
        result = super().rollback()
        logger.warning("Transaction rolled back")
        return result


def log_database_operation(operation: str, table: str, record_id: Optional[str] = None, 
                          details: Optional[Dict] = None):
    """Log a specific database operation."""
    message = f"{operation.upper()}: {table}"
    if record_id:
        message += f" (ID: {record_id})"
    if details:
        message += f" | Details: {details}"
    
    logger.info(message)


def log_database_error(operation: str, error: Exception, table: Optional[str] = None):
    """Log a database error."""
    message = f"DB Error in {operation}"
    if table:
        message += f" on {table}"
    message += f": {str(error)}"
    
    logger.error(message)
