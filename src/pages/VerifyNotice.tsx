import { motion } from 'motion/react';
import { Mail, RefreshCw, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VerifyNotice() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const resend = async () => {
    setLoading(true);
    await fetch('/api/auth/resend-verification', { method: 'POST' });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-black px-4">
      <motion.div className="bg-slate-900 p-10 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full text-center"
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Check Your Email</h2>
        <p className="text-slate-400 mb-2">
          We sent a verification link to:
        </p>
        <p className="text-blue-400 font-bold mb-6">{user?.email}</p>
        <p className="text-slate-500 text-sm mb-8">
          Click the link in the email to verify your account. After verifying, you can continue to the app.
        </p>

        {sent && (
          <div className="bg-green-900/20 text-green-400 border border-green-900/50 p-3 rounded-lg mb-4 text-sm">
            Verification email resent!
          </div>
        )}

        <div className="space-y-3">
          <button onClick={() => navigate('/search')}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
            Continue to App <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={resend} disabled={loading || sent}
            className="w-full bg-slate-800 text-slate-300 py-3 rounded-xl font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {sent ? 'Email Sent!' : 'Resend Verification Email'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
