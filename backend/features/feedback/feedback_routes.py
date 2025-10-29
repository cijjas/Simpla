from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from features.feedback.feedback_email_service import send_feedback_email
from features.auth.auth_utils import get_current_user
from features.auth.auth_models import User

router = APIRouter(prefix="/feedback", tags=["feedback"])


class FeedbackBody(BaseModel):
    message: str
    origin: str = 'webapp'


@router.post("")
def feedback(body: FeedbackBody, current_user: User = Depends(get_current_user)):
    message = body.message.strip()
    if len(message) < 3:
        raise HTTPException(status_code=400, detail="Mensaje inválido")
    try:
        send_feedback_email(
            message=message,
            origin=body.origin,
            user_email=current_user.email,
            user_id=str(current_user.id),
        )
        return {"success": True}
    except Exception:
        raise HTTPException(status_code=500, detail="Error sending feedback")
