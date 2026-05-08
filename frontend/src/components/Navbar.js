import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Menu } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="text-2xl font-bold">NexFinance</Link>
            <div className="hidden md:flex space-x-6">
              <Link to="/dashboard" className="hover:text-teal-100 transition">Dashboard</Link>
              <Link to="/spp" className="hover:text-teal-100 transition">SPP</Link>
              <a href="#" className="hover:text-teal-100 transition">Payroll</a>
              <a href="#" className="hover:text-teal-100 transition">Expenses</a>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm">{user?.email}</span>
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded flex items-center space-x-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
