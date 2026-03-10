// src/pages/Deductions.jsx
import { useEffect, useState } from 'react';
import { deductionsAPI, committeesAPI, membersAPI } from '../services/api';
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

  // --- new state for manual entry modal ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [membersList, setMembersList] = useState([]);
  const [formData, setFormData] = useState({
    member_id: '',
    deduction_month: '',
    deduction_amount: '',
    remarks: ''
  });

  useEffect(() => {
    fetchDeductions();
    fetchMembers();
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

  const fetchMembers = async () => {
    try {
      const response = await membersAPI.getAll();
      setMembersList(response.data.data);
    } catch (error) {
      console.error('Failed to load members for deduction entry', error);
    }
  };

  const handleAddDeduction = () => {
    setFormData({
      member_id: '',
      deduction_month: '',
      deduction_amount: '',
      remarks: ''
    });
    setShowAddModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ensure month has a day component (YYYY-MM-01)
      const payload = { ...formData };
      if (payload.deduction_month && payload.deduction_month.length === 7) {
        payload.deduction_month = payload.deduction_month + '-01';
      }

      await deductionsAPI.create(payload);
      toast.success('Deduction entered successfully');
      setShowAddModal(false);
      fetchDeductions();
    } catch (error) {
      console.error('Deduction entry error:', error.response?.data || error.message);
      const errMsg = error.response?.data?.message || 'Failed to enter deduction';
      toast.error(errMsg);
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
      let month = prompt('Enter deduction month (YYYY-MM or YYYY-MM-DD):');
      // if user cancels or leaves blank, try filter value
      if (!month) {
        if (!monthFilter) return;
        month = monthFilter;
      }

      // normalize to include day component if missing
      if (/^\d{4}-\d{2}$/.test(month)) {
        month = month + '-01';
      }

      const response = await deductionsAPI.forward({ deduction_month: month });
      toast.success(response.data?.message || 'Deductions forwarded to CEC successfully');
      fetchDeductions();
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to forward deductions';
      toast.error(errMsg);
      console.error('Forward error:', error.response?.data || error.message);
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
          <button
            onClick={handleAddDeduction}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
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

      {/* Add Deduction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Enter Deduction</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-500">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
                <select
                  name="member_id"
                  value={formData.member_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select Member</option>
                  {membersList.map((m) => (
                    <option key={m.member_id} value={m.member_id}>
                      {m.full_name} ({m.member_code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <input
                  type="month"
                  name="deduction_month"
                  value={formData.deduction_month}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  name="deduction_amount"
                  value={formData.deduction_amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Optional remarks"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Save Deduction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
