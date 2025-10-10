# Skinfit Cup Management App

## Overview
This React + TypeScript + Vite application with an Express backend is designed for managing the Skinfit Cup sports event. Its primary purpose is to handle participants, events, standings, and team competitions while ensuring robust **privacy protection for sensitive address data**. The project aims to provide a comprehensive, user-friendly platform for event organizers with a focus on data security and efficient event management, including features like participant import, flexible scoring, and season finalization.

## User Preferences
- Privacy-first approach: Address data protected by default
- Only authenticated admins can view/edit sensitive information

## System Architecture
The application uses a **React (Vite, TypeScript)** frontend with **Tailwind CSS** for a responsive user interface, and an **Express.js** backend with **SQLite (better-sqlite3)** for data persistence.

**UI/UX Decisions:**
- **Color Scheme**: Dark red (`#DC2626/#B91C1C`) is used throughout the application.
- **Navigation Structure**: Dashboard removed; main categories are Reglement, Events, Strecken (Routes), and Gesamtwertung (Overall Standings). Events is the default view.
- **Mobile Responsiveness**: Sidebar optimized for mobile devices with a hamburger menu, overlay, and touch-friendly navigation. Viewport configured for pinch-to-zoom functionality.
- **PWA Support**: Implemented with Web App Manifest and Service Worker for offline functionality and installability on mobile devices. Service Worker uses cache-first strategy for GET requests only to preserve admin functionality.
- **Print Support**: Optimized layouts for printing reports (names only, no addresses).
- **Table Optimization**: Overall standings tables are designed to display all events without horizontal scrolling by rotating event headers and shortening labels, providing full event names on hover.

**Technical Implementations:**
- **Authentication**: Simple password-based admin authentication using `express-session`.
- **Data Protection**: Sensitive participant fields (email, phone, address, city, postalCode) are only visible and editable by authenticated admins; public fields (firstName, lastName, birthYear, perfClass, gender) are visible to all.
- **File Storage**: Uses Replit's Object Storage (App Storage) for permanent storage of GPX routes and Reglement PDF files. Requires `OBJECT_STORAGE_BUCKET` environment variable set to the bucket name.
- **Reglement Management**: 
    - PDF upload functionality for admins only (via Reglement view)
    - Embedded PDF viewer for all users
    - PDF files stored permanently in Replit Object Storage
    - Upload date and file size display
    - Note: Removed duplicate upload from Settings page
- **Strecken (Routes) Management**: 
    - GPX file upload, download, and delete functionality for admins
    - Interactive map viewer using Leaflet for route visualization
    - GPX files stored permanently in Replit Object Storage
    - File listing with upload dates for all users
- **Scoring System**:
    - **EZF (Individual Time Trial)**: Ranks by handicap-adjusted time; specific placement points (1-10: 8pts, 11-20: 7pts, 21-30: 6pts, 31+: 5pts) and winner bonus points (1st: +3, 2nd: +2, 3rd: +1).
    - **BZF (Hill Climb Time Trial)**: Ranks by absolute time only; same placement and winner bonus points as EZF.
    - **Drop Score Logic**: Allows dropping the lowest scores, applies after the season is closed by an admin, and requires 2+ event participations. Non-participation counts as a dropped result.
    - **Tie-Breaking**: For overall standings, ties are broken by comparing best individual results, then second best, and so on, with alphabetical sorting as a fallback.
- **Event Management**: Supports various event types, including admin-only class-specific notes stored as JSON.
- **Season Management**: Admins can close and finalize seasons, which enables drop score calculations.
- **Settings Persistence**: All application configurations are stored in the database.

**System Design Choices:**
- **Database Schema**: Includes tables for `participants`, `events`, `results`, `teams`, `team_members`, and `settings`.
- **API Design**: RESTful API for all data operations with endpoints for authentication, participants, events, settings, and strecken (routes), protected by admin authentication where necessary.
- **ID Generation**: All entity IDs (participants, events) are auto-generated server-side to prevent UNIQUE constraint errors and ID collisions from cached frontend data.
- **File Management**: GPX route files stored in /public/gpx directory with Express static middleware serving at /gpx endpoint.
- **CORS**: Enabled for seamless frontend-backend communication.
- **Cache Control**: Production mode uses strict no-cache headers for HTML/JS/CSS to prevent service worker caching issues.

## External Dependencies
- **React**: Frontend library.
- **TypeScript**: Superset of JavaScript for type safety.
- **Vite**: Build tool for frontend development.
- **Tailwind CSS**: Utility-first CSS framework (via CDN).
- **PapaParse**: Used for CSV parsing.
- **SheetJS**: Used for Excel file handling.
- **Leaflet**: Interactive map library for GPX route visualization (via CDN in gpx-viewer.html).
- **Express.js**: Backend web framework.
- **better-sqlite3**: SQLite database driver.
- **express-session**: Middleware for session management.
- **multer**: Middleware for handling file uploads (GPX files).
- **CORS**: Middleware for enabling Cross-Origin Resource Sharing.