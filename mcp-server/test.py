import asyncio
from fastmcp import Client

API_URL = "http://localhost:8765/mcp"  
JWT = "<JWT_TOKEN>"

async def main():
    try:
        # open a connection context to MCP server
        async with Client(API_URL) as client:
            # --- test token ---
            token_info = await client.call_tool("get_token_info", {"token": JWT})
            print("token_info:", token_info)

            # --- test legal question ---
            payload = {
                "query": "¿Qué conoces sobre el codigo alimentario?",
                "token": JWT,
                "chat_type": "normativa_nacional",
                "tone": "default"
            }
            result = await client.call_tool("ask_legal_question", payload)
            print("ask_legal_question result:", result)

    except Exception as exc:
        print("Error calling MCP tool:", exc)

if __name__ == "__main__":
    asyncio.run(main())