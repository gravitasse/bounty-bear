#!/bin/bash

# 🐻 Bounty Bear OpenClaw Skill Installer
# This script configures your local Bounty Bear client to talk to your OpenClaw gateway.

# Colors for terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐻 Bounty Bear: OpenClaw Skill Installer${NC}"
echo "------------------------------------------"

# 1. Ask for the API URL
default_url="http://127.0.0.1:8080/v1/agent/stream"
echo -e "Enter your OpenClaw or n8n Streaming URL:"
read -p "[$default_url]: " user_url
user_url=${user_url:-$default_url}

# 2. Define the target file
TARGET_FILE="openclaw/bounty-bear-client.html"

# 3. Check if file exists
if [ ! -f "$TARGET_FILE" ]; then
    echo -e "❌ Error: Could not find $TARGET_FILE"
    echo "Make sure you are running this script from the root of the bounty-bear directory."
    exit 1
fi

# 4. Inject the URL using sed
# We look for the // API_URL_PLACEHOLDER comment
sed -i "" "s|const OPENCLAW_API_URL = .*; // API_URL_PLACEHOLDER|const OPENCLAW_API_URL = \"$user_url\"; // API_URL_PLACEHOLDER|g" "$TARGET_FILE"

# 5. Success message
echo "------------------------------------------"
echo -e "${GREEN}✅ Success! Bounty Bear configured.${NC}"
echo -e "URL set to: ${BLUE}$user_url${NC}"
echo ""
echo "Next steps:"
echo "1. Double-click $TARGET_FILE to open it in your browser."
echo "2. Type a target name and watch the Bear work!"
echo ""
echo "The bear always gets his man. 🐻💰"
