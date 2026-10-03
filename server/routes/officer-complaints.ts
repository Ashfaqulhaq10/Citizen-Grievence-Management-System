import express, { Response } from 'express';
import db from '../db';
import multer from 'multer';
import path from 'path';
import { protectOfficer, OfficerRequest } from './officer-auth';
import { isDemoMode } from '../env';
import { sendComplaintNotification } from '../utils/email-service';

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.use(protectOfficer);

router.get('/assigned', (req: OfficerRequest, res: Response) => {
  const officerId = req.officer?.id;
  const department = req.officer?.department;

  if (!officerId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (isDemoMode()) {
    const demoComplaints = [
      {
        id: 1,
        category: 'PWD',
        description: 'Broken road on Main Street causing traffic congestion and safety hazards',
        location_text: 'Main Street, City Center',
        district: 'Central',
        city: 'City',
        village: null,
        status: 'pending',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        user_email: 'citizen@example.com',
        user_name: 'John Doe',
        media_url: '/uploads/demo1.jpg',
        resolution_photo_url: null,
        lat: 28.6139,
        lng: 77.2090,
      },
      {
        id: 2,
        category: 'Water',
        description: 'Water pipe burst causing water wastage and flooding on residential area',
        location_text: 'Oak Avenue, Residential Zone',
        district: 'North',
        city: 'City',
        village: null,
        status: 'in progress',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        user_email: 'resident@example.com',
        user_name: 'Jane Smith',
        media_url: '/uploads/demo2.jpg',
        resolution_photo_url: null,
        lat: 28.6300,
        lng: 77.2200,
      },
      {
        id: 3,
        category: 'PWD',
        description: 'Pothole in street needs immediate repair to prevent accidents',
        location_text: 'Park Road',
        district: 'South',
        city: 'City',
        village: null,
        status: 'completed',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        user_email: 'user@example.com',
        user_name: 'Bob Johnson',
        media_url: '/uploads/demo3.jpg',
        resolution_photo_url: '/uploads/demo3-resolved.jpg',
        lat: 28.5900,
        lng: 77.1900,
      },
    ];
    return res.json({ complaints: demoComplaints });
  }

  const query = department
    ? `SELECT c.*, u.email as user_email 
       FROM complaints c 
       LEFT JOIN users u ON c.user_id = u.id 
       WHERE c.department = ? OR c.assigned_officer_id = ?
       ORDER BY c.created_at DESC`
    : `SELECT c.*, u.email as user_email 
       FROM complaints c 
       LEFT JOIN users u ON c.user_id = u.id 
       WHERE c.assigned_officer_id = ?
       ORDER BY c.created_at DESC`;

  const params = department ? [department, officerId] : [officerId];

  db.all(query, params, (err: any, rows: any) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ complaints: rows || [] });
  });
});

router.get('/:id', (req: OfficerRequest, res: Response) => {
  const { id } = req.params;
  const officerId = req.officer?.id;

  if (!officerId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (isDemoMode()) {
    const demoComplaints: any = {
      1: {
        id: 1,
        category: 'PWD',
        description: 'Broken road on Main Street causing traffic congestion and safety hazards',
        location_text: 'Main Street, City Center',
        district: 'Central',
        city: 'City',
        village: null,
        status: 'pending',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        user_email: 'citizen@example.com',
        user_name: 'John Doe',
        media_url: '/uploads/demo1.jpg',
        resolution_photo_url: null,
        lat: 28.6139,
        lng: 77.2090,
      },
      2: {
        id: 2,
        category: 'Water',
        description: 'Water pipe burst causing water wastage and flooding on residential area',
        location_text: 'Oak Avenue, Residential Zone',
        district: 'North',
        city: 'City',
        village: null,
        status: 'in progress',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        user_email: 'resident@example.com',
        user_name: 'Jane Smith',
        media_url: '/uploads/demo2.jpg',
        resolution_photo_url: null,
        lat: 28.6300,
        lng: 77.2200,
      },
      3: {
        id: 3,
        category: 'PWD',
        description: 'Pothole in street needs immediate repair to prevent accidents',
        location_text: 'Park Road',
        district: 'South',
        city: 'City',
        village: null,
        status: 'completed',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        user_email: 'user@example.com',
        user_name: 'Bob Johnson',
        media_url: '/uploads/demo3.jpg',
        resolution_photo_url: '/uploads/demo3-resolved.jpg',
        lat: 28.5900,
        lng: 77.1900,
      },
    };
    const complaint = demoComplaints[parseInt(id) as keyof typeof demoComplaints];
    return res.json({ complaint: complaint || null });
  }

  db.get(
    `SELECT c.*, u.email as user_email, u.name as user_name 
     FROM complaints c 
     LEFT JOIN users u ON c.user_id = u.id 
     WHERE c.id = ?`,
    [id],
    (err: any, complaint: any) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found' });
      }

      const userDepartment = req.officer?.department;
      if (
        complaint.department !== userDepartment &&
        complaint.assigned_officer_id !== officerId &&
        req.officer?.role !== 'admin'
      ) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({ complaint });
    }
  );
});

