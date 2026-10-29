# CatchUp - Product Design Document

**Status**: MVP Design Complete  
**Last Updated**: 2026-10-27  
**Version**: 1.0

---

## Executive Summary

**CatchUp** is a social media app for small family groups to share real-time daily updates and catch up on what everyone has been doing. It solves the problem of information scattered across WhatsApp by centralizing family activities in a dedicated, organized platform with searchable timelines.

**Target Users**: Small family groups (5-20 people)  
**Platform**: Progressive Web App (PWA) / Responsive Web App, mobile-first  
**MVP Launch Goal**: Real-time daily sharing + catch-up queue

---

## Problem Statement

Families currently share updates through WhatsApp, but:
- Posts get lost in conversations
- Media is scattered across device galleries
- No organized way to see "what has someone been up to"
- Missing context when catching up after a busy day

---

## Solution Overview

CatchUp provides:
1. **Daily posting windows** (3x per day) for real-time family updates
2. **Catch-up queue** of missed posts organized by friend
3. **Friend timelines** as searchable 30-day collections
4. **Real-time sharing** with live updates during active windows

---

## Core Features

### 1. Authentication & Groups

#### Sign Up Flow
- Phone number + SMS verification
- Join group via reusable invite code
- Set profile: display name + profile picture (upload or camera)
- Ready to post

#### Group Management
- **Groups are the primary organizing unit**
- Admin can:
  - Remove members from group
  - Adjust posting window times (e.g., 8-9 AM → 8-10 AM)
  - Generate reusable invite codes
- **No individual "follow" mechanics** — all group members are auto-friends
- Users can be in multiple groups simultaneously
- Group names are required

### 2. Posting & Real-Time Sharing

#### Posting Windows
- **3 daily windows** per group: Morning, Afternoon, Evening
- **Fixed times** (e.g., 8-9 AM, 1-2 PM, 7-8 PM)
- **User's local timezone** — each user posts in their own timezone
- Admin can adjust window times per group, but timezone is always individual

#### Posting Mechanics
- **1 post per user per window** (strict cutoff at window end)
- **Up to 5 items per post** (mix of photos, videos, captions in any order, min 1)
- **Photo specs**: Auto-compressed, max 5MB per photo
- **Video specs**: Max 30 seconds, auto-compressed, max 20MB per video
- **Edit window**: 10 minutes after initial upload
  - User can reorder items, delete items, add new items
  - Full carousel preview before final submit
- **Once submitted**: Post is permanently locked (no deletion, no editing)

#### Real-Time Experience
- Live updates during active posting window (polling every 5-10 seconds)
- Carousel display with swipe between items
- Auto-play muted video + unmute button
- Show exact timestamp (e.g., 2:45 PM, not just "evening window")
- View count badge (e.g., 👁️ 4 viewed) — no individual viewing status

### 3. Catch-Up Queue

#### Queue Mechanics
- **Auto-populates at midnight** for any posts you missed that day
- **Organized by friend name** (grouped alphabetically or chronologically)
- **All groups mixed in one queue** (no per-group separation)
- Each post shows which group it's from (for multiple group context)
- **Auto-clear when viewed** — no manual dismiss needed

#### Queue Notifications
- **Push notification next morning** (not midnight, respects sleep)
- **Badge count** on home icon showing number of queued posts
- **SMS fallback** if push notifications unavailable
- Users can toggle notifications on/off (basic toggle, no granular scheduling in MVP)

### 4. Friend Timelines & Collections

#### Accessing Friend Timeline
- Click friend name/avatar in queue
- Shows all their posts from past 30 days
- **Sorted newest first** (reverse chronological)
- **All posts across all shared groups** (combined view)
- Same carousel display as daily posts

#### Browsing Experience
- Can browse multiple friends' timelines in sequence
- Back to queue at any time
- Shows friend's name, picture, exact timestamps

### 5. Data Persistence & Retention

- **30-day retention period**
- **Hard delete after 30 days** (no archive, no soft-delete recovery)
- Keeps storage lean, enforces ephemeral nature of daily updates
- Offline caching: Users can view cached posts without internet; queue syncs when reconnected

### 6. User Profiles

- **Display name**: User can edit (show nickname if desired)
- **Profile picture**: User can set (upload or take with camera)
- **No bio/status in MVP** — just name and picture

---

## Information Architecture

### Navigation Structure

```
Home/Groups
├── Group 1
│   ├── Daily Posts (today's window)
│   ├── Member List
│   └── Catch-Up Queue
│       ├── Friend 1
│       │   ├── View Friend Timeline (30-day archive)
│       │   └── Back to Queue
│       └── Friend 2 → ...
├── Group 2 → ...
└── Settings
    ├── Edit Profile (name, picture)
    ├── Notifications (on/off)
    └── Account Settings
```

### Main Views

1. **Groups List** (primary nav) — all groups user is member of
2. **Group View** — daily posts from current window + member list
3. **Catch-Up Queue** — missed posts grouped by friend
4. **Friend Timeline** — 30-day collection of friend's posts
5. **Settings** — profile, notifications, account

---

## Technical Specifications

### Platform
- **Type**: Progressive Web App (PWA) with fallback to standard responsive web app
- **Primary Target**: Mobile web (phone browsers)
- **Browsers**: Modern browsers only (Chrome, Safari, Firefox, Edge — latest 2 versions)
- **No legacy support** (no IE)

