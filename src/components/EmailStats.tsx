import React from 'react';
import { BarChart3, TrendingUp, Mail, AlertTriangle } from 'lucide-react';

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

interface Props {
  stats: Stats;
  getCategoryColor: (category: string) => string;
  formatCategoryName: (category: string) => string;
}

const EmailStats: React.FC<Props> = ({ stats, getCategoryColor, formatCategoryName }) => {
  const maxCount = Math.max(...stats.categoryStats.map(stat => stat.count));

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Emails</p>
              <p className="text-3xl font-bold text-white">{stats.totalEmails}</p>
            </div>
            <Mail className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Unread Emails</p>
              <p className="text-3xl font-bold text-yellow-400">{stats.unreadEmails}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">High Priority</p>
              <p className="text-3xl font-bold text-red-400">{stats.highPriorityEmails}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Categories</p>
              <p className="text-3xl font-bold text-green-400">{stats.categoryStats.length}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <BarChart3 className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold">Email Categories</h2>
        </div>

        <div className="space-y-4">
          {stats.categoryStats
            .sort((a, b) => b.count - a.count)
            .map((stat) => (
              <div key={stat._id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getCategoryColor(stat._id)}`}></div>
                    <span className="text-gray-300">{formatCategoryName(stat._id)}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-white font-semibold">{stat.count} emails</span>
                    <span className="text-gray-400">
                      {Math.round(stat.avgConfidence * 100)}% avg confidence
                    </span>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="bg-gray-700 rounded-full h-2 w-full">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getCategoryColor(stat._id)}`}
                      style={{ width: `${(stat.count / maxCount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Classification Accuracy */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">Classification Performance</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Average Confidence by Category</h3>
            <div className="space-y-3">
              {stats.categoryStats
                .sort((a, b) => b.avgConfidence - a.avgConfidence)
                .slice(0, 5)
                .map((stat) => (
                  <div key={stat._id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">
                      {formatCategoryName(stat._id)}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="bg-gray-700 rounded-full h-2 w-24">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${stat.avgConfidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-400 w-12 text-right">
                        {Math.round(stat.avgConfidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Overall Accuracy</h3>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-blue-500 mb-4">
                <span className="text-2xl font-bold text-blue-400">
                  {Math.round(
                    stats.categoryStats.reduce((acc, stat) => acc + stat.avgConfidence, 0) / 
                    stats.categoryStats.length * 100
                  )}%
                </span>
              </div>
              <p className="text-gray-400">Average classification confidence across all categories</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailStats;