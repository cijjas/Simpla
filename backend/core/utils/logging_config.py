"""Logging configuration with colors and structured output."""

import logging
import sys
from typing import Optional
import colorlog
from core.config.config import settings


class ColoredFormatter(colorlog.ColoredFormatter):
    """Custom colored formatter with enhanced formatting."""
    
    def format(self, record):
        # Add custom formatting for different log levels
        if record.levelname == 'DEBUG':
            record.levelname = 'DEBUG'
        elif record.levelname == 'INFO':
            record.levelname = 'INFO'
        elif record.levelname == 'WARNING':
            record.levelname = 'WARNING'  # Keep as WARNING for color mapping
        elif record.levelname == 'ERROR':
            record.levelname = 'ERROR'
        elif record.levelname == 'CRITICAL':
            record.levelname = 'CRITICAL'
        
        # Format the metadata part with colors
        formatted = super().format(record)
        
        # Split the formatted string to separate colored metadata from white content
        # The format is: timestamp | level | name | message
        parts = formatted.split(' | ', 3)
        if len(parts) >= 4:
            # Color the timestamp, level, and module name (first 3 parts)
            colored_metadata = ' | '.join(parts[:3]) + ' | '
            # Only the message should be white
            white_message = parts[3]
            # Remove any existing color codes from the message
            import re
            white_message = re.sub(r'\x1b\[[0-9;]*m', '', white_message)
            # Return colored metadata + white message
            return colored_metadata + '\x1b[37m' + white_message + '\x1b[0m'
        
        return formatted


class SQLFilter(logging.Filter):
    """Filter to show only meaningful SQL queries."""
    
    def filter(self, record):
        # Only show SQL queries that are actual business logic queries
        message = record.getMessage()
        
        # Filter out connection setup queries
        if any(skip in message.lower() for skip in [
            'select pg_catalog.version()',
            'select current_schema()',
            'show standard_conforming_strings',
            'begin (implicit)',
            'rollback',
            'commit',
            '[raw sql]',
            '[generated in',
            '[cached since'
        ]):
            return False
        
        # Only show SELECT queries that look like business logic
        if message.strip().upper().startswith('SELECT') and any(table in message for table in [
            'normas_structured',
            'divisions', 
            'articles',
            'users',
            'folders',
            'folder_normas'
        ]):
            return True
            
        return False


def setup_logging(log_level: Optional[str] = None) -> logging.Logger:
    """
    Set up colored logging configuration.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        
    Returns:
        Configured logger instance
    """
    # Use provided level or default from settings
    level = log_level or getattr(settings, 'LOG_LEVEL', 'INFO')
    
    # Create logger
    logger = logging.getLogger('simpla')
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    
    # Remove existing handlers to avoid duplicates
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Create console handler with colored formatter
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, level.upper(), logging.INFO))
    
    # Define color scheme
    color_formatter = ColoredFormatter(
        fmt='%(log_color)s%(asctime)s | %(levelname)s | %(name)s | %(message)s%(reset)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        log_colors={
            'DEBUG': 'cyan',
            'INFO': 'green',
            'WARNING': 'orange',
            'ERROR': 'red',
            'CRITICAL': 'red,bg_white',
        },
        secondary_log_colors={},
        style='%'
    )
    
    console_handler.setFormatter(color_formatter)
    logger.addHandler(console_handler)
    
    # Prevent propagation to root logger
    logger.propagate = False
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a specific module.
    
    Args:
        name: Logger name (usually __name__)
        
    Returns:
        Logger instance
    """
    return logging.getLogger(f'simpla.{name}')


# Database logging configuration (MINIMAL - only main queries)
def setup_database_logging():
    """Set up minimal database query logging - only main SQL queries."""
    from core.config.config import settings
    
    # Only set up if database logging is enabled
    if not settings.LOG_DATABASE_QUERIES:
        return
    
    # Enable only SQLAlchemy engine logging for main queries
    db_logger = logging.getLogger('sqlalchemy.engine.Engine')
    db_logger.setLevel(logging.INFO)
    
    # Remove existing handlers to avoid duplicates
    for handler in db_logger.handlers[:]:
        db_logger.removeHandler(handler)
    
    # Create database-specific handler
    db_handler = logging.StreamHandler(sys.stdout)
    db_handler.setLevel(logging.INFO)
    
    # Add SQL filter to only show meaningful queries
    sql_filter = SQLFilter()
    db_handler.addFilter(sql_filter)
    
    # Database-specific formatter
    db_formatter = ColoredFormatter(
        fmt='%(log_color)s%(asctime)s | DB | %(name)s | %(message)s%(reset)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        log_colors={
            'DEBUG': 'blue',
            'INFO': 'blue',
            'WARNING': 'orange',
            'ERROR': 'red',
            'CRITICAL': 'red,bg_white',
        },
        secondary_log_colors={},
        style='%'
    )
    
    db_handler.setFormatter(db_formatter)
    db_logger.addHandler(db_handler)
    db_logger.propagate = False
    
    # Disable all other SQLAlchemy loggers to avoid noise
    noisy_loggers = [
        'sqlalchemy.orm.mapper',
        'sqlalchemy.orm.relationships', 
        'sqlalchemy.orm.strategies',
        'sqlalchemy.orm',
        'sqlalchemy.pool',
        'sqlalchemy.dialects',
        'sqlalchemy.engine'  # This one logs connection details
    ]
    
    for logger_name in noisy_loggers:
        noisy_logger = logging.getLogger(logger_name)
        noisy_logger.setLevel(logging.WARNING)


# HTTP request logging configuration
def setup_http_logging():
    """Set up HTTP request logging."""
    from core.config.config import settings
    
    # Only set up if HTTP logging is enabled
    if not settings.LOG_HTTP_REQUESTS:
        return
    
    # Enable uvicorn access logging
    access_logger = logging.getLogger('uvicorn.access')
    access_logger.setLevel(logging.INFO)
    
    # Remove existing handlers to avoid duplicates
    for handler in access_logger.handlers[:]:
        access_logger.removeHandler(handler)
    
    # Create HTTP-specific handler
    http_handler = logging.StreamHandler(sys.stdout)
    http_handler.setLevel(logging.INFO)
    
    # HTTP-specific formatter
    http_formatter = ColoredFormatter(
        fmt='%(log_color)s%(asctime)s | HTTP | %(name)s | %(message)s%(reset)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        log_colors={
            'DEBUG': 'blue',
            'INFO': 'blue',
            'WARNING': 'orange',
            'ERROR': 'red',
            'CRITICAL': 'red,bg_white',
        },
        secondary_log_colors={},
        style='%'
    )
    
    http_handler.setFormatter(http_formatter)
    access_logger.addHandler(http_handler)
    access_logger.propagate = False


# Initialize logging on import
main_logger = setup_logging()
setup_database_logging()
setup_http_logging()
