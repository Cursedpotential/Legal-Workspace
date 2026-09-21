"""PDF metadata: read with exiftool (inside the legal-renderer sidecar), scrub with pikepdf.

> _Byline: Claude Code · Fable 5.1 · 2026-09-21_
CAT5 section E / DOC-10. Owner-produced work product only; never an evidence
original. A scrub writes a new file and reports what was there before and what
exiftool still sees afterwards. Not court-safe.
"""

from __future__ import annotations

import hashlib
from pathlib import Path

import httpx
from pydantic import BaseModel

from legal_workspace.config import get_settings
from legal_workspace.services.renderer import RendererUnavailable

# exiftool fields that describe the file/container, not authored metadata.
_STRUCTURAL = frozenset(
    {
        "SourceFile",
        "ExifToolVersion",
        "FileName",
        "Directory",
        "FileSize",
        "FileModifyDate",
        "FileAccessDate",
        "FileInodeChangeDate",
        "FilePermissions",
        "FileType",
        "FileTypeExtension",
        "MIMEType",
        "PDFVersion",
        "Linearized",
        "PageCount",
    }
)


class MetadataReport(BaseModel):
    ok: bool
    engine: str
    source_name: str
    content_hash: str
    metadata: dict[str, object]
    authored_fields: list[str]
    court_safe: bool = False


class MetadataScrubResult(BaseModel):
    ok: bool
    source_name: str
    output_name: str
    output_path: str
    content_hash: str
    removed_fields: list[str]
    remaining_authored_fields: list[str]
    court_safe: bool = False
    exportable: bool = False


def read_pdf_metadata(src: Path, *, base_url: str | None = None) -> MetadataReport:
    """Every metadata field exiftool reports for `src` (a PDF)."""
    if src.suffix.lower() != ".pdf":
        raise ValueError("metadata read takes a PDF")
    url = (base_url or get_settings().legal_renderer_base_url).rstrip("/")
    try:
        with src.open("rb") as handle, httpx.Client(timeout=120.0) as client:
            response = client.post(
                f"{url}/forms/pdfengines/metadata/read", files={"files": (src.name, handle)}
            )
    except httpx.HTTPError as exc:
        raise RendererUnavailable(f"legal-renderer unreachable: {exc}") from exc
    if response.status_code != 200:
        raise ValueError(
            f"legal-renderer rejected {src.name}: {response.status_code} {response.text[:200]}"
        )
    fields = dict(response.json().get(src.name) or {})
    return MetadataReport(
        ok=True,
        engine="exiftool/gotenberg",
        source_name=src.name,
        content_hash=hashlib.sha256(src.read_bytes()).hexdigest(),
        metadata=fields,
        authored_fields=sorted(k for k in fields if k not in _STRUCTURAL),
    )


def scrub_pdf_metadata(src: Path, dest: Path) -> MetadataScrubResult:
    """Write a copy of `src` with the document-info dictionary and XMP packet removed."""
    from pikepdf import Pdf

    before = read_pdf_metadata(src)
    with Pdf.open(src) as pdf:
        if "/Info" in pdf.trailer:
            del pdf.trailer["/Info"]
        if "/Metadata" in pdf.Root:
            del pdf.Root["/Metadata"]
        dest.parent.mkdir(parents=True, exist_ok=True)
        # A fresh, non-incremental save drops the unreferenced old objects too.
        pdf.save(dest, deterministic_id=True)
    after = read_pdf_metadata(dest)
    return MetadataScrubResult(
        ok=True,
        source_name=src.name,
        output_name=dest.name,
        output_path=str(dest),
        content_hash=after.content_hash,
        removed_fields=sorted(set(before.authored_fields) - set(after.authored_fields)),
        remaining_authored_fields=after.authored_fields,
    )
