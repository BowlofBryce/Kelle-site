import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ProductGrid } from '../components/merch/ProductGrid';
import { GlitterBorderCard } from '../components/ui/GlitterBorderCard';
import { NeonMarquee } from '../components/ui/NeonMarquee';
import { EditableText } from '../components/ui/EditableText';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { fadeInUp, breathingScale } from '../lib/animations';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];

export function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [heroContent, setHeroContent] = useState({ title: '', bio: '' });
  const [bulletins, setBulletins] = useState<Array<{ text: string; color: string; rotation: number }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .eq('featured', true)
        .not('printify_id', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(8);

      if (products?.length) {
        setFeaturedProducts(products);
      } else {
        const { data: fallbackProducts } = await supabase
          .from('products')
          .select('*')
          .eq('active', true)
          .not('printify_id', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(8);
        if (fallbackProducts) setFeaturedProducts(fallbackProducts);
      }

      const { data: hero } = await supabase
        .from('editable_sections')
        .select('content_json')
        .eq('key', 'home.hero.title')
        .maybeSingle();

      const { data: bio } = await supabase
        .from('editable_sections')
        .select('content_json')
        .eq('key', 'home.hero.bio')
        .maybeSingle();

      if (hero?.content_json) {
        const content = hero.content_json as { text: string };
        setHeroContent(prev => ({ ...prev, title: content.text }));
      }

      if (bio?.content_json) {
        const content = bio.content_json as { text: string };
        setHeroContent(prev => ({ ...prev, bio: content.text }));
      }

      const bulletinKeys = ['home.bulletin.1', 'home.bulletin.2', 'home.bulletin.3'];
      const bulletinData = await Promise.all(
        bulletinKeys.map(key =>
          supabase
            .from('editable_sections')
            .select('content_json')
            .eq('key', key)
            .maybeSingle()
        )
      );

      const loadedBulletins = bulletinData
        .filter(({ data }) => data?.content_json)
        .map(({ data }) => {
          const content = data!.content_json as { text: string; color: string; rotation: number };
          return content;
        });

      if (loadedBulletins.length > 0) setBulletins(loadedBulletins);

      await supabase.from('analytics_events').insert({
        type: 'page_view',
        path: '/',
        session_id: sessionStorage.getItem('session_id') || crypto.randomUUID(),
      });
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <NeonMarquee text="NEW DROPS EVERY FRIDAY" speed={30} />

      <motion.section
        className="relative bg-gradient-to-br from-black/80 via-pink-900/20 to-purple-900/20 border-2 border-pink-500/40 rounded-xl p-8 shadow-[0_0_50px_rgba(255,0,150,0.3)] overflow-hidden"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl"
          animate={breathingScale}
        />
        <motion.div
          className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"
          animate={breathingScale}
        />

        <div className="relative z-10">
          <EditableText
            text={heroContent.title || 'Welcome to The Velvet Hollow'}
            className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"
          />
          <p className="text-xl text-gray-300 mb-6 max-w-2xl leading-relaxed">
            {heroContent.bio ||
              'Your darkest dreams, wearable. Tattoo-inspired streetwear for rebels and artists.'}
          </p>
          <Link to="/shop">
            <AnimatedButton variant="primary">
              Explore The Collection
            </AnimatedButton>
          </Link>
        </div>
      </motion.section>

      <section>
        <motion.h2
          className="text-3xl font-bold mb-6 flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="text-pink-500">★</span>
          <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            Top 8 Products
          </span>
          <span className="text-pink-500">★</span>
        </motion.h2>
        <ProductGrid products={featuredProducts.slice(0, 8)} />
        {featuredProducts.length === 0 && (
          <motion.div
            className="text-center py-12 text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>No featured products yet. Check back soon!</p>
          </motion.div>
        )}
      </section>

      <section>
        <motion.h2
          className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          Bulletin Board
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {bulletins.length > 0 ? (
            bulletins.map((bulletin, i) => (
              <GlitterBorderCard key={i} rotation={bulletin.rotation || 0}>
                <p
                  className="text-lg font-bold text-center"
                  style={{ color: bulletin.color }}
                >
                  {bulletin.text}
                </p>
              </GlitterBorderCard>
            ))
          ) : (
            <>
              <GlitterBorderCard rotation={-3}>
                <p className="text-lg font-bold text-center text-green-400">
                  New drop this Friday!
                </p>
              </GlitterBorderCard>
              <GlitterBorderCard rotation={2}>
                <p className="text-lg font-bold text-center text-pink-400">
                  Limited edition flash tees
                </p>
              </GlitterBorderCard>
              <GlitterBorderCard rotation={-1}>
                <p className="text-lg font-bold text-center text-yellow-400">
                  Free shipping over $50
                </p>
              </GlitterBorderCard>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
