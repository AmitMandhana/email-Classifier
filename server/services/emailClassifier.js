import fetch from 'node-fetch';

const GEMINI_API_KEY = "AIzaSyBjs5BCDDoaIcg_QuhyeL3HXhViVLbhjZw";

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ');
}

class EmailClassifier {
  async classifyEmail(email) {
    try {
      const cleanBody = stripHtml(email.body || '').substring(0, 500);
      const prompt = `
        Classify the following email into one of these categories and provide reasoning:
        ... (same as before) ...
        Subject: ${email.subject}
        From: ${email.from}
        Body: ${cleanBody}...
        Please respond in JSON format...
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
      const response = await fetch(urlWithKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const classification = JSON.parse(jsonMatch[0]);
        const highPriorityCategories = ['job_interview', 'important_notification', 'financial'];
        const priority = highPriorityCategories.includes(classification.category) ? 'high' : 'medium';
        return { ...classification, priority };
      }

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
