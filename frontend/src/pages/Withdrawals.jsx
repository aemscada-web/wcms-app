// src/pages/Withdrawals.jsx
import { useEffect, useState } from 'react';
import { withdrawalsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function Withdrawals() {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const response = await withdrawalsAPI.getAll(params);
      setWithdrawals(response.data.data);
    } catch (error) {
      toast.error('Failed to load withdrawal requests');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleZECApproval = async (withdrawalId, status) => {
    try {
      const remarks = prompt('Enter remarks (optional):') || '';
      await withdrawalsAPI.zecApprove(withdrawalId, { status, remarks });
      toast.success(`Withdrawal ${status.toLowerCase()} by ZEC`);
      fetchWithdrawals();
    } catch (error) {
      toast.error('Failed to process ZEC approval');
      console.error(error);
    }
  };

  const handleCECApproval = async (withdrawalId, status) => {
    try {
      const remarks = prompt('Enter remarks (optional):') || '';
      let approvedAmount = null;
      
      if (status === 'Approved') {
        const amount = prompt('Enter approved amount:');
        if (!amount) return;
        approvedAmount = parseFloat(amount);
      }

      await withdrawalsAPI.cecApprove(withdrawalId, {
        status,
        approved_amount: approvedAmount,
        remarks
      });
      toast.success(`Withdrawal ${status.toLowerCase()} by CEC`);
      fetchWithdrawals();
    } catch (error) {
      toast.error('Failed to process CEC approval');
      console.error(error);
    }
  };

  const canApproveZEC = ['ZEC_USER', 'ZEC_VERIFIER', 'ADMIN'].includes(user?.role);
  const canApproveCEC = ['CEC_PRESIDENT', 'CEC_GS', 'CEC_SECRETARY', 'CEC_FINANCE', 'ADMIN'].includes(user?.role);

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
        <div className="mt-4 sm:mt-0">
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
            <PlusIcon className="h-5 w-5 mr-2" />
            New Request
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full py-2 px-3 border border-gray-300 rounded-md"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Disbursed">Disbursed</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchWithdrawals}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        {loading ? (
          <div className="p-8 text-center">Loading withdrawal requests...</div>
        ) : withdrawals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No withdrawal requests found</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Requested Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ZEC Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  CEC Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Final Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.withdrawal_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="font-medium">{withdrawal.full_name}</div>
                    <div className="text-gray-500">{withdrawal.member_code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {withdrawal.withdrawal_type.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{parseFloat(withdrawal.requested_amount).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{parseFloat(withdrawal.current_balance).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        withdrawal.zec_status === 'Approved'
                          ? 'bg-green-100 text-green-800'
                          : withdrawal.zec_status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {withdrawal.zec_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        withdrawal.cec_status === 'Approved'
                          ? 'bg-green-100 text-green-800'
                          : withdrawal.cec_status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {withdrawal.cec_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        withdrawal.final_status === 'Approved' || withdrawal.final_status === 'Disbursed'
                          ? 'bg-green-100 text-green-800'
                          : withdrawal.final_status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {withdrawal.final_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {canApproveZEC && withdrawal.zec_status === 'Pending' && (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleZECApproval(withdrawal.withdrawal_id, 'Approved')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleZECApproval(withdrawal.withdrawal_id, 'Rejected')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {canApproveCEC &&
                      withdrawal.zec_status === 'Approved' &&
                      withdrawal.cec_status === 'Pending' && (
                        <div className="space-x-2">
                          <button
                            onClick={() => handleCECApproval(withdrawal.withdrawal_id, 'Approved')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleCECApproval(withdrawal.withdrawal_id, 'Rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Total Requests: {withdrawals.length}
      </div>
    </div>
  );
}
