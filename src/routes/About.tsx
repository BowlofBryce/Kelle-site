import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Heart, Skull, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EditableText } from '../components/ui/EditableText';
import { fadeInUp, staggerContainer } from '../lib/animations';

export function About() {
  const [bioContent, setBioContent] = useState('');

  useEffect(() => {
    const fetchBio = async () => {
      const { data } = await supabase
        .from('editable_sections')
        .select('content_json')
        .eq('key', 'about.bio')
        .maybeSingle();

      if (data?.content_json) {
        const content = data.content_json as { text: string };
        setBioContent(content.text);
      }
    };

    fetchBio();
  }, []);

  return (
    <div className="space-y-12">
      <motion.section
        className="text-center py-12"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="inline-block mb-6"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <Skull className="w-24 h-24 text-pink-500" />
        </motion.div>

        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
          About The Velvet Hollow
        </h1>

        <EditableText
          text={
            bioContent ||
            "The Velvet Hollow was born from late-night tattoo sessions and a love for early 2000s internet aesthetics. We create wearable art for those who never quite fit in."
          }
          className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
        />
      </motion.section>

      <motion.section
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <ValueCard
          icon={<Heart className="w-12 h-12" fill="currentColor" />}
          title="Passion for Art"
          description="Every design is inspired by traditional tattoo flash and modern street art culture."
          color="pink"
        />
        <ValueCard
          icon={<Skull className="w-12 h-12" />}
          title="Rebel Spirit"
          description="We celebrate the outcasts, the misfits, and those who color outside the lines."
          color="purple"
        />
        <ValueCard
          icon={<Sparkles className="w-12 h-12" />}
          title="Nostalgic Vibes"
          description="Bringing back the chaotic beauty of MySpace, MSN, and late-night forum culture."
          color="cyan"
        />
      </motion.section>

      <motion.section
        className="bg-gradient-to-br from-black/80 to-pink-900/20 border-2 border-pink-500/40 rounded-xl p-12 shadow-[0_0_50px_rgba(255,0,150,0.3)]"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-3xl font-bold mb-6 text-pink-400">Our Story</h2>
        <div className="space-y-4 text-gray-300 leading-relaxed">
          <p>
            It started in a dimly lit tattoo parlor at 2 AM. Between the buzz of machines and the
            smell of fresh ink, we realized something was missing from modern fashion: the raw,
            unfiltered energy of underground art culture.
          </p>
          <p>
            The Velvet Hollow bridges the gap between permanent ink and temporary fabric. We work
            with talented tattoo artists to bring their flash designs to life on premium streetwear
            that doesn't compromise on quality or authenticity.
          </p>
          <p>
            But we're more than just clothing. We're a digital time capsule, celebrating the era
            when the internet felt like a secret club and your MySpace top 8 actually mattered. When
            you wear The Velvet Hollow, you're not just wearing a design—you're wearing a statement.
          </p>
        </div>
      </motion.section>

      <motion.section
        className="text-center py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <h2 className="text-3xl font-bold mb-6 text-purple-400">Join the Family</h2>
        <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
          Follow us for new drops, artist collaborations, and exclusive behind-the-scenes content
          from the darker side of fashion.
        </p>
        <div className="flex justify-center gap-4">
          {['Instagram', 'Twitter', 'TikTok'].map(platform => (
            <motion.a
              key={platform}
              href="#"
              className="px-6 py-3 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-2 border-pink-500/40 rounded-lg text-pink-400 hover:from-pink-500/40 hover:to-purple-500/40 transition-all"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {platform}
            </motion.a>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

function ValueCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'pink' | 'purple' | 'cyan';
}) {
  const colorClasses = {
    pink: 'text-pink-500 border-pink-500/40 shadow-[0_0_30px_rgba(255,0,150,0.2)]',
    purple: 'text-purple-500 border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.2)]',
    cyan: 'text-cyan-500 border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.2)]',
  };

  return (
    <motion.div
      className={`bg-black/60 border-2 rounded-lg p-6 ${colorClasses[color]}`}
      variants={fadeInUp}
      whileHover={{ y: -4, scale: 1.02 }}
    >
      <div className={`mb-4 ${colorClasses[color]}`}>{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-gray-100">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}
