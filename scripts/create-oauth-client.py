#!/usr/bin/env python3
"""
Create OAuth 2.0 client credentials for Google Calendar integration
Requires: pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
"""

import json
import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

def create_oauth_client(project_id, client_name, redirect_uris):
    """Create an OAuth 2.0 client for the project."""
    
    # Try to use application default credentials
    try:
        credentials = service_account.Credentials.from_service_account_file(
            None,  # Will use GOOGLE_APPLICATION_CREDENTIALS env var
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
    except:
        print("Error: Could not load service account credentials.")
        print("Please set GOOGLE_APPLICATION_CREDENTIALS or use gcloud auth application-default login")
        sys.exit(1)
    
    try:
        # Use the IAM Service Account Credentials API
        # Note: OAuth client creation typically requires the Google Cloud Console
        # This script attempts to use the API, but may need console setup first
        
        service = build('iam', 'v1', credentials=credentials)
        
        print("Note: OAuth 2.0 client creation via API is limited.")
        print("You may need to create credentials via the Google Cloud Console:")
        print(f"  https://console.cloud.google.com/apis/credentials?project={project_id}")
        print("\nAlternatively, you can use the gcloud command with the console API.")
        
        return None
        
    except HttpError as error:
        print(f"Error creating OAuth client: {error}")
        return None

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python create-oauth-client.py <project-id> [redirect-uri...]")
        print("Example: python create-oauth-client.py dashbort-2b417 http://localhost:3000/api/calendar/callback")
        sys.exit(1)
    
    project_id = sys.argv[1]
    redirect_uris = sys.argv[2:] if len(sys.argv) > 2 else [
        'http://localhost:3000/api/calendar/callback'
    ]
    
    create_oauth_client(project_id, 'Dashbort Calendar Integration', redirect_uris)


