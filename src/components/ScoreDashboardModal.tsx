import React, { useState } from 'react';
import { StudentProfile, ScoreRecord } from '../types/student';
import { getScoreHistory, syncPendingScores, clearCurrentStudent } from '../services/gasService';
import { playCorrectSound, unlockAudio } from '../utils/audioUtils';
import confetti from 'canvas-confetti';
import {
  X,
  FileSpreadsheet,
  RefreshCw,
  Trophy,
  Star,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  LogOut,
  Edit,
  GraduationCap,
  Calendar,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface ScoreDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile | null;
  onOpenEditProfile: () => void;
  onLogout: () => void;
}

export const ScoreDashboardModal: React.FC<ScoreDashboardModalProps> = ({
  isOpen,
  onClose,
  student,
  onOpenEditProfile,
  onLogout,
}) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [records, setRecords] = useState<ScoreRecord[]>(() => getScoreHistory());

  if (!isOpen) return null;

  // Filter records for this student if student is logged in, or show all
  const studentRecords = student
    ? records.filter((r) => r.studentId === student.studentId || r.studentName === student.name)
    : records;

  const totalCompleted = studentRecords.length;
  const avgPercentage = totalCompleted > 0
    ? Math.round(studentRecords.reduce((acc, curr) => acc + curr.percentage, 0) / totalCompleted)
    : 0;
  const totalStarsWon = studentRecords.reduce((acc, curr) => acc + (curr.starsEarned || 0), 0);
  const pendingCount = studentRecords.filter((r) => !r.synced).length;

  const handleSyncAll = async () => {
    unlockAudio();
    setIsSyncing(true);
    setSyncFeedback(null);

    const res = await syncPendingScores();
    setRecords(getScoreHistory());
    setIsSyncing(false);

    if (res.total === 0) {
      setSyncFeedback('คะแนนทั้งหมดซิงค์ลง Google Sheets เรียบร้อยแล้ว!');
    } else if (res.failed === 0) {
      setSyncFeedback(`ซิงค์ข้อมูลสำเร็จ ${res.succeeded} รายการ 🎉`);
      playCorrectSound();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
    } else {
      setSyncFeedback(`ซิงค์สำเร็จ ${res.succeeded} รายการ, ไม่สำเร็จ ${res.failed} รายการ`);
    }
  };

  const handleLogoutClick = () => {
    clearCurrentStudent();
    onLogout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border-2 border-emerald-200 overflow-hidden my-auto flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-3xl shadow-inner select-none">
              {student ? student.avatar : '📊'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bubble text-xl sm:text-2xl font-black drop-shadow-xs">
                  สมุดพกคะแนน Smart Sarai English
                </h3>
                <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <FileSpreadsheet className="w-3 h-3 text-emerald-200" />
                  เชื่อมต่อ Google Sheets
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                {student ? `ผู้เรียน: ${student.name}` : 'ประวัติคะแนนและการทดสอบ'}
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

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Student Profile Card (if logged in) */}
          {student ? (
            <div className="bg-emerald-50/70 border-2 border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="text-4xl p-2 bg-white rounded-2xl shadow-xs border border-emerald-200">
                  {student.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bubble text-lg font-black text-slate-800">
                      {student.name}
                    </span>
                    <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                      {student.grade}
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                      ห้อง {student.room} / เลขที่ {student.number}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {student.studentId && <span className="text-slate-400">ID: {student.studentId}</span>}
                  </p>
                  {student.school && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{student.school}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={onOpenEditProfile}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-2xs"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-500" />
                  <span>แก้ไขข้อมูล</span>
                </button>

                <button
                  onClick={handleLogoutClick}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>สลับผู้เรียน</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚠️</span>
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">ยังไม่ได้ลงชื่อเข้าสู่ระบบ</h4>
                  <p className="text-xs text-amber-700">ลงชื่อเพื่อผูกคะแนนกับชื่อนักเรียนและส่งข้อมูลขึ้น Google Sheets</p>
                </div>
              </div>

              <button
                onClick={onOpenEditProfile}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition"
              >
                ลงชื่อเข้าเรียนเลย
              </button>
            </div>
          )}

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center">
              <div className="text-xs text-slate-500 font-semibold mb-1">ทำแบบทดสอบ</div>
              <div className="text-2xl font-bubble font-black text-slate-800">{totalCompleted}</div>
              <div className="text-[11px] text-slate-400">ครั้ง</div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-center">
              <div className="text-xs text-emerald-700 font-semibold mb-1">คะแนนเฉลี่ย</div>
              <div className="text-2xl font-bubble font-black text-emerald-600">{avgPercentage}%</div>
              <div className="text-[11px] text-emerald-600">ความแม่นยำ</div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-center">
              <div className="text-xs text-amber-700 font-semibold mb-1">ดาวที่ได้รับ</div>
              <div className="text-2xl font-bubble font-black text-amber-600 flex items-center justify-center gap-1">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                <span>{totalStarsWon}</span>
              </div>
              <div className="text-[11px] text-amber-600">ดวง</div>
            </div>

            <div className={`rounded-2xl p-3.5 text-center border ${
              pendingCount > 0 ? 'bg-amber-50 border-amber-300' : 'bg-teal-50 border-teal-200'
            }`}>
              <div className="text-xs font-semibold mb-1 text-slate-600">สถานะ Sheets</div>
              <div className={`text-sm font-extrabold flex items-center justify-center gap-1 ${
                pendingCount > 0 ? 'text-amber-700' : 'text-teal-700'
              }`}>
                {pendingCount > 0 ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>รอส่ง {pendingCount} รายการ</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>ซิงค์ครบแล้ว</span>
                  </>
                )}
              </div>
              <div className="text-[11px] text-slate-400">Google Apps Script</div>
            </div>
          </div>

          {/* Sync Trigger and Feedback */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3 rounded-2xl">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                ปลายทาง: <b>Google Sheets</b> ของคุณครูผ่าน Web App Script
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncAll}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลขึ้น Google Sheets'}</span>
              </button>
            </div>
          </div>

          {syncFeedback && (
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* Scores History Table */}
          <div className="space-y-3">
            <h4 className="font-bubble text-base font-black text-slate-800 flex items-center gap-2">
              <span>📋 ประวัติคะแนนล่าสุด</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-normal">
                {studentRecords.length} รายการ
              </span>
            </h4>

            {studentRecords.length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Trophy className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium">ยังไม่มีประวัติการบันทึกคะแนน</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  ลองเข้าเล่น "แบบทดสอบฟังเสียง" หรือ "เกมสะกดคำ" เพื่อเริ่มสะสมคะแนน
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-3">วันและเวลา</th>
                      <th className="p-3">กิจกรรม / เกม</th>
                      <th className="p-3 text-center">คะแนน</th>
                      <th className="p-3 text-center">ร้อยละ</th>
                      <th className="p-3 text-center">ดาว</th>
                      <th className="p-3 text-center">สถานะ Sheets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentRecords.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 text-slate-500 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.timestamp}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{item.gameName}</div>
                          {item.details && <div className="text-[11px] text-slate-400">{item.details}</div>}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold font-bubble text-sm">
                            {item.score} / {item.totalScore}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-extrabold ${
                            item.percentage >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.percentage >= 50
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.percentage}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-0.5 font-bold text-amber-600">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            <span>+{item.starsEarned}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {item.synced ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>บันทึกแล้ว</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <AlertCircle className="w-3 h-3 text-amber-500" />
                              <span>รอเชื่อมต่อ</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            URL: <span className="font-mono text-[11px] text-slate-400">script.google.com/.../exec</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
