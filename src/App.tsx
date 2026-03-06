import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Info, Search, Heart, ExternalLink, List, X, Loader2, Play, Pause, Sparkles, Volume2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { QURAN_WORD_VERSES, type VerseReference } from './constants';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface VerseData {
  arabic: string;
  translation: string;
  surahName: string;
  surah: number;
  ayah: number;
  audioUrl?: string;
}

export default function App() {
  const versesRef = useRef<HTMLElement>(null);
  const [selectedVerse, setSelectedVerse] = useState<VerseReference | null>(null);
  const [verseData, setVerseData] = useState<VerseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const scrollToVerses = (e: React.MouseEvent) => {
    e.preventDefault();
    versesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedVerse(null);
    };
    if (selectedVerse) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      fetchVerse(selectedVerse);
    } else {
      setVerseData(null);
      setError(null);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      document.body.style.overflow = 'unset';
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [selectedVerse]);

  const fetchVerse = async (verse: VerseReference) => {
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const verseKey = `${verse.surah}:${verse.ayah}`;

      // Request Malay (39) and English (131) translations, plus audio (7 = Mishary Alafasy)
      const response = await fetch(
        `https://api.quran.com/api/v4/verses/by_key/${verseKey}?translations=39,131&audio=7&fields=text_uthmani`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}. Please try again.`);
      }

      const json = await response.json();
      const verseObj = json?.verse;

      if (!verseObj) {
        throw new Error('Verse data not found in the response.');
      }

      const arabicText = verseObj.text_uthmani;
      // Find Malay translation (ID 39) or fallback to English (ID 131)
      const malayTrans = verseObj.translations?.find((t: any) => t.resource_id === 39)?.text;
      const englishTrans = verseObj.translations?.find((t: any) => t.resource_id === 131)?.text;

      const translationText = malayTrans || englishTrans;

      if (!arabicText) {
        throw new Error('Arabic text is currently unavailable.');
      }

      setVerseData({
        arabic: arabicText,
        translation: translationText
          ? translationText.replace(/<[^>]*>?/gm, '')
          : 'Terjemahan tidak tersedia untuk ayat ini.',
        surahName: verse.surahName,
        surah: verse.surah,
        ayah: verse.ayah,
        audioUrl: verseObj.audio?.url ? `https://verses.quran.com/${verseObj.audio.url}` : undefined
      });
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Error fetching verse:', err);

      if (err instanceof Error && err.name === 'AbortError') {
        setError('Permintaan tamat masa. Sila semak sambungan anda.');
      } else {
        setError(err instanceof Error ? err.message : 'Ralat tidak dijangka berlaku. Sila cuba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Helper to highlight the word "Quran" in Arabic
  const highlightQuran = (text: string) => {
    // Common forms of "Quran" in Arabic: القرآن, قرآن, بالقرآن, للقرآن
    const quranWords = ['القرآن', 'قرآن', 'بالقرآن', 'للقرآن'];
    let highlighted = text;

    // We use a span with a specific color for the word Quran
    quranWords.forEach(word => {
      const regex = new RegExp(word, 'g');
      highlighted = highlighted.replace(regex, `<span class="text-gold font-bold drop-shadow-[0_0_16px_rgba(212,168,67,0.6)]" style="text-shadow: 0 0 20px rgba(212,168,67,0.3)">${word}</span>`);
    });

    return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-gold/30">
      {/* Navigation */}
      <nav className="nav-glass p-5 md:px-8 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-deep-green/20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A4D38, #13755A)' }}>
            <Book className="w-4 h-4 text-parchment relative z-10" />
            <div className="absolute inset-0 shimmer" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.2em] font-sans font-bold text-stone-800">
              Al-Qur'an Explorer
            </span>
            <span className="text-[8px] uppercase tracking-[0.3em] font-sans text-gold-dark/60">by DrFendi Ameen</span>
          </div>
        </div>
        <div className="hidden md:flex gap-10 text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-stone-400">
          <a href="#" className="hover:text-gold transition-all duration-300 hover:tracking-[0.3em] relative group">Perkataan<span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300 rounded-full" /></a>
          <a href="#verses" onClick={scrollToVerses} className="hover:text-gold transition-all duration-300 hover:tracking-[0.3em] relative group">Kemunculan<span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300 rounded-full" /></a>
          <a href="#" className="hover:text-gold transition-all duration-300 hover:tracking-[0.3em] relative group">Kepentingan<span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300 rounded-full" /></a>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="min-h-[90vh] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
          {/* Background Decorative Orbs */}
          <div className="hero-orb absolute top-[10%] left-[15%] w-[600px] h-[600px] bg-gold animate-pulse" />
          <div className="hero-orb absolute bottom-[15%] right-[10%] w-[500px] h-[500px] bg-deep-green" />
          <div className="hero-orb absolute top-[50%] right-[40%] w-[300px] h-[300px] bg-emerald-glow opacity-[0.05]" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-10 relative z-10"
          >
            <div className="space-y-5">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-soft/80 backdrop-blur-sm border border-deep-green/10 text-[10px] uppercase tracking-[0.4em] font-sans font-bold text-deep-green shadow-sm"
              >
                <Sparkles className="w-3 h-3" />
                Bacaan Suci
              </motion.span>
              <h1 className="text-8xl md:text-[11rem] font-display font-black tracking-tighter leading-none">
                <span className="gradient-text">Quran</span>
              </h1>
            </div>

            {/* Decorative ornament */}
            <div className="flex items-center justify-center gap-4">
              <div className="ornament-line w-16" />
              <div className="glow-dot animate-glow-pulse" />
              <div className="ornament-line w-16" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1.5 }}
              className="font-arabic text-7xl md:text-[9rem] text-deep-green py-4 animate-float" style={{ textShadow: '0 8px 40px rgba(10,77,56,0.15)' }}
            >
              القرآن
            </motion.div>

            <div className="max-w-xl mx-auto space-y-8">
              <p className="text-xl md:text-2xl italic text-stone-600 leading-relaxed font-serif text-balance">
                "Perkataan Arab <span className="font-arabic not-italic text-deep-green font-bold">القرآن</span> — bermaksud 'Bacaan' — muncul tepat <span className="gradient-text font-display font-bold text-3xl not-italic">70</span> kali dalam Teks Suci."
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={scrollToVerses}
                className="btn-primary shadow-xl shadow-deep-green/15"
              >
                ✦ Teroka Kemunculan
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="glow-dot animate-glow-pulse" />
              <div className="w-px h-20 bg-gradient-to-b from-gold/40 to-transparent" />
            </div>
          </motion.div>
        </section>

        {/* Verses Section */}
        <section id="verses" ref={versesRef} className="bg-parchment-dark py-32 px-8 relative overflow-hidden">
          {/* Section top divider */}
          <div className="section-divider absolute top-0 left-0 right-0" />

          <div className="max-w-7xl mx-auto space-y-24">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-sm border border-stone-200/60 shadow-card">
                <div className="glow-dot animate-glow-pulse" style={{ width: '8px', height: '8px' }} />
                <span className="text-[10px] uppercase tracking-[0.3em] font-sans font-bold text-stone-500">Kronik Bacaan</span>
              </div>
              <h2 className="text-6xl md:text-7xl font-display font-bold tracking-tight"><span className="gradient-text">70 Kemunculan</span></h2>
              <p className="text-stone-500 max-w-2xl mx-auto text-lg italic leading-relaxed">
                Koleksi susunan setiap kejadian di mana perkataan "Quran" disebut secara jelas, mendedahkan kepentingan konteksnya di sepanjang wahyu.
              </p>
              {/* Ornament */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <div className="ornament-line w-12" />
                <div className="w-1.5 h-1.5 rounded-full bg-gold/40" />
                <div className="ornament-line w-12" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {QURAN_WORD_VERSES.map((verse, idx) => {
                const isSelected = selectedVerse?.surah === verse.surah && selectedVerse?.ayah === verse.ayah;
                return (
                  <motion.button
                    key={`${verse.surah}-${verse.ayah}`}
                    onClick={() => setSelectedVerse(verse)}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={{ delay: (idx % 10) * 0.04 }}
                    className={cn(
                      "group verse-card",
                      isSelected && "selected"
                    )}
                  >
                    {/* Decorative background number */}
                    <div className="absolute -right-2 -bottom-4 text-8xl font-display font-black text-stone-100/40 group-hover:text-gold/8 transition-colors duration-500 pointer-events-none">
                      {idx + 1}
                    </div>

                    {/* Shimmer overlay on hover */}
                    <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    <div className="flex justify-between items-start relative z-10">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-sans font-bold transition-all duration-300",
                        isSelected ? "text-white shadow-md" : "bg-stone-100/80 text-stone-400 group-hover:text-gold"
                      )} style={isSelected ? { background: 'linear-gradient(135deg, #D4A843, #A07B1A)' } : {}}>
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300",
                        isSelected ? "bg-gold/10" : "group-hover:bg-gold/10"
                      )}>
                        <Search className={cn(
                          "w-3.5 h-3.5 transition-colors duration-300",
                          isSelected ? "text-gold" : "text-stone-300 group-hover:text-gold"
                        )} />
                      </div>
                    </div>

                    <div className="space-y-1.5 relative z-10">
                      <div className={cn(
                        "text-lg font-display font-bold transition-colors duration-300 leading-tight",
                        isSelected ? "text-stone-900" : "text-stone-800 group-hover:text-stone-900"
                      )}>
                        {verse.surahName}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest font-sans font-bold text-stone-400 group-hover:text-gold/70 transition-colors duration-300">
                        Ayat {verse.surah}:{verse.ayah}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Info Section - Etimologi & Makna */}
        <section className="bg-white py-32 px-8 relative overflow-hidden">
          {/* Section divider */}
          <div className="section-divider absolute top-0 left-0 right-0" />
          {/* Subtle geometric pattern background */}
          <div className="absolute inset-0 opacity-[0.012] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0A4D38 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
          {/* Decorative orbs */}
          <div className="hero-orb absolute top-[20%] right-[-5%] w-[500px] h-[500px] bg-gold opacity-[0.04]" />
          <div className="hero-orb absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-deep-green opacity-[0.04]" />

          <div className="max-w-6xl mx-auto space-y-28">
            {/* Section Header */}
            <div className="text-center space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-emerald-soft/80 backdrop-blur-sm border border-deep-green/10 shadow-card">
                  <Info className="w-4 h-4 text-deep-green" />
                  <span className="text-[10px] uppercase tracking-[0.3em] font-sans font-bold text-deep-green">Wawasan Linguistik</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-display font-bold tracking-tight leading-tight">
                  <span className="gradient-text">Etimologi & Makna</span><br /><span className="gradient-text">Ketuhanan</span>
                </h2>
                <div className="flex items-center justify-center gap-3">
                  <div className="ornament-line w-16" />
                  <div className="glow-dot animate-glow-pulse" />
                  <div className="ornament-line w-16" />
                </div>
              </motion.div>
            </div>

            {/* Arabic Root Word Section */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="space-y-8">
                <div className="space-y-6 text-lg text-stone-600 leading-relaxed font-serif">
                  <p>
                    Perkataan <span className="font-bold text-stone-900 border-b-2 border-gold/30">Quran</span> berasal dari kata akar Arab yang membawa makna mendalam iaitu "membaca" atau "bacaan".
                  </p>
                  <p>
                    Ia merupakan kata nama terbitan <span className="italic text-stone-500">(masdar)</span> daripada kata kerja <span className="font-arabic text-2xl text-deep-green">قرأ</span> <span className="text-stone-400">(qara'a)</span>, yang menandakan bukan sekadar sebuah buku, tetapi <span className="font-bold text-deep-green">bacaan yang berterusan dan hidup</span>.
                  </p>
                  <p className="italic border-l-2 border-gold/40 pl-6 py-3 rounded-r-xl" style={{ background: 'rgba(255,248,231,0.5)' }}>
                    {"Dalam tradisi Islam, ia merujuk kepada firman harfiah Allah yang diturunkan kepada Nabi Muhammad ﷺ, terpelihara dalam kefasihan Arab asalnya selama lebih empat belas abad."}
                  </p>
                </div>
              </motion.div>

              {/* Arabic Root Breakdown Card */}
              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
                <div className="absolute -inset-4 rounded-3xl -z-10" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(10,77,56,0.08), transparent 70%)' }} />
                <div className="glass-card rounded-3xl p-10 space-y-8 relative overflow-hidden">
                  <div className="absolute inset-0 shimmer pointer-events-none" />
                  <div className="text-center space-y-3 relative z-10">
                    <div className="text-[10px] uppercase tracking-[0.4em] font-sans font-bold text-gold">Kata Akar Arab</div>
                    <div className="ornament-line w-20 mx-auto" />
                  </div>
                  {/* Root letters */}
                  <div className="flex justify-center items-center gap-4 md:gap-6 relative z-10">
                    {[
                      { letter: 'ق', latin: 'Qāf', delay: 0.3 },
                      { letter: 'ر', latin: 'Rā', delay: 0.5 },
                      { letter: 'أ', latin: 'Hamzah', delay: 0.7 }
                    ].map((item) => (
                      <motion.div key={item.latin} initial={{ opacity: 0, y: 20, scale: 0.8 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ delay: item.delay, type: 'spring', stiffness: 200 }} className="flex flex-col items-center gap-2">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center border border-deep-green/10 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300" style={{ background: 'linear-gradient(135deg, rgba(236,253,245,0.8), rgba(255,255,255,0.9))' }}>
                          <span className="font-arabic text-4xl md:text-5xl text-deep-green">{item.letter}</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest font-sans font-bold text-stone-400">{item.latin}</span>
                      </motion.div>
                    ))}
                  </div>
                  <div className="text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-soft/60 border border-deep-green/10">
                      <span className="text-sm font-sans font-bold text-deep-green">= "Membaca" / "Bacaan"</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { number: '70', label: 'Sebutan Quran', icon: '📖' },
                { number: '114', label: 'Surah', icon: '📜' },
                { number: '6236', label: 'Ayat', icon: '✨' },
                { number: '1400+', label: 'Tahun Terpelihara', icon: '🕌' },
              ].map((stat, idx) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} className="glass-card rounded-2xl p-6 text-center space-y-3 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  <div className="text-2xl">{stat.icon}</div>
                  <div className="text-3xl md:text-4xl font-display font-black relative z-10" style={{ background: 'linear-gradient(180deg, #0A4D38 20%, #D4A843 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stat.number}</div>
                  <div className="text-[10px] uppercase tracking-[0.3em] font-sans font-bold text-stone-400 relative z-10">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Quran Quote Banner */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative">
              <div className="absolute -inset-3 rounded-3xl -z-10" style={{ background: 'linear-gradient(135deg, rgba(10,77,56,0.06), rgba(212,168,67,0.06))' }} />
              <div className="rounded-3xl p-10 md:p-14 text-center space-y-6 border border-deep-green/5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(236,253,245,0.4), rgba(255,248,231,0.4))' }}>
                <div className="absolute inset-0 shimmer pointer-events-none opacity-50" />
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-center gap-4">
                    <div className="ornament-line w-12" />
                    <Sparkles className="w-4 h-4 text-gold" />
                    <div className="ornament-line w-12" />
                  </div>
                  <div className="font-arabic text-3xl md:text-4xl text-deep-green leading-[2] dir-rtl" style={{ textShadow: '0 2px 12px rgba(10,77,56,0.1)' }}>
                    إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ
                  </div>
                  <div className="ornament-line w-24 mx-auto" />
                  <p className="text-lg md:text-xl text-stone-600 italic font-serif max-w-2xl mx-auto leading-relaxed">
                    "Sesungguhnya Kamilah yang menurunkan Al-Quran, dan sesungguhnya Kami benar-benar memeliharanya."
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-stone-200/50 shadow-sm">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-sans font-bold text-gold">Surah Al-Hijr · 15:9</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Feature Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: <Book className="w-6 h-6" />, title: 'Wahyu Ilahi', desc: 'Firman Allah SWT yang diturunkan kepada Nabi Muhammad ﷺ melalui Malaikat Jibril selama 23 tahun.' },
                { icon: <Heart className="w-6 h-6" />, title: 'Pelindung Hati', desc: 'Al-Quran bukan sahaja panduan hidup, malah penawar dan penyembuh bagi setiap jiwa yang mencari ketenteraman.' },
                { icon: <ExternalLink className="w-6 h-6" />, title: 'Mukjizat Linguistik', desc: 'Gaya bahasa Al-Quran yang unik tidak dapat ditandingi oleh mana-mana karya sastera, suatu cabaran yang kekal hingga hari ini.' },
                { icon: <Sparkles className="w-6 h-6" />, title: 'Kekal Terpelihara', desc: 'Satu-satunya kitab suci yang terpelihara dalam bentuk asalnya selama lebih 1,400 tahun tanpa sebarang perubahan.' }
              ].map((feature, idx) => (
                <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} className="group glass-card rounded-2xl p-8 space-y-4 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-deep-green relative z-10 group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(135deg, rgba(236,253,245,0.8), rgba(255,255,255,0.9))' }}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-display font-bold text-stone-900 relative z-10">{feature.title}</h3>
                  <p className="text-stone-500 leading-relaxed font-serif relative z-10">{feature.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Names of the Quran */}
            <div className="space-y-10">
              <div className="text-center space-y-4">
                <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4">
                  <h3 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
                    <span className="gradient-text">Nama-Nama Al-Quran</span>
                  </h3>
                  <p className="text-stone-500 max-w-xl mx-auto italic font-serif">Al-Quran dikenali dengan pelbagai nama mulia dalam teks suci itu sendiri, setiap satunya mencerminkan sifat dan peranannya yang unik.</p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="ornament-line w-10" />
                    <div className="w-1.5 h-1.5 rounded-full bg-gold/40" />
                    <div className="ornament-line w-10" />
                  </div>
                </motion.div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { arabic: 'الكِتَاب', name: 'Al-Kitāb', meaning: 'Kitab / Tulisan' },
                  { arabic: 'الفُرْقَان', name: 'Al-Furqān', meaning: 'Pembeza' },
                  { arabic: 'الذِّكْر', name: 'Al-Dhikr', meaning: 'Peringatan' },
                  { arabic: 'النُّور', name: 'An-Nūr', meaning: 'Cahaya' },
                  { arabic: 'الهُدَى', name: 'Al-Hudā', meaning: 'Petunjuk' },
                  { arabic: 'الشِّفَاء', name: "Al-Shifa'", meaning: 'Penawar' },
                  { arabic: 'الرَّحْمَة', name: 'Al-Raḥmah', meaning: 'Rahmat' },
                  { arabic: 'المَوْعِظَة', name: "Al-Maw'iẓah", meaning: 'Nasihat' },
                ].map((item, idx) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.06 }}
                    className="group glass-card rounded-2xl p-5 text-center space-y-3 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-default"
                  >
                    <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    <div className="font-arabic text-3xl text-deep-green relative z-10 group-hover:scale-110 transition-transform duration-300" style={{ textShadow: '0 2px 8px rgba(10,77,56,0.08)' }}>
                      {item.arabic}
                    </div>
                    <div className="text-xs font-sans font-bold text-stone-700 uppercase tracking-wider relative z-10">{item.name}</div>
                    <div className="text-[10px] font-sans text-gold-dark/70 uppercase tracking-widest relative z-10">{item.meaning}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Revelation Timeline */}
            <div className="space-y-10">
              <div className="text-center space-y-4">
                <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4">
                  <h3 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
                    <span className="gradient-text">Kronologi Pewahyuan</span>
                  </h3>
                  <p className="text-stone-500 max-w-xl mx-auto italic font-serif">Perjalanan 23 tahun penurunan wahyu, dari Gua Hira' hingga penyempurnaan agama di Arafah.</p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="ornament-line w-10" />
                    <div className="w-1.5 h-1.5 rounded-full bg-gold/40" />
                    <div className="ornament-line w-10" />
                  </div>
                </motion.div>
              </div>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px md:-translate-x-px" style={{ background: 'linear-gradient(180deg, rgba(212,168,67,0.4), rgba(10,77,56,0.2), rgba(212,168,67,0.4))' }} />

                <div className="space-y-8">
                  {[
                    { year: '610 M', title: 'Wahyu Pertama', desc: 'Surah Al-Alaq (96:1-5) diturunkan di Gua Hira\' — "Bacalah dengan nama Tuhanmu yang menciptakan."', side: 'left' },
                    { year: '613 M', title: 'Dakwah Terbuka', desc: 'Nabi Muhammad ﷺ mula berdakwah secara terbuka kepada masyarakat Makkah setelah 3 tahun dakwah secara rahsia.', side: 'right' },
                    { year: '622 M', title: 'Hijrah ke Madinah', desc: 'Perpindahan ke Madinah menandakan era baru, di mana banyak surah berkaitan undang-undang dan masyarakat diturunkan.', side: 'left' },
                    { year: '630 M', title: 'Pembukaan Makkah', desc: 'Fath Makkah — kemenangan besar yang disertai penurunan Surah An-Nasr, menandakan kejayaan Islam.', side: 'right' },
                    { year: '632 M', title: 'Wahyu Terakhir', desc: 'Surah Al-Mā\'idah (5:3) — "Pada hari ini Aku telah sempurnakan agamamu dan cukupkan nikmat-Ku kepadamu."', side: 'left' },
                  ].map((event, idx) => (
                    <motion.div
                      key={event.year}
                      initial={{ opacity: 0, x: event.side === 'left' ? -30 : 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1, duration: 0.6 }}
                      className={`relative flex items-start gap-6 ${event.side === 'right' ? 'md:flex-row-reverse md:text-right' : ''}`}
                    >
                      {/* Dot on timeline */}
                      <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-gold bg-parchment z-10 shadow-sm" style={{ top: '6px' }} />

                      {/* Content */}
                      <div className={`ml-14 md:ml-0 md:w-[calc(50%-2rem)] ${event.side === 'right' ? 'md:mr-auto md:pl-10' : 'md:ml-auto md:pr-10'}`}>
                        <div className="glass-card rounded-2xl p-6 space-y-2 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                          <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 relative z-10">
                            <span className="text-[10px] uppercase tracking-widest font-sans font-black text-gold">{event.year}</span>
                          </div>
                          <h4 className="text-lg font-display font-bold text-stone-900 relative z-10">{event.title}</h4>
                          <p className="text-sm text-stone-500 leading-relaxed font-serif relative z-10">{event.desc}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Second Quran Quote */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative">
              <div className="absolute -inset-3 rounded-3xl -z-10" style={{ background: 'linear-gradient(135deg, rgba(212,168,67,0.06), rgba(10,77,56,0.06))' }} />
              <div className="rounded-3xl p-10 md:p-14 text-center space-y-6 border border-gold/10 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,248,231,0.5), rgba(236,253,245,0.3))' }}>
                <div className="absolute inset-0 shimmer pointer-events-none opacity-40" />
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-center gap-4">
                    <div className="ornament-line w-12" />
                    <Sparkles className="w-4 h-4 text-gold" />
                    <div className="ornament-line w-12" />
                  </div>
                  <div className="font-arabic text-3xl md:text-4xl text-deep-green leading-[2] dir-rtl" style={{ textShadow: '0 2px 12px rgba(10,77,56,0.1)' }}>
                    إِنْ هُوَ إِلَّا ذِكْرٌ لِّلْعَالَمِينَ
                  </div>
                  <div className="ornament-line w-24 mx-auto" />
                  <p className="text-lg md:text-xl text-stone-600 italic font-serif max-w-2xl mx-auto leading-relaxed">
                    "Al-Quran itu tidak lain hanyalah peringatan bagi seluruh alam."
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-stone-200/50 shadow-sm">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-sans font-bold text-gold">Surah At-Takwir · 81:27</span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </section>

        {/* Quran & Science Section */}
        <section className="bg-parchment-dark py-32 px-8 relative overflow-hidden">
          {/* Section divider */}
          <div className="section-divider absolute top-0 left-0 right-0" />
          {/* Decorative orbs */}
          <div className="hero-orb absolute top-[10%] left-[-5%] w-[500px] h-[500px] bg-deep-green opacity-[0.04]" />
          <div className="hero-orb absolute bottom-[20%] right-[-5%] w-[400px] h-[400px] bg-gold opacity-[0.04]" />

          <div className="max-w-6xl mx-auto space-y-24">
            {/* Section Header */}
            <div className="text-center space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-sm border border-stone-200/60 shadow-card">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span className="text-[10px] uppercase tracking-[0.3em] font-sans font-bold text-stone-500">Keajaiban Ilmiah</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-display font-bold tracking-tight leading-tight">
                  <span className="gradient-text">Al-Quran & Sains</span>
                </h2>
                <p className="text-stone-500 max-w-2xl mx-auto text-lg italic leading-relaxed font-serif">
                  Al-Quran mengandungi pelbagai isyarat saintifik yang diungkap lebih 1,400 tahun yang lalu, jauh sebelum sains moden menemui kebenarannya.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="ornament-line w-16" />
                  <div className="glow-dot animate-glow-pulse" />
                  <div className="ornament-line w-16" />
                </div>
              </motion.div>
            </div>

            {/* Intro Quote */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative">
              <div className="absolute -inset-3 rounded-3xl -z-10" style={{ background: 'linear-gradient(135deg, rgba(10,77,56,0.06), rgba(212,168,67,0.06))' }} />
              <div className="rounded-3xl p-10 md:p-12 text-center space-y-5 border border-deep-green/5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(236,253,245,0.4), rgba(255,248,231,0.4))' }}>
                <div className="absolute inset-0 shimmer pointer-events-none opacity-40" />
                <div className="relative z-10 space-y-5">
                  <div className="font-arabic text-2xl md:text-3xl text-deep-green leading-[2] dir-rtl" style={{ textShadow: '0 2px 12px rgba(10,77,56,0.1)' }}>
                    سَنُرِيهِمْ آيَاتِنَا فِي الْآفَاقِ وَفِي أَنفُسِهِمْ حَتَّىٰ يَتَبَيَّنَ لَهُمْ أَنَّهُ الْحَقُّ
                  </div>
                  <div className="ornament-line w-20 mx-auto" />
                  <p className="text-lg text-stone-600 italic font-serif max-w-2xl mx-auto leading-relaxed">
                    "Kami akan perlihatkan kepada mereka tanda-tanda (kekuasaan) Kami di segenap ufuk dan pada diri mereka sendiri, sehingga jelaslah bagi mereka bahawa Al-Quran itu adalah benar."
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-stone-200/50 shadow-sm">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-sans font-bold text-gold">Surah Fussilat · 41:53</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Science Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  emoji: '🌌',
                  title: 'Kejadian Alam Semesta',
                  arabic: 'أَوَلَمْ يَرَ الَّذِينَ كَفَرُوا أَنَّ السَّمَاوَاتِ وَالْأَرْضَ كَانَتَا رَتْقًا فَفَتَقْنَاهُمَا',
                  verse: 'Al-Anbiya 21:30',
                  desc: 'Teori Ledakan Besar (Big Bang): Al-Quran menyatakan langit dan bumi pada mulanya bersatu, kemudian dipisahkan — selari dengan penemuan sains moden.'
                },
                {
                  emoji: '🔬',
                  title: 'Perkembangan Embrio',
                  arabic: 'ثُمَّ خَلَقْنَا النُّطْفَةَ عَلَقَةً فَخَلَقْنَا الْعَلَقَةَ مُضْغَةً',
                  verse: "Al-Mu'minun 23:14",
                  desc: 'Al-Quran menggambarkan peringkat perkembangan embrio manusia dengan tepat — nutfah, alaqah, mudghah — berabad sebelum embriologi moden.'
                },
                {
                  emoji: '🌊',
                  title: 'Pemisah Dua Lautan',
                  arabic: 'مَرَجَ الْبَحْرَيْنِ يَلْتَقِيَانِ ۝ بَيْنَهُمَا بَرْزَخٌ لَّا يَبْغِيَانِ',
                  verse: 'Ar-Rahman 55:19-20',
                  desc: 'Dua lautan bertemu tanpa bercampur — fenomena saintifik halokline yang dibuktikan oleh oseanografi moden.'
                },
                {
                  emoji: '⛰️',
                  title: 'Gunung Sebagai Pasak',
                  arabic: 'وَالْجِبَالَ أَوْتَادًا',
                  verse: "An-Naba' 78:7",
                  desc: 'Al-Quran menyifatkan gunung sebagai "pasak" — sains moden mengesahkan gunung mempunyai akar dalam yang menstabilkan kerak bumi.'
                },
                {
                  emoji: '🌍',
                  title: 'Alam Semesta Mengembang',
                  arabic: 'وَالسَّمَاءَ بَنَيْنَاهَا بِأَيْدٍ وَإِنَّا لَمُوسِعُونَ',
                  verse: 'Adh-Dhariyat 51:47',
                  desc: 'Al-Quran menyatakan alam semesta sentiasa mengembang — fakta yang hanya disahkan oleh Edwin Hubble pada tahun 1929.'
                },
                {
                  emoji: '☄️',
                  title: 'Besi dari Angkasa',
                  arabic: 'وَأَنزَلْنَا الْحَدِيدَ فِيهِ بَأْسٌ شَدِيدٌ',
                  verse: 'Al-Hadid 57:25',
                  desc: 'Al-Quran menggunakan kata "diturunkan" untuk besi — sains moden membuktikan besi terbentuk dari bintang dan tiba di bumi melalui meteor.'
                },
              ].map((card, idx) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  className="group glass-card rounded-2xl p-7 space-y-4 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                  {/* Emoji header */}
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="text-3xl">{card.emoji}</div>
                    <h3 className="text-lg font-display font-bold text-stone-900">{card.title}</h3>
                  </div>

                  {/* Arabic verse */}
                  <div className="font-arabic text-xl text-deep-green leading-[2] dir-rtl py-2 px-4 rounded-xl relative z-10" style={{ background: 'rgba(236,253,245,0.4)' }}>
                    {card.arabic}
                  </div>

                  {/* Verse reference */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 relative z-10">
                    <span className="text-[9px] uppercase tracking-widest font-sans font-black text-gold">{card.verse}</span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-stone-500 leading-relaxed font-serif relative z-10">{card.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Closing note */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-3">
                <div className="ornament-line w-12" />
                <div className="w-1.5 h-1.5 rounded-full bg-gold/40" />
                <div className="ornament-line w-12" />
              </div>
              <p className="text-stone-500 italic font-serif leading-relaxed">
                Ini hanyalah sebahagian kecil daripada keajaiban saintifik dalam Al-Quran. Setiap penemuan baru menambahkan lagi bukti bahawa ia adalah wahyu daripada Pencipta alam semesta.
              </p>
            </motion.div>
          </div>
        </section>
        {/* Call to Action / Footer */}
        <footer className="py-24 px-8 text-center bg-parchment-dark relative overflow-hidden">
          {/* Section divider */}
          <div className="section-divider absolute top-0 left-0 right-0" />

          {/* Subtle orb */}
          <div className="hero-orb absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gold opacity-[0.03]" />

          <div className="max-w-md mx-auto space-y-10 relative z-10">
            <div className="flex justify-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/70 backdrop-blur-sm border border-stone-200/60 flex items-center justify-center shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
                <Book className="w-5 h-5 text-gold" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/70 backdrop-blur-sm border border-stone-200/60 flex items-center justify-center shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
                <Heart className="w-5 h-5 text-deep-green" />
              </div>
            </div>

            {/* Ornament */}
            <div className="flex items-center justify-center gap-3">
              <div className="ornament-line w-10" />
              <div className="w-1.5 h-1.5 rounded-full bg-gold/30" />
              <div className="ornament-line w-10" />
            </div>

            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.4em] font-sans font-black text-stone-400">
                Peneroka Al-Qur'an &copy; 2026
              </p>
              <p className="text-sm text-stone-500 italic font-serif text-balance">
                Tempat perlindungan digital untuk meneroka keindahan linguistik Wahyu Terakhir.
              </p>
              <p className="text-xs text-stone-400 mt-6 font-sans">
                Developed by <span className="font-bold text-stone-500">DrFendi Ameen</span>
                <br />
                <a href="mailto:afandi.amin@customs.gov.my" className="hover:text-gold transition-colors duration-300">afandi.amin@customs.gov.my</a>
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* Verse Detail Modal */}
      <AnimatePresence>
        {selectedVerse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVerse(null)}
              className="absolute inset-0 bg-midnight/50 backdrop-blur-md cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] modal-glass rounded-3xl shadow-2xl overflow-y-auto border border-stone-200/60 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                {/* Sticky Header */}
                <div className="sticky top-0 z-20 px-6 py-4 sm:px-10 sm:py-6 flex justify-between items-center" style={{ background: 'linear-gradient(180deg, rgba(251,249,244,0.95), rgba(251,249,244,0.8))', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(212,168,67,0.1)' }}>
                  <div className="space-y-0.5">
                    <h3 className="text-2xl font-display font-bold text-stone-900 leading-tight">{selectedVerse.surahName}</h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-sans font-black">
                      Ayat {selectedVerse.surah}:{selectedVerse.ayah}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedVerse(null)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-100 border border-stone-200 hover:bg-stone-200 transition-all active:scale-95 group shadow-sm"
                    aria-label="Tutup"
                  >
                    <span className="text-[10px] uppercase tracking-widest font-sans font-bold text-stone-600">Tutup</span>
                    <X className="w-4 h-4 text-stone-600 group-hover:text-stone-900" />
                  </button>
                </div>

                <div className="p-6 sm:p-10 pt-4 sm:pt-6 space-y-8 flex-grow">
                  {/* Content */}
                  <div className="min-h-[200px] flex flex-col justify-center">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 className="w-8 h-8 text-gold animate-spin" />
                        <span className="text-xs uppercase tracking-widest text-stone-400 font-sans">Mengambil bacaan...</span>
                      </div>
                    ) : error ? (
                      <div className="text-center py-12 space-y-4">
                        <p className="text-stone-500 italic">{error}</p>
                        <button
                          onClick={() => fetchVerse(selectedVerse)}
                          className="text-xs uppercase tracking-widest font-sans font-bold text-gold hover:text-deep-green transition-colors"
                        >
                          Cuba Lagi
                        </button>
                      </div>
                    ) : verseData ? (
                      <div className="space-y-10 text-center">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="font-arabic text-4xl sm:text-5xl leading-[1.8] text-deep-green dir-rtl"
                        >
                          {highlightQuran(verseData.arabic)}
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-lg sm:text-xl text-stone-600 italic font-serif leading-relaxed"
                        >
                          "{verseData.translation}"
                        </motion.div>

                        {verseData.audioUrl && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="pt-6"
                          >
                            <button
                              onClick={toggleAudio}
                              className="play-btn"
                            >
                              {isPlaying ? (
                                <>
                                  <Pause className="w-5 h-5" />
                                  <span className="text-xs uppercase tracking-widest font-sans font-bold">Jeda</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-5 h-5 ml-1" />
                                  <span className="text-xs uppercase tracking-widest font-sans font-bold">Mainkan</span>
                                </>
                              )}
                            </button>
                            <audio
                              ref={audioRef}
                              src={verseData.audioUrl}
                              onPlay={() => setIsPlaying(true)}
                              onPause={() => setIsPlaying(false)}
                              onEnded={() => setIsPlaying(false)}
                              className="hidden"
                            />
                          </motion.div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {/* Modal Footer */}
                  <div className="pt-6 border-t border-stone-200 flex justify-between items-center">
                    <div className="flex gap-6">
                      <button className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-sans font-bold text-stone-400 hover:text-gold transition-colors">
                        <Heart className="w-3 h-3" />
                        Simpan
                      </button>
                      <button
                        onClick={() => setSelectedVerse(null)}
                        className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-sans font-bold text-stone-400 hover:text-stone-900 transition-colors"
                      >
                        Tutup
                      </button>
                    </div>
                    <a
                      href={`https://quran.com/${selectedVerse.surah}/${selectedVerse.ayah}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-sans font-bold text-stone-400 hover:text-gold transition-colors"
                    >
                      Quran.com
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
