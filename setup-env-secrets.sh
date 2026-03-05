#!/bin/bash

# Setup environment secrets for trickcv-latexserver
# This requires the GitHub CLI and proper permissions

REPO="Mohamed-Amine-Dhuibi/trickcv-latexserver"
ENV_NAME="latexServer"

echo "Setting up environment secrets for $REPO"
echo "Environment: $ENV_NAME"
echo ""

# Function to get repository secrets and set them as environment secrets
copy_secret() {
    local secret_name=$1
    echo "Copying $secret_name to environment $ENV_NAME..."
    
    # Get the secret value (this will prompt if not piped)
    gh secret set "$secret_name" \
        --env "$ENV_NAME" \
        --repo "$REPO" \
        --body "$(gh api repos/$REPO/actions/secrets/$secret_name 2>/dev/null || echo '')"
}

echo "Note: You'll need to manually set these secrets for the environment:"
echo ""
echo "1. Go to: https://github.com/$REPO/settings/environments"
echo "2. Create or select the '$ENV_NAME' environment"
echo "3. Add the following secrets:"
echo "   - SERVER_HOST: trickcv.com"
echo "   - SERVER_USER: root"
echo "   - SERVER_PASSWORD: <your server password>"
echo "   - SERVER_PORT: 22"
echo ""
echo "OR use the GitHub CLI (manual input required):"
echo ""
echo "echo -n 'trickcv.com' | gh secret set SERVER_HOST --env latexServer --repo $REPO"
echo "echo -n 'root' | gh secret set SERVER_USER --env latexServer --repo $REPO"
echo "gh secret set SERVER_PASSWORD --env latexServer --repo $REPO"
echo "echo -n '22' | gh secret set SERVER_PORT --env latexServer --repo $REPO"
