"""
Phase 5 — public share-link viewer API. No authentication required.

Three endpoints, all keyed by the URL-safe share-link `token`:
- POST /request-otp  : email entered on the gate page → mints 6-digit OTP, emails it
- POST /verify-otp   : email + code → on success, sets a signed view_session cookie
- GET  /             : returns deck JSON if open OR view_session cookie matches

A `view_session` cookie carries (share_link_id, viewer_id) signed with
AUTH_SECRET. It's set on successful OTP verification and accepted on
subsequent loads so the gate isn't re-shown.

Every successful render is logged to share_views with an IP hash
(SHA-256(salt + ip)) and user agent for the owner's analytics panel.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import json
import logging
import os
import secrets
from base64 import urlsafe_b64decode, urlsafe_b64encode
from typing import Optional

from fastapi import APIRouter, Body, Cookie, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from models.sql.otp_challenge import OtpChallengeModel
from models.sql.share_link import GATE_EMAIL_OTP, GATE_OPEN, ShareLinkModel
from models.sql.share_view import ShareViewModel
from models.sql.share_viewer import ShareViewerModel
from models.sql.presentation import PresentationModel
from models.sql.slide import SlideModel
from services.database import get_async_session
from services.email import send_email


log = logging.getLogger(__name__)

PUBLIC_SHARE_ROUTER = APIRouter(prefix="/share", tags=["PublicShare"])

OTP_TTL = timedelta(minutes=10)
VIEW_SESSION_TTL = timedelta(hours=24)
MAX_OTP_ATTEMPTS = 5
VIEW_SESSION_COOKIE = "koho_view_session"


# ─── Schemas ─────────────────────────────────────────────────────────────────


class RequestOtpPayload(BaseModel):
    email: EmailStr


class VerifyOtpPayload(BaseModel):
    email: EmailStr
    code: str


class PublicDeckSlide(BaseModel):
    id: str
    index: int
    layout: Optional[str] = None
    layout_group: Optional[str] = None
    content: Optional[dict] = None
    properties: Optional[dict] = None
    speaker_note: Optional[str] = None


class PublicDeckResponse(BaseModel):
    presentation_id: str
    title: Optional[str]
    layout: Optional[dict]
    structure: Optional[dict]
    theme: Optional[dict]
    slides: list[PublicDeckSlide]


class GateRequiredResponse(BaseModel):
    needs_email_gate: bool = True
    deck_title: Optional[str] = None


# ─── Helpers ─────────────────────────────────────────────────────────────────


def _auth_secret() -> bytes:
    secret = os.getenv("AUTH_SECRET", "")
    if not secret:
        # Defensive — the app shouldn't boot without AUTH_SECRET, but
        # we never want to silently sign with an empty key.
        raise RuntimeError("AUTH_SECRET is not set")
    return secret.encode("utf-8")


def _sign_view_session(share_link_id: str, viewer_id: str) -> str:
    """Compact signed token: base64url(payload_json) + '.' + base64url(hmac)."""
    payload = json.dumps(
        {
            "sl": share_link_id,
            "vw": viewer_id,
            "exp": int(
                (datetime.now(timezone.utc) + VIEW_SESSION_TTL).timestamp()
            ),
        },
        separators=(",", ":"),
    ).encode("utf-8")
    body = urlsafe_b64encode(payload).rstrip(b"=")
    sig = hmac.new(_auth_secret(), body, hashlib.sha256).digest()
    sig_b64 = urlsafe_b64encode(sig).rstrip(b"=")
    return f"{body.decode()}.{sig_b64.decode()}"


def _verify_view_session(
    cookie: str, share_link_id: str
) -> Optional[str]:
    """Return viewer_id if the cookie is valid for this link, else None."""
    try:
        body_b64, sig_b64 = cookie.split(".", 1)
        body = urlsafe_b64decode(body_b64 + "==")
        expected = hmac.new(_auth_secret(), body_b64.encode(), hashlib.sha256).digest()
        actual = urlsafe_b64decode(sig_b64 + "==")
        if not hmac.compare_digest(expected, actual):
            return None
        data = json.loads(body)
        if data.get("sl") != share_link_id:
            return None
        if int(data.get("exp", 0)) < int(datetime.now(timezone.utc).timestamp()):
            return None
        return data.get("vw")
    except Exception:
        return None


def _hash_otp(code: str) -> str:
    """SHA-256(AUTH_SECRET + code). Constant-time compare against
    `_verify_otp_hash`. We don't need bcrypt's slowness here — codes
    are 10-minute, single-use, 5-attempt-locked, so brute force is not
    a viable threat model."""
    return hashlib.sha256(_auth_secret() + code.encode("utf-8")).hexdigest()


def _verify_otp_hash(code: str, expected_hash: str) -> bool:
    return hmac.compare_digest(_hash_otp(code), expected_hash)


def _ip_hash(ip: Optional[str]) -> Optional[str]:
    if not ip:
        return None
    salted = (_auth_secret() + b":" + ip.encode()).strip()
    return hashlib.sha256(salted).hexdigest()


async def _resolve_link(
    token: str, sql_session: AsyncSession
) -> ShareLinkModel:
    link = (
        await sql_session.execute(
            select(ShareLinkModel).where(ShareLinkModel.token == token)
        )
    ).scalar_one_or_none()
    if link is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Share link not found")
    if link.revoked_at is not None:
        raise HTTPException(status.HTTP_410_GONE, "This link has been revoked")
    if link.expires_at is not None and link.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_410_GONE, "This link has expired")
    return link


# ─── Endpoints ───────────────────────────────────────────────────────────────


@PUBLIC_SHARE_ROUTER.post("/{token}/request-otp", status_code=status.HTTP_202_ACCEPTED)
async def request_otp(
    token: str,
    payload: RequestOtpPayload,
    sql_session: AsyncSession = Depends(get_async_session),
):
    link = await _resolve_link(token, sql_session)
    if link.gate_mode != GATE_EMAIL_OTP:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "This link does not require email verification",
        )

    email = payload.email.lower().strip()

    # Upsert ShareViewer
    viewer = (
        await sql_session.execute(
            select(ShareViewerModel).where(
                ShareViewerModel.share_link_id == link.id,
                ShareViewerModel.email == email,
            )
        )
    ).scalar_one_or_none()
    if viewer is None:
        viewer = ShareViewerModel(share_link_id=link.id, email=email)
        sql_session.add(viewer)
        await sql_session.flush()

    # Mint a fresh OTP. We don't reveal the previous code; just create a
    # new challenge and let the most recent unused, unexpired one win.
    code = f"{secrets.randbelow(1_000_000):06d}"
    challenge = OtpChallengeModel(
        share_viewer_id=viewer.id,
        code_hash=_hash_otp(code),
        expires_at=datetime.now(timezone.utc) + OTP_TTL,
    )
    sql_session.add(challenge)
    await sql_session.commit()

    # Lookup the deck title for the email body.
    deck = await sql_session.get(PresentationModel, link.presentation_id)
    deck_title = deck.title if deck else "a deck"

    # Best-effort email — no-ops without SMTP creds.
    await send_email(
        to_email=email,
        subject=f"Your code for {deck_title} on Koho Decks",
        text_body=(
            f"Your verification code is: {code}\n\n"
            "Enter it on the page where you requested the code. "
            "It expires in 10 minutes."
        ),
        html_body=_otp_email_html(code, deck_title),
    )

    # Always return 202 — never reveal whether the email exists or
    # whether send actually worked.
    return {"status": "ok"}


@PUBLIC_SHARE_ROUTER.post("/{token}/verify-otp")
async def verify_otp(
    token: str,
    payload: VerifyOtpPayload,
    response: Response,
    request: Request,
    sql_session: AsyncSession = Depends(get_async_session),
):
    link = await _resolve_link(token, sql_session)
    if link.gate_mode != GATE_EMAIL_OTP:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "This link does not require email verification",
        )

    email = payload.email.lower().strip()
    viewer = (
        await sql_session.execute(
            select(ShareViewerModel).where(
                ShareViewerModel.share_link_id == link.id,
                ShareViewerModel.email == email,
            )
        )
    ).scalar_one_or_none()
    if viewer is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid code")

    # Find the most recent unused, unexpired challenge.
    challenge = (
        await sql_session.execute(
            select(OtpChallengeModel)
            .where(
                OtpChallengeModel.share_viewer_id == viewer.id,
                OtpChallengeModel.used_at.is_(None),
                OtpChallengeModel.expires_at > datetime.now(timezone.utc),
            )
            .order_by(OtpChallengeModel.created_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    if challenge is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid code")
    if challenge.attempts >= MAX_OTP_ATTEMPTS:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Too many attempts on this code. Request a new one.",
        )

    if not _verify_otp_hash(payload.code, challenge.code_hash):
        challenge.attempts += 1
        await sql_session.commit()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid code")

    # Success.
    now = datetime.now(timezone.utc)
    challenge.used_at = now
    viewer.verified_at = now
    await sql_session.commit()

    cookie_value = _sign_view_session(str(link.id), str(viewer.id))
    response.set_cookie(
        key=VIEW_SESSION_COOKIE,
        value=cookie_value,
        max_age=int(VIEW_SESSION_TTL.total_seconds()),
        httponly=True,
        samesite="lax",
        path=f"/view/{link.token}",
        secure=request.url.scheme == "https",
    )
    return {"status": "ok"}


@PUBLIC_SHARE_ROUTER.get("/{token}")
async def get_public_deck(
    token: str,
    request: Request,
    sql_session: AsyncSession = Depends(get_async_session),
    koho_view_session: Optional[str] = Cookie(default=None, alias=VIEW_SESSION_COOKIE),
):
    link = await _resolve_link(token, sql_session)

    # Email-gated: require a valid view_session cookie tied to this link.
    viewer_email: Optional[str] = None
    if link.gate_mode == GATE_EMAIL_OTP:
        viewer_id = (
            _verify_view_session(koho_view_session, str(link.id))
            if koho_view_session
            else None
        )
        if viewer_id is None:
            return GateRequiredResponse(
                needs_email_gate=True,
                deck_title=(
                    (
                        await sql_session.get(
                            PresentationModel, link.presentation_id
                        )
                    ).title
                    if link.presentation_id
                    else None
                ),
            )
        # Resolve email for the view-log
        viewer = await sql_session.get(ShareViewerModel, viewer_id)
        viewer_email = viewer.email if viewer else None

    deck = await sql_session.get(PresentationModel, link.presentation_id)
    if deck is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Deck not found")

    slides = (
        await sql_session.scalars(
            select(SlideModel)
            .where(SlideModel.presentation == deck.id)
            .order_by(SlideModel.index)
        )
    ).all()

    # Log the view (best-effort — never block the render on a logging failure)
    try:
        view = ShareViewModel(
            share_link_id=link.id,
            viewer_email=viewer_email,
            ip_hash=_ip_hash(_client_ip(request)),
            user_agent=(request.headers.get("user-agent") or "")[:512] or None,
        )
        sql_session.add(view)
        await sql_session.commit()
    except Exception as exc:
        log.warning("Failed to log share view: %s", exc)

    return PublicDeckResponse(
        presentation_id=str(deck.id),
        title=deck.title,
        layout=deck.layout,
        structure=deck.structure,
        theme=deck.theme,
        slides=[
            PublicDeckSlide(
                id=str(s.id),
                index=s.index,
                layout=s.layout,
                layout_group=s.layout_group,
                content=s.content,
                properties=s.properties,
                speaker_note=s.speaker_note,
            )
            for s in slides
        ],
    )


# ─── Helpers (continued) ────────────────────────────────────────────────────


def _client_ip(request: Request) -> Optional[str]:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else None


def _otp_email_html(code: str, deck_title: str) -> str:
    return f"""<!doctype html>
<html><body style="margin:0;font-family:Manrope,Helvetica,Arial,sans-serif;background:#F4F6F9;padding:32px 16px;color:#1A2332;">
  <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border:1px solid rgba(26,35,50,0.08);border-radius:16px;padding:32px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
      <div style="width:24px;height:24px;border-radius:50%;background:#00C278;"></div>
      <div style="font-size:18px;font-weight:500;">Koho Decks</div>
    </div>
    <p style="color:#5B6A7E;font-size:14px;line-height:1.55;margin:0 0 18px;">
      Use this code to view <strong style="color:#1A2332;font-weight:500;">{deck_title}</strong>.
      It expires in 10 minutes.
    </p>
    <div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:32px;letter-spacing:0.18em;
                background:#F4F6F9;border:1px solid rgba(26,35,50,0.08);border-radius:12px;
                padding:18px 22px;text-align:center;color:#1A2332;font-weight:500;">
      {code}
    </div>
    <p style="color:#9AA6B2;font-size:12px;margin-top:18px;">
      If you didn't request this, ignore the email. The code is single-use.
    </p>
  </div>
</body></html>"""
