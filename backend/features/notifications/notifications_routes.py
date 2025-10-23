"""Notifications endpoints."""

from fastapi import APIRouter, HTTPException, Request, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from datetime import datetime

from core.database.base import get_db
from core.utils.jwt_utils import verify_token
from .notifications_models import Notification
from .notifications_schemas import (
    NotificationsListResponse,
    MarkReadResponse,
    NotificationResponse,
    DeleteResponse,
    BulkDeleteRequest
)

router = APIRouter()


def get_current_user_id(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header.split(" ")[1]
    payload = verify_token(token, "access")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id


@router.get("/notifications/", response_model=NotificationsListResponse)
async def list_notifications(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    notification_type: Optional[str] = Query(None),
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Get paginated notifications for current user."""
    user_uuid = UUID(user_id)
    
    # Build base query for counting
    base_query = db.query(Notification).filter(Notification.user_id == user_uuid)
    if notification_type:
        base_query = base_query.filter(Notification.type == notification_type)
    
    # Always get unread count from base query
    unread_count = base_query.filter(~Notification.is_read).count()
    
    # Build query for pagination
    query = base_query
    if unread_only:
        query = query.filter(~Notification.is_read)
    
    # Get total count (from filtered query if unread_only, else all)
    total_count = query.count()
    
    # Get paginated results
    notifications = (
        query.order_by(Notification.created_at.desc())
        .limit(page_size)
        .offset((page - 1) * page_size)
        .all()
    )
    
    # Convert to response
    notification_responses = [
        NotificationResponse(
            id=str(n.id),
            title=n.title,
            body=n.body,
            type=n.type,
            link=n.link,
            metadata=n.metadata_,
            is_read=n.is_read,
            created_at=n.created_at,
            read_at=n.read_at
        )
        for n in notifications
    ]
    
    return NotificationsListResponse(
        notifications=notification_responses,
        total_count=total_count,
        unread_count=unread_count,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total_count
    )


@router.post("/notifications/{notification_id}/mark-read", response_model=MarkReadResponse)
async def mark_notification_read(
    notification_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Mark a notification as read."""
    notification = db.query(Notification).filter(
        Notification.id == UUID(notification_id),
        Notification.user_id == UUID(user_id)
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.commit()
    
    return MarkReadResponse(success=True, message="Notification marked as read")


@router.post("/notifications/mark-all-read", response_model=MarkReadResponse)
async def mark_all_notifications_read(
    request: Request,
    notification_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Mark all notifications as read."""
    query = db.query(Notification).filter(
        Notification.user_id == UUID(user_id),
        ~Notification.is_read
    )
    
    if notification_type:
        query = query.filter(Notification.type == notification_type)
    
    count = query.update(
        {"is_read": True, "read_at": datetime.utcnow()},
        synchronize_session=False
    )
    db.commit()
    
    return MarkReadResponse(success=True, message=f"Marked {count} notification(s) as read")


@router.delete("/notifications/{notification_id}", response_model=DeleteResponse)
async def delete_notification(
    notification_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Delete a single notification."""
    notification = db.query(Notification).filter(
        Notification.id == UUID(notification_id),
        Notification.user_id == UUID(user_id)
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(notification)
    db.commit()
    
    return DeleteResponse(
        success=True,
        message="Notification deleted successfully",
        deleted_count=1
    )


@router.post("/notifications/bulk-delete", response_model=DeleteResponse)
async def bulk_delete_notifications(
    request_body: BulkDeleteRequest,
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Delete multiple notifications."""
    user_uuid = UUID(user_id)
    notification_uuids = [UUID(nid) for nid in request_body.notification_ids]
    
    # Delete notifications that belong to the user
    count = db.query(Notification).filter(
        Notification.id.in_(notification_uuids),
        Notification.user_id == user_uuid
    ).delete(synchronize_session=False)
    
    db.commit()
    
    return DeleteResponse(
        success=True,
        message=f"Deleted {count} notification(s)",
        deleted_count=count
    )