router.patch(
  '/:id/status',
  (req: OfficerRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const officerId = req.officer?.id;

    if (!officerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status required' });
    }

    if (isDemoMode()) {
      console.log(`[DEMO] Status updated for complaint #${id} to ${status}`);
      return res.json({ success: true, status });
    }

    let responseSent = false;

    db.get(
      'SELECT user_id, category, description, location_text FROM complaints WHERE id = ?',
      [id],
      (err: any, complaint: any) => {
        if (responseSent) return;

        if (err) {
          console.error(`[Officer Complaints] Error fetching complaint #${id}:`, err.message);
          responseSent = true;
          return res.status(500).json({ error: 'Database error: ' + err.message });
        }

        if (!complaint) {
          console.warn(`[Officer Complaints] Complaint #${id} not found`);
          responseSent = true;
          return res.status(404).json({ error: 'Complaint not found' });
        }

        db.run(
          'UPDATE complaints SET status = ?, assigned_officer_id = ? WHERE id = ?',
          [status, officerId, id],
          async function (err: any) {
            if (responseSent) return;

            if (err) {
              console.error(`[Officer Complaints] Error updating complaint #${id} status:`, err.message);
              responseSent = true;
              return res.status(500).json({ error: 'Database error: ' + err.message });
            }
            if ((this as any).changes === 0) {
              console.warn(`[Officer Complaints] No changes made for complaint #${id}`);
              responseSent = true;
              return res.status(404).json({ error: 'Complaint not found' });
            }

            console.log(`[Officer Complaints] Status updated for complaint #${id} to ${status}`);

            db.get(
              'SELECT email FROM users WHERE id = ?',
              [complaint.user_id],
              async (err: any, user: any) => {
                if (responseSent) return;

                try {
                  if (user?.email) {
                    await sendComplaintNotification(user.email, parseInt(id), status, {
                      category: complaint.category,
                      description: complaint.description,
                      location: complaint.location_text,
                    });
                  }
                } catch (emailError) {
                  console.error(`[Officer Complaints] Error sending notification for complaint #${id}:`, emailError);
                  // Don't fail the response due to email error
                }

                responseSent = true;
                res.json({ success: true, status });
              }
            );
          }
        );
      }
    );
  }
);

router.post(
  '/:id/resolve',
  upload.single('photo'),
  (req: OfficerRequest, res: Response) => {
    const { id } = req.params;
    const officerId = req.officer?.id;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : '/uploads/demo-resolved.jpg';

    if (!officerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!photoUrl && !isDemoMode()) {
      return res.status(400).json({ error: 'Photo required for resolution' });
    }

    if (isDemoMode()) {
      console.log(`[DEMO] Resolution photo uploaded for complaint #${id}`);
      return res.json({ success: true, status: 'completed', resolution_photo_url: photoUrl });
    }

    let responseSent = false;

    db.get(
      'SELECT user_id, category, description, location_text FROM complaints WHERE id = ?',
      [id],
      (err: any, complaint: any) => {
        if (responseSent) return;

        if (err || !complaint) {
          responseSent = true;
          return res.status(404).json({ error: 'Complaint not found' });
        }

        db.run(
          'UPDATE complaints SET status = ?, resolution_photo_url = ?, assigned_officer_id = ? WHERE id = ?',
          ['completed', photoUrl, officerId, id],
          async function (err: any) {
            if (responseSent) return;

            if (err) {
              responseSent = true;
              return res.status(500).json({ error: 'Database error' });
            }
            if ((this as any).changes === 0) {
              responseSent = true;
              return res.status(404).json({ error: 'Complaint not found' });
            }

            db.get(
              'SELECT email FROM users WHERE id = ?',
              [complaint.user_id],
              async (err: any, user: any) => {
                if (responseSent) return;

                if (user?.email) {
                  await sendComplaintNotification(user.email, parseInt(id), 'completed', {
                    category: complaint.category,
                    description: complaint.description,
                    location: complaint.location_text,
                  });
                }

                responseSent = true;
                res.json({ success: true, status: 'completed', resolution_photo_url: photoUrl });
              }
            );
          }
        );
      }
    );
  }
);

router.get('/heatmap/data', (req: OfficerRequest, res: Response) => {
  const officerId = req.officer?.id;
  const department = req.officer?.department;

  if (!officerId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (isDemoMode()) {
    const demoPoints = [
      { lat: 28.6139, lng: 77.2090, category: 'PWD', department: 'PWD', status: 'pending' },
      { lat: 28.6300, lng: 77.2200, category: 'Water', department: 'Water', status: 'in progress' },
      { lat: 28.5900, lng: 77.1900, category: 'PWD', department: 'PWD', status: 'completed' },
    ];
    return res.json({ points: demoPoints });
  }

  const query = department
    ? `SELECT lat, lng, category, department, status 
       FROM complaints 
       WHERE (department = ? OR assigned_officer_id = ?) AND lat IS NOT NULL AND lng IS NOT NULL`
    : `SELECT lat, lng, category, department, status 
       FROM complaints 
       WHERE assigned_officer_id = ? AND lat IS NOT NULL AND lng IS NOT NULL`;

  const params = department ? [department, officerId] : [officerId];

  db.all(query, params, (err: any, rows: any) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    const points = (rows || []).map((r: any) => ({
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      category: r.category,
      department: r.department,
      status: r.status,
    }));
    res.json({ points });
  });
});

export default router;
