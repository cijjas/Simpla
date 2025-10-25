"""Service for message feedback operations."""

from typing import Optional, Dict
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from .feedback_models import MessageFeedback
from .feedback_schemas import FeedbackType
from core.utils.logging_config import get_logger

logger = get_logger(__name__)


class FeedbackService:
    """Service for handling message feedback operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_feedback(self, message_id: str, user_id: str) -> Optional[MessageFeedback]:
        """Get feedback for a specific message by a user."""
        try:
            feedback = self.db.query(MessageFeedback).filter(
                MessageFeedback.message_id == message_id,
                MessageFeedback.user_id == user_id
            ).first()
            return feedback
        except Exception as e:
            logger.error(f"Error getting feedback: {str(e)}")
            return None
    
    def get_feedbacks_for_messages(self, message_ids: list[str], user_id: str) -> Dict[str, FeedbackType]:
        """Get feedbacks for multiple messages by a user.
        
        Returns a dictionary mapping message_id to feedback_type.
        """
        try:
            feedbacks = self.db.query(MessageFeedback).filter(
                MessageFeedback.message_id.in_(message_ids),
                MessageFeedback.user_id == user_id
            ).all()
            
            return {
                str(feedback.message_id): feedback.feedback_type
                for feedback in feedbacks
            }
        except Exception as e:
            logger.error(f"Error getting feedbacks for messages: {str(e)}")
            return {}
    
    def create_or_update_feedback(
        self, 
        message_id: str, 
        user_id: str, 
        feedback_type: FeedbackType
    ) -> MessageFeedback:
        """Create or update feedback for a message.
        
        If feedback already exists, update it. Otherwise, create new feedback.
        """
        try:
            # Check if feedback already exists
            existing_feedback = self.get_feedback(message_id, user_id)
            
            if existing_feedback:
                # Update existing feedback
                existing_feedback.feedback_type = feedback_type
                self.db.commit()
                self.db.refresh(existing_feedback)
                logger.info(f"Updated feedback for message {message_id} by user {user_id}")
                return existing_feedback
            else:
                # Create new feedback
                new_feedback = MessageFeedback(
                    message_id=message_id,
                    user_id=user_id,
                    feedback_type=feedback_type
                )
                self.db.add(new_feedback)
                self.db.commit()
                self.db.refresh(new_feedback)
                logger.info(f"Created feedback for message {message_id} by user {user_id}")
                return new_feedback
                
        except IntegrityError as e:
            self.db.rollback()
            logger.error(f"Integrity error creating feedback: {str(e)}")
            raise ValueError("Invalid message_id or user_id")
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating/updating feedback: {str(e)}")
            raise
    
    def delete_feedback(self, message_id: str, user_id: str) -> bool:
        """Delete feedback for a message.
        
        Returns True if feedback was deleted, False if it didn't exist.
        """
        try:
            feedback = self.get_feedback(message_id, user_id)
            
            if feedback:
                self.db.delete(feedback)
                self.db.commit()
                logger.info(f"Deleted feedback for message {message_id} by user {user_id}")
                return True
            
            return False
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting feedback: {str(e)}")
            raise



