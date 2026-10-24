import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PhonicsWord, PhonicsVowel } from '../types/phonics';
import { PHONICS_WORDS, ALL_VOWELS, VOWEL_INFO_MAP } from '../data/phonicsData';
import {
  SECONDARY_VOCABULARY,
  SecondaryVocabWord,
  SecondaryGrade,
  VOCAB_TOPICS,
  VocabTopic,
  GRADE_BADGES,
} from '../data/secondaryVocabData';
import { speakText } from '../utils/audioUtils';
import { StudentProfile } from '../types/student';
import { SecondarySpellingGame } from './SecondarySpellingGame';
import {
  Search,
  Volume2,
  Printer,
  Sparkles,
  Filter,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Gamepad2,
  CheckSquare,
  Square,
  X,
  Layers,
  FileSpreadsheet,
  Download,
  ChevronDown,
} from 'lucide-react';
import { PrintTemplate } from './PrintModal';
import {
  exportSecondaryVocabToExcel,
  exportPhonicsVocabToExcel,
} from '../utils/excelExport';

interface WordLibraryProps {
  speedRate: number;
  student?: StudentProfile | null;
  onAddStars?: (amount: number) => void;
  onRequireLogin?: () => void;
  onOpenPrintCenter?: (vowel?: PhonicsVowel | 'all') => void;
  onPrintWord?: (word: PhonicsWord) => void;
  onOpenPrintSecondary?: (params?: {
    grade?: SecondaryGrade | 'all' | 'lower' | 'upper';
    topic?: VocabTopic | 'all';
    words?: SecondaryVocabWord[];
    template?: PrintTemplate;
  }) => void;
  onPrintSecondaryWord?: (word: SecondaryVocabWord) => void;
}

