import nodemailer from 'nodemailer';

let transporter: any = null;

export const initializeEmailService = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) {
    console.log('[EMAIL] ⚠️ SMTP not configured. Emails will be logged instead.');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      } : undefined,
    });

    console.log('[EMAIL] ✓ Email service initialized');
    return transporter;
  } catch (error) {
    console.error('[EMAIL] ✗ Failed to initialize email service:', error);
    return null;
  }
};

export const sendComplaintNotification = async (
  userEmail: string,
  complaintId: number,
  status: string,
  complaintDetails?: {
    category?: string;
    description?: string;
    location?: string;
  }
) => {
  if (!transporter) {
    console.log(`[EMAIL] (Demo) Would send ${status} notification to ${userEmail} for complaint #${complaintId}`);
    return true;
  }

  try {
    const statusMessages = {
      pending: 'Your complaint has been registered',
      'in progress': 'Your complaint is being worked on',
      completed: 'Your complaint has been resolved',
    };

    const message = statusMessages[status as keyof typeof statusMessages] || `Complaint status updated to ${status}`;

    const emailContent = `
      <h2>Complaint Status Update</h2>
      <p>Dear Citizen,</p>
      <p>${message}</p>
      <h3>Complaint Details:</h3>
      <ul>
        <li><strong>ID:</strong> #${complaintId}</li>
        <li><strong>Category:</strong> ${complaintDetails?.category || 'N/A'}</li>
        <li><strong>Description:</strong> ${complaintDetails?.description || 'N/A'}</li>
        <li><strong>Location:</strong> ${complaintDetails?.location || 'N/A'}</li>
        <li><strong>Status:</strong> ${status.toUpperCase()}</li>
      </ul>
      <p>
        <a href="${process.env.APP_URL || 'http://localhost:5000'}/#/complaints">
          View your complaints
        </a>
      </p>
      <p>Thank you for helping keep our community clean!</p>
      <p>Samasya Nivaran Team</p>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@samasya.gov',
      to: userEmail,
      subject: `Complaint #${complaintId} - ${message}`,
      html: emailContent,
    });

    console.log(`[EMAIL] ✓ Notification sent to ${userEmail} for complaint #${complaintId}`);
    return true;
  } catch (error) {
    console.error('[EMAIL] ✗ Error sending notification:', error);
    return false;
  }
};

export const sendOfficerAssignmentEmail = async (
  officerEmail: string,
  complaintId: number,
  complaintDetails?: {
    category?: string;
    location?: string;
    district?: string;
  }
) => {
  if (!transporter) {
    console.log(`[EMAIL] (Demo) Would send assignment notification to ${officerEmail} for complaint #${complaintId}`);
    return true;
  }

  try {
    const emailContent = `
      <h2>New Complaint Assigned</h2>
      <p>A new complaint has been assigned to you.</p>
      <h3>Complaint Details:</h3>
      <ul>
        <li><strong>ID:</strong> #${complaintId}</li>
        <li><strong>Category:</strong> ${complaintDetails?.category || 'N/A'}</li>
        <li><strong>Location:</strong> ${complaintDetails?.location || 'N/A'}</li>
        <li><strong>District:</strong> ${complaintDetails?.district || 'N/A'}</li>
      </ul>
      <p>
        <a href="${process.env.APP_URL || 'http://localhost:5000'}/officer-dashboard">
          View in Officer Dashboard
        </a>
      </p>
      <p>Samasya Nivaran Team</p>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@samasya.gov',
      to: officerEmail,
      subject: `New Complaint #${complaintId} Assigned`,
      html: emailContent,
    });

    console.log(`[EMAIL] ✓ Assignment notification sent to ${officerEmail} for complaint #${complaintId}`);
    return true;
  } catch (error) {
    console.error('[EMAIL] ✗ Error sending assignment notification:', error);
    return false;
  }
};
