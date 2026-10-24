export interface StudentProfile {
  studentId: string; // เลขประจำตัวนักเรียน เช่น 1001 หรือเลขที่โรงเรียน
  name: string;      // ชื่อ - นามสกุล
  nickname: string;  // ชื่อเล่น เช่น น้องภู, น้องมายด์
  grade: string;     // ระดับชั้น เช่น ป.1, ป.2
  room: string;      // ห้อง เช่น 1, 2, 3
  number: string;    // เลขที่ เช่น 12
  school?: string;   // โรงเรียน
  avatar: string;    // รูปไอคอน เช่น 🦁
  createdAt: string;
  lastActive: string;
}

export type GameType = 'quiz' | 'spell-game' | 'missing-vowel' | 'voice-lab' | 'blender';

export interface ScoreRecord {
  id: string;
  timestamp: string;      // วันเวลาที่บันทึก เช่น 22/10/2569 10:30
  studentId: string;
  studentName: string;
  nickname: string;
  grade: string;
  room: string;
  number: string;
  school?: string;
  gameId: GameType;
  gameName: string;       // เช่น "แบบทดสอบฟังเสียงโฟนิกส์ (Listening Quiz)"
  score: number;          // คะแนนที่ได้
  totalScore: number;     // คะแนนเต็ม
  percentage: number;     // ร้อยละ
  starsEarned: number;    // ดาวที่ได้รับ
  details: string;        // รายละเอียด เช่น "10/10 ข้อ (หมวดสระทั้งหมด)"
  synced: boolean;        // ซิงค์ไปยัง Google Sheets สำเร็จแล้วหรือไม่
  syncError?: string;     // ข้อความถ้าส่งไม่สำเร็จ
}

export const STUDENT_GRADE_OPTIONS = [
  'มัธยมศึกษาปีที่ 1 (ม.1)',
  'มัธยมศึกษาปีที่ 2 (ม.2)',
  'มัธยมศึกษาปีที่ 3 (ม.3)',
  'มัธยมศึกษาปีที่ 4 (ม.4)',
  'มัธยมศึกษาปีที่ 5 (ม.5)',
  'มัธยมศึกษาปีที่ 6 (ม.6)',
  'บุคคลทั่วไป',
];

export const AVATAR_OPTIONS = [
  { emoji: '🦁', name: 'สิงโตเจ้าป่า' },
  { emoji: '🐯', name: 'เสือน้อย' },
  { emoji: '🐰', name: 'กระต่ายร่าเริง' },
  { emoji: '🐼', name: 'แพนด้าน่ารัก' },
  { emoji: '🦊', name: 'จิ้งจอกแสนฉลาด' },
  { emoji: '🐶', name: 'เจ้าตูบใจดี' },
  { emoji: '🦄', name: 'ยูนิคอร์นวิเศษ' },
  { emoji: '🐨', name: 'โคอาล่านุ่มนิ่ม' },
  { emoji: '🐵', name: 'ลิงจ๋อขี้เล่น' },
  { emoji: '🐸', name: 'กบน้อยช่างจ้อ' },
  { emoji: '🐧', name: 'เพนกวินสุภาพ' },
  { emoji: '🦖', name: 'ไดโนเสาร์จอมพลัง' },
  { emoji: '🐻', name: 'หมีน้อยใจดี' },
  { emoji: '🦉', name: 'นกฮูกปราชญ์' },
  { emoji: '🐬', name: 'โลมานักว่ายน้ำ' },
  { emoji: '🐝', name: 'ผึ้งน้อยขยันขันแข็ง' },
];
