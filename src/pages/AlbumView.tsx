import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Plus, X, Maximize2, Upload, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

interface Photo {
  id: number;
  url: string;
  caption: string;
  date_taken: string;
  uploader_name: string;
  uploaded_by: number;
}

export default function AlbumView() {
  const { id } = useParams();
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [dateTaken, setDateTaken] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = () => {
    fetch(`/api/albums/${id}/photos`)
      .then(r => r.json())
      .then(d => setPhotos(d.photos || []));
  };

  useEffect(() => { fetchPhotos(); }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Please select a photo'); return; }
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('caption', caption);
    formData.append('date_taken', dateTaken);
    try {
      const res = await fetch(`/api/albums/${id}/photos`, { method: 'POST', body: formData });
      if (res.ok) {
        setShowUpload(false);
        setFile(null);
        setPreview(null);
        setCaption('');
        setDateTaken('');
        fetchPhotos();
      } else {
        const d = await res.json();
        setError(d.error || 'Upload failed');
      }
    } catch { setError('Upload failed'); }
    setUploading(false);
  };

  const handleDelete = async (photoId: number) => {
    if (!confirm('Delete this photo?')) return;
    await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
    setSelectedPhoto(null);
    fetchPhotos();
  };

  const selected = photos.find(p => p.id === selectedPhoto);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
        <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold text-sm tracking-wider">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h2 className="text-2xl font-bold text-white">Album Photos</h2>
        <button
          onClick={() => setShowUpload(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center gap-2 text-sm font-bold"
        >
          <Plus className="w-4 h-4" /> Add Photo
        </button>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800">
          <Upload className="w-10 h-10 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No photos yet</h3>
          <p className="text-slate-400 mb-6">Upload the first photo to this album.</p>
          <button onClick={() => setShowUpload(true)} className="text-blue-400 font-bold hover:underline">Upload a photo</button>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              className="break-inside-avoid mb-6 group cursor-pointer"
              onClick={() => setSelectedPhoto(photo.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="bg-slate-900 p-3 pb-8 rounded-2xl shadow-xl border border-slate-800 hover:border-blue-500/50 transition-all duration-300 relative overflow-hidden">
                <div className="overflow-hidden rounded-xl bg-black">
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-all duration-500"
                  />
                </div>
                {photo.caption && (
                  <div className="absolute bottom-3 left-0 right-0 text-center font-bold text-sm text-white opacity-80 group-hover:opacity-100 px-2 truncate">
                    {photo.caption}
                  </div>
                )}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 p-2 rounded-full text-white shadow-lg">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto !== null && selected && (
          <motion.div
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              className="relative max-w-4xl w-full bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-800"
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            >
              <button className="absolute -top-12 right-0 text-slate-400 hover:text-white" onClick={() => setSelectedPhoto(null)}>
                <X className="w-8 h-8" />
              </button>
              <div className="rounded-xl overflow-hidden bg-black">
                <img src={selected.url} alt={selected.caption} className="w-full object-contain max-h-[70vh]" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  {selected.caption && <h3 className="text-xl font-bold text-white">{selected.caption}</h3>}
                  <div className="flex gap-3 mt-1 text-sm text-slate-400">
                    {selected.date_taken && <span>📅 {selected.date_taken}</span>}
                    <span>👤 {selected.uploader_name}</span>
                  </div>
                </div>
                {(user?.id === selected.uploaded_by || user?.is_admin) && (
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-800 shadow-2xl"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Upload Photo</h3>
                <button onClick={() => { setShowUpload(false); setPreview(null); setFile(null); }} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && <div className="bg-red-900/20 text-red-400 border border-red-900/50 p-3 rounded-lg mb-4 text-sm">{error}</div>}

              <form onSubmit={handleUpload} className="space-y-4">
                {/* File Drop Zone */}
                <div
                  className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  {preview ? (
                    <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">Click to choose a photo</p>
                      <p className="text-slate-600 text-xs mt-1">JPG, PNG, WEBP up to 10MB</p>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Caption (optional)</label>
                  <input
                    type="text"
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="e.g. Grandma's birthday 1985"
                    className="w-full bg-black border border-slate-800 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Date Taken (optional)</label>
                  <input
                    type="text"
                    value={dateTaken}
                    onChange={e => setDateTaken(e.target.value)}
                    placeholder="e.g. 1985, Summer 1990, Dec 25 2001"
                    className="w-full bg-black border border-slate-800 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-600 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                >
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
