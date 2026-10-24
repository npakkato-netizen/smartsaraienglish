import React, { useState } from 'react';
import { playPhonicsSound, stopSpeaking, unlockAudio } from '../utils/audioUtils';
import { Volume2, X, Play, Square, Sparkles, Layers } from 'lucide-react';

interface PhonicsChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  speedRate: number;
}

export const ALPHABET_26 = [
  { upper: 'A', lower: 'a', ipa: '/æ/', thai: 'แอ', isVowel: true },
  { upper: 'B', lower: 'b', ipa: '/b/', thai: 'บึ', isVowel: false },
  { upper: 'C', lower: 'c', ipa: '/k/', thai: 'คึ', isVowel: false },
  { upper: 'D', lower: 'd', ipa: '/d/', thai: 'ดึ', isVowel: false },
  { upper: 'E', lower: 'e', ipa: '/e/', thai: 'เอะ', isVowel: true },
  { upper: 'F', lower: 'f', ipa: '/f/', thai: 'ฟึ', isVowel: false },
  { upper: 'G', lower: 'g', ipa: '/g/', thai: 'กึ', isVowel: false },
  { upper: 'H', lower: 'h', ipa: '/h/', thai: 'ฮึ', isVowel: false },
  { upper: 'I', lower: 'i', ipa: '/ɪ/', thai: 'อิ', isVowel: true },
  { upper: 'J', lower: 'j', ipa: '/dʒ/', thai: 'จึ', isVowel: false },
  { upper: 'K', lower: 'k', ipa: '/k/', thai: 'คึ', isVowel: false },
  { upper: 'L', lower: 'l', ipa: '/l/', thai: 'ลึ', isVowel: false },
  { upper: 'M', lower: 'm', ipa: '/m/', thai: 'มึ', isVowel: false },
  { upper: 'N', lower: 'n', ipa: '/n/', thai: 'นึ', isVowel: false },
  { upper: 'O', lower: 'o', ipa: '/ɒ/', thai: 'ออ', isVowel: true },
  { upper: 'P', lower: 'p', ipa: '/p/', thai: 'พึ', isVowel: false },
  { upper: 'Q', lower: 'q', ipa: '/kw/', thai: 'ควึ', isVowel: false },
  { upper: 'R', lower: 'r', ipa: '/r/', thai: 'รึ', isVowel: false },
  { upper: 'S', lower: 's', ipa: '/s/', thai: 'ซึ', isVowel: false },
  { upper: 'T', lower: 't', ipa: '/t/', thai: 'ทึ', isVowel: false },
  { upper: 'U', lower: 'u', ipa: '/ʌ/', thai: 'อะ', isVowel: true },
  { upper: 'V', lower: 'v', ipa: '/v/', thai: 'วึ', isVowel: false },
  { upper: 'W', lower: 'w', ipa: '/w/', thai: 'วึ', isVowel: false },
  { upper: 'X', lower: 'x', ipa: '/ks/', thai: 'คสึ', isVowel: false },
  { upper: 'Y', lower: 'y', ipa: '/j/', thai: 'ยึ', isVowel: false },
  { upper: 'Z', lower: 'z', ipa: '/z/', thai: 'ซึ', isVowel: false },
];

export const LONG_VOWEL_CHART = [
  { upper: 'Long A', lower: 'long-a', ipa: '/eɪ/', thai: 'เอ', icon: '🎂', sample: 'cake, rain, day' },
  { upper: 'Long E', lower: 'long-e', ipa: '/iː/', thai: 'อี', icon: '🌳', sample: 'tree, feet, read' },
  { upper: 'Long I', lower: 'long-i', ipa: '/aɪ/', thai: 'ไอ', icon: '🚲', sample: 'bike, time, kite' },
  { upper: 'Long O', lower: 'long-o', ipa: '/oʊ/', thai: 'โอ', icon: '⛵', sample: 'boat, rose, nose' },
  { upper: 'Long U', lower: 'long-u', ipa: '/juː/ /uː/', thai: 'ยู / อู', icon: '🦄', sample: 'cute, blue, tube' },
];

