import express from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import db from '../db';
import multer from 'multer';
import path from 'path';
import {
  getOrCreateUserByEmail,
  listComplaintsByUser,
  listAllPoints,
  searchComplaintsByArea,
  resolveComplaint,
  addComplaint
} from '../memory';
import { isDemoMode } from '../env';

const router = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage });

// Submit a new complaint
router.post('/', protect, upload.single('media'), (req: AuthRequest, res) => {
  const { category, description, location_text, lat, lng, department, district, city, village } = req.body;
  const user_id = req.user!.id;
  const media_url = req.file ? `/uploads/${req.file.filename}` : null;

  if (!category || !description || lat == null || lng == null) {
    return res.status(400).json({ error: 'Category, description, and location are required' });
  }

  if (isDemoMode()) {
    const complaint = addComplaint({
      user_id,
      category,
      description,
      location_text: location_text || null,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      media_url,
      department: department || null,
      district: district || null,
      city: city || null,
      village: village || null,
    });
    return res.status(201).json({ id: complaint.id });
  }

  db.run(
    'INSERT INTO complaints (user_id, category, description, location_text, lat, lng, media_url, department, district, city, village) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [user_id, category, description, location_text || null, lat, lng, media_url, department || null, district || null, city || null, village || null],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Error submitting complaint' });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Get all complaints of logged-in user
router.get('/', protect, (req: AuthRequest, res) => {
  const user_id = req.user!.id;

  if (isDemoMode()) {
    const complaints = listComplaintsByUser(user_id);
    return res.json({ complaints });
  }

  db.all('SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC', [user_id], (err, rows: any) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching complaints' });
    }
    res.json({ complaints: rows || [] });
  });
});

// Get heatmap data
router.get('/heatmap', (req, res) => {
  if (isDemoMode()) {
    const points = listAllPoints();
    console.log(`[Complaints] Heatmap (demo mode): ${points.length} points`);
    return res.json({ points });
  }

  db.all('SELECT lat, lng, category, department FROM complaints WHERE lat IS NOT NULL AND lng IS NOT NULL', [], (err, rows: any) => {
    if (err) {
      console.error('[Complaints] Heatmap query error:', err.message);
      return res.status(500).json({ error: 'Error fetching heatmap data: ' + err.message });
    }
    const points = (rows || []).map((r: any) => ({
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      category: r.category,
      department: r.department || null,
    }));
    console.log(`[Complaints] Heatmap: ${points.length} points returned`);
    res.json({ points });
  });
});

// Search complaints by area
router.get('/search', protect, (req: AuthRequest, res) => {
  const { q } = req.query;
  const query = String(q || '').trim();

  if (!query) {
    return res.json({ query, complaints: [], counts: { pending: 0, completed: 0 } });
  }

  if (isDemoMode()) {
    const results = searchComplaintsByArea(query);
    const complaints = results.map(c => ({
      id: c.id,
      category: c.category,
      department: c.department || null,
      district: c.district || null,
      city: c.city || null,
      village: c.village || null,
      location_text: c.location_text || null,
      created_at: c.created_at,
      status: c.status,
      resolution_photo_url: c.resolution_photo_url || null,
    }));
    const counts = {
      pending: complaints.filter(c => c.status === 'pending').length,
      completed: complaints.filter(c => c.status === 'completed').length,
    };
    return res.json({ query, complaints, counts });
  }

  const searchTerm = `%${query}%`;
  db.all(
    `SELECT id, category, department, district, city, village, location_text, created_at, status, resolution_photo_url
     FROM complaints
     WHERE district LIKE ? OR city LIKE ? OR village LIKE ? OR location_text LIKE ?
     ORDER BY created_at DESC`,
    [searchTerm, searchTerm, searchTerm, searchTerm],
    (err, rows: any) => {
      if (err) {
        return res.status(500).json({ error: 'Error searching complaints' });
      }
      const complaints = (rows || []).map((r: any) => ({
        id: r.id,
        category: r.category,
        department: r.department || null,
        district: r.district || null,
        city: r.city || null,
        village: r.village || null,
        location_text: r.location_text || null,
        created_at: r.created_at,
        status: r.status,
        resolution_photo_url: r.resolution_photo_url || null,
      }));
      const counts = {
        pending: complaints.filter(c => c.status === 'pending').length,
        completed: complaints.filter(c => c.status === 'completed').length,
      };
      res.json({ query, complaints, counts });
    }
  );
});

// Resolve a complaint
router.post('/:id/resolve', protect, upload.single('photo'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

  if (isDemoMode()) {
    const complaint = resolveComplaint(parseInt(id), photo_url);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    return res.json({ success: true });
  }

  const updates = photo_url ? 'status = ?, resolution_photo_url = ?' : 'status = ?';
  const values = photo_url ? ['completed', photo_url, id] : ['completed', id];

  db.run(
    `UPDATE complaints SET ${updates} WHERE id = ?`,
    values,
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Error resolving complaint' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Complaint not found' });
      }
      res.json({ success: true });
    }
  );
});

export default router;
