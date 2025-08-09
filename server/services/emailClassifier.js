import fetch from 'node-fetch';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyBjs5BCDDoaIcg_QuhyeL3HXhViVLbhjZw";

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ');
}

class EmailClassifier {
  async classifyEmail(email) {
    try {
      if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
      }
      const cleanBody = stripHtml(email.body || '').substring(0, 500);
      const prompt = `
        Classify the following email into one of these exact categories and provide reasoning:
        
        Categories (use EXACTLY these values):
        - "job_interview": Job interviews, interview scheduling, interview feedback
        - "work_meeting": Work meetings, team meetings, project discussions
        - "personal": Personal emails from friends, family, personal matters
        - "promotional": Marketing emails, sales promotions, advertisements
        - "newsletter": Newsletters, subscriptions, regular updates
        - "important_notification": Important notifications, urgent alerts, system notifications
        - "social_media": Social media notifications, social platform emails
        - "financial": Financial statements, banking, payments, invoices
        - "travel": Travel bookings, confirmations, travel-related emails
        - "other": Anything that doesn't fit the above categories
        
        Email to classify:
        Subject: ${email.subject}
        From: ${email.from}
        Body: ${cleanBody}
        
        Please respond in JSON format with exactly this structure:
        {
          "category": "one_of_the_exact_categories_above",
          "confidence": 0.95,
          "reasoning": "brief explanation of why this category was chosen"
        }
        
        IMPORTANT: Use ONLY the exact category values listed above (like "job_interview", "work_meeting", etc.). Do not use different words or phrases.
      `;

      const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
      const body = {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      };

      const urlWithKey = `${url}?key=${GEMINI_API_KEY}`;
      // Add a small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 4000)); // 4 second delay between requests
      
      const response = await fetch(urlWithKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        console.error('Gemini API response not ok:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('Error details:', errorData);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!text) {
        console.error('No text returned from Gemini API');
        throw new Error('No text returned from Gemini API');
      }

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const classification = JSON.parse(jsonMatch[0]);
        
        // Validate that the category is one of our enum values
        const validCategories = [
          'job_interview', 'work_meeting', 'personal', 'promotional', 
          'newsletter', 'important_notification', 'social_media', 
          'financial', 'travel', 'other'
        ];
        
        if (!validCategories.includes(classification.category)) {
          console.warn(`Invalid category returned: ${classification.category}, defaulting to 'other'`);
          classification.category = 'other';
          classification.confidence = 0.5;
          classification.reasoning = `Original category "${classification.category}" was invalid, defaulted to other`;
        }
        
        const highPriorityCategories = ['job_interview', 'important_notification', 'financial'];
        const priority = highPriorityCategories.includes(classification.category) ? 'high' : 'medium';
        
        return { ...classification, priority };
      } else {
        console.error('No JSON found in Gemini response');
        throw new Error('No valid JSON found in Gemini response');
      }

      return {
        category: 'other',
        confidence: 0.5,
        reasoning: 'Could not classify email automatically',
        priority: 'medium'
      };
    } catch (error) {
      console.error('Error classifying email:', error.message);
      
      // Handle rate limit errors specifically
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        return {
          category: 'other',
          confidence: 0.0,
          reasoning: 'Rate limit reached - please wait before processing more emails',
          priority: 'medium'
        };
      }
      
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
