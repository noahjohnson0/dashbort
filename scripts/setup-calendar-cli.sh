#!/bin/bash
# Complete CLI setup for Google Calendar integration
# Note: OAuth client creation requires Google Cloud Console (opened automatically)

set -e

PROJECT_ID="dashbort-2b417"
REDIRECT_URI="http://localhost:3000/api/calendar/callback"

echo "🚀 Google Calendar Integration Setup"
echo "===================================="
echo ""

# 1. Set project
echo "✅ Step 1: Setting project..."
gcloud config set project $PROJECT_ID --quiet

# 2. Enable Calendar API
echo "✅ Step 2: Enabling Google Calendar API..."
gcloud services enable calendar-json.googleapis.com --quiet

# 3. Get project info
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
echo "   Project ID: $PROJECT_ID"
echo "   Project Number: $PROJECT_NUMBER"
echo ""

# 4. Check if OAuth consent screen is configured
echo "✅ Step 3: Checking OAuth consent screen..."
echo "   Opening OAuth consent screen configuration..."
open "https://console.cloud.google.com/apis/credentials/consent?project=$PROJECT_ID" 2>/dev/null || true
echo "   Please configure the OAuth consent screen if not already done:"
echo "   - User Type: External"
echo "   - App name: Dashbort"
echo "   - User support email: your-email@example.com"
echo "   - Scopes: Add 'https://www.googleapis.com/auth/calendar.readonly'"
echo "   - Test users: Add your email if needed"
echo ""

# 5. Create OAuth client (opens console)
echo "✅ Step 4: Creating OAuth 2.0 Client..."
echo "   Opening OAuth client creation page..."
OAUTH_URL="https://console.cloud.google.com/apis/credentials/oauthclient?project=$PROJECT_ID"
open "$OAUTH_URL" 2>/dev/null || true
echo ""
echo "   In the browser, create a new OAuth 2.0 Client ID:"
echo "   - Application type: Web application"
echo "   - Name: Dashbort Calendar Integration"
echo "   - Authorized redirect URIs: $REDIRECT_URI"
echo "   - Click 'Create'"
echo "   - Copy the Client ID and Client Secret"
echo ""

# 6. Create .env.local with template
echo "✅ Step 5: Creating environment file template..."
cat > .env.local.example << 'ENVEOF'
# Google Calendar OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_from_console
GOOGLE_CLIENT_SECRET=your_client_secret_from_console
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dashbort-2b417
ENVEOF

echo "   Created .env.local.example"
echo ""

# 7. Summary
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Complete OAuth consent screen configuration (if not done)"
echo "   2. Create OAuth 2.0 Client ID in the browser"
echo "   3. Copy Client ID and Secret"
echo "   4. Create .env.local file:"
echo "      cp .env.local.example .env.local"
echo "   5. Edit .env.local and add your Client ID and Secret"
echo "   6. Run: npm run dev"
echo ""
echo "🔗 Useful Links:"
echo "   - OAuth Consent: https://console.cloud.google.com/apis/credentials/consent?project=$PROJECT_ID"
echo "   - OAuth Clients: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo "   - Calendar API: https://console.cloud.google.com/apis/api/calendar-json.googleapis.com/overview?project=$PROJECT_ID"
echo ""


