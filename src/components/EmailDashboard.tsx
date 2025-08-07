import React, { useState } from 'react';
import { Mail, Clock, AlertTriangle, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface Email {
  _id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  classification: {
    category: string;
    confidence: number;
    reasoning: string;
  };
  priority: string;
  isRead: boolean;
  attachments: any[];
}

interface Props {
  emails: Email[];
  loading: boolean;
  onMarkAsRead: (emailId: string) => void;
  getCategoryColor: (category: string) => string;
  formatCategoryName: (category: string) => string;
}

const EmailDashboard: React.FC<Props> = ({
  emails,
  loading,
  onMarkAsRead,
  getCategoryColor,
  formatCategoryName
}) => {
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (priority === 'medium') return <Clock className="h-4 w-4 text-yellow-500" />;
    return <Clock className="h-4 w-4 text-green-500" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEmailClick = (email: Email) => {
    if (!email.isRead) {
      onMarkAsRead(email._id);
    }
    setExpandedEmail(expandedEmail === email._id ? null : email._id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="text-center py-16">
        <Mail className="h-16 w-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-400 mb-2">No emails found</h3>
        <p className="text-gray-500">Try adjusting your filters or process new emails</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {emails.map((email) => (
        <div
          key={email._id}
          className={`bg-gray-800 rounded-lg border border-gray-700 overflow-hidden transition-all duration-200 hover:border-gray-600 ${
            !email.isRead ? 'bg-gray-800/80 border-blue-500/30' : ''
          }`}
        >
          <div
            className="p-6 cursor-pointer"
            onClick={() => handleEmailClick(email)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${getCategoryColor(email.classification.category)}`}></div>
                  
                  <span className="text-sm font-medium text-blue-400">
                    {formatCategoryName(email.classification.category)}
                  </span>
                  
                  <div className="flex items-center space-x-1">
                    {getPriorityIcon(email.priority)}
                  </div>
                  
                  {email.attachments.length > 0 && (
                    <FileText className="h-4 w-4 text-gray-400" />
                  )}
                  
                  {!email.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>

                <h3 className={`text-lg font-semibold mb-2 ${!email.isRead ? 'text-white' : 'text-gray-300'}`}>
                  {email.subject}
                </h3>

                <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                  <span>From: {email.from}</span>
                  <span>{formatDate(email.date)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Confidence:</span>
                    <div className="bg-gray-700 rounded-full h-2 w-20">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${email.classification.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {Math.round(email.classification.confidence * 100)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-400">
                    {expandedEmail === email._id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {expandedEmail === email._id && (
            <div className="border-t border-gray-700 p-6 bg-gray-800/50">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Classification Reasoning</h4>
                  <p className="text-gray-400 text-sm bg-gray-900/50 p-3 rounded">
                    {email.classification.reasoning}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Email Content</h4>
                  <div className="text-gray-400 text-sm bg-gray-900/50 p-4 rounded max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans">
                      {email.body.substring(0, 1000)}
                      {email.body.length > 1000 && '...'}
                    </pre>
                  </div>
                </div>

                {email.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Attachments</h4>
                    <div className="space-y-2">
                      {email.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm text-gray-400">
                          <FileText className="h-4 w-4" />
                          <span>{attachment.filename}</span>
                          <span className="text-xs">({(attachment.size / 1024).toFixed(1)} KB)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EmailDashboard;