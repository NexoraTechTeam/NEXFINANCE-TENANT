import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Users, TrendingUp, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const revenueData = [
    { month: 'Jan', value: 4000000 },
    { month: 'Feb', value: 3000000 },
    { month: 'Mar', value: 2000000 },
    { month: 'Apr', value: 2780000 },
    { month: 'May', value: 1890000 },
  ];

  const kpiData = [
    { label: 'Monthly Revenue', value: 'Rp 25.000.000', icon: DollarSign, color: 'text-teal-600' },
    { label: 'SPP Collection', value: '87.5%', icon: TrendingUp, color: 'text-blue-600' },
    { label: 'Cash Balance', value: 'Rp 500.000.000', icon: DollarSign, color: 'text-green-600' },
    { label: 'Pending Items', value: '15', icon: AlertCircle, color: 'text-amber-600' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiData.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} className="bg-white rounded-lg shadow p-6 border-l-4 border-teal-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{kpi.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                  </div>
                  <Icon className={`w-12 h-12 ${kpi.color} opacity-20`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#41A9A9" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Expense Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Salaries', value: 25000000 },
                { name: 'Supplies', value: 3000000 },
                { name: 'Utilities', value: 2000000 },
                { name: 'Other', value: 1000000 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="value" fill="#41A9A9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
