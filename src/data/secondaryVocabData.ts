import { M1_VOCABULARY } from './vocab/m1Data';
import { M2_VOCABULARY } from './vocab/m2Data';
import { M3_VOCABULARY } from './vocab/m3Data';
import { M4_VOCABULARY } from './vocab/m4Data';
import { M5_VOCABULARY } from './vocab/m5Data';
import { M6_VOCABULARY } from './vocab/m6Data';

export type SecondaryGrade = 'ม.1' | 'ม.2' | 'ม.3' | 'ม.4' | 'ม.5' | 'ม.6';

export type VocabTopic =
  | 'สิ่งแวดล้อมและธรรมชาติ'
  | 'วิทยาศาสตร์และเทคโนโลยี'
  | 'การศึกษาและอาชีพ'
  | 'สังคมและวัฒนธรรม'
  | 'สุขภาพและการดำเนินชีวิต'
  | 'การสื่อสารและสื่อ'
  | 'เศรษฐกิจและธุรกิจ'
  | 'การเดินทางและการท่องเที่ยว';

export interface SecondaryVocabWord {
  id: string;
  word: string;
  pos: 'n.' | 'v.' | 'adj.' | 'adv.' | 'prep.' | 'conj.';
  grade: SecondaryGrade;
  level: 'lower' | 'upper'; // lower = ม.ต้น, upper = ม.ปลาย
  meaningTh: string;
  phoneticIPA: string;
  phoneticTh: string;
  topic: VocabTopic;
  sentence: string;
  sentenceTh: string;
  synonyms?: string[];
  emoji?: string;
}

export const VOCAB_TOPICS: VocabTopic[] = [
  'สิ่งแวดล้อมและธรรมชาติ',
  'วิทยาศาสตร์และเทคโนโลยี',
  'การศึกษาและอาชีพ',
  'สังคมและวัฒนธรรม',
  'สุขภาพและการดำเนินชีวิต',
  'การสื่อสารและสื่อ',
  'เศรษฐกิจและธุรกิจ',
  'การเดินทางและการท่องเที่ยว',
];

// รวมคลังคำศัพท์มาตรฐานหลักสูตรแกนกลาง ม.1 - ม.6 (รวมกว่า 1,100 คำ)
export const SECONDARY_VOCABULARY: SecondaryVocabWord[] = [
  ...M1_VOCABULARY,
  ...M2_VOCABULARY,
  ...M3_VOCABULARY,
  ...M4_VOCABULARY,
  ...M5_VOCABULARY,
  ...M6_VOCABULARY,
];

export const GRADE_BADGES: Record<SecondaryGrade, { label: string; color: string; bg: string }> = {
  'ม.1': { label: 'มัธยมศึกษาปีที่ 1 (ม.1)', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300' },
  'ม.2': { label: 'มัธยมศึกษาปีที่ 2 (ม.2)', color: 'text-sky-700', bg: 'bg-sky-100 border-sky-300' },
  'ม.3': { label: 'มัธยมศึกษาปีที่ 3 (ม.3)', color: 'text-indigo-700', bg: 'bg-indigo-100 border-indigo-300' },
  'ม.4': { label: 'มัธยมศึกษาปีที่ 4 (ม.4)', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-300' },
  'ม.5': { label: 'มัธยมศึกษาปีที่ 5 (ม.5)', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300' },
  'ม.6': { label: 'มัธยมศึกษาปีที่ 6 (ม.6)', color: 'text-rose-700', bg: 'bg-rose-100 border-rose-300' },
};

export {
  M1_VOCABULARY,
  M2_VOCABULARY,
  M3_VOCABULARY,
  M4_VOCABULARY,
  M5_VOCABULARY,
  M6_VOCABULARY,
};
