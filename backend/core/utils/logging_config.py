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
            record.levelname = 'WARN'
        elif record.levelname == 'ERROR':
            record.levelname = 'ERROR'
        elif record.levelname == 'CRITICAL':
            record.levelname = 'CRITICAL'
        
        return super().format(record)


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
            'WARNING': 'yellow',
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


# Database logging configuration
def setup_database_logging():
    """Set up database query logging."""
    # Enable SQLAlchemy logging
    db_logger = logging.getLogger('sqlalchemy.engine')
    db_logger.setLevel(logging.INFO)
    
    # Create database-specific handler
    db_handler = logging.StreamHandler(sys.stdout)
    db_handler.setLevel(logging.INFO)
    
    # Database-specific formatter
    db_formatter = ColoredFormatter(
        fmt='%(log_color)s%(asctime)s | DB | %(message)s%(reset)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        log_colors={
            'DEBUG': 'blue',
            'INFO': 'blue',
            'WARNING': 'yellow',
            'ERROR': 'red',
            'CRITICAL': 'red,bg_white',
        },
        secondary_log_colors={},
        style='%'
    )
    
    db_handler.setFormatter(db_formatter)
    db_logger.addHandler(db_handler)
    db_logger.propagate = False


# HTTP request logging configuration
def setup_http_logging():
    """Set up HTTP request logging."""
    # Enable uvicorn access logging
    access_logger = logging.getLogger('uvicorn.access')
    access_logger.setLevel(logging.INFO)
    
    # Create HTTP-specific handler
    http_handler = logging.StreamHandler(sys.stdout)
    http_handler.setLevel(logging.INFO)
    
    # HTTP-specific formatter
    http_formatter = ColoredFormatter(
        fmt='%(log_color)s%(asctime)s | HTTP | %(message)s%(reset)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        log_colors={
            'DEBUG': 'magenta',
            'INFO': 'magenta',
            'WARNING': 'yellow',
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
