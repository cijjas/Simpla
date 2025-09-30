from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from features.feedback.feedback_email_service import send_feedback_email

router = APIRouter(prefix="/feedback", tags=["feedback"])

class FeedbackBody(BaseModel):
    message: str
    origin: str = 'webapp'

@router.post("")
def feedback(body: FeedbackBody):
    message = body.message.strip()
    if len(message) < 3:
        raise HTTPException(status_code=400, detail="Mensaje inválido")
    try:
        send_feedback_email(message, body.origin)
        return {"success": True}
    except Exception:
        raise HTTPException(status_code=500, detail="Error sending feedback")
