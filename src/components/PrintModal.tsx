import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PhonicsWord, PhonicsVowel, VowelCategory } from '../types/phonics';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  PHONICS_WORDS,
  SHORT_VOWELS,
  LONG_VOWELS,
  DIPHTHONG_VOWELS,
  VOWEL_INFO_MAP,
  LETTER_PHONICS_MAP,
} from '../data/phonicsData';
import {
  SECONDARY_VOCABULARY,
  SecondaryVocabWord,
  SecondaryGrade,
  VOCAB_TOPICS,
  VocabTopic,
  GRADE_BADGES,
} from '../data/secondaryVocabData';
import {
  Printer,
  Loader2,
  FileDown,
  Eye,
  FileText,
  Scissors,
  CheckCircle2,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  PenTool,
  ExternalLink,
  GraduationCap,
  BookOpen,
  FileSpreadsheet,
} from 'lucide-react';
import { exportPrintableWordsToExcel } from '../utils/excelExport';
import {
  TracingWorksheet,
  TracingExerciseCard,
  PenmanshipTracingLine,
  BlankHandwritingPracticeLine,
  HandwritingFontType,
} from './TracingWorksheet';

export type PrintTemplate = 'flashcards' | 'worksheet' | 'tracing' | 'wordlist' | 'chart';
export type WordSource = 'phonics' | 'secondary';

export interface PrintableWord extends PhonicsWord {
  isSecondary?: boolean;
  secondaryGrade?: SecondaryGrade;
  secondaryPos?: string;
  secondaryTopic?: VocabTopic;
  secondarySynonyms?: string[];
}

export const secondaryToPrintableWord = (w: SecondaryVocabWord): PrintableWord => ({
  id: w.id,
  word: w.word,
  vowel: 'a',
  vowelCategory: 'short',
  family: `${w.grade} • ${w.pos}`,
  pattern: w.pos,
  meaningTh: w.meaningTh,
  phoneticIPA: w.phoneticIPA,
  phoneticTh: w.phoneticTh,
  letters: w.word.split('').map((char) => ({
    letter: char,
    soundIpa: '',
    soundTh: char,
  })),
  sentence: w.sentence,
  sentenceTh: w.sentenceTh,
  emoji: w.emoji || '📖',
  difficulty: 1,
  isSecondary: true,
  secondaryGrade: w.grade,
  secondaryPos: w.pos,
  secondaryTopic: w.topic,
  secondarySynonyms: w.synonyms,
});

export interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Phonics initial props
  initialWord?: PhonicsWord;
  initialVowel?: PhonicsVowel | 'all';
  initialCategory?: VowelCategory;
  initialTemplate?: PrintTemplate;
  // Secondary vocabulary initial props
  initialSource?: WordSource;
  initialSecondaryGrade?: SecondaryGrade | 'all' | 'lower' | 'upper';
  initialSecondaryTopic?: VocabTopic | 'all';
  initialSecondaryWords?: SecondaryVocabWord[];
  initialSecondaryWord?: SecondaryVocabWord;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  initialWord,
  initialVowel = 'all',
  initialCategory,
  initialTemplate,
  initialSource = 'phonics',
  initialSecondaryGrade = 'all',
  initialSecondaryTopic = 'all',
  initialSecondaryWords,
  initialSecondaryWord,
}) => {
  const [viewMode, setViewMode] = useState<'single' | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'preview' | 'pdf'>('preview');
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [printNotice, setPrintNotice] = useState<string>('');

  // Vocabulary Source: 'phonics' (395 คำ) หรือ 'secondary' (ม.1 - ม.6)
  const [wordSource, setWordSource] = useState<WordSource>(initialSource);

  // Secondary Vocabulary filters
  const [selectedSecondaryGrade, setSelectedSecondaryGrade] = useState<SecondaryGrade | 'all' | 'lower' | 'upper'>(
    initialSecondaryGrade || (initialSecondaryWord?.grade || 'all')
  );
  const [selectedSecondaryTopic, setSelectedSecondaryTopic] = useState<VocabTopic | 'all'>(
    initialSecondaryTopic || 'all'
  );
  const [useCustomSelectionOnly, setUseCustomSelectionOnly] = useState<boolean>(
    Boolean(initialSecondaryWords && initialSecondaryWords.length > 0)
  );

  // Paper Size: 'a4' (210x297mm) or 'a5' (148x210mm)
  const [paperSize, setPaperSize] = useState<'a4' | 'a5'>('a4');

  // Template and Filter states
  const [template, setTemplate] = useState<PrintTemplate>(initialTemplate || 'flashcards');
  const [selectedCategory, setSelectedCategory] = useState<VowelCategory | 'all'>(
    initialCategory || (initialWord?.vowelCategory ? initialWord.vowelCategory : 'all')
  );
  const [selectedVowel, setSelectedVowel] = useState<PhonicsVowel | 'all'>(
    initialWord?.vowel || initialVowel
  );
  const [wordLimit, setWordLimit] = useState<number | 'all'>('all');
  const [showMeaning, setShowMeaning] = useState<boolean>(true);
  const [showPhonetic, setShowPhonetic] = useState<boolean>(true);
  const [showCutLines, setShowCutLines] = useState<boolean>(true);
  const [showStudentHeader, setShowStudentHeader] = useState<boolean>(true);
  const [handwritingColorMode, setHandwritingColorMode] = useState<'bw' | 'color'>('bw');
  const [handwritingFont, setHandwritingFont] = useState<HandwritingFontType>('fredoka');
  const [showStartDot, setShowStartDot] = useState<boolean>(true);
  const [onlyCurrentWord, setOnlyCurrentWord] = useState<boolean>(!!initialWord || !!initialSecondaryWord);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const printableContainerRef = useRef<HTMLDivElement>(null);

  // Synchronize initial props on open
  useEffect(() => {
    if (isOpen) {
      try {
        const params = new URLSearchParams(window.location.search);
        const tpl = (params.get('template') as PrintTemplate) || initialTemplate;
        if (tpl) setTemplate(tpl);
        const paper = params.get('paper');
        if (paper === 'a5' || paper === 'a4') setPaperSize(paper);
        const font = params.get('font');
        if (font === 'fredoka' || font === 'school' || font === 'nunito') setHandwritingFont(font);
        const mode = params.get('mode');
        if (mode === 'bw' || mode === 'color') setHandwritingColorMode(mode);

        const srcParam = params.get('source') as WordSource | null;
        if (srcParam === 'secondary' || srcParam === 'phonics') {
          setWordSource(srcParam);
        } else if (initialSource) {
          setWordSource(initialSource);
        }

        const gradeParam = params.get('grade') as SecondaryGrade | 'all' | 'lower' | 'upper' | null;
        if (gradeParam) {
          setSelectedSecondaryGrade(gradeParam);
        } else if (initialSecondaryGrade) {
          setSelectedSecondaryGrade(initialSecondaryGrade);
        }

        const topicParam = params.get('topic') as VocabTopic | 'all' | null;
        if (topicParam) {
          setSelectedSecondaryTopic(topicParam);
        } else if (initialSecondaryTopic) {
          setSelectedSecondaryTopic(initialSecondaryTopic);
        }
      } catch {}

      if (initialSource === 'secondary') {
        setWordSource('secondary');
        if (initialSecondaryWord) {
          setOnlyCurrentWord(true);
          setSelectedSecondaryGrade(initialSecondaryWord.grade);
          setUseCustomSelectionOnly(false);
        } else if (initialSecondaryWords && initialSecondaryWords.length > 0) {
          setOnlyCurrentWord(false);
          setUseCustomSelectionOnly(true);
          if (initialSecondaryGrade) setSelectedSecondaryGrade(initialSecondaryGrade);
          if (initialSecondaryTopic) setSelectedSecondaryTopic(initialSecondaryTopic);
        } else {
          setOnlyCurrentWord(false);
          setUseCustomSelectionOnly(false);
          if (initialSecondaryGrade) setSelectedSecondaryGrade(initialSecondaryGrade);
          if (initialSecondaryTopic) setSelectedSecondaryTopic(initialSecondaryTopic);
        }
      } else {
        setWordSource('phonics');
        if (initialWord) {
          setOnlyCurrentWord(true);
          setSelectedCategory(initialWord.vowelCategory || 'short');
          setSelectedVowel(initialWord.vowel);
          setWordLimit('all');
        } else {
          setOnlyCurrentWord(false);
          if (initialCategory) setSelectedCategory(initialCategory);
          if (initialVowel) setSelectedVowel(initialVowel);
          setWordLimit('all');
        }
      }
      setCurrentPageIndex(0);
      setActiveTab('preview');
      setViewMode('all');
    }
  }, [
    isOpen,
    initialWord,
    initialVowel,
    initialCategory,
    initialTemplate,
    initialSource,
    initialSecondaryGrade,
    initialSecondaryTopic,
    initialSecondaryWords,
    initialSecondaryWord,
  ]);

  // เมื่อเปิดผ่าน Standalone Tab ที่มี ?print=true สั่งเปิดหน้าต่างเลือกเครื่องพิมพ์ทันที
  useEffect(() => {
    if (isOpen) {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('print') === 'true') {
          const timer = setTimeout(() => {
            window.focus();
            window.print();
          }, 800);
          return () => clearTimeout(timer);
        }
      } catch {}
    }
  }, [isOpen]);

  // Filter pool of words (supports both Secondary and Phonics)
  const printWords: PrintableWord[] = useMemo(() => {
    if (wordSource === 'secondary') {
      if (onlyCurrentWord && initialSecondaryWord) {
        return [secondaryToPrintableWord(initialSecondaryWord)];
      }

      if (useCustomSelectionOnly && initialSecondaryWords && initialSecondaryWords.length > 0) {
        let selectedList = initialSecondaryWords;
        if (wordLimit !== 'all') {
          selectedList = selectedList.slice(0, wordLimit);
        }
        return selectedList.map(secondaryToPrintableWord);
      }

      let list = SECONDARY_VOCABULARY;

      if (selectedSecondaryGrade === 'lower') {
        list = list.filter((w) => w.level === 'lower');
      } else if (selectedSecondaryGrade === 'upper') {
        list = list.filter((w) => w.level === 'upper');
      } else if (selectedSecondaryGrade !== 'all') {
        list = list.filter((w) => w.grade === selectedSecondaryGrade);
      }

      if (selectedSecondaryTopic !== 'all') {
        list = list.filter((w) => w.topic === selectedSecondaryTopic);
      }

      if (wordLimit !== 'all') {
        list = list.slice(0, wordLimit);
      }

      return list.map(secondaryToPrintableWord);
    }

    // Default: Phonics Words
    if (onlyCurrentWord && initialWord) {
      return [initialWord];
    }

    let list = PHONICS_WORDS;

    if (selectedCategory !== 'all') {
      list = list.filter((w) => {
        if (selectedCategory === 'short') return !w.vowelCategory || w.vowelCategory === 'short';
        return w.vowelCategory === selectedCategory;
      });
    }

    if (selectedVowel !== 'all') {
      list = list.filter((w) => w.vowel === selectedVowel);
    }

    if (wordLimit !== 'all') {
      return list.slice(0, wordLimit);
    }

    return list;
  }, [
    wordSource,
    onlyCurrentWord,
    initialSecondaryWord,
    useCustomSelectionOnly,
    initialSecondaryWords,
    selectedSecondaryGrade,
    selectedSecondaryTopic,
    selectedCategory,
    selectedVowel,
    wordLimit,
    initialWord,
  ]);

  // Paginated chunks to guarantee exact A4 / A5 pages
  const pages: PrintableWord[][] = useMemo(() => {
    if (template === 'chart') {
      return [printWords];
    }

    const pageSize =
      paperSize === 'a5'
        ? template === 'flashcards'
          ? 4 // 2x2 on A5
          : template === 'worksheet'
          ? 2 // 2 handwriting exercises on A5
          : template === 'tracing'
          ? 2 // 2 tracing exercises on A5
          : 8 // 8 words on A5 wordlist
        : template === 'flashcards'
        ? 8 // 2 columns x 4 rows
        : template === 'worksheet'
        ? 4 // 4 exercises per A4 page (คัดลายมือ 4 คำต่อหน้า)
        : template === 'tracing'
        ? 4 // 4 comprehensive tracing exercises per A4 page (4 คำต่อหน้า)
        : 15; // 15 words per page

    const chunks: PrintableWord[][] = [];
    for (let i = 0; i < printWords.length; i += pageSize) {
      chunks.push(printWords.slice(i, i + pageSize));
    }
    return chunks.length > 0 ? chunks : [[]];
  }, [printWords, template, paperSize]);

  // Keep page index within bounds
  useEffect(() => {
    if (currentPageIndex >= pages.length) {
      setCurrentPageIndex(Math.max(0, pages.length - 1));
    }
  }, [pages.length, currentPageIndex]);

  // ตรวจสอบว่าแอปกำลังทำงานอยู่ใน Iframe หรือไม่
  const isInIframe = useMemo(() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }, []);

  // ตรวจสอบว่าเปิดผ่าน Standalone Tab สำหรับพิมพ์โดยตรงหรือไม่
  const isStandalonePrint = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('print') === 'true';
    } catch {
      return false;
    }
  }, []);

  // สร้าง URL สำหรับเปิดหน้าต่างพิมพ์ในแท็บเต็ม (เปิด System Print Dialog โดยตรง 100%)
  const standalonePrintUrl = useMemo(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('print', 'true');
      url.searchParams.set('template', template);
      url.searchParams.set('paper', paperSize);
      url.searchParams.set('font', handwritingFont);
      url.searchParams.set('mode', handwritingColorMode);
      url.searchParams.set('source', wordSource);

      if (wordSource === 'secondary') {
        url.searchParams.set('grade', selectedSecondaryGrade);
        url.searchParams.set('topic', selectedSecondaryTopic);
        if (onlyCurrentWord && initialSecondaryWord) {
          url.searchParams.set('word', initialSecondaryWord.id);
        } else {
          url.searchParams.delete('word');
        }
      } else {
        url.searchParams.set('cat', selectedCategory);
        url.searchParams.set('vowel', selectedVowel);
        if (onlyCurrentWord && initialWord) {
          url.searchParams.set('word', initialWord.id);
        } else {
          url.searchParams.delete('word');
        }
      }
      return url.toString();
    } catch {
      return '';
    }
  }, [
    wordSource,
    selectedSecondaryGrade,
    selectedSecondaryTopic,
    initialSecondaryWord,
    template,
    selectedCategory,
    selectedVowel,
    paperSize,
    handwritingFont,
    handwritingColorMode,
    onlyCurrentWord,
    initialWord,
  ]);

  if (!isOpen) return null;

  // Build descriptive PDF file name
  const getPdfFileName = () => {
    if (wordSource === 'secondary') {
      const gradePart = selectedSecondaryGrade === 'all' ? 'All_Grades' : selectedSecondaryGrade.replace('.', '');
      const singleSuffix = onlyCurrentWord && initialSecondaryWord ? `_${initialSecondaryWord.word}` : '';
      const sizeSuffix = `_${paperSize.toUpperCase()}`;
      return `SecondaryVocab_${template}_${gradePart}${singleSuffix}${sizeSuffix}.pdf`;
    }

    const catName =
      selectedCategory === 'short'
        ? 'ShortVowels'
        : selectedCategory === 'long'
        ? 'LongVowels'
        : selectedCategory === 'diphthong'
        ? 'Diphthongs'
        : 'All';
    const vowelSuffix = selectedVowel !== 'all' ? `_${selectedVowel}` : '';
    const singleSuffix = onlyCurrentWord && initialWord ? `_${initialWord.word}` : '';
    const sizeSuffix = `_${paperSize.toUpperCase()}`;
    return `Phonics_${template}_${catName}${vowelSuffix}${singleSuffix}${sizeSuffix}.pdf`;
  };

  // =========================================================================
  // ฟังก์ชันพิมพ์ผ่าน Iframe ซ่อน (Fallback Print Iframe)
  // ช่วยให้พิมพ์ออกเครื่องพิมพ์ได้แน่นอน 100% แม้อยู่ใน Iframe หรือเบราว์เซอร์ที่มีข้อจำกัด
  // =========================================================================
  const printViaIframeFallback = (element: HTMLElement) => {
    try {
      const frameId = 'phonics-hidden-print-iframe';
      const existing = document.getElementById(frameId);
      if (existing) existing.remove();

      const iframe = document.createElement('iframe');
      iframe.id = frameId;
      iframe.setAttribute('style', 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;');
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document;
      if (!frameDoc) return false;

      // รวบรวม stylesheet และ style tags ทั้งหมดเพื่อให้ฟอนต์และสไตล์ตรงกัน 100%
      let styles = '';
      document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
        styles += node.outerHTML;
      });

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html lang="th">
          <head>
            <meta charset="UTF-8" />
            <title>Phonics Kids - พิมพ์ใบงาน</title>
            ${styles}
            <style>
              @page { size: A4 portrait; margin: 6mm 8mm; }
              html, body {
                background: #ffffff !important;
                color: #0f172a !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                font-family: 'Nunito', 'Mitr', sans-serif;
              }
              *, *::before, *::after {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .phonics-a4-page {
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                width: 100% !important;
                max-width: 100% !important;
                height: 284mm !important;
                min-height: 284mm !important;
                max-height: 285mm !important;
                page-break-after: always !important;
                break-after: page !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                box-shadow: none !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 12px !important;
                padding: 6mm 8mm !important;
                margin: 0 !important;
                box-sizing: border-box !important;
                background: #ffffff !important;
                overflow: hidden !important;
              }
              .phonics-a5-page {
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                width: 100% !important;
                max-width: 100% !important;
                height: 198mm !important;
                min-height: 198mm !important;
                max-height: 200mm !important;
                page-break-after: always !important;
                break-after: page !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                box-shadow: none !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 10px !important;
                padding: 4mm 6mm !important;
                margin: 0 !important;
                box-sizing: border-box !important;
                background: #ffffff !important;
                overflow: hidden !important;
              }
              .phonics-a4-page:last-child, .phonics-a5-page:last-child {
                page-break-after: auto !important;
                break-after: auto !important;
              }
            </style>
          </head>
          <body>
            ${element.outerHTML}
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.warn('Iframe print error:', err);
        }
      }, 350);

      return true;
    } catch (err) {
      console.error('printViaIframeFallback failed:', err);
      return false;
    }
  };

  // =========================================================================
  // ฟังก์ชันสั่งพิมพ์ออกเครื่องปริ้น: เปิดหน้าต่างเลือกเครื่องปริ้น (System Print Dialog)
  // รอให้ DOM และ Font โหลดเสร็จ แล้วเรียก window.print() พร้อมระบบ Fallback
  // =========================================================================
  const handleDirectPrint = async (scope: 'all' | 'current' | React.MouseEvent = 'all') => {
    const actualScope = scope === 'current' ? 'current' : 'all';
    setIsPreparingPrint(true);
    setPrintNotice(`🖨️ กำลังเปิดหน้าต่างเลือกเครื่องพิมพ์ (Print Dialog)...`);

    // สลับมาที่แท็บตัวอย่างเสมอเพื่อให้เอกสารแสดงพร้อมพิมพ์
    setActiveTab('preview');

    const wasSingle = viewMode === 'single';
    if (actualScope === 'all' && wasSingle) {
      setViewMode('all');
    }

    // รอให้ React เรนเดอร์ DOM และฟอนต์ให้พร้อมก่อนสั่งพิมพ์ (ป้องกันพิมพ์หน้าว่างหรือพิมพ์ไม่ครบ)
    await new Promise((r) => setTimeout(r, 180));
    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
    } catch {}

    // กำหนด attribute สำหรับควบคุมการพิมพ์ใน @media print
    const docEl = printableContainerRef.current || document.getElementById('phonics-printable-document');
    if (docEl) {
      docEl.setAttribute('data-print-scope', actualScope);
    }

    // ทำเครื่องหมายหน้าที่กำลังเลือกอยู่
    const pageNodes = document.querySelectorAll<HTMLElement>('.phonics-a4-page, .phonics-a5-page');
    pageNodes.forEach((node, idx) => {
      node.setAttribute('data-page-active', idx === currentPageIndex ? 'true' : 'false');
    });

    // สั่งพิมพ์ทันทีผ่าน window.print() ตรงๆ (เปิดหน้าต่างเลือกเครื่องพิมพ์)
    try {
      window.focus();
      window.print();
    } catch (err) {
      console.warn('window.print() encountered an issue, trying iframe print fallback:', err);
      if (docEl) {
        printViaIframeFallback(docEl);
      }
    } finally {
      setIsPreparingPrint(false);
      setTimeout(() => {
        setPrintNotice('');
        if (docEl) {
          docEl.removeAttribute('data-print-scope');
        }
        if (wasSingle && actualScope === 'all') {
          setViewMode('single');
        }
      }, 2500);
    }
  };

  // =========================================================================
  // ฟังก์ชันสร้างและดาวน์โหลดไฟล์ PDF (.pdf) บันทึกลงเครื่อง พร้อมสั่งพิมพ์
  // =========================================================================
  const handleDownloadPdf = async (customFileName?: string, downloadScope: 'all' | 'current' = 'all') => {
    setIsGeneratingPdf(true);
    setDownloadSuccess(false);
    setPdfStatus(`กำลังสร้างไฟล์ PDF (${paperSize.toUpperCase()})...`);
    setActiveTab('preview');
    const wasSingle = viewMode === 'single';
    if (downloadScope === 'all' && wasSingle) {
      setViewMode('all');
    }

    // รอให้หน้าต่างและ DOM เรนเดอร์ครบถ้วน
    await new Promise((r) => setTimeout(r, 200));

    try {
      const docEl = printableContainerRef.current || document.getElementById('phonics-printable-document');
      if (!docEl) {
        throw new Error('ไม่พบเอกสาร');
      }

      let pageEls = Array.from(docEl.querySelectorAll<HTMLElement>('.phonics-a4-page, .phonics-a5-page'));
      if (pageEls.length === 0) {
        throw new Error('ไม่พบหน้าเอกสาร');
      }

      if (downloadScope === 'current') {
        const targetPage = pageEls[currentPageIndex] || pageEls[0];
        pageEls = [targetPage];
      }

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: paperSize === 'a5' ? 'a5' : 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pageEls.length; i++) {
        setPdfStatus(`กำลังแปลงหน้า ${i + 1} จาก ${pageEls.length}...`);
        const page = pageEls[i];

        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: paperSize === 'a5' ? 768 : 1024,
          scrollX: 0,
          scrollY: 0,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage(paperSize === 'a5' ? 'a5' : 'a4', 'portrait');
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }

      const fileName = customFileName || getPdfFileName();
      pdf.save(fileName);

      setDownloadSuccess(true);
      setPdfStatus(`บันทึกไฟล์ ${fileName} สำเร็จ!`);
      setTimeout(() => {
        setIsGeneratingPdf(false);
        setDownloadSuccess(false);
        setPdfStatus('');
        if (wasSingle && downloadScope === 'all') {
          setViewMode('single');
        }
      }, 2500);
    } catch (err) {
      console.warn('Direct PDF canvas generation error, falling back to window.print():', err);
      setIsGeneratingPdf(false);
      setPdfStatus('');
      window.focus();
      window.print();
    }
  };

  return (
    <div className="phonics-print-modal-container fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="phonics-print-dialog-card bg-white rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Banner เมื่อเปิดผ่านแท็บเต็ม เพื่อสั่งพิมพ์ตรง */}
        {isStandalonePrint && (
          <div className="bg-emerald-600 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md print:hidden">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500 rounded-xl shrink-0">
                <Printer className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <div className="font-bold text-sm">
                  🖨️ หน้าต่างเลือกเครื่องพิมพ์ (System Print Dialog) กำลังเปิด...
                </div>
                <div className="text-xs text-emerald-100">
                  หากหน้าต่างพิมพ์ไม่เปิดขึ้นมาอัตโนมัติ ให้คลิกปุ่ม &quot;เปิดหน้าต่างพิมพ์อีกครั้ง&quot; สีขาวด้านขวา
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  window.focus();
                  window.print();
                }}
                className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-emerald-700" />
                <span>เปิดหน้าต่างพิมพ์อีกครั้ง</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf()}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <FileDown className="w-4 h-4" />
                <span>ดาวน์โหลด PDF</span>
              </button>
            </div>
          </div>
        )}

        {/* Header แถบควบคุมด้านบน (ซ่อนเมื่อสั่งพิมพ์) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 sm:px-6 py-3 border-b border-slate-200 bg-slate-50 gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 rounded-xl text-white shadow-sm shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-800">ศูนย์สร้างไฟล์ PDF & สั่งพิมพ์</h2>
                <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                  {wordSource === 'secondary'
                    ? `ม.1 - ม.6 (${printWords.length.toLocaleString()} คำ)`
                    : `สระโฟนิกส์ (${printWords.length} คำ)`}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {wordSource === 'secondary'
                  ? 'พิมพ์บัตรคำศัพท์ ใบงานคัดลายมือ หรือตารางคำศัพท์ระดับชั้น ม.1 - ม.6'
                  : 'ขนาด A4 มาตรฐาน พร้อมพิมพ์ออกเครื่องปริ้นและดาวน์โหลดเป็นไฟล์ PDF (คัดลายมือ 4 คำต่อหน้า)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
            {/* Word Source Switcher */}
            <div className="inline-flex p-0.5 rounded-xl bg-slate-200 border border-slate-300">
              <button
                type="button"
                onClick={() => {
                  setWordSource('secondary');
                  setOnlyCurrentWord(false);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  wordSource === 'secondary'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>คำศัพท์ ม.1 - ม.6</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setWordSource('phonics');
                  setOnlyCurrentWord(false);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  wordSource === 'phonics'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>สระโฟนิกส์</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'pdf'
                  ? 'bg-amber-500 text-white shadow-sm font-bold'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>หน้าไฟล์ PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-amber-500 text-white shadow-sm font-bold'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>ตัวอย่างกระดาษ A4</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSettings((prev) => !prev)}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                showSettings
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
              }`}
              title="ตั้งค่ารูปแบบเอกสาร"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ตั้งค่าเอกสาร</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="ml-2 text-slate-400 hover:text-slate-700 font-bold text-lg p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Helper Banner for AI Studio / Iframe Environments */}
        {isInIframe && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 flex items-center justify-between text-xs text-amber-900 print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-base">💡</span>
              <span>
                หากเบราว์เซอร์บล็อกหน้าต่างพิมพ์ในโหมดพรีวิว ให้กดปุ่มสีเขียว <strong>"สั่งพิมพ์ออกเครื่องปริ้น (เปิดหน้าต่างพิมพ์ ↗)"</strong> เพื่อเปิดหน้าต่างเลือกเครื่องพิมพ์ (System Print Dialog) ในแท็บใหม่ทันที หรือเลือก <strong>"ดาวน์โหลด .pdf"</strong>
              </span>
            </div>
            {standalonePrintUrl && (
              <a
                href={standalonePrintUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] shrink-0"
              >
                <span>เปิดแท็บพิมพ์ ↗</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Action Toolbar แถบปุ่มสั่งการ (ซ่อนเมื่อสั่งพิมพ์) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-2.5 bg-slate-100 border-b border-slate-200 shrink-0 print:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            {/* ปุ่มหลัก 1: เปิดหน้าต่างเลือกเครื่องพิมพ์ (System Print Dialog) ผ่าน Standalone Tab (ได้ผล 100% แม้โดน Sandbox บล็อก) */}
            {standalonePrintUrl && (
              <a
                href={standalonePrintUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="เปิดหน้าต่างเลือกเครื่องพิมพ์ (System Print Dialog) ผ่านแท็บเต็ม ได้ผลแน่นอน 100%"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>🖨️ สั่งพิมพ์ออกเครื่องปริ้น (เปิดหน้าต่างพิมพ์ ↗)</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
              </a>
            )}

            {/* ปุ่มหลัก 2: สั่งพิมพ์ในหน้านี้ (In-Page Print Dialog) */}
            <button
              type="button"
              onClick={() => handleDirectPrint('all')}
              disabled={isPreparingPrint || isGeneratingPdf}
              title="สั่งพิมพ์ออกเครื่องปริ้นทันทีภายในหน้านี้"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>พิมพ์ตรงในหน้านี้</span>
            </button>

            {/* ปุ่มพิมพ์เฉพาะหน้านี้ กรณีมีหลายหน้า */}
            {pages.length > 1 && (
              <button
                type="button"
                onClick={() => handleDirectPrint('current')}
                disabled={isPreparingPrint || isGeneratingPdf}
                title={`สั่งพิมพ์เฉพาะหน้า ${currentPageIndex + 1} ออกเครื่องปริ้น`}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <span>📄 พิมพ์เฉพาะหน้า {currentPageIndex + 1}</span>
              </button>
            )}

            {/* ปุ่มดาวน์โหลดไฟล์ PDF */}
            <button
              type="button"
              onClick={() => handleDownloadPdf()}
              disabled={isGeneratingPdf}
              title="สร้างและบันทึกเป็นไฟล์ .pdf ในเครื่องคอมพิวเตอร์"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{pdfStatus || 'กำลังสร้าง PDF...'}</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>บันทึก PDF สำเร็จ! 🎉</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>📥 ดาวน์โหลด .pdf (4 คำต่อหน้า)</span>
                </>
              )}
            </button>

            {/* ปุ่มส่งออกเป็นไฟล์ Excel (.xlsx) */}
            <button
              type="button"
              onClick={() => {
                const title =
                  wordSource === 'secondary'
                    ? `ตารางสรุปคำศัพท์_${selectedSecondaryGrade === 'all' ? 'ม1-ม6' : selectedSecondaryGrade}_${selectedSecondaryTopic === 'all' ? 'ทุกหมวด' : selectedSecondaryTopic}`
                    : `ตารางสรุปคำศัพท์โฟนิกส์_${selectedCategory === 'all' ? 'ทั้งหมด' : selectedCategory}`;
                exportPrintableWordsToExcel(printWords, title);
                setPrintNotice(`ส่งออกตารางคำศัพท์ ${printWords.length.toLocaleString()} คำ เป็นไฟล์ Excel (.xlsx) เรียบร้อยแล้ว! 📊✨`);
              }}
              title="ส่งออกตารางคำศัพท์ชุดนี้ทั้งหมดเป็นไฟล์ Excel (.xlsx) พร้อมสูตรและตัวกรอง"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>📥 ส่งออก Excel ({printWords.length.toLocaleString()} คำ)</span>
            </button>
          </div>

        {/* ข้อความแจ้งเตือนสถานะการพิมพ์ */}
        {printNotice && (
          <div className="w-full bg-emerald-50 border-t border-emerald-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900 print:hidden animate-fade-in">
            <div className="flex items-center gap-2 flex-wrap">
              <Printer className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
              <span className="font-semibold">{printNotice}</span>
              {standalonePrintUrl && (
                <a
                  href={standalonePrintUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg shadow-xs text-xs transition"
                >
                  <span>คลิกเปิดหน้าต่างเลือกเครื่องพิมพ์ทันที (System Dialog) ↗</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPrintNotice('')}
              className="text-emerald-700 hover:text-emerald-950 font-bold px-2 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

          <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
            {/* สลับมุมมองทุกหน้า / ทีละหน้า */}
            <div className="flex items-center gap-1.5">
              <span>โหมดมุมมอง:</span>
              <div className="inline-flex p-0.5 rounded-lg bg-slate-200 border border-slate-300">
                <button
                  type="button"
                  onClick={() => setViewMode('all')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                    viewMode === 'all'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  แสดงทุกหน้า ({pages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('single')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                    viewMode === 'single'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทีละหน้า
                </button>
              </div>
            </div>

            {/* ปุ่มเปลี่ยนหน้ากรณีดูทีละหน้า */}
            {viewMode === 'single' && pages.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPageIndex === 0}
                  onClick={() => setCurrentPageIndex((p) => Math.max(0, p - 1))}
                  className="p-1 rounded bg-white border border-slate-300 text-slate-700 disabled:opacity-30 hover:bg-slate-50 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-bold text-slate-800 text-[11px]">
                  {currentPageIndex + 1}/{pages.length}
                </span>
                <button
                  type="button"
                  disabled={currentPageIndex === pages.length - 1}
                  onClick={() => setCurrentPageIndex((p) => Math.min(pages.length - 1, p + 1))}
                  className="p-1 rounded bg-white border border-slate-300 text-slate-700 disabled:opacity-30 hover:bg-slate-50 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* แผงตัวเลือกปรับแต่งเอกสาร (Collapsible Settings) */}
        {showSettings && (
          <div className="px-5 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-700 space-y-2.5 shrink-0 print:hidden">
            {/* เลือกรูปแบบเอกสาร */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setTemplate('flashcards')}
                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                  template === 'flashcards'
                    ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Scissors className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="font-bold">1. แฟลชการ์ด</div>
                  <div className="text-[10px] text-slate-500">8 คำ/หน้า พร้อมรอยประ ✂️</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTemplate('worksheet')}
                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                  template === 'worksheet'
                    ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-base shrink-0">📝</span>
                <div>
                  <div className="font-bold">2. ใบงานคัดลายมือ</div>
                  <div className="text-[10px] text-slate-500">4 คำ/หน้า คัดคำศัพท์</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTemplate('tracing')}
                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                  template === 'tracing'
                    ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <PenTool className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="font-bold">3. เขียนตามรอยประ</div>
                  <div className="text-[10px] text-slate-500">4 คำ/หน้า เส้นประมาตรฐาน ✏️</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTemplate('wordlist')}
                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                  template === 'wordlist'
                    ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-base shrink-0">📚</span>
                <div>
                  <div className="font-bold">4. ตารางสรุปคำศัพท์</div>
                  <div className="text-[10px] text-slate-500">15 คำ/หน้า พร้อมความหมาย</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTemplate('chart')}
                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                  template === 'chart'
                    ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-base shrink-0">🦁</span>
                <div>
                  <div className="font-bold">5. โปสเตอร์โฟนิกส์</div>
                  <div className="text-[10px] text-slate-500">แผ่นชาร์ตสรุปสระ A-Z</div>
                </div>
              </button>
            </div>

            {/* ตัวเลือกหมวดหมู่และจำนวนคำ */}
            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-200">
              {wordSource === 'secondary' ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">ระดับชั้น:</span>
                    <select
                      value={selectedSecondaryGrade}
                      onChange={(e) => {
                        setSelectedSecondaryGrade(e.target.value as any);
                        setUseCustomSelectionOnly(false);
                      }}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 font-bold focus:outline-hidden"
                    >
                      <option value="all">ทั้งหมด ม.1 - ม.6 ({SECONDARY_VOCABULARY.length.toLocaleString()} คำ)</option>
                      <option value="lower">ม.ต้น (ม.1 - ม.3 O-NET)</option>
                      <option value="upper">ม.ปลาย (ม.4 - ม.6 TGAT/A-Level)</option>
                      <option value="ม.1">มัธยมศึกษาปีที่ 1 (ม.1)</option>
                      <option value="ม.2">มัธยมศึกษาปีที่ 2 (ม.2)</option>
                      <option value="ม.3">มัธยมศึกษาปีที่ 3 (ม.3)</option>
                      <option value="ม.4">มัธยมศึกษาปีที่ 4 (ม.4)</option>
                      <option value="ม.5">มัธยมศึกษาปีที่ 5 (ม.5)</option>
                      <option value="ม.6">มัธยมศึกษาปีที่ 6 (ม.6)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">หมวดสาระ:</span>
                    <select
                      value={selectedSecondaryTopic}
                      onChange={(e) => {
                        setSelectedSecondaryTopic(e.target.value as any);
                        setUseCustomSelectionOnly(false);
                      }}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 font-bold focus:outline-hidden"
                    >
                      <option value="all">ทุกหมวดสาระการเรียนรู้</option>
                      {VOCAB_TOPICS.map((top) => (
                        <option key={top} value={top}>
                          หมวด: {top}
                        </option>
                      ))}
                    </select>
                  </div>

                  {initialSecondaryWords && initialSecondaryWords.length > 0 && (
                    <label className="inline-flex items-center gap-1.5 cursor-pointer bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-300 text-amber-900 font-bold">
                      <input
                        type="checkbox"
                        checked={useCustomSelectionOnly}
                        onChange={(e) => setUseCustomSelectionOnly(e.target.checked)}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>เฉพาะ {initialSecondaryWords.length} คำที่เลือกจากคลัง</span>
                    </label>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-500">หมวดสระ:</span>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value as VowelCategory | 'all');
                        setSelectedVowel('all');
                      }}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 focus:outline-hidden"
                    >
                      <option value="all">ทั้งหมด (All Vowels)</option>
                      <option value="short">🟡 สระเสียงสั้น (Short Vowels)</option>
                      <option value="long">🟢 สระเสียงยาว (Long Vowels)</option>
                      <option value="diphthong">🟣 สระประสม (Diphthongs)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-500">สระเฉพาะ:</span>
                    <select
                      value={selectedVowel}
                      onChange={(e) => setSelectedVowel(e.target.value as PhonicsVowel | 'all')}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 focus:outline-hidden"
                    >
                      <option value="all">ทุกสระในหมวด</option>
                      {SHORT_VOWELS.map((v) => (
                        <option key={v} value={v}>
                          สระ {VOWEL_INFO_MAP[v].name} ({VOWEL_INFO_MAP[v].symbol})
                        </option>
                      ))}
                      {LONG_VOWELS.map((v) => (
                        <option key={v} value={v}>
                          {VOWEL_INFO_MAP[v].name} ({VOWEL_INFO_MAP[v].symbol})
                        </option>
                      ))}
                      {DIPHTHONG_VOWELS.map((v) => (
                        <option key={v} value={v}>
                          {VOWEL_INFO_MAP[v].name} ({VOWEL_INFO_MAP[v].symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* จำนวนคำ */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">จำนวนคำ:</span>
                <select
                  value={wordLimit}
                  onChange={(e) => setWordLimit(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-bold focus:outline-hidden"
                >
                  <option value="all">ทั้งหมด ({printWords.length} คำ)</option>
                  <option value={8}>8 คำ (1 หน้า)</option>
                  <option value={16}>16 คำ (2 หน้า)</option>
                  <option value={24}>24 คำ (3 หน้า)</option>
                  <option value={48}>48 คำ (6 หน้า)</option>
                  <option value={96}>96 คำ (12 หน้า)</option>
                </select>
              </div>

              {/* ขนาดกระดาษ */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">กระดาษ:</span>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as 'a4' | 'a5')}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-bold focus:outline-hidden"
                >
                  <option value="a4">A4 (210 × 297 มม.)</option>
                  <option value="a5">A5 (148 × 210 มม.)</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMeaning}
                    onChange={(e) => setShowMeaning(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span>ความหมายไทย</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPhonetic}
                    onChange={(e) => setShowPhonetic(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span>คำอ่านไทย & IPA</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCutLines}
                    onChange={(e) => setShowCutLines(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span>รอยประตัด ✂️</span>
                </label>
                {(template === 'tracing' || template === 'worksheet') && (
                  <div className="flex flex-wrap items-center gap-2.5 pt-1 sm:pt-0">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showStudentHeader}
                        onChange={(e) => setShowStudentHeader(e.target.checked)}
                        className="rounded text-amber-500"
                      />
                      <span>หัวกระดาษชื่อนักเรียน</span>
                    </label>

                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-700">ฟอนต์คัดลายมือ:</span>
                      <select
                        value={handwritingFont}
                        onChange={(e) => setHandwritingFont(e.target.value as HandwritingFontType)}
                        className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 font-bold"
                      >
                        <option value="fredoka">🌟 ตัวกลมเหมือนคำศัพท์ที่แสดง (Fredoka - แนะนำ)</option>
                        <option value="school">✏️ แบบเรียนมาตรฐาน (Edu AU School Hand)</option>
                        <option value="nunito">ตัวคลาสสิก (Nunito)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-700">สีบรรทัด:</span>
                      <select
                        value={handwritingColorMode}
                        onChange={(e) => setHandwritingColorMode(e.target.value as 'bw' | 'color')}
                        className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 font-bold"
                      >
                        <option value="bw">🖤 บรรทัดขาวดำ (B&W)</option>
                        <option value="color">🎨 แบบมีสี (Color)</option>
                      </select>
                    </div>

                    <label className="inline-flex items-center gap-1 cursor-pointer text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                      <input
                        type="checkbox"
                        checked={showStartDot}
                        onChange={(e) => setShowStartDot(e.target.checked)}
                        className="rounded text-black"
                      />
                      <span>จุดเริ่มจรดดินสอ •</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Body พื้นที่แสดงเนื้อหา */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200 printable-area">
          {/* TAB 1: ตัวอย่างกระดาษ A4 (A4 PRINT PREVIEW) - Always kept mounted so printing works reliably */}
          <div
            id="phonics-printable-document"
            ref={printableContainerRef}
            className={`space-y-6 print:space-y-0 w-full max-w-[210mm] mx-auto select-text ${
              activeTab === 'preview' ? 'block' : 'hidden print:block'
            }`}
          >
            {/* ===================================================================== */}
            {/* TEMPLATE 1: FLASHCARDS (8 PER A4 PAGE)                                 */}
            {/* ===================================================================== */}
            {template === 'flashcards' &&
              pages.map((pageWords, pageIdx) => {
                const isHiddenOnScreen = viewMode === 'single' && pageIdx !== currentPageIndex;
                return (
                  <div
                    key={pageIdx}
                    data-page-active={pageIdx === currentPageIndex}
                    className={`phonics-a4-page bg-white text-slate-900 shadow-lg print:shadow-none p-5 sm:p-7 border border-slate-300 w-full min-h-[297mm] flex flex-col justify-between rounded-xl relative ${
                      isHiddenOnScreen ? 'hidden print:flex' : 'flex'
                    }`}
                    style={{ boxSizing: 'border-box' }}
                  >
                    {/* Page Header */}
                    <div>
                      <div className="border-b-2 border-slate-800 pb-3 mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{wordSource === 'secondary' ? '🎓' : '🦁'}</span>
                          <div>
                            <h1 className="font-bubble text-xl sm:text-2xl font-black text-slate-900">
                              {wordSource === 'secondary'
                                ? 'คำศัพท์ภาษาอังกฤษ ม.1 - ม.6 — บัตรคำช่วยจำ (Flashcards)'
                                : 'Phonics Kids — บัตรคำศัพท์สำหรับตัด (Flashcards)'}
                            </h1>
                            <p className="text-xs text-slate-500 font-thai">
                              {wordSource === 'secondary'
                                ? `ตัดตามรอยประ ✂️ ทบทวนคำศัพท์ ระดับชั้น ${selectedSecondaryGrade === 'all' ? 'ม.1 - ม.6' : selectedSecondaryGrade}${selectedSecondaryTopic !== 'all' ? ` • หมวด: ${selectedSecondaryTopic}` : ''}`
                                : 'ตัดตามรอยประ ✂️ ฝึกออกเสียงและสะกดคำโฟนิกส์ภาษาอังกฤษ'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-xs text-slate-500 font-mono">
                          <div className="font-bold text-slate-700">หน้า {pageIdx + 1} / {pages.length}</div>
                          <div className="text-[10px] text-slate-400">ขนาด {paperSize.toUpperCase()}</div>
                        </div>
                      </div>

                      {/* Grid of Flashcards (2 columns x 4 rows) */}
                      <div className="grid grid-cols-2 gap-3.5">
                        {pageWords.map((w, idx) => {
                          const vowelInfo = VOWEL_INFO_MAP[w.vowel];
                          const isSec = w.isSecondary;
                          const secGrade = w.secondaryGrade;
                          const badge = secGrade ? GRADE_BADGES[secGrade] : null;

                          return (
                            <div
                              key={w.id || idx}
                              className={`relative rounded-xl p-3.5 bg-white border-2 flex flex-col justify-between text-center avoid-break ${
                                showCutLines ? 'border-dashed border-slate-400' : 'border-slate-300'
                              }`}
                              style={{ minHeight: '55mm' }}
                            >
                              {showCutLines && (
                                <div className="absolute -top-2.5 left-3 px-1.5 bg-white text-[10px] font-mono text-slate-400 flex items-center gap-1 select-none">
                                  <Scissors className="w-3 h-3 rotate-90 text-slate-400" />
                                  <span>ตัดตามรอย</span>
                                </div>
                              )}

                              {isSec ? (
                                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1 border-b border-slate-100 pb-1">
                                  <div className="flex items-center gap-1.5">
                                    {badge && (
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${badge.bg} ${badge.color}`}>
                                        {secGrade}
                                      </span>
                                    )}
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                                      {w.secondaryPos || w.pattern}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-thai truncate max-w-[110px]">
                                    {w.secondaryTopic || ''}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1 border-b border-slate-100 pb-1">
                                  <span className="font-bold font-thai">
                                    {w.vowelCategory === 'long'
                                      ? 'สระเสียงยาว'
                                      : w.vowelCategory === 'diphthong'
                                      ? 'สระประสม'
                                      : 'สระเสียงสั้น'}{' '}
                                    ({vowelInfo?.name})
                                  </span>
                                  <span className="font-mono font-bold text-slate-600">{w.family}</span>
                                </div>
                              )}

                              <div className="my-1 flex flex-col items-center">
                                <span className="text-3xl sm:text-4xl mb-0.5">{w.emoji}</span>
                                <span className="font-bubble text-2xl sm:text-3xl font-black text-slate-900 tracking-wide">
                                  {w.word}
                                </span>
                                <div className="flex items-center gap-1 mt-1 font-mono text-xs font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                                  {isSec ? (
                                    <span className="font-mono text-slate-700 font-semibold">{w.phoneticIPA}</span>
                                  ) : w.letters && w.letters.length > 0 ? (
                                    w.letters.map((seg, sIdx) => (
                                      <React.Fragment key={sIdx}>
                                        <span className={seg.soundTh.includes('ไม่ออกเสียง') ? 'text-slate-400 italic' : 'text-slate-800'}>
                                          {seg.letter}
                                        </span>
                                        {sIdx < w.letters.length - 1 && <span className="text-slate-300">·</span>}
                                      </React.Fragment>
                                    ))
                                  ) : (
                                    <span>{w.word}</span>
                                  )}
                                </div>
                              </div>

                              <div className="pt-1 border-t border-slate-100 space-y-0.5">
                                {showPhonetic && (
                                  <div className="text-xs font-bold text-slate-600 flex items-center justify-center gap-2">
                                    {!isSec && <span className="font-mono text-slate-400 text-[10px]">{w.phoneticIPA}</span>}
                                    <span className="font-thai text-amber-800 bg-amber-50 px-1 rounded">
                                      อ่านว่า: {w.phoneticTh}
                                    </span>
                                  </div>
                                )}
                                {showMeaning && (
                                  <div className="text-xs font-bold font-thai text-slate-900">
                                    {w.meaningTh}
                                  </div>
                                )}
                                {isSec && w.sentence && (
                                  <div className="mt-1 pt-1 border-t border-slate-100 text-[10px] text-slate-500 font-thai text-left line-clamp-1 italic">
                                    &ldquo;{w.sentence}&rdquo;
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-thai">
                      <div>
                        {wordSource === 'secondary'
                          ? 'Smart Sarai English — สื่อฝึกคำศัพท์ภาษาอังกฤษ ม.1 - ม.6 หลักสูตรแกนกลาง สพฐ.'
                          : 'Phonics Kids — สื่อฝึกสะกดคำภาษาอังกฤษสำหรับเด็กประถม'}
                      </div>
                      <div>หน้า {pageIdx + 1} จาก {pages.length}</div>
                    </div>
                  </div>
                );
              })}

              {/* ===================================================================== */}
              {/* TEMPLATE 2: HANDWRITING WORKSHEET (4 PER PAGE)                         */}
              {/* ===================================================================== */}
              {template === 'worksheet' &&
                pages.map((pageWords, pageIdx) => {
                  const isHiddenOnScreen = viewMode === 'single' && pageIdx !== currentPageIndex;
                  return (
                    <div
                      key={pageIdx}
                      className={`phonics-a4-page bg-white text-slate-900 shadow-lg print:shadow-none p-4 sm:p-5 border border-slate-300 w-full min-h-[297mm] flex flex-col justify-between rounded-xl relative ${
                        isHiddenOnScreen ? 'hidden print:flex' : 'flex'
                      }`}
                      style={{ boxSizing: 'border-box' }}
                    >
                      <div>
                        <div className="border-b-2 border-slate-800 pb-3 mb-3.5">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{wordSource === 'secondary' ? '📝' : '📝'}</span>
                              <div>
                                <h1 className="font-bubble text-xl sm:text-2xl font-black text-slate-900">
                                  {wordSource === 'secondary'
                                    ? 'ใบงานฝึกคัดลายมือคำศัพท์ภาษาอังกฤษ ม.1 - ม.6'
                                    : 'ใบงานฝึกคัดลายมือและสะกดคำโฟนิกส์'}
                                </h1>
                                <p className="text-xs text-slate-500 font-thai">
                                  {wordSource === 'secondary'
                                    ? `ฝึกเขียนตามรอยประ คัดลายมือ และสะกดคำ ระดับ ${selectedSecondaryGrade === 'all' ? 'ม.1 - ม.6' : selectedSecondaryGrade} (4 คำต่อหน้า A4)`
                                    : 'ฝึกเขียนตามรอยประ สะกดคำ และคัดลายมือภาษาอังกฤษ (4 คำต่อหน้า A4)'}
                                </p>
                              </div>
                            </div>
                            <div className="w-14 h-14 border-2 border-slate-300 rounded-xl flex flex-col items-center justify-center text-xs font-bold text-slate-400">
                              <span>คะแนน</span>
                              <span className="text-base text-slate-700">/ 10</span>
                            </div>
                          </div>

                          {showStudentHeader && (
                            <div className="grid grid-cols-3 gap-3 pt-2 text-xs font-thai border-t border-slate-200">
                              <div>ชื่อ-นามสกุล: ___________________________</div>
                              <div>ชั้น: _______ เลขที่: _____</div>
                              <div>วันที่: ___________________</div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 sm:space-y-2.5">
                          {pageWords.map((w, idx) => (
                            <TracingExerciseCard
                              key={w.id || idx}
                              word={w}
                              showMeaning={showMeaning}
                              showPhonetic={showPhonetic}
                              colorMode={handwritingColorMode}
                              fontType={handwritingFont}
                              showStartDot={showStartDot}
                              paperSize={paperSize}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-thai">
                        <div>
                          {wordSource === 'secondary'
                            ? 'Smart Sarai English — ใบงานคำศัพท์ภาษาอังกฤษ ม.1 - ม.6'
                            : 'Phonics Kids — ใบงานแบบฝึกหัดภาษาอังกฤษสำหรับเด็กประถม'}
                        </div>
                        <div>หน้า {pageIdx + 1} จาก {pages.length}</div>
                      </div>
                    </div>
                  );
                })}

              {/* ===================================================================== */}
              {/* TEMPLATE 3: DOTTED TRACING EXERCISES (4 PER A4 PAGE)                   */}
              {/* ===================================================================== */}
              {template === 'tracing' && (
                <TracingWorksheet
                  pages={pages}
                  currentPageIndex={currentPageIndex}
                  viewMode={viewMode}
                  showStudentHeader={showStudentHeader}
                  showMeaning={showMeaning}
                  showPhonetic={showPhonetic}
                  paperSize={paperSize}
                  colorMode={handwritingColorMode}
                  fontType={handwritingFont}
                  showStartDot={showStartDot}
                />
              )}

              {/* ===================================================================== */}
              {/* TEMPLATE 4: WORD LIST TABLE                                            */}
              {/* ===================================================================== */}
              {template === 'wordlist' &&
                pages.map((pageWords, pageIdx) => {
                  const isHiddenOnScreen = viewMode === 'single' && pageIdx !== currentPageIndex;
                  return (
                    <div
                      key={pageIdx}
                      className={`phonics-a4-page bg-white text-slate-900 shadow-lg print:shadow-none p-5 sm:p-7 border border-slate-300 w-full min-h-[297mm] flex flex-col justify-between rounded-xl relative ${
                        isHiddenOnScreen ? 'hidden print:flex' : 'flex'
                      }`}
                      style={{ boxSizing: 'border-box' }}
                    >
                      <div>
                        <div className="border-b-2 border-slate-800 pb-3 mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">📚</span>
                            <div>
                              <h1 className="font-bubble text-xl sm:text-2xl font-black text-slate-900">
                                {wordSource === 'secondary'
                                  ? `ตารางสรุปคำศัพท์หลักสูตรแกนกลาง ${selectedSecondaryGrade === 'all' ? 'ม.1 - ม.6' : selectedSecondaryGrade}`
                                  : 'รายการคำศัพท์โฟนิกส์ (Phonics Word List)'}
                              </h1>
                              <p className="text-xs text-slate-500 font-thai">
                                {wordSource === 'secondary'
                                  ? `รวม ${printWords.length.toLocaleString()} คำศัพท์มาตรฐาน พร้อมชนิดคำ คำอ่าน IPA คำแปลไทย และประโยคตัวอย่าง`
                                  : `รวม ${printWords.length} คำศัพท์พร้อมเสียงสัทศาสตร์ คำอ่านไทย และความหมาย`}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <div className="text-right text-xs text-slate-500 font-mono">
                              <div className="font-bold text-slate-700">หน้า {pageIdx + 1} / {pages.length}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const title =
                                  wordSource === 'secondary'
                                    ? `ตารางคำศัพท์_${selectedSecondaryGrade === 'all' ? 'ม1-ม6' : selectedSecondaryGrade}`
                                    : `ตารางคำศัพท์โฟนิกส์_${selectedCategory}`;
                                exportPrintableWordsToExcel(printWords, title);
                              }}
                              className="print:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold transition cursor-pointer"
                              title="ส่งออกตารางทั้งหมดนี้เป็นไฟล์ Excel (.xlsx)"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                              <span>ส่งออก Excel</span>
                            </button>
                          </div>
                        </div>

                        <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                              <th className="p-1.5 border-r border-slate-300 text-center w-8">ที่</th>
                              <th className="p-1.5 border-r border-slate-300 text-center w-10">รูป</th>
                              <th className="p-1.5 border-r border-slate-300 font-bubble text-sm">คำศัพท์</th>
                              <th className="p-1.5 border-r border-slate-300 text-center w-16">
                                {wordSource === 'secondary' ? 'ระดับ/POS' : 'กลุ่ม'}
                              </th>
                              <th className="p-1.5 border-r border-slate-300 font-mono">IPA</th>
                              <th className="p-1.5 border-r border-slate-300 font-thai">คำอ่านไทย</th>
                              <th className="p-1.5 border-r border-slate-300 font-thai">ความหมาย</th>
                              <th className="p-1.5 font-thai">ประโยคตัวอย่าง</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pageWords.map((w, idx) => (
                              <tr
                                key={w.id || idx}
                                className={`border-b border-slate-200 avoid-break ${
                                  idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                                }`}
                              >
                                <td className="p-1.5 text-center text-slate-400 font-mono border-r border-slate-200">
                                  {pageIdx * 15 + idx + 1}
                                </td>
                                <td className="p-1.5 text-center text-lg border-r border-slate-200">{w.emoji || '📖'}</td>
                                <td className="p-1.5 font-bubble font-black text-sm text-slate-900 border-r border-slate-200">
                                  {w.word}
                                </td>
                                <td className="p-1.5 font-mono text-slate-600 border-r border-slate-200 text-center font-bold text-[11px]">
                                  {w.family}
                                </td>
                                <td className="p-1.5 font-mono text-slate-500 border-r border-slate-200">{w.phoneticIPA}</td>
                                <td className="p-1.5 font-thai font-bold text-amber-800 border-r border-slate-200">{w.phoneticTh}</td>
                                <td className="p-1.5 font-thai text-slate-800 font-medium border-r border-slate-200">{w.meaningTh}</td>
                                <td className="p-1.5 text-slate-500 italic text-[11px] truncate max-w-xs">
                                  {w.sentence}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-thai">
                        <div>
                          {wordSource === 'secondary'
                            ? 'Smart Sarai English — สรุปคำศัพท์มาตรฐาน ม.1 - ม.6 ขนาด A4'
                            : 'Phonics Kids — สรุปคำศัพท์โฟนิกส์มาตรฐาน A4'}
                        </div>
                        <div>หน้า {pageIdx + 1} จาก {pages.length}</div>
                      </div>
                    </div>
                  );
                })}

              {/* ===================================================================== */}
              {/* TEMPLATE 4: PHONICS SOUND CHART POSTER                                 */}
              {/* ===================================================================== */}
              {template === 'chart' && (
                <div
                  className="phonics-a4-page bg-white text-slate-900 shadow-lg print:shadow-none p-5 sm:p-7 border border-slate-300 w-full min-h-[297mm] flex flex-col justify-between rounded-xl relative"
                  style={{ boxSizing: 'border-box' }}
                >
                  {wordSource === 'secondary' ? (
                    <div>
                      <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
                        <div className="inline-flex items-center gap-2 mb-1">
                          <span className="text-3xl">🎓</span>
                          <h1 className="font-bubble text-2xl sm:text-3xl font-black text-slate-900">
                            Secondary Core Vocabulary Chart (ม.1 - ม.6)
                          </h1>
                        </div>
                        <p className="text-xs text-slate-600 font-thai">
                          ผังคำศัพท์แกนกลางตามมาตรฐานการศึกษาขั้นพื้นฐาน (สพฐ.) สำหรับการสื่อสาร สอบ O-NET, TGAT และ A-Level
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        {(['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'] as SecondaryGrade[]).map((g) => {
                          const wordsForGrade = SECONDARY_VOCABULARY.filter((w) => w.grade === g).slice(0, 10);
                          const badge = GRADE_BADGES[g];

                          return (
                            <div key={g} className="border border-slate-300 rounded-2xl p-3 bg-slate-50/70 space-y-2">
                              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-black border ${badge.bg} ${badge.color}`}>
                                  {g}
                                </span>
                                <span className="text-[10px] text-slate-500 font-bold font-thai">
                                  {g === 'ม.1' || g === 'ม.2' || g === 'ม.3' ? 'ม.ต้น (O-NET)' : 'ม.ปลาย (TGAT)'}
                                </span>
                              </div>

                              <div className="space-y-1">
                                {wordsForGrade.map((w) => (
                                  <div key={w.id} className="flex items-baseline justify-between text-xs gap-1 border-b border-slate-100 last:border-none py-0.5">
                                    <div className="flex items-center gap-1 font-bubble font-bold text-slate-900">
                                      <span>{w.word}</span>
                                      <span className="text-[10px] font-mono text-slate-400 font-normal">({w.pos})</span>
                                    </div>
                                    <span className="text-[11px] font-thai text-slate-600 truncate max-w-[120px]">
                                      {w.meaningTh}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
                        <h1 className="font-bubble text-2xl sm:text-3xl font-black text-slate-900">
                          🦁 Phonics Sound Reference Chart
                        </h1>
                        <p className="text-xs text-slate-600 font-thai">
                          ตารางสรุปเสียงสระและพยัญชนะโฟนิกส์: สระเสียงสั้น • สระเสียงยาว • สระประสม Diphthongs
                        </p>
                      </div>

                      <div className="mb-3.5">
                        <div className="font-bubble font-bold text-xs bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg mb-2">
                          🟡 1. สระเสียงสั้น (5 Short Vowels)
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {SHORT_VOWELS.map((v) => {
                            const info = VOWEL_INFO_MAP[v];
                            return (
                              <div key={v} className="border border-slate-300 rounded-xl p-2 text-center bg-amber-50/40">
                                <div className="font-bubble text-xl font-black text-amber-700">{info.letter}</div>
                                <div className="font-mono text-xs text-slate-600 font-bold">{info.symbol}</div>
                                <div className="text-xs font-thai font-bold text-slate-800 mt-0.5">{info.thaiSound}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">{info.sampleWord}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mb-3.5">
                        <div className="font-bubble font-bold text-xs bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-lg mb-2">
                          🟢 2. สระเสียงยาว (5 Long Vowels)
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {LONG_VOWELS.map((v) => {
                            const info = VOWEL_INFO_MAP[v];
                            return (
                              <div key={v} className="border border-slate-300 rounded-xl p-2 text-center bg-emerald-50/40">
                                <div className="font-bubble text-xl font-black text-emerald-700">{info.letter}</div>
                                <div className="font-mono text-xs text-slate-600 font-bold">{info.symbol}</div>
                                <div className="text-xs font-thai font-bold text-slate-800 mt-0.5">{info.thaiSound}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">{info.sampleWord}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mb-3.5">
                        <div className="font-bubble font-bold text-xs bg-purple-100 text-purple-900 px-2.5 py-1 rounded-lg mb-2">
                          🟣 3. สระประสม (5 Diphthongs)
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {DIPHTHONG_VOWELS.map((v) => {
                            const info = VOWEL_INFO_MAP[v];
                            return (
                              <div key={v} className="border border-slate-300 rounded-xl p-2 text-center bg-purple-50/40">
                                <div className="font-bubble text-xl font-black text-purple-700">{info.letter}</div>
                                <div className="font-mono text-xs text-slate-600 font-bold">{info.symbol}</div>
                                <div className="text-xs font-thai font-bold text-slate-800 mt-0.5">{info.thaiSound}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">{info.sampleWord}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="font-bubble font-bold text-xs bg-slate-100 text-slate-900 px-2.5 py-1 rounded-lg mb-2">
                          🔤 4. เสียงพยัญชนะโฟนิกส์ A-Z
                        </div>
                        <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 text-center text-xs">
                          {Object.entries(LETTER_PHONICS_MAP).slice(0, 26).map(([char, p]) => (
                            <div key={char} className="border border-slate-200 rounded-lg p-1 bg-white">
                              <span className="font-bubble font-black text-sm text-slate-900">{char.toUpperCase()}</span>
                              <div className="font-thai font-bold text-amber-700 text-[10px]">{p.soundTh}</div>
                              <div className="text-[8px] text-slate-400 truncate">{p.anchorWord}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-thai">
                    <div>
                      {wordSource === 'secondary'
                        ? 'Smart Sarai English — ตารางสรุปคำศัพท์มาตรฐาน ม.1 - ม.6'
                        : 'Phonics Kids — โปสเตอร์ตารางเทียบเสียงโฟนิกส์ภาษาอังกฤษ'}
                    </div>
                    <div>ขนาดแผ่น A4 มาตรฐาน</div>
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* TAB 2: หน้าไฟล์ PDF (PDF FILE OVERVIEW & ACTIONS)                         */}
            {/* ========================================================================= */}
            {activeTab === 'pdf' && (
            <div className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-xl p-8 min-h-[297mm] flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mb-5 shadow-sm">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">เอกสาร PDF พร้อมดาวน์โหลดและสั่งพิมพ์</h3>
              <p className="text-xs text-slate-500 max-w-md mt-2 font-thai leading-relaxed">
                เอกสารขนาด A4 มาตรฐาน พร้อมจัดหน้ากระดาษอย่างประณีต <br />
                คลิกปุ่ม <strong className="text-emerald-700">"สั่งพิมพ์ออกเครื่องปริ้น"</strong> ด้านบนเพื่อสั่งพิมพ์ออกเครื่องจริงทันที หรือเลือก <strong className="text-amber-700">"ดาวน์โหลด .pdf"</strong> เพื่อบันทึกเป็นไฟล์ PDF ลงในเครื่องคอมพิวเตอร์
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {standalonePrintUrl ? (
                  <a
                    href={standalonePrintUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>สั่งพิมพ์ออกเครื่องปริ้นเดี๋ยวนี้ (เปิดหน้าต่างพิมพ์ ↗)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDirectPrint('all')}
                    disabled={isPreparingPrint}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Printer className="w-4 h-4" />
                    <span>สั่งพิมพ์ออกเครื่องปริ้นเดี๋ยวนี้</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDownloadPdf()}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <FileDown className="w-4 h-4" />
                  <span>บันทึกไฟล์ .pdf ลงเครื่อง</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPdf('document.pdf')}
                  disabled={isGeneratingPdf}
                  title="ดาวน์โหลดเป็นชื่อ document.pdf สำหรับสคริปต์ Python หรือส่งพิมพ์อัตโนมัติ"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  <span>บันทึกเป็น "document.pdf" (สำหรับ Python / win32print)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>กลับไปดูตัวอย่างกระดาษ A4</span>
                </button>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl text-left text-xs font-thai">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-600">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>คำแนะนำสำหรับการพิมพ์คุณภาพสูง:</span>
                  </div>
                  <div>• ในหน้าต่างพิมพ์ ให้ตั้งค่าขนาดกระดาษเป็น <strong>A4</strong></div>
                  <div>• ตั้งค่าระยะขอบ (Margins) เป็น <strong>ปกติ (Default)</strong> หรือ <strong>ไม่มีขอบ (None)</strong></div>
                  <div>• ทำเครื่องหมายถูกที่ <strong>"พิมพ์กราฟิกพื้นหลัง" (Background graphics)</strong> เพื่อให้สีและภาพแสดงครบถ้วน</div>
                </div>

                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 text-slate-700">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <span>🐍</span>
                    <span>สั่งพิมพ์ผ่าน Python (win32print / win32api):</span>
                  </div>
                  <div>1. กดปุ่มสีน้ำเงินเพื่อดาวน์โหลดเป็น <strong>document.pdf</strong></div>
                  <div>2. วางไฟล์ไว้ในโฟลเดอร์เดียวกันกับสคริปต์ Python ของคุณ</div>
                  <div>3. รันสคริปต์เพื่อสั่งพิมพ์ออก <strong>Default Printer</strong> ใน Windows ได้ทันทีโดยไม่ต้องเปิดหน้าต่างพิมพ์!</div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
