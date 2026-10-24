export type ShortVowel = 'a' | 'e' | 'i' | 'o' | 'u';
export type LongVowel = 'long-a' | 'long-e' | 'long-i' | 'long-o' | 'long-u';
export type DiphthongVowel = 'dip-oi' | 'dip-ou' | 'dip-oo' | 'dip-aw' | 'dip-air';
export type PhonicsVowel = ShortVowel | LongVowel | DiphthongVowel;
export type VowelCategory = 'short' | 'long' | 'diphthong';

export interface VowelInfo {
  vowel: PhonicsVowel;
  category: VowelCategory;
  letter: string;
  name: string;
  symbol: string;
  thaiSound: string;
  ipaSound: string;
  sampleWord: string;
  color: string;
  bgLight: string;
  borderColor: string;
  textColor: string;
  icon: string;
  description: string;
}

export interface LetterBreakdown {
  letter: string;
  soundIpa: string;
  soundTh: string; // คำอธิบายเสียงโฟนิกส์ภาษาไทย เช่น "ค", "แอะ", "ท", "เอ", "อี"
}

export interface PhonicsWord {
  id: string;
  word: string;
  vowel: PhonicsVowel;
  vowelCategory?: VowelCategory; // 'short' | 'long' | 'diphthong'
  baseLetter?: string;
  pattern?: string;               // e.g. 'CVC', 'a_e', 'ai', 'ay', 'ee', 'ea'
  meaningTh: string;
  phoneticIPA: string;
  phoneticTh: string; // คำอ่านโฟนิกส์ไทย เช่น "แคท", "เค้ก"
  family: string;     // e.g. "-at", "-ake", "-ain", "-ee", "-ight"
  letters: LetterBreakdown[];
  sentence: string;
  sentenceTh: string;
  emoji: string;
  difficulty: 1 | 2; // 1 = Simple, 2 = Blends / Digraphs
}

export type ActiveTab = 'home' | 'learn' | 'login' | 'quiz' | 'spell-game' | 'missing-vowel' | 'blender' | 'voice-lab' | 'library';

export interface UserStats {
  stars: number;
  wordsPracticed: string[];
  quizzesCompleted: number;
  spellingScore: number;
  badges: string[];
  speedRate: number; // 0.7 - 1.0
}
