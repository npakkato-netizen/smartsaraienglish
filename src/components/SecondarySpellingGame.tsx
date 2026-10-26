import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SECONDARY_VOCABULARY,
  SecondaryVocabWord,
  SecondaryGrade,
  VOCAB_TOPICS,
  VocabTopic,
  GRADE_BADGES,
} from '../data/secondaryVocabData';
import {
  speakText,
  playPopSound,
  playFanfareSound,
  playIncorrectSound,
  unlockAudio,
} from '../utils/audioUtils';
import confetti from 'canvas-confetti';
import { StudentProfile } from '../types/student';
import { recordScore } from '../services/gasService';
import {
  Volume2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Trophy,
  Star,
  Check,
  Eye,
  EyeOff,
  HelpCircle,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  Filter,
  GraduationCap,
  BookOpen,
  ArrowLeft,
  Flame,
  Delete,
} from 'lucide-react';

interface SecondarySpellingGameProps {
  initialGrade?: SecondaryGrade | 'all' | 'lower' | 'upper';
  initialWordId?: string;
  speedRate: number;
  student: StudentProfile | null;
  onAddStars?: (amount: number) => void;
  onRequireLogin?: () => void;
  onBackToLibrary?: () => void;
}

interface BubbleItem {
  id: string;
  letter: string;
  used: boolean;
}

