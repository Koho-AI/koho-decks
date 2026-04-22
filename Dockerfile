FROM python:3.11-slim-bookworm

# Install Node.js and npm
RUN apt-get update && apt-get install -y \
    nginx \
    curl \
    libreoffice \
    fontconfig \
    chromium \
    zstd


# Install Node.js 20 using NodeSource repository
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs


# Create a working directory
WORKDIR /app  

# Set environment variables
ENV APP_DATA_DIRECTORY=/app_data
ENV TEMP_DIRECTORY=/tmp/presenton
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium


# Optionally install ollama. The upstream installer also pulls ~13 GB of
# CUDA v12 libraries even on GPU-less hosts. Koho's production VPS has no
# GPU and uses cloud LLM providers (openai/anthropic/google), so we build
# with INCLUDE_OLLAMA=false there. Default stays true to preserve parity
# with upstream Presenton and local dev usage.
ARG INCLUDE_OLLAMA=true
ENV INCLUDE_OLLAMA=${INCLUDE_OLLAMA}
RUN if [ "$INCLUDE_OLLAMA" = "true" ]; then \
        curl -fsSL https://ollama.com/install.sh | sh; \
    else \
        echo "INCLUDE_OLLAMA=$INCLUDE_OLLAMA — skipping ollama install"; \
    fi

# Install dependencies for FastAPI
RUN pip install alembic aiohttp aiomysql aiosqlite asyncpg psycopg2-binary fastapi[standard] \
    pathvalidate pdfplumber chromadb sqlmodel \
    anthropic google-genai openai fastmcp dirtyjson
RUN pip install docling --extra-index-url https://download.pytorch.org/whl/cpu

# Install dependencies for Next.js
WORKDIR /app/servers/nextjs
COPY servers/nextjs/package.json servers/nextjs/package-lock.json ./
RUN npm install


# Copy Next.js app
COPY servers/nextjs/ /app/servers/nextjs/

# Build the Next.js app
WORKDIR /app/servers/nextjs
RUN npm run build

WORKDIR /app

# Copy FastAPI
COPY servers/fastapi/ ./servers/fastapi/
COPY start.js LICENSE NOTICE ./

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose the port
EXPOSE 80

# Start the servers
CMD ["node", "/app/start.js"]