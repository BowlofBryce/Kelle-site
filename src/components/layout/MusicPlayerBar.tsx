import { motion } from 'framer-motion';
import { Play, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function MusicPlayerBar() {
  const [nowPlaying, setNowPlaying] = useState({ artist: '', track: '' });

  useEffect(() => {
    const fetchNowPlaying = async () => {
      const { data } = await supabase
        .from('editable_sections')
        .select('content_json')
        .eq('key', 'music.nowPlaying')
        .maybeSingle();

      if (data?.content_json) {
        const content = data.content_json as { artist: string; track: string };
        setNowPlaying({ artist: content.artist, track: content.track });
      }
    };

    fetchNowPlaying();
  }, []);

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-black via-pink-900/30 to-black border-t-2 border-pink-500/40 backdrop-blur-md z-50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.5 }}
      whileHover={{ y: -4 }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex gap-3">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-gradient-to-t from-pink-500 to-purple-500 rounded-full"
                  animate={{
                    height: [8, 24, 12, 28, 16],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-pink-400 truncate">
                {nowPlaying.track || 'Venus in Furs'}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {nowPlaying.artist || 'The Velvet Underground'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PlayerButton>
              <SkipBack className="w-4 h-4" />
            </PlayerButton>
            <PlayerButton>
              <Play className="w-4 h-4" fill="currentColor" />
            </PlayerButton>
            <PlayerButton>
              <SkipForward className="w-4 h-4" />
            </PlayerButton>
            <PlayerButton>
              <Volume2 className="w-4 h-4" />
            </PlayerButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PlayerButton({ children }: { children: React.ReactNode }) {
  return (
    <motion.button
      className="p-2 rounded-full bg-pink-500/20 text-pink-400 hover:bg-pink-500/40 hover:text-pink-300 transition-colors"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {children}
    </motion.button>
  );
}
