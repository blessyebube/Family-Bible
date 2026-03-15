import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, LogOut, Menu, X, Search, Shield } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const navLink = (to: string, label: string) => (
    <Link to={to} className={`text-sm font-medium transition-colors ${location.pathname === to ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col bg-black font-sans text-slate-200">
      <header className="bg-black/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-blue-600 text-white p-2 rounded-lg group-hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.5)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-display font-bold tracking-tight text-white">Family Bible</h1>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                {navLink('/search', 'Search')}
                {navLink('/dashboard', 'My Albums')}
                {navLink('/create', 'New Album')}
                {user.is_admin ? navLink('/admin', 'Admin') : null}
                <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
                  {!user.is_verified && (
                    <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">Unverified</span>
                  )}
                  <Link to="/profile" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-blue-400 font-bold text-xs border border-slate-700 group-hover:bg-slate-700">
                      {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white">{user.first_name}</span>
                  </Link>
                  <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors" title="Logout">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white">Sign In</Link>
                <Link to="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]">Get Started</Link>
              </div>
            )}
          </nav>

          <button className="md:hidden p-2 text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-slate-800 bg-slate-950 overflow-hidden">
              <div className="px-4 py-4 space-y-4">
                {user ? (
                  <>
                    <Link to="/search" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-slate-200 hover:text-blue-400">Search</Link>
                    <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-slate-200 hover:text-blue-400">My Albums</Link>
                    <Link to="/create" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-slate-200 hover:text-blue-400">New Album</Link>
                    <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-slate-200 hover:text-blue-400">Profile</Link>
                    {user.is_admin && <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-blue-400">Admin Dashboard</Link>}
                    <button onClick={handleLogout} className="block text-sm font-medium text-red-500 w-full text-left">Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-slate-200 hover:text-blue-400">Sign In</Link>
                    <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-blue-400">Get Started</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} className="h-full">
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="bg-black border-t border-slate-800 py-10 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3 opacity-40">
            <BookOpen className="w-4 h-4 text-blue-500" />
            <span className="font-display font-bold text-slate-300 text-sm">Family Bible</span>
          </div>
          <p className="text-slate-600 text-xs">&copy; {new Date().getFullYear()} Family Bible. Preserving memories for generations.</p>
        </div>
      </footer>
    </div>
  );
}
