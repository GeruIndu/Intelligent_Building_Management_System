import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/UsersPage';
import FloorsPage from './pages/FloorsPage';
import SpacesPage from './pages/SpacesPage';
import AccessLogsPage from './pages/AccessLogsPage';
import Nav from './components/Nav';
import { getToken, getUser } from './utils/auth';
import AdminPermissionsPage from './pages/AdminPermissionsPage';
import HomePage from './pages/HomePage';

function Protected({ children, roles }) {
  const token = getToken();
  const user = getUser();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && roles.length && !roles.includes(user?.role)) return <div style={{ padding: 20 }}>Forbidden — insufficient role</div>;
  return children;
}

// inside your <Routes>:

export default function App() {
  return (
    <Router>
      <Nav />
      <div className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/users" element={<Protected roles={['admin', 'manager']}><UsersPage /></Protected>} />
          <Route path="/floors" element={<Protected><FloorsPage /></Protected>} />
          <Route path="/spaces" element={<Protected><SpacesPage /></Protected>} />
          <Route path="/access-logs" element={<Protected><AccessLogsPage /></Protected>} />
          <Route path="/permissions" element={<Protected roles={['admin', 'manager']}><AdminPermissionsPage /></Protected>} />

          <Route path="*" element={<div style={{ padding: 20 }}>Page not found</div>} />
        </Routes>
      </div>
    </Router>
  );
}
