import React, { useEffect, useState } from 'react';
import { sppService } from '../services/api';
import { DollarSign, TrendingUp } from 'lucide-react';

const SPPManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await sppService.getInvoices();
      setInvoices(response.data.invoices);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">SPP Management</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-teal-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium">Student</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Class</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Month</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((invoice) => (
                <tr key={invoice.studentId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{invoice.studentName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{invoice.class}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    Rp {invoice.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{invoice.month}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'paid' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {invoice.status === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SPPManagement;
