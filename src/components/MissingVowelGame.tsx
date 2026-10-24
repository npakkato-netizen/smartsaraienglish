import React, { useState, useEffect, useMemo } from 'react';
import { PhonicsWord, ShortVowel } from '../types/phonics';
import { PHONICS_WORDS, SHORT_VOWELS, VOWEL_INFO_MAP } from '../data/phonicsData';
import {
  speakText,
  speakLetterPhoneme,
  playPhonicsSound,
  playCorrectSound,
  playIncorrectSound,
  playFanfareSound,
  unlockAudio,
} from '../utils/audioUtils';
import confetti from 'canvas-confetti';
import { StudentProfile } from '../types/student';
import { recordScore } from '../services/gasService';
import { Volume2, Sparkles, ArrowRight, Flame, Trophy, CheckCircle2, FileSpreadsheet, RefreshCw } from 'lucide-react';

interface MissingVowelGameProps {
  onAddStars: (amount: number) => void;
  speedRate: number;
  student: StudentProfile | null;
  onRequireLogin: () => void;
}

export const MissingVowelGame: React.FC<MissingVowelGameProps> = ({
  onAddStars,
  speedRate,
  student,
  onRequireLogin,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<ShortVowel | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [wrongOption, setWrongOption] = useState<ShortVowel | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [totalCorrect, setTotalCorrect] = useState<number>(0);
  const [isSavingScore, setIsSavingScore] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Shuffle questions from 125 short vowel words
  const questionList = useMemo(() => {
    return PHONICS_WORDS.filter(
      (w) => !w.vowelCategory || w.vowelCategory === 'short'
    ).sort(() => 0.5 - Math.random());
  }, []);

  const currentWord: PhonicsWord | undefined = questionList[currentIndex % questionList.length];

  useEffect(() => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    setWrongOption(null);
  }, [currentIndex]);

  if (!currentWord) return null;

  // Split word into parts before and after the vowel
  const vowelChar = currentWord.vowel;
  const vowelIndex = currentWord.word.indexOf(vowelChar);
  const prefix = currentWord.word.substring(0, vowelIndex);
  const suffix = currentWord.word.substring(vowelIndex + 1);

  const handleSelectVowel = (vowel: ShortVowel) => {
    if (isCorrect) return; // already solved
    unlockAudio();
    playPhonicsSound(vowel, speedRate);

    if (vowel === currentWord.vowel) {
      // Correct!
      setSelectedAnswer(vowel);
      setIsCorrect(true);
      setWrongOption(null);
      setTimeout(() => playCorrectSound(), 280);
      setStreak((prev) => prev + 1);
      setTotalCorrect((prev) => prev + 1);
      onAddStars(2);

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });

      // Speak word
      setTimeout(() => {
        speakText(currentWord.word, { rate: speedRate });
      }, 550);
    } else {
      // Wrong
      setTimeout(() => playIncorrectSound(), 280);
      setWrongOption(vowel);
      setStreak(0);
      setTimeout(() => setWrongOption(null), 600);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => prev + 1);
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
      gameId: 'missing-vowel',
      gameName: 'เกมเติมสระที่หายไป (Missing Vowel)',
      score: totalCorrect,
      totalScore: Math.max(totalCorrect, currentIndex + 1),
      starsEarned: totalCorrect * 2,
      details: `ตอบถูก ${totalCorrect} ข้อ (Streak สูงสุด: ${streak})`,
    });

    setIsSavingScore(false);
    if (res.synced) {
      setSaveMessage(`บันทึกคะแนนของ ${student.nickname} ลง Google Sheets เรียบร้อยแล้ว! ✨`);
    } else {
      setSaveMessage('บันทึกคะแนนไว้ในเครื่องแล้ว (รอเชื่อมต่อ Sheets)');
    }
    setTimeout(() => setSaveMessage(null), 4000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border-2 border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <h2 className="text-xl sm:text-2xl font-bubble font-black text-rose-700">
              นักสืบหาตัวสระที่หายไป (Missing Vowel Detective)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            ดูรูปภาพและคำศัพท์ แล้วเลือกสระเสียงสั้น 1 ใน 5 ตัว (a, e, i, o, u) มาเติมในช่องว่าง!
          </p>
        </div>

        {/* Streak, Score & Save button */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 font-extrabold text-xs border border-orange-200">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span>Streak: {streak}</span>
          </div>

          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs border border-emerald-200">
            <Trophy className="w-4 h-4 text-emerald-600" />
            <span>ถูกแล้ว: {totalCorrect}</span>
          </div>

          {totalCorrect > 0 && (
            <button
              onClick={handleSaveToGas}
              disabled={isSavingScore}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSavingScore ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              )}
              <span>{student ? 'บันทึกคะแนนลง Sheets' : 'ลงชื่อบันทึกคะแนน'}</span>
            </button>
          )}
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border-2 border-slate-200 text-center relative overflow-hidden">
        {/* Large Emoji visual */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-7xl sm:text-8xl mb-4 shadow-inner">
          {currentWord.emoji}
        </div>

        {/* Thai Hint Meaning */}
        <div className="text-sm font-bold text-slate-600 mb-2">
          คำใบ้: <span className="text-slate-900 text-base">{currentWord.meaningTh}</span>
        </div>

        {/* Missing Word Display */}
        <div className="flex items-center justify-center gap-2 my-5">
          {/* Prefix consonant(s) */}
          <span className="font-bubble text-5xl sm:text-6xl font-black text-slate-800">
            {prefix}
          </span>

          {/* Missing Vowel Slot */}
          <div
            className={`w-16 h-20 sm:w-20 sm:h-24 rounded-2xl flex flex-col items-center justify-center font-bubble font-black text-4xl sm:text-5xl transition-all duration-300 ${
              isCorrect
                ? 'bg-emerald-500 text-white shadow-lg ring-4 ring-emerald-200 scale-110'
                : 'bg-rose-50 border-3 border-dashed border-rose-400 text-rose-500 animate-pulse'
            }`}
          >
            <span>{isCorrect && selectedAnswer ? selectedAnswer : '?'}</span>
            <span className="text-[10px] font-thai font-normal text-rose-400 mt-0.5">
              {isCorrect ? 'สระถูกต้อง' : 'เติมสระ'}
            </span>
          </div>

          {/* Suffix consonant(s) */}
          <span className="font-bubble text-5xl sm:text-6xl font-black text-slate-800">
            {suffix}
          </span>
        </div>

        {/* Listen word hint button */}
        <button
          onClick={() => speakText(currentWord.word, { rate: speedRate })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition mb-6 shadow-2xs"
        >
          <Volume2 className="w-4 h-4 text-amber-600" />
          <span>กดฟังเสียงอ่านคำนี้</span>
        </button>

        {/* Vowel Choices (A, E, I, O, U) */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3 max-w-xl mx-auto">
          {SHORT_VOWELS.map((v) => {
            const info = VOWEL_INFO_MAP[v];
            const isWrong = wrongOption === v;
            const isChosen = selectedAnswer === v;

            return (
              <button
                key={v}
                onClick={() => handleSelectVowel(v)}
                disabled={isCorrect === true}
                className={`py-3 sm:py-4 px-2 rounded-2xl font-bubble font-black text-2xl sm:text-3xl flex flex-col items-center justify-center transition-all duration-200 select-none shadow-md ${
                  isChosen && isCorrect
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-300 scale-105'
                    : isWrong
                    ? 'bg-rose-500 text-white animate-shake'
                    : 'bg-slate-50 hover:bg-amber-100/80 text-slate-800 border-2 border-slate-200 hover:border-amber-400 hover:scale-105 active:scale-95'
                }`}
              >
                <span className="text-xl sm:text-2xl mb-0.5">{info.icon}</span>
                <span>{v.toUpperCase()}</span>
                <span className="text-[11px] font-thai font-medium text-slate-500">
                  {info.thaiSound.replace('เสียง ', '')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Success / Next Action Feedback */}
        {isCorrect && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 animate-fadeIn space-y-2">
            <div className="flex items-center justify-center gap-2 text-emerald-800 font-extrabold text-sm sm:text-base">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>
                ยอดเยี่ยมมาก! สระ "{currentWord.vowel.toUpperCase()}" {VOWEL_INFO_MAP[currentWord.vowel].thaiSound} รวมเป็น "{currentWord.word}"
              </span>
            </div>
            <p className="text-xs text-slate-600">
              อ่านว่า <span className="font-bold text-slate-900">{currentWord.phoneticTh}</span> ({currentWord.phoneticIPA}) แปลว่า {currentWord.meaningTh}
            </p>
            <div className="pt-2">
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-400/40 active:scale-95 transition"
              >
                <span>ข้อต่อไป</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
