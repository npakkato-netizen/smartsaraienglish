import React, { useState, useMemo } from 'react';
import { VowelCategory, PhonicsWord } from '../types/phonics';
import { PHONICS_WORDS, LETTER_PHONICS_MAP } from '../data/phonicsData';
import {
  speakText,
  playPhonicsSound,
  playPhonicsSoundAsync,
  speakLetterPhoneme,
  playSparkleSound,
  playCorrectSound,
  playPopSound,
  playLetterClickSound,
  unlockAudio,
  stopSpeaking,
  speakThaiPhonicsCoachWord,
} from '../utils/audioUtils';
import confetti from 'canvas-confetti';
import { Sparkles, Dices, Volume2, Star, GraduationCap, Printer } from 'lucide-react';

interface WordBlendingMachineProps {
  onAddStars: (amount: number) => void;
  speedRate: number;
  onPrintWord?: (word: PhonicsWord) => void;
}

interface VowelOption {
  id: string;
  label: string;
  soundTh: string;
  soundIpa: string;
  isMagicE?: boolean;
  baseLetter?: string;
  noCoda?: boolean;
}

const SHORT_VOWEL_OPTIONS: VowelOption[] = [
  { id: 'a', label: 'a', soundTh: 'แอ', soundIpa: '/æ/' },
  { id: 'e', label: 'e', soundTh: 'เอะ', soundIpa: '/e/' },
  { id: 'i', label: 'i', soundTh: 'อิ', soundIpa: '/ɪ/' },
  { id: 'o', label: 'o', soundTh: 'เอาะ/ออ', soundIpa: '/ɒ/' },
  { id: 'u', label: 'u', soundTh: 'อะ', soundIpa: '/ʌ/' },
];

const LONG_VOWEL_OPTIONS: VowelOption[] = [
  { id: 'a_e', label: 'a_e', soundTh: 'เอ', soundIpa: '/eɪ/', isMagicE: true, baseLetter: 'a' },
  { id: 'ai', label: 'ai', soundTh: 'เอ', soundIpa: '/eɪ/' },
  { id: 'ay', label: 'ay', soundTh: 'เอ', soundIpa: '/eɪ/', noCoda: true },
  { id: 'ee', label: 'ee', soundTh: 'อี', soundIpa: '/iː/' },
  { id: 'ea', label: 'ea', soundTh: 'อี', soundIpa: '/iː/' },
  { id: 'i_e', label: 'i_e', soundTh: 'ไอ', soundIpa: '/aɪ/', isMagicE: true, baseLetter: 'i' },
  { id: 'igh', label: 'igh', soundTh: 'ไอ', soundIpa: '/aɪ/' },
  { id: 'o_e', label: 'o_e', soundTh: 'โอ', soundIpa: '/oʊ/', isMagicE: true, baseLetter: 'o' },
  { id: 'oa', label: 'oa', soundTh: 'โอ', soundIpa: '/oʊ/' },
  { id: 'u_e', label: 'u_e', soundTh: 'ยู/อู', soundIpa: '/juː/', isMagicE: true, baseLetter: 'u' },
];

const DIPHTHONG_OPTIONS: VowelOption[] = [
  { id: 'oi', label: 'oi', soundTh: 'ออย', soundIpa: '/ɔɪ/' },
  { id: 'oy', label: 'oy', soundTh: 'ออย', soundIpa: '/ɔɪ/', noCoda: true },
  { id: 'ou', label: 'ou', soundTh: 'เอา/อาว', soundIpa: '/aʊ/' },
  { id: 'ow', label: 'ow', soundTh: 'เอา/อาว', soundIpa: '/aʊ/', noCoda: true },
  { id: 'oo_short', label: 'oo (อุ)', soundTh: 'อุ', soundIpa: '/ʊ/' },
  { id: 'oo_long', label: 'oo (อู)', soundTh: 'อู', soundIpa: '/uː/' },
  { id: 'aw', label: 'aw', soundTh: 'ออ', soundIpa: '/ɔː/', noCoda: true },
  { id: 'au', label: 'au', soundTh: 'ออ', soundIpa: '/ɔː/' },
  { id: 'air', label: 'air', soundTh: 'แอร์', soundIpa: '/eər/', noCoda: true },
  { id: 'ear', label: 'ear', soundTh: 'เอีย', soundIpa: '/ɪər/', noCoda: true },
];

