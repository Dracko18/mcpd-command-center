

# MCPD MDC — Meta City Police Department Mobile Data Computer

A browser-based police operating system for roleplay communities (GTA RP), built with React + Supabase.

---

## Phase 1: MVP Core System

### 1. Window Manager & Desktop OS
- Desktop with a dark, professional police-themed wallpaper
- Bottom taskbar showing open apps and a clock
- App launcher menu (like a Start menu)
- Draggable, resizable windows with minimize/maximize/close
- Window focus management (click to bring to front)
- SVG icons only throughout the entire UI

### 2. Login System
- Full-screen login page styled as a police terminal
- Fields: Badge Number + Password
- Supabase Auth with JWT
- First-login flow: new users (created without password) are forced to set a password on first access
- Session persistence

### 3. User & Role Management
- User profiles: full name, badge number, rank, division, status
- Roles stored in a separate `user_roles` table: Officer, Supervisor, Administrator, Internal Affairs
- Admin Panel app (admin-only):
  - Create users (name, badge, rank, division — no password)
  - Edit user rank, division, status
  - Cannot modify passwords
  - Manage divisions (Patrol, Detectives, SWAT, Internal Affairs, custom)

### 4. Subjects Database App
- Create and search subject records
- Fields: name, DOB, gender, nationality, address, phone, photo, notes
- Individual subject profile pages
- Search with autocomplete

### 5. Criminal Records App
- Create criminal records linked to a subject
- Fields: subject (autocomplete search), officer, date, crime type, description, evidence
- Records appear on the subject's profile permanently

---

## Phase 2: Extended Modules

### 6. Vehicle Registry App
- Register vehicles: plate, model, make, color, VIN
- Link to owner and/or suspect (subject records)
- Search by plate or VIN

### 7. Reports App
- Create incident reports
- Link officers, subjects, and vehicles involved
- Fields: date, location, description, evidence
- Persistent and searchable

### 8. Internal Affairs App
- Restricted to Internal Affairs role and Administrators
- Create investigation cases against officers
- Fields: investigated officer, investigator, reason, description, evidence, status
- Fully isolated from regular officer access

### 9. Settings App
- Change password
- Change desktop wallpaper
- Toggle dark/light mode
- Personal visual preferences saved per user

### 10. MCPD AI Assistant
- Chat-based AI assistant using Lovable AI (Gemini)
- Help officers search records, summarize cases, get procedure guidance
- Accessible as a window app on the desktop
- Streaming responses in a chat interface

---

## Design & UX
- Dark professional theme inspired by real police MDC systems and Windows 11
- Monospace/tactical font accents for the police terminal feel
- Color scheme: dark navy/charcoal background, blue accent highlights, white text
- All icons are SVG — no emojis
- Responsive but primarily desktop-focused (MDC terminals are desktops)

## Database Architecture
- `users` / `profiles` — officer information
- `user_roles` — role-based access (separate table)
- `divisions` — police divisions
- `subjects` — civilian/suspect database
- `criminal_records` — linked to subjects
- `vehicles` — vehicle registry linked to subjects
- `reports` — incident reports with multi-entity relationships
- `internal_affairs_cases` — restricted investigation records
- `user_settings` — per-user preferences

## Security
- Supabase Auth with JWT
- Row Level Security (RLS) on all tables
- Role-based access via `has_role()` security definer function
- Internal Affairs data isolated by role
- Password hashing handled by Supabase Auth
- Input validation with Zod on all forms

