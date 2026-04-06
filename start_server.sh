#!/bin/bash

# Multi-MCP Hub Execution Script
# General hardware/OS-agnostic startup

PROJECT_DIR=$(pwd)
echo "==> Starting Corax Crypto MCP Server..."

# Ensure we're in the right directory
cd "$PROJECT_DIR"

if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is not installed. Please install Docker and Docker Compose."
    exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
    echo "Docker Compose is not available. Please install it."
    exit 1
fi

echo "==> Building and starting Docker containers..."
docker compose up -d --build

echo "==> Corax Crypto MCP Server is now running in Docker!"
echo "==> You can also run external MCPs alongside this server."
echo "==> See multi_mcp_config.example.json for AI client configuration."
