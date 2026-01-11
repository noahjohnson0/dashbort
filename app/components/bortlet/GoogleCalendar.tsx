'use client';

import { useState, useEffect } from 'react';
import { Calendar, Settings, ExternalLink, Clock } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { useGoogleCalendarSettings, useSaveGoogleCalendarSettings } from '@/lib/firebase/userSettings';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  htmlLink?: string;
}

export default function GoogleCalendar() {
  const [user, loadingAuth] = useAuthState(auth);
  const [calendarSettings, loadingSettings] = useGoogleCalendarSettings(user?.uid || null);
  const [saveCalendarSettings, savingSettings, saveError] = useSaveGoogleCalendarSettings(user?.uid || null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const isConnected = !!calendarSettings?.refreshToken;
  
  // Debug logging
  useEffect(() => {
    console.log('Calendar: Connection status', {
      isConnected,
      hasSettings: !!calendarSettings,
      hasRefreshToken: !!calendarSettings?.refreshToken,
      loadingSettings,
      loadingAuth,
    });
  }, [isConnected, calendarSettings, loadingSettings, loadingAuth]);

  // Fetch events when connected
  useEffect(() => {
    if (!isConnected || !user || loadingAuth || loadingSettings) {
      console.log('Calendar: Not fetching events', { isConnected, hasUser: !!user, loadingAuth, loadingSettings });
      return;
    }

    const fetchEvents = async () => {
      setLoadingEvents(true);
      setError(null);

      try {
        // Get Firebase ID token for API authentication
        const idToken = await user.getIdToken();

        console.log('Calendar: Fetching events...');
        const response = await fetch('/api/calendar/events?maxResults=5', {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Calendar: API error', response.status, errorData);
          
          if (response.status === 401) {
            setError('Calendar not connected');
            return;
          }
          throw new Error(errorData.error || 'Failed to fetch events');
        }

        const data = await response.json();
        console.log('Calendar: Events fetched', data.events?.length || 0, 'events');
        setEvents(data.events || []);
      } catch (err) {
        console.error('Error fetching calendar events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();

    // Refresh events every 5 minutes
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isConnected, user, loadingAuth, loadingSettings]);

  const handleConnect = async () => {
    if (!user) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Get Firebase ID token
      const idToken = await user.getIdToken();

      // Get OAuth URL from API
      const response = await fetch('/api/calendar/auth', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }

      const data = await response.json();
      
      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    } catch (err) {
      console.error('Error initiating OAuth:', err);
      setError('Failed to connect to Google Calendar');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;

    setIsDisconnecting(true);
    setError(null);

    try {
      // Clear calendar settings by passing null
      await saveCalendarSettings(null);
      
      // Clear local events
      setEvents([]);
      
      // Close the dialog
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Error disconnecting calendar:', err);
      setError('Failed to disconnect Google Calendar');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const formatEventTime = (event: CalendarEvent): string => {
    if (event.start.dateTime) {
      const start = new Date(event.start.dateTime);
      const end = event.end.dateTime ? new Date(event.end.dateTime) : null;
      
      const startTime = start.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      if (end) {
        const endTime = end.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        return `${startTime} - ${endTime}`;
      }

      return startTime;
    } else if (event.start.date) {
      // All-day event
      return 'All day';
    }

    return '';
  };

  const formatEventDate = (event: CalendarEvent): string => {
    if (event.start.dateTime) {
      const date = new Date(event.start.dateTime);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      } else {
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
      }
    } else if (event.start.date) {
      const date = new Date(event.start.date);
      const today = new Date();
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      }
      
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }

    return '';
  };

  if (loadingAuth || loadingSettings) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-200 dark:border-zinc-800 w-full h-full flex flex-col">
        <div className="flex items-center justify-center h-full">
          <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-200 dark:border-zinc-800 w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 select-none">
          Calendar
        </h2>
        {isConnected && (
          <button
            onClick={() => setIsDialogOpen(true)}
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Calendar settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        )}
      </div>

      {!isConnected ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <Calendar className="h-12 w-12 text-zinc-400 dark:text-zinc-600" />
          <div className="text-center">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Connect your Google Calendar to see upcoming events
            </p>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-md font-semibold transition-colors"
            >
              {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
            </button>
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">
          {loadingEvents ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-zinc-600 dark:text-zinc-400">Loading events...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-red-600 dark:text-red-400">{error}</div>
            </div>
          ) : events.length === 0 ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-zinc-600 dark:text-zinc-400">No upcoming events</div>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex-shrink-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-3 w-3 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                        {formatEventDate(event)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1 truncate">
                      {event.summary}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {formatEventTime(event)}
                    </p>
                    {event.location && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 truncate">
                        📍 {event.location}
                      </p>
                    )}
                  </div>
                  {event.htmlLink && (
                    <a
                      href={event.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-1 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      aria-label="Open in Google Calendar"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Calendar Settings</DialogTitle>
            <DialogDescription>
              Your Google Calendar is connected. Events are synced automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              You can disconnect your Google Calendar account at any time. This will stop syncing events.
            </p>
            {saveError && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                {saveError.message || 'Failed to disconnect'}
              </p>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <button
              onClick={() => setIsDialogOpen(false)}
              className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-md font-semibold transition-colors"
              disabled={isDisconnecting}
            >
              Close
            </button>
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting || savingSettings}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-md font-semibold transition-colors"
            >
              {isDisconnecting || savingSettings ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

