"""Import and validate LegalSourcePackage objects.

> _Byline: Grok · grok-4.6 · 2026-08-18_
"""

from __future__ import annotations

from dataclasses import dataclass

from legal_workspace.contracts.source_package import (
    LegalSourcePackage,
    ReviewState,
)


@dataclass(frozen=True)
class ImportResult:
    accepted: LegalSourcePackage
    omitted_item_ids: tuple[str, ...]
    blocked: bool
    reason: str | None = None


def import_legal_source_package(package: LegalSourcePackage) -> ImportResult:
    """Keep only Evidence-Platform-approved items.

    Candidates, revoked, and quarantined rows are omitted and recorded.
    An empty remaining package is blocked — legal work cannot start on
    unapproved material.
    """
    omitted = [
        str(item.item_id)
        for item in package.items
        if item.review_state is not ReviewState.APPROVED
    ]
    accepted_items = [
        item for item in package.items if item.review_state is ReviewState.APPROVED
    ]
    accepted = package.model_copy(update={"items": accepted_items})
    if not accepted_items:
        return ImportResult(
            accepted=accepted,
            omitted_item_ids=tuple(omitted),
            blocked=True,
            reason="no approved items in package",
        )
    return ImportResult(
        accepted=accepted,
        omitted_item_ids=tuple(omitted),
        blocked=False,
    )
