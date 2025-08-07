import express from 'express';
import Email from '../models/Email.js';
import { processEmails } from '../services/emailProcessor.js';

const router = express.Router();

// Get all emails with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      priority, 
      search,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    
    if (category && category !== 'all') {
      filter['classification.category'] = category;
    }
    
    if (priority) {
      filter.priority = priority;
    }

    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { from: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const emails = await Email.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Email.countDocuments(filter);

    res.json({
      emails,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get email statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Email.aggregate([
      {
        $group: {
          _id: '$classification.category',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$classification.confidence' }
        }
      }
    ]);

    const totalEmails = await Email.countDocuments();
    const unreadEmails = await Email.countDocuments({ isRead: false });
    const highPriorityEmails = await Email.countDocuments({ priority: 'high' });

    res.json({
      categoryStats: stats,
      totalEmails,
      unreadEmails,
      highPriorityEmails
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark email as read
router.patch('/:id/read', async (req, res) => {
  try {
    const email = await Email.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json(email);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger manual email processing
router.post('/process', async (req, res) => {
  try {
    await processEmails();
    res.json({ message: 'Email processing triggered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;