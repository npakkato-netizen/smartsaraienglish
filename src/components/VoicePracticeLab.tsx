import React, { useState, useEffect, useRef } from 'react';
import { PhonicsWord, ShortVowel } from '../types/phonics';
import { PHONICS_WORDS, SHORT_VOWELS, VOWEL_INFO_MAP } from '../data/phonicsData';
import {
  ChildSpeechRecognizer,
  isSpeechRecognitionSupported,
  RecognitionResult,
} from '../utils/speechRecognition';
import {
  speakText,
  playCorrectSound,
  playIncorrectSound,
  playSparkleSound,
  unlockAudio,
} from '../utils/audioUtils';
import confetti from 'canvas-confetti';
import { Mic, MicOff, Volume2, Sparkles, Star, ArrowRight, Dices, AlertCircle, CheckCircle2 } from 'lucide-react';

interface VoicePracticeLabProps {
  onAddStars: (amount: number) => void;
  speedRate: number;
}

export const VoicePracticeLab: React.FC<VoicePracticeLabProps> = ({
  onAddStars,
  speedRate,
}) => {
  const [selectedVowel, setSelectedVowel] = useState<ShortVowel | 'all'>('all');
  const [wordIndex, setWordIndex] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognizerRef = useRef<ChildSpeechRecognizer | null>(null);
  const supported = isSpeechRecognitionSupported();

  const words = selectedVowel === 'all'
    ? PHONICS_WORDS
    : PHONICS_WORDS.filter((w) => w.vowel === selectedVowel);

  const currentWord: PhonicsWord = words[wordIndex % words.length] || PHONICS_WORDS[0];

  useEffect(() => {
    recognizerRef.current = new ChildSpeechRecognizer();
    return () => {
      recognizerRef.current?.stopListening();
    };
  }, []);

  useEffect(() => {
    setRecognitionResult(null);
    setErrorMessage(null);
  }, [wordIndex, selectedVowel]);

  const handleStartListening = () => {
    unlockAudio();
    if (!supported) {
      setErrorMessage('เบราว์เซอร์นี้ยังไม่รองรับระบบตรวจจับเสียงพูดอัตโนมัติ (แนะนำให้ใช้ Google Chrome หรือ Edge)');
      return;
    }

    setErrorMessage(null);
    setRecognitionResult(null);
    setIsListening(true);
    playSparkleSound();

    recognizerRef.current?.startListening(
      currentWord.word,
      (res) => {
        setRecognitionResult(res);
        if (res.isMatch) {
          playCorrectSound();
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
          });
          onAddStars(3);
        } else {
          playIncorrectSound();
        }
      },
      (err) => {
        setErrorMessage(err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const handleStopListening = () => {
    recognizerRef.current?.stopListening();
    setIsListening(false);
  };

  const handleNext = () => {
    setWordIndex((prev) => prev + 1);
  };

  const handleRandomWord = () => {
    const rand = Math.floor(Math.random() * words.length);
    setWordIndex(rand);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border-2 border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎙️</span>
            <h2 className="text-xl sm:text-2xl font-bubble font-black text-sky-700">
              ห้องแล็บฝึกออกเสียง (Voice Pronunciation Lab)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            ฟังครูออกเสียง แล้วกดปุ่มไมโครโฟนอ่านออกเสียงคำศัพท์ ระบบจะตรวจจับความถูกต้องให้ทันที!
          </p>
        </div>

        <button
          onClick={handleRandomWord}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-xs border border-sky-200 transition"
        >
          <Dices className="w-4 h-4" />
          <span>สุ่มคำศัพท์</span>
        </button>
      </div>

      {/* Main Pronunciation Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border-2 border-slate-200 text-center space-y-6">
        {/* Word Card Visual */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-6xl sm:text-7xl mb-3 shadow-inner">
            {currentWord.emoji}
          </div>

          <div className="font-bubble text-5xl sm:text-6xl font-black text-slate-900 tracking-wide">
            {currentWord.word}
          </div>

          <div className="text-sm font-bold text-slate-600 mt-1 flex items-center gap-2">
            <span className="font-mono text-slate-400">{currentWord.phoneticIPA}</span>
            <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg text-xs font-thai">
              อ่านว่า: {currentWord.phoneticTh}
            </span>
          </div>

          <div className="text-base font-bold text-slate-800 mt-1 font-thai">
            {currentWord.meaningTh}
          </div>
        </div>

        {/* Listen Teacher Button */}
        <div className="flex justify-center">
          <button
            onClick={() => speakText(currentWord.word, { rate: speedRate })}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-amber-100 text-slate-800 font-bold text-sm border border-slate-200 transition active:scale-95"
          >
            <Volume2 className="w-5 h-5 text-amber-600" />
            <span>🔊 ฟังเสียงตัวอย่างก่อนพูด</span>
          </button>
        </div>

        {/* Microphone Interactive Section */}
        <div className="pt-2 flex flex-col items-center justify-center space-y-4">
          <button
            onClick={isListening ? handleStopListening : handleStartListening}
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-all duration-300 ${
              isListening
                ? 'bg-rose-500 animate-pulse ring-8 ring-rose-200 scale-105'
                : 'bg-gradient-to-tr from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-sky-300/50 hover:scale-105 active:scale-95'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-10 h-10 animate-bounce" />
                <span className="text-[10px] font-bold mt-1">กำลังฟัง...</span>
              </>
            ) : (
              <>
                <Mic className="w-10 h-10" />
                <span className="text-[10px] font-bold mt-1">กดแล้วพูด</span>
              </>
            )}
          </button>

          <p className="text-xs text-slate-500 font-medium">
            {isListening ? '🗣️ พูดคำว่า "' + currentWord.word + '" ชัดๆ ได้เลย!' : 'กดปุ่มไมโครโฟนสีฟ้า แล้วออกเสียงคำศัพท์'}
          </p>
        </div>

        {/* Result Evaluation Display */}
        {recognitionResult && (
          <div
            className={`p-5 rounded-3xl border-2 transition-all animate-fadeIn ${
              recognitionResult.isMatch
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            {recognitionResult.isMatch ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-extrabold text-lg">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <span>สุดยอดมาก! ออกเสียงถูกต้องชัดเจน +3 ดาว!</span>
                </div>
                <div className="flex justify-center gap-1 text-amber-400">
                  <Star className="w-6 h-6 fill-amber-400" />
                  <Star className="w-6 h-6 fill-amber-400" />
                  <Star className="w-6 h-6 fill-amber-400" />
                </div>
                <p className="text-xs text-slate-600">
                  ระบบตรวจจับได้คำว่า: <span className="font-bold text-slate-900">"{recognitionResult.transcript}"</span>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="font-extrabold text-amber-800 text-base">
                  พยายามได้ดีมาก! ลองฟังเสียงตัวอย่างอีกรอบแล้วกดพูดใหม่นะ
                </div>
                <p className="text-xs text-slate-600">
                  เสียงที่ระบบจับได้คือ: <span className="font-bold text-slate-800">"{recognitionResult.transcript || 'ยังไม่ชัดเจน'}"</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Next Word Button */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-sm shadow-md transition active:scale-95"
          >
            <span>คำถัดไป</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
