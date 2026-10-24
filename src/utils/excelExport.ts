import * as XLSX from 'xlsx';
import {
  SecondaryVocabWord,
  SecondaryGrade,
  SECONDARY_VOCABULARY,
} from '../data/secondaryVocabData';
import { PhonicsWord } from '../types/phonics';

export interface SecondaryExcelExportOptions {
  filename?: string;
  gradeFilter?: SecondaryGrade | 'all' | 'lower' | 'upper';
  topicFilter?: string;
  groupByGradeSheets?: boolean;
}

export interface PhonicsExcelExportOptions {
  filename?: string;
  groupByCategorySheets?: boolean;
}

/**
 * คำนวณความกว้างคอลัมน์อัตโนมัติสำหรับ SheetJS
 */
function calculateColWidths(rows: (string | number)[][]): { wch: number }[] {
  if (!rows || rows.length === 0) return [];
  const colCount = rows[0].length;
  const colWidths: number[] = new Array(colCount).fill(10);

  rows.forEach((row) => {
    row.forEach((cell, colIdx) => {
      const val = cell !== null && cell !== undefined ? String(cell) : '';
      // สำหรับภาษาไทยและ unicode นับความกว้างเพิ่มขึ้น
      let len = 0;
      for (let i = 0; i < val.length; i++) {
        const code = val.charCodeAt(i);
        // Thai character ranges (0x0E00 - 0x0E7F) or full-width
        if (code >= 0x0e00 && code <= 0x0e7f) {
          len += 1.3;
        } else if (code > 255) {
          len += 2;
        } else {
          len += 1;
        }
      }
      colWidths[colIdx] = Math.max(colWidths[colIdx], Math.min(Math.ceil(len) + 3, 60));
    });
  });

  return colWidths.map((w) => ({ wch: w }));
}

/**
 * แปลงรายการ SecondaryVocabWord เป็นแถวข้อมูลสำหรับตาราง Excel
 */
function formatSecondaryRows(words: SecondaryVocabWord[]): (string | number)[][] {
  const headers = [
    'ลำดับ',
    'ระดับชั้น',
    'ช่วงชั้น',
    'คำศัพท์ (Vocabulary)',
    'ชนิดของคำ (POS)',
    'คำอ่านสัทศาสตร์ (IPA)',
    'คำอ่านไทย',
    'ความหมายภาษาไทย',
    'หมวดสาระการเรียนรู้',
    'ประโยคตัวอย่าง (Context Sentence)',
    'คำแปลประโยคตัวอย่าง',
    'คำเหมือน / Synonyms',
  ];

  const dataRows = words.map((w, idx) => [
    idx + 1,
    w.grade,
    w.level === 'lower' ? 'มัธยมศึกษาตอนต้น (ม.ต้น)' : 'มัธยมศึกษาตอนปลาย (ม.ปลาย)',
    w.word,
    w.pos,
    w.phoneticIPA,
    w.phoneticTh,
    w.meaningTh,
    w.topic,
    w.sentence,
    w.sentenceTh,
    w.synonyms && w.synonyms.length > 0 ? w.synonyms.join(', ') : '-',
  ]);

  return [headers, ...dataRows];
}

/**
 * สร้าง Worksheet จากแถวข้อมูลพร้อมตั้งค่า AutoFilter และ Column Widths
 */
function createWorksheetFromRows(rows: (string | number)[][]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = calculateColWidths(rows);

  // ตั้ง AutoFilter ให้กับแถวแรก
  if (rows.length > 1) {
    const lastColIndex = rows[0].length - 1;
    const lastColLetter = XLSX.utils.encode_col(lastColIndex);
    ws['!autofilter'] = { ref: `A1:${lastColLetter}${rows.length}` };
  }

  return ws;
}

/**
 * ส่งออกคำศัพท์มัธยมศึกษา (Secondary Vocabulary ม.1 - ม.6) เป็นไฟล์ Excel (.xlsx)
 */