export const SecondarySpellingGame: React.FC<SecondarySpellingGameProps> = ({
  initialGrade = 'all',
  initialWordId,
  speedRate,
  student,
  onAddStars,
  onRequireLogin,
  onBackToLibrary,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<SecondaryGrade | 'all' | 'lower' | 'upper'>(initialGrade);
  const [selectedTopic, setSelectedTopic] = useState<VocabTopic | 'all'>('all');
  const [challengeMode, setChallengeMode] = useState<boolean>(false);
  const [revealClue, setRevealClue] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const [spelledLetters, setSpelledLetters] = useState<string[]>([]);
  const [availableBubbles, setAvailableBubbles] = useState<BubbleItem[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [wrongShakeId, setWrongShakeId] = useState<string | null>(null);

  const [gameScore, setGameScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [isSavingScore, setIsSavingScore] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Filter word pool
  const wordPool = useMemo(() => {
    let pool = SECONDARY_VOCABULARY.filter((w) => {
      let matchGrade = true;
      if (selectedGrade === 'lower') matchGrade = w.level === 'lower';
      else if (selectedGrade === 'upper') matchGrade = w.level === 'upper';
      else if (selectedGrade !== 'all') matchGrade = w.grade === selectedGrade;

      const matchTopic = selectedTopic === 'all' || w.topic === selectedTopic;
      return matchGrade && matchTopic;
    });

    if (pool.length === 0) {
      pool = SECONDARY_VOCABULARY;
    }

    // If an initialWordId was specified, move that word to index 0
    if (initialWordId) {
      const targetIdx = pool.findIndex((w) => w.id === initialWordId);
      if (targetIdx !== -1) {
        const target = pool[targetIdx];
        const rest = pool.filter((_, i) => i !== targetIdx);
        return [target, ...rest];
      }
    }

    // Shuffle pool
    return [...pool].sort(() => 0.5 - Math.random());
  }, [selectedGrade, selectedTopic, initialWordId]);

  const currentWord: SecondaryVocabWord | undefined = wordPool[currentIndex % wordPool.length];

  // Initialize bubbles for current word
  const initWord = useCallback((word: SecondaryVocabWord) => {
    setSpelledLetters([]);
    setIsCompleted(false);
    setRevealClue(false);

    // Filter characters to alphabetic letters (in case of spaces or hyphens)
    const cleanLetters = word.word.toLowerCase().split('').filter((c) => /[a-z]/.test(c));

    const bubbleList: BubbleItem[] = cleanLetters.map((l, idx) => ({
      id: `${l}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      letter: l,
      used: false,
    }));

    // In Challenge Mode, add 2-3 distractor letters
    if (challengeMode) {
      const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
      const distractors = alphabet.filter((char) => !cleanLetters.includes(char));
      for (let i = 0; i < 2; i++) {
        const extra = distractors[Math.floor(Math.random() * distractors.length)];
        if (extra) {
          bubbleList.push({
            id: `distract-${i}-${Math.random().toString(36).substring(2, 7)}`,
            letter: extra,
            used: false,
          });
        }
      }
    }

    // Shuffle bubbles
    setAvailableBubbles([...bubbleList].sort(() => 0.5 - Math.random()));

    // Speak the word
    setTimeout(() => {
      speakText(word.word, { rate: speedRate });
    }, 350);
  }, [challengeMode, speedRate]);

  useEffect(() => {
    if (currentWord) {
      initWord(currentWord);
    }
  }, [currentIndex, selectedGrade, selectedTopic, challengeMode, initWord]);

  // Target clean letters
  const targetLetters = useMemo(() => {
    if (!currentWord) return [];
    return currentWord.word.toLowerCase().split('').filter((c) => /[a-z]/.test(c));
  }, [currentWord]);

  const nextTargetLetter = targetLetters[spelledLetters.length];

  // Handle clicking a bubble
  const handleBubbleClick = useCallback((bubble: BubbleItem) => {
    if (bubble.used || isCompleted || !currentWord) return;
    unlockAudio();

    if (bubble.letter.toLowerCase() === nextTargetLetter) {
      // Correct letter!
      playPopSound();
      const nextSpelled = [...spelledLetters, bubble.letter];
      setSpelledLetters(nextSpelled);

      // Mark bubble as used
      setAvailableBubbles((prev) =>
        prev.map((b) => (b.id === bubble.id ? { ...b, used: true } : b))
      );

      // Check if word completed
      if (nextSpelled.length === targetLetters.length) {
        setIsCompleted(true);
        playFanfareSound();
        confetti({
          particleCount: 65,
          spread: 80,
          origin: { y: 0.6 },
        });

        setGameScore((prev) => prev + 1);
        setStreak((prev) => prev + 1);
        if (onAddStars) {
          onAddStars(2);
        }

        // Announce completed word and sentence
        setTimeout(() => {
          speakText(currentWord.word, { rate: speedRate });
        }, 300);
      }
    } else {
      // Incorrect letter!
      playIncorrectSound();
      setStreak(0);
      setWrongShakeId(bubble.id);
      setTimeout(() => setWrongShakeId(null), 500);
    }
  }, [isCompleted, currentWord, nextTargetLetter, spelledLetters, targetLetters.length, onAddStars, speedRate]);

  // Undo / Delete last letter
  const handleUndo = useCallback(() => {
    if (spelledLetters.length === 0 || isCompleted) return;
    const lastLetter = spelledLetters[spelledLetters.length - 1];
    setSpelledLetters((prev) => prev.slice(0, prev.length - 1));

    // Unmark the most recently used bubble with this letter
    setAvailableBubbles((prev) => {
      const reversed = [...prev].reverse();
      const targetIndexInReversed = reversed.findIndex(
        (b) => b.letter.toLowerCase() === lastLetter.toLowerCase() && b.used
      );
      if (targetIndexInReversed !== -1) {
        const actualIndex = prev.length - 1 - targetIndexInReversed;
        return prev.map((b, i) => (i === actualIndex ? { ...b, used: false } : b));
      }
      return prev;
    });
  }, [spelledLetters, isCompleted]);

  // Physical Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted || !currentWord) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleUndo();
        return;
      }

      const key = e.key.toLowerCase();
      if (/^[a-z]$/.test(key)) {
        // Find matching unused bubble
        const matchingBubble = availableBubbles.find(
          (b) => !b.used && b.letter.toLowerCase() === key
        );
        if (matchingBubble) {
          handleBubbleClick(matchingBubble);
        } else {
          // Play incorrect sound if key not in bubbles
          playIncorrectSound();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [availableBubbles, handleBubbleClick, handleUndo, isCompleted, currentWord]);

  const handleNextWord = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const handleResetCurrent = () => {
    if (currentWord) initWord(currentWord);
  };

  const handleSaveToGas = async () => {
    if (!student) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    unlockAudio();
    setIsSavingScore(true);
    setSaveMessage(null);

    const gradeLabel = selectedGrade === 'all' ? 'ทุกระดับชั้น ม.1-6' : selectedGrade;
    const res = await recordScore(student, {
      gameId: 'spell-game',
      gameName: `เกมสะกดคำศัพท์ ม.1-6 (${gradeLabel})`,
      score: gameScore,
      totalScore: Math.max(gameScore, currentIndex + 1),
      starsEarned: gameScore * 2,
      details: `สะกดคำถูกต้อง ${gameScore} คำ (ระดับ: ${gradeLabel}, หมวด: ${selectedTopic})`,
    });

    setIsSavingScore(false);
    if (res.synced) {
      setSaveMessage(`บันทึกคะแนนสะกดคำของ ${student.name} (${gameScore} คำ) ลง Google Sheets เรียบร้อย! ✨`);
    } else {
      setSaveMessage('บันทึกคะแนนไว้ในเครื่องแล้ว (รอเชื่อมต่อ Sheets)');
    }
    setTimeout(() => setSaveMessage(null), 4000);
  };

  if (!currentWord) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border-2 border-slate-200">
        <p className="text-base font-bold text-slate-700">กำลังเตรียมคลังคำศัพท์...</p>
      </div>
    );
  }

  const badge = GRADE_BADGES[currentWord.grade];

  return (
    <div className="max-w-4xl mx-auto space-y-3 animate-fade-in">
      {/* Top Controls & Grade Filter Bar (Unified, Sleek & Compact) */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3.5 shadow-xs border border-amber-200/90 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {onBackToLibrary && (
              <button
                type="button"
                onClick={onBackToLibrary}
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                title="กลับไปคลังคำศัพท์"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">คลังศัพท์</span>
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-xl select-none">🎮</span>
              <h2 className="text-sm sm:text-base font-bubble font-black text-amber-700 leading-tight">
                เกมสะกดคำ ม.1 - ม.6
              </h2>
            </div>
          </div>

          {/* Score, Streak & Save to Sheets */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {streak > 1 && (
              <div className="flex items-center gap-1 bg-rose-500 text-white font-extrabold px-2 py-0.5 rounded-full text-xs animate-bounce shadow-2xs">
                <Flame className="w-3 h-3 fill-current" />
                <span>x{streak}</span>
              </div>
            )}

            <div className="flex items-center gap-1 bg-amber-500 text-white font-extrabold px-2.5 py-0.5 rounded-full text-xs shadow-2xs">
              <Trophy className="w-3 h-3" />
              <span>ถูก: {gameScore}</span>
            </div>

            <button
              type="button"
              onClick={() => setChallengeMode(!challengeMode)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition border cursor-pointer ${
                challengeMode
                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                  : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
              }`}
            >
              {challengeMode ? '⚡ ตัวหลอก' : '🌱 ปกติ'}
            </button>

            {gameScore > 0 && (
              <button
                type="button"
                onClick={handleSaveToGas}
                disabled={isSavingScore}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSavingScore ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3 h-3 text-emerald-200" />
                )}
                <span>{student ? 'บันทึก' : 'ลงชื่อ'}</span>
              </button>
            )}
          </div>
        </div>

        {saveMessage && (
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{saveMessage}</span>
          </div>
        )}

        {/* Grade and Topic Filter Strip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 flex-1">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
              <GraduationCap className="w-3 h-3" /> ชั้น:
            </span>

            <button
              type="button"
              onClick={() => setSelectedGrade('all')}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedGrade === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด
            </button>

            <button
              type="button"
              onClick={() => setSelectedGrade('lower')}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedGrade === 'lower'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              ม.ต้น
            </button>

            <button
              type="button"
              onClick={() => setSelectedGrade('upper')}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedGrade === 'upper'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-purple-50 text-purple-800 border border-purple-200'
              }`}
            >
              ม.ปลาย
            </button>

            {(['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'] as SecondaryGrade[]).map((g) => {
              const isSel = selectedGrade === g;
              const gBadge = GRADE_BADGES[g];
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGrade(g)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                    isSel
                      ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                      : `${gBadge.bg} ${gBadge.color}`
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>

          {/* Topic Selector */}
          <div className="flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value as any)}
              className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-amber-400 cursor-pointer"
            >
              <option value="all">ทุกหมวด</option>
              {VOCAB_TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Game Stage Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-amber-200/80 relative overflow-hidden space-y-3 sm:space-y-3.5">
        {/* Top Word Metadata Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5">
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${badge.bg} ${badge.color}`}>
              {currentWord.grade} ({currentWord.level === 'lower' ? 'มัธยมศึกษาตอนต้น' : 'มัธยมศึกษาตอนปลาย'})
            </span>
            <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700">
              {currentWord.pos}
            </span>
            <span className="text-xs font-bold text-slate-400">
              • {currentWord.topic}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => speakText(currentWord.word, { rate: speedRate })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition cursor-pointer"
              title="ฟังเสียงอ่านคำศัพท์"
            >
              <Volume2 className="w-4 h-4" />
              <span>ฟังเสียงคำศัพท์</span>
            </button>

            <button
              type="button"
              onClick={() => setRevealClue(!revealClue)}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition cursor-pointer"
              title={revealClue ? 'ซ่อนคำใบ้' : 'ดูคำใบ้สะกดคำ'}
            >
              {revealClue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Clues Card: Thai Meaning, Phonetics & Sentence Clue */}
        <div className="bg-amber-50/70 rounded-xl p-3 sm:p-3.5 border border-amber-200/80 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            {currentWord.emoji && <span className="text-2xl select-none">{currentWord.emoji}</span>}
            <h3 className="text-lg sm:text-xl font-black text-slate-800">
              {currentWord.meaningTh}
            </h3>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="font-mono text-slate-600 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200 font-semibold text-[11px] sm:text-xs">
              {currentWord.phoneticIPA}
            </span>
            <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 text-[11px] sm:text-xs">
              อ่านว่า: {currentWord.phoneticTh}
            </span>
          </div>

          {/* Example Sentence with Clue Slot */}
          <div className="pt-1.5 border-t border-amber-200/50 text-xs sm:text-[13px] text-slate-700 leading-snug">
            <p className="font-medium">
              &ldquo;
              {currentWord.sentence.replace(
                new RegExp(`\\b${currentWord.word}\\b`, 'gi'),
                isCompleted ? currentWord.word : '[ ____________ ]'
              )}
              &rdquo;
            </p>
            <p className="text-[11px] text-slate-500 font-normal mt-0.5">
              แปล: {currentWord.sentenceTh}
            </p>
          </div>

          {revealClue && (
            <div className="pt-1 text-xs font-bold text-amber-700 animate-fadeIn">
              💡 ตัวสะกด: <span className="font-mono tracking-widest uppercase">{currentWord.word}</span>
            </div>
          )}
        </div>

        {/* Word Spelled Slots */}
        <div className="py-1">
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {targetLetters.map((targetChar, idx) => {
              const spelledChar = spelledLetters[idx];
              const isCurrentSlot = idx === spelledLetters.length && !isCompleted;

              return (
                <div
                  key={`slot-${idx}`}
                  className={`w-10 h-12 sm:w-12 sm:h-14 rounded-xl flex items-center justify-center font-bubble text-xl sm:text-2xl font-black uppercase transition-all select-none ${
                    spelledChar
                      ? 'bg-amber-400 text-slate-900 border-2 border-amber-500 shadow-xs scale-105'
                      : isCurrentSlot
                      ? 'bg-amber-50 border-2 border-dashed border-amber-400 animate-pulse text-amber-300'
                      : 'bg-slate-100 border-2 border-dashed border-slate-300 text-transparent'
                  }`}
                >
                  {spelledChar || (isCurrentSlot ? '?' : '_')}
                </div>
              );
            })}
          </div>
        </div>

        {/* Available Letter Bubbles to Pop */}
        <div className="space-y-2 pt-1">
          <div className="text-center">
            <span className="text-xs font-bold text-slate-400">
              {isCompleted ? '🎉 สะกดคำสำเร็จแล้ว!' : 'แตะหรือพิมพ์ตัวอักษรเพื่อสะกดคำ:'}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-xl mx-auto min-h-[65px] sm:min-h-[75px]">
            {availableBubbles.map((bubble) => {
              const isShaking = wrongShakeId === bubble.id;

              return (
                <button
                  key={bubble.id}
                  type="button"
                  disabled={bubble.used || isCompleted}
                  onClick={() => handleBubbleClick(bubble)}
                  className={`w-11 h-11 sm:w-13 sm:h-13 rounded-xl font-bubble text-lg sm:text-xl font-black uppercase transition-all flex items-center justify-center select-none cursor-pointer ${
                    bubble.used
                      ? 'opacity-20 scale-75 bg-slate-200 text-slate-400 border border-slate-300 pointer-events-none'
                      : isShaking
                      ? 'bg-rose-500 text-white animate-shake shadow-md'
                      : 'bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-amber-950 border-2 border-amber-600 shadow-xs active:scale-90 hover:scale-105'
                  }`}
                >
                  {bubble.letter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls: Undo, Reset, Next */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={spelledLetters.length === 0 || isCompleted}
              onClick={handleUndo}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="ลบตัวอักษรล่าสุด (Backspace)"
            >
              <Delete className="w-3.5 h-3.5" />
              <span>ลบตัวหลัง</span>
            </button>

            <button
              type="button"
              onClick={handleResetCurrent}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              title="เริ่มสะกดคำนี้ใหม่"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>เริ่มใหม่</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {isCompleted ? (
              <button
                type="button"
                onClick={handleNextWord}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm shadow-md shadow-emerald-200 transition active:scale-95 cursor-pointer animate-pulse"
              >
                <span>คำถัดไป (+2 ⭐)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextWord}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition cursor-pointer"
              >
                <span>ข้ามคำนี้</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
