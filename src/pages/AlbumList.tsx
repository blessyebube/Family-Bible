import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { PlusCircle, Calendar, MapPin } from 'lucide-react';

const albums = [
  { id: 1, title: "Grandma's 80th Birthday", date: "1995-05-12", location: "Family Home", cover: "https://picsum.photos/seed/grandma/400/300" },
  { id: 2, title: "Summer Vacation '02", date: "2002-07-20", location: "Lake Tahoe", cover: "https://picsum.photos/seed/summer/400/300" },
  { id: 3, title: "The Wedding", date: "1988-09-15", location: "St. Mary's Church", cover: "https://picsum.photos/seed/wedding/400/300" },
  { id: 4, title: "Baby Steps", date: "2010-03-01", location: "Nursery", cover: "https://picsum.photos/seed/baby/400/300" },
  { id: 5, title: "Christmas Eve", date: "1999-12-24", location: "Grandparents' House", cover: "https://picsum.photos/seed/xmas/400/300" },
  { id: 6, title: "School Days", date: "2005-09-01", location: "Elementary School", cover: "https://picsum.photos/seed/school/400/300" },
];

export default function AlbumList() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <h2 className="text-3xl font-display font-bold text-white">Family Albums</h2>
        <Link to="/create" className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)] font-medium text-sm">
          <PlusCircle className="w-4 h-4" />
          Create New
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {albums.map((album) => (
          <motion.div
            key={album.id}
            className="group relative bg-slate-900 p-4 rounded-2xl shadow-lg transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl border border-slate-800 hover:border-blue-500/50"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
          >
            <Link to={`/album/${album.id}`} className="block">
              <div className="aspect-[4/3] overflow-hidden mb-4 rounded-xl bg-slate-800 relative">
                <img 
                  src={album.cover} 
                  alt={album.title} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-white font-bold text-sm tracking-wide uppercase">View Album</span>
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="font-bold text-xl text-white mb-1">{album.title}</h3>
                <div className="flex justify-center gap-4 text-xs text-slate-400 mt-2 border-t border-slate-800 pt-2">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-blue-500" /> {new Date(album.date).getFullYear()}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-500" /> {album.location}</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
