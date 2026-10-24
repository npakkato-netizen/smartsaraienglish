import React, { useState, useEffect, useMemo } from 'react';
import { PhonicsWord, ShortVowel } from '../types/phonics';
import { PHONICS_WORDS, SHORT_VOWELS, VOWEL_INFO_MAP } from '../data/phonicsData';
import {
  speakText,
  speakLetterPhoneme,
  playPhonicsSound,
  playPopSound,
  playCorrectSound,
  playIncorrectSound,
  playFanfareSound,
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
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { SecondarySpellingGame } from './SecondarySpellingGame';

interface SpellingPopGameProps {
  onAddStars: (amount: number) => void;
  speedRate: number;
  student: StudentProfile | null;
  onRequireLogin: () => void;
}

export const SpellingPopGame: React.FC<SpellingPopGameProps> = ({
  onAddStars,
  speedRate,
  student,
  onRequireLogin,
}) => {
  const [gameCategory, setGameCategory] = useState<'secondary' | 'phonics'>('secondary');
  const [selectedVowel, setSelectedVowel] = useState<ShortVowel | 'all'>('all');
  const [challengeMode, setChallengeMode] = useState<boolean>(false);
  const [revealClue, setRevealClue] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [spelledLetters, setSpelledLetters] = useState<string[]>([]);
  const [availableBubbles, setAvailableBubbles] = useState<
    { id: string; letter: string; used: boolean }[]
  >([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [wrongShakeId, setWrongShakeId] = useState<string | null>(null);
  const [gameScore, setGameScore] = useState<number>(0);
  const [isSavingScore, setIsSavingScore] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Filter pool
  const wordPool = useMemo(() => {
    const list =
      selectedVowel === 'all'
        ? [...PHONICS_WORDS]
        : PHONICS_WORDS.filter((w) => w.vowel === selectedVowel);
    // Shuffle pool deterministically based on list
    return [...list].sort(() => 0.5 - Math.random());
  }, [selectedVowel]);

  const currentWord: PhonicsWord | undefined = wordPool[currentIndex % wordPool.length];

  // Initialize bubbles whenever word changes
  const initWord = (word: PhonicsWord) => {
    setSpelledLetters([]);
    setIsCompleted(false);
    setRevealClue(false);

    const letters = word.word.split('');
    let bubbleList = letters.map((l, idx) => ({
      id: `${l}-${idx}-${Math.random()}`,
      letter: l,
      used: false,
    }));

    // If challenge mode, add 1-2 random distractor letters
    if (challengeMode) {
      const distractors = ['b', 'p', 'd', 't', 'm', 's', 'a', 'e', 'o'].filter(
        (char) => !word.word.includes(char)
      );
      const extra1 = distractors[Math.floor(Math.random() * distractors.length)];
      if (extra1) {
        bubbleList.push({ id: `distract-1-${Math.random()}`, letter: extra1, used: false });
      }
    }

    // Shuffle bubbles
    setAvailableBubbles([...bubbleList].sort(() => 0.5 - Math.random()));

    // Pronounce the word initially
    setTimeout(() => {
      speakText(word.word, { rate: speedRate });
    }, 400);
  };

  useEffect(() => {
    if (currentWord) {
      initWord(currentWord);
    }
  }, [currentIndex, selectedVowel, challengeMode]);

  if (!currentWord) return null;

  const targetLetters = currentWord.word.split('');
  const nextTargetLetter = targetLetters[spelledLetters.length];

  // Handle clicking a bubble
  const handleBubbleClick = (bubble: { id: string; letter: string; used: boolean }) => {
    if (bubble.used || isCompleted) return;
    unlockAudio();

    if (bubble.letter.toLowerCase() === nextTargetLetter?.toLowerCase()) {
      // Correct letter!
      playPopSound();
      playPhonicsSound(bubble.letter, speedRate);

      const nextSpelled = [...spelledLetters, bubble.letter];
      setSpelledLetters(nextSpelled);

      // Mark bubble used
      setAvailableBubbles((prev) =>
        prev.map((b) => (b.id === bubble.id ? { ...b, used: true } : b))
      );

      // Check if word completed!
      if (nextSpelled.length === targetLetters.length) {
        setIsCompleted(true);
        playFanfareSound();
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
        setGameScore((prev) => prev + 1);
        onAddStars(2);
        // Announce completed word
        setTimeout(() => {
          speakText(currentWord.word, { rate: speedRate });
        }, 300);
      }
    } else {
      // Wrong letter
      playIncorrectSound();
      setWrongShakeId(bubble.id);
      setTimeout(() => setWrongShakeId(null), 500);
    }
  };

  const handleNextWord = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const handleResetCurrent = () => {
    if (currentWord) initWord(currentWord);
  };

  const handleSaveToGas = async () => {
    if (!student) {
      onRequireLogin();
      return;
    }
    unlockAudio();
    setIsSavingScore(true);
    setSaveMessage(null);

    const res = await recordScore(student, {
      gameId: 'spell-game',
      gameName: 'เกมสะกดคำฟองสบู่ (Spelling Bubble Pop)',
      score: gameScore,
      totalScore: Math.max(gameScore, currentIndex + 1),
      starsEarned: gameScore * 2,
      details: `สะกดคำถูกต้อง ${gameScore} คำ (โหมด: ${challengeMode ? 'ท้าทาย' : 'ปกติ'})`,
    });

    setIsSavingScore(false);
    if (res.synced) {
      setSaveMessage(`บันทึกคะแนนสะกดคำของ ${student.nickname} (${gameScore} คำ) ลง Google Sheets สำเร็จ! ✨`);
    } else {
      setSaveMessage('บันทึกคะแนนไว้ในเครื่องแล้ว (รอเชื่อมต่อ Sheets)');
    }
    setTimeout(() => setSaveMessage(null), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      {/* Top Category Switcher: Secondary vs Phonics */}
      <div className="bg-white rounded-2xl p-2 sm:p-2.5 shadow-2xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="text-xs font-bold text-slate-500 pl-1 sm:pl-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>เลือกประเภทคำศัพท์สำหรับเกมสะกดคำ:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setGameCategory('secondary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
              gameCategory === 'secondary'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>คำศัพท์ ม.1 - ม.6 (1,103 คำ)</span>
          </button>
          <button
            onClick={() => setGameCategory('phonics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
              gameCategory === 'phonics'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>โฟนิกส์พื้นฐาน (395 คำ)</span>
          </button>
        </div>
      </div>

      {gameCategory === 'secondary' ? (
        <SecondarySpellingGame
          speedRate={speedRate}
          student={student}
          onAddStars={onAddStars}
          onRequireLogin={onRequireLogin}
        />
      ) : (
        <>
          {/* Game Header & Settings */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs border-2 border-amber-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl">🫧</span>
                <h2 className="text-base sm:text-lg font-bubble font-black text-amber-700">
                  เกมสะกดคำฟองสบู่ (Phonics Bubble Pop)
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                ฟังเสียงคำศัพท์ แล้วแตะฟองสบู่ตัวอักษรเพื่อสะกดคำตามลำดับ
              </p>
            </div>

            {/* Score, Challenge switch & Save button */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <button
                onClick={() => setChallengeMode(!challengeMode)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition border cursor-pointer ${
                  challengeMode
                    ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                    : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                }`}
              >
                {challengeMode ? '⚡ ตัวหลอก' : '🌱 ปกติ'}
              </button>

              <div className="flex items-center gap-1 bg-amber-500 text-white font-extrabold px-2.5 py-1 rounded-full text-xs shadow-2xs">
                <Trophy className="w-3.5 h-3.5" />
                <span>สะกดถูก: {gameScore}</span>
              </div>

              {gameScore > 0 && (
                <button
                  onClick={handleSaveToGas}
                  disabled={isSavingScore}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSavingScore ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                  )}
                  <span>{student ? 'บันทึก' : 'ลงชื่อ'}</span>
                </button>
              )}
            </div>
          </div>

          {saveMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveMessage}</span>
            </div>
          )}

          {/* Vowel Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedVowel('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap ${
                selectedVowel === 'all'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              ทั้งหมด (All)
            </button>
            {SHORT_VOWELS.map((v) => {
              const info = VOWEL_INFO_MAP[v];
              const isSel = selectedVowel === v;
              return (
                <button
                  key={v}
                  onClick={() => setSelectedVowel(v)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                    isSel
                      ? `${info.borderColor} ${info.bgLight} ${info.textColor} border-2 shadow-2xs`
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{info.icon}</span>
                  <span>{info.name} ({info.symbol})</span>
                </button>
              );
            })}
          </div>

          {/* Main Playing Arena */}
          <div className="bg-gradient-to-b from-sky-50/50 via-amber-50/30 to-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-amber-200 relative overflow-hidden">
            {/* Audio Speaker & Clue Helper */}
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="flex items-center gap-2.5">
                {/* Sound Button */}
                <button
                  onClick={() => speakText(currentWord.word, { rate: speedRate })}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm sm:text-base shadow-md shadow-amber-400/30 active:scale-95 transition-all group cursor-pointer"
                >
                  <Volume2 className="w-5 h-5 group-hover:scale-115 transition-transform" />
                  <span>🔊 ฟังเสียงคำศัพท์</span>
                </button>

                {/* Toggle Clue Button */}
                <button
                  onClick={() => setRevealClue(!revealClue)}
                  className="p-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs transition cursor-pointer"
                  title={revealClue ? 'ซ่อนคำใบ้' : 'ดูคำใบ้ภาพ'}
                >
                  {revealClue ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Clue Visual */}
              <div className="transition-all duration-300 min-h-[65px] flex flex-col items-center justify-center">
                {revealClue || isCompleted ? (
                  <div className="flex flex-col items-center animate-fadeIn">
                    <span className="text-4xl mb-0.5">{currentWord.emoji}</span>
                    <span className="text-xs font-bold text-slate-700 bg-white/90 px-2.5 py-0.5 rounded-lg shadow-2xs border border-slate-100">
                      ความหมาย: {currentWord.meaningTh} (สระ {VOWEL_INFO_MAP[currentWord.vowel].thaiSound})
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-white/60 px-2.5 py-1 rounded-lg border border-dashed border-slate-200">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>กดรูปดวงตาเพื่อดูภาพคำใบ้</span>
                  </div>
                )}
              </div>

              {/* Target Spelling Slots */}
              <div className="my-2 sm:my-3">
                <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                  {targetLetters.map((char, idx) => {
                    const filledLetter = spelledLetters[idx];
                    const isCurrentActive = idx === spelledLetters.length && !isCompleted;
                    const isVowelChar = char.toLowerCase() === currentWord.vowel;

                    return (
                      <div
                        key={idx}
                        className={`w-11 h-14 sm:w-13 sm:h-16 rounded-xl flex flex-col items-center justify-center font-bubble font-black text-2xl sm:text-3xl transition-all duration-150 ${
                          filledLetter
                            ? isVowelChar
                              ? 'bg-rose-100 text-rose-600 border-2 border-rose-400 shadow-xs scale-105'
                              : 'bg-white text-slate-800 border-2 border-amber-400 shadow-xs scale-105'
                            : isCurrentActive
                            ? 'bg-amber-100/70 border-2 border-dashed border-amber-400 text-amber-600 animate-pulse'
                            : 'bg-white/80 border-2 border-dashed border-slate-300 text-slate-300'
                        }`}
                      >
                        <span>{filledLetter || '_'}</span>
                        <span className="text-[9px] font-thai text-slate-400 font-normal">
                          {filledLetter ? currentWord.letters[idx]?.soundTh : `${idx + 1}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Floating Letter Bubbles */}
              <div className="w-full pt-2 border-t border-slate-200/80">
                <p className="text-xs font-bold text-slate-500 mb-2">
                  แตะฟองสบู่เพื่อสะกดตัวต่อไป 👉{' '}
                  <span className="text-amber-700 font-extrabold text-xs font-mono">
                    {nextTargetLetter ? `หาเสียง "${currentWord.letters[spelledLetters.length]?.soundTh || nextTargetLetter}"` : 'เสร็จสมบูรณ์!'}
                  </span>
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  {availableBubbles.map((bubble) => {
                    const isShaking = wrongShakeId === bubble.id;
                    const isVowel = ['a', 'e', 'i', 'o', 'u'].includes(bubble.letter.toLowerCase());

                    return (
                      <button
                        key={bubble.id}
                        disabled={bubble.used || isCompleted}
                        onClick={() => handleBubbleClick(bubble)}
                        className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bubble font-black text-xl sm:text-2xl transition-all duration-150 shadow-xs cursor-pointer ${
                          bubble.used
                            ? 'opacity-20 scale-75 cursor-not-allowed bg-slate-200 text-slate-400 shadow-none'
                            : isShaking
                            ? 'bg-rose-500 text-white animate-shake ring-3 ring-rose-300 scale-105'
                            : isVowel
                            ? 'bg-gradient-to-tr from-pink-400 via-rose-400 to-amber-300 text-white hover:scale-105 active:scale-95 ring-2 ring-white shadow-rose-300/40'
                            : 'bg-gradient-to-tr from-sky-400 via-teal-400 to-emerald-300 text-white hover:scale-105 active:scale-95 ring-2 ring-white shadow-sky-300/40'
                        }`}
                      >
                        <div className="absolute top-1.5 left-2 w-2.5 h-1.5 rounded-full bg-white/60 blur-[0.5px]"></div>
                        <span>{bubble.letter}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

          {/* Word Completed Celebration Card */}
          {isCompleted && (
            <div className="w-full mt-6 bg-white rounded-3xl p-5 border-2 border-emerald-300 shadow-lg animate-fadeIn text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>สะกดถูกต้องยอดเยี่ยม! +2 ดาว ⭐⭐</span>
              </div>

              <div className="font-bubble text-3xl sm:text-4xl font-black text-slate-900 tracking-wide">
                {currentWord.word}
              </div>

              <div className="text-sm font-bold text-slate-600">
                อ่านว่า: <span className="text-amber-700">{currentWord.phoneticTh}</span> • แปลว่า: <span className="text-slate-900">{currentWord.meaningTh}</span>
              </div>

              <p className="text-xs text-slate-500 italic max-w-md mx-auto">
                "{currentWord.sentence}" ({currentWord.sentenceTh})
              </p>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={handleNextWord}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-sm shadow-md shadow-emerald-400/40 active:scale-95 transition-all"
                >
                  <span>คำถัดไป</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Reset / Skip controls */}
          <div className="flex items-center justify-between w-full pt-4 mt-2">
            <button
              onClick={handleResetCurrent}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>เริ่มสะกดคำนี้ใหม่</span>
            </button>

            <button
              onClick={handleNextWord}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 px-3 py-1.5 rounded-xl hover:bg-amber-100/60 transition"
            >
              <span>ข้ามไปคำต่อไป</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
