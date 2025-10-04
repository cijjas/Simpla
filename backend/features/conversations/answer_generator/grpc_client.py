"""gRPC client for communicating with relational microservice."""

import grpc
from typing import List, Dict
from core.proto import relational_pb2, relational_pb2_grpc


def fetch_norm_by_infoleg_id(infoleg_id: int, grpc_host: str = "localhost", grpc_port: int = 50051) -> dict:
    """
    Fetch norm data from the relational microservice via gRPC.

    Args:
        infoleg_id: The infoleg ID to fetch
        grpc_host: The gRPC server host (default: localhost)
        grpc_port: The gRPC server port (default: 50051)

    Returns:
        dict with keys: success (bool), message (str), norma_json (str)
    """
    channel = grpc.insecure_channel(f"{grpc_host}:{grpc_port}")
    stub = relational_pb2_grpc.RelationalServiceStub(channel)

    request = relational_pb2.ReconstructNormRequest(infoleg_id=infoleg_id)

    try:
        response = stub.ReconstructNorm(request)
        print(f"✓ Successfully fetched norm {infoleg_id}")
        print(f"Response message: {response.message}")
        print(f"Norma JSON:\n{response.norma_json}")

        return {
            "success": response.success,
            "message": response.message,
            "norma_json": response.norma_json
        }
    except grpc.RpcError as e:
        print(f"✗ gRPC error fetching norm {infoleg_id}: {e.code()} - {e.details()}")
        return {
            "success": False,
            "message": f"gRPC error: {e.code()} - {e.details()}",
            "norma_json": ""
        }
    finally:
        channel.close()


def fetch_batch_entities(search_results: List[Dict], grpc_host: str = "localhost", grpc_port: int = 50051) -> dict:
    """
    Fetch batch entities (articles and divisions) from the relational microservice via gRPC.

    Args:
        search_results: List of search result dicts with 'document_id' and 'metadata' fields
                       document_id format: "n{source_id}_{type_prefix}{id}" (e.g., "n183532_a4", "n183532_d1")
                       metadata must contain 'document_type' field ("article" or "division")
        grpc_host: The gRPC server host (default: localhost)
        grpc_port: The gRPC server port (default: 50051)

    Returns:
        dict with keys: success (bool), message (str), divisions_json (str), articles_json (str)
    """
    channel = grpc.insecure_channel(f"{grpc_host}:{grpc_port}")
    stub = relational_pb2_grpc.RelationalServiceStub(channel)

    # Parse search results and create EntityPair messages
    entity_pairs = []
    for result in search_results:
        metadata = result.get("metadata", {})
        document_type = metadata.get("document_type", "")
        document_id = metadata.get("document_id", "")

        # Convert document_id from string to int
        try:
            document_id_int = int(document_id)
        except (ValueError, TypeError):
            print(f"Warning: Could not convert document_id '{document_id}' to int, skipping")
            continue

        entity_pair = relational_pb2.EntityPair(
            type=document_type,
            id=document_id_int
        )
        entity_pairs.append(entity_pair)

    request = relational_pb2.GetBatchRequest(entities=entity_pairs)

    try:
        response = stub.GetBatch(request)
        print(f"✓ Successfully fetched batch entities")
        print(f"Response message: {response.message}")

        return {
            "success": response.success,
            "message": response.message,
            "divisions_json": response.divisions_json,
            "articles_json": response.articles_json
        }
    except grpc.RpcError as e:
        print(f"✗ gRPC error fetching batch entities: {e.code()} - {e.details()}")
        return {
            "success": False,
            "message": f"gRPC error: {e.code()} - {e.details()}",
            "divisions_json": "[]",
            "articles_json": "[]"
        }
    finally:
        channel.close()
