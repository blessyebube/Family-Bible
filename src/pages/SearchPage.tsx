import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Lock, X, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface FamilyName {
  id: number;
  name: string;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function SearchPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<FamilyName[]>([]);
  const [allNames, setAllNames] = useState<FamilyName[]>([]);
  const [selectedLetter, setSelectedLetter] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPaymentBanner, setShowPaymentBanner] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/family-names')
      .then(r => r.json())
      .then(d => setAllNames(d.names || []));
  }, []);

  useEffect(() => {
    if (query.length > 0) {
      fetch(`/api/family-names?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(d => { setSuggestions(d.names || []); setShowSuggestions(true); });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const filteredByLetter = selectedLetter
    ? allNames.filter(n => n.name.toUpperCase().startsWith(selectedLetter))
    : [];

  const handleSelectName = (name: string) => {
    setQuery('');
    setShowSuggestions(false);
    navigate(`/family/${encodeURIComponent(name)}`);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Payment reminder banner */}
      <AnimatePresence>
        {showPaymentBanner && !user?.is_unlocked && (
          <motion.div
            initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Bell className="w-4 h-4 flex-shrink-0" />
              <span>🔒 Your account is locked. Unlock it to create albums and upload photos.</span>
              <button onClick={() => navigate('/unlock')}
                className="underline font-bold hover:text-blue-100 ml-1">Unlock Now →</button>
            </div>
            <button onClick={() => setShowPaymentBanner(false)} className="text-blue-200 hover:text-white ml-4">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Header */}
        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">
            Find Your Family
          </h1>
          <p className="text-slate-400">Search by family name to explore albums</p>
        </motion.div>

        {/* Search Bar */}
        <motion.div className="relative mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => query.length > 0 && setShowSuggestions(true)}
              placeholder="Search family name..."
              className="w-full bg-slate-900 border-2 border-slate-700 focus:border-blue-500 rounded-2xl py-4 pl-12 pr-4 text-white text-lg focus:outline-none placeholder:text-slate-600 transition-colors"
            />
            {query && (
              <button onClick={() => { setQuery(''); setShowSuggestions(false); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl z-20"
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              >
                {suggestions.map(s => (
                  <button key={s.id} onClick={() => handleSelectName(s.name)}
                    className="w-full text-left px-5 py-3.5 text-white hover:bg-slate-800 transition-colors flex items-center gap-3 border-b border-slate-800 last:border-0">
                    <Search className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="font-medium">{s.name}</span>
                    <span className="text-slate-500 text-sm ml-auto">Family</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Plus / Create button */}
        <motion.div className="flex justify-center mb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <button
            onClick={() => user?.is_unlocked ? navigate('/create') : navigate('/unlock')}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.5)] group-hover:bg-blue-500 transition-all group-hover:scale-110">
              {user?.is_unlocked ? <Plus className="w-8 h-8 text-white" /> : <Lock className="w-7 h-7 text-white" />}
            </div>
            <span className="text-slate-400 text-sm font-medium group-hover:text-white transition-colors">
              {user?.is_unlocked ? 'Create Album' : 'Unlock to Create'}
            </span>
          </button>
        </motion.div>

        {/* Alphabet Filter */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4 text-center">Browse by Letter</h3>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {ALPHABET.map(letter => {
              const hasNames = allNames.some(n => n.name.toUpperCase().startsWith(letter));
              return (
                <button key={letter}
                  onClick={() => setSelectedLetter(selectedLetter === letter ? '' : letter)}
                  disabled={!hasNames}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                    selectedLetter === letter
                      ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                      : hasNames
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        : 'bg-slate-900 text-slate-700 cursor-not-allowed'
                  }`}>
                  {letter}
                </button>
              );
            })}
          </div>

          {/* Names under selected letter */}
          <AnimatePresence>
            {selectedLetter && filteredByLetter.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
              >
                <div className="px-5 py-3 border-b border-slate-800">
                  <span className="text-blue-400 font-bold text-lg">{selectedLetter}</span>
                  <span className="text-slate-500 text-sm ml-2">— {filteredByLetter.length} families</span>
                </div>
                {filteredByLetter.map(n => (
                  <button key={n.id} onClick={() => handleSelectName(n.name)}
                    className="w-full text-left px-5 py-4 text-white hover:bg-slate-800 transition-colors flex items-center justify-between border-b border-slate-800/50 last:border-0 group">
                    <span className="font-medium text-lg">{n.name}</span>
                    <span className="text-slate-600 group-hover:text-blue-400 transition-colors text-sm flex items-center gap-1">
                      View Albums →
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
