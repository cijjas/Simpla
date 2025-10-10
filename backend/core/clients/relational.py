"""Client for communicating with the relational microservice via gRPC."""

import grpc
from typing import List, Dict, Callable, Any
from contextlib import contextmanager
from core.proto import relational_pb2, relational_pb2_grpc


@contextmanager
def _create_grpc_stub(grpc_host: str, grpc_port: int):
    """Context manager for creating and closing gRPC channel and stub."""
    channel = grpc.insecure_channel(f"{grpc_host}:{grpc_port}")
    try:
        stub = relational_pb2_grpc.RelationalServiceStub(channel)
        yield stub
    finally:
        channel.close()


def _handle_grpc_call(
    grpc_host: str,
    grpc_port: int,
    rpc_call: Callable,
    success_msg: str,
    error_msg: str,
    default_error_response: Dict[str, Any]
) -> dict:
    """
    Common handler for gRPC calls with error handling.

    Args:
        grpc_host: The gRPC server host
        grpc_port: The gRPC server port
        rpc_call: Function that takes stub and makes the RPC call
        success_msg: Message to print on success
        error_msg: Message prefix for errors
        default_error_response: Default response dict on error

    Returns:
        Response dict from the RPC call
    """
    with _create_grpc_stub(grpc_host, grpc_port) as stub:
        try:
            response = rpc_call(stub)
            print(f"✓ {success_msg}")
            # print(f"Response message: {response.message}")
            return response
        except grpc.RpcError as e:
            print(f"✗ {error_msg}: {e.code()} - {e.details()}")
            result = default_error_response.copy()
            result["message"] = f"gRPC error: {e.code()} - {e.details()}"
            return result


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
    def rpc_call(stub):
        request = relational_pb2.ReconstructNormRequest(infoleg_id=infoleg_id)
        response = stub.ReconstructNorm(request)
        print(f"Norma JSON:\n{response.norma_json}")
        return {
            "success": response.success,
            "message": response.message,
            "norma_json": response.norma_json
        }

    return _handle_grpc_call(
        grpc_host,
        grpc_port,
        rpc_call,
        f"Successfully fetched norm {infoleg_id}",
        f"gRPC error fetching norm {infoleg_id}",
        {"success": False, "norma_json": ""}
    )


def fetch_norm_by_id(norm_id: int, grpc_host: str = "localhost", grpc_port: int = 50051) -> dict:
    """
    Fetch norm data from the relational microservice via gRPC by database ID.

    Args:
        norm_id: The database ID to fetch
        grpc_host: The gRPC server host (default: localhost)
        grpc_port: The gRPC server port (default: 50051)

    Returns:
        dict with keys: success (bool), message (str), norma_json (str)
    """
    def rpc_call(stub):
        request = relational_pb2.ReconstructNormByIdRequest(id=norm_id)
        response = stub.ReconstructNormById(request)
        print(f"Norma JSON:\n{response.norma_json}")
        return {
            "success": response.success,
            "message": response.message,
            "norma_json": response.norma_json
        }

    return _handle_grpc_call(
        grpc_host,
        grpc_port,
        rpc_call,
        f"Successfully fetched norm by ID {norm_id}",
        f"gRPC error fetching norm by ID {norm_id}",
        {"success": False, "norma_json": ""}
    )


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
        dict with keys: success (bool), message (str), normas_json (str)
    """
    entity_pairs = _parse_entity_pairs_from_search_results(search_results)

    def rpc_call(stub):
        request = relational_pb2.GetBatchRequest(entities=entity_pairs)
        response = stub.GetBatch(request)
        return {
            "success": response.success,
            "message": response.message,
            "normas_json": response.normas_json
        }

    return _handle_grpc_call(
        grpc_host,
        grpc_port,
        rpc_call,
        "Successfully fetched batch entities",
        "gRPC error fetching batch entities",
        {"success": False, "normas_json": "[]"}
    )


def _parse_entity_pairs_from_search_results(search_results: List[Dict]) -> List:
    """
    Parse search results and create EntityPair messages.

    Args:
        search_results: List of search result dicts

    Returns:
        List of EntityPair proto messages
    """
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

    return entity_pairs
