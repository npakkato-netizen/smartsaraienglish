import React, { useState } from 'react';
import { PhonicsWord, LetterBreakdown } from '../types/phonics';
import { VOWEL_INFO_MAP } from '../data/phonicsData';
import { Volume2, Turtle, CheckCircle2, Sparkles, GraduationCap, Wand2, Printer } from 'lucide-react';
import {
  speakText,
  playPhonicsSound,
  soundOutAndBlendWord,
  speakThaiPhonicsCoachWord,
  playLetterClickSound,
  playSparkleSound,
  unlockAudio,
  PhonicsVoiceMode,
} from '../utils/audioUtils';

interface WordCardProps {
  word: PhonicsWord;
  isPracticed: boolean;
  onMarkPracticed: (wordId: string) => void;
  speedRate: number;
  voiceMode?: PhonicsVoiceMode;
  preferredVoiceURI?: string;
  onPrintWord?: (word: PhonicsWord) => void;
}

export const WordCard: React.FC<WordCardProps> = ({
  word,
  isPracticed,
  onMarkPracticed,
  speedRate,
  voiceMode = 'sound',
  preferredVoiceURI,
  onPrintWord,
}) => {
  const [activeStepIndices, setActiveStepIndices] = useState<number[]>([]);
  const [isBlending, setIsBlending] = useState(false);
  const [isSpeakingThaiCoach, setIsSpeakingThaiCoach] = useState(false);
  const [isSpeakingSentence, setIsSpeakingSentence] = useState(false);
  const [isSpeakingWord, setIsSpeakingWord] = useState(false);

  const vowelInfo = VOWEL_INFO_MAP[word.vowel] || {
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-300',
    thaiSound: 'เสียงสระ',
    name: 'สระ',
  };

  // Sound out according to authentic Phonics Blending Technique
  const handleBlend = async () => {
    if (isBlending) return;
    unlockAudio();
    setIsBlending(true);
    await soundOutAndBlendWord(
      word,
      (indices) => setActiveStepIndices(indices || []),
      speedRate
    );
    setIsBlending(false);
    setActiveStepIndices([]);
    onMarkPracticed(word.id);
  };

  // Speak whole word
  const handleSpeakWhole = async (rate: number = speedRate) => {
    unlockAudio();
    setIsSpeakingWord(true);
    playSparkleSound();
    await speakText(word.word, { rate, voiceURI: preferredVoiceURI });
    setIsSpeakingWord(false);
    onMarkPracticed(word.id);
  };

  // Click on a letter phoneme block following Phonics Technique
  const handleLetterClick = async (seg: LetterBreakdown, index: number) => {
    unlockAudio();

    // Check if clicked letter is Magic E or associated vowel
    if (isMagicEWord) {
      const magicEIndex = word.letters.length - 1;
      const isSilentE = index === magicEIndex || seg.soundTh.includes('ไม่ออกเสียง') || seg.soundIpa === '';

      if (isSilentE) {
        // Find matching vowel before it and highlight together
        const vIdx = word.letters.findIndex(
          (l, i) => i < magicEIndex && ['เอ', 'อี', 'ไอ', 'โอ', 'ยู', 'อู'].includes(l.soundTh)
        );
        setActiveStepIndices(vIdx !== -1 ? [vIdx, magicEIndex] : [magicEIndex]);
        playSparkleSound();
        playPhonicsSound(word.vowel, speedRate);
        setTimeout(() => setActiveStepIndices([]), 550);
        return;
      }

      // If clicked the vowel in Magic E word: highlight both vowel and silent e!
      if (['เอ', 'อี', 'ไอ', 'โอ', 'ยู', 'อู'].includes(seg.soundTh)) {
        setActiveStepIndices([index, magicEIndex]);
        playLetterClickSound();
        playPhonicsSound(word.vowel, speedRate);
        setTimeout(() => setActiveStepIndices([]), 550);
        return;
      }
    }

    setActiveStepIndices([index]);
    playLetterClickSound();

    // Diphthong / Vowel Team / Consonant
    if (seg.soundTh && ['เอ', 'อี', 'ไอ', 'โอ', 'ยู', 'อู', 'อุ', 'ออย', 'เอา', 'แอร์', 'เอีย', 'แอ', 'เอะ', 'อิ', 'เอาะ', 'อะ'].includes(seg.soundTh)) {
      if (seg.soundTh === 'อุ') {
        playPhonicsSound('oo_short', speedRate);
      } else if (seg.soundTh === 'อู') {
        playPhonicsSound('oo_long', speedRate);
      } else {
        playPhonicsSound(seg.soundTh, speedRate);
      }
    } else {
      playPhonicsSound(seg.letter.toLowerCase(), speedRate);
    }

    setTimeout(() => setActiveStepIndices([]), 450);
  };

  // Thai teacher phonics coach
  const handleThaiCoach = async () => {
    if (isSpeakingThaiCoach) return;
    unlockAudio();
    setIsSpeakingThaiCoach(true);
    await speakThaiPhonicsCoachWord(word, speedRate);
    setIsSpeakingThaiCoach(false);
    onMarkPracticed(word.id);
  };

  // Speak example sentence
  const handleSpeakSentence = async () => {
    unlockAudio();
    setIsSpeakingSentence(true);
    await speakText(word.sentence, { rate: speedRate, voiceURI: preferredVoiceURI });
    setIsSpeakingSentence(false);
  };

  // Is Magic E word?
  const isMagicEWord =
    word.pattern?.includes('_e') ||
    (word.letters &&
      word.letters.length >= 3 &&
      word.letters[word.letters.length - 1].letter.toLowerCase() === 'e' &&
      word.letters[word.letters.length - 1].soundTh.includes('ไม่ออกเสียง'));

  return (
    <div
      className={`relative bg-white rounded-3xl p-5 sm:p-6 border-2 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between group ${
        isPracticed ? 'border-amber-300 bg-gradient-to-b from-amber-50/20 to-white' : 'border-slate-200'
      }`}
    >
      {/* Top badges: Word Family & Pattern Info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            กลุ่มคำ: <span className="font-mono text-amber-700">{word.family}</span>
          </span>

          {isMagicEWord && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              <Wand2 className="w-3 h-3 text-amber-600" />
              <span>Magic E</span>
            </span>
          )}
        </div>

        {isPracticed && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            ฝึกแล้ว
          </span>
        )}
      </div>

      {/* Emoji & Visual Presence */}
      <div className="flex flex-col items-center my-2 text-center">
        <div
          onClick={() => handleSpeakWhole()}
          title="คลิกที่รูปเพื่อฟังเสียงอ่าน"
          className="cursor-pointer w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-amber-50/60 border border-amber-100 flex items-center justify-center text-5xl sm:text-6xl mb-3 shadow-inner group-hover:scale-110 transition-transform active:scale-95"
        >
          {word.emoji}
        </div>

        {/* Interactive Segmented Phonics Letter Blocks */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
          {word.letters.map((seg, idx) => {
            const isHighlight = activeStepIndices.includes(idx);
            const isSilentE =
              seg.soundTh.includes('ไม่ออกเสียง') ||
              seg.soundIpa === '' ||
              (seg.letter.toLowerCase() === 'e' && isMagicEWord && idx === word.letters.length - 1);

            const isVowel =
              !isSilentE &&
              (seg.letter.toLowerCase() === word.vowel ||
                seg.letter.toLowerCase() === word.baseLetter ||
                (word.pattern && seg.letter.toLowerCase() === word.pattern.toLowerCase()) ||
                ['เอ', 'อี', 'ไอ', 'โอ', 'ยู', 'อู', 'ออย', 'เอา', 'แอร์', 'เอีย'].includes(seg.soundTh) ||
                ['a', 'e', 'i', 'o', 'u', 'ai', 'ay', 'ee', 'ea', 'oa', 'ow', 'ue', 'ew', 'oo', 'oi', 'oy', 'ou', 'aw', 'au', 'air', 'ear', 'eer', 'are', 'igh', 'ie'].includes(seg.letter.toLowerCase()));

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleLetterClick(seg, idx)}
                title={
                  isSilentE
                    ? 'Silent E (ไม่ออกเสียง) ช่วยเปลี่ยนสระข้างหน้าเป็นเสียงยาว'
                    : `คลิกฟังเสียง ${seg.letter.toUpperCase()} (${seg.soundTh})`
                }
                className={`min-w-11 h-14 sm:min-w-13 sm:h-16 px-2.5 rounded-2xl flex flex-col items-center justify-center font-bubble font-black text-2xl sm:text-3xl transition-all duration-150 shadow-sm active:scale-95 relative ${
                  isHighlight
                    ? isSilentE
                      ? 'bg-amber-300 text-amber-900 ring-4 ring-amber-200 scale-105 shadow-md'
                      : 'bg-amber-400 text-white ring-4 ring-amber-200 scale-110 -translate-y-1 shadow-md'
                    : isSilentE
                    ? 'bg-slate-50 text-slate-400 border-2 border-dashed border-slate-300 hover:border-amber-400 hover:text-amber-600'
                    : isVowel
                    ? `${vowelInfo.bgLight} ${vowelInfo.textColor} border-2 ${vowelInfo.borderColor} hover:scale-105`
                    : 'bg-slate-100 text-slate-800 border-2 border-slate-200 hover:bg-slate-200 hover:scale-105'
                }`}
              >
                <span>{seg.letter}</span>
                <span className="text-[10px] font-bold font-thai tracking-tight truncate max-w-full">
                  {isSilentE ? '🪄' : seg.soundTh}
                </span>
              </button>
            );
          })}
        </div>

        {/* Phonetics & Meaning */}
        <div className="mt-1">
          <div className="text-sm font-bold text-slate-700 flex items-center justify-center gap-2">
            <span className="text-slate-400 font-mono text-xs">{word.phoneticIPA}</span>
            <span className="text-amber-800 font-thai bg-amber-100 px-2 py-0.5 rounded-lg text-xs">
              อ่านว่า: {word.phoneticTh}
            </span>
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 font-thai">
            {word.meaningTh}
          </div>
        </div>
      </div>

      {/* Action Buttons: Blend, Whole Word, and Thai Coach */}
      <div className="space-y-2 mt-4 pt-3 border-t border-slate-100">
        <div className="grid grid-cols-2 gap-2">
          {/* Blend Button */}
          <button
            type="button"
            onClick={handleBlend}
            disabled={isBlending}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm text-white shadow-md transition-all active:scale-95 ${
              isBlending
                ? 'bg-amber-400 animate-pulse'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-300/40'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isBlending ? 'กำลังผสม...' : 'ผสมเสียง'}</span>
          </button>

          {/* Whole Word Speak */}
          <button
            type="button"
            onClick={() => handleSpeakWhole()}
            disabled={isSpeakingWord}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm border transition-all active:scale-95 ${
              isSpeakingWord
                ? 'bg-amber-100 border-amber-300 text-amber-900 animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4 text-amber-600" />
            <span>ฟังทั้งคำ</span>
          </button>
        </div>

        {/* Thai Teacher Phonics Coach Button */}
        <button
          type="button"
          onClick={handleThaiCoach}
          disabled={isSpeakingThaiCoach}
          className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs border transition-all active:scale-95 ${
            isSpeakingThaiCoach
              ? 'bg-purple-100 text-purple-900 border-purple-300 animate-pulse'
              : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-purple-600" />
          <span>
            {isSpeakingThaiCoach ? 'ครูไทยกำลังอธิบาย...' : '🇹🇭 ครูไทยสอนผสมเสียง'}
          </span>
        </button>

        {/* Turtle Slow Button */}
        <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500 pt-1">
          <button
            type="button"
            onClick={() => handleSpeakWhole(0.65)}
            className="flex items-center gap-1 hover:text-emerald-700 font-medium px-2 py-1 rounded-lg hover:bg-emerald-50 transition"
          >
            <Turtle className="w-3.5 h-3.5 text-emerald-600" />
            <span>ฟังแบบช้าพิเศษ (เต่า)</span>
          </button>

          <div className="flex items-center gap-1.5">
            {onPrintWord && (
              <button
                type="button"
                onClick={() => onPrintWord(word)}
                title="พิมพ์คำนี้ (Print Flashcard / Worksheet)"
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 font-medium px-2 py-0.5 rounded-lg hover:bg-slate-100 transition"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>พิมพ์</span>
              </button>
            )}

            <span className="text-[10px] text-slate-400">
              {word.vowelCategory === 'long'
                ? 'สระเสียงยาว'
                : word.vowelCategory === 'diphthong'
                ? 'สระประสม'
                : 'สระเสียงสั้น'}
            </span>
          </div>
        </div>

        {/* Example Sentence Box */}
        <div
          onClick={handleSpeakSentence}
          className="cursor-pointer mt-2 p-2.5 rounded-2xl bg-amber-50/50 hover:bg-amber-50 border border-amber-100 transition text-left group/sent"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800">ตัวอย่างประโยค:</span>
            <Volume2 className={`w-3.5 h-3.5 text-amber-600 ${isSpeakingSentence ? 'animate-bounce' : 'group-hover/sent:scale-110'}`} />
          </div>
          <div className="text-xs font-semibold text-slate-800 mt-0.5">
            "{word.sentence}"
          </div>
          <div className="text-[11px] text-slate-500 font-thai">
            ({word.sentenceTh})
          </div>
        </div>
      </div>
    </div>
  );
};
