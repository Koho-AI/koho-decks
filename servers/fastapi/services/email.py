"""
Phase 4d — Gmail SMTP email service.

Minimal wrapper around stdlib smtplib wrapped in asyncio.to_thread.
Gracefully degrades to a no-op (with a log line) if SMTP_* env vars
aren't configured, so the rest of the app works without email.

Env vars (see .env.example):
    SMTP_HOST      default smtp.gmail.com
    SMTP_PORT      default 587 (STARTTLS)
    SMTP_USER      Gmail address to send from (e.g. decks@koho.ai)
    SMTP_PASSWORD  Google Workspace app password for SMTP_USER
    SMTP_FROM      Optional display name / address override
                   (defaults to SMTP_USER)
    APP_BASE_URL   Origin for links in emails (e.g. https://decks.koho.ai)
"""

import asyncio
import logging
import os
import smtplib
from email.message import EmailMessage
from typing import Optional


log = logging.getLogger(__name__)


def _smtp_enabled() -> bool:
    return bool(os.getenv("SMTP_HOST") or os.getenv("SMTP_USER")) and bool(
        os.getenv("SMTP_PASSWORD")
    )


def _send_sync(
    *,
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str,
    from_address: Optional[str] = None,
) -> None:
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    sender = from_address or os.getenv("SMTP_FROM") or user or ""
    if not (user and password and sender):
        log.info(
            "SMTP is not configured (SMTP_USER/PASSWORD missing); skipping email to %s",
            to_email,
        )
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_email
    msg.set_content(text_body)
    msg.add_alternative(html_body, subtype="html")

    try:
        with smtplib.SMTP(host, port) as s:
            s.ehlo()
            s.starttls()
            s.ehlo()
            s.login(user, password)
            s.send_message(msg)
        log.info("Sent email to %s subject=%r via %s", to_email, subject, host)
    except Exception as exc:
        # Don't let an email failure kill the parent request.
        log.warning("Failed to send email to %s: %s", to_email, exc)


async def send_email(
    *,
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str,
    from_address: Optional[str] = None,
) -> None:
    if not _smtp_enabled():
        log.info(
            "SMTP not configured; would have sent %r to %s", subject, to_email
        )
        return
    await asyncio.to_thread(
        _send_sync,
        to_email=to_email,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        from_address=from_address,
    )


# ─── Templates ───────────────────────────────────────────────────────────────


def _base_url() -> str:
    return os.getenv("APP_BASE_URL", "http://localhost:5001").rstrip("/")


def invitation_email(
    *,
    to_email: str,
    deck_title: Optional[str],
    inviter_name: Optional[str],
    inviter_email: Optional[str],
    role: str,
    presentation_id: str,
) -> dict:
    """Returns kwargs dict ready to pass to send_email()."""
    deck = deck_title or "a deck"
    inviter = inviter_name or inviter_email or "A Koho teammate"
    link = f"{_base_url()}/presentation?id={presentation_id}"
    role_label = "editor" if role == "editor" else "viewer"

    subject = f"{inviter} invited you to {deck} on Koho Decks"
    text_body = (
        f"{inviter} invited you to {deck} on Koho Decks as a {role_label}.\n\n"
        f"Sign in with your @koho.ai Google account and open the deck:\n{link}\n\n"
        "— Koho Decks"
    )
    html_body = f"""<!doctype html>
<html><body style="margin:0;font-family:Manrope,Helvetica,Arial,sans-serif;background:#F4F6F9;padding:32px 16px;color:#1A2332;">
  <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border:1px solid rgba(26,35,50,0.08);border-radius:16px;padding:32px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
      <div style="width:24px;height:24px;border-radius:50%;background:#00C278;"></div>
      <div style="font-size:18px;font-weight:500;">Koho Decks</div>
    </div>
    <h1 style="font-size:22px;font-weight:500;margin:0 0 8px;letter-spacing:-0.01em;">
      You've been invited to <span style="font-weight:300;">{deck}</span>
    </h1>
    <p style="color:#5B6A7E;font-size:14px;line-height:1.55;margin:0 0 20px;">
      <strong style="color:#1A2332;font-weight:500;">{inviter}</strong> shared a deck with you on Koho Decks as a {role_label}.
      Sign in with your @koho.ai Google account to open it.
    </p>
    <a href="{link}" style="display:inline-block;padding:12px 20px;background:#00C278;color:#FFFFFF;border-radius:999px;text-decoration:none;font-weight:500;font-size:14px;">
      Open deck
    </a>
    <p style="color:#9AA6B2;font-size:12px;margin-top:26px;line-height:1.55;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="{link}" style="color:#5B6A7E;word-break:break-all;">{link}</a>
    </p>
  </div>
</body></html>"""
    return dict(
        to_email=to_email,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
    )
