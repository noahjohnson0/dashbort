# Product Requirements Document: Dashbort

## Product Vision

Dashbort is a single pane of glass for users' lives. All things visible at the same time in a single webpage, providing a unified dashboard that consolidates essential information and tools in one place.

## Product Overview

Dashbort is a personal dashboard application that aggregates key life metrics, timers, and information into a single, always-visible interface. The goal is to eliminate context switching and provide users with immediate access to the most important information about their day.

## Target Users

- Professionals who want to track work hours and personal metrics
- Individuals seeking a unified view of their daily life
- People who want to monitor health metrics (like pushups) alongside time-based information

## Core Features

### 1. Work Timer
**Description**: A countdown timer (Work Day Countdown) showing hours until work is over.

**Requirements**:
- Default countdown: 8 hours
- Customizable duration (user-configurable)
- Real-time countdown display
- Visual indicator of time remaining
- Format: "X hours Y minutes until work is over" or similar

**User Stories**:
- As a user, I want to see how much time is left in my workday
- As a user, I want to customize my workday duration
- As a user, I want the timer to persist across page refreshes

### 2. Pushup Counter
**Description**: A counter to track daily pushup exercises.

**Requirements**:
- Increment/decrement buttons
- Reset functionality (daily reset option)
- Display current count
- Optional: Daily goal setting
- Optional: Historical tracking

**User Stories**:
- As a user, I want to track my daily pushups
- As a user, I want to easily increment my pushup count
- As a user, I want to see my progress throughout the day

### 3. Sunrise and Sunset
**Description**: Display sunrise and sunset times for the user's location.

**Requirements**:
- Automatic location detection (or manual location setting)
- Display current day's sunrise time
- Display current day's sunset time
- Update automatically based on location
- Optional: Visual indicator (day/night status)
- Optional: Time until next sunrise/sunset

**User Stories**:
- As a user, I want to know when the sun rises and sets today
- As a user, I want this information to update based on my location
- As a user, I want to see if it's currently day or night

## Technical Requirements

### Technology Stack
- **Frontend**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication, Storage, Functions)
- **Language**: TypeScript

### Data Storage
- User preferences (work hours, location) stored in Firebase Firestore
- Pushup counts stored in Firestore with date tracking
- User authentication for personalized dashboards

### Performance Requirements
- Page load time: < 2 seconds
- Real-time updates for timers
- Responsive design for desktop and mobile

## User Interface Requirements

### Layout
- Single page application
- All widgets visible simultaneously
- Responsive grid layout
- Clean, minimal design
- Dark mode support (optional)

### Widget Organization
- Work Timer: Prominent placement (top or center)
- Pushup Counter: Easy access for quick updates
- Sunrise/Sunset: Weather/time context area

## Future Enhancements (Backlog)

- Weather widget
- Calendar integration
- Task list
- Habit tracker
- Customizable widget layout
- Multiple dashboard views
- Widget themes/customization
- Data export/analytics
- Notifications/reminders
- Integration with fitness apps

## Success Metrics

- User engagement: Daily active users
- Feature usage: Which widgets are most used
- User retention: Weekly/monthly active users
- Performance: Page load times, timer accuracy

## Out of Scope (v1)

- Multi-user dashboards
- Widget marketplace
- Third-party integrations (beyond basic location services)
- Mobile app (web-first)
- Advanced analytics dashboard

## Technical Constraints

- Must work in modern browsers
- Must support offline functionality for timers (localStorage fallback)
- Must respect user privacy (location data)
- Must be performant on low-end devices

## Acceptance Criteria

### Work Timer
- [ ] Timer counts down from customizable hours (default 8)
- [ ] Timer persists across page refreshes
- [ ] User can set custom work duration
- [ ] Timer displays in clear, readable format

### Pushup Counter
- [ ] User can increment pushup count
- [ ] User can decrement pushup count
- [ ] Count persists in database
- [ ] Daily reset option available

### Sunrise/Sunset
- [ ] Displays accurate sunrise time for user's location
- [ ] Displays accurate sunset time for user's location
- [ ] Updates automatically based on location
- [ ] Handles location permission gracefully

## Notes

- All features should be visible on a single page without scrolling (desktop)
- Mobile view may require scrolling but should maintain single-page philosophy
- Consider using Firebase for real-time updates and data persistence
- Location services should request permission appropriately

