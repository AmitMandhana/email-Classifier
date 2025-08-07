import React, { useState, useEffect } from 'react';
import EmailDashboard from './components/EmailDashboard';
import EmailStats from './components/EmailStats';
import EmailFilters from './components/EmailFilters';
import { Mail, BarChart3, Settings, RefreshCw } from 'lucide-react';

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

interface Stats {
  categoryStats: Array<{
    _id: string;
    count: number;
    avgConfidence: number;
  }>;
  totalEmails: number;
  unreadEmails: number;
  highPriorityEmails: number;
}

interface Filters {
  category: string;
  priority: string;
  search: string;
}

function App() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    category: 'all',
    priority: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [processing, setProcessing] = useState(false);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`http://localhost:5000/api/emails?${queryParams}`);
      const data = await response.json();
      
      setEmails(data.emails);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/emails/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleManualProcess = async () => {
    try {
      setProcessing(true);
      await fetch('http://localhost:5000/api/emails/process', {
        method: 'POST'
      });
      // Refresh data after processing
      await Promise.all([fetchEmails(), fetchStats()]);
    } catch (error) {
      console.error('Error processing emails:', error);
    } finally {
      setProcessing(false);
    }
  };

  const markAsRead = async (emailId: string) => {
    try {
      await fetch(`http://localhost:5000/api/emails/${emailId}/read`, {
        method: 'PATCH'
      });
      
      setEmails(emails.map(email => 
        email._id === emailId ? { ...email, isRead: true } : email
      ));
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [currentPage, filters]);

  useEffect(() => {
    fetchStats();
    // Refresh stats every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const getCategoryColor = (category: string) => {
    const colors = {
      job_interview: 'bg-red-500',
      work_meeting: 'bg-blue-500',
      personal: 'bg-green-500',
      promotional: 'bg-purple-500',
      newsletter: 'bg-orange-500',
      important_notification: 'bg-red-600',
      social_media: 'bg-pink-500',
      financial: 'bg-emerald-600',
      travel: 'bg-cyan-500',
      other: 'bg-gray-500'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const formatCategoryName = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Mail className="h-8 w-8 text-blue-400" />
            <h1 className="text-2xl font-bold">Email Classifier</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleManualProcess}
              disabled={processing}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
              <span>Process New Emails</span>
            </button>
            
            {stats && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{stats.totalEmails} Total</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>{stats.unreadEmails} Unread</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>{stats.highPriorityEmails} High Priority</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
              activeTab === 'dashboard' 
                ? 'border-blue-400 text-blue-400' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
              activeTab === 'stats' 
                ? 'border-blue-400 text-blue-400' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Statistics</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <EmailFilters 
              filters={filters}
              onFiltersChange={setFilters}
              onPageChange={setCurrentPage}
              currentPage={currentPage}
              totalPages={totalPages}
            />
            
            <EmailDashboard
              emails={emails}
              loading={loading}
              onMarkAsRead={markAsRead}
              getCategoryColor={getCategoryColor}
              formatCategoryName={formatCategoryName}
            />
          </div>
        )}
        
        {activeTab === 'stats' && stats && (
          <EmailStats 
            stats={stats}
            getCategoryColor={getCategoryColor}
            formatCategoryName={formatCategoryName}
          />
        )}
      </main>
    </div>
  );
}

export default App;