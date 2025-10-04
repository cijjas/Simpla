"""Client for communicating with the vectorial microservice via gRPC."""

import grpc
from typing import List, Dict, Any, Optional
from core.proto import vectorial_pb2, vectorial_pb2_grpc


def search_vectors(
    embedding: List[float],
    filters: Optional[Dict[str, str]] = None,
    limit: int = 10,
    grpc_host: str = "localhost",
    grpc_port: int = 50052
) -> Dict[str, Any]:
    """
    Search for similar vectors in the vectorial microservice via gRPC.

    Args:
        embedding: The embedding vector to search with
        filters: Optional metadata filters
        limit: Maximum number of results to return (default: 10)
        grpc_host: The gRPC server host (default: localhost)
        grpc_port: The gRPC server port (default: 50052)

    Returns:
        dict with keys: success (bool), message (str), results (list)
    """
    channel = grpc.insecure_channel(f"{grpc_host}:{grpc_port}")
    stub = vectorial_pb2_grpc.VectorialServiceStub(channel)

    # Build the request
    request = vectorial_pb2.SearchRequest(
        embedding=embedding,
        limit=limit
    )

    # Add filters if provided
    if filters:
        for key, value in filters.items():
            request.filters[key] = value

    try:
        response = stub.Search(request)

        print(f"✓ Successfully performed vector search")
        print(f"Response message: {response.message}")
        print(f"Found {len(response.results)} results")

        # Convert results to dict format
        results = []
        for result in response.results:
            results.append({
                "document_id": result.document_id,
                "score": result.score,
                "metadata": dict(result.metadata)
            })
            print(f"  - Document: {result.document_id}, Score: {result.score}")

        return {
            "success": response.success,
            "message": response.message,
            "results": results
        }
    except grpc.RpcError as e:
        print(f"✗ gRPC error during vector search: {e.code()} - {e.details()}")
        return {
            "success": False,
            "message": f"gRPC error: {e.code()} - {e.details()}",
            "results": []
        }
    finally:
        channel.close()
