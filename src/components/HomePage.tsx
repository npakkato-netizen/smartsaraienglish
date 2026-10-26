import React from 'react';
import { PhonicsWord, PhonicsVowel, VowelCategory, UserStats, ActiveTab } from '../types/phonics';
import { StudentProfile } from '../types/student';
import { PhonicsVoiceMode } from '../utils/audioUtils';
import { VowelSelector } from './VowelSelector';
import { WordCard } from './WordCard';
import { PHONICS_WORDS } from '../data/phonicsData';
import { PrintTemplate } from './PrintModal';
import {
  Sparkles,
  Printer,
  PenTool,
  Volume2,
  Puzzle,
  HelpCircle,
  Settings2,
  User,
  FileSpreadsheet,
  Shuffle,
  BookOpen,
  Trophy,
  ArrowRight,
  GraduationCap,
  Mic,
  Grid
} from 'lucide-react';

interface HomePageProps {
  student: StudentProfile | null;
  stats: UserStats;
  selectedCategory: VowelCategory;
  onSelectCategory: (category: VowelCategory) => void;
  selectedVowel: PhonicsVowel | 'all';
  onSelectVowel: (vowel: PhonicsVowel | 'all') => void;
  voiceMode: PhonicsVoiceMode;
  onSelectVoiceMode: (mode: PhonicsVoiceMode) => void;
  preferredVoiceURI: string;
  onMarkPracticed: (wordId: string) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenStudentLogin: () => void;
  onOpenScoreDashboard: () => void;
  onOpenPhonicsChart: () => void;
  onOpenAudioSettings: () => void;
  onOpenPrintCenter: (word?: PhonicsWord, vowel?: PhonicsVowel | 'all', template?: PrintTemplate) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  student,
  stats,
  selectedCategory,
  onSelectCategory,
  selectedVowel,
  onSelectVowel,
  voiceMode,
  onSelectVoiceMode,
  preferredVoiceURI,
  onMarkPracticed,
  onNavigateTab,
  onOpenStudentLogin,
  onOpenScoreDashboard,
  onOpenPhonicsChart,
  onOpenAudioSettings,
  onOpenPrintCenter,
}) => {
  // Filter words for display
  const displayedWords = selectedVowel === 'all'
    ? PHONICS_WORDS.filter((w) => {
        if (selectedCategory === 'short') return !w.vowelCategory || w.vowelCategory === 'short';
        if (selectedCategory === 'long') return w.vowelCategory === 'long';
        return w.vowelCategory === 'diphthong';
      })
    : PHONICS_WORDS.filter((w) => w.vowel === selectedVowel);

  return (
    <div className="space-y-6">
      {/* Friendly Hero Banner */}
      <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left z-10">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-bold">
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>หลักสูตรโฟนิกส์ครบทั้ง สระเสียงสั้น • สระเสียงยาว • สระประสม</span>
            </div>

            {student ? (
              <button
                type="button"
                onClick={onOpenStudentLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/60 hover:bg-emerald-800/80 border border-emerald-300/40 text-emerald-100 text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <span className="text-sm">{student.avatar}</span>
                <span>นักเรียน: {student.name} ({student.nickname})</span>
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300 ml-1" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenStudentLogin}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-900/40 hover:bg-amber-900/60 border border-white/40 text-amber-100 text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <User className="w-3.5 h-3.5" />
                <span>คลิกเพื่อเข้าสู่ระบบนักเรียน (บันทึกคะแนน Google Sheets)</span>
              </button>
            )}
          </div>

          <h1 className="font-bubble text-3xl sm:text-4xl md:text-5xl font-black drop-shadow-xs">
            สระสั้น • สระยาว • สระประสม แสนสนุก!
          </h1>
          <p className="text-sm sm:text-base text-amber-50 font-medium max-w-xl">
            เรียนรู้การออกเสียงตัวอักษรภาษาอังกฤษ (Phonics) ผ่านสระเสียงสั้น{' '}
            <span className="font-bold underline decoration-amber-200 underline-offset-4">
              a, e, i, o, u (125 คำ)
            </span>{' '}
            สระเสียงยาว{' '}
            <span className="font-bold underline decoration-amber-200 underline-offset-4">
              Long A, E, I, O, U (130 คำ)
            </span>{' '}
            และสระประสม{' '}
            <span className="font-bold underline decoration-amber-200 underline-offset-4">
              Diphthongs: OI/OY, OU/OW, OO, AW/AU, AIR/EAR (140 คำ)
            </span>{' '}
            รวมคำศัพท์มาตรฐานกว่า 395 คำ!
          </p>

          {/* Quick Action & Game Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <button
              onClick={() => onOpenPrintCenter(undefined, selectedVowel, undefined)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer ring-2 ring-amber-300/40"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>สร้างไฟล์ PDF เพื่อปริ้น / พิมพ์สื่อ 🖨️</span>
            </button>

            <button
              onClick={() => onOpenPrintCenter(undefined, selectedVowel, 'tracing')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer"
            >
              <PenTool className="w-4 h-4 text-amber-200" />
              <span>ใบงานคัดตามรอยประ ✏️</span>
            </button>

            <button
              onClick={onOpenPhonicsChart}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-rose-700 font-extrabold text-xs sm:text-sm shadow-md hover:bg-rose-50 transition active:scale-95 cursor-pointer"
            >
              <span className="text-sm">🔤</span>
              <span>ตารางเสียง A-Z (26 ตัว)</span>
            </button>

            <button
              onClick={() => onNavigateTab('quiz')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-emerald-200" />
              <span>ทดสอบฟังเสียง 🎯</span>
            </button>

            <button
              onClick={() => onNavigateTab('spell-game')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-900/40 text-white font-extrabold text-xs sm:text-sm shadow-md hover:bg-amber-900/60 transition active:scale-95 cursor-pointer"
            >
              <Puzzle className="w-4 h-4 text-amber-200" />
              <span>เกมสะกดคำ 🫧</span>
            </button>

            <button
              onClick={onOpenAudioSettings}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/80 hover:bg-amber-500 text-white font-extrabold text-xs sm:text-sm shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Settings2 className="w-4 h-4" />
              <span>ตั้งค่าเสียง 🔊</span>
            </button>
          </div>
        </div>

        {/* Mascot */}
        <div className="flex items-center gap-2 text-7xl sm:text-8xl select-none z-10 shrink-0">
          <div className="p-4 bg-white/25 rounded-3xl backdrop-blur-xs shadow-inner animate-bounce">
            🦁
          </div>
        </div>

        {/* Decorative backdrop shapes */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute left-10 -top-10 w-48 h-48 bg-amber-300/20 rounded-full blur-xl"></div>
      </div>

      {/* Audio Mode Fast-Switcher Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border-2 border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <Volume2 className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-extrabold text-slate-800">โหมดเสียงอ่านโฟนิกส์:</span>
          <span className="font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full text-xs">
            {voiceMode === 'sound'
              ? '🇺🇸 เสียงโฟนิกส์แท้ เจ้าของภาษา (/k/ - /æ/ - /t/)'
              : voiceMode === 'anchor'
              ? '💡 คำเทียบจำง่าย (a in apple, c in cat)'
              : '🇹🇭 ครูไทยสอนผสมเสียง (เคอะ-แอะ-เทอะ)'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onSelectVoiceMode('sound')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
              voiceMode === 'sound'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🇺🇸 โฟนิกส์แท้
          </button>
          <button
            type="button"
            onClick={() => onSelectVoiceMode('anchor')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
              voiceMode === 'anchor'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            💡 คำเทียบ
          </button>
          <button
            type="button"
            onClick={() => onSelectVoiceMode('thai')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
              voiceMode === 'thai'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🇹🇭 ครูไทย
          </button>
          <button
            type="button"
            onClick={onOpenAudioSettings}
            className="px-2.5 py-1 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition flex items-center gap-1 cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>ทดสอบ</span>
          </button>
        </div>
      </div>

      {/* Vowel Selector */}
      <VowelSelector
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          onSelectCategory(cat);
          onSelectVowel(cat === 'short' ? 'a' : cat === 'long' ? 'long-a' : 'dip-oi');
        }}
        selectedVowel={selectedVowel}
        onSelectVowel={onSelectVowel}
        speedRate={stats.speedRate}
        voiceMode={voiceMode}
      />

      {/* Word Cards Grid Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <div>
          <h3 className="font-bubble text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
            <span>
              📖 คำศัพท์ฝึกอ่าน ({selectedCategory === 'short' ? 'หมวดสระเสียงสั้น' : selectedCategory === 'long' ? 'หมวดสระเสียงยาว' : 'หมวดสระประสม Diphthongs'})
            </span>
            <span className="text-sm font-thai font-semibold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
              {displayedWords.length} คำ
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            คลิกที่ตัวอักษรเพื่อฟังเสียงสะกดทีละตัว หรือกดปุ่ม "ผสมเสียง" เพื่อรวมเสียงคำศัพท์
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onOpenPrintCenter(undefined, selectedVowel, undefined)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>สร้าง PDF / พิมพ์หมวดนี้</span>
          </button>

          <div className="text-xs text-slate-500 hidden md:block pl-2 border-l border-slate-200">
            ฝึกแล้ว: <span className="font-bold text-emerald-600">{stats.wordsPracticed.length}</span> / {PHONICS_WORDS.length} คำ
          </div>
        </div>
      </div>

      {/* Word Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {displayedWords.map((word) => (
          <WordCard
            key={word.id}
            word={word}
            isPracticed={stats.wordsPracticed.includes(word.id)}
            onMarkPracticed={onMarkPracticed}
            speedRate={stats.speedRate}
            voiceMode={voiceMode}
            preferredVoiceURI={preferredVoiceURI}
            onPrintWord={(w) => onOpenPrintCenter(w, undefined, undefined)}
          />
        ))}
      </div>

      {/* Quick Access to other Sections */}
      <div className="pt-6">
        <h4 className="font-bubble text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
          <span>🚀 กิจกรรมฝึกทักษะโฟนิกส์และระบบห้องเรียน</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div
            onClick={() => onNavigateTab('login')}
            className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md hover:shadow-lg transition cursor-pointer hover:scale-[1.02] flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-emerald-100 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Google Sheets Sync</span>
              </div>
              <h5 className="font-bubble text-lg font-black mt-1">หน้าเข้าสู่ระบบนักเรียน</h5>
              <p className="text-xs text-emerald-100 mt-0.5">
                {student ? `ใช้งานโดย: ${student.nickname}` : 'ลงชื่อเพื่อบันทึกคะแนน'}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-emerald-200" />
          </div>

          <div
            onClick={() => onNavigateTab('quiz')}
            className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md hover:shadow-lg transition cursor-pointer hover:scale-[1.02] flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-amber-100 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" />
                <span>ทดสอบ 10 ข้อ</span>
              </div>
              <h5 className="font-bubble text-lg font-black mt-1">แบบทดสอบฟังเสียง</h5>
              <p className="text-xs text-amber-100 mt-0.5">ฟังเสียงแล้วเลือกคำศัพท์ที่ถูกต้อง</p>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-200" />
          </div>

          <div
            onClick={() => onNavigateTab('spell-game')}
            className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md hover:shadow-lg transition cursor-pointer hover:scale-[1.02] flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-purple-100 flex items-center gap-1">
                <Puzzle className="w-3.5 h-3.5" />
                <span>มินิเกม</span>
              </div>
              <h5 className="font-bubble text-lg font-black mt-1">เกมสะกดคำฟองสบู่</h5>
              <p className="text-xs text-purple-100 mt-0.5">แตะตัวอักษรเรียงเป็นคำศัพท์</p>
            </div>
            <ArrowRight className="w-5 h-5 text-purple-200" />
          </div>

          <div
            onClick={() => onNavigateTab('blender')}
            className="p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md hover:shadow-lg transition cursor-pointer hover:scale-[1.02] flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-rose-100 flex items-center gap-1">
                <Shuffle className="w-3.5 h-3.5" />
                <span>CVC Blender</span>
              </div>
              <h5 className="font-bubble text-lg font-black mt-1">เครื่องผสมเสียงโฟนิกส์</h5>
              <p className="text-xs text-rose-100 mt-0.5">หมุนลูกล้อพยัญชนะต้น สระ ตัวสะกด</p>
            </div>
            <ArrowRight className="w-5 h-5 text-rose-200" />
          </div>
        </div>
      </div>
    </div>
  );
};
