import EmailFetcher from './emailFetcher.js';
import EmailClassifier from './emailClassifier.js';
import Email from '../models/Email.js';

let processingInterval;

export async function processEmails() {
  try {
    console.log('Starting email processing...');
    
    const fetcher = new EmailFetcher();
    const classifier = new EmailClassifier();

    await fetcher.connect();
    const emails = await fetcher.fetchRecentEmails(1);

    console.log(`Fetched ${emails.length} new emails`);

    for (const email of emails) {
      // Check if email already exists
      const existingEmail = await Email.findOne({ messageId: email.messageId });
      if (existingEmail) {
        continue;
      }

      // Classify the email
      const classification = await classifier.classifyEmail(email);

      // Save to database
      const newEmail = new Email({
        ...email,
        classification: {
          category: classification.category,
          confidence: classification.confidence,
          reasoning: classification.reasoning
        },
        priority: classification.priority
      });

      await newEmail.save();
      console.log(`Processed and saved email: ${email.subject}`);
    }

  } catch (error) {
    console.error('Error processing emails:', error);
  }
}

export function startEmailProcessor() {
  // Process emails every 5 minutes
  processingInterval = setInterval(processEmails, 5 * 60 * 1000);
  
  // Process immediately on start
  processEmails();
}

export function stopEmailProcessor() {
  if (processingInterval) {
    clearInterval(processingInterval);
  }
}