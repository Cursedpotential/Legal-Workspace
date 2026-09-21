"""MCP face of legal-api: one `advocatio` gateway for ContextForge.

> _Byline: Claude Code · Fable 5.1 · 2026-09-21_
Owner decision 2026-09-21 (option A): every workdesk tool is registered in
ContextForge by arriving through this one MCP endpoint, mounted at /mcp behind
the same auth middleware as the HTTP API. A tool here is a thin function over
an existing service; add one per capability as it goes live. Output is work
product: not evidence, not court-safe.
"""

from __future__ import annotations

import base64
import binascii

from fastmcp import FastMCP

from legal_workspace.api.document_routes import convert_document_bytes

mcp = FastMCP("advocatio")

# MCP arguments are JSON, so files arrive base64-encoded and are capped.
_INLINE_MAX_BYTES = 25 * 1024 * 1024


@mcp.tool
def convert_office_document_to_pdf(filename: str, content_base64: str) -> dict:
    """Convert an owner-produced office file (DOCX, DOC, ODT, RTF, TXT, XLSX, ODS, PPTX, ODP) to PDF
    with LibreOffice. `filename` keeps its office extension; `content_base64` is the file's bytes.
    Returns the stored PDF name, sha256 and size; fetch it from /v1/documents/renders/{output_name}.
    """
    try:
        data = base64.b64decode(content_base64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError("content_base64 is not valid base64") from exc
    if not data:
        raise ValueError("content_base64 is empty")
    if len(data) > _INLINE_MAX_BYTES:
        raise ValueError("inline documents are limited to 25 MiB")
    return convert_document_bytes(filename, data).model_dump()


mcp_app = mcp.http_app(path="/", stateless_http=True, json_response=True)