export const DIPHTHONG_CHART = [
  { upper: 'OI / OY', lower: 'dip-oi', ipa: '/ɔɪ/', thai: 'ออย', icon: '🪙', sample: 'coin, join, boy, toy' },
  { upper: 'OU / OW', lower: 'dip-ou', ipa: '/aʊ/', thai: 'เอา / อาว', icon: '🐮', sample: 'out, loud, cow, down' },
  { upper: 'OO', lower: 'dip-oo', ipa: '/ʊ/ & /uː/', thai: 'อุ / อู', icon: '🌙', sample: 'book, cook, moon, spoon' },
  { upper: 'AW / AU', lower: 'dip-aw', ipa: '/ɔː/', thai: 'ออ', icon: '🪚', sample: 'saw, lawn, sauce, draw' },
  { upper: 'AIR / EAR', lower: 'dip-air', ipa: '/eər/ /ɪər/', thai: 'แอร์ / เอีย', icon: '🪑', sample: 'chair, hair, ear, hear' },
];

export const PhonicsChartModal: React.FC<PhonicsChartModalProps> = ({
  isOpen,
  onClose,
  speedRate,
}) => {
  const [chartSection, setChartSection] = useState<'alphabet' | 'long' | 'diphthong'>('alphabet');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePlayLetter = (soundKey: string) => {
    unlockAudio();
    setActiveLetter(soundKey);
    playPhonicsSound(soundKey, speedRate);
    setTimeout(() => {
      setActiveLetter((current) => (current === soundKey ? null : current));
    }, 450);
  };

  const handlePlayAllSequential = async () => {
    if (isAutoPlaying) {
      stopSpeaking();
      setIsAutoPlaying(false);
      setActiveLetter(null);
      return;
    }

    unlockAudio();
    setIsAutoPlaying(true);

    const listToPlay =
      chartSection === 'alphabet'
        ? ALPHABET_26.map((x) => x.lower)
        : chartSection === 'long'
        ? LONG_VOWEL_CHART.map((x) => x.lower)
        : DIPHTHONG_CHART.map((x) => x.lower);

    for (let i = 0; i < listToPlay.length; i++) {
      const key = listToPlay[i];
      setActiveLetter(key);
      playPhonicsSound(key, speedRate);
      await new Promise((r) => setTimeout(r, 650));
    }

    setIsAutoPlaying(false);
    setActiveLetter(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border-2 border-amber-200 relative max-h-[92vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={() => {
            stopSpeaking();
            setIsAutoPlaying(false);
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pr-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔤</span>
              <h3 className="font-bubble text-xl sm:text-2xl font-black text-slate-800">
                ตารางเสียงโฟนิกส์มาตรฐาน
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              แตะเพื่อฟังการออกเสียงโฟนิกส์ภาษาไทยตามหลักสูตรประถม
            </p>
          </div>

          <button
            type="button"
            onClick={handlePlayAllSequential}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold shadow-sm transition active:scale-95 whitespace-nowrap ${
              isAutoPlaying
                ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
            }`}
          >
            {isAutoPlaying ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                <span>หยุดเล่นต่อเนื่อง</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>ฟังเสียงอัตโนมัติต่อเนื่อง</span>
              </>
            )}
          </button>
        </div>

        {/* Chart Section Tabs */}
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setChartSection('alphabet');
              setActiveLetter(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              chartSection === 'alphabet'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🔤 ตัวอักษร A-Z (26 ตัว)
          </button>

          <button
            type="button"
            onClick={() => {
              setChartSection('long');
              setActiveLetter(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              chartSection === 'long'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⭐ สระเสียงยาว (5 เสียง)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setChartSection('diphthong');
              setActiveLetter(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              chartSection === 'diphthong'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>🌀 สระประสม Diphthongs (5 เสียง)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto pr-1 flex-1">
          {chartSection === 'alphabet' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2.5 sm:gap-3">
              {ALPHABET_26.map((item) => {
                const isHighlight = activeLetter === item.lower;
                return (
                  <button
                    key={item.lower}
                    type="button"
                    onClick={() => handlePlayLetter(item.lower)}
                    className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center select-none active:scale-95 group ${
                      isHighlight
                        ? 'bg-amber-400 border-amber-500 text-white ring-4 ring-amber-200 scale-105 shadow-md'
                        : item.isVowel
                        ? 'bg-rose-50/70 border-rose-300 hover:bg-rose-100 hover:border-rose-400 text-slate-800'
                        : 'bg-slate-50 border-slate-200 hover:bg-amber-50 hover:border-amber-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-baseline gap-1 font-bubble font-black text-2xl sm:text-3xl">
                      <span className={item.isVowel ? (isHighlight ? 'text-white' : 'text-rose-600') : ''}>
                        {item.upper}
                      </span>
                      <span className="text-lg sm:text-xl font-bold opacity-80">
                        {item.lower}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {item.ipa}
                    </div>

                    <div
                      className={`font-thai font-black text-sm sm:text-base mt-1 px-2 py-0.5 rounded-lg ${
                        isHighlight
                          ? 'bg-white text-slate-900'
                          : item.isVowel
                          ? 'bg-rose-200/80 text-rose-800'
                          : 'bg-white text-amber-800 border border-slate-200/80'
                      }`}
                    >
                      {item.thai}
                    </div>

                    <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {chartSection === 'long' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {LONG_VOWEL_CHART.map((item) => {
                const isHighlight = activeLetter === item.lower;
                return (
                  <button
                    key={item.lower}
                    type="button"
                    onClick={() => handlePlayLetter(item.lower)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center select-none active:scale-95 group ${
                      isHighlight
                        ? 'bg-amber-400 border-amber-500 text-white ring-4 ring-amber-200 scale-102 shadow-md'
                        : 'bg-amber-50/50 border-amber-200 hover:bg-amber-100 hover:border-amber-400 text-slate-800'
                    }`}
                  >
                    <span className="text-3xl mb-1">{item.icon}</span>
                    <div className="font-bubble font-black text-xl text-amber-800">
                      {item.upper}
                    </div>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">
                      {item.ipa}
                    </div>
                    <div className="mt-2 px-3 py-1 rounded-xl bg-white text-amber-700 font-extrabold text-base border border-amber-200 shadow-2xs">
                      {item.thai}
                    </div>
                    <div className="text-xs text-slate-500 mt-2 font-medium">
                      เช่น {item.sample}
                    </div>
                    <div className="mt-2.5 flex items-center gap-1 text-xs text-amber-600 font-bold">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>แตะฟังเสียง</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {chartSection === 'diphthong' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {DIPHTHONG_CHART.map((item) => {
                const isHighlight = activeLetter === item.lower;
                return (
                  <button
                    key={item.lower}
                    type="button"
                    onClick={() => handlePlayLetter(item.lower)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center select-none active:scale-95 group ${
                      isHighlight
                        ? 'bg-teal-500 border-teal-600 text-white ring-4 ring-teal-200 scale-102 shadow-md'
                        : 'bg-teal-50/50 border-teal-200 hover:bg-teal-100 hover:border-teal-400 text-slate-800'
                    }`}
                  >
                    <span className="text-3xl mb-1">{item.icon}</span>
                    <div className="font-bubble font-black text-xl text-teal-800">
                      {item.upper}
                    </div>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">
                      {item.ipa}
                    </div>
                    <div className="mt-2 px-3 py-1 rounded-xl bg-white text-teal-700 font-extrabold text-base border border-teal-200 shadow-2xs">
                      {item.thai}
                    </div>
                    <div className="text-xs text-slate-500 mt-2 font-medium">
                      เช่น {item.sample}
                    </div>
                    <div className="mt-2.5 flex items-center gap-1 text-xs text-teal-600 font-bold">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>แตะฟังเสียง</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-rose-200 border border-rose-400"></span>
            <span>สระสั้น 5 ตัว • สระยาว 5 ตัว • สระประสม 5 กลุ่ม</span>
          </div>

          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              setIsAutoPlaying(false);
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
