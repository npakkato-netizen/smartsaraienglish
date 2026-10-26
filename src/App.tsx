/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab, ShortVowel, LongVowel, PhonicsVowel, VowelCategory, UserStats, PhonicsWord } from './types/phonics';
import { PHONICS_WORDS, VOWEL_INFO_MAP } from './data/phonicsData';
import { Navbar } from './components/Navbar';
import { VowelSelector } from './components/VowelSelector';
import { WordCard } from './components/WordCard';
import { SpellingPopGame } from './components/SpellingPopGame';
import { MissingVowelGame } from './components/MissingVowelGame';
import { WordBlendingMachine } from './components/WordBlendingMachine';
import { ListeningQuizGame } from './components/ListeningQuizGame';
import { VoicePracticeLab } from './components/VoicePracticeLab';
import { WordLibrary } from './components/WordLibrary';
import { BadgesModal, BADGE_LIST } from './components/BadgesModal';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { PhonicsChartModal } from './components/PhonicsChartModal';
import { PrintModal, PrintTemplate, WordSource } from './components/PrintModal';
import {
  SecondaryVocabWord,
  SecondaryGrade,
  VocabTopic,
  SECONDARY_VOCABULARY,
} from './data/secondaryVocabData';
import { StudentLoginModal } from './components/StudentLoginModal';
import { ScoreDashboardModal } from './components/ScoreDashboardModal';
import { LoginPage } from './components/LoginPage';
import { StudentProfile } from './types/student';
import { getCurrentStudent } from './services/gasService';
import { PhonicsVoiceMode, unlockAudio, setAudioEngineConfig } from './utils/audioUtils';
import { Sparkles, Trophy, Puzzle, HelpCircle, Shuffle, Volume2, Mic, BookOpen, Star, Settings2, CheckCircle2, Printer, PenTool, User, FileSpreadsheet } from 'lucide-react';

const STATS_STORAGE_KEY = 'phonics_kids_stats_v1';
const AUDIO_SETTINGS_KEY = 'phonics_kids_audio_v1';

