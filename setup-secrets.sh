#!/bin/bash

# Copy GitHub secrets from backend to latexServer repository
# This script sets up the same server connection secrets

echo "Setting up GitHub secrets for latexServer deployment..."

cd /home/amine/Desktop/workspace/ezapply/fullstack/latexServer

# Note: GitHub Actions doesn't allow reading secret values via CLI
# You need to manually copy these secrets from the backend repository
echo ""
echo "Please manually copy these secrets from trickcv-backend to trickcv-latexserver:"
echo "  1. Go to: https://github.com/Mohamed-Amine-Dhuibi/trickcv-backend/settings/secrets/actions"
echo "  2. Copy these secrets to: https://github.com/Mohamed-Amine-Dhuibi/trickcv-latexserver/settings/secrets/actions"
echo ""
echo "Required secrets:"
echo "  - SERVER_HOST"
echo "  - SERVER_USER"
echo "  - SERVER_PASSWORD"
echo "  - SERVER_PORT"
echo ""
echo "Or use these commands to set them manually:"
echo ""
echo "gh secret set SERVER_HOST --repo Mohamed-Amine-Dhuibi/trickcv-latexserver"
echo "gh secret set SERVER_USER --repo Mohamed-Amine-Dhuibi/trickcv-latexserver"
echo "gh secret set SERVER_PASSWORD --repo Mohamed-Amine-Dhuibi/trickcv-latexserver"
echo "gh secret set SERVER_PORT --repo Mohamed-Amine-Dhuibi/trickcv-latexserver"
