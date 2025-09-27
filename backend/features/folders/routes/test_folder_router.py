"""Simple test router for folder functionality without authentication."""

from fastapi import APIRouter
from typing import List

router = APIRouter()

@router.get("/test-folders/")
async def get_test_folders():
    """Get test folders for demonstration purposes."""
    return [
        {
            "id": "test-1",
            "name": "Normas Favoritas",
            "description": "Normas que consulto frecuentemente",
            "level": 0,
            "color": "#3B82F6",
            "icon": "folder",
            "order_index": 0,
            "norma_count": 5,
            "subfolders": [
                {
                    "id": "test-1-1",
                    "name": "Laboral",
                    "description": "Normas de derecho laboral",
                    "level": 1,
                    "color": "#EF4444",
                    "icon": "briefcase",
                    "order_index": 0,
                    "norma_count": 3,
                    "subfolders": []
                },
                {
                    "id": "test-1-2", 
                    "name": "Fiscal",
                    "description": "Normas tributarias",
                    "level": 1,
                    "color": "#10B981",
                    "icon": "calculator",
                    "order_index": 1,
                    "norma_count": 2,
                    "subfolders": []
                }
            ]
        },
        {
            "id": "test-2",
            "name": "Por Leer",
            "description": "Normas pendientes de revisión",
            "level": 0,
            "color": "#F59E0B",
            "icon": "book-open",
            "order_index": 1,
            "norma_count": 8,
            "subfolders": []
        }
    ]
