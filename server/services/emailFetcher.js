import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { promisify } from 'util';

class EmailFetcher {
  constructor() {
    this.imap = new Imap({
      user: process.env.EMAIL_ADDRESS,
      password: process.env.EMAIL_PASSWORD,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false
      }
    });

    this.imap.once('ready', () => {
      console.log('IMAP connection ready');
    });

    this.imap.once('error', (err) => {
      console.error('IMAP connection error:', err);
    });
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.imap.once('ready', resolve);
      this.imap.once('error', reject);
      this.imap.connect();
    });
  }

  async fetchRecentEmails(days = 1) {
    return new Promise((resolve, reject) => {
      this.imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);

        const searchCriteria = ['UNSEEN', ['SINCE', sinceDate]];
        
        this.imap.search(searchCriteria, (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          if (!results.length) {
            resolve([]);
            return;
          }

          const fetch = this.imap.fetch(results, {
            bodies: '',
            struct: true
          });

          const emails = [];

          fetch.on('message', (msg, seqno) => {
            let buffer = '';

            msg.on('body', (stream, info) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            });

            msg.once('end', async () => {
              try {
                const parsed = await simpleParser(buffer);
                const email = {
                  messageId: parsed.messageId,
                  subject: parsed.subject || 'No Subject',
                  from: parsed.from?.text || 'Unknown Sender',
                  to: parsed.to?.text || process.env.EMAIL_ADDRESS,
                  date: parsed.date || new Date(),
                  body: parsed.text || parsed.html || '',
                  attachments: parsed.attachments?.map(att => ({
                    filename: att.filename,
                    size: att.size,
                    contentType: att.contentType
                  })) || []
                };
                emails.push(email);
              } catch (parseError) {
                console.error('Error parsing email:', parseError);
              }
            });
          });

          fetch.once('error', reject);

          fetch.once('end', () => {
            this.imap.end();
            resolve(emails);
          });
        });
      });
    });
  }
}

export default EmailFetcher;