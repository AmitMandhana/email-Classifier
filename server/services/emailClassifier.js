
import fetch from 'node-fetch';

class EmailClassifier {
  async classifyEmail(email) {
    try {
      const prompt = `
        Classify the following email into one of these categories and provide reasoning:
        
        Categories:
        - job_interview: Job interviews, interview schedules, interview feedback
        - work_meeting: Work meetings, team meetings, business calls
        - personal: Personal communications from friends/family
        - promotional: Marketing emails, sales offers, promotions
        - newsletter: Newsletters, subscriptions, updates
        - important_notification: Bank alerts, bills, official notices
        - social_media: Social media notifications, updates
        - financial: Banking, investments, financial services
        - travel: Travel bookings, confirmations, itineraries
        - other: Anything that doesn't fit above categories

        Email Details:
        Subject: ${email.subject}
        From: ${email.from}
        Body: ${email.body.substring(0, 500)}...

        Please respond in JSON format with:
        {
          "category": "category_name",
          "confidence": 0.95,
          "reasoning": "Brief explanation of why this email fits this category"
        }
      `;

      const apiKey = process.env.GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const body = {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const classification = JSON.parse(jsonMatch[0]);
        // Determine priority based on category
        const highPriorityCategories = ['job_interview', 'important_notification', 'financial'];
        const priority = highPriorityCategories.includes(classification.category) ? 'high' : 'medium';
        return {
          ...classification,
          priority
        };
      }
      // Fallback classification
      return {
        category: 'other',
        confidence: 0.5,
        reasoning: 'Could not classify email automatically',
        priority: 'medium'
      };
    } catch (error) {
      console.error('Error classifying email:', error);
      return {
        category: 'other',
        confidence: 0.0,
        reasoning: 'Classification error occurred',
        priority: 'medium'
      };
    }
  }
}

export default EmailClassifier;