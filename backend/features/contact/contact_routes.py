"""Contact router for handling contact form submissions."""

from fastapi import APIRouter, HTTPException
from features.contact.contact_models import ContactRequest, ContactResponse
from features.contact.contact_email_service import send_contact_email

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", response_model=ContactResponse)
def submit_contact_form(contact_data: ContactRequest):
    """
    Submit a contact form.
    
    Args:
        contact_data: The contact form data
        
    Returns:
        ContactResponse: Success response
        
    Raises:
        HTTPException: If there's an error processing the contact form
    """
    try:
        # Send the contact email
        send_contact_email(
            name=contact_data.name,
            email=contact_data.email,
            phone=contact_data.phone,
            message=contact_data.message
        )
        
        return ContactResponse(
            success=True,
            message="Mensaje enviado correctamente. Te responderemos pronto."
        )
        
    except Exception as e:
        # Log the error (you might want to add proper logging here)
        print(f"Error sending contact email: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Error al enviar el mensaje. Por favor, intentá nuevamente."
        )
