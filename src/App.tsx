import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AlbumView from './pages/AlbumView';
import CreateAlbum from './pages/CreateAlbum';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import SearchPage from './pages/SearchPage';
import FamilyPage from './pages/FamilyPage';
import UnlockPage from './pages/UnlockPage';
import PaymentSuccess from './pages/PaymentSuccess';
import VerifyNotice from './pages/VerifyNotice';
import VerifyEmail from './pages/VerifyEmail';
import { AuthProvider, useAuth } from './context/AuthContext';
import React from 'react';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen bg-black text-white text-lg">Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/verify-notice" element={<PrivateRoute><VerifyNotice /></PrivateRoute>} />
            <Route path="/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
            <Route path="/family/:familyName" element={<PrivateRoute><FamilyPage /></PrivateRoute>} />
            <Route path="/unlock" element={<PrivateRoute><UnlockPage /></PrivateRoute>} />
            <Route path="/payment-success" element={<PrivateRoute><PaymentSuccess /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/album/:id" element={<PrivateRoute><AlbumView /></PrivateRoute>} />
            <Route path="/create" element={<PrivateRoute><CreateAlbum /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
