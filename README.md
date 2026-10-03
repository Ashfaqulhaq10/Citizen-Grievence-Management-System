# Samasya Nivaran — Citizen Grievance Management System

Samasya Nivaran is a full-stack web application for reporting and managing civic issues. Citizens can submit location-aware complaints and supporting media, while officers can review assigned complaints and update their status.

## Features

- Citizen sign-in using email one-time passcodes (OTP)
- Complaint submission with category, description, area details, and map location
- Optional photo, audio, or video evidence uploads
- Personal complaint history and area-based complaint search
- Map and heatmap views for submitted issues
- Officer sign-in and department-based complaint management
- Complaint status updates and resolution-photo uploads
- English and Tamil interface
- Responsive interface for desktop and mobile

## Technology stack

**Frontend:** React 18, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS, Radix UI, Leaflet / React Leaflet  
**Backend:** Node.js, Express 5, TypeScript  
**Database:** MySQL, accessed through `mysql2`  
**Authentication and supporting services:** JWT, bcryptjs, Nodemailer, Multer  
**Validation and testing:** Zod, Vitest  
**Deployment configuration:** Netlify

## Requirements

- Node.js 20.19+ or 22.12+
- pnpm
- MySQL server

## Getting started

1. Clone the repository and enter the project directory:

   ```bash
   git clone https://github.com/Ashfaqulhaq10/Citizen-Grievence-Management-System.git
   cd Citizen-Grievence-Management-System
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Create a MySQL database for the application.

4. Create a `.env` file in the project root and set the required configuration:

   ```env
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=your_mysql_user
   MYSQL_PASSWORD=your_mysql_password
   MYSQL_DATABASE=your_database_name

   JWT_SECRET=replace_with_a_long_random_secret
   SERVER_PORT=5000

   SMTP_HOST=your_smtp_host
   SMTP_PORT=587
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password
   SMTP_FROM=your_sender_email
   ```

   The server initializes the application tables when it starts. Configure SMTP credentials to enable email OTPs and notifications. Never commit `.env` or publish real credentials; use your deployment provider's environment-variable settings for hosted deployments.

5. Start the frontend and backend in development mode:

   ```bash
   pnpm dev
   ```

   Vite serves the frontend at `http://localhost:5173` and proxies API and upload requests to the Express server at `http://localhost:5000`.

## Available scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Vite frontend and Express backend in watch mode |
| `pnpm dev:frontend` | Start only the Vite frontend |
| `pnpm dev:server` | Start only the Express backend in watch mode |
| `pnpm build` | Build the frontend and backend |
| `pnpm start` | Start the production server |
| `pnpm typecheck` | Run the TypeScript compiler |
| `pnpm test` | Run the Vitest test suite |

## Application structure

```text
client/                 React application, pages, components, and styles
  pages/                Citizen and officer pages
  components/           Shared layout and UI components
  hooks/                Client-side hooks
server/                 Express application, API routes, and database setup
  routes/               Authentication, complaint, admin, and officer APIs
  middleware/           Authentication middleware
  utils/                Email services and supporting utilities
shared/                 Types shared between client and server
netlify/                Netlify Functions adapter for the API
```

## API overview

The Express API is mounted under `/api`. Its route groups include:

- `/api/auth` — citizen authentication
- `/api/complaints` — citizen complaint submission and retrieval
- `/api/admin` — administrative operations
- `/api/officer/auth` — officer authentication
- `/api/officer/complaints` — officer complaint management

## Deployment

The repository includes a `netlify.toml` and a Netlify Functions adapter. Configure the required database, JWT, and mail environment variables in the hosting provider. Ensure the deployment has a reachable MySQL database and persistent storage appropriate for uploaded complaint media.

