"""Authentication adapters for the private advocatio API.

The public human UI is protected by Authentik at Traefik. The Next.js BFF
forwards Authentik's signed identity JWT; this module validates its signature,
issuer, audience and lifetime before any legal-domain route runs. Direct
requests observed on the tailnet retain the owner's pre-existing unrestricted
access. The BFF can also authenticate server-rendered/tailnet UI calls with a
short-lived request signature whose secret never reaches browser code.

Byline: Codex · GPT-5 · 2026-09-12
"""

from __future__ import annotations

import hashlib
import hmac
import ipaddress
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from functools import lru_cache
from typing import Any

import jwt
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from jwt import InvalidTokenError, PyJWKClient
from starlette.middleware.base import BaseHTTPMiddleware

from legal_workspace.config import Settings, get_settings

_TAILNET = ipaddress.ip_network("100.64.0.0/10")
_BFF_MAX_AGE_SECONDS = 30


@dataclass(frozen=True)
class AuthenticatedPrincipal:
    """Minimal identity made available to request handlers and audit adapters."""

    subject: str
    username: str | None
    email: str | None
    groups: tuple[str, ...]
    source: str


class AuthenticationUnavailable(RuntimeError):
    """Raised when production authentication has not been configured."""


class AuthenticationDenied(ValueError):
    """Raised when supplied credentials do not satisfy the auth contract."""


class AuthentikTokenVerifier:
    """Verify Authentik JWTs against the provider's pinned issuer contract."""

    def __init__(self, settings: Settings, *, jwks_client: PyJWKClient | None = None) -> None:
        if not settings.authentik_issuer:
            raise AuthenticationUnavailable("AUTHENTIK_ISSUER is required")
        if not settings.authentik_audience:
            raise AuthenticationUnavailable("AUTHENTIK_AUDIENCE is required")
        if not settings.authentik_jwks_url:
            raise AuthenticationUnavailable("AUTHENTIK_JWKS_URL is required")
        self._settings = settings
        self._jwks = jwks_client or _jwks_client(settings.authentik_jwks_url)

    def verify(self, token: str) -> AuthenticatedPrincipal:
        try:
            header = jwt.get_unverified_header(token)
            if header.get("alg") != "RS256":
                raise AuthenticationDenied("only Authentik RS256 tokens are accepted")
            signing_key = self._jwks.get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=self._settings.authentik_audience,
                issuer=self._settings.authentik_issuer,
                leeway=self._settings.auth_clock_skew_seconds,
                options={
                    "require": ["aud", "exp", "iat", "iss", "sub"],
                    "verify_signature": True,
                    "verify_aud": True,
                    "verify_exp": True,
                    "verify_iat": True,
                    "verify_iss": True,
                },
            )
        except AuthenticationDenied:
            raise
        except (InvalidTokenError, ValueError, TypeError) as exc:
            raise AuthenticationDenied("invalid Authentik identity token") from exc

        groups = _claim_values(claims.get("groups"))
        allowed = {
            item.strip()
            for item in self._settings.authentik_allowed_groups.split(",")
            if item.strip()
        }
        if allowed and not allowed.intersection(groups):
            raise AuthenticationDenied("user is not in an allowed Authentik group")

        subject = str(claims.get("sub") or "").strip()
        if not subject:
            raise AuthenticationDenied("Authentik token has no subject")
        return AuthenticatedPrincipal(
            subject=subject,
            username=_optional_claim(claims, "preferred_username"),
            email=_optional_claim(claims, "email"),
            groups=tuple(groups),
            source="authentik",
        )


@lru_cache(maxsize=8)
def _jwks_client(url: str) -> PyJWKClient:
    """Reuse Authentik's bounded JWKS cache across requests."""

    return PyJWKClient(url, cache_keys=True, lifespan=300)


def _optional_claim(claims: dict[str, Any], name: str) -> str | None:
    value = claims.get(name)
    return str(value) if value is not None else None


def _claim_values(value: object) -> list[str]:
    if isinstance(value, str):
        return [item for item in value.split("|") if item]
    if isinstance(value, list):
        return [str(item) for item in value if str(item)]
    return []


def _direct_tailnet_client(request: Request) -> bool:
    """Use the socket peer only; forwarded headers are attacker-controlled here."""

    if request.client is None:
        return False
    try:
        return ipaddress.ip_address(request.client.host) in _TAILNET
    except ValueError:
        return False


def _bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, separator, credentials = authorization.partition(" ")
    if not separator or scheme.lower() != "bearer" or not credentials.strip():
        return None
    return credentials.strip()


def _canonical_bff_message(request: Request, timestamp: str, nonce: str, body: bytes) -> bytes:
    target = request.url.path
    if request.url.query:
        target = f"{target}?{request.url.query}"
    body_hash = hashlib.sha256(body).hexdigest()
    return f"{timestamp}\n{nonce}\n{request.method.upper()}\n{target}\n{body_hash}".encode()


async def _verify_bff_signature(request: Request, settings: Settings) -> bool:
    timestamp = request.headers.get("x-legal-bff-timestamp", "")
    nonce = request.headers.get("x-legal-bff-nonce", "")
    supplied = request.headers.get("x-legal-bff-signature", "")
    secret = settings.legal_bff_signing_secret
    if not timestamp or not nonce or not supplied:
        return False
    if len(secret.encode()) < 32:
        raise AuthenticationUnavailable("LEGAL_BFF_SIGNING_SECRET must be at least 32 bytes")
    try:
        issued_at = int(timestamp)
    except ValueError:
        return False
    if abs(int(time.time()) - issued_at) > _BFF_MAX_AGE_SECONDS:
        return False
    body = await request.body()
    expected = hmac.new(
        secret.encode(),
        _canonical_bff_message(request, timestamp, nonce, body),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(supplied, expected)


class LegalWorkspaceAuthMiddleware(BaseHTTPMiddleware):
    """Apply the two-lane ingress contract at the private API boundary."""

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        if request.url.path == "/health":
            return await call_next(request)

        settings = get_settings()
        if settings.bypass_auth:
            request.state.auth = AuthenticatedPrincipal(
                subject="test-bypass",
                username=None,
                email=None,
                groups=(),
                source="explicit-test-bypass",
            )
            return await call_next(request)

        if settings.tailnet_owner_access and _direct_tailnet_client(request):
            request.state.auth = AuthenticatedPrincipal(
                subject="tailnet-owner",
                username=None,
                email=None,
                groups=(),
                source="tailnet",
            )
            return await call_next(request)

        try:
            if await _verify_bff_signature(request, settings):
                request.state.auth = AuthenticatedPrincipal(
                    subject="legal-web-bff",
                    username=None,
                    email=None,
                    groups=(),
                    source="signed-bff",
                )
                return await call_next(request)

            token = _bearer_token(request.headers.get("authorization"))
            if token is None:
                raise AuthenticationDenied("authentication required")
            request.state.auth = AuthentikTokenVerifier(settings).verify(token)
            return await call_next(request)
        except AuthenticationUnavailable as exc:
            return JSONResponse(status_code=503, content={"detail": str(exc)})
        except AuthenticationDenied:
            return JSONResponse(
                status_code=401,
                content={"detail": "Valid Authentik identity required"},
                headers={"WWW-Authenticate": 'Bearer realm="advocatio"'},
            )