// Onsets available per category
const ONSETS_LIST = [
  'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'w',
  'ch', 'sh', 'th', 'cl', 'cr', 'dr', 'fl', 'gr', 'pl', 'sp', 'st', 'tr', 'sn'
];

// Codas
const SHORT_CODAS = ['t', 'n', 'd', 'g', 'p', 'm', 'b', 'x', 'ck', 'l', 's'];
const MAGIC_E_CODAS = ['k', 'm', 't', 'p', 's', 'v', 'd', 'l', 'n', 'z'];
const TEAM_CODAS = ['n', 't', 'd', 'l', 'm', 'k', 'p', 'none'];

export const WordBlendingMachine: React.FC<WordBlendingMachineProps> = ({
  onAddStars,
  speedRate,
  onPrintWord,
}) => {
  const [category, setCategory] = useState<VowelCategory>('short');
  const [selectedOnset, setSelectedOnset] = useState<string>('c');
  const [selectedVowelId, setSelectedVowelId] = useState<string>('a');
  const [selectedCoda, setSelectedCoda] = useState<string>('t');
  const [activeColumn, setActiveColumn] = useState<number | null>(null);
  const [isBlending, setIsBlending] = useState<boolean>(false);
  const [isSpeakingCoach, setIsSpeakingCoach] = useState<boolean>(false);
  const [discoveredCount, setDiscoveredCount] = useState<number>(0);

  // Available vowels based on current category
  const vowelList = useMemo(() => {
    if (category === 'long') return LONG_VOWEL_OPTIONS;
    if (category === 'diphthong') return DIPHTHONG_OPTIONS;
    return SHORT_VOWEL_OPTIONS;
  }, [category]);

  const currentVowelOpt = vowelList.find((v) => v.id === selectedVowelId) || vowelList[0];

  // Available codas based on vowel type
  const codaList = useMemo(() => {
    if (currentVowelOpt.isMagicE) return MAGIC_E_CODAS;
    if (category === 'short') return SHORT_CODAS;
    return TEAM_CODAS;
  }, [category, currentVowelOpt]);

  // Construct combined English word
  const currentCombined = useMemo(() => {
    const o = selectedOnset.toLowerCase();
    const c = selectedCoda === 'none' ? '' : selectedCoda.toLowerCase();

    if (currentVowelOpt.isMagicE) {
      // Magic E: Onset + base letter + Coda + e (e.g. c + a + k + e = cake)
      const base = currentVowelOpt.baseLetter || 'a';
      return `${o}${base}${c}e`.toLowerCase();
    }

    if (currentVowelOpt.id === 'oo_short' || currentVowelOpt.id === 'oo_long') {
      return `${o}oo${c}`.toLowerCase();
    }

    return `${o}${currentVowelOpt.id}${c}`.toLowerCase();
  }, [selectedOnset, currentVowelOpt, selectedCoda]);

  // Search if this word exists in curated 395 words
  const matchedWord: PhonicsWord | undefined = useMemo(() => {
    return PHONICS_WORDS.find((w) => w.word.toLowerCase() === currentCombined);
  }, [currentCombined]);

  // Authentic Phonics Blending Action (Calibrated with patient pacing for beginner learners)
  const handleBlendAction = async () => {
    if (isBlending) return;
    unlockAudio();
    setIsBlending(true);
    stopSpeaking();
    await new Promise((r) => setTimeout(r, 80));

    // Beginner pacing: deliberate enunciation (~0.74x) with ~620ms breathing gap between sounds
    const effectiveRate = Math.min(speedRate || 0.74, 0.76);
    const pauseBetween = Math.max(450, Math.round(920 - (speedRate || 0.74) * 420));

    // Step 1: Onset Consonant Phoneme
    setActiveColumn(1);
    playLetterClickSound();
    await playPhonicsSoundAsync(selectedOnset, effectiveRate);
    await new Promise((r) => setTimeout(r, pauseBetween));

    // Step 2: Vowel / Diphthong Phoneme
    setActiveColumn(2);
    playLetterClickSound();
    let vowelKey = currentVowelOpt.id;
    if (currentVowelOpt.isMagicE) {
      vowelKey =
        currentVowelOpt.id === 'a_e'
          ? 'long-a'
          : currentVowelOpt.id === 'i_e'
          ? 'long-i'
          : currentVowelOpt.id === 'o_e'
          ? 'long-o'
          : 'long-u';
    } else if (currentVowelOpt.soundTh === 'อุ') {
      vowelKey = 'oo_short';
    } else if (currentVowelOpt.soundTh === 'อู') {
      vowelKey = 'oo_long';
    } else if (currentVowelOpt.id === 'ai' || currentVowelOpt.id === 'ay') {
      vowelKey = 'long-a';
    } else if (currentVowelOpt.id === 'ee' || currentVowelOpt.id === 'ea') {
      vowelKey = 'long-e';
    } else if (currentVowelOpt.id === 'igh') {
      vowelKey = 'long-i';
    } else if (currentVowelOpt.id === 'oa') {
      vowelKey = 'long-o';
    }
    await playPhonicsSoundAsync(vowelKey, effectiveRate);
    await new Promise((r) => setTimeout(r, pauseBetween));

    // Step 3: Coda / Ending (if applicable)
    if (selectedCoda !== 'none' && selectedCoda !== '') {
      setActiveColumn(3);
      playLetterClickSound();
      await playPhonicsSoundAsync(selectedCoda, effectiveRate);
      await new Promise((r) => setTimeout(r, pauseBetween));
    }

    // Step 4: Golden Blend Pause & Announce Full Word!
    setActiveColumn(null);
    await new Promise((r) => setTimeout(r, 680));

    playSparkleSound();
    await speakText(currentCombined, { rate: Math.min(speedRate, 0.80), pitch: 1.05 });
    await new Promise((r) => setTimeout(r, 450));

    if (matchedWord) {
      playCorrectSound();
      confetti({
        particleCount: 50,
        spread: 65,
        origin: { y: 0.6 },
      });
      setDiscoveredCount((prev) => prev + 1);
      onAddStars(2);
    }

    setIsBlending(false);
  };

  // Play full Thai teacher coach for matched word
  const handleThaiCoach = async () => {
    if (!matchedWord || isSpeakingCoach) return;
    unlockAudio();
    setIsSpeakingCoach(true);
    await speakThaiPhonicsCoachWord(matchedWord, speedRate);
    setIsSpeakingCoach(false);
  };

  // Category switch
  const handleSelectCategory = (cat: VowelCategory) => {
    setCategory(cat);
    if (cat === 'short') {
      setSelectedOnset('c');
      setSelectedVowelId('a');
      setSelectedCoda('t');
    } else if (cat === 'long') {
      setSelectedOnset('c');
      setSelectedVowelId('a_e');
      setSelectedCoda('k');
    } else {
      setSelectedOnset('c');
      setSelectedVowelId('oi');
      setSelectedCoda('n');
    }
  };

  // Preset buttons
  const presets = useMemo(() => {
    if (category === 'short') {
      return [
        { label: 'cat 🐱', o: 'c', v: 'a', c: 't' },
        { label: 'bed 🛏️', o: 'b', v: 'e', c: 'd' },
        { label: 'pig 🐷', o: 'p', v: 'i', c: 'g' },
        { label: 'hot ☕', o: 'h', v: 'o', c: 't' },
        { label: 'sun ☀️', o: 's', v: 'u', c: 'n' },
        { label: 'duck 🦆', o: 'd', v: 'u', c: 'ck' },
      ];
    }
    if (category === 'long') {
      return [
        { label: 'cake 🎂', o: 'c', v: 'a_e', c: 'k' },
        { label: 'bake 🥐', o: 'b', v: 'a_e', c: 'k' },
        { label: 'rain 🌧️', o: 'r', v: 'ai', c: 'n' },
        { label: 'day ☀️', o: 'd', v: 'ay', c: 'none' },
        { label: 'tree 🌳', o: 'tr', v: 'ee', c: 'none' },
        { label: 'boat ⛵', o: 'b', v: 'oa', c: 't' },
        { label: 'bike 🚲', o: 'b', v: 'i_e', c: 'k' },
        { label: 'rose 🌹', o: 'r', v: 'o_e', c: 's' },
        { label: 'cute 🐱', o: 'c', v: 'u_e', c: 't' },
      ];
    }
    return [
      { label: 'coin 🪙', o: 'c', v: 'oi', c: 'n' },
      { label: 'toy 🧸', o: 't', v: 'oy', c: 'none' },
      { label: 'cow 🐮', o: 'c', v: 'ow', c: 'none' },
      { label: 'cloud ☁️', o: 'cl', v: 'ou', c: 'd' },
      { label: 'book 📖', o: 'b', v: 'oo_short', c: 'k' },
      { label: 'moon 🌙', o: 'm', v: 'oo_long', c: 'n' },
      { label: 'saw 🪚', o: 's', v: 'aw', c: 'none' },
      { label: 'chair 🪑', o: 'ch', v: 'air', c: 'none' },
      { label: 'loud 📢', o: 'l', v: 'ou', c: 'd' },
    ];
  }, [category]);

  const handleRandomSpin = () => {
    playPopSound();
    const randOnset = ONSETS_LIST[Math.floor(Math.random() * ONSETS_LIST.length)];
    const randVowel = vowelList[Math.floor(Math.random() * vowelList.length)];
    const availableCodas = randVowel.isMagicE ? MAGIC_E_CODAS : (category === 'short' ? SHORT_CODAS : TEAM_CODAS);
    const randCoda = availableCodas[Math.floor(Math.random() * availableCodas.length)];

    setSelectedOnset(randOnset);
    setSelectedVowelId(randVowel.id);
    setSelectedCoda(randCoda);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border-2 border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪄</span>
            <h2 className="text-xl sm:text-2xl font-bubble font-black text-purple-700">
              เครื่องผสมเสียงวิเศษ (Phonics Blending Machine)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ฝึกผสมเสียงตามเทคนิคโฟนิกส์แท้ (Phonics Blending Technique) ไม่สะกดทีละตัวอักษร รองรับทั้งสระเสียงสั้น สระเสียงยาว และสระประสม!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRandomSpin}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-extrabold text-xs shadow-2xs transition active:scale-95"
          >
            <Dices className="w-4 h-4 text-purple-600" />
            <span>สุ่มผสมคำ</span>
          </button>

          <div className="flex items-center gap-1.5 bg-amber-400 text-slate-900 font-extrabold px-3 py-1.5 rounded-full text-xs shadow-sm">
            <Star className="w-4 h-4 fill-amber-700 text-amber-700" />
            <span>พบคำจริง: {discoveredCount} คำ</span>
          </div>
        </div>
      </div>

      {/* Category Tabs: Short, Long, Diphthongs */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 bg-white p-2 rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto">
        <button
          onClick={() => handleSelectCategory('short')}
          className={`flex-1 py-2 px-3 rounded-2xl font-bubble font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
            category === 'short'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-300/40 scale-102'
              : 'text-slate-600 hover:bg-amber-50'
          }`}
        >
          <span>🟡 สระเสียงสั้น</span>
          <span className="text-[11px] opacity-90">(125 คำ)</span>
        </button>

        <button
          onClick={() => handleSelectCategory('long')}
          className={`flex-1 py-2 px-3 rounded-2xl font-bubble font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
            category === 'long'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-400/40 scale-102'
              : 'text-slate-600 hover:bg-emerald-50'
          }`}
        >
          <span>🟢 สระเสียงยาว</span>
          <span className="text-[11px] opacity-90">(130 คำ)</span>
        </button>

        <button
          onClick={() => handleSelectCategory('diphthong')}
          className={`flex-1 py-2 px-3 rounded-2xl font-bubble font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
            category === 'diphthong'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-400/40 scale-102'
              : 'text-slate-600 hover:bg-purple-50'
          }`}
        >
          <span>🟣 สระประสม</span>
          <span className="text-[11px] opacity-90">(140 คำ)</span>
        </button>
      </div>

      {/* Preset Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">ตัวอย่างลองกด:</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setSelectedOnset(p.o);
              setSelectedVowelId(p.v);
              setSelectedCoda(p.c);
            }}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50 transition shadow-2xs whitespace-nowrap active:scale-95"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 3 Interactive Machine Slots */}
      <div className="bg-gradient-to-b from-purple-50/50 via-amber-50/30 to-white rounded-3xl p-6 sm:p-8 shadow-xl border-3 border-purple-200 text-center">
        <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto">
          {/* Column 1: Onset (พยัญชนะต้น) */}
          <div className="space-y-3">
            <div className="text-xs font-extrabold text-slate-600 bg-white py-1 rounded-xl shadow-2xs border border-slate-200">
              1. พยัญชนะต้น (Onset)
            </div>
            <div
              className={`h-24 sm:h-28 rounded-3xl flex items-center justify-center font-bubble font-black text-3xl sm:text-5xl transition-all duration-200 shadow-md ${
                activeColumn === 1
                  ? 'bg-amber-400 text-white ring-4 ring-amber-200 scale-105'
                  : 'bg-white text-slate-800 border-2 border-slate-200'
              }`}
            >
              {selectedOnset}
            </div>
            <div className="text-xs text-slate-500 font-thai font-semibold">
              เสียง: {LETTER_PHONICS_MAP[selectedOnset]?.thaiHelp || `${selectedOnset}ึ`}
            </div>

            {/* Scrollable selectors */}
            <div className="grid grid-cols-3 gap-1 max-h-40 overflow-y-auto p-1 bg-white/80 rounded-2xl border border-slate-200">
              {ONSETS_LIST.map((o) => (
                <button
                  key={o}
                  onClick={() => {
                    setSelectedOnset(o);
                    playPhonicsSound(o, speedRate);
                  }}
                  className={`py-1.5 rounded-lg font-bubble font-bold text-xs sm:text-sm transition ${
                    selectedOnset === o
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'hover:bg-purple-50 text-slate-700'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* Column 2: Vowel / Diphthong (สระหรือสระประสม) */}
          <div className="space-y-3">
            <div className="text-xs font-extrabold text-rose-700 bg-rose-50 py-1 rounded-xl shadow-2xs border border-rose-200">
              2. สระ / สระประสม (Vowel)
            </div>
            <div
              className={`h-24 sm:h-28 rounded-3xl flex items-center justify-center font-bubble font-black text-2xl sm:text-4xl transition-all duration-200 shadow-md px-2 ${
                activeColumn === 2
                  ? 'bg-rose-500 text-white ring-4 ring-rose-200 scale-105'
                  : 'bg-rose-50 text-rose-700 border-2 border-rose-300'
              }`}
            >
              {currentVowelOpt.label}
            </div>
            <div className="text-xs text-rose-600 font-thai font-semibold truncate">
              {currentVowelOpt.soundTh} ({currentVowelOpt.soundIpa})
            </div>

            {/* Vowels list selector */}
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto p-1 bg-white/80 rounded-2xl border border-slate-200">
              {vowelList.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVowelId(v.id);
                    let k = v.id;
                    if (v.isMagicE) {
                      k = v.id === 'a_e' ? 'long-a' : v.id === 'i_e' ? 'long-i' : v.id === 'o_e' ? 'long-o' : 'long-u';
                    } else if (v.soundTh === 'อุ') {
                      k = 'oo_short';
                    } else if (v.soundTh === 'อู') {
                      k = 'oo_long';
                    } else if (v.id === 'ai' || v.id === 'ay') {
                      k = 'long-a';
                    } else if (v.id === 'ee' || v.id === 'ea') {
                      k = 'long-e';
                    } else if (v.id === 'igh') {
                      k = 'long-i';
                    } else if (v.id === 'oa') {
                      k = 'long-o';
                    }
                    playPhonicsSound(k, speedRate);
                  }}
                  className={`py-1 px-2 rounded-lg font-bubble font-bold text-xs flex items-center justify-between transition ${
                    selectedVowelId === v.id
                      ? 'bg-rose-500 text-white shadow-2xs'
                      : 'hover:bg-rose-50 text-slate-700'
                  }`}
                >
                  <span>{v.label}</span>
                  <span className="text-[10px] opacity-90 font-thai">{v.soundTh}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Column 3: Coda / Ending (ตัวสะกด) */}
          <div className="space-y-3">
            <div className="text-xs font-extrabold text-slate-600 bg-white py-1 rounded-xl shadow-2xs border border-slate-200">
              3. ตัวสะกดท้าย (Coda)
            </div>
            <div
              className={`h-24 sm:h-28 rounded-3xl flex items-center justify-center font-bubble font-black text-2xl sm:text-4xl transition-all duration-200 shadow-md ${
                activeColumn === 3
                  ? 'bg-amber-400 text-white ring-4 ring-amber-200 scale-105'
                  : 'bg-white text-slate-800 border-2 border-slate-200'
              }`}
            >
              {currentVowelOpt.isMagicE ? `${selectedCoda}...e` : (selectedCoda === 'none' ? '—' : selectedCoda)}
            </div>
            <div className="text-xs text-slate-500 font-thai font-semibold">
              {currentVowelOpt.isMagicE
                ? `เสียง ${selectedCoda}ึ + Magic E`
                : selectedCoda === 'none'
                ? 'ไม่มีตัวสะกด'
                : `เสียง: ${LETTER_PHONICS_MAP[selectedCoda]?.thaiHelp || `${selectedCoda}ึ`}`}
            </div>

            {/* Codas list selector */}
            <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto p-1 bg-white/80 rounded-2xl border border-slate-200">
              {codaList.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setSelectedCoda(r);
                    if (r !== 'none') playPhonicsSound(r, speedRate);
                  }}
                  className={`py-1.5 rounded-lg font-bubble font-bold text-xs transition ${
                    selectedCoda === r
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'hover:bg-purple-50 text-slate-700'
                  }`}
                >
                  {currentVowelOpt.isMagicE ? `${r}...e` : (r === 'none' ? 'ไม่มี' : r)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Big Blend Action Button */}
        <div className="mt-8 flex flex-col items-center justify-center">
          <button
            onClick={handleBlendAction}
            disabled={isBlending}
            className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-bubble font-black text-xl text-white shadow-xl transition-all active:scale-95 ${
              isBlending
                ? 'bg-amber-400 animate-pulse'
                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 shadow-purple-300/50'
            }`}
          >
            <Sparkles className="w-6 h-6" />
            <span>{isBlending ? 'กำลังผสมเสียงทีละตัวอย่างช้าๆ...' : `ผสมเสียง: ${currentCombined.toUpperCase()}!`}</span>
          </button>
          <div className="text-xs text-amber-900 font-bold mt-2.5 flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-2xs">
            <span>🐢 จังหวะช้าชัดเจน เหมาะสำหรับนักเรียนเริ่มเรียน (ฟังพยัญชนะชัดเต็มเสียง)</span>
          </div>
        </div>

        {/* Real Word Discovery Card */}
        {matchedWord ? (
          <div className="mt-6 max-w-xl mx-auto bg-white rounded-3xl p-5 border-2 border-amber-300 shadow-lg text-center animate-fadeIn space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>🎉 ว้าว! ค้นพบคำศัพท์จริง: {matchedWord.word.toUpperCase()}! (+2 ดาว)</span>
            </div>

            <div className="flex items-center justify-center gap-4 mt-1">
              <span className="text-5xl">{matchedWord.emoji}</span>
              <div className="text-left">
                <div className="font-bubble text-3xl font-black text-slate-900">
                  {matchedWord.word}
                </div>
                <div className="text-sm font-bold text-amber-700">
                  อ่านว่า: {matchedWord.phoneticTh} ({matchedWord.phoneticIPA}) • {matchedWord.meaningTh}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 italic">
              "{matchedWord.sentence}" ({matchedWord.sentenceTh})
            </p>

            {/* Thai Teacher Phonics Coaching Button */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleThaiCoach}
                disabled={isSpeakingCoach}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs border transition active:scale-95 ${
                  isSpeakingCoach
                    ? 'bg-purple-100 text-purple-900 border-purple-300 animate-pulse'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-purple-600" />
                <span>{isSpeakingCoach ? 'ครูไทยกำลังอธิบายเทคนิคการผสม...' : '🇹🇭 ฟังครูไทยสอนผสมเสียงคำนี้'}</span>
              </button>

              <button
                type="button"
                onClick={() => speakText(matchedWord.word, { rate: speedRate })}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95 cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-slate-600" />
                <span>ฟังคำอ่าน</span>
              </button>

              {onPrintWord && (
                <button
                  type="button"
                  onClick={() => onPrintWord(matchedWord)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-amber-300 transition active:scale-95 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>พิมพ์คำนี้ (PDF)</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 max-w-lg mx-auto bg-white/70 rounded-2xl p-3 border border-slate-200 text-xs text-slate-500">
            คำว่า <span className="font-bold text-slate-700 font-mono">"{currentCombined}"</span> เป็นการฝึกเชื่อมเสียงตามเทคนิคโฟนิกส์ (Phonics Blending) ลองเลือกตัวอักษรอื่นเพื่อค้นพบคำศัพท์จริงในระบบ!
          </div>
        )}
      </div>
    </div>
  );
};
