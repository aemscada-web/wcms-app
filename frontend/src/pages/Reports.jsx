// src/pages/Reports.jsx
import { useState } from 'react';
import { reportsAPI } from '../services/api';
import { toast } from 'react-toastify';
import {
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export default function Reports() {
  const [activeReport, setActiveReport] = useState('member-balances');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});

  const reports = [
    { id: 'member-balances', name: 'Member Balance Report', icon: DocumentChartBarIcon },
    { id: 'pending-verifications', name: 'Pending Verifications', icon: CalendarIcon },
    { id: 'pending-approvals', name: 'Pending CEC Approvals', icon: CalendarIcon },
    { id: 'withdrawal-requests', name: 'Withdrawal Requests', icon: DocumentChartBarIcon },
    { id: 'committee-summary', name: 'Committee Summary', icon: DocumentChartBarIcon }
  ];

  const fetchReport = async () => {
    setLoading(true);
    try {
      let response;
      switch (activeReport) {
        case 'member-balances':
          response = await reportsAPI.memberBalances(filters);
          break;
        case 'pending-verifications':
          response = await reportsAPI.pendingVerifications();
          break;
        case 'pending-approvals':
          response = await reportsAPI.pendingApprovals();
          break;
        case 'withdrawal-requests':
          response = await reportsAPI.withdrawalRequests(filters);
          break;
        case 'committee-summary':
          response = await reportsAPI.committeeSummary(filters);
          break;
        default:
          response = { data: { data: [] } };
      }
      setReportData(response.data.data || []);
    } catch (error) {
      toast.error('Failed to generate report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    // Simple CSV export
    if (reportData.length === 0) {
      toast.warning('No data to export');
      return;
    }

    const headers = Object.keys(reportData[0]);
    const csv = [
      headers.join(','),
      ...reportData.map((row) =>
        headers.map((header) => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Report exported successfully');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Report Menu */}
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Type</h2>
          <nav className="space-y-2">
            {reports.map((report) => {
              const Icon = report.icon;
              return (
                <button
                  key={report.id}
                  onClick={() => {
                    setActiveReport(report.id);
                    setReportData([]);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeReport === report.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {report.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Report Content */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {reports.find((r) => r.id === activeReport)?.name}
              </h2>
              <div className="flex space-x-3">
                <button
                  onClick={fetchReport}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Generate Report
                </button>
                {reportData.length > 0 && (
                  <button
                    onClick={exportToExcel}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Export
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            {(activeReport === 'member-balances' || activeReport === 'committee-summary') && (
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeReport === 'committee-summary' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year
                      </label>
                      <input
                        type="number"
                        value={filters.year || new Date().getFullYear()}
                        onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                        className="block w-full py-2 px-3 border border-gray-300 rounded-md"
                      />
                    </div>
                  )}
                  {activeReport === 'member-balances' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={filters.status || ''}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="block w-full py-2 px-3 border border-gray-300 rounded-md"
                      >
                        <option value="">All</option>
                        <option value="Active">Active</option>
                        <option value="Retired">Retired</option>
                        <option value="Transferred">Transferred</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Report Data */}
            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-600">Generating report...</div>
              </div>
            ) : reportData.length === 0 ? (
              <div className="text-center py-12">
                <DocumentChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Click "Generate Report" to view data
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(reportData[0]).map((key) => (
                        <th
                          key={key}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {typeof value === 'number' && value > 1000
                              ? value.toLocaleString('en-IN')
                              : value?.toString() || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-sm text-gray-500">
                  Total Records: {reportData.length}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
