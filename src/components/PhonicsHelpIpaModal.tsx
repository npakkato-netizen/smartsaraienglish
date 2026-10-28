import React, { useState, useMemo } from 'react';
import {
  X,
  Volume2,
  Sparkles,
  BookOpen,
  Info,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Zap,
  Globe2,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { speakText, unlockAudio } from '../utils/audioUtils';

interface PhonicsHelpIpaModalProps {
  isOpen: boolean;
  onClose: () => void;
  speedRate?: number;
}

export interface AlphabetLetterIPA {
  letter: string;
  upper: string;
  lower: string;
  ipaGenAm: string;
  ipaRP: string;
  thai: string;
  category: 'vowel' | 'consonant';
  phoneticType: string;
  isCommonProblem: boolean;
  notes: string;
  speakUsText: string;
  speakUkText: string;
  soundIpa: string;
  sampleWords: { word: string; meaning: string; ipa: string }[];
}

export interface ArticulationGuide {
  letter: string;
  upper: string;
  title: string;
  nameIpaGenAm: string;
  nameIpaRP: string;
  soundIpa: string;
  mannerOfArticulation: string;
  placeOfArticulation: string;
  voicing: string;
  isVoiced: boolean;
  lipShape: string;
  tonguePosition: string;
  commonThaiMistakes: string;
  actionableDrill: string;
  comparisonPairs: { target: string; contrast: string; explanation: string }[];
  practiceWords: { word: string; ipa: string; thai: string; meaning: string }[];
  muscleTips: string[];
}

export const ALPHABET_IPA_DATA: AlphabetLetterIPA[] = [
  {
    letter: 'A',
    upper: 'A',
    lower: 'a',
    ipaGenAm: '/eɪ/',
    ipaRP: '/eɪ/',
    thai: 'เอ',
    category: 'vowel',
    phoneticType: 'Closing Diphthong (สระเลื่อน)',
    isCommonProblem: false,
    notes: 'สระเลื่อนจาก /e/ สู่ /ɪ/ ทั้งสองสำเนียงออกเสียงเหมือนกัน',
    speakUsText: 'A',
    speakUkText: 'A',
    soundIpa: '/æ/ (short a) & /eɪ/ (long a)',
    sampleWords: [
      { word: 'apple', meaning: 'แอปเปิ้ล', ipa: '/ˈæp.əl/' },
      { word: 'cake', meaning: 'เค้ก', ipa: '/keɪk/' },
      { word: 'baby', meaning: 'ทารก', ipa: '/ˈbeɪ.bi/' },
    ],
  },
  {
    letter: 'B',
    upper: 'B',
    lower: 'b',
    ipaGenAm: '/biː/',
    ipaRP: '/biː/',
    thai: 'บี',
    category: 'consonant',
    phoneticType: 'Voiced Bilabial Plosive (เสียงกักริมฝีปากก้อง)',
    isCommonProblem: false,
    notes: 'ริมฝีปากประกบสนิท กักลมแล้วระเบิดออกพร้อมเส้นเสียงสั่น',
    speakUsText: 'B',
    speakUkText: 'B',
    soundIpa: '/b/',
    sampleWords: [
      { word: 'bat', meaning: 'ค้างคาว', ipa: '/bæt/' },
      { word: 'bed', meaning: 'เตียง', ipa: '/bɛd/' },
      { word: 'book', meaning: 'หนังสือ', ipa: '/bʊk/' },
    ],
  },
  {
    letter: 'C',
    upper: 'C',
    lower: 'c',
    ipaGenAm: '/siː/',
    ipaRP: '/siː/',
    thai: 'ซี',
    category: 'consonant',
    phoneticType: 'Voiceless Alveolar Sibilant Fricative',
    isCommonProblem: true,
    notes: 'เสียงลมเสียดแทรกร่องฟันคมชัด เส้นเสียงไม่สั่น ต่างจาก Z ที่ก้อง',
    speakUsText: 'see',
    speakUkText: 'see',
    soundIpa: '/k/ (hard) & /s/ (soft)',
    sampleWords: [
      { word: 'cat', meaning: 'แมว', ipa: '/kæt/' },
      { word: 'city', meaning: 'เมือง', ipa: '/ˈsɪt.i/' },
      { word: 'ice', meaning: 'น้ำแข็ง', ipa: '/aɪs/' },
    ],
  },
  {
    letter: 'D',
    upper: 'D',
    lower: 'd',
    ipaGenAm: '/diː/',
    ipaRP: '/diː/',
    thai: 'ดี',
    category: 'consonant',
    phoneticType: 'Voiced Alveolar Plosive',
    isCommonProblem: false,
    notes: 'ปลายลิ้นแตะปุ่มเหงือก กักลมแล้วระเบิดออกพร้อมเสียงก้อง',
    speakUsText: 'D',
    speakUkText: 'D',
    soundIpa: '/d/',
    sampleWords: [
      { word: 'dog', meaning: 'สุนัข', ipa: '/dɔːɡ/' },
      { word: 'door', meaning: 'ประตู', ipa: '/dɔːr/' },
      { word: 'red', meaning: 'สีแดง', ipa: '/rɛd/' },
    ],
  },
  {
    letter: 'E',
    upper: 'E',
    lower: 'e',
    ipaGenAm: '/iː/',
    ipaRP: '/iː/',
    thai: 'อี',
    category: 'vowel',
    phoneticType: 'Close Front Unrounded Vowel (สระหน้าปิดยาว)',
    isCommonProblem: false,
    notes: 'มุมปากเหยียดตึง ลากเสียงอีสม่ำเสมอ ก้องกังวาน',
    speakUsText: 'E',
    speakUkText: 'E',
    soundIpa: '/ɛ/ (short e) & /iː/ (long e)',
    sampleWords: [
      { word: 'egg', meaning: 'ไข่', ipa: '/ɛɡ/' },
      { word: 'tree', meaning: 'ต้นไม้', ipa: '/triː/' },
      { word: 'bee', meaning: 'ผึ้ง', ipa: '/biː/' },
    ],
  },
  {
    letter: 'F',
    upper: 'F',
    lower: 'f',
    ipaGenAm: '/ɛf/',
    ipaRP: '/ɛf/',
    thai: 'เอฟ',
    category: 'consonant',
    phoneticType: 'Voiceless Labiodental Fricative',
    isCommonProblem: false,
    notes: 'สระ /ɛ/ ตามด้วยฟันบนแตะริมฝีปากล่างพ่นลมเสียดแทรก',
    speakUsText: 'F',
    speakUkText: 'F',
    soundIpa: '/f/',
    sampleWords: [
      { word: 'fish', meaning: 'ปลา', ipa: '/fɪʃ/' },
      { word: 'fan', meaning: 'พัดลม', ipa: '/fæn/' },
      { word: 'leaf', meaning: 'ใบไม้', ipa: '/liːf/' },
    ],
  },
  {
    letter: 'G',
    upper: 'G',
    lower: 'g',
    ipaGenAm: '/dʒiː/',
    ipaRP: '/dʒiː/',
    thai: 'จี (ก้อง)',
    category: 'consonant',
    phoneticType: 'Voiced Postalveolar Affricate',
    isCommonProblem: true,
    notes: 'มีเสียงก้องหึ่งในลำคอตั้งแต่เสี้ยววินาทีแรก ไม่ใช่เสียง จ ทึบของไทย',
    speakUsText: 'gee',
    speakUkText: 'gee',
    soundIpa: '/ɡ/ (hard) & /dʒ/ (soft)',
    sampleWords: [
      { word: 'girl', meaning: 'เด็กหญิง', ipa: '/ɡɜːrl/' },
      { word: 'giant', meaning: 'ยักษ์', ipa: '/ˈdʒaɪ.ənt/' },
      { word: 'page', meaning: 'หน้าหนังสือ', ipa: '/peɪdʒ/' },
    ],
  },
  {
    letter: 'H',
    upper: 'H',
    lower: 'h',
    ipaGenAm: '/eɪtʃ/',
    ipaRP: '/eɪtʃ/',
    thai: 'เอช',
    category: 'consonant',
    phoneticType: 'Diphthong + Voiceless Postalveolar Affricate',
    isCommonProblem: true,
    notes: 'เริ่มด้วยสระ /eɪ/ จบด้วยเสียงชู่ว /tʃ/ ห้ามออกเสียงว่า "เฮช" (/heɪtʃ/)',
    speakUsText: 'aitch',
    speakUkText: 'aitch',
    soundIpa: '/h/',
    sampleWords: [
      { word: 'hat', meaning: 'หมวก', ipa: '/hæt/' },
      { word: 'house', meaning: 'บ้าน', ipa: '/haʊs/' },
      { word: 'happy', meaning: 'มีความสุข', ipa: '/ˈhæp.i/' },
    ],
  },
  {
    letter: 'I',
    upper: 'I',
    lower: 'i',
    ipaGenAm: '/aɪ/',
    ipaRP: '/aɪ/',
    thai: 'ไอ',
    category: 'vowel',
    phoneticType: 'Closing Diphthong (สระเลื่อนจาก /a/ สู่ /ɪ/)',
    isCommonProblem: false,
    notes: 'อ้าปากปานกลางแล้วค่อยๆ เลื่อนลิ้นขึ้นไปหาสระอิ',
    speakUsText: 'eye',
    speakUkText: 'eye',
    soundIpa: '/ɪ/ (short i) & /aɪ/ (long i)',
    sampleWords: [
      { word: 'pig', meaning: 'หมู', ipa: '/pɪɡ/' },
      { word: 'kite', meaning: 'ว่าว', ipa: '/kaɪt/' },
      { word: 'time', meaning: 'เวลา', ipa: '/taɪm/' },
    ],
  },
  {
    letter: 'J',
    upper: 'J',
    lower: 'j',
    ipaGenAm: '/dʒeɪ/',
    ipaRP: '/dʒeɪ/',
    thai: 'เจ (ก้อง)',
    category: 'consonant',
    phoneticType: 'Voiced Postalveolar Affricate + Diphthong',
    isCommonProblem: true,
    notes: 'เริ่มด้วยเสียงกักเสียดแทรกก้อง /dʒ/ เลื่อนสู่สระ /eɪ/ ไม่ใช่ "เช" หรือ "เจ" ทื่อๆ',
    speakUsText: 'jay',
    speakUkText: 'jay',
    soundIpa: '/dʒ/',
    sampleWords: [
      { word: 'jam', meaning: 'แยม', ipa: '/dʒæm/' },
      { word: 'juice', meaning: 'น้ำผลไม้', ipa: '/dʒuːs/' },
      { word: 'jump', meaning: 'กระโดด', ipa: '/dʒʌmp/' },
    ],
  },
  {
    letter: 'K',
    upper: 'K',
    lower: 'k',
    ipaGenAm: '/keɪ/',
    ipaRP: '/keɪ/',
    thai: 'เค',
    category: 'consonant',
    phoneticType: 'Voiceless Velar Plosive + Diphthong',
    isCommonProblem: false,
    notes: 'โคนลิ้นแตะเพดานอ่อน ลมพ่นระเบิดชัดเจน ตามด้วยสระเลื่อน /eɪ/',
    speakUsText: 'kay',
    speakUkText: 'kay',
    soundIpa: '/k/',
    sampleWords: [
      { word: 'king', meaning: 'พระราชา', ipa: '/kɪŋ/' },
      { word: 'kite', meaning: 'ว่าว', ipa: '/kaɪt/' },
      { word: 'milk', meaning: 'นม', ipa: '/mɪlk/' },
    ],
  },
  {
    letter: 'L',
    upper: 'L',
    lower: 'l',
    ipaGenAm: '/ɛl/',
    ipaRP: '/ɛl/',
    thai: 'เอ็ล',
    category: 'consonant',
    phoneticType: 'Voiced Alveolar Lateral Approximant',
    isCommonProblem: false,
    notes: 'สระ /ɛ/ ปิดท้ายด้วยปลายลิ้นยกแตะปุ่มเหงือกค้างไว้ ห้ามออกเสียงเป็น "เอว"',
    speakUsText: 'el',
    speakUkText: 'el',
    soundIpa: '/l/',
    sampleWords: [
      { word: 'lion', meaning: 'สิงโต', ipa: '/ˈlaɪ.ən/' },
      { word: 'lamp', meaning: 'โคมไฟ', ipa: '/læmp/' },
      { word: 'bell', meaning: 'กระดิ่ง', ipa: '/bɛl/' },
    ],
  },
  {
    letter: 'M',
    upper: 'M',
    lower: 'm',
    ipaGenAm: '/ɛm/',
    ipaRP: '/ɛm/',
    thai: 'เอ็ม',
    category: 'consonant',
    phoneticType: 'Voiced Bilabial Nasal (เสียงนาสิกริมฝีปาก)',
    isCommonProblem: false,
    notes: 'ริมฝีปากประกบสนิท ปล่อยลมระบายออกทางจมูก',
    speakUsText: 'em',
    speakUkText: 'em',
    soundIpa: '/m/',
    sampleWords: [
      { word: 'moon', meaning: 'ดวงจันทร์', ipa: '/muːn/' },
      { word: 'milk', meaning: 'นม', ipa: '/mɪlk/' },
      { word: 'swim', meaning: 'ว่ายน้ำ', ipa: '/swɪm/' },
    ],
  },
  {
    letter: 'N',
    upper: 'N',
    lower: 'n',
    ipaGenAm: '/ɛn/',
    ipaRP: '/ɛn/',
    thai: 'เอ็น',
    category: 'consonant',
    phoneticType: 'Voiced Alveolar Nasal (เสียงนาสิกปุ่มเหงือก)',
    isCommonProblem: false,
    notes: 'ปลายลิ้นประกบปุ่มเหงือกแน่น ลมระบายออกทางจมูก',
    speakUsText: 'en',
    speakUkText: 'en',
    soundIpa: '/n/',
    sampleWords: [
      { word: 'nest', meaning: 'รังนก', ipa: '/nɛst/' },
      { word: 'nut', meaning: 'ถั่ว', ipa: '/nʌt/' },
      { word: 'sun', meaning: 'พระอาทิตย์', ipa: '/sʌn/' },
    ],
  },
  {
    letter: 'O',
    upper: 'O',
    lower: 'o',
    ipaGenAm: '/oʊ/',
    ipaRP: '/əʊ/',
    thai: 'โอ',
    category: 'vowel',
    phoneticType: 'Back Rounded Diphthong (US) / Central-Back (UK)',
    isCommonProblem: false,
    notes: 'จุดต่าง: GenAm เริ่มที่สระโอ /o/ แล้วห่อปาก; British RP เริ่มที่สระเออะกลางปาก /ə/',
    speakUsText: 'oh',
    speakUkText: 'oh',
    soundIpa: '/ɑː/ (US short o) & /oʊ/ (long o)',
    sampleWords: [
      { word: 'ox', meaning: 'วัวตัวผู้', ipa: '/ɑːks/' },
      { word: 'boat', meaning: 'เรือ', ipa: '/boʊt/' },
      { word: 'rose', meaning: 'ดอกกุหลาบ', ipa: '/roʊz/' },
    ],
  },
  {
    letter: 'P',
    upper: 'P',
    lower: 'p',
    ipaGenAm: '/piː/',
    ipaRP: '/piː/',
    thai: 'พี',
    category: 'consonant',
    phoneticType: 'Voiceless Bilabial Plosive (พ่นลมแรง)',
    isCommonProblem: false,
    notes: 'ริมฝีปากประกบสนิท กักลมแล้วระเบิดพ่นลมชัดเจน',
    speakUsText: 'P',
    speakUkText: 'P',
    soundIpa: '/p/',
    sampleWords: [
      { word: 'pen', meaning: 'ปากกา', ipa: '/pɛn/' },
      { word: 'pig', meaning: 'หมู', ipa: '/pɪɡ/' },
      { word: 'cup', meaning: 'ถ้วย', ipa: '/kʌp/' },
    ],
  },
  {
    letter: 'Q',
    upper: 'Q',
    lower: 'q',
    ipaGenAm: '/kjuː/',
    ipaRP: '/kjuː/',
    thai: 'คิว',
    category: 'consonant',
    phoneticType: 'Voiceless Velar Plosive + Palatal Glide + Close Back Vowel',
    isCommonProblem: false,
    notes: 'พยัญชนะต้นควบ /kj/ ตามด้วยสระอูปากห่อกลมตึง /uː/',
    speakUsText: 'cue',
    speakUkText: 'cue',
    soundIpa: '/kw/',
    sampleWords: [
      { word: 'queen', meaning: 'ราชินี', ipa: '/kwiːn/' },
      { word: 'quick', meaning: 'รวดเร็ว', ipa: '/kwɪk/' },
      { word: 'quiz', meaning: 'แบบทดสอบ', ipa: '/kwɪz/' },
    ],
  },
  {
    letter: 'R',
    upper: 'R',
    lower: 'r',
    ipaGenAm: '/ɑːr/',
    ipaRP: '/ɑː/',
    thai: 'อาร์',
    category: 'consonant',
    phoneticType: 'Rhotic Vowel (US) / Non-rhotic Long Vowel (UK)',
    isCommonProblem: true,
    notes: 'จุดต่าง: GenAm ปลายลิ้นตวัดงอขึ้นแต่ไม่แตะเพดาน; British RP ไม่งอลิ้น ลากสระอาเรียบยาว',
    speakUsText: 'are',
    speakUkText: 'are',
    soundIpa: '/r/ (approximant)',
    sampleWords: [
      { word: 'red', meaning: 'สีแดง', ipa: '/rɛd/' },
      { word: 'rain', meaning: 'ฝน', ipa: '/reɪn/' },
      { word: 'car', meaning: 'รถยนต์', ipa: '/kɑːr/' },
    ],
  },
  {
    letter: 'S',
    upper: 'S',
    lower: 's',
    ipaGenAm: '/ɛs/',
    ipaRP: '/ɛs/',
    thai: 'เอ็ส',
    category: 'consonant',
    phoneticType: 'Voiceless Alveolar Sibilant Fricative',
    isCommonProblem: false,
    notes: 'ปิดท้ายด้วยเสียงลมฟู่เสียดร่องฟันคมชัด ไม่สั่น',
    speakUsText: 'ess',
    speakUkText: 'ess',
    soundIpa: '/s/',
    sampleWords: [
      { word: 'sun', meaning: 'พระอาทิตย์', ipa: '/sʌn/' },
      { word: 'snake', meaning: 'งู', ipa: '/sneɪk/' },
      { word: 'bus', meaning: 'รถบัส', ipa: '/bʌs/' },
    ],
  },
  {
    letter: 'T',
    upper: 'T',
    lower: 't',
    ipaGenAm: '/tiː/',
    ipaRP: '/tiː/',
    thai: 'ที',
    category: 'consonant',
    phoneticType: 'Voiceless Alveolar Plosive',
    isCommonProblem: false,
    notes: 'ปลายลิ้นแตะปุ่มเหงือก กักลมแล้วดีดปล่อยลมระเบิดแรงชัดเจน',
    speakUsText: 'T',
    speakUkText: 'T',
    soundIpa: '/t/',
    sampleWords: [
      { word: 'ten', meaning: 'สิบ', ipa: '/tɛn/' },
      { word: 'top', meaning: 'ลูกข่าง', ipa: '/tɑːp/' },
      { word: 'cat', meaning: 'แมว', ipa: '/kæt/' },
    ],
  },
  {
    letter: 'U',
    upper: 'U',
    lower: 'u',
    ipaGenAm: '/juː/',
    ipaRP: '/juː/',
    thai: 'ยู',
    category: 'vowel',
    phoneticType: 'Palatal Approximant + Close Back Rounded Vowel',
    isCommonProblem: false,
    notes: 'เริ่มที่เสียงฐานเพดานแข็ง /j/ เลื่อนไปสู่สระอูปากกลม /uː/',
    speakUsText: 'you',
    speakUkText: 'you',
    soundIpa: '/ʌ/ (short u) & /juː/ /uː/ (long u)',
    sampleWords: [
      { word: 'cup', meaning: 'ถ้วย', ipa: '/kʌp/' },
      { word: 'cute', meaning: 'น่ารัก', ipa: '/kjuːt/' },
      { word: 'blue', meaning: 'สีฟ้า', ipa: '/bluː/' },
    ],
  },
  {
    letter: 'V',
    upper: 'V',
    lower: 'v',
    ipaGenAm: '/viː/',
    ipaRP: '/viː/',
    thai: 'วี (ก้องฟันหน้า)',
    category: 'consonant',
    phoneticType: 'Voiced Labiodental Fricative',
    isCommonProblem: true,
    notes: 'ฟันหน้าบนสัมผัสริมฝีปากล่าง ลมพ่นผ่านพร้อมเสียงสั่นสะเทือน ห้ามทำเป็น ว แหวน (/w/)',
    speakUsText: 'vee',
    speakUkText: 'vee',
    soundIpa: '/v/',
    sampleWords: [
      { word: 'van', meaning: 'รถตู้', ipa: '/væn/' },
      { word: 'vet', meaning: 'สัตวแพทย์', ipa: '/vɛt/' },
      { word: 'five', meaning: 'ห้า', ipa: '/faɪv/' },
    ],
  },
  {
    letter: 'W',
    upper: 'W',
    lower: 'w',
    ipaGenAm: '/ˈdʌbəl.juː/',
    ipaRP: '/ˈdʌbljuː/',
    thai: 'ดั๊บเบิ้ลยู',
    category: 'consonant',
    phoneticType: 'Polysyllabic Letter Name (3 syllables)',
    isCommonProblem: true,
    notes: 'เน้นเสียงหนักที่พยางค์แรก (DOU-ble-u) ตัวสะกด b ชัด ไม่รวบเสียง',
    speakUsText: 'double you',
    speakUkText: 'double you',
    soundIpa: '/w/',
    sampleWords: [
      { word: 'water', meaning: 'น้ำ', ipa: '/ˈwɔː.tər/' },
      { word: 'wind', meaning: 'ลม', ipa: '/wɪnd/' },
      { word: 'web', meaning: 'ใยแมงมุม', ipa: '/wɛb/' },
    ],
  },
  {
    letter: 'X',
    upper: 'X',
    lower: 'x',
    ipaGenAm: '/ɛks/',
    ipaRP: '/ɛks/',
    thai: 'เอ็กส์',
    category: 'consonant',
    phoneticType: 'Vowel + Voiceless Consonant Cluster (/k/ + /s/)',
    isCommonProblem: true,
    notes: 'สระ /ɛ/ ตามด้วยโคนลิ้นกัก /k/ แล้วดีดพ่นลมเสียดแทรก /s/ ห้ามตัดเสียง s ท้ายทิ้ง',
    speakUsText: 'ecks',
    speakUkText: 'ecks',
    soundIpa: '/ks/',
    sampleWords: [
      { word: 'box', meaning: 'กล่อง', ipa: '/bɑːks/' },
      { word: 'fox', meaning: 'สุนัขจิ้งจอก', ipa: '/fɑːks/' },
      { word: 'six', meaning: 'หก', ipa: '/sɪks/' },
    ],
  },
  {
    letter: 'Y',
    upper: 'Y',
    lower: 'y',
    ipaGenAm: '/waɪ/',
    ipaRP: '/waɪ/',
    thai: 'วาย',
    category: 'consonant',
    phoneticType: 'Labio-velar Glide + Diphthong',
    isCommonProblem: false,
    notes: 'ริมฝีปากห่อกลมเล็กน้อยก่อนแผ่ออกเป็นสระ /aɪ/',
    speakUsText: 'why',
    speakUkText: 'why',
    soundIpa: '/j/',
    sampleWords: [
      { word: 'yes', meaning: 'ใช่', ipa: '/jɛs/' },
      { word: 'yellow', meaning: 'สีเหลือง', ipa: '/ˈjɛl.oʊ/' },
      { word: 'toy', meaning: 'ของเล่น', ipa: '/tɔɪ/' },
    ],
  },
  {
    letter: 'Z',
    upper: 'Z',
    lower: 'z',
    ipaGenAm: '/ziː/',
    ipaRP: '/zɛd/',
    thai: 'ซี (ก้อง) / แซ็ด',
    category: 'consonant',
    phoneticType: 'Voiced Alveolar Sibilant Fricative',
    isCommonProblem: true,
    notes: 'จุดต่างสำคัญ: GenAm เรียก Zee (/ziː/) ก้องคอ; British RP เรียก Zed (/zɛd/) จบด้วยเสียง /d/',
    speakUsText: 'zee',
    speakUkText: 'zed',
    soundIpa: '/z/',
    sampleWords: [
      { word: 'zoo', meaning: 'สวนสัตว์', ipa: '/zuː/' },
      { word: 'zebra', meaning: 'ม้าลาย', ipa: '/ˈziː.brə/' },
      { word: 'buzz', meaning: 'เสียงหึ่งๆ', ipa: '/bʌz/' },
    ],
  },
];

export const ARTICULATION_GUIDES: Record<string, ArticulationGuide> = {
  C: {
    letter: 'C',
    upper: 'C',
    title: 'ตัวอักษร C — เสียงลมเสียดแทรกคมชัด ไม่สั่น',
    nameIpaGenAm: '/siː/',
    nameIpaRP: '/siː/',
    soundIpa: '/s/ (Soft C) & /k/ (Hard C)',
    mannerOfArticulation: 'Fricative (เสียงเสียดแทรกพ่นลมต่อเนื่อง)',
    placeOfArticulation: 'Alveolar (ปุ่มเหงือกบน)',
    voicing: 'Voiceless (ไม่สั่น - มีแต่ลมพ่น)',
    isVoiced: false,
    lipShape: 'มุมปากคลี่ยิ้มเล็กน้อย ฟันบนและฟันล่างชิดกันเกือบสนิท (เหลือช่องว่างเล็กมากๆ ให้ลมเสียดผ่าน)',
    tonguePosition:
      'ปลายลิ้นยกขึ้นไปจ่อใกล้กับปุ่มเหงือกด้านบน (Alveolar Ridge) หรืออยู่หลังฟันล่าง แต่ห้ามแตะติด! ตัวลิ้นสร้างร่องแคบตรงกลางเพื่อบีบกระแสลมให้พุ่งกระทบขอบฟันหน้า',
    commonThaiMistakes:
      'คนไทยมักออกเสียงเป็น "ชี" (ใช้ลิ้นแบบตัว ช /sh/ ริมฝีปากห่อ) หรือออกเสียงเป็นวรรณยุกต์เสียงโทสั้น "ซี่/ซิ" แทนที่จะเป็นสระอีเสียงยาวลากเรียบสม่ำเสมอ',
    actionableDrill:
      'ทำเสียงงูขู่ "สสสสส..." ค้างไว้ 2 วินาที แล้วต่อด้วยสระอีลากยาว [s-s-s-ee] ให้สัมผัสได้ถึงลมเย็นพุ่งผ่านร่องฟันหน้า โดยลำคอไม่มีการสั่นสะเทือน',
    comparisonPairs: [
      { target: 'C (/siː/ - ซีลมพ่น)', contrast: 'Z (/ziː/ - ซีก้องผึ้งบิน)', explanation: 'C มีแต่ลมพ่น / Z ลำคอต้องสั่นก้องหึ่ง' },
      { target: 'C (/siː/ - ซี)', contrast: 'She (/ʃiː/ - ชีปากห่อ)', explanation: 'C มุมปากยิ้มกว้าง / She ปากต้องห่อยื่นออกหน้า' },
    ],
    practiceWords: [
      { word: 'city', ipa: '/ˈsɪt.i/', thai: 'ซิตี้', meaning: 'เมือง' },
      { word: 'circle', ipa: '/ˈsɜːr.kəl/', thai: 'เซอเคิล', meaning: 'วงกลม' },
      { word: 'pencil', ipa: '/ˈpɛn.səl/', thai: 'เพนเซิล', meaning: 'ดินสอ' },
      { word: 'ice', ipa: '/aɪs/', thai: 'ไอซ์', meaning: 'น้ำแข็ง' },
    ],
    muscleTips: [
      'กระจกส่องหน้า: สังเกตฟันหน้า ต้องเห็นฟันหน้าบนและล่างขนานกัน',
      'มืออังปาก: สัมผัสได้ถึงลมเย็นพ่นออกมากระทบฝ่ามือ',
      'แตะลูกกระเดือก: กล่องเสียงต้องนิ่งสนิท 100% ไม่มีแรงสั่นสะเทือน',
    ],
  },
  G: {
    letter: 'G',
    upper: 'G',
    title: 'ตัวอักษร G — เสียงกักเสียดแทรกก้องกังวาน',
    nameIpaGenAm: '/dʒiː/',
    nameIpaRP: '/dʒiː/',
    soundIpa: '/dʒ/ (Soft G) & /ɡ/ (Hard G)',
    mannerOfArticulation: 'Affricate (เสียงกักแล้วระบายเป็นเสียงเสียดแทรก)',
    placeOfArticulation: 'Postalveolar (หลังปุ่มเหงือก)',
    voicing: 'Voiced (สั่นก้องในลำคอ)',
    isVoiced: true,
    lipShape: 'ริมฝีปากห่อเผยอออกด้านหน้าเล็กน้อย (Slight lip rounding / trumpet shape)',
    tonguePosition:
      'ปลายลิ้นและแผ่นลิ้น (Blade) ยกขึ้นประกบแนบสนิทกับบริเวณหลังปุ่มเหงือก เพื่อกักกระแสลมไว้ชั่วขณะ จากนั้นลดลิ้นลงเล็กน้อยให้ลมดันแทรกตัวออกมาอย่างรวดเร็ว พร้อมเส้นเสียงสั่นสะเทือน',
    commonThaiMistakes:
      'ออกเสียงเป็น "จี" แบบอักษร จ ในภาษาไทย ซึ่งเป็นเสียงไม่ก้อง (Voiceless unaspirated) ทำให้ผู้ฟังชาวต่างชาติได้ยินเป็นเสียงแห้งๆ ขาดมิติเสียงสะท้อน',
    actionableDrill:
      'เอานิ้วชี้แตะที่ลูกกระเดือก ทำเสียงก้องในลำคอ "ยี่..." ค้างไว้ แล้วเปลี่ยนเป็นยกแผ่นลิ้นกักลมที่เพดานหน้าให้ลูกกระเดือกสั่นสะเทือนระเบิดออกมาดัง "ดจี" (/dʒiː/)',
    comparisonPairs: [
      { target: 'G (/dʒiː/)', contrast: 'Key (/kiː/)', explanation: 'G โคนลิ้นก้องและปล่อยลมเสียด / Key พ่นลมระเบิดไม่ก้อง' },
      { target: 'Gin (/dʒɪn/)', contrast: 'Chin (/tʃɪn/)', explanation: 'Gin คอสั่นก้องตั้งแต่ต้น / Chin พ่นลมชู่วแรงไม่สั่น' },
    ],
    practiceWords: [
      { word: 'giant', ipa: '/ˈdʒaɪ.ənt/', thai: 'ไจแอนท์', meaning: 'ยักษ์' },
      { word: 'giraffe', ipa: '/dʒɪˈræf/', thai: 'จิราฟ', meaning: 'ยีราฟ' },
      { word: 'page', ipa: '/peɪdʒ/', thai: 'เพจ', meaning: 'หน้าหนังสือ' },
      { word: 'orange', ipa: '/ˈɔːr.ɪndʒ/', thai: 'ออเรนจ์', meaning: 'ส้ม' },
    ],
    muscleTips: [
      'เริ่มให้เส้นเสียงสั่นตั้งแต่ก่อนที่ลิ้นจะแยกตัวออกจากเพดานปาก',
      'ริมฝีปากต้องยื่นออกหน้าเล็กน้อย ไม่แบนราบ',
      'พลังเสียงมาจากกะบังลมดันลมผ่านเส้นเสียงที่บีบชิดกัน',
    ],
  },
  J: {
    letter: 'J',
    upper: 'J',
    title: 'ตัวอักษร J — กักเสียดแทรกก้อง สู่สระเลื่อนเอย์',
    nameIpaGenAm: '/dʒeɪ/',
    nameIpaRP: '/dʒeɪ/',
    soundIpa: '/dʒ/',
    mannerOfArticulation: 'Affricate + Closing Diphthong',
    placeOfArticulation: 'Postalveolar to Palatal',
    voicing: 'Voiced (สั่นก้องในลำคอ)',
    isVoiced: true,
    lipShape: 'เริ่มต้นห่อยื่นริมฝีปากเล็กน้อยเหมือนตัว G จากนั้นมุมปากคลี่ผายออกด้านข้างเมื่อเลื่อนเข้าสู่สระเอย์ /eɪ/',
    tonguePosition:
      'แผ่นลิ้นกักลมแน่นหลังปุ่มเหงือกแล้วระเบิดออกพร้อมเสียงก้อง จากนั้นตัวลิ้นเลื่อนลอยขึ้นจากระดับสระเอ /e/ ขึ้นสู่สระอิ /ɪ/',
    commonThaiMistakes:
      'ออกเสียงเป็น "เจ" ทื่อๆ เหมือนคำว่า เจ (กินเจ) ของไทย หรือกลายเป็น "เช" ซึ่งขาดทั้งการสั่นก้องของพยัญชนะต้นและการเลื่อนตัวของสระท้าย',
    actionableDrill:
      'ซ้อมแยกเป็น 2 ส่วน: [ดจ์] + [เอย์] แล้วรวบความเร็วเข้าด้วยกันให้เป็นพยางค์เดียวที่มีพลังและกล้ามเนื้อคอสั่นสะเทือน',
    comparisonPairs: [
      { target: 'J (/dʒeɪ/)', contrast: 'G (/dʒiː/)', explanation: 'J สระเอย์ (Jay) / G สระอี (Gee)' },
      { target: 'Jam (/dʒæm/)', contrast: 'Yam (/jæm/)', explanation: 'Jam มีการกักลมระเบิดแน่น / Yam เป็นเสียงลื่นไหลนุ่มนวล' },
    ],
    practiceWords: [
      { word: 'jam', ipa: '/dʒæm/', thai: 'แจม', meaning: 'แยมผลไม้' },
      { word: 'juice', ipa: '/dʒuːs/', thai: 'จูซ', meaning: 'น้ำผลไม้' },
      { word: 'jump', ipa: '/dʒʌmp/', thai: 'จัมพ์', meaning: 'กระโดด' },
      { word: 'jacket', ipa: '/ˈdʒæk.ɪt/', thai: 'แจ็กเก็ต', meaning: 'เสื้อแจ็กเก็ต' },
    ],
    muscleTips: [
      'สัมผัสการเปลี่ยนรูปร่างริมฝีปาก: จากห่อกลม -> คลี่ออกข้าง',
      'เส้นเสียงต้องสั่นก้องตั้งแต่ต้นจนจบพยางค์',
    ],
  },
  R: {
    letter: 'R',
    upper: 'R',
    title: 'ตัวอักษร R — ลิ้นลอยไม่แตะเพดาน (GenAm) vs. ไม่งอลิ้น (RP)',
    nameIpaGenAm: '/ɑːr/',
    nameIpaRP: '/ɑː/',
    soundIpa: '/r/ (Post-alveolar Approximant)',
    mannerOfArticulation: 'Central Approximant (เสียงเปิดผ่านช่องแคบ)',
    placeOfArticulation: 'Postalveolar / Retroflex / Pharyngeal',
    voicing: 'Voiced (สั่นก้องในลำคอ)',
    isVoiced: true,
    lipShape:
      'อเมริกัน: เริ่มอ้าปากกว้างสำหรับ /ɑː/ แล้วห่อริมฝีปากกลมเล็กน้อยเพื่อดึงเสียงสะท้อนตัว R / อังกฤษ RP: อ้าปากกว้างนิ่ง ไม่ห่อปากท้ายเสียง',
    tonguePosition:
      '★ กฎเหล็กอเมริกัน: ปลายลิ้นตวัดงอขึ้นไปด้านหลัง (Retroflex) หรือกกลิ้นรวบพองตัวขึ้นชิดฟันกรามบน (Bunched R) โดยที่ลิ้นลอยอยู่ในอากาศ ห้ามแตะโดนเพดานปากเด็ดขาด! / อังกฤษ RP: โคนลิ้นอยู่ต่ำ ปลายลิ้นแตะหลังฟันล่าง ไม่งอลิ้น',
    commonThaiMistakes:
      'คนไทยมักใช้ลิ้นรัวหรือกระดกลิ้นแบบตัว "ร เรือ" ของไทย หรือเอาลิ้นไปแตะปุ่มเหงือกด้านบนกลายเป็นตัว "ล ลิง" (L) ทำให้คำว่า Red กลายเป็น Led หรือ รัวลิ้นผิดธรรมชาติ',
    actionableDrill:
      'ฝึกสำเนียงอเมริกัน: อ้าปากเปล่งเสียง "อา..." จากนั้นค่อยๆ ดึงปลายลิ้นและร่นตัวลิ้นถอยไปด้านหลังในลำคอ โดยคอยระวังไม่ให้ลิ้นสัมผัสส่วนใดๆ ของปาก จะเกิดเสียงก้องทุ้มลึก "อาร์รื"',
    comparisonPairs: [
      { target: 'R (/ɑːr/ ลิ้นลอย)', contrast: 'L (/ɛl/ ปลายลิ้นแตะปุ่มเหงือกแน่น)', explanation: 'R ลิ้นห้ามแตะเพดาน / L ปลายลิ้นต้องแตะปุ่มเหงือก' },
      { target: 'Red (/rɛd/)', contrast: 'Led (/lɛd/)', explanation: 'Red ริมฝีปากห่อลิ้นดึงถอย / Led ลิ้นแตะเหงือกสะบัดลง' },
    ],
    practiceWords: [
      { word: 'red', ipa: '/rɛd/', thai: 'เร็ด', meaning: 'สีแดง' },
      { word: 'rain', ipa: '/reɪn/', thai: 'เรน', meaning: 'ฝน' },
      { word: 'car', ipa: '/kɑːr/', thai: 'คาร์', meaning: 'รถยนต์' },
      { word: 'star', ipa: '/stɑːr/', thai: 'สตาร์', meaning: 'ดวงดาว' },
    ],
    muscleTips: [
      'จำสูตร: "R ลอย ห้ามแตะเพดาน"',
      'ขอบข้างของลิ้นแตะฟันกรามบนทั้งสองข้าง เพื่อสร้างอุโมงค์เสียงตรงกลาง',
      'หากปลายลิ้นแตะเพดานเมื่อใด แสดงว่าผิดทันที',
    ],
  },
  V: {
    letter: 'V',
    upper: 'V',
    title: 'ตัวอักษร V — ฟันบนแตะปากล่าง เส้นเสียงสั่นก้อง',
    nameIpaGenAm: '/viː/',
    nameIpaRP: '/viː/',
    soundIpa: '/v/',
    mannerOfArticulation: 'Labiodental Fricative (เสียงเสียดแทรกฟัน-ริมฝีปาก)',
    placeOfArticulation: 'Labiodental (ฟันบนสัมผัสริมฝีปากล่าง)',
    voicing: 'Voiced (สั่นก้องในลำคออย่างแรง)',
    isVoiced: true,
    lipShape:
      'ฟันหน้าบนสัมผัสกับขอบด้านในของริมฝีปากล่างเบาๆ (บริเวณรอยต่อแห้ง-เปียก) ไม่กัดแน่น ให้เหลือช่องลมระบายผ่าน',
    tonguePosition:
      'ลิ้นอยู่ในตำแหน่งพักตามธรรมชาติ ไม่ได้ทำหน้าที่กั้นทางเดินลม',
    commonThaiMistakes:
      'คนไทยมักนำริมฝีปากบนและล่างมาประกบกันแล้วออกเสียงเป็นตัว "ว แหวน" (/w/) ทำให้คู่สนทนาสับสนระหว่าง Van กับ Wan หรือ Very กับ Wery',
    actionableDrill:
      'วางฟันหน้าบนแตะบนริมฝีปากล่าง เปล่งเสียงฮัมในคอพร้อมปล่อยลม จะรู้สึกถึงความคันยิบๆ จากแรงสั่นสะเทือนที่ริมฝีปากล่าง จากนั้นออกเสียง "วี" [vvvv-ee]',
    comparisonPairs: [
      { target: 'V (/viː/ ฟันบนแตะปากล่าง)', contrast: 'W (/ˈdʌbəl.juː/ ปากห่อกลมสองข้าง)', explanation: 'V มีฟันแตะริมฝีปาก / W ริมฝีปากห่อกลมเป็นวงกลม' },
      { target: 'Van (/væn/)', contrast: 'Fan (/fæn/)', explanation: 'Van คอสั่นก้อง / Fan มีแต่ลมพ่นไม่สั่น' },
    ],
    practiceWords: [
      { word: 'van', ipa: '/væn/', thai: 'แวน', meaning: 'รถตู้' },
      { word: 'vet', ipa: '/vɛt/', thai: 'เว็ท', meaning: 'สัตวแพทย์' },
      { word: 'voice', ipa: '/vɔɪs/', thai: 'วอยซ์', meaning: 'เสียงพูด' },
      { word: 'five', ipa: '/faɪv/', thai: 'ไฟฟ์', meaning: 'เลขห้า' },
    ],
    muscleTips: [
      'สัมผัสอาการคันยิบๆ ที่ริมฝีปากล่าง เป็นสัญญาณว่าทำถูกต้อง 100%',
      'อย่ากัดริมฝีปากแรงจนลมออกไม่ได้ แค่วางแตะเบาๆ',
      'ส่องกระจก: ต้องมองเห็นฟันหน้าบนทับอยู่บนริมฝีปากล่างอย่างชัดเจน',
    ],
  },
  Z: {
    letter: 'Z',
    upper: 'Z',
    title: 'ตัวอักษร Z — ผึ้งบินสั่นสะเทือนลำคอ (Zee vs. Zed)',
    nameIpaGenAm: '/ziː/',
    nameIpaRP: '/zɛd/',
    soundIpa: '/z/',
    mannerOfArticulation: 'Sibilant Fricative (เสียงเสียดแทรกผิวฟันก้อง)',
    placeOfArticulation: 'Alveolar (ปุ่มเหงือกบน)',
    voicing: 'Voiced (สั่นก้องในลำคออย่างรุนแรง)',
    isVoiced: true,
    lipShape: 'มุมปากเหยียดยิ้มกว้าง ฟันบนและล่างสบกันเบาๆ คล้ายตัว C',
    tonguePosition:
      'ปลายลิ้นยกขึ้นจ่อหลังปุ่มเหงือกบนใกล้ชิดเหมือนตัว C ทุกประการ แต่เปิดสวิตช์กล่องเสียงในลำคอให้สั่นสะเทือนต่อเนื่อง',
    commonThaiMistakes:
      'ออกเสียง Z เหมือนตัว C หรือตัว ซ โซ่ ของไทย ซึ่งเป็นเสียงไม่ก้อง (Voiceless) ทำให้ฝรั่งแยกไม่ออกระหว่าง Zoo กับ Sue หรือชื่อตัวอักษร C กับ Z',
    actionableDrill:
      'ทดลอง 2 ขั้นตอน: 1) ทำเสียงงูพ่นลม "สสส..." (ตัว C) 2) ขณะที่ลมยังพ่นอยู่ ให้เปิดเสียงในลำคอดัง "หึ่งงง..." ทันที ลมจะเปลี่ยนเป็นเสียงผึ้งบินตอมดอกไม้ "ซซซซซ..." (ตัว Z) ทันที',
    comparisonPairs: [
      { target: 'Z (US /ziː/ คอสั่น)', contrast: 'C (/siː/ ลมพ่นคอไม่สั่น)', explanation: 'Z กล่องเสียงสั่นสะเทือนแรง / C เส้นเสียงนิ่งสนิท' },
      { target: 'Z (US /ziː/ ซี)', contrast: 'Z (UK /zɛd/ แซ็ด)', explanation: 'อเมริกันลงท้ายสระอี / อังกฤษลงท้ายเสียงกัก /d/' },
    ],
    practiceWords: [
      { word: 'zoo', ipa: '/zuː/', thai: 'ซู', meaning: 'สวนสัตว์' },
      { word: 'zero', ipa: '/ˈzɪə.roʊ/', thai: 'ซีโร่', meaning: 'ศูนย์' },
      { word: 'zebra', ipa: '/ˈziː.brə/', thai: 'ซีบร้า', meaning: 'ม้าลาย' },
      { word: 'buzz', ipa: '/bʌz/', thai: 'บัซ', meaning: 'เสียงหึ่งๆ' },
    ],
    muscleTips: [
      'เอามือจับลำคอ: จะต้องรู้สึกถึงแรงสั่นสะเทือนเหมือนโทรศัพท์มือถือสั่น',
      'สำเนียงบริติช (RP): ออกเสียงว่า "แซ็ด" (/zɛd/) ลิ้นแตะปุ่มเหงือกปิดท้าย',
      'สำเนียงอเมริกัน: ออกเสียงว่า "ซี" (/ziː/) สระอียาวสัมผัสผึ้งบิน',
    ],
  },
  X: {
    letter: 'X',
    upper: 'X',
    title: 'ตัวอักษร X — สระเอะ + โคนลิ้นกัก /k/ + ดีดพ่นลม /s/',
    nameIpaGenAm: '/ɛks/',
    nameIpaRP: '/ɛks/',
    soundIpa: '/ks/ (Voiceless Cluster)',
    mannerOfArticulation: 'Vowel + Stop Plosive + Sibilant Fricative',
    placeOfArticulation: 'Velar + Alveolar',
    voicing: 'Voiceless Cluster (พยัญชนะท้ายไม่สั่น)',
    isVoiced: false,
    lipShape: 'อ้าปากปานกลางสำหรับสระเอะ /ɛ/ จากนั้นรวบฟันและมุมปากยิ้มเพื่อพ่นเสียงเสียดแทรก /s/ ต่อเนื่องทันที',
    tonguePosition:
      'จังหวะ 1: โคนลิ้นด้านหลังยกขึ้นแตะเพดานอ่อนเพื่อหยุดกักลมอย่างเฉียบพลัน (/k/) -> จังหวะ 2: คลายโคนลิ้นทันทีพร้อมกับปลายลิ้นดีดขึ้นจ่อปุ่มเหงือกพ่นลมซี้ดคมๆ ออกมาทางร่องฟันหน้า (/s/)',
    commonThaiMistakes:
      'คนไทยมักออกเสียงเป็น "เอ็ก" ทื่อๆ โดยตัดเสียงพ่นลม /s/ ท้ายทิ้ง กลายสภาพเป็นตัวสะกดแม่กก หรือบางคนเติมสระเกินเป็น "เอ็ก-สะ"',
    actionableDrill:
      'ออกเสียงคำว่า "เอ็ก" ในใจ แต่ในจังหวะที่โคนลิ้นกักลม ให้พ่นลมซี้ดคมๆ ออกมาทางร่องฟันหน้าทันที: [Ek] + [s] -> "เอ็กส์"',
    comparisonPairs: [
      { target: 'X (/ɛks/ เอ็กส์)', contrast: 'S (/ɛs/ เอ็ส)', explanation: 'X มีเสียงกักกระแทก /k/ คั่นกลาง / S ไหลลื่นจากสระสู่เสียงลม' },
      { target: 'Box (/bɑːks/)', contrast: 'Bock (/bɑːk/)', explanation: 'Box ต้องมีเสียง /s/ ปิดท้ายอย่างชัดเจนเสมอ' },
    ],
    practiceWords: [
      { word: 'box', ipa: '/bɑːks/', thai: 'บ็อกซ์', meaning: 'กล่อง' },
      { word: 'fox', ipa: '/fɑːks/', thai: 'ฟ็อกซ์', meaning: 'สุนัขจิ้งจอก' },
      { word: 'six', ipa: '/sɪks/', thai: 'ซิกส์', meaning: 'หก' },
      { word: 'taxi', ipa: '/ˈtæk.si/', thai: 'แท็กซี่', meaning: 'รถแท็กซี่' },
    ],
    muscleTips: [
      'ห้ามตัดเสียงลม /s/ ท้ายทิ้งโดยเด็ดขาด เพราะเป็นแกนสำคัญของอักษร X',
      'จังหวะกัก /k/ กับพ่น /s/ ต้องเกิดขึ้นรวดเร็วแบบไร้รอยต่อ',
    ],
  },
};

export const PhonicsHelpIpaModal: React.FC<PhonicsHelpIpaModalProps> = ({
  isOpen,
  onClose,
  speedRate = 0.75,
}) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'articulation' | 'tips'>('chart');
  const [accentMode, setAccentMode] = useState<'en-US' | 'en-GB'>('en-US');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'problem' | 'vowels' | 'consonants'>('all');
  const [selectedGuideKey, setSelectedGuideKey] = useState<string>('C');
  const [speakingLetter, setSpeakingLetter] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter 26 letters
  const filteredLetters = ALPHABET_IPA_DATA.filter((item) => {
    const matchesSearch =
      item.letter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ipaGenAm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ipaRP.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.thai.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterCategory === 'problem') return item.isCommonProblem;
    if (filterCategory === 'vowels') return item.category === 'vowel';
    if (filterCategory === 'consonants') return item.category === 'consonant';
    return true;
  });

  const handlePlayLetter = (item: AlphabetLetterIPA, forcedAccent?: 'en-US' | 'en-GB') => {
    unlockAudio();
    const dialect = forcedAccent || accentMode;
    const textToSpeak = dialect === 'en-GB' ? item.speakUkText : item.speakUsText;

    setSpeakingLetter(item.letter);
    speakText(textToSpeak, {
      lang: dialect,
      rate: speedRate,
      pitch: 1.02,
      onEnd: () => setSpeakingLetter(null),
    });
  };

  const handlePlayWord = (word: string, forcedAccent?: 'en-US' | 'en-GB') => {
    unlockAudio();
    const dialect = forcedAccent || accentMode;
    speakText(word, {
      lang: dialect,
      rate: speedRate,
      pitch: 1.0,
    });
  };

  const currentGuide = ARTICULATION_GUIDES[selectedGuideKey] || ARTICULATION_GUIDES['C'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="phonics-help-ipa-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border-2 border-amber-300 flex flex-col overflow-hidden animate-scaleUp">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shadow-inner shrink-0">
              🗣️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="phonics-help-ipa-title" className="text-base sm:text-xl font-bubble font-black tracking-wide text-white drop-shadow-xs">
                  Phonics Help: IPA & Articulation
                </h2>
                <span className="bg-amber-200/30 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border border-white/30 hidden sm:inline">
                  A–Z มาตรฐานสากล
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-100 font-medium">
                คู่มือสัทศาสตร์สากล IPA & สรีรศาสตร์การจัดรูปปากและตำแหน่งลิ้น (C, G, J, R, V, Z, X)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/15 hover:bg-white/30 text-white transition active:scale-90 cursor-pointer"
            title="ปิดหน้าต่าง"
            aria-label="ปิด"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* SUBHEADER CONTROLS & TABS */}
        <div className="bg-amber-50/90 border-b border-amber-200/90 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-amber-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('chart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'chart'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
              }`}
            >
              <span>🔤 ตาราง 26 ตัว A–Z</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('articulation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'articulation'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span>👅 รูปปาก & ลิ้น (C, G, J, R, V, Z, X)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tips')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'tips'
                  ? 'bg-indigo-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50'
              }`}
            >
              <span>💡 กฎเหล็ก & เทคนิค</span>
            </button>
          </div>

          {/* Accent Dialect Switcher (GenAm vs British RP) */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold hidden sm:inline">สำเนียงเสียง:</span>
            <div className="inline-flex rounded-xl p-0.5 bg-slate-200/80 border border-slate-300">
              <button
                type="button"
                onClick={() => setAccentMode('en-US')}
                className={`px-2.5 py-1 text-xs font-black rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  accentMode === 'en-US'
                    ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="General American (สำเนียงอเมริกันมาตรฐาน)"
              >
                <span>🇺🇸</span>
                <span>GenAm (US)</span>
              </button>
              <button
                type="button"
                onClick={() => setAccentMode('en-GB')}
                className={`px-2.5 py-1 text-xs font-black rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  accentMode === 'en-GB'
                    ? 'bg-white text-rose-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="British Received Pronunciation (สำเนียงบริติชมาตรฐาน - RP)"
              >
                <span>🇬🇧</span>
                <span>British (RP)</span>
              </button>
            </div>
          </div>
        </div>

        {/* MODAL BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60 space-y-6">
          {/* TAB 1: 26 LETTERS IPA COMPARISON CHART */}
          {activeTab === 'chart' && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-amber-200 shadow-2xs">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาตัวอักษร, สัญลักษณ์ IPA หรือคำอ่านไทย..."
                    className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400 bg-slate-50/70"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setFilterCategory('all')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      filterCategory === 'all'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ทั้งหมด (26)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory('problem')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                      filterCategory === 'problem'
                        ? 'bg-rose-500 text-white'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    <span>⚠️</span>
                    <span>มักออกเสียงผิด (7)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory('vowels')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      filterCategory === 'vowels'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                    }`}
                  >
                    สระ (5)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory('consonants')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      filterCategory === 'consonants'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    พยัญชนะ (21)
                  </button>
                </div>
              </div>

              {/* Letters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredLetters.map((item) => {
                  const isProblem = item.isCommonProblem;
                  const isPlaying = speakingLetter === item.letter;

                  return (
                    <div
                      key={item.letter}
                      className={`relative rounded-2xl p-3.5 border transition-all duration-150 flex flex-col justify-between gap-2.5 bg-white shadow-2xs hover:shadow-md ${
                        isProblem
                          ? 'border-rose-300 ring-1 ring-rose-200 hover:border-rose-400'
                          : 'border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      {/* Top Bar: Letter & Sound Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handlePlayLetter(item)}
                            className={`w-11 h-11 rounded-xl font-bubble font-black text-xl flex items-center justify-center transition shadow-2xs cursor-pointer active:scale-95 ${
                              isPlaying
                                ? 'bg-amber-500 text-white animate-bounce'
                                : isProblem
                                ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            }`}
                            title={`คลิกเพื่อฟังเสียงตัวอักษร ${item.letter} (${accentMode === 'en-US' ? 'US' : 'UK'})`}
                          >
                            <span>{item.upper}</span>
                            <span className="text-sm font-bold opacity-75">{item.lower}</span>
                          </button>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-800 text-sm">
                                {item.upper} / {item.lower}
                              </span>
                              <span className="text-xs text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                                {item.thai}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium">
                              เสียงโฟนิกส์: <strong className="text-slate-700">{item.soundIpa}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Quick Audio Play Button */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handlePlayLetter(item, 'en-US')}
                            title="ฟังเสียงสำเนียงอเมริกัน (General American)"
                            className={`p-1.5 rounded-lg border text-[11px] font-black transition cursor-pointer ${
                              accentMode === 'en-US'
                                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            🇺🇸 US
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePlayLetter(item, 'en-GB')}
                            title="ฟังเสียงสำเนียงบริติช (British RP)"
                            className={`p-1.5 rounded-lg border text-[11px] font-black transition cursor-pointer ${
                              accentMode === 'en-GB'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            🇬🇧 UK
                          </button>
                        </div>
                      </div>

                      {/* Middle: Standard IPA Symbols comparison */}
                      <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-blue-700 font-extrabold flex items-center gap-0.5">
                            🇺🇸 GenAm (US):
                          </span>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {item.ipaGenAm}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-rose-700 font-extrabold flex items-center gap-0.5">
                            🇬🇧 British (RP):
                          </span>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {item.ipaRP}
                          </span>
                        </div>
                      </div>

                      {/* Notes / Accent difference */}
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {item.notes}
                      </p>

                      {/* Sample Words Pills */}
                      <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-100">
                        {item.sampleWords.map((sample) => (
                          <button
                            key={sample.word}
                            type="button"
                            onClick={() => handlePlayWord(sample.word)}
                            className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 text-[10px] font-semibold border border-amber-200 transition cursor-pointer flex items-center gap-1 active:scale-95"
                            title={`ฟังเสียงคำว่า "${sample.word}" (${sample.meaning})`}
                          >
                            <Volume2 className="w-2.5 h-2.5 text-amber-600" />
                            <span>{sample.word}</span>
                          </button>
                        ))}

                        {/* Shortcut to Articulation Guide for mispronounced letters */}
                        {isProblem && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGuideKey(item.letter);
                              setActiveTab('articulation');
                            }}
                            className="ml-auto text-[10px] font-bold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>ดูรูปปาก & ลิ้น</span>
                            <span>→</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED ARTICULATION GUIDES (C, G, J, R, V, Z, X) */}
          {activeTab === 'articulation' && (
            <div className="space-y-6">
              {/* Top Selector Pills for the 7 tricky letters */}
              <div className="bg-white p-3 rounded-2xl border-2 border-rose-200 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-rose-800">
                    <span>👅</span>
                    <span>เลือกตัวอักษรที่ต้องการดูการจัดรูปปากและตำแหน่งลิ้นอย่างละเอียด:</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                    คลิกเพื่อเปิดคู่มือสรีรศาสตร์
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {['C', 'G', 'J', 'R', 'V', 'Z', 'X'].map((letterKey) => {
                    const isSelected = selectedGuideKey === letterKey;
                    const guideItem = ARTICULATION_GUIDES[letterKey];

                    return (
                      <button
                        key={letterKey}
                        type="button"
                        onClick={() => setSelectedGuideKey(letterKey)}
                        className={`p-2 sm:p-2.5 rounded-xl font-bubble font-black text-base sm:text-xl transition flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 border-2 ${
                          isSelected
                            ? 'bg-rose-500 text-white border-rose-600 shadow-sm shadow-rose-300'
                            : 'bg-rose-50/80 text-rose-900 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        <span>{letterKey}</span>
                        <span className={`text-[10px] sm:text-[11px] font-mono ${isSelected ? 'text-white' : 'text-rose-600'}`}>
                          {guideItem?.nameIpaGenAm || ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Letter Articulation Deep Dive Card */}
              <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-amber-200 shadow-sm space-y-6">
                {/* Header of the guide */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-bubble font-black text-3xl flex items-center justify-center shadow-md shadow-rose-300/40">
                      {currentGuide.upper}
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bubble font-black text-slate-900">
                        {currentGuide.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                          GenAm: {currentGuide.nameIpaGenAm}
                        </span>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                          British RP: {currentGuide.nameIpaRP}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                            currentGuide.isVoiced
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {currentGuide.voicing}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Audio Listen Buttons */}
                  <div className="flex items-center gap-2 self-stretch sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        const letterData = ALPHABET_IPA_DATA.find((a) => a.letter === currentGuide.upper);
                        if (letterData) handlePlayLetter(letterData, 'en-US');
                      }}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>ฟังเสียงชื่อ {currentGuide.upper} (US)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const letterData = ALPHABET_IPA_DATA.find((a) => a.letter === currentGuide.upper);
                        if (letterData) handlePlayLetter(letterData, 'en-GB');
                      }}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>ฟังชื่อ {currentGuide.upper} (UK)</span>
                    </button>
                  </div>
                </div>

                {/* 2-Column Articulation Details: Lip Shape vs Tongue Position */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lip Shape Card */}
                  <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                      <span className="text-xl">👄</span>
                      <span>รูปปาก & ริมฝีปาก (Lip Shape)</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                      {currentGuide.lipShape}
                    </p>
                  </div>

                  {/* Tongue Position Card */}
                  <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-sm">
                      <span className="text-xl">👅</span>
                      <span>ตำแหน่งลิ้น & จุดสัมผัส (Tongue Position)</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                      {currentGuide.tonguePosition}
                    </p>
                  </div>
                </div>

                {/* Common Thai Pitfalls & Actionable Muscle Drills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Common Mistake */}
                  <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-200 space-y-2">
                    <div className="flex items-center gap-2 text-rose-900 font-extrabold text-sm">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>ข้อผิดพลาดที่พบบ่อยของคนไทย</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {currentGuide.commonThaiMistakes}
                    </p>
                  </div>

                  {/* Actionable Drill */}
                  <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                      <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>แบบฝึกหัดปรับกล้ามเนื้อปาก (Actionable Drill)</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {currentGuide.actionableDrill}
                    </p>
                  </div>
                </div>

                {/* Minimal Contrast Pairs (เปรียบเทียบคู่ตรงข้ามเพื่อความชัดเจน) */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs sm:text-sm">
                    <span>⚖️</span>
                    <span>ตารางเปรียบเทียบคู่ตรงข้าม (Minimal Pairs / Contrast)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentGuide.comparisonPairs.map((pair, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span className="text-rose-700">{pair.target}</span>
                          <span className="text-slate-400">vs</span>
                          <span className="text-blue-700">{pair.contrast}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{pair.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Practice Words with Audio */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-800">
                      🔊 คำศัพท์ตัวอย่างสำหรับฝึกออกเสียง:
                    </span>
                    <span className="text-[11px] text-slate-400">
                      คลิกเพื่อฟังเสียงจริง
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {currentGuide.practiceWords.map((item) => (
                      <button
                        key={item.word}
                        type="button"
                        onClick={() => handlePlayWord(item.word)}
                        className="p-3 rounded-2xl bg-gradient-to-b from-white to-amber-50/50 hover:to-amber-100 border border-amber-200 transition shadow-2xs hover:shadow-xs text-left cursor-pointer active:scale-95"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bubble font-black text-amber-900 text-sm sm:text-base">
                            {item.word}
                          </span>
                          <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">{item.ipa}</div>
                        <div className="text-xs text-amber-700 font-bold mt-0.5">{item.meaning}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Muscle Memory Tips Bullet Checklist */}
                <div className="bg-amber-100/60 p-4 rounded-2xl border border-amber-300/80 space-y-1.5">
                  <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>เช็กลิสต์ความจำกล้ามเนื้อ (Muscle Memory Checklist):</span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc">
                    {currentGuide.muscleTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MASTER TIPS & PHONETIC RULES */}
          {activeTab === 'tips' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tip 1: Voiced vs. Voiceless */}
                <div className="bg-white p-5 rounded-3xl border-2 border-amber-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-amber-800 font-bubble font-black text-base">
                    <span className="text-2xl">🔔</span>
                    <span>กฎข้อที่ 1: การสั่นของเส้นเสียง (Voicing)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    หัวใจของภาษาอังกฤษคือการแยกแยะระหว่างเสียง **Voiced (ก้อง)** กับ **Voiceless (ไม่ก้อง)**:
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                      <strong>Voiced (เสียงก้อง):</strong> ลำคอและกล่องเสียงต้องสั่นสะเทือน ได้แก่ <strong>B, D, G, J, L, M, N, R, V, W, Y, Z</strong> และสระทุกตัว
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                      <strong>Voiceless (เสียงไม่ก้อง):</strong> มีเฉพาะลมพ่น ลำคอนิ่งสนิท ได้แก่ <strong>C, F, H, K, P, S, T, X</strong>
                    </div>
                  </div>
                </div>

                {/* Tip 2: V vs. W rule */}
                <div className="bg-white p-5 rounded-3xl border-2 border-rose-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 font-bubble font-black text-base">
                    <span className="text-2xl">👄</span>
                    <span>กฎข้อที่ 2: V กับ W ต่างกันอย่างไร?</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    นี่คือข้อผิดพลาดอันดับ 1 ของคนไทย:
                  </p>
                  <ul className="text-xs text-slate-700 space-y-1.5 pl-4 list-disc">
                    <li>
                      <strong>ตัว V:</strong> ฟันบนต้องสัมผัสริมฝีปากล่างเสมอ และมีเสียงสั่นก้องคอ คันยิบๆ ที่ริมฝีปาก
                    </li>
                    <li>
                      <strong>ตัว W:</strong> ริมฝีปากสองข้างต้องห่อกลมเป็นวงกลม (เหมือนเป่านกหวีด) ฟันบนไม่แตะปากล่าง
                    </li>
                    <li>
                      ทดสอบ: พูด <em>"Very well"</em> — Very ฟันแตะปาก / well ปากห่อกลม
                    </li>
                  </ul>
                </div>

                {/* Tip 3: C vs. Z rule */}
                <div className="bg-white p-5 rounded-3xl border-2 border-blue-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-blue-800 font-bubble font-black text-base">
                    <span className="text-2xl">🐝</span>
                    <span>กฎข้อที่ 3: C vs. Z (คู่แฝดพ่นลม vs ผึ้งบิน)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    ตำแหน่งลิ้นและฟันเหมือนกันทุกประการ ต่างกันแค่การสั่นของกล่องเสียง:
                  </p>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p>• <strong>C (/siː/):</strong> เสียงเหมือนงูขู่ "สสส..." พ่นลมเย็น ไม่มีการสั่นในลำคอ</p>
                    <p>• <strong>Z (/ziː/):</strong> เสียงเหมือนผึ้งบิน "ซซซ..." กล่องเสียงในลำคอสั่นสะเทือนแรง</p>
                  </div>
                </div>

                {/* Tip 4: R is not ร เรือ */}
                <div className="bg-white p-5 rounded-3xl border-2 border-purple-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-purple-800 font-bubble font-black text-base">
                    <span className="text-2xl">🚫</span>
                    <span>กฎข้อที่ 4: R ในภาษาอังกฤษ ไม่ใช่ "ร เรือ"</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    ในภาษาอังกฤษมาตรฐาน (ทั้ง GenAm และ RP) ตัว R <strong>ไม่มีการรัวลิ้นหรือกระดกลิ้น</strong>:
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    สำหรับสำเนียงอเมริกัน ปลายลิ้นต้อง <strong>"ลอยอยู่ในอากาศและดึงถอยไปด้านหลัง"</strong> โดยไม่แตะโดนเพดานปากส่วนใดๆ ทั้งสิ้น
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTION BAR */}
        <div className="bg-white border-t border-amber-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-amber-600 shrink-0 hidden sm:inline" />
            <span>มาตรฐานสัทศาสตร์ IPA สากล: American General English & British RP</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer"
            >
              เข้าใจแล้ว ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
