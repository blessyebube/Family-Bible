import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Calendar, Lock, CheckCircle, Shield, BookOpen, Eye, EyeOff, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [showPwForm, setShowPwForm] = useState(false);
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwMsg, setPwMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const initials = `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase();
  const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPw !== pw.confirm) { setPwMsg({ text: 'Passwords do not match', type: 'error' }); return; }
    if (pw.newPw.length < 8) { setPwMsg({ text: 'Password must be at least 8 characters', type: 'error' }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current: pw.current, newPassword: pw.newPw }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ text: 'Password changed successfully!', type: 'success' });
        setPw({ current: '', newPw: '', confirm: '' });
        setShowPwForm(false);
      } else {
        setPwMsg({ text: data.error || 'Failed to change password', type: 'error' });
      }
    } catch {
      setPwMsg({ text: 'Something went wrong', type: 'error' });
    }
    setLoading(false);
    setTimeout(() => setPwMsg({ text: '', type: '' }), 4000);
  };

  const InfoRow = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-center gap-4 p-4 bg-black/40 rounded-xl border border-slate-800">
      <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-blue-400" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-0.5">{label}</p>
        <p className="text-slate-200 font-medium">{value || <span className="text-slate-600 italic">Not provided</span>}</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white">My Profile</h2>
        <p className="text-slate-400 mt-1">Your Family Bible account details</p>
      </div>

      {/* Avatar + name card */}
      <motion.div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-5 flex items-center gap-5"
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 shadow-lg ${user.is_admin ? 'bg-blue-600 shadow-blue-500/30' : 'bg-slate-700'}`}>
          {initials}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-2xl font-bold text-white">{user.first_name} {user.last_name}</h3>
            {user.is_admin && <Crown className="w-5 h-5 text-yellow-400" title="Admin" />}
          </div>
          <p className="text-slate-400 text-sm mt-0.5">{user.email}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {user.is_admin && (
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider">ADMIN</span>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${user.is_unlocked ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
              {user.is_unlocked ? '🔓 UNLOCKED' : '🔒 LOCKED'}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${user.is_verified ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
              {user.is_verified ? '✓ VERIFIED' : 'UNVERIFIED'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Account details */}
      <motion.div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-5"
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h4 className="text-white font-bold mb-4">Account Details</h4>
        <div className="space-y-3">
          <InfoRow icon={Mail} label="Email Address" value={user.email} />
          <InfoRow icon={Phone} label="Phone Number" value={user.phone} />
          <InfoRow icon={MapPin} label="Location" value={user.location} />
          <InfoRow icon={Calendar} label="Member Since" value={memberSince} />
        </div>
      </motion.div>

      {/* Account status */}
      <motion.div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-5"
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h4 className="text-white font-bold mb-4">Account Status</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: CheckCircle, label: 'Email Verified', active: user.is_verified, yes: 'Verified', no: 'Not Verified' },
            { icon: Shield, label: 'Account Access', active: user.is_unlocked, yes: 'Full Access', no: 'Locked — Pay $2 to unlock' },
            { icon: BookOpen, label: 'Role', active: user.is_admin, yes: 'Administrator', no: 'Member' },
          ].map(item => (
            <div key={item.label} className={`p-4 rounded-xl border ${item.active ? 'bg-green-500/5 border-green-500/20' : 'bg-slate-800/50 border-slate-700'}`}>
              <item.icon className={`w-5 h-5 mb-2 ${item.active ? 'text-green-400' : 'text-slate-500'}`} />
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
              <p className={`text-sm font-bold ${item.active ? 'text-green-400' : 'text-slate-400'}`}>{item.active ? item.yes : item.no}</p>
            </div>
          ))}
        </div>

        {!user.is_unlocked && (
          <div className="mt-4">
            <Link to="/unlock" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
              🔓 Unlock Account — $2.00
            </Link>
          </div>
        )}
      </motion.div>

      {/* Change password */}
      <motion.div className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-bold">Security</h4>
          <button onClick={() => setShowPwForm(!showPwForm)}
            className="text-blue-400 text-sm hover:underline font-medium">
            {showPwForm ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {pwMsg.text && (
          <div className={`p-3 rounded-xl text-sm mb-4 text-center border ${pwMsg.type === 'error' ? 'bg-red-900/20 text-red-400 border-red-900/50' : 'bg-green-900/20 text-green-400 border-green-900/50'}`}>
            {pwMsg.text}
          </div>
        )}

        {showPwForm ? (
          <form onSubmit={handleChangePassword} className="space-y-3">
            {[
              { label: 'Current Password', key: 'current', val: pw.current },
              { label: 'New Password', key: 'newPw', val: pw.newPw },
              { label: 'Confirm New Password', key: 'confirm', val: pw.confirm },
            ].map(f => (
              <div key={f.key}>
                <label className="text-slate-400 text-xs mb-1 block">{f.label}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type={showPw ? 'text' : 'password'} value={f.val}
                    onChange={e => setPw(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                  {f.key === 'confirm' && (
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors disabled:opacity-50 mt-2">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-black/40 rounded-xl border border-slate-800">
            <Lock className="w-5 h-5 text-slate-500" />
            <p className="text-slate-400 text-sm">Password is set. Click "Change Password" to update it.</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-800 text-center">
          <p className="text-slate-600 italic text-xs">"A good name is rather to be chosen than great riches." — Proverbs 22:1</p>
        </div>
      </motion.div>
    </div>
  );
}
