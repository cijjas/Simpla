"""gRPC client for communicating with relational microservice."""

import grpc
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
