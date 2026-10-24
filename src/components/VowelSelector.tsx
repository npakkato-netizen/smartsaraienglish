import React from 'react';
import { PhonicsVowel, VowelCategory } from '../types/phonics';
import { SHORT_VOWELS, LONG_VOWELS, DIPHTHONG_VOWELS, VOWEL_INFO_MAP } from '../data/phonicsData';
import { Volume2, Sparkles, Star, Layers } from 'lucide-react';
import {
  speakLetterPhoneme,
  playPhonicsSound,
  playLetterClickSound,
  unlockAudio,
  PhonicsVoiceMode,
} from '../utils/audioUtils';

interface VowelSelectorProps {
  selectedCategory: VowelCategory;
  onSelectCategory: (category: VowelCategory) => void;
  selectedVowel: PhonicsVowel | 'all';
  onSelectVowel: (vowel: PhonicsVowel | 'all') => void;
  speedRate: number;
  voiceMode?: PhonicsVoiceMode;
}

export const VowelSelector: React.FC<VowelSelectorProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedVowel,
  onSelectVowel,
  speedRate,
  voiceMode = 'sound',
}) => {
  const handleVowelSoundPlay = (e: React.MouseEvent, vowel: PhonicsVowel) => {
    e.stopPropagation();
    unlockAudio();
    playLetterClickSound();
    if (voiceMode === 'anchor') {
      speakLetterPhoneme(vowel, speedRate, 'anchor');
    } else {
      playPhonicsSound(vowel, speedRate);
    }
  };

  const currentVowels =
    selectedCategory === 'short'
      ? SHORT_VOWELS
      : selectedCategory === 'long'
      ? LONG_VOWELS
      : DIPHTHONG_VOWELS;

  const totalCategoryWords =
    selectedCategory === 'short'
      ? '125 คำ'
      : selectedCategory === 'long'
      ? '130 คำ'
      : '140 คำ';

  return (
    <div className="w-full bg-white rounded-3xl p-4 sm:p-6 shadow-md border-2 border-amber-100 space-y-4">
      {/* Category Toggle Tabs: Short vs Long vs Diphthongs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-amber-100">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab 1: Short Vowels */}
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              onSelectCategory('short');
              onSelectVowel('a');
            }}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl font-bubble text-xs sm:text-sm md:text-base font-extrabold transition-all shadow-sm ${
              selectedCategory === 'short'
                ? 'bg-rose-500 text-white shadow-rose-200 scale-102 ring-2 ring-rose-400 ring-offset-2'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <span>🍎 สระเสียงสั้น (Short)</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-white/20 font-bold">125 คำ</span>
          </button>

          {/* Tab 2: Long Vowels */}
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              onSelectCategory('long');
              onSelectVowel('long-a');
            }}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl font-bubble text-xs sm:text-sm md:text-base font-extrabold transition-all shadow-sm ${
              selectedCategory === 'long'
                ? 'bg-amber-600 text-white shadow-amber-200 scale-102 ring-2 ring-amber-400 ring-offset-2'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>⭐ สระเสียงยาว (Long)</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-white/20 font-bold">130 คำ</span>
          </button>

          {/* Tab 3: Diphthongs */}
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              onSelectCategory('diphthong');
              onSelectVowel('dip-oi');
            }}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl font-bubble text-xs sm:text-sm md:text-base font-extrabold transition-all shadow-sm ${
              selectedCategory === 'diphthong'
                ? 'bg-teal-600 text-white shadow-teal-200 scale-102 ring-2 ring-teal-400 ring-offset-2'
                : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
            }`}
          >
            <Layers className="w-4 h-4 text-teal-300" />
            <span>🌀 สระประสม (Diphthongs)</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-white/20 font-bold">140 คำ</span>
          </button>
        </div>

        {/* View All Button */}
        <button
          type="button"
          onClick={() => {
            unlockAudio();
            onSelectVowel('all');
          }}
          className={`self-start lg:self-auto px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
            selectedVowel === 'all'
              ? 'bg-slate-800 text-white shadow-slate-300'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          🌟 ดูคำศัพท์ทั้งหมด ({totalCategoryWords})
        </button>
      </div>

      {/* Header Description */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bubble font-black text-slate-800 flex items-center gap-2">
            <span>
              {selectedCategory === 'short'
                ? '✨ เลือกสระเสียงสั้น (a, e, i, o, u) — เสียงละ 25 คำ'
                : selectedCategory === 'long'
                ? '✨ เลือกสระเสียงยาว (Long A, E, I, O, U) — เสียงละ 26 คำ'
                : '✨ เลือกสระประสม (OI/OY, OU/OW, OO, AW/AU, AIR/EAR) — เสียงละ 28 คำ'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            แตะที่ตัวอักษรเพื่อฟังการออกเสียง หรือเลือกเพื่อดูบัตรคำศัพท์และฝึกผสมเสียง
          </p>
        </div>
      </div>

      {/* 5 Vowel Cards for Active Category */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {currentVowels.map((v) => {
          const info = VOWEL_INFO_MAP[v];
          if (!info) return null;
          const isSelected = selectedVowel === v;

          const displayLetter =
            info.category === 'long'
              ? `Long ${info.letter.toUpperCase()}`
              : info.letter.toUpperCase();

          return (
            <div
              key={v}
              onClick={() => {
                unlockAudio();
                onSelectVowel(v);
              }}
              className={`relative cursor-pointer rounded-2xl p-3.5 sm:p-4 border-2 transition-all duration-200 select-none flex flex-col items-center text-center group ${
                isSelected
                  ? `${info.borderColor} ${info.bgLight} shadow-lg scale-102 ring-2 ring-offset-2 ring-amber-400`
                  : 'border-slate-200 bg-slate-50/50 hover:border-amber-300 hover:bg-white'
              }`}
            >
              {/* Vowel Letter Icon & Character */}
              <div className="relative mb-1">
                <span className="text-2xl">{info.icon}</span>
                <span className={`block font-bubble text-2xl sm:text-3xl font-black ${info.textColor}`}>
                  {displayLetter}
                </span>
                <span className="text-[11px] font-bold text-slate-500 block">
                  {info.symbol}
                </span>
              </div>

              {/* Thai phonetic label */}
              <div className="font-bold text-xs sm:text-sm text-slate-800 mt-1">
                {info.thaiSound}
              </div>

              {/* Sample word */}
              <div className="text-[11px] text-slate-500 font-medium truncate max-w-full">
                เช่น {info.sampleWord}
              </div>

              {/* Quick Sound button */}
              <button
                type="button"
                onClick={(e) => handleVowelSoundPlay(e, v)}
                title={`ฟังเสียงสระ ${info.name}`}
                className="mt-2.5 flex items-center justify-center gap-1 w-full py-1.5 px-2 rounded-xl bg-white hover:bg-amber-100/70 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs group-hover:border-amber-300 transition"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                <span>ฟังเสียง</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Selected Vowel Guide Callout */}
      {selectedVowel !== 'all' && VOWEL_INFO_MAP[selectedVowel] && (
        <div className={`mt-2 p-3.5 rounded-2xl border ${VOWEL_INFO_MAP[selectedVowel].bgLight} ${VOWEL_INFO_MAP[selectedVowel].borderColor} flex items-center gap-3`}>
          <div className="text-2xl flex-shrink-0">{VOWEL_INFO_MAP[selectedVowel].icon}</div>
          <div className="text-xs sm:text-sm text-slate-700">
            <span className="font-bold text-slate-900">
              เทคนิคการออกเสียง {VOWEL_INFO_MAP[selectedVowel].name} ({VOWEL_INFO_MAP[selectedVowel].symbol}):{' '}
            </span>
            {VOWEL_INFO_MAP[selectedVowel].description}
          </div>
        </div>
      )}
    </div>
  );
};
