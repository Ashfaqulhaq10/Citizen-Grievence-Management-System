# Officer Portal - Implementation Guide

## Overview
The Officer Portal is a secure dashboard for municipal staff to manage citizen complaints, update status, and provide resolution documentation.

## 🚀 Features Implemented

### 1. Officer Authentication
- **Endpoint**: `POST /api/officer/auth/login`
- **Features**:
  - Email + Password authentication
  - JWT token-based sessions
  - Role-based access control (Admin, Officer)
  - Secure password hashing with bcryptjs

**Default Test Credentials**:
```
Admin Officer: admin@samasya.gov / admin123
PWD Officer: pwd@samasya.gov / pwd123
Water Officer: water@samasya.gov / water123
Sanitation Officer: sanitation@samasya.gov / sanitation123
Electricity Officer: electricity@samasya.gov / electricity123
```

### 2. Officer Dashboard
- **Route**: `/officer-dashboard`
- **Features**:
  - View complaints assigned to officer's department
  - Real-time complaint statistics
  - Status filtering (Pending, In Progress, Completed)
  - Complaint detail view with full information
  - Quick status updates
  - Photo upload for resolutions
  - Auto-refresh every 10 seconds

### 3. Complaint Management
- **Update Status**: Change complaint status with one click
- **Upload Resolution Photo**: Add proof photo when marking as completed
- **View Submission Photos**: See original citizen submission photos
- **Department Filtering**: Auto-filtered by officer's department
- **Real-time Notifications**: Citizen receives email on status changes

### 4. Email Notifications
- **Status Updates**: Citizens notified when complaint status changes
- **Resolution Proof**: Citizens see resolution photos and updates
- **Officer Assignment**: Officers notified when new complaints assigned
- **SMTP Configuration**: Supports any SMTP provider

**Required Environment Variables**:
```
SMTP_HOST=your-smtp-host.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=no-reply@samasya.gov
APP_URL=https://your-app-url.com
```

## 📁 File Structure

### Backend Routes
```
server/routes/
├── officer-auth.ts          # Login, registration, authentication
└── officer-complaints.ts     # Complaint management endpoints
```

### Frontend Pages
```
client/pages/
├── OfficerLogin.tsx         # Officer login page
└── OfficerDashboard.tsx     # Main dashboard
```

### Utilities
```
server/utils/
├── email-service.ts         # Email notifications
└── ../seed-officers.ts      # Database seeding
```

## 🔌 API Endpoints

### Authentication
```
POST /api/officer/auth/login
GET /api/officer/auth/me
POST /api/officer/auth/register
```

### Complaints
```
GET /api/officer/complaints/assigned       # List assigned complaints
GET /api/officer/complaints/:id            # Get complaint details
PATCH /api/officer/complaints/:id/status   # Update status (sends email)
POST /api/officer/complaints/:id/resolve   # Mark resolved + upload photo
GET /api/officer/complaints/heatmap/data   # Get heatmap data for officer's zone
```

## 🗄️ Database Schema

### Officers Table
```sql
CREATE TABLE officers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'officer',
  department VARCHAR(100),
  area VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Complaints Table (Updated)
```sql
ALTER TABLE complaints 
ADD COLUMN assigned_officer_id INT,
ADD COLUMN status VARCHAR(20) DEFAULT 'pending',
ADD FOREIGN KEY (assigned_officer_id) REFERENCES officers(id) ON DELETE SET NULL;
```

## 🔐 Security Features

1. **Password Security**: Passwords hashed with bcrypt (10 salt rounds)
2. **JWT Tokens**: Token-based authentication for stateless sessions
3. **Role-Based Access Control**: Officers can only see complaints in their department
4. **Protected Routes**: All officer routes require valid JWT token
5. **Email Verification**: Citizen notifications via email
6. **HTTPS Ready**: Supports SSL/TLS in production

## 🌱 Database Seeding

To populate default officers:

```bash
npx ts-node server/seed-officers.ts
```

This creates 5 test officers:
- 1 Admin Officer (General)
- 4 Department Officers (PWD, Water, Sanitation, Electricity)

## 📧 Email Service Integration

The system supports SMTP-based email notifications:

1. **Status Change Emails**: Sent to citizen when officer updates complaint
2. **Assignment Emails**: Sent to officer when new complaint assigned
3. **Demo Mode**: Logs email content to console if SMTP not configured

### Supported Email Providers
- Gmail (with app-specific password)
- AWS SES
- SendGrid
- Any standard SMTP server

### Email Templates
- Complaint status update notification
- Officer assignment notification
- Resolution completion notification

## 🧪 Testing Workflow

1. **Citizen Login**: Go to home page, use OTP login with any email
2. **Submit Complaint**: Fill form with category, description, location, photo
3. **Officer Login**: Visit `/officer-login`, use test credentials
4. **View Complaints**: Dashboard shows all complaints in officer's department
5. **Update Status**: Click complaint → select new status → email sent to citizen
6. **Add Resolution Photo**: Upload proof photo when marking as resolved
7. **Citizen Follow-up**: Citizen can see updated status on their dashboard

## 📊 Status Flow

```
Pending → In Progress → Completed
                ↓
        (Officer uploads resolution photo)
        (Citizen receives completion email)
```

## 🎯 Future Enhancements

- [ ] Automatic complaint assignment based on location
- [ ] Complaint escalation if not resolved in time
- [ ] Mobile app for officers
- [ ] Real-time push notifications
- [ ] Analytics dashboard
- [ ] Custom work schedules per officer
- [ ] Team management (multiple officers per department)
- [ ] Priority-based complaint queuing
- [ ] Integration with mapping APIs for route optimization

## 🐛 Troubleshooting

### Officers Table Not Created
- Check MySQL credentials in `.env`
- Run: `npx ts-node server/seed-officers.ts`
- Verify table exists: `SHOW TABLES;`

### Login Fails
- Verify `jwt_secret` is set in environment
- Check `officer@demo.com` exists in database
- Review server logs for errors

### Emails Not Sending
- Check SMTP configuration in `.env`
- Verify SMTP credentials are correct
- Check firewall/port access for SMTP
- Test with: `sendmail test@example.com`

### Photos Not Uploading
- Verify `/uploads` directory exists and has write permissions
- Check file size limits
- Verify officer has permission to upload

## 📱 Mobile Responsive

The officer dashboard is fully responsive:
- Desktop: Full statistics + 2-column layout
- Tablet: Stacked layout with scrolling
- Mobile: Single column, touch-friendly buttons

## 🔄 Real-time Updates

The dashboard auto-refreshes every 10 seconds to show latest complaints and status updates.

## 📞 Support

For issues or questions:
1. Check server logs: `console.log` output
2. Verify environment variables
3. Check database connectivity
4. Review email service logs

---

**Version**: 1.0
**Last Updated**: 2024
**Status**: Production Ready ✅
