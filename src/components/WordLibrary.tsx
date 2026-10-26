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
  PenTool,
  RotateCcw,
  LayoutGrid,
  List,
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
  onPrintSecondaryWord?: (word: SecondaryVocabWord, template?: PrintTemplate) => void;
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
  const [secondaryDisplayMode, setSecondaryDisplayMode] = useState<'grid' | 'compact'>('grid');

  // Secondary counts by grade and group
  const secondaryStats = useMemo(() => {
    const m1 = SECONDARY_VOCABULARY.filter((w) => w.grade === 'ม.1').length;
    const m2 = SECONDARY_VOCABULARY.filter((w) => w.grade === 'ม.2').length;
    const m3 = SECONDARY_VOCABULARY.filter((w) => w.grade === 'ม.3').length;
    const m4 = SECONDARY_VOCABULARY.filter((w) => w.grade === 'ม.4').length;
    const m5 = SECONDARY_VOCABULARY.filter((w) => w.grade === 'ม.5').length;
    const m6 = SECONDARY_VOCABULARY.filter((w) => w.grade === 'ม.6').length;
    const lower = SECONDARY_VOCABULARY.filter((w) => w.level === 'lower').length;
    const upper = SECONDARY_VOCABULARY.filter((w) => w.level === 'upper').length;
    const total = SECONDARY_VOCABULARY.length;
    return { m1, m2, m3, m4, m5, m6, lower, upper, total };
  }, []);

  const isAnySecondaryFilterActive =
    selectedGrade !== 'all' ||
    selectedTopic !== 'all' ||
    selectedPos !== 'all' ||
    searchQuery.trim().length > 0;

  const handleResetSecondaryFilters = () => {
    setSelectedGrade('all');
    setSelectedTopic('all');
    setSelectedPos('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

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

  const handlePrintSingleSecondaryWord = (word: SecondaryVocabWord, template?: PrintTemplate) => {
    if (onPrintSecondaryWord) {
      onPrintSecondaryWord(word, template);
    } else if (onOpenPrintSecondary) {
      onOpenPrintSecondary({
        words: [word],
        grade: word.grade,
        topic: word.topic,
        template,
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
      {/* Top Main Mode Switcher: เรียงกันแนวตั้ง (Vertical Stack) ให้ยืดหยุ่นและชัดเจน */}
      <div className="print:hidden bg-white rounded-3xl p-4 sm:p-5 shadow-sm border-2 border-amber-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl select-none">📚</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bubble font-black text-amber-700">
                คลังคำศัพท์มาตรฐานภาษาอังกฤษ
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                เลือกคลังคำศัพท์ที่ต้องการเรียนรู้ ทบทวน หรือสร้างใบงานฝึกคัดลายมือ 4 เส้น (จัดเรียงแนวตั้งสะดวกต่อการเลือกใช้งาน)
              </p>
            </div>
          </div>
        </div>

        {/* เมนูคำศัพท์ ม.1-6 และสระโฟนิกส์พื้นฐาน เรียงกันแนวตั้ง (Vertical Stack) */}
        <div className="flex flex-col gap-3">
          {/* MENU ITEM 1 (แนวตั้ง): คำศัพท์ ม.1 - ม.6 */}
          <div
            onClick={() => {
              setBankMode('secondary');
              setSearchQuery('');
            }}
            className={`rounded-2xl p-4 sm:p-4.5 border-2 transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 select-none ${
              bankMode === 'secondary'
                ? 'bg-amber-50/80 border-amber-500 shadow-sm ring-2 ring-amber-300/60'
                : 'bg-slate-50/70 border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-colors ${
                  bankMode === 'secondary'
                    ? 'bg-amber-500 text-white shadow-amber-200'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bubble text-base sm:text-lg font-black text-slate-900">
                    1. คำศัพท์ ม.1 - ม.6 (หลักสูตรแกนกลาง สพฐ.)
                  </h3>
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                      bankMode === 'secondary'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                  >
                    {SECONDARY_VOCABULARY.length.toLocaleString()} คำ
                  </span>
                  {bankMode === 'secondary' && (
                    <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      ✓ กำลังเลือกใช้งาน
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  ครอบคลุม ม.ต้น (ม.1 - ม.3 O-NET) และ ม.ปลาย (ม.4 - ม.6 TGAT / A-Level) พร้อมประโยคบริบทและใบงานคัด 4 เส้น
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setBankMode('secondary');
                  handlePrintSecondary(undefined, 'tracing');
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer ring-1 ring-amber-300"
                title="สร้างใบงานฝึกคัดคำศัพท์ ม.1 - ม.6 (4 เส้นมาตรฐาน)"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>📝 ใบงานฝึกคัด</span>
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  bankMode === 'secondary'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {bankMode === 'secondary' ? 'เปิดใช้งานอยู่' : 'เลือกคลัง ม.1 - 6'}
              </button>
            </div>
          </div>

          {/* MENU ITEM 2 (แนวตั้ง): สระโฟนิกส์พื้นฐาน */}
          <div
            onClick={() => {
              setBankMode('phonics');
              setSecondaryViewMode('browse');
              setSearchQuery('');
            }}
            className={`rounded-2xl p-4 sm:p-4.5 border-2 transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 select-none ${
              bankMode === 'phonics'
                ? 'bg-amber-50/80 border-amber-500 shadow-sm ring-2 ring-amber-300/60'
                : 'bg-slate-50/70 border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-colors ${
                  bankMode === 'phonics'
                    ? 'bg-amber-500 text-white shadow-amber-200'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bubble text-base sm:text-lg font-black text-slate-900">
                    2. สระโฟนิกส์พื้นฐาน (Basic Phonics Vowels)
                  </h3>
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                      bankMode === 'phonics'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                  >
                    {PHONICS_WORDS.length} คำ
                  </span>
                  {bankMode === 'phonics' && (
                    <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      ✓ กำลังเลือกใช้งาน
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  สระเสียงสั้น (5 สระ), สระเสียงยาว (8 สระ), และสระประสม (8 สระ) ฝึกผสมเสียงและสะกดคำเบื้องต้นสำหรับเด็ก
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setBankMode('phonics');
                  if (onOpenPrintCenter) onOpenPrintCenter();
                }}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer ring-1 ring-teal-300"
                title="พิมพ์สื่อและแบบฝึกหัดสระโฟนิกส์"
              >
                <Printer className="w-3.5 h-3.5 text-teal-200" />
                <span>🖨️ พิมพ์โฟนิกส์</span>
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  bankMode === 'phonics'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {bankMode === 'phonics' ? 'เปิดใช้งานอยู่' : 'เลือกสระโฟนิกส์'}
              </button>
            </div>
          </div>
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
              {/* Top Action Ribbon for Secondary Vocabulary */}
              <div className="print:hidden bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-4">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-amber-100 text-amber-700 text-base font-black">
                        🎓
                      </span>
                      <h3 className="font-bubble text-lg sm:text-xl font-black text-slate-800">
                        คลังคำศัพท์มาตรฐาน ม.1 - ม.6 (สพฐ.)
                      </h3>
                      <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-amber-200">
                        {secondaryStats.total.toLocaleString()} คำ
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      คำศัพท์สำคัญตามหลักสูตรแกนกลาง พร้อมคำอ่าน IPA, คำแปล, ประโยคบริบท และใบงานฝึกคัด 4 เส้น
                    </p>
                  </div>

                  {/* Fast Action Tools (สร้างใบงาน, พิมพ์สื่อ, ส่งออก Excel, เล่นเกม) */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    {/* Worksheet Tracing Button */}
                    <button
                      type="button"
                      onClick={() => handlePrintSecondary(undefined, 'tracing')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black text-xs shadow-md transition active:scale-95 cursor-pointer ring-2 ring-amber-300 ring-offset-1"
                      title={`สร้างใบงานฝึกคัดลายมือตามรอยประ 4 เส้น สำหรับ ${selectedGrade === 'all' ? 'ม.1 - ม.6' : selectedGrade}`}
                    >
                      <PenTool className="w-4 h-4 text-white" />
                      <span>
                        📝 สร้างใบงานฝึกคัด {selectedGrade === 'all' ? 'ม.1 - 6' : selectedGrade}
                      </span>
                    </button>

                    {/* Print Center Button */}
                    <button
                      type="button"
                      onClick={() => handlePrintSecondary()}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer"
                      title={`เปิดตัวอย่างก่อนพิมพ์คำศัพท์ระดับ ${selectedGrade === 'all' ? 'ม.1 - ม.6' : selectedGrade}`}
                    >
                      <Printer className="w-4 h-4 text-amber-400" />
                      <span>
                        พิมพ์สื่อ {selectedGrade === 'all' ? 'ม.1-6' : selectedGrade === 'lower' ? 'ม.ต้น' : selectedGrade === 'upper' ? 'ม.ปลาย' : selectedGrade}
                      </span>
                    </button>

                    {/* Excel Export Menu */}
                    <div className="relative shrink-0">
                      <div className="inline-flex rounded-2xl shadow-md overflow-hidden bg-emerald-700 hover:bg-emerald-800 transition">
                        <button
                          type="button"
                          onClick={handleExportFilteredSecondary}
                          className="flex items-center gap-1.5 px-3.5 py-2.5 text-white font-extrabold text-xs cursor-pointer active:scale-95"
                          title={`ส่งออกคำศัพท์ ${filteredSecondaryWords.length.toLocaleString()} คำ เป็นไฟล์ Excel`}
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                          <span>Excel ({filteredSecondaryWords.length.toLocaleString()} คำ)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSecondaryExcelMenu((prev) => !prev)}
                          className="px-2 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white border-l border-emerald-600/50 cursor-pointer"
                          title="ตัวเลือกส่งออก Excel เพิ่มเติม"
                        >
                          <ChevronDown className="w-3.5 h-3.5 text-emerald-200" />
                        </button>
                      </div>

                      {showSecondaryExcelMenu && (
                        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 text-xs animate-in fade-in zoom-in-95">
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
                                {secondaryStats.total.toLocaleString()} คำ (แยกชีต ม.1 ถึง ม.6 อัตโนมัติ)
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

                    {/* Launch Spelling Game Button */}
                    <button
                      type="button"
                      onClick={() => handleLaunchSpellingGame()}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-extrabold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                      title="เริ่มเล่นเกมสะกดคำศัพท์สำหรับระดับนี้"
                    >
                      <Gamepad2 className="w-4 h-4 text-orange-600" />
                      <span>เล่นเกมสะกดคำ</span>
                    </button>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* 3-CARD GRADE HUB: แผงเลือกระดับชั้น ม.1-ม.6 ที่มองเห็นชัดเจน ไม่ถูกตัดขอบ */}
                {/* ============================================================== */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                  {/* Card 1: รวมทั้งหมด ม.1 - ม.6 */}
                  <div
                    onClick={() => setSelectedGrade('all')}
                    className={`md:col-span-3 rounded-2xl p-3.5 border-2 transition-all cursor-pointer flex flex-col justify-between select-none ${
                      selectedGrade === 'all'
                        ? 'bg-amber-50/70 border-amber-500 shadow-sm ring-2 ring-amber-300/60'
                        : 'bg-slate-50/60 border-slate-200 hover:border-amber-300 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-slate-800">🌐 ทุกระดับชั้น</span>
                        {selectedGrade === 'all' && (
                          <span className="text-[10px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                            เลือกอยู่
                          </span>
                        )}
                      </div>
                      <div className="text-base font-black text-slate-900 mt-1">
                        ทั้งหมด ม.1 - ม.6
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">
                        รวม {secondaryStats.total.toLocaleString()} คำศัพท์แกนกลาง
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/70 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-700">
                        {selectedGrade === 'all' ? '✓ กำลังแสดงคำทั้งหมด' : 'คลิกเพื่อดูทั้งหมด'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGrade('all');
                          handlePrintSecondary(SECONDARY_VOCABULARY, 'tracing');
                        }}
                        className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-black flex items-center gap-1 transition"
                        title="สร้างใบงานฝึกคัดทั้งหลักสูตร ม.1 - ม.6"
                      >
                        <PenTool className="w-3 h-3 text-amber-700" />
                        <span>คัดทั้งชุด</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 2: มัธยมศึกษาตอนต้น (ม.ต้น - ม.1, ม.2, ม.3 O-NET) */}
                  <div
                    className={`md:col-span-4 rounded-2xl p-3.5 border-2 transition-all flex flex-col justify-between ${
                      selectedGrade === 'lower' || selectedGrade === 'ม.1' || selectedGrade === 'ม.2' || selectedGrade === 'ม.3'
                        ? 'bg-emerald-50/50 border-emerald-500 shadow-sm ring-2 ring-emerald-300/50'
                        : 'bg-slate-50/60 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-black text-emerald-800 flex items-center gap-1">
                          <span>🟢</span>
                          <span>มัธยมศึกษาตอนต้น (O-NET)</span>
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-full">
                          {secondaryStats.lower} คำ
                        </span>
                      </div>

                      {/* Group button */}
                      <button
                        type="button"
                        onClick={() => setSelectedGrade('lower')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer mb-2 flex items-center justify-between border ${
                          selectedGrade === 'lower'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-emerald-800 hover:bg-emerald-100 border-emerald-200'
                        }`}
                      >
                        <span>รวม ม.ต้น (ม.1 - ม.3)</span>
                        <span className="text-[10px] opacity-90">{secondaryStats.lower} คำ</span>
                      </button>

                      {/* Sub-grade pills for M.1, M.2, M.3 */}
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['ม.1', 'ม.2', 'ม.3'] as SecondaryGrade[]).map((g) => {
                          const count = g === 'ม.1' ? secondaryStats.m1 : g === 'ม.2' ? secondaryStats.m2 : secondaryStats.m3;
                          const isSel = selectedGrade === g;
                          const gradeWords = SECONDARY_VOCABULARY.filter((w) => w.grade === g);

                          return (
                            <div key={g} className="relative group">
                              <button
                                type="button"
                                onClick={() => setSelectedGrade(g)}
                                className={`w-full py-2 px-1 rounded-xl text-center font-black transition cursor-pointer border flex flex-col items-center justify-center ${
                                  isSel
                                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                                    : 'bg-white text-emerald-900 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/60'
                                }`}
                              >
                                <span className="text-xs">{g}</span>
                                <span className="text-[10px] opacity-80 font-normal">({count})</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGrade(g);
                                  handlePrintSecondary(gradeWords, 'tracing');
                                }}
                                title={`สร้างใบงานฝึกคัด 4 เส้น ระดับ ${g}`}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] shadow-xs cursor-pointer opacity-90 hover:opacity-100 transition active:scale-90"
                              >
                                ✏️
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-700 font-semibold">แตะ ✏️ บนการ์ดชั้นเพื่อคัดทันที</span>
                      <button
                        type="button"
                        onClick={() => {
                          const lowerWords = SECONDARY_VOCABULARY.filter((w) => w.level === 'lower');
                          setSelectedGrade('lower');
                          handlePrintSecondary(lowerWords, 'tracing');
                        }}
                        className="text-emerald-800 hover:text-emerald-950 font-black cursor-pointer flex items-center gap-1"
                      >
                        <PenTool className="w-3 h-3 text-emerald-600" />
                        <span>คัดรวม ม.ต้น</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 3: มัธยมศึกษาตอนปลาย (ม.ปลาย - ม.4, ม.5, ม.6 TGAT / A-Level) */}
                  <div
                    className={`md:col-span-5 rounded-2xl p-3.5 border-2 transition-all flex flex-col justify-between ${
                      selectedGrade === 'upper' || selectedGrade === 'ม.4' || selectedGrade === 'ม.5' || selectedGrade === 'ม.6'
                        ? 'bg-purple-50/50 border-purple-500 shadow-sm ring-2 ring-purple-300/50'
                        : 'bg-slate-50/60 border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-black text-purple-800 flex items-center gap-1">
                          <span>🟣</span>
                          <span>มัธยมศึกษาตอนปลาย (TGAT / A-Level)</span>
                        </span>
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.2 rounded-full">
                          {secondaryStats.upper} คำ
                        </span>
                      </div>

                      {/* Group button */}
                      <button
                        type="button"
                        onClick={() => setSelectedGrade('upper')}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer mb-2 flex items-center justify-between border ${
                          selectedGrade === 'upper'
                            ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                            : 'bg-white text-purple-800 hover:bg-purple-100 border-purple-200'
                        }`}
                      >
                        <span>รวม ม.ปลาย (ม.4 - ม.6)</span>
                        <span className="text-[10px] opacity-90">{secondaryStats.upper} คำ</span>
                      </button>

                      {/* Sub-grade pills for M.4, M.5, M.6 */}
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['ม.4', 'ม.5', 'ม.6'] as SecondaryGrade[]).map((g) => {
                          const count = g === 'ม.4' ? secondaryStats.m4 : g === 'ม.5' ? secondaryStats.m5 : secondaryStats.m6;
                          const isSel = selectedGrade === g;
                          const gradeWords = SECONDARY_VOCABULARY.filter((w) => w.grade === g);

                          return (
                            <div key={g} className="relative group">
                              <button
                                type="button"
                                onClick={() => setSelectedGrade(g)}
                                className={`w-full py-2 px-1 rounded-xl text-center font-black transition cursor-pointer border flex flex-col items-center justify-center ${
                                  isSel
                                    ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                                    : 'bg-white text-purple-900 border-slate-200 hover:border-purple-400 hover:bg-purple-50/60'
                                }`}
                              >
                                <span className="text-xs">{g}</span>
                                <span className="text-[10px] opacity-80 font-normal">({count})</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGrade(g);
                                  handlePrintSecondary(gradeWords, 'tracing');
                                }}
                                title={`สร้างใบงานฝึกคัด 4 เส้น ระดับ ${g}`}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] shadow-xs cursor-pointer opacity-90 hover:opacity-100 transition active:scale-90"
                              >
                                ✏️
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-purple-100 flex items-center justify-between text-[11px]">
                      <span className="text-purple-700 font-semibold">แตะ ✏️ บนการ์ดชั้นเพื่อคัดทันที</span>
                      <button
                        type="button"
                        onClick={() => {
                          const upperWords = SECONDARY_VOCABULARY.filter((w) => w.level === 'upper');
                          setSelectedGrade('upper');
                          handlePrintSecondary(upperWords, 'tracing');
                        }}
                        className="text-purple-800 hover:text-purple-950 font-black cursor-pointer flex items-center gap-1"
                      >
                        <PenTool className="w-3 h-3 text-purple-600" />
                        <span>คัดรวม ม.ปลาย</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* SEARCH BAR & FLEXIBLE TOPIC / POS FILTERS                      */}
                {/* ============================================================== */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  {/* Search Input with Clear Button */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาคำศัพท์ภาษาอังกฤษ, คำแปลไทย, IPA หรือคำเหมือน (เช่น achieve, วิเคราะห์, ภูมิอากาศ)..."
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white transition"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
                        title="ล้างคำค้นหา"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Topic Filter Chips (มองเห็นได้ทันที คลิกเลือกได้รวดเร็ว) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <span>หมวดสาระการเรียนรู้ (8 หมวด):</span>
                      </span>
                      {selectedTopic !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setSelectedTopic('all')}
                          className="text-amber-700 hover:underline cursor-pointer text-[11px]"
                        >
                          ล้างหมวดสาระ
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedTopic('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          selectedTopic === 'all'
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        ทุกหมวด ({SECONDARY_VOCABULARY.length})
                      </button>

                      {VOCAB_TOPICS.map((topic) => {
                        const isSel = selectedTopic === topic;
                        const iconMap: Record<VocabTopic, string> = {
                          'สิ่งแวดล้อมและธรรมชาติ': '🌱',
                          'วิทยาศาสตร์และเทคโนโลยี': '🔬',
                          'การศึกษาและอาชีพ': '🎓',
                          'สังคมและวัฒนธรรม': '👥',
                          'สุขภาพและการดำเนินชีวิต': '🍎',
                          'การสื่อสารและสื่อ': '📱',
                          'เศรษฐกิจและธุรกิจ': '💼',
                          'การเดินทางและการท่องเที่ยว': '✈️',
                        };
                        const count = SECONDARY_VOCABULARY.filter((w) => w.topic === topic).length;

                        return (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => setSelectedTopic(isSel ? 'all' : topic)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 border ${
                              isSel
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300'
                            }`}
                          >
                            <span>{iconMap[topic] || '📖'}</span>
                            <span>{topic}</span>
                            <span className="opacity-75 text-[10px]">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Part of Speech (POS) Segmented Control & Active Filter Summary */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-600">
                      <span className="text-slate-400 mr-1">ชนิดคำ (POS):</span>
                      {[
                        { id: 'all', label: 'ทุกชนิดคำ' },
                        { id: 'n.', label: 'คำนาม [n.]' },
                        { id: 'v.', label: 'คำกริยา [v.]' },
                        { id: 'adj.', label: 'คำคุณศัพท์ [adj.]' },
                        { id: 'adv.', label: 'คำกริยาวิเศษณ์ [adv.]' },
                      ].map((p) => {
                        const isSel = selectedPos === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPos(p.id)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                              isSel
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Reset all filters button if any filter active */}
                    {isAnySecondaryFilterActive && (
                      <button
                        type="button"
                        onClick={handleResetSecondaryFilters}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title="ล้างตัวกรองทั้งหมดกลับสู่ค่าเริ่มต้น"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>ล้างตัวกรองทั้งหมด</span>
                      </button>
                    )}
                  </div>
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

                  {/* View Mode Toggle (การ์ดละเอียด vs รายการกระชับ) */}
                  <div className="print:hidden inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setSecondaryDisplayMode('grid')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        secondaryDisplayMode === 'grid'
                          ? 'bg-white text-slate-900 shadow-2xs font-black'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                      title="มุมมองการ์ดละเอียด พร้อมประโยคตัวอย่างและคำเหมือน"
                    >
                      <LayoutGrid className="w-3.5 h-3.5 text-amber-600" />
                      <span className="hidden sm:inline">การ์ด</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSecondaryDisplayMode('compact')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        secondaryDisplayMode === 'compact'
                          ? 'bg-white text-slate-900 shadow-2xs font-black'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                      title="มุมมองรายการกระชับ ดูได้หลายคำรวดเร็ว"
                    >
                      <List className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="hidden sm:inline">กระชับ</span>
                    </button>
                  </div>

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
                          handlePrintSecondary(selectedWords, 'tracing');
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer ring-2 ring-amber-300 ring-offset-1"
                        title={`สร้างใบงานฝึกคัดลายมือตามรอยประ 4 เส้น สำหรับ ${selectedSecondaryIds.size} คำที่เลือก`}
                      >
                        <PenTool className="w-4 h-4 text-white" />
                        <span>📝 สร้างใบงานฝึกคัด {selectedSecondaryIds.size} คำที่เลือก</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const selectedWords = SECONDARY_VOCABULARY.filter((w) => selectedSecondaryIds.has(w.id));
                          handlePrintSecondary(selectedWords);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-emerald-200" />
                        <span>พิมพ์ {selectedSecondaryIds.size} คำ (ตัวอย่าง A4/A5)</span>
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

              {/* Cards Grid or Compact List View based on secondaryDisplayMode */}
              {secondaryDisplayMode === 'compact' ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                  {paginatedSecondaryWords.map((item) => {
                    const badge = GRADE_BADGES[item.grade];
                    const isSelected = selectedSecondaryIds.has(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 sm:px-5 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                          isSelected ? 'bg-amber-50/50' : 'hover:bg-amber-50/20'
                        }`}
                      >
                        {/* Left: Checkbox + Badges + Word + Meaning */}
                        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectWord(item.id)}
                            title={isSelected ? 'ยกเลิกการเลือกคำนี้' : 'เลือกคำนี้'}
                            className={`print:hidden flex items-center justify-center w-6 h-6 rounded-lg transition cursor-pointer shrink-0 mt-0.5 sm:mt-0 ${
                              isSelected
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                            }`}
                          >
                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </button>

                          <span className={`px-2 py-0.5 rounded-lg text-xs font-black border shrink-0 ${badge.bg} ${badge.color}`}>
                            {item.grade}
                          </span>

                          <span className="px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-700 shrink-0">
                            {item.pos}
                          </span>

                          <div className="flex flex-wrap items-baseline gap-2 min-w-0">
                            <span className="font-bubble text-lg font-black text-slate-900">
                              {item.word}
                            </span>
                            <span className="font-mono text-xs text-slate-500">
                              {item.phoneticIPA}
                            </span>
                            <span className="text-xs text-amber-800 font-bold bg-amber-50 px-1.5 py-0.2 rounded">
                              {item.phoneticTh}
                            </span>
                            <span className="text-xs font-bold text-slate-800 ml-1">
                              — {item.meaningTh}
                            </span>
                          </div>
                        </div>

                        {/* Right: Topic + Action buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 self-end md:self-auto justify-end">
                          <span className="text-[11px] font-bold text-slate-400 hidden xl:inline max-w-[130px] truncate">
                            {item.topic}
                          </span>

                          <button
                            type="button"
                            onClick={() => speakText(item.word, { rate: speedRate })}
                            title="ฟังเสียงอ่านภาษาอังกฤษ"
                            className="print:hidden w-8 h-8 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-700 flex items-center justify-center transition active:scale-90 cursor-pointer shadow-2xs shrink-0"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePrintSingleSecondaryWord(item, 'tracing')}
                            title={`สร้างใบงานฝึกคัดคำว่า "${item.word}"`}
                            className="print:hidden px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-extrabold text-[11px] flex items-center gap-1 transition active:scale-90 cursor-pointer shadow-2xs shrink-0"
                          >
                            <PenTool className="w-3 h-3 text-white shrink-0" />
                            <span>คัด</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePrintSingleSecondaryWord(item)}
                            title={`พิมพ์สื่อการสอนคำว่า "${item.word}"`}
                            className="print:hidden px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 font-extrabold text-[11px] flex items-center gap-1 transition active:scale-90 cursor-pointer border border-slate-200 shrink-0"
                          >
                            <Printer className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>พิมพ์</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleLaunchSpellingGame(item.id)}
                            title={`เล่นเกมสะกดคำ ${item.word}`}
                            className="print:hidden px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-extrabold text-[11px] flex items-center gap-1 transition active:scale-90 cursor-pointer border border-orange-200 hover:border-orange-300 shrink-0"
                          >
                            <Gamepad2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                            <span className="hidden sm:inline">สะกดคำนี้</span>
                            <span className="sm:hidden">สะกด</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2 print:gap-3">
                  {paginatedSecondaryWords.map((item) => {
                    const badge = GRADE_BADGES[item.grade];
                    const isSelected = selectedSecondaryIds.has(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`bg-white rounded-3xl p-4 sm:p-5 border-2 transition-all flex flex-col justify-between group space-y-3.5 overflow-hidden print:border-gray-400 print:shadow-none print:break-inside-avoid ${
                          isSelected
                            ? 'border-amber-500 ring-2 ring-amber-400/40 bg-amber-50/20 shadow-md'
                            : 'border-slate-200 hover:border-amber-400 hover:shadow-lg'
                        }`}
                      >
                        {/* Upper Content Container */}
                        <div className="space-y-3">
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
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {item.emoji && <span className="text-2xl select-none shrink-0">{item.emoji}</span>}
                                <h3 className="font-bubble text-2xl font-black text-slate-800 tracking-wide group-hover:text-amber-700 transition-colors break-words">
                                  {item.word}
                                </h3>
                              </div>

                              <button
                                type="button"
                                onClick={() => speakText(item.word, { rate: speedRate })}
                                title="คลิกเพื่อฟังเสียงอ่านภาษาอังกฤษ"
                                className="print:hidden w-9 h-9 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-700 flex items-center justify-center transition active:scale-90 cursor-pointer shadow-2xs shrink-0"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Phonetics */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-mono text-slate-500 font-semibold">{item.phoneticIPA}</span>
                              <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
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

                        {/* Card Action Footer: 3 distinct, balanced action buttons that never overflow */}
                        <div className="print:hidden pt-3 border-t border-slate-100 grid grid-cols-3 gap-1.5 sm:gap-2">
                          {/* 1. Tracing Worksheet */}
                          <button
                            type="button"
                            onClick={() => handlePrintSingleSecondaryWord(item, 'tracing')}
                            title={`สร้างใบงานฝึกคัดลายมือตามรอยประ 4 เส้น สำหรับคำว่า "${item.word}"`}
                            className="px-2 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black text-xs flex items-center justify-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer ring-1 ring-amber-300/50"
                          >
                            <PenTool className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">คัดคำนี้</span>
                          </button>

                          {/* 2. Print Flashcard / Materials */}
                          <button
                            type="button"
                            onClick={() => handlePrintSingleSecondaryWord(item)}
                            title={`เปิดตัวอย่างพิมพ์สื่อการสอนคำว่า "${item.word}"`}
                            className="px-2 py-2 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-900 font-extrabold text-xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer border border-slate-200 hover:border-amber-300"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">พิมพ์</span>
                          </button>

                          {/* 3. Spelling Game */}
                          <button
                            type="button"
                            onClick={() => handleLaunchSpellingGame(item.id)}
                            title={`เล่นเกมสะกดคำ ${item.word}`}
                            className="px-2 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-extrabold text-xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer border border-orange-200 hover:border-orange-300"
                          >
                            <Gamepad2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                            <span className="truncate">สะกดคำนี้</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

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

            {/* Vowel Filter Pills: เรียงแบบ flex-wrap มองเห็นครบถ้วนไม่ถูกตัดขอบ */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedVowel('all');
                  setSelectedFamily('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedVowel === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
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
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                      isSel
                        ? `${info.borderColor} ${info.bgLight} ${info.textColor} shadow-xs font-black`
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{info.icon}</span>
                    <span>
                      {info.name} ({count})
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
