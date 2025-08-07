import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema({
  messageId: {
    type: String,
    unique: true,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  classification: {
    category: {
      type: String,
      enum: [
        'job_interview',
        'work_meeting', 
        'personal',
        'promotional',
        'newsletter',
        'important_notification',
        'social_media',
        'financial',
        'travel',
        'other'
      ],
      default: 'other'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },
    reasoning: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  attachments: [{
    filename: String,
    size: Number,
    contentType: String
  }],
  processedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Email', emailSchema);