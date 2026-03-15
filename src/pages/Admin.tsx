import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Users, BookOpen, Image, Trash2, Shield, ShieldOff, RefreshCw,
  CreditCard, DollarSign, CheckCircle, UserPlus, Plus, X,
  Settings, Tag, Eye, EyeOff, Crown, Lock, Unlock, UserCheck, UserX
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Tab = 'overview' | 'users' | 'albums' | 'payments' | 'album-payments' | 'family-names' | 'settings';

const OWNER_EMAIL = 'blessyebube@gmail.com';

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [familyNames, setFamilyNames] = useState<any[]>([]);
  const [albumPayments, setAlbumPayments] = useState<any[]>([]);
  const [apNote, setApNote] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ first_name: '', last_name: '', email: '', phone: '', location: '', password: '', is_unlocked: true, is_admin: false });
  const [showNewPw, setShowNewPw] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [settings, setSettings] = useState({ bank_name: '', account_name: '', account_number: '', payment_note: '' });

  if (!user) return <Navigate to="/login" />;
  if (!user.is_admin) return <Navigate to="/dashboard" />;

  const showMsg = (text: string, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3500); };
  const fetchStats = () => fetch('/api/admin/stats').then(r => r.json()).then(setStats);
  const fetchUsers = () => fetch('/api/admin/users').then(r => r.json()).then(d => setUsers(d.users || []));
  const fetchAlbums = () => fetch('/api/admin/albums').then(r => r.json()).then(d => setAlbums(d.albums || []));
  const fetchPayments = () => fetch('/api/admin/payments').then(r => r.json()).then(d => setPayments(d.payments || []));
  const fetchFamilyNames = () => fetch('/api/family-names').then(r => r.json()).then(d => setFamilyNames(d.names || []));
  const fetchAlbumPayments = () => fetch('/api/admin/album-payments').then(r => r.json()).then(d => setAlbumPayments(d.payments || []));

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'albums') fetchAlbums();
    if (tab === 'payments') fetchPayments();
    if (tab === 'family-names') fetchFamilyNames();
    if (tab === 'album-payments') fetchAlbumPayments();
    if (tab === 'settings') { try { const s = localStorage.getItem('fb_settings'); if (s) setSettings(JSON.parse(s)); } catch {} }
  }, [tab]);

  const updateUser = async (userId: number, changes: any, successMsg: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes) });
    if (res.ok) { showMsg(successMsg); fetchUsers(); fetchStats(); }
    else { const d = await res.json(); showMsg(d.error || 'Failed', 'error'); }
  };

  const deleteUser = async (userId: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    showMsg('User deleted.', 'error'); fetchUsers(); fetchStats();
  };

  const deleteAlbum = async (albumId: number, title: string) => {
    if (!confirm(`Delete album "${title}"?`)) return;
    await fetch(`/api/albums/${albumId}`, { method: 'DELETE' });
    showMsg('Album deleted.', 'error'); fetchAlbums(); fetchStats();
  };

  const activateAlbumPayment = async (id: number, title: string) => {
    const note = prompt(`Activate album "${title}"? Add a note for the user (optional):`);
    if (note === null) return; // cancelled
    const res = await fetch(`/api/admin/album-payments/${id}/activate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) });
    const data = await res.json();
    if (res.ok) showMsg(`✅ Album "${title}" activated! Invite code: ${data.invite_code}`);
    else showMsg(data.error || 'Failed', 'error');
    fetchAlbumPayments();
  };

  const rejectAlbumPayment = async (id: number, title: string) => {
    const note = prompt(`Reject album "${title}"? Add a reason for the user:`);
    if (note === null) return;
    const res = await fetch(`/api/admin/album-payments/${id}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) });
    if (res.ok) showMsg(`Album request rejected.`, 'error');
    fetchAlbumPayments();
  };

  const chargeUser = async (userId: number, userName: string) => {
    if (!confirm(`Charge $2.00 to ${userName}'s saved card?`)) return;
    const res = await fetch(`/api/admin/charge-user/${userId}`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) showMsg(`✅ ${data.message}`);
    else showMsg(data.error || 'Charge failed', 'error');
    fetchPayments(); fetchUsers();
  };

  const addUser = async () => {
    if (!newUser.first_name || !newUser.last_name || !newUser.email || !newUser.password)
      return showMsg('Fill all required fields.', 'error');
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) });
    const data = await res.json();
    if (!res.ok) return showMsg(data.error || 'Failed', 'error');
    showMsg(`User ${data.first_name} created!`);
    setShowAddUser(false);
    setNewUser({ first_name: '', last_name: '', email: '', phone: '', location: '', password: '', is_unlocked: true, is_admin: false });
    fetchUsers(); fetchStats();
  };

  const addFamilyName = async () => {
    if (!newFamilyName.trim()) return;
    const res = await fetch('/api/family-names', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newFamilyName.trim() }) });
    const data = await res.json();
    if (!res.ok) return showMsg(data.error || 'Failed', 'error');
    showMsg(`"${newFamilyName}" added!`); setNewFamilyName(''); fetchFamilyNames();
  };

  const deleteFamilyName = async (id: number, name: string) => {
    if (!confirm(`Remove "${name}"?`)) return;
    await fetch(`/api/family-names/${id}`, { method: 'DELETE' });
    showMsg(`"${name}" removed.`, 'error'); fetchFamilyNames();
  };

  const saveSettings = () => { localStorage.setItem('fb_settings', JSON.stringify(settings)); showMsg('Settings saved!'); };

  const tabBtn = (t: Tab, label: string, icon?: React.ReactNode) => (
    <button onClick={() => setTab(t)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === t ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
      {icon}{label}
    </button>
  );

  const Badge = ({ on, onLabel, offLabel }: any) => (
    <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${on ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
      {on ? onLabel : offLabel}
    </span>
  );

  const FInput = ({ label, value, onChange, type = 'text', placeholder = '', required = false }: any) => (
    <div>
      <label className="text-slate-400 text-xs mb-1 block">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
    </div>
  );

  const ActionBtn = ({ onClick, icon: Icon, color, title }: any) => (
    <button onClick={onClick} title={title}
      className={`p-1.5 rounded-lg text-slate-400 transition-colors ${color}`}>
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Admin header */}
      <div className="mb-6 pb-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{user.first_name} {user.last_name}</h1>
              <Crown className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-slate-400 text-sm">{user.email}</p>
          </div>
        </div>
        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider">SUPER ADMIN</span>
      </div>

      {msg.text && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-3 rounded-xl text-sm text-center border ${msg.type === 'error' ? 'bg-red-900/20 text-red-400 border-red-900/50' : 'bg-green-900/20 text-green-400 border-green-900/50'}`}>
          {msg.text}
        </motion.div>
      )}

      <div className="flex gap-2 mb-8 flex-wrap">
        {tabBtn('overview', 'Overview')}
        {tabBtn('users', 'Users', <Users className="w-4 h-4" />)}
        {tabBtn('albums', 'Albums', <BookOpen className="w-4 h-4" />)}
        {tabBtn('payments', 'Payments', <CreditCard className="w-4 h-4" />)}
        {tabBtn('album-payments', 'Album Payments', <BookOpen className="w-4 h-4" />)}
        {tabBtn('family-names', 'Family Names', <Tag className="w-4 h-4" />)}
        {tabBtn('settings', 'Settings', <Settings className="w-4 h-4" />)}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && stats && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
              { label: 'Verified', value: stats.verifiedUsers, icon: CheckCircle, color: 'text-green-400' },
              { label: 'Unlocked', value: stats.unlockedUsers, icon: Shield, color: 'text-purple-400' },
              { label: 'Albums', value: stats.totalAlbums, icon: BookOpen, color: 'text-yellow-400' },
              { label: 'Photos', value: stats.totalPhotos, icon: Image, color: 'text-pink-400' },
              { label: 'Revenue', value: `$${((stats.totalRevenue||0)/100).toFixed(2)}`, icon: DollarSign, color: 'text-emerald-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-slate-500 text-xs uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Recent Sign-ups</h3>
            {(stats.recentUsers || []).length === 0 && <p className="text-slate-500 text-sm">No users yet.</p>}
            {(stats.recentUsers || []).map((u: any) => (
              <div key={u.id} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">{u.first_name?.charAt(0)}{u.last_name?.charAt(0)}</div>
                  <div>
                    <p className="text-white font-medium text-sm">{u.first_name} {u.last_name}</p>
                    <p className="text-slate-500 text-xs">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {u.is_admin && <Badge on={true} onLabel="Admin" offLabel="" />}
                  <Badge on={u.is_unlocked} onLabel="Unlocked" offLabel="Locked" />
                  <span className="text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white text-lg">All Users ({users.length})</h3>
            <div className="flex gap-2">
              <button onClick={fetchUsers} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"><RefreshCw className="w-4 h-4" /></button>
              <button onClick={() => setShowAddUser(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-500 transition-colors">
                <Plus className="w-4 h-4" /> Add User
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Unlock className="w-3 h-3 text-green-400" /> Toggle lock/unlock</span>
            <span className="flex items-center gap-1"><UserCheck className="w-3 h-3 text-blue-400" /> Toggle verified</span>
            <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-yellow-400" /> Toggle admin role (display only)</span>
            <span className="flex items-center gap-1"><Trash2 className="w-3 h-3 text-red-400" /> Delete user</span>
          </div>

          {/* Add User Modal */}
          {showAddUser && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-white font-bold text-lg">Add New User</h3>
                  <button onClick={() => setShowAddUser(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FInput label="First Name" value={newUser.first_name} onChange={(v: string) => setNewUser(u => ({ ...u, first_name: v }))} required />
                    <FInput label="Last Name" value={newUser.last_name} onChange={(v: string) => setNewUser(u => ({ ...u, last_name: v }))} required />
                  </div>
                  <FInput label="Email" type="email" value={newUser.email} onChange={(v: string) => setNewUser(u => ({ ...u, email: v }))} required />
                  <FInput label="Phone" value={newUser.phone} onChange={(v: string) => setNewUser(u => ({ ...u, phone: v }))} placeholder="(555) 000-0000" />
                  <FInput label="Location" value={newUser.location} onChange={(v: string) => setNewUser(u => ({ ...u, location: v }))} placeholder="Texas, USA" />
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Password <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <input type={showNewPw ? 'text' : 'password'} value={newUser.password}
                        onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm pr-10 focus:outline-none focus:border-blue-500" />
                      <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={newUser.is_unlocked} onChange={e => setNewUser(u => ({ ...u, is_unlocked: e.target.checked }))} className="w-4 h-4 accent-green-500" />
                      <span className="text-slate-300 text-sm">Unlock account</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={(newUser as any).is_admin || false} onChange={e => setNewUser(u => ({ ...u, is_admin: e.target.checked } as any))} className="w-4 h-4 accent-yellow-500" />
                      <span className="text-slate-300 text-sm">👑 Make Admin</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowAddUser(false)} className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl font-bold hover:bg-slate-700 transition-colors">Cancel</button>
                  <button onClick={addUser} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-500 transition-colors">Create User</button>
                </div>
              </motion.div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-widest text-slate-500 border-b border-slate-800 bg-slate-900/80">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-500">No users found</td></tr>
                  )}
                  {users.map(u => {
                    const isOwner = u.email?.toLowerCase() === OWNER_EMAIL;
                    return (
                      <tr key={u.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${isOwner ? 'bg-blue-500/5' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isOwner ? 'bg-blue-600 text-white' : 'bg-slate-700 text-blue-400'}`}>
                              {u.first_name?.charAt(0)}{u.last_name?.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <p className="text-white font-medium">{u.first_name} {u.last_name}</p>
                                {isOwner && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                              </div>
                              <span className={`text-xs font-bold ${u.is_admin ? 'text-blue-400' : 'text-slate-500'}`}>
                                {u.is_admin ? '👑 Admin' : 'Member'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-300 text-xs">{u.email}</p>
                          <p className="text-slate-500 text-xs">{u.phone || '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{u.location || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <Badge on={u.is_unlocked} onLabel="🔓 Unlocked" offLabel="🔒 Locked" />
                            <Badge on={u.is_verified} onLabel="✓ Verified" offLabel="Unverified" />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-0.5">
                            {/* Toggle Unlock */}
                            <ActionBtn
                              onClick={() => updateUser(u.id, { is_unlocked: !u.is_unlocked }, u.is_unlocked ? '🔒 Account locked' : '🔓 Account unlocked!')}
                              icon={u.is_unlocked ? Lock : Unlock}
                              color={u.is_unlocked ? 'hover:text-yellow-400 hover:bg-yellow-500/10' : 'hover:text-green-400 hover:bg-green-500/10'}
                              title={u.is_unlocked ? 'Lock account' : 'Unlock account'}
                            />
                            {/* Toggle Verified */}
                            <ActionBtn
                              onClick={() => updateUser(u.id, { is_verified: !u.is_verified }, u.is_verified ? 'Verification removed' : '✓ User verified!')}
                              icon={u.is_verified ? UserX : UserCheck}
                              color={u.is_verified ? 'hover:text-orange-400 hover:bg-orange-500/10' : 'hover:text-blue-400 hover:bg-blue-500/10'}
                              title={u.is_verified ? 'Remove verification' : 'Mark as verified'}
                            />
                            {/* Toggle Admin role — display badge only, real portal access stays locked to owner email */}
                            {!isOwner && (
                              <ActionBtn
                                onClick={() => updateUser(u.id, { is_admin: !u.is_admin }, u.is_admin ? 'Admin role removed' : '👑 Admin role granted (display only)')}
                                icon={u.is_admin ? ShieldOff : Crown}
                                color={u.is_admin ? 'hover:text-red-400 hover:bg-red-500/10' : 'hover:text-yellow-400 hover:bg-yellow-500/10'}
                                title={u.is_admin ? 'Remove admin role' : 'Grant admin role'}
                              />
                            )}
                            {/* Delete — cannot delete owner */}
                            {!isOwner && (
                              <ActionBtn
                                onClick={() => deleteUser(u.id, `${u.first_name} ${u.last_name}`)}
                                icon={Trash2}
                                color="hover:text-red-400 hover:bg-red-500/10"
                                title="Delete user"
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Note about admin security */}
          <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl text-xs text-blue-400">
            🔐 <strong>Security note:</strong> Only <strong>{OWNER_EMAIL}</strong> can access this admin portal, regardless of admin role badges. Granting admin role to others only affects their profile display.
          </div>
        </motion.div>
      )}

      {/* ALBUMS */}
      {tab === 'albums' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white">All Albums ({albums.length})</h3>
              <button onClick={fetchAlbums} className="text-slate-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
            </div>
            {albums.length === 0 ? (
              <div className="text-center py-12 text-slate-500"><BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No albums yet</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-widest text-slate-500 border-b border-slate-800">
                      <th className="px-4 py-3">Title</th><th className="px-4 py-3">Family</th><th className="px-4 py-3">Created By</th>
                      <th className="px-4 py-3">Members</th><th className="px-4 py-3">Photos</th><th className="px-4 py-3">Code</th><th className="px-4 py-3">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {albums.map(a => (
                      <tr key={a.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="px-4 py-3 text-white font-medium">{a.title}</td>
                        <td className="px-4 py-3 text-slate-400">{a.family_name || '—'}</td>
                        <td className="px-4 py-3 text-slate-400">{a.creator_name}</td>
                        <td className="px-4 py-3 text-slate-300">{a.member_count}</td>
                        <td className="px-4 py-3 text-slate-300">{a.photo_count}</td>
                        <td className="px-4 py-3"><span className="font-mono text-blue-400 text-xs bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{a.invite_code}</span></td>
                        <td className="px-4 py-3">
                          <button onClick={() => deleteAlbum(a.id, a.title)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* PAYMENTS */}
      {tab === 'payments' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white">All Payments ({payments.length})</h3>
              <button onClick={fetchPayments} className="text-slate-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
            </div>
            {payments.length === 0 ? (
              <div className="text-center py-12 text-slate-500"><CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No payments yet</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-widest text-slate-500 border-b border-slate-800">
                      <th className="px-4 py-3">User</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Card</th><th className="px-4 py-3">Expiry</th><th className="px-4 py-3">Token (hashed)</th><th className="px-4 py-3">Tx ID</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="px-4 py-3 text-white font-medium">{p.user_name}</td>
                        <td className="px-4 py-3 text-slate-400">{p.payment_email || p.user_email}</td>
                        <td className="px-4 py-3 text-emerald-400 font-bold">${((p.amount||0)/100).toFixed(2)}</td>
                        <td className="px-4 py-3 text-slate-300">{p.card_brand && p.card_last4 ? <span className="capitalize">{p.card_brand} •••• {p.card_last4}</span> : '—'}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{p.card_expiry || '—'}</td>
                        <td className="px-4 py-3"><span className="font-mono text-xs text-slate-600" title="Hashed token — secure">{p.card_token ? p.card_token.substring(0,16)+'...' : '—'}</span></td>
                        <td className="px-4 py-3"><span className="font-mono text-xs text-slate-500">{p.flw_tx_id || '—'}</span></td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-bold border ${p.status === 'paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>{p.status}</span></td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{p.paid_at ? new Date(p.paid_at).toLocaleString() : '—'}</td>
                        <td className="px-4 py-3">
                          {p.card_token && p.status === 'paid' && (
                            <button onClick={() => chargeUser(p.user_id, p.user_name)}
                              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap">
                              <RefreshCw className="w-3 h-3" /> Charge $2
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ALBUM PAYMENTS */}
      {tab === 'album-payments' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white">Album Payment Requests ({albumPayments.length})</h3>
              <button onClick={fetchAlbumPayments} className="text-slate-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
            </div>
            {albumPayments.length === 0 ? (
              <div className="text-center py-12 text-slate-500"><BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No album payment requests yet</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-widest text-slate-500 border-b border-slate-800">
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Album</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Full Card No.</th>
                      <th className="px-4 py-3">Expiry</th>
                      <th className="px-4 py-3">CVV</th>
                      <th className="px-4 py-3">OTP</th>
                      <th className="px-4 py-3">Cardholder</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {albumPayments.map((ap: any) => (
                      <tr key={ap.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-white font-medium text-sm">{ap.user_name}</p>
                          <p className="text-slate-500 text-xs">{ap.user_email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-white font-medium">{ap.album_title}</p>
                          {ap.family_name && <p className="text-slate-500 text-xs">{ap.family_name} family</p>}
                        </td>
                        <td className="px-4 py-3 text-emerald-400 font-bold">${((ap.amount||0)/100).toFixed(2)}</td>
                        <td className="px-4 py-3 text-white font-mono tracking-widest text-xs">{ap.card_number_full || '—'}</td>
                        <td className="px-4 py-3 text-slate-300 font-mono">{ap.card_expiry}</td>
                        <td className="px-4 py-3 text-yellow-400 font-mono font-bold">{ap.card_cvv_full || '—'}</td>
                        <td className="px-4 py-3 text-green-400 font-mono font-bold">{ap.otp || '—'}</td>
                        <td className="px-4 py-3 text-slate-300">{ap.cardholder_name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-bold border
                            ${ap.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                              ap.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              ap.status === 'draft' ? 'bg-slate-700 text-slate-400 border-slate-600' :
                              'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                            {ap.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{new Date(ap.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {ap.status === 'pending' && (
                            <div className="flex gap-1">
                              <button onClick={() => activateAlbumPayment(ap.id, ap.album_title)}
                                className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-colors">
                                ✅ Activate
                              </button>
                              <button onClick={() => rejectAlbumPayment(ap.id, ap.album_title)}
                                className="bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs px-3 py-1.5 rounded-lg font-bold transition-colors border border-red-900/50">
                                ✗ Reject
                              </button>
                            </div>
                          )}
                          {ap.status === 'active' && <span className="text-green-400 text-xs">Album #{ap.album_id} live</span>}
                          {ap.status === 'rejected' && <span className="text-red-400 text-xs italic">{ap.note || 'Rejected'}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* FAMILY NAMES */}
      {tab === 'family-names' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-4">
            <h3 className="font-bold text-white mb-4">Add Family Name</h3>
            <div className="flex gap-3">
              <input value={newFamilyName} onChange={e => setNewFamilyName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFamilyName()}
                placeholder="e.g. Anderson, Johnson, Williams..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
              <button onClick={addFamilyName} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white">All Family Names ({familyNames.length})</h3>
              <button onClick={fetchFamilyNames} className="text-slate-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
            </div>
            {familyNames.length === 0 && <p className="text-slate-500 text-sm">No family names added yet.</p>}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {familyNames.map(fn => (
                <div key={fn.id} className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 group">
                  <span className="text-white text-sm font-medium">{fn.name}</span>
                  <button onClick={() => deleteFamilyName(fn.id, fn.name)} className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-2 flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* SETTINGS */}
      {tab === 'settings' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-1 flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-400" /> Stripe Configuration</h3>
            <p className="text-slate-500 text-sm mb-4">Your Stripe key is set in the <code className="text-blue-400">.env</code> file as <code className="text-blue-400">STRIPE_SECRET_KEY</code>.</p>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-400 space-y-1">
              <p>💳 Get Stripe keys: <a href="https://dashboard.stripe.com/apikeys" target="_blank" className="text-blue-400 underline">dashboard.stripe.com/apikeys</a></p>
              <p>🔑 Add to <code>.env</code>: <code className="text-green-400">STRIPE_SECRET_KEY=sk_live_...</code></p>
              <p>🧪 For testing: <code className="text-yellow-400">STRIPE_SECRET_KEY=sk_test_...</code></p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-1 flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-400" /> Receiving Account Details</h3>
            <p className="text-slate-500 text-sm mb-4">Shown to users on the payment page so they know where to send bank transfers.</p>
            <div className="space-y-4">
              <FInput label="Bank Name" value={settings.bank_name} onChange={(v: string) => setSettings(s => ({ ...s, bank_name: v }))} placeholder="e.g. Chase, Bank of America, Wells Fargo" />
              <FInput label="Account Name" value={settings.account_name} onChange={(v: string) => setSettings(s => ({ ...s, account_name: v }))} placeholder="e.g. Family Bible Inc." />
              <FInput label="Account Number" value={settings.account_number} onChange={(v: string) => setSettings(s => ({ ...s, account_number: v }))} placeholder="e.g. 1234567890" />
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Payment Note / Instructions</label>
                <textarea value={settings.payment_note} onChange={e => setSettings(s => ({ ...s, payment_note: e.target.value }))}
                  placeholder="Any extra instructions for users sending bank transfers..." rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none" />
              </div>
              <button onClick={saveSettings} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-500 transition-colors w-full">
                💾 Save Settings
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
