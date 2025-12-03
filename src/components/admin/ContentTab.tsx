import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AnimatedButton } from '../ui/AnimatedButton';
import { fadeInUp } from '../../lib/animations';

interface SiteContent {
  key: string;
  value: any;
  description: string;
}

export function ContentTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [content, setContent] = useState<Record<string, any>>({
    site_title: 'The Velvet Hollow',
    site_tagline: 'Where ink meets fabric',
    hero_title: 'Welcome to The Velvet Hollow',
    hero_subtitle: 'Exclusive merch & designs from the underground',
    about_text: 'We are The Velvet Hollow - blending tattoo culture with fashion...',
    bulletin_text: '🎉 NEW DROP ALERT! Check out our latest designs!',
    bulletin_enabled: true,
    featured_category: 'merch',
    instagram_url: '',
    twitter_url: '',
    email_contact: 'hello@velvethollowe.com',
  });

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('site_content').select('*');

      if (data && data.length > 0) {
        const contentMap: Record<string, any> = {};
        data.forEach((item) => {
          contentMap[item.key] = item.value;
        });
        setContent({ ...content, ...contentMap });
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      for (const [key, value] of Object.entries(content)) {
        const { data: existing } = await supabase
          .from('site_content')
          .select('id')
          .eq('key', key)
          .maybeSingle();

        if (existing) {
          await supabase.from('site_content').update({ value }).eq('key', key);
        } else {
          await supabase.from('site_content').insert({ key, value });
        }
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving content:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-pink-400">Content Management</h2>
        <div className="flex items-center gap-3">
          {saveStatus === 'success' && (
            <span className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              Saved!
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              Error saving
            </span>
          )}
          <AnimatedButton variant="primary" onClick={handleSave} disabled={saving}>
            <Save className="w-5 h-5 inline mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </AnimatedButton>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-black/60 border-2 border-pink-500/40 rounded-lg p-6">
          <h3 className="text-xl font-bold text-pink-300 mb-4">Site Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Site Title</label>
              <input
                type="text"
                value={content.site_title}
                onChange={(e) => setContent({ ...content, site_title: e.target.value })}
                className="w-full px-4 py-2 bg-black/60 border border-pink-500/40 rounded text-gray-300 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Site Tagline</label>
              <input
                type="text"
                value={content.site_tagline}
                onChange={(e) => setContent({ ...content, site_tagline: e.target.value })}
                className="w-full px-4 py-2 bg-black/60 border border-pink-500/40 rounded text-gray-300 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Contact Email</label>
              <input
                type="email"
                value={content.email_contact}
                onChange={(e) => setContent({ ...content, email_contact: e.target.value })}
                className="w-full px-4 py-2 bg-black/60 border border-pink-500/40 rounded text-gray-300 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="bg-black/60 border-2 border-pink-500/40 rounded-lg p-6">
          <h3 className="text-xl font-bold text-pink-300 mb-4">Homepage Content</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Hero Title</label>
              <input
                type="text"
                value={content.hero_title}
                onChange={(e) => setContent({ ...content, hero_title: e.target.value })}
                className="w-full px-4 py-2 bg-black/60 border border-pink-500/40 rounded text-gray-300 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Hero Subtitle</label>
              <input
                type="text"
                value={content.hero_subtitle}
                onChange={(e) => setContent({ ...content, hero_subtitle: e.target.value })}
                className="w-full px-4 py-2 bg-black/60 border border-pink-500/40 rounded text-gray-300 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="bg-black/60 border-2 border-pink-500/40 rounded-lg p-6">
          <h3 className="text-xl font-bold text-pink-300 mb-4">Bulletin Banner</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={content.bulletin_enabled}
                  onChange={(e) => setContent({ ...content, bulletin_enabled: e.target.checked })}
                  className="w-5 h-5 text-pink-500 bg-black/60 border-pink-500/40 rounded focus:ring-pink-500"
                />
                <span className="text-sm text-gray-400">Enable Bulletin Banner</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Bulletin Text</label>
              <textarea
                value={content.bulletin_text}
                onChange={(e) => setContent({ ...content, bulletin_text: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-black/60 border border-pink-500/40 rounded text-gray-300 focus:outline-none focus:border-pink-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-2">
                This banner appears at the top of the site
              </p>
            </div>
          </div>
        </div>

        <div className="bg-black/60 border-2 border-pink-500/40 rounded-lg p-6">
          <h3 className="text-xl font-bold text-pink-300 mb-4">About Page</h3>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">About Text</label>
            <textarea
              value={content.about_text}
              onChange={(e) => setContent({ ...content, about_text: e.target.value })}
              rows={8}
              className="w-full px-4 py-2 bg-black/60 border border-pink-500/40 rounded text-gray-300 focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>
        </div>

        <div className="bg-black/60 border-2 border-pink-500/40 rounded-lg p-6">
          <h3 className="text-xl font-bold text-pink-300 mb-4">Social Media</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Instagram URL</label>
              <input
                type="text"
                placeholder="https://instagram.com/velvethollowe"
                value={content.instagram_url}
                onChange={(e) => setContent({ ...content, instagram_url: e.target.value })}
                className="w-full px-4 py-2 bg-black/60 border border-pink-500/40 rounded text-gray-300 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Twitter/X URL</label>
              <input
                type="text"
                placeholder="https://twitter.com/velvethollowe"
                value={content.twitter_url}
                onChange={(e) => setContent({ ...content, twitter_url: e.target.value })}
                className="w-full px-4 py-2 bg-black/60 border border-pink-500/40 rounded text-gray-300 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