export default function App() {
  // Student Profile & Google Sheets score sync
  const [student, setStudent] = useState<StudentProfile | null>(() => getCurrentStudent());
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('print') === 'true') return 'learn';
    } catch {}
    return getCurrentStudent() ? 'learn' : 'login';
  });
  const [selectedCategory, setSelectedCategory] = useState<VowelCategory>('short');
  const [selectedVowel, setSelectedVowel] = useState<PhonicsVowel | 'all'>('a');
  const [isBadgesOpen, setIsBadgesOpen] = useState<boolean>(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState<boolean>(false);
  const [isPhonicsChartOpen, setIsPhonicsChartOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [printTargetWord, setPrintTargetWord] = useState<PhonicsWord | undefined>(undefined);
  const [printTargetVowel, setPrintTargetVowel] = useState<PhonicsVowel | 'all'>('all');
  const [printTargetTemplate, setPrintTargetTemplate] = useState<PrintTemplate | undefined>(undefined);
  const [printSource, setPrintSource] = useState<WordSource>('phonics');
  const [printSecondaryGrade, setPrintSecondaryGrade] = useState<SecondaryGrade | 'all' | 'lower' | 'upper'>('all');
  const [printSecondaryTopic, setPrintSecondaryTopic] = useState<VocabTopic | 'all'>('all');
  const [printSecondaryWords, setPrintSecondaryWords] = useState<SecondaryVocabWord[] | undefined>(undefined);
  const [printSecondaryWord, setPrintSecondaryWord] = useState<SecondaryVocabWord | undefined>(undefined);
  const [isStudentLoginOpen, setIsStudentLoginOpen] = useState<boolean>(false);
  const [isScoreDashboardOpen, setIsScoreDashboardOpen] = useState<boolean>(false);
  const [loginTitlePrompt, setLoginTitlePrompt] = useState<string | undefined>(undefined);

  // Audio configuration
  const [voiceMode, setVoiceMode] = useState<PhonicsVoiceMode>(() => {
    try {
      const saved = localStorage.getItem(AUDIO_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.voiceMode) return parsed.voiceMode;
      }
    } catch {}
    return 'sound';
  });

  const [preferredVoiceURI, setPreferredVoiceURI] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(AUDIO_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.voiceURI) return parsed.voiceURI;
      }
    } catch {}
    return '';
  });

  // User persistence stats
  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return {
      stars: 10,
      wordsPracticed: [],
      quizzesCompleted: 0,
      spellingScore: 0,
      badges: ['first-word'],
      speedRate: 0.74, // Beginner-friendly pace (ช้า ชัดเจน สำหรับนักเรียนเริ่มเรียน)
    };
  });

  // Save audio settings & sync engine config
  useEffect(() => {
    try {
      localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify({ voiceMode, voiceURI: preferredVoiceURI }));
    } catch {}
    setAudioEngineConfig({ voiceMode, preferredVoiceURI });
  }, [voiceMode, preferredVoiceURI]);

  // Save stats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch {
      //
    }
  }, [stats]);

  // Check and unlock badges whenever stats change
  useEffect(() => {
    const newlyUnlocked: string[] = [];
    BADGE_LIST.forEach((b) => {
      if (!stats.badges.includes(b.id) && b.isUnlocked(stats)) {
        newlyUnlocked.push(b.id);
      }
    });

    if (newlyUnlocked.length > 0) {
      setStats((prev) => ({
        ...prev,
        badges: [...prev.badges, ...newlyUnlocked],
      }));
    }
  }, [stats.wordsPracticed, stats.spellingScore, stats.stars]);

  // Collapsible navbar state (persisted to localStorage)
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('smart_sarai_navbar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleNavbarCollapse = () => {
    setIsNavbarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('smart_sarai_navbar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Handle URL query parameters (e.g. ?print=true) for standalone printing
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('print') === 'true') {
        const tpl = params.get('template') as PrintTemplate | null;
        const cat = params.get('cat') as VowelCategory | null;
        const vowel = params.get('vowel') as PhonicsVowel | null;
        const wordId = params.get('word');
        const src = params.get('source') as WordSource | null;
        const grade = params.get('grade') as (SecondaryGrade | 'all' | 'lower' | 'upper') | null;
        const topic = params.get('topic') as (VocabTopic | 'all') | null;

        if (tpl) setPrintTargetTemplate(tpl);
        if (src) setPrintSource(src);
        if (grade) {
          setPrintSecondaryGrade(grade);
          setPrintSource('secondary');
        }
        if (topic) {
          setPrintSecondaryTopic(topic);
          setPrintSource('secondary');
        }
        if (cat) setSelectedCategory(cat);
        if (vowel) setPrintTargetVowel(vowel);
        if (wordId) {
          const foundPhonics = PHONICS_WORDS.find((w) => w.id === wordId);
          if (foundPhonics) {
            setPrintTargetWord(foundPhonics);
            setPrintSource('phonics');
          }
          const foundSecondary = SECONDARY_VOCABULARY.find((w) => w.id === wordId);
          if (foundSecondary) {
            setPrintSecondaryWord(foundSecondary);
            setPrintSource('secondary');
          }
        }
        setIsPrintModalOpen(true);
      }
    } catch (e) {
      console.warn('URL params check error:', e);
    }
  }, []);

  const handleAddStars = (amount: number) => {
    setStats((prev) => ({
      ...prev,
      stars: prev.stars + amount,
      spellingScore: prev.spellingScore + 1,
    }));
  };

  const handleMarkPracticed = (wordId: string) => {
    if (!stats.wordsPracticed.includes(wordId)) {
      setStats((prev) => ({
        ...prev,
        stars: prev.stars + 1,
        wordsPracticed: [...prev.wordsPracticed, wordId],
      }));
    }
  };

  const handleToggleSpeed = () => {
    unlockAudio();
    setStats((prev) => ({
      ...prev,
      speedRate: prev.speedRate < 0.8 ? 0.85 : 0.7,
    }));
  };

  const handleUpdateSpeedRate = (newRate: number) => {
    setStats((prev) => ({
      ...prev,
      speedRate: newRate,
    }));
  };

  // Filter words for Learn view
  const displayedWords = selectedVowel === 'all'
    ? PHONICS_WORDS.filter((w) => {
        if (selectedCategory === 'short') return !w.vowelCategory || w.vowelCategory === 'short';
        if (selectedCategory === 'long') return w.vowelCategory === 'long';
        return w.vowelCategory === 'diphthong';
      })
    : PHONICS_WORDS.filter((w) => w.vowel === selectedVowel);

  const handleOpenPrintSecondary = (params?: {
    grade?: SecondaryGrade | 'all' | 'lower' | 'upper';
    topic?: VocabTopic | 'all';
    words?: SecondaryVocabWord[];
    template?: PrintTemplate;
  }) => {
    setPrintSource('secondary');
    setPrintSecondaryGrade(params?.grade || 'all');
    setPrintSecondaryTopic(params?.topic || 'all');
    setPrintSecondaryWords(params?.words);
    setPrintSecondaryWord(undefined);
    setPrintTargetWord(undefined);
    if (params?.template) setPrintTargetTemplate(params.template);
    setIsPrintModalOpen(true);
  };

  const handlePrintSecondaryWord = (word: SecondaryVocabWord, template?: PrintTemplate) => {
    setPrintSource('secondary');
    setPrintSecondaryWord(word);
    setPrintSecondaryGrade(word.grade);
    setPrintSecondaryTopic(word.topic);
    setPrintSecondaryWords(undefined);
    setPrintTargetWord(undefined);
    if (template) setPrintTargetTemplate(template);
    setIsPrintModalOpen(true);
  };

  return (
    <div 
      onClick={() => unlockAudio()}
      className="min-h-screen flex flex-col bg-amber-50/40 text-slate-800"
    >
      {/* Top Navbar - Hidden on Login Page */}
      {activeTab !== 'login' && (
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          stats={stats}
          student={student}
          onOpenBadges={() => setIsBadgesOpen(true)}
          onOpenAudioSettings={() => setIsAudioSettingsOpen(true)}
          onOpenPhonicsChart={() => setIsPhonicsChartOpen(true)}
          onOpenPrintCenter={() => {
            setPrintSource('phonics');
            setPrintTargetWord(undefined);
            setPrintTargetVowel(selectedVowel);
            setIsPrintModalOpen(true);
          }}
          onOpenSecondaryWorksheet={() => {
            handleOpenPrintSecondary({ template: 'tracing' });
          }}
          onToggleSpeed={handleToggleSpeed}
          onOpenStudentLogin={() => {
            setActiveTab('login');
          }}
          onOpenScoreDashboard={() => setIsScoreDashboardOpen(true)}
          isCollapsed={isNavbarCollapsed}
          onToggleCollapse={handleToggleNavbarCollapse}
        />
      )}

      {/* Main Container */}
      <main
        className={`flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 ${
          activeTab === 'login'
            ? 'py-8 sm:py-12 flex items-center justify-center'
            : isNavbarCollapsed || activeTab === 'spell-game' || activeTab === 'missing-vowel' || activeTab === 'quiz'
            ? 'py-2.5 sm:py-4 space-y-3 sm:space-y-4'
            : 'py-5 sm:py-6 space-y-5'
        } ${isPrintModalOpen ? 'print:hidden' : ''}`}
      >
        {/* STUDENT LOGIN & PROFILE PAGE VIEW */}
        {activeTab === 'login' && (
          <LoginPage
            currentStudent={student}
            onStudentChanged={setStudent}
            onNavigateTab={setActiveTab}
            onOpenScoreDashboard={() => setIsScoreDashboardOpen(true)}
            onOpenPrintCenter={() => {
              setPrintSource('phonics');
              setPrintTargetWord(undefined);
              setPrintTargetVowel(selectedVowel);
              setIsPrintModalOpen(true);
            }}
          />
        )}

        {/* LEARN VIEW (หน้าแรก / เรียนรู้สระ) */}
        {(activeTab === 'learn' || (activeTab as string) === 'home') && (
          <div className="space-y-5">

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
                  onClick={() => setVoiceMode('sound')}
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
                  onClick={() => setVoiceMode('anchor')}
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
                  onClick={() => setVoiceMode('thai')}
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
                  onClick={() => setIsAudioSettingsOpen(true)}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition flex items-center gap-1"
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
                setSelectedCategory(cat);
                setSelectedVowel(cat === 'short' ? 'a' : cat === 'long' ? 'long-a' : 'dip-oi');
              }}
              selectedVowel={selectedVowel}
              onSelectVowel={setSelectedVowel}
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
                  onClick={() => {
                    setPrintTargetWord(undefined);
                    setPrintTargetVowel(selectedVowel);
                    setIsPrintModalOpen(true);
                  }}
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
                  onMarkPracticed={handleMarkPracticed}
                  speedRate={stats.speedRate}
                  voiceMode={voiceMode}
                  preferredVoiceURI={preferredVoiceURI}
                  onPrintWord={(w) => {
                    setPrintTargetWord(w);
                    setIsPrintModalOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* SPELLING POP GAME VIEW */}
        {activeTab === 'spell-game' && (
          <SpellingPopGame
            onAddStars={handleAddStars}
            speedRate={stats.speedRate}
            student={student}
            onRequireLogin={() => {
              setLoginTitlePrompt('ลงชื่อเข้าเรียนเพื่อบันทึกคะแนนสะกดคำส่งคุณครู');
              setIsStudentLoginOpen(true);
            }}
          />
        )}

        {/* MISSING VOWEL GAME VIEW */}
        {activeTab === 'missing-vowel' && (
          <MissingVowelGame
            onAddStars={handleAddStars}
            speedRate={stats.speedRate}
            student={student}
            onRequireLogin={() => {
              setLoginTitlePrompt('ลงชื่อเข้าเรียนเพื่อบันทึกคะแนนเติมสระส่งคุณครู');
              setIsStudentLoginOpen(true);
            }}
          />
        )}

        {/* WORD BLENDING MACHINE VIEW */}
        {activeTab === 'blender' && (
          <WordBlendingMachine
            onAddStars={handleAddStars}
            speedRate={stats.speedRate}
            onPrintWord={(w) => {
              setPrintSource('phonics');
              setPrintTargetWord(w);
              setIsPrintModalOpen(true);
            }}
          />
        )}

        {/* LISTENING QUIZ VIEW */}
        {activeTab === 'quiz' && (
          <ListeningQuizGame
            onAddStars={handleAddStars}
            speedRate={stats.speedRate}
            student={student}
            onRequireLogin={() => {
              setLoginTitlePrompt('ลงชื่อเข้าเรียนเพื่อบันทึกผลการทดสอบฟังเสียงส่งคุณครู');
              setIsStudentLoginOpen(true);
            }}
          />
        )}

        {/* VOICE PRACTICE LAB VIEW */}
        {activeTab === 'voice-lab' && (
          <VoicePracticeLab
            onAddStars={handleAddStars}
            speedRate={stats.speedRate}
          />
        )}

        {/* WORD LIBRARY & PRINT VIEW */}
        {activeTab === 'library' && (
          <WordLibrary
            speedRate={stats.speedRate}
            student={student}
            onAddStars={handleAddStars}
            onRequireLogin={() => {
              setLoginTitlePrompt('ลงชื่อเข้าเรียนเพื่อบันทึกคะแนนสะกดคำส่งคุณครู');
              setIsStudentLoginOpen(true);
            }}
            onOpenPrintCenter={(vowel) => {
              setPrintSource('phonics');
              setPrintTargetWord(undefined);
              setPrintTargetVowel(vowel || 'all');
              setIsPrintModalOpen(true);
            }}
            onPrintWord={(w) => {
              setPrintSource('phonics');
              setPrintTargetWord(w);
              setIsPrintModalOpen(true);
            }}
            onOpenPrintSecondary={handleOpenPrintSecondary}
            onPrintSecondaryWord={handlePrintSecondaryWord}
          />
        )}
      </main>

      {/* Audio Settings & Diagnostic Modal */}
      <AudioSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
        speedRate={stats.speedRate}
        onUpdateSpeedRate={handleUpdateSpeedRate}
        voiceMode={voiceMode}
        onUpdateVoiceMode={setVoiceMode}
        preferredVoiceURI={preferredVoiceURI}
        onUpdatePreferredVoice={setPreferredVoiceURI}
      />

      {/* Badges Achievement Modal */}
      <BadgesModal
        isOpen={isBadgesOpen}
        onClose={() => setIsBadgesOpen(false)}
        stats={stats}
      />

      {/* 26-Letter Phonics Chart Modal */}
      <PhonicsChartModal
        isOpen={isPhonicsChartOpen}
        onClose={() => setIsPhonicsChartOpen(false)}
        speedRate={stats.speedRate}
      />

      {/* Phonics Printable Document & PDF Generator Modal */}
      {isPrintModalOpen && (
        <PrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          initialWord={printTargetWord}
          initialVowel={printTargetVowel}
          initialCategory={selectedCategory}
          initialTemplate={printTargetTemplate}
          initialSource={printSource}
          initialSecondaryGrade={printSecondaryGrade}
          initialSecondaryTopic={printSecondaryTopic}
          initialSecondaryWords={printSecondaryWords}
          initialSecondaryWord={printSecondaryWord}
        />
      )}

      {/* Student Login / Profile Registration Modal */}
      <StudentLoginModal
        isOpen={isStudentLoginOpen}
        onClose={() => setIsStudentLoginOpen(false)}
        currentStudent={student}
        onStudentChanged={setStudent}
        titlePrompt={loginTitlePrompt}
      />

      {/* Student Score Dashboard & Google Sheets Sync Modal */}
      <ScoreDashboardModal
        isOpen={isScoreDashboardOpen}
        onClose={() => setIsScoreDashboardOpen(false)}
        student={student}
        onOpenEditProfile={() => {
          setIsScoreDashboardOpen(false);
          setIsStudentLoginOpen(true);
        }}
        onLogout={() => {
          setStudent(null);
        }}
      />

      {/* Footer - Hidden on Login Page */}
      {activeTab !== 'login' && (
        <footer className="print:hidden border-t border-amber-200/80 bg-white/70 py-6 text-center text-xs text-slate-500 font-medium">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🦁</span>
              <span className="font-bubble font-black text-amber-700 text-sm">
                Smart Sarai English
              </span>
              <span>— สมาร์ท สาหร่าย อิงลิช – เด็กสาหร่ายยุคใหม่ เก่งอังกฤษแบบสมาร์ท</span>
            </div>

            <div className="flex items-center gap-4 text-slate-400">
              <span>สระเสียงสั้น: A (/æ/ แอ) • E (/e/ เอะ) • I (/ɪ/ อิ) • O (/ɒ/ ออ) • U (/ʌ/ อะ)</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