### Architecture
- **Real-time sync**: Polling every 5-10 seconds during active posting window
- **Offline**: Cache recent posts for offline viewing; sync queue when online
- **Accessibility**: WCAG 2.1 Level A (alt text, keyboard nav, color contrast)

### Data Management
- **Authentication**: Phone + SMS verification
- **Timezone**: Device timezone (immediate adjustment when user travels)
- **Notifications**:
  - Push notification (preferred) or SMS fallback
  - Sent next morning (not midnight)
  - Basic on/off toggle
- **Rate Limiting**: 1 post per user per window (enforced by window closing)
- **File Size Limits**:
  - 5MB max per photo (auto-compressed)
  - 20MB max per video (auto-compressed, max 30 sec)
- **Post Upload Failure**: Show error, user manually retries
- **Timezone Handling**: Fixed window times (e.g., 8-9 AM) in user's local timezone

### User Experience
- **Edit Window**: 10 minutes to revise post before final submit
- **Preview**: Full carousel preview showing how post will appear to friends
- **Empty State**: During closed windows, show previous day's posts + countdown to next window
- **Help**: Basic in-app tooltips on first use (queue explanation, carousel controls, timer)
- **Group Members**: View member list in group view
- **Member Archival**: When user leaves group, account marked as archived (can't post, but posts stay visible); user can rejoin and resume posting

---

## Post Structure Example

**Post with 5 items:**
```
Item 1: Photo (morning coffee)
Item 2: Caption "Great start to the day!"
Item 3: Video (10-second work meeting)
Item 4: Photo (lunch setup)
Item 5: Caption "Productive afternoon"
```

Displays as carousel — user swipes through each item.

---

## Notification Flow

```
Day:
8-9 AM (Window 1): Friend A posts → You miss it
1-2 PM (Window 2): Friend B posts → You see live update
7-8 PM (Window 3): Friend C posts → You miss it

Midnight: Queue populates with posts from Friends A & C

Next Morning (8 AM):
→ Push notification: "You have 2 new posts to catch up on"
→ Badge on home icon shows "2"
→ User opens app → sees queue organized by friend

User views Friend A's post → clears from queue
User views Friend C's post → clears from queue
Queue now empty → can browse any friend's timeline
```

---

## Constraints & Assumptions

### MVP Scope Locked
- ✅ Real-time daily posting (3 windows)
- ✅ Catch-up queue (missed posts)
- ✅ Friend timelines (30-day archive)
- ✅ Group management (admin controls)
- ❌ Comments/reactions (post-MVP)
- ❌ Search posts (post-MVP)
- ❌ Group timelines (post-MVP, only friend timelines in MVP)
- ❌ Share posts outside app (post-MVP)
- ❌ Multiple admins per group (post-MVP)
- ❌ Analytics dashboard (post-MVP)

### Data Constraints
- **30-day retention**: Hard delete, no recovery
- **1 post per window**: Not configurable
- **Max 5 items per post**: Firm limit
- **Max 30 sec video**: Firm limit
- **Timezone**: Always device timezone (not customizable by user)

### Performance Targets (MVP)
- Mobile-optimized load times
- Smooth carousel swiping
- Real-time updates every 5-10 seconds
- Offline cached posts load immediately

---

## Security & Privacy

- **Phone + SMS auth**: Standard verification flow
- **No end-to-end encryption** in MVP (server-side storage)
- **Posts visible to group members only** — no public profiles
- **GDPR compliance**: 30-day auto-delete enforces data minimization
- **No tracking/analytics** collected in MVP (future feature)

---

## Future Features (Post-MVP)

1. **Reactions & Comments** — interact with posts after viewing
2. **Group Timelines** — see all posts from entire group in one view
3. **Search** — search posts by friend, date, keyword
4. **Granular Notifications** — quiet hours, per-group settings
5. **Photo Filters** — basic filters during posting
6. **Direct Messages** — 1:1 chat (outside groups)
7. **Stories** — ephemeral content (disappears after 24 hours)
8. **Shared Albums** — curated collections for events
9. **Analytics** — understand posting patterns, trends
10. **Integrations** — sync with photo libraries, calendar

---

## Success Metrics (MVP)

- Users return daily during posting windows
- Catch-up queue used by 80%+ of active users
- Average session time during window: 5+ minutes
- Friend timeline browsing: 30%+ of users per week
- Offline caching: 20%+ of views from cached content

---

## Open Questions (Resolved)

- ✅ Timezone handling → Device timezone, immediate adjustment
- ✅ Post permanence → Locked after 10-min edit window
- ✅ Queue organization → By friend name, all groups mixed
- ✅ Edit window duration → 10 minutes
- ✅ File compression → Auto-compress with size limits
- ✅ Real-time mechanism → Polling 5-10 seconds
- ✅ Data deletion → Hard delete after 30 days

---

## Glossary

- **Window**: 1-hour posting period (e.g., 8-9 AM)
- **Queue**: Catch-up feed of missed daily posts
- **Friend Timeline**: 30-day collection of one person's posts
- **Carousel**: Swipeable view of post items
- **Group**: Collection of family members posting together
- **Archived User**: Member who left group (marked in system, posts remain visible)

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-10-27 | Initial design complete after grilling session |

