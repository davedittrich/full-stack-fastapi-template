#!/bin/bash

# Setup script for python-secrets (psec) environment
# This script helps users migrate from .env files to psec for better security

set -e

ENVIRONMENT_NAME="${D2_ENVIRONMENT:-tanzanite-dev}"
SECRETS_DIR="$(pwd)/secrets.d"

echo "=== Tanzanite psec Environment Setup ==="
echo ""

# Check if psec is installed
if ! command -v psec &> /dev/null; then
    echo "[-] python-secrets (psec) is not installed."
    echo "[*] Installing python-secrets..."
    pip install python-secrets
fi

echo "[+] python-secrets (psec) is available"

# Check if environment already exists
if psec environments path --exists 2>/dev/null; then
    echo "[*] Environment '$ENVIRONMENT_NAME' already exists"
    echo "[*] Current secrets:"
    psec secrets show --no-redact 2>/dev/null || echo "  (No secrets found or access denied)"
    echo ""
    read -p "Do you want to recreate the environment? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "[*] Removing existing environment..."
        psec environments delete "$ENVIRONMENT_NAME" --force
    else
        echo "[*] Keeping existing environment"
        exit 0
    fi
fi

# Create new environment
echo "[*] Creating new psec environment: $ENVIRONMENT_NAME"
if [ -d "$SECRETS_DIR" ]; then
    psec --init environments create --clone-from "$SECRETS_DIR" "$ENVIRONMENT_NAME"
else
    echo "[-] Secrets directory not found: $SECRETS_DIR"
    echo "[*] Creating basic environment without templates..."
    psec --init environments create "$ENVIRONMENT_NAME"
fi

# Generate secrets from options
echo "[*] Generating secrets..."
psec secrets generate --from-options

echo ""
echo "[+] psec environment setup complete!"
echo ""
echo "Environment name: $ENVIRONMENT_NAME"
echo "Environment path: $(psec environments path)"
echo ""
echo "To use this environment:"
echo "  export D2_ENVIRONMENT=$ENVIRONMENT_NAME"
echo "  psec -E run -- <your-command>"
echo ""
echo "To start the development server:"
echo "  psec -E run -- uvicorn app.main:app --reload"
echo ""
echo "To run the CLI:"
echo "  psec -E run -- tanzanite --help"
echo ""
echo "To view/edit secrets:"
echo "  psec secrets show --no-redact"
echo "  psec secrets set <secret-name>"
echo ""