export function exportSecondaryVocabToExcel(
  words: SecondaryVocabWord[],
  options?: SecondaryExcelExportOptions
): void {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().slice(0, 10);

  if (options?.groupByGradeSheets) {
    // 1. ชีตรวมทุกคำ (All Words Sheet)
    const allRows = formatSecondaryRows(words);
    const allWs = createWorksheetFromRows(allRows);
    XLSX.utils.book_append_sheet(wb, allWs, 'คำศัพท์ทั้งหมด');

    // 2. แยกแต่ละระดับชั้น ม.1 - ม.6
    const grades: SecondaryGrade[] = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
    grades.forEach((grade) => {
      const gradeWords = words.filter((w) => w.grade === grade);
      if (gradeWords.length > 0) {
        const gradeRows = formatSecondaryRows(gradeWords);
        const gradeWs = createWorksheetFromRows(gradeRows);
        XLSX.utils.book_append_sheet(wb, gradeWs, `ระดับชั้น ${grade}`);
      }
    });
  } else {
    // สร้างชีตเดียวตามข้อมูลที่ส่งมา
    const rows = formatSecondaryRows(words);
    const ws = createWorksheetFromRows(rows);
    let sheetName = 'คำศัพท์ ม.1-6';
    if (options?.gradeFilter && options.gradeFilter !== 'all') {
      sheetName = `คำศัพท์ ${options.gradeFilter}`;
    }
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  // กำหนดชื่อไฟล์ดาวน์โหลด
  let defaultFilename = `ตารางคำศัพท์ภาษาอังกฤษ_ม1-ม6_${dateStr}.xlsx`;
  if (options?.gradeFilter && options.gradeFilter !== 'all') {
    defaultFilename = `ตารางคำศัพท์ภาษาอังกฤษ_${options.gradeFilter}_${dateStr}.xlsx`;
  }
  const finalFilename = options?.filename || defaultFilename;

  XLSX.writeFile(wb, finalFilename);
}

/**
 * ส่งออกคำศัพท์โฟนิกส์ (Phonics Vocabulary) เป็นไฟล์ Excel (.xlsx)
 */
export function exportPhonicsVocabToExcel(
  words: PhonicsWord[],
  options?: PhonicsExcelExportOptions
): void {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().slice(0, 10);

  const formatPhonicsRows = (list: PhonicsWord[]): (string | number)[][] => {
    const headers = [
      'ลำดับ',
      'ไอคอน',
      'คำศัพท์ (Word)',
      'สระ (Vowel)',
      'ประเภทสระ',
      'ตระกูลคำ (Word Family)',
      'รูปแบบตัวสะกด',
      'คำอ่านสัทศาสตร์ (IPA)',
      'คำอ่านโฟนิกส์ไทย',
      'ความหมายภาษาไทย',
      'ประโยคตัวอย่าง',
      'คำแปลประโยค',
    ];

    const dataRows = list.map((w, idx) => {
      const catLabel =
        w.vowelCategory === 'long'
          ? 'สระเสียงยาว'
          : w.vowelCategory === 'diphthong'
          ? 'สระประสม (Diphthong)'
          : 'สระเสียงสั้น';

      return [
        idx + 1,
        w.emoji || '📖',
        w.word,
        w.vowel,
        catLabel,
        w.family,
        w.pattern || '-',
        w.phoneticIPA,
        w.phoneticTh,
        w.meaningTh,
        w.sentence,
        w.sentenceTh,
      ];
    });

    return [headers, ...dataRows];
  };

  if (options?.groupByCategorySheets) {
    // 1. รวมคำศัพท์โฟนิกส์ทั้งหมด
    const allRows = formatPhonicsRows(words);
    const allWs = createWorksheetFromRows(allRows);
    XLSX.utils.book_append_sheet(wb, allWs, 'โฟนิกส์ทั้งหมด');

    // 2. สระเสียงสั้น
    const shortWords = words.filter((w) => !w.vowelCategory || w.vowelCategory === 'short');
    if (shortWords.length > 0) {
      const shortWs = createWorksheetFromRows(formatPhonicsRows(shortWords));
      XLSX.utils.book_append_sheet(wb, shortWs, 'สระเสียงสั้น (Short)');
    }

    // 3. สระเสียงยาว
    const longWords = words.filter((w) => w.vowelCategory === 'long');
    if (longWords.length > 0) {
      const longWs = createWorksheetFromRows(formatPhonicsRows(longWords));
      XLSX.utils.book_append_sheet(wb, longWs, 'สระเสียงยาว (Long)');
    }

    // 4. สระประสม
    const dipWords = words.filter((w) => w.vowelCategory === 'diphthong');
    if (dipWords.length > 0) {
      const dipWs = createWorksheetFromRows(formatPhonicsRows(dipWords));
      XLSX.utils.book_append_sheet(wb, dipWs, 'สระประสม (Diphthongs)');
    }
  } else {
    const rows = formatPhonicsRows(words);
    const ws = createWorksheetFromRows(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'คำศัพท์โฟนิกส์');
  }

  const filename = options?.filename || `ตารางคำศัพท์โฟนิกส์_Phonics_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * ฟังก์ชันกลางสำหรับส่งออกตารางคำศัพท์จาก PrintableWord ใน PrintModal
 */
export function exportPrintableWordsToExcel(
  words: {
    word: string;
    meaningTh: string;
    phoneticIPA: string;
    phoneticTh: string;
    sentence: string;
    sentenceTh?: string;
    emoji?: string;
    family?: string;
    pattern?: string;
    isSecondary?: boolean;
    secondaryGrade?: SecondaryGrade;
    secondaryPos?: string;
    secondaryTopic?: string;
    secondarySynonyms?: string[];
    vowel?: string;
    vowelCategory?: string;
  }[],
  title: string = 'ตารางสรุปคำศัพท์'
): void {
  const isSec = words.some((w) => w.isSecondary || w.secondaryGrade);
  const dateStr = new Date().toISOString().slice(0, 10);

  if (isSec) {
    const secWords: SecondaryVocabWord[] = words.map((w, idx) => ({
      id: `w-${idx}`,
      word: w.word,
      pos: (w.secondaryPos as any) || 'n.',
      grade: w.secondaryGrade || 'ม.1',
      level:
        w.secondaryGrade === 'ม.4' || w.secondaryGrade === 'ม.5' || w.secondaryGrade === 'ม.6'
          ? 'upper'
          : 'lower',
      meaningTh: w.meaningTh,
      phoneticIPA: w.phoneticIPA,
      phoneticTh: w.phoneticTh,
      topic: (w.secondaryTopic as any) || 'การศึกษาและอาชีพ',
      sentence: w.sentence,
      sentenceTh: w.sentenceTh || '',
      synonyms: w.secondarySynonyms || [],
      emoji: w.emoji || '📖',
    }));

    exportSecondaryVocabToExcel(secWords, {
      filename: `${title.replace(/[\/\s:]+/g, '_')}_${dateStr}.xlsx`,
      groupByGradeSheets: false,
    });
  } else {
    const phonicsWords: PhonicsWord[] = words.map((w, idx) => ({
      id: `p-${idx}`,
      word: w.word,
      vowel: (w.vowel as any) || 'a',
      vowelCategory: (w.vowelCategory as any) || 'short',
      meaningTh: w.meaningTh,
      phoneticIPA: w.phoneticIPA,
      phoneticTh: w.phoneticTh,
      family: w.family || '',
      pattern: w.pattern || '',
      letters: [],
      sentence: w.sentence,
      sentenceTh: w.sentenceTh || '',
      emoji: w.emoji || '📖',
      difficulty: 1,
    }));

    exportPhonicsVocabToExcel(phonicsWords, {
      filename: `${title.replace(/[\/\s:]+/g, '_')}_${dateStr}.xlsx`,
    });
  }
}
