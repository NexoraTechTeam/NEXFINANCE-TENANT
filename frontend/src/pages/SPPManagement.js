import React, { useEffect, useState } from 'react';
import { sppService } from '../services/api';
import { DollarSign, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const SPPManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    unpaid: invoices.filter(i => i.status === 'unpaid').length,
    collected: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0),
  };

  const paidPercentage = stats.total > 0 ? ((stats.paid / stats.total) * 100).toFixed(1) : 0;

  const filteredInvoices = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6F6 100%)',
      padding: '32px 20px',
    },
    wrapper: {
      maxWidth: '1200px',
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
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '32px',
    },
    statCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      border: '1px solid #E5E7EB',
    },
    statLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#9CA3AF',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '8px',
    },
    statValue: {
      fontSize: '24px',
      fontWeight: '800',
      color: '#2C3E50',
    },
    filterContainer: {
      display: 'flex',
      gap: '12px',
      marginBottom: '24px',
      flexWrap: 'wrap',
    },
    filterBtn: {
      padding: '10px 20px',
      borderRadius: '8px',
      border: '2px solid #E5E7EB',
      background: 'white',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      color: '#6B7280',
    },
    tableContainer: {
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      border: '1px solid #E5E7EB',
      overflow: 'hidden',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    tableHead: {
      background: 'linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)',
      color: 'white',
    },
    tableHeader: {
      padding: '16px 20px',
      textAlign: 'left',
      fontSize: '13px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    tableRow: {
      borderBottom: '1px solid #E5E7EB',
      transition: 'background-color 0.2s ease',
    },
    tableData: {
      padding: '16px 20px',
      fontSize: '14px',
      color: '#2C3E50',
    },
    statusBadge: (status) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '600',
      background: status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
      color: status === 'paid' ? '#10B981' : '#F59E0B',
    }),
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
      fontSize: '16px',
      color: '#9CA3AF',
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#9CA3AF',
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div>⏳ Loading SPP Data...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.title}>💰 SPP Management</div>
          <div style={styles.subtitle}>Student Fee Collection & Invoice Tracking</div>
        </div>

        {/* Statistics */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Invoices</div>
            <div style={styles.statValue}>{stats.total}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Paid</div>
            <div style={{...styles.statValue, color: '#10B981'}}>{stats.paid}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Unpaid</div>
            <div style={{...styles.statValue, color: '#F59E0B'}}>{stats.unpaid}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Collection Rate</div>
            <div style={{...styles.statValue, color: '#41A9A9'}}>{paidPercentage}%</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Collected</div>
            <div style={styles.statValue}>Rp {(stats.collected / 1000000).toFixed(1)}M</div>
          </div>
        </div>

        {/* Filter */}
        <div style={styles.filterContainer}>
          <button
            style={{
              ...styles.filterBtn,
              ...(filter === 'all' ? {
                background: 'linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)',
                color: 'white',
                border: 'none',
              } : {})
            }}
            onClick={() => setFilter('all')}
          >
            All ({stats.total})
          </button>
          <button
            style={{
              ...styles.filterBtn,
              ...(filter === 'paid' ? {
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10B981',
                border: '2px solid #10B981',
              } : {})
            }}
            onClick={() => setFilter('paid')}
          >
            Paid ({stats.paid})
          </button>
          <button
            style={{
              ...styles.filterBtn,
              ...(filter === 'unpaid' ? {
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#F59E0B',
                border: '2px solid #F59E0B',
              } : {})
            }}
            onClick={() => setFilter('unpaid')}
          >
            Unpaid ({stats.unpaid})
          </button>
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          {filteredInvoices.length > 0 ? (
            <table style={styles.table}>
              <thead style={styles.tableHead}>
                <tr>
                  <th style={styles.tableHeader}>👤 Student</th>
                  <th style={styles.tableHeader}>📚 Class</th>
                  <th style={styles.tableHeader}>💵 Amount</th>
                  <th style={styles.tableHeader}>📅 Month</th>
                  <th style={styles.tableHeader}>📊 Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice, idx) => (
                  <tr 
                    key={invoice.studentId}
                    style={styles.tableRow}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={styles.tableData}>{invoice.studentName}</td>
                    <td style={styles.tableData}>{invoice.class}</td>
                    <td style={{...styles.tableData, fontWeight: '600', color: '#41A9A9'}}>
                      Rp {invoice.amount.toLocaleString('id-ID')}
                    </td>
                    <td style={styles.tableData}>{invoice.month}</td>
                    <td style={styles.tableData}>
                      <div style={styles.statusBadge(invoice.status)}>
                        {invoice.status === 'paid' ? (
                          <>
                            <CheckCircle size={14} />
                            <span>Paid</span>
                          </>
                        ) : (
                          <>
                            <Clock size={14} />
                            <span>Unpaid</span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={styles.emptyState}>
              <AlertCircle size={40} style={{margin: '0 auto 12px', opacity: 0.3}} />
              <div>No invoices found</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SPPManagement;
