import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PublicView from './pages/PublicView';
import AdminDashboard from './pages/AdminDashboard';

const AdminRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === '1234') {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect PIN');
    }
  };

  if (isAuthenticated) {
    return children;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-4">
      <form onSubmit={handleLogin} className="bg-slate-900 p-8 rounded-xl shadow-2xl border border-slate-800 max-w-sm w-full">
        <h2 className="text-2xl font-bold mb-6 text-center text-purple-400">Admin Access</h2>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter PIN"
          className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg mb-4 focus:outline-none focus:border-purple-500 transition-colors"
        />
        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-purple-900/20"
        >
          Unlock
        </button>
      </form>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-500/30">
        <Routes>
          <Route path="/" element={<PublicView />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
