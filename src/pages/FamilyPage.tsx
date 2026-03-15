import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Lock, BookOpen, Users, Image } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Album {
  id: number;
  title: string;
  description: string;
  invite_code: string;
  creator_name: string;
  member_count: number;
  photo_count: number;
}

export default function FamilyPage() {
  const { familyName } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/albums/family/${encodeURIComponent(familyName || '')}`)
      .then(r => r.json())
      .then(d => { setAlbums(d.albums || []); setLoading(false); });
  }, [familyName]);

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <button onClick={() => navigate('/search')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm font-bold">
          <ArrowLeft className="w-4 h-4" /> Back to Search
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <p className="text-blue-400 text-sm font-bold uppercase tracking-widest mb-1">Family</p>
            <h1 className="text-4xl font-display font-bold text-white">{familyName}</h1>
          </div>

          {loading ? (
            <div className="text-slate-400 text-center py-12">Loading...</div>
          ) : albums.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-white font-bold mb-1">No albums yet for this family</p>
              <p className="text-slate-400 text-sm mb-6">Be the first to create one!</p>
              {user?.is_unlocked
                ? <button onClick={() => navigate('/create')} className="text-blue-400 font-bold hover:underline">Create Album</button>
                : <button onClick={() => navigate('/unlock')} className="text-blue-400 font-bold hover:underline">Unlock to Create</button>
              }
            </div>
          ) : (
            <div className="space-y-4">
              {albums.map((album, i) => (
                <motion.div key={album.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
                >
                  {/* Album card with unlock gate */}
                  <div className="flex">
                    <div className="w-24 h-24 flex-shrink-0 bg-slate-800 relative overflow-hidden">
                      <img src={`https://picsum.photos/seed/${album.id}/200/200`} alt=""
                        className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
                    </div>
                    <div className="p-4 flex-1 flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-bold text-lg">{album.title}</h3>
                        <p className="text-slate-400 text-sm mt-0.5 line-clamp-1">{album.description || 'Family album'}</p>
                        <div className="flex gap-3 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {album.member_count} members</span>
                          <span className="flex items-center gap-1"><Image className="w-3 h-3" /> {album.photo_count} photos</span>
                        </div>
                      </div>
                      {user?.is_unlocked ? (
                        <button onClick={() => navigate(`/album/${album.id}`)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-500 transition-colors flex-shrink-0 ml-4">
                          Open
                        </button>
                      ) : (
                        <button onClick={() => navigate('/unlock')}
                          className="bg-slate-800 text-slate-300 border border-slate-700 hover:border-blue-500 hover:text-blue-400 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex-shrink-0 ml-4 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" /> Unlock
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
