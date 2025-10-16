from fastmcp import FastMCP
import requests
import os
import json
from typing import Optional, Dict, Any

# Configuration
API_BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000/api")
if not API_BASE_URL:
    raise ValueError("BACKEND_URL environment variable is required")

mcp = FastMCP(name="simpla-rag", version="1.0.0")

class AuthenticationError(Exception):
    """Raised when authentication fails."""
    pass

def validate_token(token: str) -> Dict[str, Any]:
    """
    Validate JWT token by making a request to the backend.
    Returns user info if valid, raises AuthenticationError if invalid.
    """
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # Use the auth/me endpoint to validate the token
        response = requests.get(
            f"{API_BASE_URL}/auth/me",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 401:
            raise AuthenticationError("Invalid or expired token")
        else:
            raise AuthenticationError(f"Authentication failed with status {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        raise AuthenticationError(f"Failed to validate token: {str(e)}")

@mcp.tool(
    "ask_legal_question", 
    description="Query Argentine legislation via Simpla's RAG system. Requires valid JWT token from Simpla account."
)
def ask_legal_question(
    query: str, 
    token: str,
    chat_type: str = "normativa_nacional",
    tone: str = "default",
    session_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sends a legal query to Simpla's backend and retrieves the AI response.
    
    Args:
        query: The legal question to ask
        token: JWT token from your Simpla account (get from web app)
        chat_type: Type of chat - "normativa_nacional" or "constituciones" (default: "normativa_nacional")
        tone: Response tone - "default", "formal", "academico", or "conciso" (default: "default")
        session_id: Optional conversation ID to continue existing conversation
    
    Returns:
        Dict containing the AI response and metadata
    """
    # Validate inputs
    if not query.strip():
        return {"error": "Query cannot be empty"}
    
    if not token.strip():
        return {"error": "JWT token is required. Get your token from the Simpla web app."}
    
    # Validate chat_type
    valid_chat_types = ["normativa_nacional", "constituciones"]
    if chat_type not in valid_chat_types:
        return {"error": f"Invalid chat_type. Must be one of: {', '.join(valid_chat_types)}"}
    
    # Validate tone
    valid_tones = ["default", "formal", "academico", "conciso"]
    if tone not in valid_tones:
        return {"error": f"Invalid tone. Must be one of: {', '.join(valid_tones)}"}
    
    try:
        # Validate authentication
        user_info = validate_token(token)
        
        # Prepare request headers and data
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "content": query.strip(),
            "chat_type": chat_type,
            "tone": tone
        }
        
        # Add session_id if provided
        if session_id:
            payload["session_id"] = session_id
        
        # Send request to backend
        response = requests.post(
            f"{API_BASE_URL}/conversations/message",
            json=payload,
            headers=headers,
            timeout=60,  # Longer timeout for AI responses
            stream=True  # Handle streaming response
        )
        
        if response.status_code != 200:
            error_detail = "Unknown error"
            try:
                error_data = response.json()
                error_detail = error_data.get("detail", response.text)
            except:
                error_detail = response.text
            
            return {
                "error": f"Backend error: {response.status_code}",
                "details": error_detail
            }
        
        # Handle streaming response
        full_response = ""
        session_id_from_response = None
        
        for line in response.iter_lines(decode_unicode=True):
            if line.startswith("data: "):
                data_str = line[6:]  # Remove "data: " prefix
                if data_str.strip() == "[DONE]":
                    break
                
                try:
                    data = json.loads(data_str)
                    if "content" in data:
                        full_response += data["content"]
                    if "session_id" in data:
                        session_id_from_response = data["session_id"]
                except json.JSONDecodeError:
                    continue
        
        return {
            "success": True,
            "response": full_response,
            "session_id": session_id_from_response,
            "user": user_info.get("name", "Unknown"),
            "chat_type": chat_type,
            "tone": tone,
            "query": query
        }
        
    except AuthenticationError as e:
        return {"error": f"Authentication failed: {str(e)}"}
    except requests.exceptions.Timeout:
        return {"error": "Request timed out. The AI response took too long."}
    except requests.exceptions.RequestException as e:
        return {"error": f"Network error: {str(e)}"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}

@mcp.tool(
    "get_token_info",
    description="Get information about your current JWT token and user account"
)
def get_token_info(token: str) -> Dict[str, Any]:
    """
    Validate and get information about the provided JWT token.
    
    Args:
        token: JWT token from your Simpla account
    
    Returns:
        Dict containing user information if token is valid
    """
    if not token.strip():
        return {"error": "JWT token is required"}
    
    try:
        user_info = validate_token(token)
        return {
            "success": True,
            "user": user_info,
            "message": "Token is valid"
        }
    except AuthenticationError as e:
        return {"error": f"Authentication failed: {str(e)}"}

if __name__ == "__main__":
    # Uncomment this next line if running mcp-client locally (test.py)
    # mcp.run(transport="http", host="localhost", port=8764)
    mcp.run(transport="stdio")