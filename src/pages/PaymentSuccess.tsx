import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const sessionId = params.get('session_id');
    if (!sessionId) { setStatus('error'); return; }
    fetch(`/api/payment/verify?session_id=${sessionId}`)
      .then(r => r.json())
      .then(async data => {
        if (data.success && data.paid) {
          // Refresh user to get is_unlocked = 1
          const me = await fetch('/api/auth/me').then(r => r.json());
          if (me.user) setUser(me.user);
          setStatus('success');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-black px-4">
      <motion.div className="bg-slate-900 p-10 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full text-center"
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        {status === 'loading' && (
          <>
            <Loader className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-white">Confirming your payment...</h2>
            <p className="text-slate-400 mt-2 text-sm">Please wait a moment</p>
          </>
        )}
        {status === 'success' && (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful! 🎉</h2>
            <p className="text-slate-400 mb-2">Your account is now fully unlocked.</p>
            <p className="text-slate-500 text-sm mb-8">A confirmation has been sent to your email.</p>
            <button onClick={() => navigate('/search')}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              Start Exploring →
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Payment Not Confirmed</h2>
            <p className="text-slate-400 mb-8">We couldn't verify your payment. If you were charged, please contact support.</p>
            <button onClick={() => navigate('/unlock')}
              className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors">
              Try Again
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
