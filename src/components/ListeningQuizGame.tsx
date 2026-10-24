import React, { useState, useEffect, useMemo } from 'react';
import { PhonicsWord, PhonicsVowel } from '../types/phonics';
import { PHONICS_WORDS, ALL_VOWELS, VOWEL_INFO_MAP } from '../data/phonicsData';
import {
  speakText,
  soundOutAndBlend,
  playCorrectSound,
  playIncorrectSound,
  playFanfareSound,
  unlockAudio,
} from '../utils/audioUtils';
import { StudentProfile } from '../types/student';
import { recordScore } from '../services/gasService';
import confetti from 'canvas-confetti';
import { Volume2, Trophy, ArrowRight, RotateCcw, CheckCircle2, XCircle, Sparkles, FileSpreadsheet, User, RefreshCw, AlertCircle } from 'lucide-react';

interface ListeningQuizGameProps {
  onAddStars: (amount: number) => void;
  speedRate: number;
  student: StudentProfile | null;
  onRequireLogin: () => void;
}

export const ListeningQuizGame: React.FC<ListeningQuizGameProps> = ({
  onAddStars,
  speedRate,
  student,
  onRequireLogin,
}) => {
  const [selectedVowel, setSelectedVowel] = useState<PhonicsVowel | 'all'>('all');
  const [round, setRound] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [answeredId, setAnsweredId] = useState<string | null>(null);
  const [isQuizComplete, setIsQuizComplete] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'synced' | 'local_only' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');

  const TOTAL_ROUNDS = 10;

  // Filter pool
  const pool = useMemo(() => {
    return selectedVowel === 'all'
      ? PHONICS_WORDS
      : PHONICS_WORDS.filter((w) => w.vowel === selectedVowel);
  }, [selectedVowel]);

  // Current question and 4 choices
  const currentQuestion = useMemo(() => {
    if (!pool.length) return null;
    const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
    const target = shuffledPool[0];

    // Pick 3 distractors
    const otherWords = pool.filter((w) => w.id !== target.id);
    const distractors = [...otherWords].sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [target, ...distractors].sort(() => 0.5 - Math.random());

    return { target, options };
  }, [round, selectedVowel, pool]);

  useEffect(() => {
    setAnsweredId(null);
    if (currentQuestion) {
      setTimeout(() => {
        speakText(currentQuestion.target.word, { rate: speedRate });
      }, 300);
    }
  }, [round, selectedVowel]);

  if (!currentQuestion) return null;

  const handleSelectOption = (option: PhonicsWord) => {
    if (answeredId) return; // already answered
    unlockAudio();
    setAnsweredId(option.id);

    if (option.id === currentQuestion.target.id) {
      playCorrectSound();
      setScore((prev) => prev + 1);
      onAddStars(2);
    } else {
      playIncorrectSound();
    }
  };

  const submitScoreToGas = async (stu: StudentProfile, finalScore: number) => {
    setSyncStatus('saving');
    try {
      const res = await recordScore(stu, {
        gameId: 'quiz',
        gameName: 'แบบทดสอบฟังเสียงโฟนิกส์ (Listening Quiz)',
        score: finalScore,
        totalScore: TOTAL_ROUNDS,
        starsEarned: 5,
        details: `${finalScore}/${TOTAL_ROUNDS} ข้อ (${selectedVowel === 'all' ? 'รวมทุกสระ' : selectedVowel})`,
      });

      if (res.synced) {
        setSyncStatus('synced');
        setSyncMessage(`ส่งคะแนนของ ${stu.nickname} ไปยัง Google Sheets ของคุณครูเรียบร้อยแล้ว! ✨`);
      } else {
        setSyncStatus('local_only');
        setSyncMessage('บันทึกคะแนนไว้ในเครื่องแล้ว (รอเชื่อมต่อ Google Sheets)');
      }
    } catch {
      setSyncStatus('local_only');
      setSyncMessage('บันทึกคะแนนในเครื่องเรียบร้อย');
    }
  };

  const handleNextQuestion = () => {
    if (round + 1 >= TOTAL_ROUNDS) {
      setIsQuizComplete(true);
      playFanfareSound();
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.5 },
      });
      onAddStars(5);

      if (student) {
        submitScoreToGas(student, score);
      }
    } else {
      setRound((prev) => prev + 1);
    }
  };

  const handleRestart = () => {
    setRound(0);
    setScore(0);
    setAnsweredId(null);
    setIsQuizComplete(false);
    setSyncStatus('idle');
    setSyncMessage('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border-2 border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎧</span>
            <h2 className="text-xl sm:text-2xl font-bubble font-black text-emerald-700">
              แบบทดสอบฟังเสียงโฟนิกส์ (Listening Quiz)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            ฟังเสียงอ่านให้ดี แล้วแตะเลือกการ์ดคำศัพท์และรูปภาพที่ถูกต้อง ({TOTAL_ROUNDS} ข้อ)
          </p>
        </div>

        {/* Progress & Score */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 font-extrabold text-xs border border-emerald-200">
            ข้อที่ {round + 1} / {TOTAL_ROUNDS}
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs border border-amber-200">
            คะแนน: {score}
          </div>
        </div>
      </div>

      {/* Vowel Switcher */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => {
            setSelectedVowel('all');
            handleRestart();
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
            selectedVowel === 'all'
              ? 'bg-slate-800 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          ทั้งหมด (255 คำ)
        </button>
        {ALL_VOWELS.map((v) => (
          <button
            key={v}
            onClick={() => {
              setSelectedVowel(v);
              handleRestart();
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
              selectedVowel === v
                ? `${VOWEL_INFO_MAP[v].bgLight} ${VOWEL_INFO_MAP[v].textColor} border-2 ${VOWEL_INFO_MAP[v].borderColor}`
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {VOWEL_INFO_MAP[v].icon} {VOWEL_INFO_MAP[v].name} ({VOWEL_INFO_MAP[v].symbol})
          </button>
        ))}
      </div>

      {/* Quiz Area */}
      {!isQuizComplete ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border-2 border-slate-200 text-center space-y-6">
          {/* Big Speaker Button */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <button
              onClick={() => speakText(currentQuestion.target.word, { rate: speedRate })}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-300/50 hover:scale-105 active:scale-95 transition-all group"
            >
              <Volume2 className="w-12 h-12 group-hover:scale-110 transition-transform" />
            </button>
            <div className="text-xs font-bold text-slate-500">
              แตะเพื่อฟังเสียงอีกครั้ง (Sound Clue)
            </div>
          </div>

          {/* 4 Answer Choice Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-xl mx-auto">
            {currentQuestion.options.map((option) => {
              const isSelected = answeredId === option.id;
              const isCorrectTarget = option.id === currentQuestion.target.id;

              let btnStyle = 'bg-slate-50 border-2 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-slate-800';

              if (answeredId) {
                if (isCorrectTarget) {
                  btnStyle = 'bg-emerald-500 border-2 border-emerald-600 text-white ring-4 ring-emerald-200 scale-102';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-500 border-2 border-rose-600 text-white';
                } else {
                  btnStyle = 'bg-slate-100 border-2 border-slate-200 text-slate-400 opacity-50';
                }
              }

              return (
                <button
                  key={option.id}
                  disabled={answeredId !== null}
                  onClick={() => handleSelectOption(option)}
                  className={`p-4 sm:p-5 rounded-3xl flex flex-col items-center justify-center transition-all duration-200 shadow-sm active:scale-95 select-none ${btnStyle}`}
                >
                  <span className="text-4xl sm:text-5xl mb-2">{option.emoji}</span>
                  <span className="font-bubble text-2xl sm:text-3xl font-black tracking-wide">
                    {option.word}
                  </span>
                  <span className={`text-xs font-thai mt-0.5 ${answeredId && (isCorrectTarget || isSelected) ? 'text-white' : 'text-slate-500'}`}>
                    {option.meaningTh}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Feedback & Next Button */}
          {answeredId && (
            <div className="pt-2 animate-fadeIn flex flex-col items-center justify-center space-y-3">
              {answeredId === currentQuestion.target.id ? (
                <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm sm:text-base">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>เก่งมาก! ตอบถูกต้อง ได้รับ +2 ดาว ⭐</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm sm:text-base">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span>คำตอบที่ถูกต้องคือ "{currentQuestion.target.word}" ({currentQuestion.target.meaningTh})</span>
                </div>
              )}

              <button
                onClick={handleNextQuestion}
                className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md shadow-emerald-400/40 active:scale-95 transition"
              >
                <span>{round + 1 >= TOTAL_ROUNDS ? 'ดูผลคะแนนรวม' : 'ข้อถัดไป'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Quiz Complete Summary Card */
        <div className="bg-white rounded-3xl p-8 shadow-xl border-3 border-emerald-300 text-center space-y-5 animate-fadeIn">
          <div className="text-6xl animate-bounce">🏆</div>
          <h3 className="font-bubble text-3xl font-black text-slate-800">
            จบแบบทดสอบเรียบร้อยแล้ว!
          </h3>
          <p className="text-base text-slate-600">
            คุณทำคะแนนได้ <span className="font-extrabold text-3xl text-emerald-600 font-bubble">{score}</span> / {TOTAL_ROUNDS} คะแนน
          </p>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-900 font-medium max-w-md mx-auto">
            {score >= 8
              ? '🌟 ยอดเยี่ยมสุดๆ! หูของคุณฟังเสียงสระ Phonics ได้แม่นยำมาก!'
              : score >= 5
              ? '👍 ทำได้ดีมาก! ฝึกฟังซ้ำอีกนิดจะเก่งขึ้นแน่นอน!'
              : '💪 พยายามได้ดีมาก ลองเปิดฟังที่หน้าเรียนรู้สระแล้วมาทดสอบใหม่อีกครั้งนะ!'}
          </div>

          {/* Google Sheets Sync Card */}
          {student ? (
            <div className="max-w-md mx-auto p-4 rounded-2xl border-2 transition text-left space-y-2 bg-emerald-50/80 border-emerald-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{student.avatar}</span>
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      ผู้เรียน: {student.nickname} ({student.name})
                    </span>
                    <div className="text-[11px] text-emerald-700 font-medium">
                      {student.grade} ห้อง {student.room} เลขที่ {student.number}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {syncStatus === 'saving' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังส่ง...</span>
                    </span>
                  )}
                  {syncStatus === 'synced' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-200/80 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>บันทึกแล้ว</span>
                    </span>
                  )}
                  {syncStatus === 'local_only' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>บันทึกในเครื่อง</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-600 pt-1 border-t border-emerald-200/60 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Google Sheets ของครู</span>
                </span>
                {syncStatus !== 'synced' && syncStatus !== 'saving' && (
                  <button
                    onClick={() => submitScoreToGas(student, score)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                  >
                    กดส่งคะแนนอีกครั้ง
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-left space-y-2">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    ต้องการบันทึกคะแนนนี้ส่งคุณครูหรือไม่?
                  </h4>
                  <p className="text-xs text-slate-600">
                    ลงชื่อเข้าเรียนเพื่อบันทึกผลการทดสอบ {score}/{TOTAL_ROUNDS} คะแนน ลง Google Sheets
                  </p>
                </div>
              </div>

              <div className="pt-1 text-center">
                <button
                  onClick={onRequireLogin}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <User className="w-4 h-4" />
                  <span>ลงชื่อเข้าเรียน & บันทึกคะแนนตอนนี้</span>
                </button>
              </div>
            </div>
          )}

          <div className="pt-3">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-400/40 active:scale-95 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ทำแบบทดสอบอีกรอบ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
