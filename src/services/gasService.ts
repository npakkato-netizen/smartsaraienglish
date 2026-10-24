import { StudentProfile, ScoreRecord } from '../types/student';

export const GAS_ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbzXhQZ5C1ALpcOZdkYfYrVzUsAl9_lM6WqhNne98wNqVdqA1wZQy5drVQgUHL1lPUzlFg/exec';

const STORAGE_KEY_CURRENT_STUDENT = 'phonics_student_profile';
const STORAGE_KEY_SAVED_STUDENTS = 'phonics_saved_students';
const STORAGE_KEY_SCORES = 'phonics_score_history';

/**
 * Send payload to Google Apps Script Web App using text/plain to prevent CORS preflight issues
 */
export async function sendToGoogleAppsScript(payload: Record<string, any>, timeoutMs = 12000): Promise<{ success: boolean; data?: any; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(GAS_ENDPOINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return { success: true, data };
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error('GAS submission error:', err);
    return {
      success: false,
      error: err.name === 'AbortError' ? 'หมดเวลาการเชื่อมต่อ (Timeout)' : (err.message || 'ไม่สามารถเชื่อมต่อ Google Sheets ได้'),
    };
  }
}

/**
 * Get current logged in student profile
 */
export function getCurrentStudent(): StudentProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_STUDENT);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save current student profile to localStorage and history of students
 */
export function saveCurrentStudent(profile: StudentProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_CURRENT_STUDENT, JSON.stringify(profile));

    // Also update saved students list
    const saved = getSavedStudents();
    const existingIndex = saved.findIndex((s) => s.studentId === profile.studentId || (s.name === profile.name && s.grade === profile.grade));
    if (existingIndex >= 0) {
      saved[existingIndex] = profile;
    } else {
      saved.unshift(profile);
    }
    localStorage.setItem(STORAGE_KEY_SAVED_STUDENTS, JSON.stringify(saved.slice(0, 20)));
  } catch (e) {
    console.warn('Failed to save student profile locally:', e);
  }
}

/**
 * Clear currently active student profile (logout)
 */
export function clearCurrentStudent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_CURRENT_STUDENT);
  } catch (e) {
    console.warn('Failed to clear student:', e);
  }
}

/**
 * Get all previously saved student profiles on this browser
 */
export function getSavedStudents(): StudentProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_STUDENTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Delete a student from saved students list
 */
export function removeSavedStudent(studentId: string): void {
  try {
    const saved = getSavedStudents().filter((s) => s.studentId !== studentId);
    localStorage.setItem(STORAGE_KEY_SAVED_STUDENTS, JSON.stringify(saved));
  } catch (e) {
    console.warn('Failed to remove student:', e);
  }
}

/**
 * Get all score records from local storage
 */
export function getScoreHistory(): ScoreRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCORES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Save score record locally and attempt to sync to Google Sheets via GAS
 */
export async function recordScore(
  student: StudentProfile,
  data: {
    gameId: ScoreRecord['gameId'];
    gameName: string;
    score: number;
    totalScore: number;
    starsEarned: number;
    details: string;
  }
): Promise<{ record: ScoreRecord; synced: boolean; error?: string }> {
  const now = new Date();
  const timestampStr = now.toLocaleString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const percentage = Math.round((data.score / (data.totalScore || 1)) * 100);

  const newRecord: ScoreRecord = {
    id: `score_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: timestampStr,
    studentId: student.studentId,
    studentName: student.name,
    nickname: student.nickname,
    grade: student.grade,
    room: student.room,
    number: student.number,
    school: student.school || '',
    gameId: data.gameId,
    gameName: data.gameName,
    score: data.score,
    totalScore: data.totalScore,
    percentage,
    starsEarned: data.starsEarned,
    details: data.details,
    synced: false,
  };

  // 1. Try sending to Google Apps Script
  const payload = {
    action: 'saveScore',
    timestamp: timestampStr,
    studentId: student.studentId,
    name: student.name,
    nickname: student.nickname,
    grade: student.grade,
    room: student.room,
    number: student.number,
    school: student.school || '',
    gameId: data.gameId,
    gameName: data.gameName,
    score: data.score,
    totalScore: data.totalScore,
    percentage,
    starsEarned: data.starsEarned,
    details: data.details,
  };

  const gasResult = await sendToGoogleAppsScript(payload);

  if (gasResult.success) {
    newRecord.synced = true;
  } else {
    newRecord.synced = false;
    newRecord.syncError = gasResult.error;
  }

  // 2. Save locally
  try {
    const existing = getScoreHistory();
    const updated = [newRecord, ...existing];
    localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(updated.slice(0, 100)));
  } catch (e) {
    console.warn('Failed to save score to localStorage:', e);
  }

  return {
    record: newRecord,
    synced: newRecord.synced,
    error: newRecord.syncError,
  };
}

/**
 * Sync all unsynced records to Google Sheets
 */
export async function syncPendingScores(): Promise<{ total: number; succeeded: number; failed: number }> {
  const records = getScoreHistory();
  const pending = records.filter((r) => !r.synced);

  if (pending.length === 0) {
    return { total: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  for (const record of pending) {
    const payload = {
      action: 'saveScore',
      timestamp: record.timestamp,
      studentId: record.studentId,
      name: record.studentName,
      nickname: record.nickname,
      grade: record.grade,
      room: record.room,
      number: record.number,
      school: record.school || '',
      gameId: record.gameId,
      gameName: record.gameName,
      score: record.score,
      totalScore: record.totalScore,
      percentage: record.percentage,
      starsEarned: record.starsEarned,
      details: record.details,
    };

    const res = await sendToGoogleAppsScript(payload, 8000);
    if (res.success) {
      record.synced = true;
      delete record.syncError;
      succeeded++;
    } else {
      record.syncError = res.error;
      failed++;
    }
  }

  // Update localStorage
  try {
    localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(records));
  } catch (e) {
    console.warn('Failed to update scores after sync:', e);
  }

  return { total: pending.length, succeeded, failed };
}

/**
 * Send Student Login/Register event to Google Apps Script
 */
export async function notifyStudentLogin(student: StudentProfile): Promise<boolean> {
  const now = new Date();
  const timestampStr = now.toLocaleString('th-TH');

  const payload = {
    action: 'login',
    timestamp: timestampStr,
    studentId: student.studentId,
    name: student.name,
    nickname: student.nickname,
    grade: student.grade,
    room: student.room,
    number: student.number,
    school: student.school || '',
    avatar: student.avatar,
  };

  const res = await sendToGoogleAppsScript(payload, 7000);
  return res.success;
}
