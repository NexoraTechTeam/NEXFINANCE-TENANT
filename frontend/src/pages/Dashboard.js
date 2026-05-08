import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Users, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const Dashboard = () => {
  const revenueData = [
    { month: 'Jan', value: 4000000 },
    { month: 'Feb', value: 3000000 },
    { month: 'Mar', value: 2000000 },
    { month: 'Apr', value: 2780000 },
    { month: 'May', value: 1890000 },
  ];

  const expenseData = [
    { name: 'Salaries', value: 25000000 },
    { name: 'Supplies', value: 3000000 },
    { name: 'Utilities', value: 2000000 },
    { name: 'Other', value: 1000000 }
  ];

  const kpiData = [
    { label: 'Monthly Revenue', value: 'Rp 25.000.000', icon: DollarSign, color: '#41A9A9', bgColor: 'rgba(65, 169, 169, 0.1)', trend: '+12%', positive: true },
    { label: 'SPP Collection', value: '87.5%', icon: TrendingUp, color: '#1ABC9C', bgColor: 'rgba(26, 188, 156, 0.1)', trend: '+5%', positive: true },
    { label: 'Cash Balance', value: 'Rp 500.000.000', icon: DollarSign, color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)', trend: '+8%', positive: true },
    { label: 'Pending Items', value: '15', icon: AlertCircle, color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)', trend: '-3%', positive: false }
  ];

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6F6 100%)',
      padding: '32px 20px',
    },
    wrapper: {
      maxWidth: '1400px',
      margin: '0 auto',
    },
    header: {
      marginBottom: '32px',
    },
    title: {
      fontSize: '32px',
      fontWeight: '800',
      color: '#2C3E50',
      marginBottom: '8px',
      background: 'linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    subtitle: {
      fontSize: '14px',
      color: '#9CA3AF',
    },
    gridKPI: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '32px',
    },
    kpiCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s ease',
      border: '1px solid #E5E7EB',
      cursor: 'pointer',
    },
    kpiCardHover: {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 24px rgba(65, 169, 169, 0.15)',
    },
    kpiHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16px',
    },
    kpiLabel: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#9CA3AF',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    trendBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '12px',
      fontWeight: '600',
      padding: '4px 8px',
      borderRadius: '4px',
    },
    kpiValue: {
      fontSize: '24px',
      fontWeight: '800',
      color: '#2C3E50',
      marginBottom: '12px',
    },
    chartsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
      gap: '24px',
      marginBottom: '32px',
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      border: '1px solid #E5E7EB',
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#2C3E50',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    '@media (max-width: 768px)': {
      gridKPI: {
        gridTemplateColumns: '1fr',
      },
      chartsGrid: {
        gridTemplateColumns: '1fr',
      }
    }
  };

  const chartColors = {
    primary: '#41A9A9',
    secondary: '#2C3E50',
    accent: '#1ABC9C',
  };

  const COLORS = ['#41A9A9', '#2C3E50', '#1ABC9C', '#66C2C2'];

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.title}>📊 Dashboard</div>
          <div style={styles.subtitle}>Sekolah Islam Terpadu Al-Musabbihin - Finance Overview</div>
        </div>

        {/* KPI Cards */}
        <div style={styles.gridKPI}>
          {kpiData.map((kpi, idx) => {
            const Icon = kpi.icon;
            const [isHovered, setIsHovered] = React.useState(false);
            return (
              <div
                key={idx}
                style={{
                  ...styles.kpiCard,
                  ...(isHovered ? styles.kpiCardHover : {}),
                  background: kpi.bgColor,
                  borderLeft: `4px solid ${kpi.color}`,
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <div style={styles.kpiHeader}>
                  <div style={styles.kpiLabel}>{kpi.label}</div>
                  <div style={{
                    ...styles.trendBadge,
                    background: kpi.positive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: kpi.positive ? '#10B981' : '#F59E0B',
                  }}>
                    {kpi.positive ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                    {kpi.trend}
                  </div>
                </div>
                <div style={styles.kpiValue}>{kpi.value}</div>
                <Icon size={24} color={kpi.color} opacity={0.3} />
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div style={styles.chartsGrid}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <TrendingUp size={20} color={chartColors.primary} />
              Revenue Trend
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{
                    background: 'white',
                    border: `2px solid ${chartColors.primary}`,
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={chartColors.primary} 
                  strokeWidth={3}
                  dot={{ fill: chartColors.primary, r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <DollarSign size={20} color={chartColors.secondary} />
              Expense Breakdown
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{
                    background: 'white',
                    border: `2px solid ${chartColors.secondary}`,
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="value" fill={chartColors.primary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <Users size={20} color={chartColors.accent} />
              Fund Allocation
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: Rp ${(value / 1000000).toFixed(1)}M`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `Rp ${(value / 1000000).toFixed(1)}M`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <AlertCircle size={20} color={chartColors.secondary} />
              Financial Summary
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px', fontWeight: '600' }}>TOTAL REVENUE</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981' }}>Rp 50.000.000</div>
              </div>
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px', fontWeight: '600' }}>TOTAL EXPENSES</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#EF4444' }}>Rp 30.000.000</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px', fontWeight: '600' }}>NET PROFIT</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#41A9A9' }}>Rp 20.000.000</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
