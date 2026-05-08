import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SPPManagement from './pages/SPPManagement';
import PayrollManagement from './pages/PayrollManagement';
import ExpenseManagement from './pages/ExpenseManagement';
import ProcurementManagement from './pages/ProcurementManagement';
import AccountingModule from './pages/AccountingModule';
import FinancialReports from './pages/FinancialReports';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

const Protected = ({ children }) => (
  <ProtectedRoute>
    <Navbar />
    {children}
  </ProtectedRoute>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/spp" element={<Protected><SPPManagement /></Protected>} />
          <Route path="/payroll" element={<Protected><PayrollManagement /></Protected>} />
          <Route path="/expenses" element={<Protected><ExpenseManagement /></Protected>} />
          <Route path="/procurement" element={<Protected><ProcurementManagement /></Protected>} />
          <Route path="/accounting" element={<Protected><AccountingModule /></Protected>} />
          <Route path="/reports" element={<Protected><FinancialReports /></Protected>} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
