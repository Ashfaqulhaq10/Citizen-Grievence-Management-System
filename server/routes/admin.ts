import express from 'express';
import { protect, admin, AuthRequest } from '../middleware/auth';
import db from '../db';

const router = express.Router();

// View all complaints
router.get('/complaints', protect, admin, (req: AuthRequest, res) => {
  db.all('SELECT * FROM complaints', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching complaints' });
    }
    res.json(rows);
  });
});

// Update complaint status
router.put('/complaints/:id/status', protect, admin, (req: AuthRequest, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  db.run('UPDATE complaints SET status = ? WHERE id = ?', [status, id], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Error updating complaint status' });
    }
    if (this.changes === 0) {
        return res.status(404).json({ message: 'Complaint not found' });
    }
    res.json({ message: 'Complaint status updated' });
  });
});

// Delete complaint
router.delete('/complaints/:id', protect, admin, (req: AuthRequest, res) => {
  const { id } = req.params;

  db.run('DELETE FROM complaints WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting complaint' });
    }
    if (this.changes === 0) {
        return res.status(404).json({ message: 'Complaint not found' });
    }
    res.json({ message: 'Complaint deleted' });
  });
});

export default router;
