import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, CreditCard, Building2, CheckCircle, Loader, Shield, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

declare global {
  interface Window { FlutterwaveCheckout: any; }
}

export default function UnlockPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [method, setMethod] = useState<'card' | 'bank' | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [payData, setPayData] = useState<any>(null);
  const [bankSettings, setBankSettings] = useState<any>({});

  useEffect(() => {
    try {
      const s = localStorage.getItem('fb_settings');
      if (s) setBankSettings(JSON.parse(s));
    } catch {}
  }, []);

  // Load Flutterwave script
  useEffect(() => {
    if (!document.getElementById('flw-script')) {
      const script = document.createElement('script');
      script.id = 'flw-script';
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  if (!user) return null;
  // Admin never needs to pay — go straight to admin panel
  if (user.is_admin) {
    navigate('/admin');
    return null;
  }
  if (user.is_unlocked) {
    navigate('/dashboard');
    return null;
  }

  const initiatePayment = async () => {
    setLoading(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await fetch('/api/payment/initiate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setMsg({ text: data.error || 'Failed to start payment', type: 'error' }); setLoading(false); return; }
      setPayData(data);

      // Launch Flutterwave modal
      window.FlutterwaveCheckout({
        public_key: data.public_key,
        tx_ref: data.tx_ref,
        amount: data.amount,
        currency: data.currency,
        payment_options: 'card',
        customer: {
          email: data.email,
          name: data.name,
          phone_number: data.phone || '',
        },
        customizations: {
          title: 'Family Bible',
          description: 'Unlock full access to family albums',
          logo: '',
        },
        meta: { user_id: user.id },
        callback: async (response: any) => {
          if (response.status === 'successful' || response.status === 'completed') {
            setVerifying(true);
            await verifyPayment(data.tx_ref, response.transaction_id);
          } else {
            setMsg({ text: 'Payment was not completed. Please try again.', type: 'error' });
          }
        },
        onclose: () => {
          setLoading(false);
        },
      });
    } catch {
      setMsg({ text: 'Something went wrong. Please try again.', type: 'error' });
    }
    setLoading(false);
  };

  const verifyPayment = async (tx_ref: string, transaction_id?: string) => {
    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx_ref, transaction_id }),
      });
      const data = await res.json();
      if (data.paid) {
        setUser({ ...user, is_unlocked: 1 });
        navigate('/payment-success');
      } else {
        setMsg({ text: 'Payment verification failed. Contact support if charged.', type: 'error' });
      }
    } catch {
      setMsg({ text: 'Verification error. Contact support.', type: 'error' });
    }
    setVerifying(false);
  };

  if (verifying) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-black">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl font-bold">Verifying your payment...</p>
          <p className="text-slate-400 mt-2">Please wait, do not close this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[90vh] bg-black py-12 px-4">
      <motion.div className="max-w-lg w-full"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Unlock Family Bible</h2>
          <p className="text-slate-400 mt-2">One-time payment of <span className="text-white font-bold">$2.00</span> for lifetime access</p>
        </div>

        {msg.text && (
          <div className={`p-4 rounded-xl text-sm text-center border mb-6 ${msg.type === 'error' ? 'bg-red-900/20 text-red-400 border-red-900/50' : 'bg-green-900/20 text-green-400 border-green-900/50'}`}>
            {msg.text}
          </div>
        )}

        {/* What you get */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-bold mb-4">What you get:</h3>
          {['Create unlimited family albums', 'Upload and store family photos', 'Invite family members to albums', 'Browse all family archives', 'Lifetime access — pay once'].map(item => (
            <div key={item} className="flex items-center gap-3 py-2">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-slate-300">{item}</span>
            </div>
          ))}
        </div>

        {/* Payment method selection */}
        {!method && (
          <div className="space-y-3">
            <button onClick={() => setMethod('card')}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-500 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              <CreditCard className="w-6 h-6" />
              Pay with Card — $2.00
            </button>
            <button onClick={() => setMethod('bank')}
              className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-3 border border-slate-700">
              <Building2 className="w-5 h-5" />
              Pay via Bank Transfer
            </button>
          </div>
        )}

        {/* Card payment */}
        {method === 'card' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-green-400" />
                <p className="text-slate-300 text-sm">Secured by <span className="text-white font-bold">Flutterwave</span> — your card details are encrypted and never stored in plain text.</p>
              </div>
              {payData?.has_saved_card && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
                  <p className="text-blue-400 text-sm font-bold mb-1">💳 Saved Card Detected</p>
                  <p className="text-slate-300 text-sm">{payData.saved_card.brand} •••• {payData.saved_card.last4} — exp {payData.saved_card.expiry}</p>
                </div>
              )}
              <button onClick={initiatePayment} disabled={loading}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader className="w-5 h-5 animate-spin" /> Opening payment...</> : <><CreditCard className="w-5 h-5" /> Pay $2.00 Now</>}
              </button>
            </div>
            <button onClick={() => setMethod(null)} className="w-full text-slate-500 hover:text-white text-sm py-2 transition-colors">← Back to options</button>
          </motion.div>
        )}

        {/* Bank transfer */}
        {method === 'bank' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-4">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-400" /> Bank Transfer Details</h3>
              {bankSettings.bank_name ? (
                <div className="space-y-3">
                  {[
                    { label: 'Bank Name', value: bankSettings.bank_name },
                    { label: 'Account Name', value: bankSettings.account_name },
                    { label: 'Account Number', value: bankSettings.account_number },
                    { label: 'Amount', value: '$2.00 USD' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                      <span className="text-slate-500 text-sm">{item.label}</span>
                      <span className="text-white font-bold text-sm">{item.value}</span>
                    </div>
                  ))}
                  {bankSettings.payment_note && (
                    <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                      <p className="text-yellow-400 text-xs">{bankSettings.payment_note}</p>
                    </div>
                  )}
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <p className="text-blue-400 text-xs">⏳ After payment, send your receipt to the admin. Your account will be unlocked within 24 hours.</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <RefreshCw className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Bank details not configured yet. Please use card payment or contact support.</p>
                </div>
              )}
            </div>
            <button onClick={() => setMethod(null)} className="w-full text-slate-500 hover:text-white text-sm py-2 transition-colors">← Back to options</button>
          </motion.div>
        )}

        <p className="text-center text-slate-600 text-xs mt-6">
          🔐 Payments are processed securely by Flutterwave. We never store your full card details.
        </p>
      </motion.div>
    </div>
  );
}
