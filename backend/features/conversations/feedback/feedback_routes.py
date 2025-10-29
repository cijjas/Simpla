"""FastAPI router for message feedback endpoints."""

from typing import Dict
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session

from core.database.base import get_db
from features.auth.auth_utils import get_current_user_id
from .feedback_service import FeedbackService
from .feedback_schemas import (
    FeedbackCreate,
    FeedbackUpdate,
    FeedbackResponse,
    FeedbackDelete,
    FeedbackType
)
from core.utils.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/conversations/feedback", tags=["feedback"])


# Authentication dependency now centralized in auth_utils


@router.post("/", response_model=FeedbackResponse, status_code=201)
async def create_or_update_feedback(
    request: Request,
    data: FeedbackCreate,
    db: Session = Depends(get_db),
):
    """
    Create or update feedback for a message.
    
    If the user has already provided feedback for this message, it will be updated.
    Otherwise, new feedback will be created.
    """
    try:
        user_id = get_current_user_id(request)
        
        service = FeedbackService(db)
        feedback = service.create_or_update_feedback(
            message_id=str(data.message_id),
            user_id=user_id,
            feedback_type=data.feedback_type
        )
        
        return FeedbackResponse.model_validate(feedback)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating/updating feedback: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{message_id}", response_model=FeedbackResponse)
async def get_feedback(
    request: Request,
    message_id: str,
    db: Session = Depends(get_db),
):
    """
    Get feedback for a specific message by the current user.
    
    Returns 404 if no feedback exists for this message.
    """
    try:
        user_id = get_current_user_id(request)
        
        service = FeedbackService(db)
        feedback = service.get_feedback(message_id, user_id)
        
        if not feedback:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        return FeedbackResponse.model_validate(feedback)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting feedback: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/batch", response_model=Dict[str, FeedbackType])
async def get_feedbacks_batch(
    request: Request,
    message_ids: list[str] = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    """
    Get feedbacks for multiple messages by the current user.
    
    Returns a dictionary mapping message_id to feedback_type.
    Only includes messages that have feedback.
    """
    try:
        user_id = get_current_user_id(request)
        
        service = FeedbackService(db)
        feedbacks = service.get_feedbacks_for_messages(message_ids, user_id)
        
        return feedbacks
        
    except Exception as e:
        logger.error(f"Error getting feedbacks batch: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{message_id}", response_model=FeedbackDelete)
async def delete_feedback(
    request: Request,
    message_id: str,
    db: Session = Depends(get_db),
):
    """
    Delete feedback for a message.
    
    Removes the user's feedback (like/dislike) for the specified message.
    Returns 404 if no feedback exists.
    """
    try:
        user_id = get_current_user_id(request)
        
        service = FeedbackService(db)
        success = service.delete_feedback(message_id, user_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        return FeedbackDelete()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting feedback: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")



