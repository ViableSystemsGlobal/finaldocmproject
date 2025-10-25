'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, BookOpen, Play } from 'lucide-react';

interface WordOfYearData {
  id: string;
  year: number;
  theme_word: string;
  description: string;
  scripture_reference: string | null;
  background_image_url: string | null;
  sermon: {
    id: string;
    title: string;
    slug: string;
    speaker: string;
    thumbnail_image: string | null;
  } | null;
}

export function WordOfYear() {
  const [wordData, setWordData] = useState<WordOfYearData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWordOfYear();
  }, []);

  const fetchWordOfYear = async () => {
    try {
      const response = await fetch('/api/word-of-year', { cache: 'no-store' });
      const result = await response.json();

      if (result.success && result.data) {
        setWordData(result.data);
        console.log('✅ Word of the Year loaded:', result.data.theme_word);
      } else {
        console.log('ℹ️  No active Word of the Year');
      }
    } catch (error) {
      console.error('❌ Error loading Word of the Year:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show anything if loading or no data
  if (loading || !wordData) {
    return null;
  }

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      {wordData.background_image_url ? (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${wordData.background_image_url})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/80"></div>
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center">
          {/* Label */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full mb-8 border border-white/20">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-white font-semibold text-sm tracking-wide uppercase">
              {wordData.year} Word of the Year
            </span>
          </div>

          {/* The Word */}
          <h2 className="text-7xl md:text-8xl lg:text-9xl font-black text-white mb-8 tracking-tight uppercase leading-none">
            "{wordData.theme_word}"
          </h2>

          {/* Scripture Reference */}
          {wordData.scripture_reference && (
            <div className="flex items-center justify-center gap-2 mb-8">
              <BookOpen className="w-5 h-5 text-yellow-300" />
              <p className="text-xl text-yellow-100 font-semibold">
                {wordData.scripture_reference}
              </p>
            </div>
          )}

          {/* Description */}
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-12 font-light">
            {wordData.description}
          </p>

          {/* CTA - Related Sermon */}
          {wordData.sermon && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href={`/media/sermons/${wordData.sermon.slug}`}
                className="group inline-flex items-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105"
              >
                <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Watch Message Series
              </Link>

              <div className="text-white/80 text-sm">
                <p className="font-semibold">{wordData.sermon.title}</p>
                <p className="text-white/60">by {wordData.sermon.speaker}</p>
              </div>
            </div>
          )}

          {/* Decorative Elements */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-300/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </section>
  );
}

