import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, User, Lock, Mail, Phone, MapPin, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
  'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
  'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming'
];

export default function Signup() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', state: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          location: form.state ? `${form.state}, USA` : '',
          password: form.password,
        }),
      });
      const data = await res.json();
      if (res.ok) { login(data.user); navigate(data.user.is_admin ? '/admin' : '/unlock'); }
      else { setError(data.error); }
    } catch { setError('Registration failed. Please try again.'); }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[90vh] bg-black py-12 px-4">
      <motion.div className="bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-800 max-w-lg w-full"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-slate-800 text-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create Your Account</h2>
          <p className="text-slate-400 mt-1 text-sm">Join the Family Bible community</p>
        </div>

        {error && <div className="bg-red-900/20 text-red-400 p-3 rounded-lg mb-4 text-sm text-center border border-red-900/50">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">First Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" value={form.first_name} onChange={set('first_name')} required placeholder="John"
                  className="w-full bg-black border border-slate-800 rounded-lg py-2.5 pl-9 pr-3 text-white text-sm focus:outline-none focus:border-blue-500 placeholder:text-slate-600" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Last Name *</label>
              <input type="text" value={form.last_name} onChange={set('last_name')} required placeholder="Smith"
                className="w-full bg-black border border-slate-800 rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:border-blue-500 placeholder:text-slate-600" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com"
                className="w-full bg-black border border-slate-800 rounded-lg py-2.5 pl-9 pr-3 text-white text-sm focus:outline-none focus:border-blue-500 placeholder:text-slate-600" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="tel" value={form.phone} onChange={set('phone')} placeholder="(555) 000-0000"
                className="w-full bg-black border border-slate-800 rounded-lg py-2.5 pl-9 pr-3 text-white text-sm focus:outline-none focus:border-blue-500 placeholder:text-slate-600" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">State</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select value={form.state} onChange={set('state')}
                className="w-full bg-black border border-slate-800 rounded-lg py-2.5 pl-9 pr-3 text-white text-sm focus:outline-none focus:border-blue-500 appearance-none">
                <option value="">Select your state</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password * <span className="text-slate-600">(min. 8 characters)</span></label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} required placeholder="••••••••"
                className="w-full bg-black border border-slate-800 rounded-lg py-2.5 pl-9 pr-9 text-white text-sm focus:outline-none focus:border-blue-500 placeholder:text-slate-600" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="password" value={form.confirm} onChange={set('confirm')} required placeholder="••••••••"
                className="w-full bg-black border border-slate-800 rounded-lg py-2.5 pl-9 pr-3 text-white text-sm focus:outline-none focus:border-blue-500 placeholder:text-slate-600" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50 mt-2">
            {loading ? 'Creating Account...' : 'Create Account →'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-blue-400 font-bold hover:text-blue-300">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
