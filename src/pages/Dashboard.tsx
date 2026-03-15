import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PlusCircle, Users, BookOpen, ArrowRight, Search, X, BookMarked, Camera, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Album {
  id: number;
  title: string;
  description: string;
  family_name: string;
  member_count: number;
  invite_code: string;
  created_at: string;
}

const WELCOME_KEY = 'fb_welcome_seen';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/albums')
      .then(r => r.json())
      .then(d => { setAlbums(d.albums || []); setLoading(false); });

    // Show welcome modal if first visit
    const seen = localStorage.getItem(WELCOME_KEY);
    if (!seen) {
      setTimeout(() => setShowWelcome(true), 600);
    }
  }, []);

  const dismissWelcome = () => {
    localStorage.setItem(WELCOME_KEY, '1');
    setShowWelcome(false);
  };

  const goCreateAlbum = () => {
    localStorage.setItem(WELCOME_KEY, '1');
    setShowWelcome(false);
    navigate('/create');
  };

  const handleJoinAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/albums/join', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode }),
    });
    const data = await res.json();
    if (res.ok) {
      setShowJoinModal(false); setInviteCode('');
      fetch('/api/albums').then(r => r.json()).then(d => setAlbums(d.albums || []));
    } else { setJoinError(data.error); }
  };

  const filtered = albums.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.family_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const timeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="container mx-auto px-4 py-8">

      {/* Welcome Modal */}
      <AnimatePresence>
        {showWelcome && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20 }}>

              {/* Top banner */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-center relative">
                <button onClick={dismissWelcome} className="absolute top-4 right-4 text-white/60 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Welcome to Family Bible!</h2>
                <p className="text-blue-200 text-sm">Save your memories, forever.</p>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-slate-300 text-center mb-6">
                  Hi <span className="text-white font-bold">{user?.first_name}</span>! 🎉 Your account is ready. Family Bible helps you preserve and share precious family memories through beautiful digital albums.
                </p>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {[
                    { icon: BookMarked, color: 'text-blue-400', bg: 'bg-blue-500/10', text: 'Create family albums for every occasion' },
                    { icon: Camera, color: 'text-purple-400', bg: 'bg-purple-500/10', text: 'Upload and store unlimited family photos' },
                    { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10', text: 'Invite family members to share memories' },
                  ].map(item => (
                    <div key={item.text} className={`flex items-center gap-3 p-3 ${item.bg} rounded-xl border border-slate-800`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <p className="text-slate-300 text-sm">{item.text}</p>
                    </div>
                  ))}
                </div>

                <p className="text-slate-400 text-sm text-center mb-5">
                  To get started, <span className="text-white font-semibold">create your first album</span> and begin adding your family's story.
                </p>

                {/* CTA */}
                <button onClick={goCreateAlbum}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-3 group">
                  <PlusCircle className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                  Create My First Album
                </button>
                <button onClick={dismissWelcome} className="w-full text-slate-500 hover:text-slate-300 text-sm py-3 transition-colors mt-2">
                  I'll explore first
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
          {timeOfDay()}, <span className="text-blue-400">{user?.first_name}</span> 👋
        </h1>
        <p className="text-slate-400">Your family's memories, all in one place.</p>
      </motion.div>

      {/* Stats bar */}
      {albums.length > 0 && (
        <motion.div className="grid grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {[
            { label: 'Albums', value: albums.length, icon: BookOpen, color: 'text-blue-400' },
            { label: 'Members', value: albums.reduce((s, a) => s + (a.member_count || 0), 0), icon: Users, color: 'text-purple-400' },
            { label: 'Families', value: new Set(albums.map(a => a.family_name).filter(Boolean)).size, icon: Heart, color: 'text-pink-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <s.icon className={`w-6 h-6 ${s.color} flex-shrink-0`} />
              <div>
                <p className="text-white font-bold text-xl">{s.value}</p>
                <p className="text-slate-500 text-xs">{s.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Search + Actions */}
      <motion.div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input type="text" placeholder="Search your albums..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 placeholder:text-slate-600 transition-colors" />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => setShowJoinModal(true)}
            className="flex-1 md:flex-none bg-slate-900 text-white px-6 py-3 rounded-xl border border-slate-800 hover:border-blue-500 hover:text-blue-400 transition-all font-medium flex items-center justify-center gap-2">
            <Users className="w-5 h-5" /> Join Album
          </button>
          <Link to="/create"
            className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] font-bold flex items-center justify-center gap-2 group">
            <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" /> New Album
          </Link>
        </div>
      </motion.div>

      {/* Albums Grid */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          {searchQuery ? `Results for "${searchQuery}"` : 'Your Albums'}
          {filtered.length > 0 && <span className="text-slate-500 font-normal text-sm ml-2">({filtered.length})</span>}
        </h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl h-52 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div className="text-center py-20 bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {searchQuery ? 'No albums match your search' : 'No albums yet'}
          </h3>
          <p className="text-slate-400 mb-8 max-w-xs mx-auto">
            {searchQuery ? 'Try a different search term' : 'Create your first album to start preserving your family memories.'}
          </p>
          {!searchQuery && (
            <Link to="/create"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] group">
              <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              Create Your First Album
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((album, i) => (
            <motion.div key={album.id}
              className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-blue-500/50 transition-all group cursor-pointer"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              whileHover={{ y: -3 }}>
              <Link to={`/album/${album.id}`}>
                <div className="h-44 bg-slate-800 relative overflow-hidden">
                  <img src={`https://picsum.photos/seed/${album.id + 42}/800/400`} alt={album.title}
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  {album.family_name && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-blue-600/80 text-white text-xs px-2 py-1 rounded-full font-bold backdrop-blur-sm">
                        {album.family_name} Family
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-white font-bold text-lg truncate leading-tight">{album.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-slate-300 text-xs flex items-center gap-1">
                        <Users className="w-3 h-3" /> {album.member_count} members
                      </span>
                      <span className="text-slate-400 text-xs">
                        {new Date(album.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block">Invite Code</span>
                    <span className="font-mono text-blue-400 text-sm font-bold">{album.invite_code}</span>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-blue-600 transition-all text-slate-400 group-hover:text-white">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}

          {/* Add New Album card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: filtered.length * 0.06 }}
            whileHover={{ y: -3 }}>
            <Link to="/create"
              className="h-full min-h-[200px] bg-slate-900/50 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group p-6">
              <div className="w-14 h-14 bg-slate-800 group-hover:bg-blue-600 rounded-2xl flex items-center justify-center transition-all">
                <PlusCircle className="w-7 h-7 text-slate-400 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold">New Album</p>
                <p className="text-slate-500 text-sm">Add another family story</p>
              </div>
            </Link>
          </motion.div>
        </div>
      )}

      {/* Join Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div className="bg-slate-900 p-8 rounded-2xl max-w-sm w-full border border-slate-800"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Join an Album</h2>
                <button onClick={() => setShowJoinModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-slate-400 text-sm mb-6">Enter the 6-character invite code shared with you</p>
              {joinError && <div className="bg-red-900/20 text-red-400 p-3 rounded-lg mb-4 text-sm text-center border border-red-900/50">{joinError}</div>}
              <form onSubmit={handleJoinAlbum}>
                <input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="ABC123" maxLength={6}
                  className="w-full bg-black border-2 border-slate-800 p-4 text-center font-mono text-3xl tracking-[0.5em] uppercase text-white focus:outline-none focus:border-blue-500 rounded-xl placeholder:text-slate-700 mb-4 transition-colors" />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowJoinModal(false)}
                    className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors">Cancel</button>
                  <button type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors">Join</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
