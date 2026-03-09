// src/pages/Deductions.jsx
import { useEffect, useState } from 'react';
import { deductionsAPI, committeesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  PlusIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function Deductions() {
  const { user } = useAuth();
  const [deductions, setDeductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDeductions, setSelectedDeductions] = useState([]);

  useEffect(() => {
    fetchDeductions();
  }, []);

  const fetchDeductions = async () => {
    try {
      const params = {};
      if (monthFilter) params.month = monthFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await deductionsAPI.getAll(params);
      setDeductions(response.data.data);
    } catch (error) {
      toast.error('Failed to load deductions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (selectedDeductions.length === 0) {
      toast.warning('Please select deductions to verify');
      return;
    }

    try {
      await deductionsAPI.verify(selectedDeductions);
      toast.success('Deductions verified successfully');
      setSelectedDeductions([]);
      fetchDeductions();
    } catch (error) {
      toast.error('Failed to verify deductions');
      console.error(error);
    }
  };

  const handleForward = async () => {
    try {
      const month = prompt('Enter month (YYYY-MM-DD):');
      if (!month) return;

      await deductionsAPI.forward({ deduction_month: month });
      toast.success('Deductions forwarded to CEC successfully');
      fetchDeductions();
    } catch (error) {
      toast.error('Failed to forward deductions');
      console.error(error);
    }
  };

  const handleApprove = async () => {
    try {
      const month = prompt('Enter month (YYYY-MM-DD):');
      if (!month) return;

      const committeeId = prompt('Enter committee ID:');
      if (!committeeId) return;

      await deductionsAPI.approve({
        deduction_month: month,
        committee_id: parseInt(committeeId)
      });
      toast.success('Deductions approved successfully');
      fetchDeductions();
    } catch (error) {
      toast.error('Failed to approve deductions');
      console.error(error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const response = await deductionsAPI.bulkImport(file);
      toast.success(`Imported ${response.data.data.inserted} deductions`);
      fetchDeductions();
    } catch (error) {
      toast.error('Failed to import deductions');
      console.error(error);
    }
  };

  const toggleSelection = (deductionId) => {
    setSelectedDeductions((prev) =>
      prev.includes(deductionId)
        ? prev.filter((id) => id !== deductionId)
        : [...prev, deductionId]
    );
  };

  const canVerify = ['ZEC_USER', 'ZEC_VERIFIER', 'ADMIN'].includes(user?.role);
  const canForward = ['ZEC_USER', 'ZEC_VERIFIER', 'ADMIN'].includes(user?.role);
  const canApprove = ['CEC_PRESIDENT', 'CEC_GS', 'CEC_SECRETARY', 'CEC_FINANCE', 'ADMIN'].includes(user?.role);

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Monthly Deductions</h1>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <label className="relative cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
            <ArrowUpTrayIcon className="h-5 w-5 inline mr-2" />
            Import Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
            <PlusIcon className="h-5 w-5 mr-2" />
            Enter Deduction
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value + '-01')}
              className="block w-full py-2 px-3 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full py-2 px-3 border border-gray-300 rounded-md"
            >
              <option value="">All Status</option>
              <option value="Entered">Entered</option>
              <option value="Verified">Verified</option>
              <option value="Forwarded">Forwarded</option>
              <option value="Approved">Approved</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchDeductions}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-4 flex space-x-3">
        {canVerify && (
          <button
            onClick={handleVerify}
            disabled={selectedDeductions.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Verify Selected ({selectedDeductions.length})
          </button>
        )}
        {canForward && (
          <button
            onClick={handleForward}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowRightIcon className="h-5 w-5 mr-2" />
            Forward to CEC
          </button>
        )}
        {canApprove && (
          <button
            onClick={handleApprove}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Approve Deductions
          </button>
        )}
      </div>

      {/* Deductions Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        {loading ? (
          <div className="p-8 text-center">Loading deductions...</div>
        ) : deductions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No deductions found</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {canVerify && (
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        setSelectedDeductions(
                          e.target.checked
                            ? deductions
                                .filter((d) => d.status === 'Entered')
                                .map((d) => d.deduction_id)
                            : []
                        )
                      }
                      className="rounded"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Committee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Entered By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deductions.map((deduction) => (
                <tr key={deduction.deduction_id} className="hover:bg-gray-50">
                  {canVerify && (
                    <td className="px-6 py-4">
                      {deduction.status === 'Entered' && (
                        <input
                          type="checkbox"
                          checked={selectedDeductions.includes(deduction.deduction_id)}
                          onChange={() => toggleSelection(deduction.deduction_id)}
                          className="rounded"
                        />
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="font-medium">{deduction.full_name}</div>
                    <div className="text-gray-500">{deduction.member_code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(deduction.deduction_month).toLocaleDateString('en-IN', {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{parseFloat(deduction.deduction_amount).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {deduction.committee_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        deduction.status === 'Approved'
                          ? 'bg-green-100 text-green-800'
                          : deduction.status === 'Verified'
                          ? 'bg-blue-100 text-blue-800'
                          : deduction.status === 'Forwarded'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {deduction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {deduction.entered_by_name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500">Total Deductions: {deductions.length}</div>
    </div>
  );
}
