import React, { useState, useRef, useEffect } from 'react';
import { ActiveTab, UserStats } from '../types/phonics';
import { StudentProfile } from '../types/student';
import {
  Sparkles,
  Star,
  Award,
  Volume2,
  Turtle,
  Rabbit,
  BookOpen,
  Puzzle,
  HelpCircle,
  Mic,
  Grid,
  Shuffle,
  Printer,
  User,
  FileSpreadsheet,
  ChevronUp,
  ChevronDown,
  Menu,
  PenTool,
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  stats: UserStats;
  student: StudentProfile | null;
  onOpenBadges: () => void;
  onOpenAudioSettings: () => void;
  onOpenPhonicsChart: () => void;
  onOpenPrintCenter?: () => void;
  onOpenSecondaryWorksheet?: () => void;
  onToggleSpeed: () => void;
  onOpenStudentLogin: () => void;
  onOpenScoreDashboard: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  stats,
  student,
  onOpenBadges,
  onOpenAudioSettings,
  onOpenPhonicsChart,
  onOpenPrintCenter,
  onOpenSecondaryWorksheet,
  onToggleSpeed,
  onOpenStudentLogin,
  onOpenScoreDashboard,
  isCollapsed,
  onToggleCollapse,
}) => {
  const isSlow = stats.speedRate < 0.8;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const navItems = [
    {
      id: 'learn' as ActiveTab,
      label: 'หน้าแรก (เรียนรู้สระ)',
      icon: BookOpen,
      badge: '395 คำ',
      color: 'text-amber-600',
    },
    {
      id: 'quiz' as ActiveTab,
      label: 'ทดสอบฟังเสียง',
      icon: Volume2,
      color: 'text-emerald-600',
      badge: 'บันทึกชีต',
    },
    {
      id: 'spell-game' as ActiveTab,
      label: 'เกมสะกดคำ',
      icon: Puzzle,
      color: 'text-purple-600',
    },
    {
      id: 'missing-vowel' as ActiveTab,
      label: 'เติมสระที่หาย',
      icon: HelpCircle,
      color: 'text-rose-600',
    },
    {
      id: 'blender' as ActiveTab,
      label: 'เครื่องผสมเสียง',
      icon: Shuffle,
      color: 'text-indigo-600',
    },
    {
      id: 'voice-lab' as ActiveTab,
      label: 'ห้องฝึกออกเสียง',
      icon: Mic,
      color: 'text-sky-600',
    },
    {
      id: 'library' as ActiveTab,
      label: 'คลังศัพท์ ม.1-6 & พิมพ์สื่อ',
      icon: Grid,
      color: 'text-teal-600',
      badge: '1,000+ คำ',
    },
  ];

  const activeNavItem = navItems.find(
    (item) => item.id === activeTab || (item.id === 'learn' && activeTab === 'home')
  ) || navItems[0];
  const ActiveIcon = activeNavItem.icon;

  // COLLAPSED VIEW (Minimal single slim bar, ~42px, maximizes game & question space)
  if (isCollapsed) {
    return (
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-amber-200/90 shadow-sm transition-all duration-200">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-2">
          {/* Left: Mini Brand + Current Tab Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('learn')}
              className="flex items-center gap-1.5 cursor-pointer hover:opacity-85 transition select-none shrink-0"
              title="ไปหน้าแรก (เรียนรู้สระ)"
            >
              <span className="text-xl sm:text-2xl">🦁</span>
              <span className="font-bubble font-black text-amber-600 text-sm hidden md:inline">
                Smart Sarai
              </span>
            </button>

            <div className="h-4 w-px bg-amber-200 hidden sm:block shrink-0" />

            {/* Active Tab Dropdown Trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-100/90 hover:bg-amber-200 text-amber-900 border border-amber-300/80 text-xs font-black transition cursor-pointer shadow-2xs active:scale-95"
                title="คลิกเพื่อสลับเมนู หรือขยายแถบเมนูด้านบน"
              >
                <ActiveIcon className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="max-w-[110px] sm:max-w-[170px] truncate">{activeNavItem.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-amber-700 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu when clicked in compact mode */}
              {isDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-2xl shadow-xl border-2 border-amber-200 p-1.5 z-50 animate-fadeIn">
                  <div className="text-[10px] font-extrabold text-slate-400 px-2.5 py-1 uppercase tracking-wider">
                    สลับเมนูเรียนรู้ & เกม
                  </div>
                  <div className="space-y-0.5 max-h-[70vh] overflow-y-auto">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        activeTab === item.id || (item.id === 'learn' && activeTab === 'home');
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                            isActive
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'hover:bg-amber-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                isActive ? 'bg-amber-700 text-amber-100' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Quick Tools + Expand Button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Worksheet Shortcut */}
            {onOpenSecondaryWorksheet && (
              <button
                type="button"
                onClick={onOpenSecondaryWorksheet}
                title="สร้างและพิมพ์ใบงานฝึกคัดคำศัพท์ ม.1 - ม.6 (เส้นประ 4 เส้นมาตรฐาน A4)"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black text-xs shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5 text-white shrink-0" />
                <span className="text-[11px] font-bold hidden sm:inline">ใบงานคัด ม.1-6</span>
              </button>
            )}

            {/* Quick Speed */}
            <button
              type="button"
              onClick={onToggleSpeed}
              title={`ความเร็วเสียง: ${isSlow ? 'ช้า (0.7x)' : 'ปกติ (0.85x)'}`}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition cursor-pointer"
            >
              {isSlow ? <Turtle className="w-3.5 h-3.5 text-emerald-600" /> : <Rabbit className="w-3.5 h-3.5 text-amber-600" />}
              <span className="text-[11px] hidden sm:inline">{isSlow ? '0.7x' : '0.85x'}</span>
            </button>

            {/* Badges */}
            <button
              type="button"
              onClick={onOpenBadges}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs transition cursor-pointer"
              title="เหรียญรางวัล"
            >
              <Award className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[11px] hidden sm:inline">({stats.badges.length})</span>
            </button>

            {/* Stars */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-white font-black text-xs shadow-2xs">
              <Star className="w-3.5 h-3.5 fill-white" />
              <span>{stats.stars}</span>
            </div>

            {/* Student Profile / Login */}
            {student ? (
              <button
                type="button"
                onClick={onOpenScoreDashboard}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition cursor-pointer"
                title="ดูสมุดพกคะแนน"
              >
                <span>{student.avatar}</span>
                <span className="max-w-[70px] truncate hidden sm:inline">{student.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenStudentLogin}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
                title="ลงชื่อเข้าเรียน"
              >
                <User className="w-3 h-3" />
                <span className="hidden sm:inline">ลงชื่อ</span>
              </button>
            )}

            {/* EXPAND BUTTON */}
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs transition active:scale-95 cursor-pointer ml-0.5"
              title="ขยายแถบเมนูด้านบนเต็มรูปแบบ"
            >
              <ChevronDown className="w-4 h-4" />
              <span className="hidden sm:inline">ขยายเมนู</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  // EXPANDED VIEW (Standard full 2-row navbar with prominent "ยุบเมนู" toggle button)
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-amber-200/90 shadow-sm transition-all duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 space-y-2.5">
        {/* ROW 1: Branding Logo, Student Status & Utility Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo & School Branding */}
          <div
            onClick={() => setActiveTab('learn')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none transition-transform hover:scale-[1.01]"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-rose-400 flex items-center justify-center shadow-md shadow-amber-300/50 group-hover:rotate-3 transition-transform text-2xl shrink-0">
              🦁
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-bubble text-xl sm:text-2xl font-black tracking-tight text-amber-600">
                  Smart Sarai English
                </span>
                <span className="bg-amber-100 text-amber-800 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                  สระ & คำศัพท์ ม.1-6 (1,400+ คำ)
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate max-w-[280px] sm:max-w-md">
                สมาร์ท สาหร่าย อิงลิช – เด็กสาหร่ายยุคใหม่ เก่งอังกฤษแบบสมาร์ท
              </p>
            </div>
          </div>

          {/* Right Action Tools: Utility buttons + Student Profile Card */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">

            {/* Secondary Tracing Worksheet Direct Action */}
            {onOpenSecondaryWorksheet && (
              <button
                type="button"
                onClick={onOpenSecondaryWorksheet}
                title="สร้างและพิมพ์ใบงานฝึกคัดคำศัพท์ ม.1 - ม.6 (แบบเส้นประ 4 เส้นมาตรฐาน A4 พร้อมบริบทและคำแปล)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black text-xs shadow-sm shadow-amber-300/40 transition active:scale-95 cursor-pointer ring-1 ring-amber-300"
              >
                <PenTool className="w-3.5 h-3.5 text-white shrink-0" />
                <span className="hidden xl:inline">📝 ใบงานฝึกคัด ม.1-6</span>
                <span className="xl:hidden">📝 ใบงานคัด</span>
              </button>
            )}

            {/* A-Z Phonics Chart */}
            <button
              type="button"
              onClick={onOpenPhonicsChart}
              title="ดูตารางเสียงโฟนิกส์ A-Z 26 ตัวอักษร"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs border border-rose-200 transition shadow-2xs active:scale-95 cursor-pointer"
            >
              <span>🔤</span>
              <span className="hidden md:inline">ตารางเสียง A-Z</span>
              <span className="md:hidden">A-Z</span>
            </button>

            {/* Audio Speed Toggle (Turtle / Rabbit) */}
            <button
              type="button"
              onClick={onToggleSpeed}
              title={`ความเร็วเสียง: ${isSlow ? 'ช้า (เต่า 🐢 0.7x)' : 'ปกติ (กระต่าย 🐇 0.85x)'}`}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition shadow-2xs cursor-pointer"
            >
              {isSlow ? (
                <>
                  <Turtle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-emerald-700 font-bold text-[11px]">0.7x</span>
                </>
              ) : (
                <>
                  <Rabbit className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-amber-700 font-bold text-[11px]">0.85x</span>
                </>
              )}
            </button>

            {/* Audio Settings & Test */}
            <button
              type="button"
              onClick={onOpenAudioSettings}
              title="ตั้งค่าและทดสอบระบบเสียง"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs border border-amber-200 transition shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <Volume2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="hidden xl:inline">ตั้งค่าเสียง</span>
            </button>

            {/* Badges Button */}
            <button
              type="button"
              onClick={onOpenBadges}
              title="เหรียญรางวัลความสำเร็จ"
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-100 to-indigo-100 hover:from-purple-200 hover:to-indigo-200 text-purple-700 border border-purple-200 font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="hidden sm:inline">เหรียญ</span>
              <span>({stats.badges.length})</span>
            </button>

            {/* Stars Count */}
            <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-white font-extrabold text-xs shadow-sm shadow-amber-300/40">
              <Star className="w-3.5 h-3.5 fill-white shrink-0" />
              <span>{stats.stars}</span>
              <span className="text-[10px] opacity-90 hidden sm:inline">⭐</span>
            </div>

            {/* Student Profile / Login Pill */}
            {student ? (
              <button
                type="button"
                onClick={onOpenScoreDashboard}
                title="คลิกเพื่อดูสมุดพกคะแนนและประวัติการเรียน"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-300 font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
              >
                <span className="text-sm select-none">{student.avatar}</span>
                <span className="max-w-[80px] sm:max-w-[120px] truncate">{student.name.split(' ')[0]}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="เชื่อมต่อ Google Sheets"></span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenStudentLogin}
                title="เข้าสู่ระบบ / ลงชื่อผู้เรียนเพื่อบันทึกคะแนนลง Google Sheets"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span>ลงชื่อเข้าเรียน</span>
              </button>
            )}

            {/* COLLAPSE NAVBAR BUTTON (ยุบเมนูเพื่อเพิ่มพื้นที่จอสำหรับโจทย์และเกม) */}
            <button
              type="button"
              onClick={onToggleCollapse}
              title="ยุบแถบเมนูด้านบน เพื่อเพิ่มพื้นที่หน้าจอสำหรับเล่นเกมและทำโจทย์ ไม่ต้องเลื่อนจอขึ้นลง"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300/80 font-black text-xs shadow-xs transition active:scale-95 cursor-pointer ml-1"
            >
              <ChevronUp className="w-4 h-4 text-amber-700 shrink-0" />
              <span>ยุบเมนู</span>
              <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-md font-extrabold hidden sm:inline">
                เพิ่มพื้นที่จอ
              </span>
            </button>
          </div>
        </div>

        {/* ROW 2: Complete, Flexible Navigation Tabs (Wraps cleanly, ALL visible, no cutoff) */}
        <nav
          aria-label="เมนูหลัก"
          className="flex flex-wrap items-center justify-start gap-1.5 sm:gap-2 pt-1 border-t border-amber-100/80"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === 'learn' && (activeTab === 'home' || activeTab === 'learn'));

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 select-none cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-400/40 scale-[1.02] ring-2 ring-amber-300'
                    : 'bg-amber-50/80 hover:bg-amber-100/90 text-slate-700 hover:text-amber-900 border border-amber-200/60 shadow-2xs hover:shadow-xs active:scale-95'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                    isActive ? 'text-white' : item.color || 'text-slate-600'
                  }`}
                />
                <span className="whitespace-nowrap">{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                      isActive ? 'bg-amber-700/80 text-amber-100' : 'bg-amber-200/80 text-amber-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
