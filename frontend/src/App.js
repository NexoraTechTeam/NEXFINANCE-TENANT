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
import MasterStudents from './pages/MasterStudents';
import MasterEmployees from './pages/MasterEmployees';
import MasterAccessControl from './pages/MasterAccessControl';
import ActivityLogs from './pages/ActivityLogs';
import Notifications from './pages/Notifications';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

const Protected = ({ children, requiredModule, adminOnly, superAdminOnly }) => (
  <ProtectedRoute requiredModule={requiredModule} adminOnly={adminOnly} superAdminOnly={superAdminOnly}>
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
          <Route path="/dashboard" element={<Protected requiredModule="dashboard"><Dashboard /></Protected>} />
          <Route path="/spp" element={<Protected requiredModule="spp"><SPPManagement /></Protected>} />
          <Route path="/payroll" element={<Protected requiredModule="payroll"><PayrollManagement /></Protected>} />
          <Route path="/expenses" element={<Protected requiredModule="expenses"><ExpenseManagement /></Protected>} />
          <Route path="/procurement" element={<Protected requiredModule="procurement"><ProcurementManagement /></Protected>} />
          <Route path="/accounting" element={<Protected requiredModule="accounting"><AccountingModule /></Protected>} />
          <Route path="/reports" element={<Protected requiredModule="reports"><FinancialReports /></Protected>} />
          <Route path="/master/students" element={<Protected requiredModule="master"><MasterStudents /></Protected>} />
          <Route path="/master/employees" element={<Protected requiredModule="master"><MasterEmployees /></Protected>} />
          <Route path="/master/access" element={<Protected requiredModule="master"><MasterAccessControl /></Protected>} />
          <Route path="/activity-logs" element={<Protected requiredModule="activity"><ActivityLogs /></Protected>} />
          <Route path="/notifications" element={<Protected requiredModule="notifications"><Notifications /></Protected>} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
