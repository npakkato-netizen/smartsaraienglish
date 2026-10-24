import React, { useState, useEffect } from 'react';
import { StudentProfile, STUDENT_GRADE_OPTIONS, AVATAR_OPTIONS } from '../types/student';
import {
  saveCurrentStudent,
  clearCurrentStudent,
  notifyStudentLogin,
  getSavedStudents,
  removeSavedStudent,
  getScoreHistory,
  sendToGoogleAppsScript,
  GAS_ENDPOINT_URL,
} from '../services/gasService';
import { ActiveTab } from '../types/phonics';
import { playCorrectSound, unlockAudio } from '../utils/audioUtils';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  LogOut,
  BookOpen,
  RefreshCw,
  Trash2,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  ArrowRight,
} from 'lucide-react';

interface LoginPageProps {
  currentStudent: StudentProfile | null;
  onStudentChanged: (student: StudentProfile | null) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenScoreDashboard: () => void;
  onOpenPrintCenter?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentStudent,
  onStudentChanged,
  onNavigateTab,
  onOpenScoreDashboard,
}) => {
  // Form fields
  const [name, setName] = useState<string>(currentStudent?.name || '');
  const [grade, setGrade] = useState<string>(currentStudent?.grade || 'มัธยมศึกษาปีที่ 1 (ม.1)');
  const [room, setRoom] = useState<string>(currentStudent?.room || '1');
  const [number, setNumber] = useState<string>(currentStudent?.number || '1');
  const [studentId, setStudentId] = useState<string>(currentStudent?.studentId || '');
  const [school, setSchool] = useState<string>(currentStudent?.school || '');
  const [avatar, setAvatar] = useState<string>(currentStudent?.avatar || '🦁');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Teacher GAS ping test state
  const [isTestingGas, setIsTestingGas] = useState<boolean>(false);
  const [gasTestResult, setGasTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    durationMs?: number;
  }>({ status: 'idle', message: '' });

  const [savedList, setSavedList] = useState<StudentProfile[]>(() => getSavedStudents());

  // Sync state if currentStudent changes
  useEffect(() => {
    if (currentStudent) {
      setName(currentStudent.name);
      setGrade(currentStudent.grade);
      setRoom(currentStudent.room);
      setNumber(currentStudent.number);
      setStudentId(currentStudent.studentId);
      setSchool(currentStudent.school || '');
      setAvatar(currentStudent.avatar);
    }
  }, [currentStudent]);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    unlockAudio();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('กรุณากรอกชื่อ-นามสกุล ของนักเรียน');
      return;
    }

    setIsSubmitting(true);
    const now = new Date().toISOString();
    const finalStudentId = studentId.trim() || `STU-${Date.now().toString().slice(-4)}`;
    const derivedNickname = name.trim().split(' ')[0] || name.trim();

    const profile: StudentProfile = {
      studentId: finalStudentId,
      name: name.trim(),
      nickname: derivedNickname,
      grade,
      room: room.trim() || '1',
      number: number.trim() || '1',
      school: school.trim() || undefined,
      avatar,
      createdAt: currentStudent?.createdAt || now,
      lastActive: now,
    };

    saveCurrentStudent(profile);
    setSavedList(getSavedStudents());
    onStudentChanged(profile);

    // Notify GAS in background
    notifyStudentLogin(profile).catch((err) => console.log('Login notify err:', err));

    playCorrectSound();
    confetti({
      particleCount: 75,
      spread: 75,
      origin: { y: 0.6 },
    });

    setSuccessMessage(`ลงชื่อเข้าใช้สำเร็จ! ยินดีต้อนรับ ${profile.name}`);
    setIsSubmitting(false);

    // After 1s, smoothly navigate to the lessons
    setTimeout(() => {
      onNavigateTab('learn');
    }, 1000);
  };

  const handleQuickSignIn = (student: StudentProfile) => {
    unlockAudio();
    saveCurrentStudent(student);
    setSavedList(getSavedStudents());
    onStudentChanged(student);
    notifyStudentLogin(student).catch((err) => console.log('Quick login notify err:', err));
    playCorrectSound();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    setSuccessMessage(`ลงชื่อเข้าใช้สำเร็จ! ยินดีต้อนรับ น้อง${student.nickname}`);
    setTimeout(() => {
      onNavigateTab('learn');
    }, 800);
  };

  const handleLogout = () => {
    clearCurrentStudent();
    onStudentChanged(null);
    setName('');
    setStudentId('');
    setSuccessMessage(null);
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('ต้องการลบข้อมูลนักเรียนคนนี้ออกจากเครื่องหรือไม่?')) {
      removeSavedStudent(id);
      setSavedList(getSavedStudents());
      if (currentStudent?.studentId === id) {
        clearCurrentStudent();
        onStudentChanged(null);
      }
    }
  };

  const handleTestGasConnection = async () => {
    setIsTestingGas(true);
    setGasTestResult({ status: 'idle', message: 'กำลังทดสอบเชื่อมต่อ Google Apps Script...' });
    const startTime = performance.now();

    try {
      const res = await sendToGoogleAppsScript({
        action: 'testConnection',
        pingTime: new Date().toISOString(),
        testBy: currentStudent ? `${currentStudent.name} (${currentStudent.nickname})` : 'Teacher / Guest',
      });

      const elapsed = Math.round(performance.now() - startTime);

      if (res.success) {
        setGasTestResult({
          status: 'success',
          message: 'เชื่อมต่อสำเร็จ! Google Apps Script ตอบกลับปกติ',
          durationMs: elapsed,
        });
        playCorrectSound();
      } else {
        setGasTestResult({
          status: 'error',
          message: `เชื่อมต่อไม่สำเร็จ: ${res.error}`,
          durationMs: elapsed,
        });
      }
    } catch (err: any) {
      setGasTestResult({
        status: 'error',
        message: `ข้อผิดพลาด: ${err.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้'}`,
      });
    } finally {
      setIsTestingGas(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* App Entrance Branding Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-400 to-rose-400 shadow-xl shadow-orange-300/50 text-4xl select-none animate-bounce">
          🦁
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-black border border-amber-300/80 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Smart Sarai English • เด็กสาหร่ายยุคใหม่ เก่งอังกฤษแบบสมาร์ท</span>
          </div>
          <h1 className="font-bubble text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">
            Smart Sarai English
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-md mx-auto font-medium">
            สมาร์ท สาหร่าย อิงลิช – เด็กสาหร่ายยุคใหม่ เก่งอังกฤษแบบสมาร์ท (กรอกข้อมูลเพื่อเริ่มเรียนรู้)
          </p>
        </div>

        {/* GAS Sync Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>เชื่อมต่อ Google Sheets แล้ว</span>
          <button
            type="button"
            onClick={handleTestGasConnection}
            disabled={isTestingGas}
            className="text-[11px] text-emerald-700 hover:text-emerald-900 underline ml-1 cursor-pointer"
          >
            {isTestingGas ? 'กำลังทดสอบ...' : 'ทดสอบสัญญาณ'}
          </button>
        </div>
      </div>

      {/* GAS Test Result alert banner if tested */}
      {gasTestResult.status !== 'idle' && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold transition ${
            gasTestResult.status === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-300'
              : 'bg-rose-50 text-rose-800 border-2 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {gasTestResult.status === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <ExternalLink className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{gasTestResult.message}</span>
            {gasTestResult.durationMs && (
              <span className="opacity-75">({gasTestResult.durationMs} ms)</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setGasTestResult({ status: 'idle', message: '' })}
            className="font-bold hover:underline cursor-pointer"
          >
            ปิด
          </button>
        </div>
      )}

      {/* ACTIVE STUDENT STATUS (If already logged in) */}
      {currentStudent && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-5 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shadow-inner shrink-0">
              {currentStudent.avatar}
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full mb-0.5">
                <UserCheck className="w-3 h-3" />
                <span>ลงชื่อเข้าใช้อยู่:</span>
              </div>
              <h3 className="font-bubble text-lg font-black">
                {currentStudent.name}
              </h3>
              <p className="text-xs text-emerald-100">
                {currentStudent.grade} • ห้อง {currentStudent.room} เลขที่ {currentStudent.number}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => onNavigateTab('learn')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>เข้าสู่บทเรียนทันที →</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-100 text-xs font-bold transition cursor-pointer"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* QUICK SIGN-IN BAR (If saved students exist on this device) */}
      {savedList.length > 0 && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-amber-200/90 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>หรือ เลือกลงชื่อเข้าใช้ด่วนจากนักเรียนในเครื่องนี้:</span>
            </span>
            <span className="text-slate-400 font-bold">{savedList.length} คน</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {savedList.map((stu) => {
              const isCurrent = currentStudent?.studentId === stu.studentId;
              return (
                <div
                  key={stu.studentId}
                  onClick={() => handleQuickSignIn(stu)}
                  className={`group p-2.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2 text-left ${
                    isCurrent
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-300'
                      : 'border-slate-200 bg-white hover:border-amber-400 hover:bg-amber-50/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                      {stu.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-800 text-xs truncate">
                        {stu.name}
                      </div>
                      <div className="text-[11px] font-bold text-amber-700">
                        {stu.grade} (ห้อง {stu.room} เลขที่ {stu.number})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSaved(stu.studentId, e)}
                      title="ลบออกจากเครื่อง"
                      className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-extrabold text-amber-600 group-hover:translate-x-0.5 transition-transform">
                      เข้าใช้ →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PRIMARY SIGN-IN FORM CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-3 border-amber-300 shadow-xl space-y-6">
        <div className="border-b border-amber-100 pb-3 flex items-center justify-between">
          <h2 className="font-bubble text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
            <span>✍️ กรอกข้อมูลลงชื่อเข้าเรียน</span>
          </h2>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
            บันทึกคะแนนส่งครู
          </span>
        </div>

        {/* Error / Success Feedback */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSignInSubmit} className="space-y-5">
          {/* Avatar Selector */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>1. เลือกสัตว์ประจำตัว (Avatar)</span>
                <span className="text-rose-500">*</span>
              </span>
              <span className="text-amber-600 font-bold normal-case text-xs">
                {avatar}
              </span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVATAR_OPTIONS.map((item) => (
                <button
                  key={item.emoji}
                  type="button"
                  onClick={() => {
                    unlockAudio();
                    setAvatar(item.emoji);
                  }}
                  className={`p-2 rounded-2xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    avatar === item.emoji
                      ? 'bg-amber-100 border-2 border-amber-500 shadow-sm scale-105 ring-2 ring-amber-300'
                      : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span className="text-2xl sm:text-3xl select-none">{item.emoji}</span>
                  <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="space-y-3.5">
            <div className="text-xs font-black uppercase text-slate-700 flex items-center gap-1">
              <span>2. ข้อมูลนักเรียน</span>
              <span className="text-rose-500">*</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Full Name */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span>ชื่อ - นามสกุล นักเรียน</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นายภูผา รักเรียน หรือ น.ส. มายด์ ใจดี"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-400 bg-white"
                />
              </div>

              {/* Grade */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">ระดับชั้นเรียน</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-400 bg-white cursor-pointer"
                >
                  {STUDENT_GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room & Number */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">ห้อง</label>
                  <input
                    type="text"
                    placeholder="1"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-400 bg-white text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">เลขที่</label>
                  <input
                    type="text"
                    placeholder="1"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-400 bg-white text-center"
                  />
                </div>
              </div>

              {/* Student ID */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  รหัสประจำตัว (เว้นว่างได้)
                </label>
                <input
                  type="text"
                  placeholder="เช่น 1001 หรือสร้างอัตโนมัติ"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-400 bg-white"
                />
              </div>

              {/* School */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">ชื่อโรงเรียน (ถ้ามี)</label>
                <input
                  type="text"
                  placeholder="เช่น โรงเรียนเทศบาล 1"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-400 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black text-base shadow-xl shadow-orange-300/40 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5 text-amber-200" />
              <span>
                {isSubmitting
                  ? 'กำลังลงชื่อเข้าใช้งาน...'
                  : '🚀 ลงชื่อเข้าใช้งาน (เข้าสู่ห้องเรียน)'}
              </span>
            </button>
          </div>
        </form>

        {/* Guest Mode Link */}
        <div className="text-center pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onNavigateTab('learn')}
            className="text-xs font-bold text-slate-400 hover:text-amber-700 transition cursor-pointer inline-flex items-center gap-1"
          >
            <span>หรือ ข้ามไปทดลองเรียนแบบไม่ลงชื่อเข้าใช้ (Guest)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
