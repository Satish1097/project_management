"""
Service-layer logging helper.

Usage in services:
    from apps.foundation.logging import get_service_logger
    logger = get_service_logger(__name__)
    logger.info("Created project %s", project_id)
"""
import logging


def get_service_logger(name):
    return logging.getLogger(f"apps.foundation.service.{name}")
