"""Notifications endpoints for user in-app notifications."""

from fastapi import APIRouter, HTTPException, Request, status, Depends
from typing import List
import json
from core.utils.logging_config import get_logger
from core.database.base import engine
import psycopg2
from psycopg2.extras import RealDictCursor
from core.utils.jwt_utils import verify_token

router = APIRouter()
logger = get_logger(__name__)


# Authentication dependency (simple, token->user_id)
def get_current_user_id(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header.split(" ")[1]
    payload = verify_token(token, "access")
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id


@router.get("/notifications/")
async def list_notifications(request: Request, user_id: str = Depends(get_current_user_id)):
    """Return recent notifications for the current user."""
    try:
        with engine.connect() as conn:
            cur = conn.connection.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                "SELECT id, title, body, type, link, metadata, is_read, created_at, read_at FROM notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 100",
                (user_id,)
            )
            rows = cur.fetchall()
            # Convert metadata to dict
            for r in rows:
                if isinstance(r.get('metadata'), str):
                    try:
                        r['metadata'] = json.loads(r['metadata'])
                    except Exception:
                        r['metadata'] = {}
            return rows
    except Exception as e:
        logger.error("Error fetching notifications for user %s: %s", user_id, str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/notifications/{notification_id}/mark-read")
async def mark_notification_read(notification_id: str, request: Request, user_id: str = Depends(get_current_user_id)):
    """Mark a notification as read for the current user."""
    try:
        with engine.connect() as conn:
            cur = conn.connection.cursor()
            cur.execute(
                "UPDATE notifications SET is_read = true, read_at = now() WHERE id = %s AND user_id = %s",
                (notification_id, user_id),
            )
            conn.connection.commit()
            return {"success": True}
    except Exception as e:
        logger.error("Error marking notification read %s for user %s: %s", notification_id, user_id, str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
