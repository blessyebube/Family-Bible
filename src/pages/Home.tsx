import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Users, ArrowRight, Shield, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="flex flex-col bg-black">
      {/* Hero Section */}
      <div className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/wedding/1920/1080" 
            alt="Family Wedding" 
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.h1 
            className="text-5xl md:text-7xl font-display font-bold text-white mb-6 tracking-tight drop-shadow-[0_0_25px_rgba(0,0,0,0.8)]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Preserve Your <span className="text-blue-500">Legacy</span>
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto mb-10 font-light leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            A modern sanctuary for your family's most cherished memories, from weddings to everyday moments.
          </motion.p>
          <motion.button
            onClick={handleGetStarted}
            className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:-translate-y-1 flex items-center gap-2 mx-auto border border-blue-500/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Start Your Family Bible <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Gallery Section */}
      <section className="py-24 bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Celebrate Life's Moments</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">From the big celebrations to the quiet gatherings, every photo tells a part of your story.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[600px] md:h-[400px]">
            <motion.div 
              className="relative rounded-2xl overflow-hidden group h-full md:col-span-2 border border-slate-800"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <img src="https://picsum.photos/seed/bride/800/600" alt="Wedding" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-6">
                <span className="text-white font-bold text-xl drop-shadow-md">Weddings</span>
              </div>
            </motion.div>
            <motion.div 
              className="relative rounded-2xl overflow-hidden group h-full border border-slate-800"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <img src="https://picsum.photos/seed/baby/400/600" alt="Newborn" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-6">
                <span className="text-white font-bold text-xl drop-shadow-md">New Beginnings</span>
              </div>
            </motion.div>
            <motion.div 
              className="relative rounded-2xl overflow-hidden group h-full border border-slate-800"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <img src="https://picsum.photos/seed/family/400/600" alt="Reunion" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-6">
                <span className="text-white font-bold text-xl drop-shadow-md">Reunions</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Shield, title: "Private & Secure", desc: "Your memories are encrypted and shared only with invited family members." },
              { icon: Users, title: "Collaborative", desc: "Invite family members to contribute their own photos and stories to shared albums." },
              { icon: Clock, title: "Timeless Design", desc: "A digital experience designed to feel as permanent and precious as a physical heirloom." }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition-colors group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-12 h-12 bg-slate-800 text-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
