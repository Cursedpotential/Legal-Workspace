"""Document rendering HTTP surface.

> _Byline: Claude Code · Fable 5.1 · 2026-09-20_
POST /v1/documents:convert sends an owner-produced office file to the
`legal-renderer` sidecar (LibreOffice) and stores the PDF under
`<store>/renders/`. GET /v1/documents/renders/{name} returns it. Not Agno
evidence. Not court-safe. Parent mounts this router on the FastAPI app.
"""

from __future__ import annotations

from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from legal_workspace.services.renderer import (
    RendererUnavailable,
    RenderResult,
    convert_office_to_pdf,
    safe_document_name,
)
from legal_workspace.services.workspace import WORKSPACE

router = APIRouter()


def _renders_dir() -> Path:
    folder = WORKSPACE.store_dir / "renders"
    folder.mkdir(parents=True, exist_ok=True)
    return folder


@router.post("/v1/documents:convert", response_model=RenderResult)
async def convert_owner_document(file: Annotated[UploadFile, File()]) -> RenderResult:
    """LibreOffice conversion of an owner-produced office file to PDF."""
    try:
        name = safe_document_name(file.filename or "")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    folder = _renders_dir()
    src = folder / name
    dest = folder / f"{Path(name).stem}.pdf"
    if src == dest:
        raise HTTPException(status_code=400, detail="source is already a PDF")
    src.write_bytes(await file.read())
    try:
        return convert_office_to_pdf(src, dest)
    except RendererUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/v1/documents/renders/{name}")
def get_rendered_document(name: str) -> FileResponse:
    try:
        safe = safe_document_name(name)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    path = _renders_dir() / safe
    if safe != name or not path.is_file():
        raise HTTPException(status_code=404, detail="render not found")
    return FileResponse(path, filename=safe)
