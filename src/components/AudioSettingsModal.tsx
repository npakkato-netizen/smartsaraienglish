import React, { useState, useEffect } from 'react';
import {
  getAllVoices,
  getEnglishVoice,
  getThaiVoice,
  speakText,
  speakLetterPhoneme,
  playPhonicsSound,
  soundOutAndBlend,
  speakThaiPhonicsCoach,
  stopSpeaking,
  playCorrectSound,
  unlockAudio,
  PhonicsVoiceMode,
} from '../utils/audioUtils';
import { Volume2, VolumeX, Settings2, Sparkles, Check, X, RefreshCw, Sliders, Play } from 'lucide-react';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  speedRate: number;
  onUpdateSpeedRate: (rate: number) => void;
  voiceMode: PhonicsVoiceMode;
  onUpdateVoiceMode: (mode: PhonicsVoiceMode) => void;
  preferredVoiceURI: string;
  onUpdatePreferredVoice: (uri: string) => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  isOpen,
  onClose,
  speedRate,
  onUpdateSpeedRate,
  voiceMode,
  onUpdateVoiceMode,
  preferredVoiceURI,
  onUpdatePreferredVoice,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlayingTest, setIsPlayingTest] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<string>('พร้อมทดสอบเสียง');

  useEffect(() => {
    if (isOpen) {
      const vList = getAllVoices();
      setVoices(vList);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
  const thaiVoices = voices.filter((v) => v.lang.startsWith('th'));

  const handleTestWord = async () => {
    setIsPlayingTest(true);
    setTestStatus('กำลังเล่นเสียงคำศัพท์ "cat"...');
    unlockAudio();
    await speakText('cat', { rate: speedRate, voiceURI: preferredVoiceURI });
    setTestStatus('เล่นเสียงคำศัพท์สำเร็จ!');
    setIsPlayingTest(false);
  };

  const handleTestPhonics = async () => {
    setIsPlayingTest(true);
    setTestStatus('กำลังสะกดทีละตัว: c ... a ... t -> cat!');
    unlockAudio();
    await soundOutAndBlend('cat', undefined, speedRate, voiceMode);
    setTestStatus('ผสมเสียงเสร็จสิ้น!');
    setIsPlayingTest(false);
  };

  const handleTestThaiCoach = async () => {
    setIsPlayingTest(true);
    setTestStatus('ครูไทยกำลังอธิบาย: เคอะ ... แอะ ... เทอะ ... แคท (แมว)...');
    unlockAudio();
    await speakThaiPhonicsCoach('cat', ['เคอะ', 'แอะ', 'เทอะ'], 'แคท', 'แมว', speedRate);
    setTestStatus('เล่นเสียงครูไทยเสร็จสิ้น!');
    setIsPlayingTest(false);
  };

  const handleTestVowel = (vowel: string, thaiSound: string) => {
    setIsPlayingTest(true);
    setTestStatus(`กำลังออกเสียงสระ ${vowel.toUpperCase()} เป็น "${thaiSound}"...`);
    unlockAudio();
    playPhonicsSound(vowel, speedRate);
    setTimeout(() => {
      setTestStatus(`ออกเสียงสระ ${vowel.toUpperCase()} ("${thaiSound}") เรียบร้อย`);
      setIsPlayingTest(false);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-amber-200 relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bubble text-xl font-black text-slate-800">
              ตั้งค่าและทดสอบระบบเสียง (Audio Center)
            </h3>
            <p className="text-xs text-slate-500">
              ปรับโหมดการออกเสียง ความเร็ว และเลือกลำโพง/เสียงของเครื่อง
            </p>
          </div>
        </div>

        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
              <span>🎛️ เลือกรูปแบบเสียงที่ต้องการฟัง:</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => onUpdateVoiceMode('sound')}
                className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                  voiceMode === 'sound'
                    ? 'border-amber-400 bg-amber-50/70 text-amber-950 font-bold'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="text-sm font-bold flex items-center gap-1.5">
                    <span>🇺🇸 เสียงโฟนิกส์แท้ (Pure Phonics Sound)</span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.2 rounded-full font-bold">แนะนำ</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    ออกเสียงหน่วยเสียงสั้นกระชับตามหลักโฟนิกส์สากล (เช่น /k/ - /æ/ - /t/)
                  </div>
                </div>
                {voiceMode === 'sound' && <Check className="w-5 h-5 text-amber-600 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => onUpdateVoiceMode('anchor')}
                className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                  voiceMode === 'anchor'
                    ? 'border-amber-400 bg-amber-50/70 text-amber-950 font-bold'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="text-sm font-bold">
                    💡 เสียงโฟนิกส์พร้อมคำเทียบ (Anchor Words)
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    ฟังตัวอักษรพร้อมคำจำง่าย เช่น "a as in apple", "c as in cat"
                  </div>
                </div>
                {voiceMode === 'anchor' && <Check className="w-5 h-5 text-amber-600 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => onUpdateVoiceMode('thai')}
                className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                  voiceMode === 'thai'
                    ? 'border-amber-400 bg-amber-50/70 text-amber-950 font-bold'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="text-sm font-bold">
                    🇹🇭 เสียงครูไทยสอนผสมเสียง (Thai Phonics Coach)
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    สะกดเสียงแบบไทยเข้าใจง่าย: "เคอะ - แอะ - เทอะ → แคท"
                  </div>
                </div>
                {voiceMode === 'thai' && <Check className="w-5 h-5 text-amber-600 shrink-0" />}
              </button>
            </div>
          </div>

          {/* Speed Slider */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">ความเร็วในการพูด (Speech Rate):</span>
              <span className="text-xs font-mono font-extrabold text-amber-700">
                {speedRate.toFixed(2)}x {speedRate <= 0.75 ? '(โหมดเต่าช้า 🐢)' : '(ปกติ 🐇)'}
              </span>
            </div>
            <input
              type="range"
              min="0.55"
              max="1.0"
              step="0.05"
              value={speedRate}
              onChange={(e) => onUpdateSpeedRate(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0.55x (ช้ามาก สำหรับฝึกจับเสียง)</span>
              <span>0.85x (มาตรฐานเด็กประถม)</span>
              <span>1.0x (ปกติ)</span>
            </div>
          </div>

          {/* Voice selection dropdown if multiple voices exist */}
          {englishVoices.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                เลือกลำโพง/เสียงในอุปกรณ์ของคุณ (Voice Engine):
              </label>
              <select
                value={preferredVoiceURI}
                onChange={(e) => onUpdatePreferredVoice(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:ring-2 focus:ring-amber-400"
              >
                <option value="">เสียงเริ่มต้นที่ดีที่สุด (Recommended Voice)</option>
                {englishVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Live Audio Test Area */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                <span>ทดสอบการได้ยินทันที:</span>
              </span>
              <span className="text-[11px] text-slate-500">{testStatus}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleTestWord}
                disabled={isPlayingTest}
                className="py-2 px-2 rounded-xl bg-white hover:bg-amber-100 border border-amber-200 text-slate-800 text-xs font-bold shadow-2xs transition active:scale-95"
              >
                🔊 ฟังคำว่า "cat"
              </button>

              <button
                type="button"
                onClick={handleTestPhonics}
                disabled={isPlayingTest}
                className="py-2 px-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-2xs transition active:scale-95"
              >
                🔤 ผสมเสียง c-a-t
              </button>

              <button
                type="button"
                onClick={handleTestThaiCoach}
                disabled={isPlayingTest}
                className="py-2 px-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-2xs transition active:scale-95"
              >
                🇹🇭 ครูไทยสอนผสม
              </button>
            </div>

            {/* Quick 5 Short Vowels Test Bar */}
            <div className="pt-2 border-t border-amber-200/80">
              <div className="text-[11px] font-bold text-amber-950 mb-1.5 flex items-center justify-between">
                <span>🎯 ทดสอบเสียงสระเสียงสั้น 5 ตัว (กดฟังเสียงเดี่ยว):</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">
                  เสียง i = "อิ"
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleTestVowel('a', 'แอ')}
                  disabled={isPlayingTest}
                  className="py-2 px-1 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 font-bubble text-xs font-bold transition active:scale-95 flex flex-col items-center"
                >
                  <span className="text-sm">A</span>
                  <span className="text-[10px] font-thai font-bold">แอ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestVowel('e', 'เอะ')}
                  disabled={isPlayingTest}
                  className="py-2 px-1 rounded-xl bg-white hover:bg-amber-50 border border-amber-200 text-amber-700 font-bubble text-xs font-bold transition active:scale-95 flex flex-col items-center"
                >
                  <span className="text-sm">E</span>
                  <span className="text-[10px] font-thai font-bold">เอะ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestVowel('i', 'อิ')}
                  disabled={isPlayingTest}
                  className="py-2 px-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-emerald-400 font-bubble text-xs font-bold transition active:scale-95 flex flex-col items-center shadow-sm ring-2 ring-emerald-200"
                  title="ทดสอบเสียงสระ i (ออกเสียงเป็น 'อิ')"
                >
                  <span className="text-sm flex items-center gap-0.5">I ⭐</span>
                  <span className="text-[10px] font-thai font-bold">อิ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestVowel('o', 'ออ')}
                  disabled={isPlayingTest}
                  className="py-2 px-1 rounded-xl bg-white hover:bg-sky-50 border border-sky-200 text-sky-700 font-bubble text-xs font-bold transition active:scale-95 flex flex-col items-center"
                >
                  <span className="text-sm">O</span>
                  <span className="text-[10px] font-thai font-bold">ออ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestVowel('u', 'อะ')}
                  disabled={isPlayingTest}
                  className="py-2 px-1 rounded-xl bg-white hover:bg-purple-50 border border-purple-200 text-purple-700 font-bubble text-xs font-bold transition active:scale-95 flex flex-col items-center"
                >
                  <span className="text-sm">U</span>
                  <span className="text-[10px] font-thai font-bold">อะ</span>
                </button>
              </div>
            </div>

            {/* Quick 5 Long Vowels Test Bar */}
            <div className="pt-2 border-t border-amber-200/80">
              <div className="text-[11px] font-bold text-amber-950 mb-1.5 flex items-center justify-between">
                <span>🌟 ทดสอบเสียงสระเสียงยาว 5 ตัว:</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.2 rounded-full font-bold">
                  Long Vowels
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleTestVowel('long-a', 'เอ')}
                  disabled={isPlayingTest}
                  className="py-2 px-1 rounded-xl bg-white hover:bg-amber-50 border border-amber-300 text-amber-800 font-bubble text-xs font-bold transition active:scale-95 flex flex-col items-center"
                >
                  <span className="text-xs">Long A</span>
                  <span className="text-[10px] font-thai font-bold">เอ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestVowel('long-e', 'อี')}
                  disabled={isPlayingTest}
                  className="py-2 px-1 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 font-bubble text-xs font-bold transition active:scale-95 flex flex-col items-center"
                >
                  <span className="text-xs">Long E</span>
                  <span className="text-[10px] font-thai font-bold">อี</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestVowel('long-i', 'ไอ')}
                  disabled={isPlayingTest}
                  className="py-2 px-1 rounded-xl bg-white hover:bg-cyan-50 border border-cyan-300 text-cyan-800 font-bubble text-xs font-bold transition active:scale-95 flex flex-col items-center"
                >
                  <span className="text-xs">Long I</span>
                  <span className="text-[10px] font-thai font-bold">ไอ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestVowel('long-o', 'โอ')}
                  disabled={isPlayingTest}
                  className="py-2 px-1 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-300 text-indigo-800 font-bubble text-xs font-bold transition active:scale-95 flex flex-col items-center"
                >
                  <span className="text-xs">Long O</span>
                  <span className="text-[10px] font-thai font-bold">โอ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestVowel('long-u', 'ยู')}
                  disabled={isPlayingTest}
                  className="py-2 px-1 rounded-xl bg-white hover:bg-fuchsia-50 border border-fuchsia-300 text-fuchsia-800 font-bubble text-xs font-bold transition active:scale-95 flex flex-col items-center"
                >
                  <span className="text-xs">Long U</span>
                  <span className="text-[10px] font-thai font-bold">ยู/อู</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>ระบบเสียงออนไลน์พร้อมใช้งาน</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition"
          >
            บันทึกและปิด
          </button>
        </div>
      </div>
    </div>
  );
};
