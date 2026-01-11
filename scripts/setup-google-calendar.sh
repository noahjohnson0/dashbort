#!/bin/bash
# Setup Google Calendar integration for Dashbort via CLI

set -e

PROJECT_ID="dashbort-2b417"
REDIRECT_URI_DEV="http://localhost:3000/api/calendar/callback"
REDIRECT_URI_PROD=""  # Set this for production

echo "🚀 Setting up Google Calendar integration for $PROJECT_ID"
echo ""

# Set the project
echo "📋 Setting active project..."
gcloud config set project $PROJECT_ID

# Enable Calendar API
echo "📅 Enabling Google Calendar API..."
gcloud services enable calendar-json.googleapis.com

# Get project number (needed for OAuth consent screen)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
echo "✅ Project Number: $PROJECT_NUMBER"

# Check OAuth consent screen status
echo ""
echo "🔐 Checking OAuth consent screen configuration..."
CONSENT_SCREEN=$(gcloud alpha iap oauth-brands list 2>/dev/null || echo "")

if [ -z "$CONSENT_SCREEN" ]; then
    echo "⚠️  OAuth consent screen needs to be configured."
    echo "   This requires the Google Cloud Console."
    echo ""
    echo "   Opening OAuth consent screen configuration..."
    echo "   URL: https://console.cloud.google.com/apis/credentials/consent?project=$PROJECT_ID"
    open "https://console.cloud.google.com/apis/credentials/consent?project=$PROJECT_ID" 2>/dev/null || \
    echo "   Please visit: https://console.cloud.google.com/apis/credentials/consent?project=$PROJECT_ID"
else
    echo "✅ OAuth consent screen is configured"
fi

echo ""
echo "🔑 Creating OAuth 2.0 Client ID..."
echo ""
echo "⚠️  Note: OAuth 2.0 client creation requires the Google Cloud Console."
echo "   Opening credentials page with pre-filled values..."
echo ""

# Create direct link to OAuth client creation
OAUTH_URL="https://console.cloud.google.com/apis/credentials/oauthclient?project=$PROJECT_ID"

echo "📝 Please complete the following in the browser:"
echo "   1. Application type: Web application"
echo "   2. Name: Dashbort Calendar Integration"
echo "   3. Authorized redirect URIs:"
echo "      - $REDIRECT_URI_DEV"
if [ ! -z "$REDIRECT_URI_PROD" ]; then
    echo "      - $REDIRECT_URI_PROD"
fi
echo ""
echo "   Opening browser..."
open "$OAUTH_URL" 2>/dev/null || echo "   Please visit: $OAUTH_URL"
echo ""

# Wait for user to create credentials
echo "⏳ After creating the OAuth client, press Enter to continue..."
read -r

# Try to list OAuth clients (may not work without proper API access)
echo ""
echo "📋 Attempting to retrieve OAuth client credentials..."
echo "   (This may require additional permissions)"

# Get the client ID and secret
echo ""
echo "🔍 To get your Client ID and Secret:"
echo "   1. Go to: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo "   2. Click on 'Dashbort Calendar Integration'"
echo "   3. Copy the Client ID and Client Secret"
echo ""

# Create .env.local template
echo "📝 Creating .env.local template..."
cat > .env.local.template << EOF
# Google Calendar OAuth Configuration
# Add these values from the Google Cloud Console
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=$REDIRECT_URI_DEV

# Firebase Configuration (if not already set)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$PROJECT_ID
EOF

echo "✅ Created .env.local.template"
echo ""
echo "📋 Next steps:"
echo "   1. Copy Client ID and Secret from Google Cloud Console"
echo "   2. Copy .env.local.template to .env.local"
echo "   3. Fill in the GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
echo "   4. Start your development server: npm run dev"
echo ""
echo "✅ Google Calendar API is enabled and ready!"


