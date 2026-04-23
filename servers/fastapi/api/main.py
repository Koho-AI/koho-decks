from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.lifespan import app_lifespan
from api.middlewares import AuthMiddleware, UserConfigEnvUpdateMiddleware
from api.v1.ppt.router import API_V1_PPT_ROUTER
from api.v1.webhook.router import API_V1_WEBHOOK_ROUTER
from api.v1.mock.router import API_V1_MOCK_ROUTER
from api.v1.public.oauth import OAUTH_ROUTER
from api.v1.public.share import PUBLIC_SHARE_ROUTER
from api.v1.public.well_known import WELL_KNOWN_ROUTER
from api.v1.ppt.endpoints.health import HEALTH_ROUTER
from fastapi import APIRouter as _APIRouter


app = FastAPI(lifespan=app_lifespan)


# Routers
app.include_router(API_V1_PPT_ROUTER)
app.include_router(API_V1_WEBHOOK_ROUTER)
app.include_router(API_V1_MOCK_ROUTER)

# Phase 5 — public share viewer (no auth). Mounted under /api/v1 so it
# is reachable through the existing nginx `location /api/v1/` proxy.
_PUBLIC_V1 = _APIRouter(prefix="/api/v1")
_PUBLIC_V1.include_router(PUBLIC_SHARE_ROUTER)
_PUBLIC_V1.include_router(HEALTH_ROUTER)
app.include_router(_PUBLIC_V1)

# Well-known discovery endpoints (/.well-known/jwks.json, oauth metadata)
# are mounted at the origin root per RFC convention. nginx.conf routes
# /.well-known/* to FastAPI so these are reachable publicly.
app.include_router(WELL_KNOWN_ROUTER)

# OAuth 2.1 authorization server. /oauth/authorize is browser-facing
# (reads NextAuth session cookies); /oauth/token and /oauth/revoke are
# client-facing (RFC 6749 form-encoded). nginx.conf proxies /oauth/*
# to FastAPI with Host + X-Forwarded-* forwarded.
app.include_router(OAUTH_ROUTER)

# Middlewares
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(UserConfigEnvUpdateMiddleware)
# AuthMiddleware populates request.state.auth from the NextAuth session
# cookie. Keep it permissive for now (doesn't block) — endpoints opt in
# via Depends(get_current_user_strict).
app.add_middleware(AuthMiddleware)
