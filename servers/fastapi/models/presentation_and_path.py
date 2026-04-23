from typing import Optional
from pydantic import BaseModel
import uuid


class PresentationAndPath(BaseModel):
    presentation_id: uuid.UUID
    # Server-local filesystem path. Useful inside the container (e.g.
    # for chained internal exports) but NOT reachable by remote clients.
    path: str
    # Public URL served by nginx from /app_data/exports/. Remote clients
    # (including MCP) should use this to download the export.
    download_url: Optional[str] = None


class PresentationPathAndEditPath(PresentationAndPath):
    edit_path: str
