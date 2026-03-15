import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); setMessage('No verification token found.'); return; }
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          setMessage(data.message);
          // Refresh user
          fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setUser(d.user); });
        } else {
          setStatus('error');
          setMessage(data.error);
        }
      })
      .catch(() => { setStatus('error'); setMessage('Verification failed.'); });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-black px-4">
      <motion.div className="bg-slate-900 p-10 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full text-center"
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        {status === 'loading' && (
          <>
            <Loader className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-white">Verifying your email...</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
            <p className="text-slate-400 mb-8">{message}</p>
            <button onClick={() => navigate('/search')}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors">
              Go to App →
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-slate-400 mb-8">{message}</p>
            <button onClick={() => navigate('/verify-notice')}
              className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors">
              Request New Link
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
