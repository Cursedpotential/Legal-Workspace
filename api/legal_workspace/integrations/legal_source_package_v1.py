"""Held consumer boundary for the D08 LegalSourcePackage v1 contract.

This module is intentionally not mounted by the API.  A production adapter must
verify the signed D08 manifest, read one canonical producer snapshot, and persist
the package plus its availability receipt only if that exact producer revision
is still current at commit time.

Byline: Codex D09 · GPT-5 · 2026-09-23
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Protocol, runtime_checkable
from uuid import UUID


class LegalSourcePackageV1Held(RuntimeError):
    """Raised while the trusted D08 consumer adapter is not activated."""


@dataclass(frozen=True)
class PackageAvailabilityReceipt:
    """Durable result of one atomic, exact-revision package acceptance."""

    package_id: UUID
    matter_id: UUID
    package_digest: str
    producer_revision: str
    accepted_at: datetime


@runtime_checkable
class LegalSourcePackageV1Consumer(Protocol):
    """Port for trusted and atomic D08 package acceptance.

    Implementations must fail without any consumer write unless all of these
    occur as one acceptance operation:

    * parse the exact ``legal-source-package/v1`` schema;
    * resolve ``issuer_key_id`` only through a configured trust store;
    * verify the Ed25519 signature and canonical manifest/package digest;
    * read one producer snapshot covering the package and every item;
    * require package and item status ``available`` at that snapshot revision;
    * conditionally persist the package and availability receipt only while the
      same producer revision remains current.

    Returning a receipt means availability at the recorded revision.  It does
    not establish perpetual currentness and does not copy source bytes.
    """

    def accept_if_current(
        self,
        serialized_package: bytes,
        *,
        expected_matter_id: UUID,
    ) -> PackageAvailabilityReceipt: ...


class HeldLegalSourcePackageV1Consumer:
    """Safe default used until every D08 activation dependency is supplied."""

    _REASON = (
        "D08 LegalSourcePackage v1 consumer is held: trusted issuer keys, "
        "canonical producer snapshot readback, and an atomic conditional inbox "
        "adapter are not configured"
    )

    def accept_if_current(
        self,
        serialized_package: bytes,
        *,
        expected_matter_id: UUID,
    ) -> PackageAvailabilityReceipt:
        del serialized_package, expected_matter_id
        raise LegalSourcePackageV1Held(self._REASON)
