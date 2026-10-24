import React, { useState } from 'react';
import { StudentProfile, STUDENT_GRADE_OPTIONS, AVATAR_OPTIONS } from '../types/student';
import { saveCurrentStudent, notifyStudentLogin, getSavedStudents, removeSavedStudent } from '../services/gasService';
import { playCorrectSound, unlockAudio } from '../utils/audioUtils';
import confetti from 'canvas-confetti';
import {
  User,
  X,
  Sparkles,
  School,
  CheckCircle2,
  Trash2,
  Clock,
  LogIn,
  AlertCircle,
  FileSpreadsheet,
  Smile,
  ShieldCheck,
} from 'lucide-react';

interface StudentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudent: StudentProfile | null;
  onStudentChanged: (student: StudentProfile | null) => void;
  titlePrompt?: string; // Optional message like "ลงชื่อเพื่อบันทึกคะแนนแบบทดสอบ"
}

export const StudentLoginModal: React.FC<StudentLoginModalProps> = ({
  isOpen,
  onClose,
  currentStudent,
  onStudentChanged,
  titlePrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'saved'>('form');
  const [studentId, setStudentId] = useState<string>(currentStudent?.studentId || '');
  const [name, setName] = useState<string>(currentStudent?.name || '');
  const [grade, setGrade] = useState<string>(currentStudent?.grade || 'มัธยมศึกษาปีที่ 1 (ม.1)');
  const [room, setRoom] = useState<string>(currentStudent?.room || '1');
  const [number, setNumber] = useState<string>(currentStudent?.number || '1');
  const [school, setSchool] = useState<string>(currentStudent?.school || '');
  const [avatar, setAvatar] = useState<string>(currentStudent?.avatar || '🦁');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const savedStudents = getSavedStudents();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    unlockAudio();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุลของนักเรียน');
      return;
    }

    setIsSubmitting(true);

    const now = new Date().toISOString();
    const derivedNickname = name.trim().split(' ')[0] || name.trim();
    const profile: StudentProfile = {
      studentId: studentId.trim() || `STU-${Date.now().toString().slice(-4)}`,
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
    onStudentChanged(profile);

    // Notify GAS in background
    notifyStudentLogin(profile).catch((err) => console.log('Login notify error:', err));

    playCorrectSound();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    setIsSubmitting(false);
    onClose();
  };

  const handleSelectSaved = (student: StudentProfile) => {
    unlockAudio();
    const updated = { ...student, lastActive: new Date().toISOString() };
    saveCurrentStudent(updated);
    onStudentChanged(updated);
    playCorrectSound();
    onClose();
  };

  const handleRemoveSaved = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeSavedStudent(id);
    if (currentStudent?.studentId === id) {
      onStudentChanged(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border-2 border-amber-200 overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-3xl shadow-inner select-none">
              {avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bubble text-xl sm:text-2xl font-black drop-shadow-xs">
                  ลงชื่อเข้าสู่ระบบนักเรียน
                </h3>
                <span className="bg-white/25 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <FileSpreadsheet className="w-3 h-3" />
                  Google Sheets
                </span>
              </div>
              <p className="text-xs text-amber-50 font-medium">
                {titlePrompt || 'บันทึกคะแนนสะสมและผลการทดสอบส่งตรงให้คุณครู'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers if saved students exist */}
        {savedStudents.length > 0 && (
          <div className="flex border-b border-amber-100 bg-amber-50/50 px-4 pt-2 gap-2">
            <button
              onClick={() => setActiveTab('form')}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'form'
                  ? 'border-amber-600 text-amber-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{currentStudent ? 'แก้ไขข้อมูลนักเรียน' : 'กรอกข้อมูลนักเรียนใหม่'}</span>
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'saved'
                  ? 'border-amber-600 text-amber-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>นักเรียนที่เคยบันทึกไว้ ({savedStudents.length})</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'saved' ? (
            /* Saved Students Switcher */
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                แตะเลือกชื่อนักเรียนเพื่อสลับใช้งานหรือเข้าสู่ระบบได้ทันที:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {savedStudents.map((stu) => {
                  const isCurrent = currentStudent?.studentId === stu.studentId;
                  return (
                    <div
                      key={stu.studentId}
                      onClick={() => handleSelectSaved(stu)}
                      className={`p-3.5 rounded-2xl border-2 transition flex items-center justify-between cursor-pointer group ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                          : 'border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-3xl select-none group-hover:scale-110 transition-transform">
                          {stu.avatar}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 text-sm truncate">
                              {stu.nickname}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                                ใช้อยู่
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{stu.name}</p>
                          <p className="text-[11px] text-amber-700 font-semibold">
                            {stu.grade} ห้อง {stu.room} เลขที่ {stu.number}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleRemoveSaved(e, stu.studentId)}
                        title="ลบรายชื่อนี้"
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => {
                    setActiveTab('form');
                    setStudentId('');
                    setName('');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition shadow-xs"
                >
                  + กรอกข้อมูลนักเรียนคนใหม่
                </button>
              </div>
            </div>
          ) : (
            /* Student Input Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Choose Avatar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>เลือกรูปสัตว์ประจำตัว (Avatar)</span>
                  <span className="text-[11px] font-normal text-slate-400">คลิกเพื่อเปลี่ยน</span>
                </label>
                <div className="grid grid-cols-8 gap-2 p-2 bg-amber-50/60 rounded-2xl border border-amber-200/80">
                  {AVATAR_OPTIONS.map((item) => (
                    <button
                      key={item.emoji}
                      type="button"
                      title={item.name}
                      onClick={() => setAvatar(item.emoji)}
                      className={`text-2xl p-1.5 rounded-xl transition flex items-center justify-center ${
                        avatar === item.emoji
                          ? 'bg-amber-400 shadow-md scale-110 ring-2 ring-amber-600'
                          : 'hover:bg-amber-200/50 hover:scale-105'
                      }`}
                    >
                      {item.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 1: Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อ - นามสกุลจริง <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น นายภูผา รักเรียน หรือ น.ส. มายด์ ใจดี"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden text-sm font-medium transition"
                />
              </div>

              {/* Row 2: Student ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รหัสประจำตัวนักเรียน (เว้นว่างได้)
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="เช่น 1001 หรือ 67012"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden text-sm transition"
                />
              </div>

              {/* Row 3: Grade, Room, Number */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-3 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ระดับชั้น <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden text-xs sm:text-sm font-semibold bg-white transition"
                  >
                    {STUDENT_GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ห้อง
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="เช่น 1 หรือ 2"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden text-sm transition text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เลขที่
                  </label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="เช่น 15"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden text-sm transition text-center font-bold"
                  />
                </div>
              </div>

              {/* Row 4: School (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อโรงเรียน (ไม่บังคับ)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="เช่น โรงเรียนอนุบาลเทศบาล หรือ โรงเรียนสาธิต..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden text-xs sm:text-sm transition"
                  />
                  <School className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Google Sheets Link Badge Information */}
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">ระบบบันทึกคะแนนอัตโนมัติ:</span> เมื่อเข้าสู่ระบบแล้ว ทุกครั้งที่ทำแบบทดสอบหรือเล่นเกม ระบบจะส่งคะแนนและดาวสะสมไปยัง Google Sheets ของคุณครูโดยอัตโนมัติ
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100 transition active:scale-95"
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-extrabold text-sm shadow-md shadow-orange-300/40 active:scale-95 transition cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isSubmitting ? 'กำลังบันทึก...' : 'เข้าสู่ระบบ / บันทึกข้อมูล'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