export const WordLibrary: React.FC<WordLibraryProps> = ({
  speedRate,
  student = null,
  onAddStars,
  onRequireLogin,
  onOpenPrintCenter,
  onPrintWord,
  onOpenPrintSecondary,
  onPrintSecondaryWord,
}) => {
  // Main view mode: 'secondary' (ม.1 - ม.6) or 'phonics' (395 คำ)
  const [bankMode, setBankMode] = useState<'secondary' | 'phonics'>('secondary');

  // Secondary sub-view mode: 'browse' (ดูรายการคำศัพท์) or 'spelling' (เกมสะกดคำ)
  const [secondaryViewMode, setSecondaryViewMode] = useState<'browse' | 'spelling'>('browse');
  const [selectedWordForGame, setSelectedWordForGame] = useState<string | undefined>(undefined);

  // Secondary vocabulary filters
  const [selectedGrade, setSelectedGrade] = useState<SecondaryGrade | 'all' | 'lower' | 'upper'>('all');
  const [selectedTopic, setSelectedTopic] = useState<VocabTopic | 'all'>('all');
  const [selectedPos, setSelectedPos] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Multi-selection state for batch printing of secondary words
  const [selectedSecondaryIds, setSelectedSecondaryIds] = useState<Set<string>>(new Set());

  // Excel Export Dropdown & Notification states
  const [showSecondaryExcelMenu, setShowSecondaryExcelMenu] = useState<boolean>(false);
  const [showPhonicsExcelMenu, setShowPhonicsExcelMenu] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string>('');

  // Auto clear export notice after 4 seconds
  useEffect(() => {
    if (exportNotice) {
      const timer = setTimeout(() => setExportNotice(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [exportNotice]);

  // Pagination for Secondary Vocabulary
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(24);
  const secondaryTopRef = useRef<HTMLDivElement>(null);

  // Phonics filters
  const [selectedVowel, setSelectedVowel] = useState<PhonicsVowel | 'all'>('all');
  const [selectedFamily, setSelectedFamily] = useState<string>('all');

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGrade, selectedTopic, selectedPos, searchQuery]);

  // Filtered Secondary words
  const filteredSecondaryWords = useMemo(() => {
    return SECONDARY_VOCABULARY.filter((item) => {
      // Grade / Level filter
      let matchGrade = true;
      if (selectedGrade === 'lower') matchGrade = item.level === 'lower';
      else if (selectedGrade === 'upper') matchGrade = item.level === 'upper';
      else if (selectedGrade !== 'all') matchGrade = item.grade === selectedGrade;

      // Topic filter
      const matchTopic = selectedTopic === 'all' || item.topic === selectedTopic;

      // Part of speech filter
      const matchPos = selectedPos === 'all' || item.pos === selectedPos;

      // Search query
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.word.toLowerCase().includes(q) ||
        item.meaningTh.toLowerCase().includes(q) ||
        item.phoneticTh.toLowerCase().includes(q) ||
        item.sentence.toLowerCase().includes(q) ||
        (item.synonyms && item.synonyms.some((s) => s.toLowerCase().includes(q)));

      return matchGrade && matchTopic && matchPos && matchSearch;
    });
  }, [selectedGrade, selectedTopic, selectedPos, searchQuery]);

  // Total pages and paginated chunk
  const totalPages = Math.max(1, Math.ceil(filteredSecondaryWords.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedSecondaryWords = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredSecondaryWords.slice(start, start + pageSize);
  }, [filteredSecondaryWords, safeCurrentPage, pageSize]);

  const handlePageChange = (newPage: number) => {
    const page = Math.max(1, Math.min(newPage, totalPages));
    setCurrentPage(page);
    if (secondaryTopRef.current) {
      secondaryTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filtered Phonics words
  const filteredPhonicsWords = useMemo(() => {
    return PHONICS_WORDS.filter((item) => {
      const matchVowel = selectedVowel === 'all' || item.vowel === selectedVowel;
      const matchFamily = selectedFamily === 'all' || item.family === selectedFamily;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.word.toLowerCase().includes(q) ||
        item.meaningTh.includes(q) ||
        item.phoneticTh.includes(q);

      return matchVowel && matchFamily && matchSearch;
    });
  }, [selectedVowel, selectedFamily, searchQuery]);

  // Extract unique families for current vowel
  const availableFamilies = useMemo(() => {
    const list =
      selectedVowel === 'all'
        ? PHONICS_WORDS
        : PHONICS_WORDS.filter((w) => w.vowel === selectedVowel);
    const families = Array.from(new Set(list.map((w) => w.family)));
    return families.sort();
  }, [selectedVowel]);

  const handlePrint = () => {
    if (onOpenPrintCenter) {
      onOpenPrintCenter(selectedVowel);
    } else {
      window.print();
    }
  };

  const handleToggleSelectWord = (id: string) => {
    setSelectedSecondaryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllPageSelected = useMemo(() => {
    if (paginatedSecondaryWords.length === 0) return false;
    return paginatedSecondaryWords.every((w) => selectedSecondaryIds.has(w.id));
  }, [paginatedSecondaryWords, selectedSecondaryIds]);

  const handleToggleSelectAllOnPage = () => {
    if (isAllPageSelected) {
      setSelectedSecondaryIds((prev) => {
        const next = new Set(prev);
        paginatedSecondaryWords.forEach((w) => next.delete(w.id));
        return next;
      });
    } else {
      setSelectedSecondaryIds((prev) => {
        const next = new Set(prev);
        paginatedSecondaryWords.forEach((w) => next.add(w.id));
        return next;
      });
    }
  };

  const handleSelectAllFiltered = () => {
    setSelectedSecondaryIds((prev) => {
      const next = new Set(prev);
      filteredSecondaryWords.forEach((w) => next.add(w.id));
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedSecondaryIds(new Set());
  };

  const handlePrintSecondary = (wordsOverride?: SecondaryVocabWord[], template?: PrintTemplate) => {
    const wordsToPrint =
      wordsOverride ||
      (selectedSecondaryIds.size > 0
        ? SECONDARY_VOCABULARY.filter((w) => selectedSecondaryIds.has(w.id))
        : filteredSecondaryWords);

    if (onOpenPrintSecondary) {
      onOpenPrintSecondary({
        grade: selectedGrade,
        topic: selectedTopic,
        words: wordsToPrint,
        template,
      });
    } else {
      window.print();
    }
  };

  const handlePrintSingleSecondaryWord = (word: SecondaryVocabWord) => {
    if (onPrintSecondaryWord) {
      onPrintSecondaryWord(word);
    } else if (onOpenPrintSecondary) {
      onOpenPrintSecondary({
        words: [word],
        grade: word.grade,
        topic: word.topic,
      });
    } else {
      window.print();
    }
  };

  const handleLaunchSpellingGame = (wordId?: string) => {
    setSelectedWordForGame(wordId);
    setSecondaryViewMode('spelling');
  };

  // -------------------------------------------------------------
  // Excel Export Handlers
  // -------------------------------------------------------------
  const handleExportFilteredSecondary = () => {
    try {
      setShowSecondaryExcelMenu(false);
      const gradeLabel =
        selectedGrade === 'all'
          ? 'ม1-ม6'
          : selectedGrade === 'lower'
          ? 'ม.ต้น'
          : selectedGrade === 'upper'
          ? 'ม.ปลาย'
          : selectedGrade;
      const dateStr = new Date().toISOString().slice(0, 10);
      exportSecondaryVocabToExcel(filteredSecondaryWords, {
        filename: `ตารางคำศัพท์ภาษาอังกฤษ_${gradeLabel}_${dateStr}.xlsx`,
        gradeFilter: selectedGrade,
        topicFilter: selectedTopic,
        groupByGradeSheets: false,
      });
      setExportNotice(`ดาวน์โหลดตารางคำศัพท์ ${gradeLabel} (${filteredSecondaryWords.length.toLocaleString()} คำ) เป็นไฟล์ Excel เรียบร้อยแล้ว 📊✨`);
    } catch (err) {
      console.error('Export error:', err);
      setExportNotice('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleExportAllSecondaryMultiSheet = () => {
    try {
      setShowSecondaryExcelMenu(false);
      const dateStr = new Date().toISOString().slice(0, 10);
      exportSecondaryVocabToExcel(SECONDARY_VOCABULARY, {
        filename: `ตารางคำศัพท์ภาษาอังกฤษ_ม1-ม6_แยกชีตตามระดับชั้น_${dateStr}.xlsx`,
        groupByGradeSheets: true,
      });
      setExportNotice(`ดาวน์โหลดคลังคำศัพท์หลักสูตร ม.1 - ม.6 ทั้งหมด (${SECONDARY_VOCABULARY.length.toLocaleString()} คำ) แยกชีต ม.1 ถึง ม.6 เรียบร้อยแล้ว 📊✨`);
    } catch (err) {
      console.error('Export error:', err);
      setExportNotice('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleExportSelectedSecondary = () => {
    try {
      const selectedWords = SECONDARY_VOCABULARY.filter((w) => selectedSecondaryIds.has(w.id));
      if (selectedWords.length === 0) return;
      const dateStr = new Date().toISOString().slice(0, 10);
      exportSecondaryVocabToExcel(selectedWords, {
        filename: `ตารางคำศัพท์ที่เลือก_${selectedWords.length}_คำ_${dateStr}.xlsx`,
        groupByGradeSheets: false,
      });
      setExportNotice(`ดาวน์โหลดคำศัพท์ที่เลือก ${selectedWords.length} คำเป็นไฟล์ Excel เรียบร้อยแล้ว 📊✨`);
    } catch (err) {
      console.error('Export error:', err);
      setExportNotice('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel');
    }
  };

  const handleExportFilteredPhonics = () => {
    try {
      setShowPhonicsExcelMenu(false);
      const dateStr = new Date().toISOString().slice(0, 10);
      const vowelLabel = selectedVowel === 'all' ? 'สระทั้งหมด' : `สระ_${selectedVowel}`;
      exportPhonicsVocabToExcel(filteredPhonicsWords, {
        filename: `ตารางคำศัพท์โฟนิกส์_${vowelLabel}_${dateStr}.xlsx`,
        groupByCategorySheets: false,
      });
      setExportNotice(`ดาวน์โหลดตารางคำศัพท์โฟนิกส์ (${filteredPhonicsWords.length} คำ) เป็นไฟล์ Excel เรียบร้อยแล้ว 📊✨`);
    } catch (err) {
      console.error('Export error:', err);
      setExportNotice('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel');
    }
  };

  const handleExportAllPhonicsMultiSheet = () => {
    try {
      setShowPhonicsExcelMenu(false);
      const dateStr = new Date().toISOString().slice(0, 10);
      exportPhonicsVocabToExcel(PHONICS_WORDS, {
        filename: `ตารางคำศัพท์โฟนิกส์_395คำ_แยกชีตสระสั้น-ยาว-ประสม_${dateStr}.xlsx`,
        groupByCategorySheets: true,
      });
      setExportNotice(`ดาวน์โหลดคำศัพท์โฟนิกส์ทั้งหมด (${PHONICS_WORDS.length} คำ) แยกชีตตามประเภทสระเรียบร้อยแล้ว 📊✨`);
    } catch (err) {
      console.error('Export error:', err);
      setExportNotice('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel');
    }
  };

  // Pagination buttons generator
  const paginationRange = useMemo(() => {
    const delta = 2;
    const range: (number | string)[] = [];
    const left = Math.max(2, safeCurrentPage - delta);
    const right = Math.min(totalPages - 1, safeCurrentPage + delta);

    range.push(1);
    if (left > 2) {
      range.push('...');
    }
    for (let i = left; i <= right; i++) {
      range.push(i);
    }
    if (right < totalPages - 1) {
      range.push('...');
    }
    if (totalPages > 1) {
      range.push(totalPages);
    }
    return range;
  }, [safeCurrentPage, totalPages]);

  return (
    <div className="space-y-6 animate-fade-in" ref={secondaryTopRef}>
      {/* Top Main Mode Switcher */}
      <div className="print:hidden bg-white rounded-3xl p-4 sm:p-5 shadow-sm border-2 border-amber-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl select-none">📚</span>
            <h2 className="text-xl sm:text-2xl font-bubble font-black text-amber-700">
              คลังคำศัพท์มาตรฐานภาษาอังกฤษ
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            สอดคล้องกับหลักสูตรแกนกลางขั้นพื้นฐาน ม.1 - ม.6 (รวมกว่า 1,100+ คำ) และสระโฟนิกส์ 395 คำ
          </p>
        </div>

        {/* Tab switch between Secondary & Phonics */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setBankMode('secondary');
              setSearchQuery('');
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
              bankMode === 'secondary'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>คำศัพท์ ม.1 - ม.6</span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
              {SECONDARY_VOCABULARY.length.toLocaleString()} คำ
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setBankMode('phonics');
              setSecondaryViewMode('browse');
              setSearchQuery('');
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
              bankMode === 'phonics'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>สระโฟนิกส์พื้นฐาน</span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
              {PHONICS_WORDS.length} คำ
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECONDARY VOCABULARY BANK (ม.1 - ม.6 หลักสูตรแกนกลาง สพฐ.) */}
      {/* ============================================================== */}
      {bankMode === 'secondary' && (
        <div className="space-y-5">
          {/* If Spelling Game mode is active */}
          {secondaryViewMode === 'spelling' ? (
            <SecondarySpellingGame
              initialGrade={selectedGrade}
              initialWordId={selectedWordForGame}
              speedRate={speedRate}
              student={student}
              onAddStars={onAddStars}
              onRequireLogin={onRequireLogin}
              onBackToLibrary={() => {
                setSecondaryViewMode('browse');
                setSelectedWordForGame(undefined);
              }}
            />
          ) : (
            <>
              {/* Secondary Header Action Ribbon: Browse vs Game Launcher */}
              <div className="print:hidden bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shrink-0 shadow-inner">
                    🎮
                  </div>
                  <div>
                    <h3 className="font-bubble text-lg sm:text-xl font-black tracking-wide">
                      เกมสะกดคำศัพท์ตามระดับชั้น ม.1 - ม.6
                    </h3>
                    <p className="text-xs sm:text-sm text-white/90">
                      ฝึกจำศัพท์ผ่านเกมสะกดคำ แตะฟองสบู่หรือพิมพ์ตัวอักษร สะสมคะแนนและดาวความสำเร็จ!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleLaunchSpellingGame()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white text-orange-600 hover:bg-orange-50 font-black text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 shrink-0"
                >
                  <Gamepad2 className="w-4 h-4 text-orange-500" />
                  <span>เริ่มเล่นเกมสะกดคำศัพท์</span>
                </button>
              </div>

              {/* Filter Bar */}
              <div className="print:hidden bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-3.5">
                {/* Search Input, Topic, POS & Print Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาคำศัพท์ภาษาอังกฤษ, คำแปลไทย, IPA หรือคำเหมือน (เช่น achieve, วิเคราะห์, ภูมิอากาศ)..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white transition"
                    />
                  </div>

                  {/* Topic Selector */}
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                    <select
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value as any)}
                      className="px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-400 cursor-pointer"
                    >
                      <option value="all">ทุกหมวดสาระการเรียนรู้</option>
                      {VOCAB_TOPICS.map((top) => (
                        <option key={top} value={top}>
                          หมวด: {top}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Part of Speech Filter */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedPos}
                      onChange={(e) => setSelectedPos(e.target.value)}
                      className="px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-400 cursor-pointer"
                    >
                      <option value="all">ทุกชนิดคำ (POS)</option>
                      <option value="n.">คำนาม (n.)</option>
                      <option value="v.">คำกริยา (v.)</option>
                      <option value="adj.">คำคุณศัพท์ (adj.)</option>
                      <option value="adv.">คำกริยาวิเศษณ์ (adv.)</option>
                    </select>
                  </div>

                  {/* Excel Export Button & Dropdown */}
                  <div className="relative shrink-0">
                    <div className="inline-flex rounded-2xl shadow-md overflow-hidden bg-emerald-700 hover:bg-emerald-800 transition">
                      <button
                        type="button"
                        onClick={handleExportFilteredSecondary}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 text-white font-extrabold text-xs cursor-pointer active:scale-95"
                        title={`ส่งออกตารางคำศัพท์ ${selectedGrade === 'all' ? 'ม.1 - ม.6' : selectedGrade} (${filteredSecondaryWords.length.toLocaleString()} คำ) เป็นไฟล์ Excel`}
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                        <span>ส่งออก Excel ({filteredSecondaryWords.length.toLocaleString()} คำ)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSecondaryExcelMenu((prev) => !prev)}
                        className="px-2 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white border-l border-emerald-600/50 cursor-pointer"
                        title="ตัวเลือกส่งออก Excel เพิ่มเติม (เช่น แยกชีตตามระดับชั้น)"
                      >
                        <ChevronDown className="w-3.5 h-3.5 text-emerald-200" />
                      </button>
                    </div>

                    {showSecondaryExcelMenu && (
                      <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 text-xs">
                        <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-100 flex items-center justify-between">
                          <span>ตัวเลือกส่งออกไฟล์ Excel (.xlsx)</span>
                          <button
                            type="button"
                            onClick={() => setShowSecondaryExcelMenu(false)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            ✕
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleExportFilteredSecondary}
                          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-emerald-50 flex items-center gap-2.5 text-slate-700 font-bold cursor-pointer"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <div>ส่งออกคำที่กำลังแสดง ({filteredSecondaryWords.length.toLocaleString()} คำ)</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              ตามระดับ {selectedGrade === 'all' ? 'ม.1 - ม.6' : selectedGrade} และตัวกรองปัจจุบัน
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={handleExportAllSecondaryMultiSheet}
                          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-purple-50 flex items-center gap-2.5 text-slate-700 font-bold cursor-pointer"
                        >
                          <Layers className="w-4 h-4 text-purple-600 shrink-0" />
                          <div>
                            <div>ส่งออกคำศัพท์หลักสูตร ม.1 - ม.6 ทั้งหมด</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {SECONDARY_VOCABULARY.length.toLocaleString()} คำ (แยกชีต ม.1 ถึง ม.6 อัตโนมัติ)
                            </div>
                          </div>
                        </button>
                        {selectedSecondaryIds.size > 0 && (
                          <button
                            type="button"
                            onClick={handleExportSelectedSecondary}
                            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-amber-50 flex items-center gap-2.5 text-amber-900 font-bold cursor-pointer border-t border-slate-100"
                          >
                            <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                            <div>
                              <div>ส่งออกเฉพาะ {selectedSecondaryIds.size} คำที่เลือก</div>
                              <div className="text-[10px] text-amber-600 font-normal">
                                บันทึกเฉพาะรายการที่ติ๊กเลือกไว้
                              </div>
                            </div>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Print Button */}
                  <button
                    type="button"
                    onClick={() => handlePrintSecondary()}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer shrink-0"
                    title={`เปิดตัวอย่างก่อนพิมพ์คำศัพท์ระดับ ${selectedGrade === 'all' ? 'ม.1 - ม.6' : selectedGrade}`}
                  >
                    <Printer className="w-4 h-4 text-amber-400" />
                    <span>
                      พิมพ์คำศัพท์ {selectedGrade === 'all' ? 'ม.1-6' : selectedGrade === 'lower' ? 'ม.ต้น' : selectedGrade === 'upper' ? 'ม.ปลาย' : selectedGrade} ({filteredSecondaryWords.length} คำ)
                    </span>
                  </button>
                </div>

                {/* Grade Level Selector Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
                  <span className="text-xs font-bold text-slate-400 shrink-0 mr-1">ระดับชั้น:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedGrade('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      selectedGrade === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    ทั้งหมด ม.1 - ม.6 ({SECONDARY_VOCABULARY.length.toLocaleString()})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGrade('lower')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      selectedGrade === 'lower'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    ม.ต้น (ม.1 - ม.3 O-NET) ({SECONDARY_VOCABULARY.filter(w => w.level === 'lower').length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGrade('upper')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      selectedGrade === 'upper'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                    }`}
                  >
                    ม.ปลาย (ม.4 - ม.6 TGAT / A-Level) ({SECONDARY_VOCABULARY.filter(w => w.level === 'upper').length})
                  </button>

                  {(['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'] as SecondaryGrade[]).map((g) => {
                    const count = SECONDARY_VOCABULARY.filter((w) => w.grade === g).length;
                    const isSelected = selectedGrade === g;
                    const badge = GRADE_BADGES[g];

                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGrade(g)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                            : `${badge.bg} ${badge.color} hover:opacity-90`
                        }`}
                      >
                        <span>{g}</span>
                        <span className="opacity-80 text-[10px] ml-1 font-semibold">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Result Counter, Topic Highlight & Per-Page Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-500 px-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    แสดงคำที่{' '}
                    <span className="text-slate-800 font-extrabold">
                      {filteredSecondaryWords.length > 0 ? (safeCurrentPage - 1) * pageSize + 1 : 0}
                    </span>{' '}
                    -{' '}
                    <span className="text-slate-800 font-extrabold">
                      {Math.min(safeCurrentPage * pageSize, filteredSecondaryWords.length)}
                    </span>{' '}
                    จากทั้งหมด{' '}
                    <span className="text-slate-800 font-extrabold">
                      {filteredSecondaryWords.length.toLocaleString()}
                    </span>{' '}
                    คำ
                    {totalPages > 1 && (
                      <span className="text-slate-400 font-semibold ml-1.5">
                        (หน้า {safeCurrentPage} / {totalPages})
                      </span>
                    )}
                  </span>
                </span>

                <div className="flex items-center gap-2">
                  {selectedTopic !== 'all' && (
                    <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-[11px]">
                      หมวด: {selectedTopic}
                    </span>
                  )}

                  {/* Page size selector */}
                  <div className="print:hidden flex items-center gap-1 text-[11px] text-slate-400">
                    <span>แสดง:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 font-bold text-slate-700 cursor-pointer focus:outline-hidden"
                    >
                      <option value={24}>24 คำ/หน้า</option>
                      <option value={48}>48 คำ/หน้า</option>
                      <option value={96}>96 คำ/หน้า</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Interactive Batch Selection Toolbar */}
              <div className="print:hidden bg-slate-50 border border-slate-200/90 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="text-slate-500 mr-1">เลือกคำศัพท์:</span>

                  <button
                    type="button"
                    onClick={handleToggleSelectAllOnPage}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    {isAllPageSelected ? (
                      <CheckSquare className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>{isAllPageSelected ? 'ยกเลิกเลือกหน้านี้' : `เลือกทั้งหน้านี้ (${paginatedSecondaryWords.length} คำ)`}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Layers className="w-4 h-4 text-amber-600" />
                    <span>เลือกทั้งหมดตามตัวกรองนี้ ({filteredSecondaryWords.length} คำ)</span>
                  </button>

                  {selectedSecondaryIds.size > 0 && (
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>ล้างที่เลือก</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedSecondaryIds.size > 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={handleExportSelectedSecondary}
                        className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
                        title="ส่งออกเฉพาะคำที่เลือกเป็นไฟล์ Excel"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-teal-200" />
                        <span>ส่งออก Excel ({selectedSecondaryIds.size} คำ)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const selectedWords = SECONDARY_VOCABULARY.filter((w) => selectedSecondaryIds.has(w.id));
                          handlePrintSecondary(selectedWords);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-emerald-200" />
                        <span>พิมพ์ {selectedSecondaryIds.size} คำที่เลือก (เปิดตัวอย่าง A4/A5)</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400">
                      💡 ติ๊กถูกที่การ์ดเพื่อเลือกคำเฉพาะ หรือกด &ldquo;ส่งออก Excel&rdquo; / &ldquo;พิมพ์คำศัพท์&rdquo; ด้านบน
                    </span>
                  )}
                </div>
              </div>

              {/* Notification Banner for Excel Export */}
              {exportNotice && (
                <div className="print:hidden bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-1 shadow-xs">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{exportNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExportNotice('')}
                    className="text-emerald-700 hover:text-emerald-950 font-bold p-1 rounded cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Printable Header */}
              <div className="hidden print:block text-center border-b pb-4 mb-4">
                <h1 className="text-2xl font-bold">Smart Sarai English – คลังคำศัพท์หลักสูตรแกนกลาง ม.1 - ม.6</h1>
                <p className="text-sm text-gray-600 mt-1">
                  คำศัพท์ที่ควรรู้ตามมาตรฐานการศึกษาขั้นพื้นฐาน (สพฐ.) – หมวด: {selectedTopic === 'all' ? 'ทุกหมวดสาระ' : selectedTopic} | ระดับ: {selectedGrade === 'all' ? 'ม.1 - ม.6' : selectedGrade}
                </p>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2 print:gap-3">
                {paginatedSecondaryWords.map((item) => {
                  const badge = GRADE_BADGES[item.grade];
                  const isSelected = selectedSecondaryIds.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-3xl p-5 border-2 transition-all flex flex-col justify-between group space-y-3.5 print:border-gray-400 print:shadow-none print:break-inside-avoid ${
                        isSelected
                          ? 'border-amber-500 ring-2 ring-amber-400/40 bg-amber-50/20 shadow-md'
                          : 'border-slate-200 hover:border-amber-400 hover:shadow-lg'
                      }`}
                    >
                      {/* Top Tags Row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {/* Checkbox for custom print selection */}
                          <button
                            type="button"
                            onClick={() => handleToggleSelectWord(item.id)}
                            title={isSelected ? 'ยกเลิกการเลือกคำนี้' : 'เลือกคำนี้เพื่อพิมพ์'}
                            className={`print:hidden flex items-center justify-center w-6 h-6 rounded-lg transition cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                            }`}
                          >
                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </button>

                          <div className="flex items-center gap-1.5">
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${badge.bg} ${badge.color}`}>
                              {item.grade}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700">
                              {item.pos}
                            </span>
                          </div>
                        </div>

                        <span className="text-[11px] font-bold text-slate-400 truncate max-w-[130px]">
                          {item.topic}
                        </span>
                      </div>

                      {/* English Word & Audio Speaker */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {item.emoji && <span className="text-2xl select-none">{item.emoji}</span>}
                            <h3 className="font-bubble text-2xl font-black text-slate-800 tracking-wide group-hover:text-amber-700 transition-colors">
                              {item.word}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => speakText(item.word, { rate: speedRate })}
                              title="คลิกเพื่อฟังเสียงอ่านภาษาอังกฤษ"
                              className="print:hidden w-9 h-9 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-700 flex items-center justify-center transition active:scale-90 cursor-pointer shadow-2xs"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePrintSingleSecondaryWord(item)}
                              title={`เปิดตัวอย่างพิมพ์สื่อการสอน/คัดลายมือคำว่า "${item.word}"`}
                              className="print:hidden px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 font-extrabold text-[11px] flex items-center gap-1 transition active:scale-90 cursor-pointer border border-slate-200"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-600" />
                              <span>พิมพ์</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleLaunchSpellingGame(item.id)}
                              title={`เล่นเกมสะกดคำ ${item.word}`}
                              className="print:hidden px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-extrabold text-[11px] flex items-center gap-1 transition active:scale-90 cursor-pointer border border-orange-200"
                            >
                              <Gamepad2 className="w-3.5 h-3.5" />
                              <span>สะกดคำนี้</span>
                            </button>
                          </div>
                        </div>

                        {/* Phonetics */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono text-slate-500 font-semibold">{item.phoneticIPA}</span>
                          <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                            {item.phoneticTh}
                          </span>
                        </div>
                      </div>

                      {/* Thai Meaning */}
                      <div className="bg-amber-50/50 rounded-2xl p-2.5 border border-amber-200/60">
                        <p className="text-sm font-black text-slate-800">
                          {item.meaningTh}
                        </p>
                      </div>

                      {/* Example Context Sentence */}
                      <div className="space-y-1 text-xs">
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-slate-700 font-semibold leading-relaxed">
                            &ldquo;{item.sentence}&rdquo;
                          </p>
                          <button
                            type="button"
                            onClick={() => speakText(item.sentence, { rate: speedRate })}
                            title="ฟังเสียงทั้งประโยค"
                            className="print:hidden p-1 hover:text-amber-600 text-slate-400 transition cursor-pointer shrink-0"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-slate-400 font-medium">
                          แปล: {item.sentenceTh}
                        </p>
                      </div>

                      {/* Synonyms / Exam keywords if any */}
                      {item.synonyms && item.synonyms.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="text-slate-400 font-semibold">คำเหมือน:</span>
                          {item.synonyms.map((syn) => (
                            <button
                              key={syn}
                              type="button"
                              onClick={() => speakText(syn, { rate: speedRate })}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded-md transition cursor-pointer"
                            >
                              {syn}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {filteredSecondaryWords.length === 0 && (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-300 text-slate-500 space-y-2">
                  <p className="text-base font-bold">ไม่พบคำศัพท์ที่ตรงกับการค้นหา</p>
                  <p className="text-xs">ลองเปลี่ยนคำค้นหา หรือเลือกระดับชั้นและหมวดสาระเป็น &ldquo;ทั้งหมด&rdquo;</p>
                </div>
              )}

              {/* Bottom Pagination Controls */}
              {totalPages > 1 && (
                <div className="print:hidden flex flex-wrap items-center justify-center gap-1.5 pt-4 pb-2">
                  {/* First Page */}
                  <button
                    type="button"
                    disabled={safeCurrentPage === 1}
                    onClick={() => handlePageChange(1)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    title="หน้าแรกสุด"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  {/* Prev Page */}
                  <button
                    type="button"
                    disabled={safeCurrentPage === 1}
                    onClick={() => handlePageChange(safeCurrentPage - 1)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    title="หน้าก่อนหน้า"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page Number Buttons */}
                  {paginationRange.map((p, idx) => {
                    if (p === '...') {
                      return (
                        <span key={`dots-${idx}`} className="px-2 text-slate-400 font-bold text-sm">
                          ...
                        </span>
                      );
                    }
                    const pageNum = p as number;
                    const isCurrent = pageNum === safeCurrentPage;

                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isCurrent
                            ? 'bg-amber-500 text-white shadow-sm border border-amber-600 scale-105'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {/* Next Page */}
                  <button
                    type="button"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => handlePageChange(safeCurrentPage + 1)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    title="หน้าถัดไป"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Last Page */}
                  <button
                    type="button"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    title="หน้าสุดท้าย"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* PHONICS VOCABULARY BANK (สระพื้นฐาน 395 คำ) */}
      {/* ============================================================== */}
      {bankMode === 'phonics' && (
        <div className="space-y-5">
          {/* Filter & Search Bar */}
          <div className="print:hidden bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาคำศัพท์ภาษาอังกฤษ หรือความหมายไทย (เช่น cake, cat, แมว)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white transition"
                />
              </div>

              {/* Word Family Dropdown */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedFamily}
                  onChange={(e) => setSelectedFamily(e.target.value)}
                  className="px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                >
                  <option value="all">ทุกกลุ่มคำ (All Families)</option>
                  {availableFamilies.map((fam) => (
                    <option key={fam} value={fam}>
                      กลุ่มคำ {fam}
                    </option>
                  ))}
                </select>
              </div>

              {/* Excel Export Button & Dropdown for Phonics */}
              <div className="relative shrink-0">
                <div className="inline-flex rounded-2xl shadow-md overflow-hidden bg-emerald-700 hover:bg-emerald-800 transition">
                  <button
                    type="button"
                    onClick={handleExportFilteredPhonics}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 text-white font-extrabold text-xs cursor-pointer active:scale-95"
                    title={`ส่งออกตารางคำศัพท์โฟนิกส์ (${filteredPhonicsWords.length} คำ) เป็นไฟล์ Excel`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                    <span>ส่งออก Excel ({filteredPhonicsWords.length} คำ)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPhonicsExcelMenu((prev) => !prev)}
                    className="px-2 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white border-l border-emerald-600/50 cursor-pointer"
                    title="ตัวเลือกส่งออก Excel เพิ่มเติมสำหรับคำศัพท์โฟนิกส์"
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-emerald-200" />
                  </button>
                </div>

                {showPhonicsExcelMenu && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 text-xs">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-100 flex items-center justify-between">
                      <span>ตัวเลือกส่งออกโฟนิกส์เป็น Excel (.xlsx)</span>
                      <button
                        type="button"
                        onClick={() => setShowPhonicsExcelMenu(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportFilteredPhonics}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-emerald-50 flex items-center gap-2.5 text-slate-700 font-bold cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div>ส่งออกคำที่กำลังแสดง ({filteredPhonicsWords.length} คำ)</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          ตามสระ {selectedVowel === 'all' ? 'ทั้งหมด' : selectedVowel} และตัวกรองปัจจุบัน
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportAllPhonicsMultiSheet}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-purple-50 flex items-center gap-2.5 text-slate-700 font-bold cursor-pointer"
                    >
                      <Layers className="w-4 h-4 text-purple-600 shrink-0" />
                      <div>
                        <div>ส่งออกโฟนิกส์ทั้งหมด 395 คำ (แยก 4 ชีต)</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          แยกชีต: รวมทั้งหมด, สระเสียงสั้น, สระเสียงยาว, สระประสม
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Print Center Link */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer shrink-0"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>พิมพ์สื่อโฟนิกส์</span>
              </button>
            </div>

            {/* Vowel Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedVowel('all');
                  setSelectedFamily('all');
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedVowel === 'all'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด ({PHONICS_WORDS.length} คำ)
              </button>
              {ALL_VOWELS.map((v) => {
                const info = VOWEL_INFO_MAP[v];
                const isSel = selectedVowel === v;
                const count = PHONICS_WORDS.filter((w) => w.vowel === v).length;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setSelectedVowel(v);
                      setSelectedFamily('all');
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                      isSel
                        ? `${info.borderColor} ${info.bgLight} ${info.textColor} border-2 shadow-xs`
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{info.icon}</span>
                    <span>
                      {info.name} ({count} คำ)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Printable Heading (Only visible in Print) */}
          <div className="hidden print:block text-center border-b pb-4 mb-4">
            <h1 className="text-2xl font-bold">ชุดบัตรคำศัพท์ภาษาอังกฤษ Phonics สระ 15 รูปเสียง</h1>
            <p className="text-sm text-gray-600">
              รวม {filteredPhonicsWords.length} คำศัพท์
            </p>
          </div>

          {/* Grid of Word Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 print:grid-cols-4 print:gap-2">
            {filteredPhonicsWords.map((word) => {
              const vowelInfo = VOWEL_INFO_MAP[word.vowel];

              return (
                <div
                  key={word.id}
                  onClick={() => speakText(word.word, { rate: speedRate })}
                  className="bg-white rounded-2xl p-3.5 border-2 border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group print:border-gray-400 print:shadow-none print:break-inside-avoid"
                >
                  {/* Top tag */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className={`font-bold px-1.5 py-0.2 rounded ${vowelInfo.bgLight} ${vowelInfo.textColor}`}>
                      {vowelInfo.name}
                    </span>
                    <span className="font-mono text-slate-500 font-semibold">{word.family}</span>
                  </div>

                  {/* Emoji & Word */}
                  <div className="text-center my-2">
                    <div className="text-4xl mb-1 group-hover:scale-110 transition-transform">
                      {word.emoji}
                    </div>
                    <div className="font-bubble text-2xl font-black text-slate-800 tracking-wide">
                      {word.word}
                    </div>
                    <div className="text-xs text-amber-700 font-bold font-thai">
                      {word.phoneticTh}
                    </div>
                    <div className="text-xs text-slate-600 font-semibold font-thai mt-0.5">
                      {word.meaningTh}
                    </div>
                  </div>

                  {/* Sound speaker and print hint */}
                  <div className="print:hidden pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 group-hover:text-amber-600">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>ฟังเสียง</span>
                    </span>
                    {onPrintWord && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPrintWord(word);
                        }}
                        title={`พิมพ์บัตรคำ ${word.word}`}
                        className="p-1 hover:bg-slate-100 hover:text-slate-800 rounded transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPhonicsWords.length === 0 && (
            <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-slate-300 text-slate-500">
              ไม่พบคำศัพท์ที่ตรงกับการค้นหา ลองเปลี่ยนคำค้นหรือเลือกหมวดหมู่ทั้งหมดดูนะ
            </div>
          )}
        </div>
      )}
    </div>
  );
};
