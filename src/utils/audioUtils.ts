/**
 * @license
 * Robust Phonics Audio & Speech Synthesis Engine
 * Designed for reliable playback on Chrome, Safari, Edge, iOS, and Android.
 */

import { LETTER_PHONICS_MAP } from '../data/phonicsData';
import { PhonicsWord } from '../types/phonics';

// Shared Web Audio Context with auto-resume
let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Unlocks audio context on user interaction (critical for mobile browsers)
export function unlockAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // Also unlock SpeechSynthesis on iOS/Safari
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }
  } catch {
    //
  }
}

if (typeof window !== 'undefined') {
  const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown'];
  const onUserInteraction = () => {
    unlockAudio();
    unlockEvents.forEach((evt) => window.removeEventListener(evt, onUserInteraction));
  };
  unlockEvents.forEach((evt) => window.addEventListener(evt, onUserInteraction, { once: true }));
}

// ==========================================
// Web Audio Synthesized Sound Effects (Always reliable)
// ==========================================

export function playLetterClickSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch {
    //
  }
}

export function playPopSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.07);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    //
  }
}

export function playCorrectSound() {
  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.26);
    });
  } catch {
    //
  }
}

export function playIncorrectSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.21);
  } catch {
    //
  }
}

export function playFanfareSound() {
  try {
    const ctx = getAudioContext();
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);

      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + 0.65);
    });
  } catch {
    //
  }
}

export function playSparkleSound() {
  try {
    const ctx = getAudioContext();
    const notes = [880, 1174.66, 1396.91, 1760];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + idx * 0.06 + 0.21);
    });
  } catch {
    //
  }
}

// ==========================================
// Speech Synthesis (Phonics & Pronunciation)
// Bulletproof with GC prevention & Queue recovery
// ==========================================

// Global reference set to protect SpeechSynthesisUtterance from Garbage Collector (Chrome bug)
const activeUtterances = new Set<SpeechSynthesisUtterance>();

let availableVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const update = () => {
      availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        voicesLoaded = true;
        resolve(availableVoices);
      }
    };

    update();
    if (!voicesLoaded) {
      window.speechSynthesis.onvoiceschanged = () => {
        update();
        resolve(availableVoices);
      };
      // Fallback timeout in case onvoiceschanged does not fire
      setTimeout(() => {
        update();
        resolve(availableVoices);
      }, 500);
    }
  });
}

// Initialize voices immediately
if (typeof window !== 'undefined') {
  loadVoices();
}

export function getAllVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  if (!availableVoices.length) {
    availableVoices = window.speechSynthesis.getVoices();
  }
  return availableVoices;
}

export function getEnglishVoice(preferredVoiceURI?: string): SpeechSynthesisVoice | null {
  const voices = getAllVoices();
  if (!voices.length) return null;

  if (preferredVoiceURI) {
    const found = voices.find((v) => v.voiceURI === preferredVoiceURI);
    if (found) return found;
  }

  // Priority 1: High quality English voices
  const highQuality = voices.find(
    (v) =>
      (v.lang.startsWith('en-US') || v.lang.startsWith('en-GB')) &&
      (v.name.includes('Natural') ||
        v.name.includes('Google US English') ||
        v.name.includes('Samantha') ||
        v.name.includes('Jenny') ||
        v.name.includes('Karen') ||
        v.name.includes('Daniel'))
  );
  if (highQuality) return highQuality;

  // Priority 2: Any en-US voice
  const usVoice = voices.find((v) => v.lang.startsWith('en-US'));
  if (usVoice) return usVoice;

  // Priority 3: Any English voice
  const anyEnglish = voices.find((v) => v.lang.startsWith('en'));
  if (anyEnglish) return anyEnglish;

  return voices[0] || null;
}

export function getThaiVoice(): SpeechSynthesisVoice | null {
  const voices = getAllVoices();
  return voices.find((v) => v.lang.startsWith('th')) || null;
}

export interface SpeakOptions {
  rate?: number; // 0.6 to 1.1
  pitch?: number; // 0.8 to 1.3
  volume?: number;
  lang?: string;
  voiceURI?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    activeUtterances.clear();
  }
}

// Low-level safe speak function
export function speakText(text: string, options: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    const synth = window.speechSynthesis;

    // Resume if paused
    if (synth.paused) {
      synth.resume();
    }

    // Cancel previous audio cleanly
    synth.cancel();

    // Small delay to prevent Chrome cancel-speak collision bug
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      activeUtterances.add(utterance);

      const isThai = options.lang?.startsWith('th') || /[\u0E00-\u0E7F]/.test(text);

      if (isThai) {
        const thaiVoice = getThaiVoice();
        if (thaiVoice) utterance.voice = thaiVoice;
        utterance.lang = 'th-TH';
        utterance.rate = options.rate ?? 0.9;
        utterance.pitch = options.pitch ?? 1.0;
      } else {
        const enVoice = getEnglishVoice(options.voiceURI);
        if (enVoice) utterance.voice = enVoice;
        utterance.lang = options.lang || 'en-US';
        utterance.rate = options.rate ?? 0.85; // friendly pace for primary students
        utterance.pitch = options.pitch ?? 1.05; // slightly cheerful
      }

      utterance.volume = options.volume ?? 1.0;

      let hasCleanedUp = false;
      const cleanup = () => {
        if (!hasCleanedUp) {
          hasCleanedUp = true;
          activeUtterances.delete(utterance);
          options.onEnd?.();
          resolve();
        }
      };

      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onend = cleanup;
      utterance.onerror = (e) => {
        // 'interrupted' or 'canceled' are normal when user navigates
        cleanup();
      };

      // Watchdog timer: In case browser hangs or loses the onend event
      const estimatedDuration = Math.max(1200, (text.length / 10) * 1200);
      const watchdog = setTimeout(() => {
        cleanup();
      }, estimatedDuration + 1500);

      const originalOnEnd = utterance.onend;
      utterance.onend = (e) => {
        clearTimeout(watchdog);
        if (typeof originalOnEnd === 'function') originalOnEnd.call(utterance, e);
      };

      try {
        synth.speak(utterance);
      } catch (err) {
        clearTimeout(watchdog);
        cleanup();
      }
    }, 40);
  });
}

// Speak without cancelling active speech (for queuing)
export function queueSpeak(text: string, options: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    const synth = window.speechSynthesis;
    if (synth.paused) synth.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterances.add(utterance);

    const isThai = options.lang?.startsWith('th') || /[\u0E00-\u0E7F]/.test(text);

    if (isThai) {
      const thaiVoice = getThaiVoice();
      if (thaiVoice) utterance.voice = thaiVoice;
      utterance.lang = 'th-TH';
      utterance.rate = options.rate ?? 0.9;
    } else {
      const enVoice = getEnglishVoice(options.voiceURI);
      if (enVoice) utterance.voice = enVoice;
      utterance.lang = options.lang || 'en-US';
      utterance.rate = options.rate ?? 0.85;
      utterance.pitch = options.pitch ?? 1.05;
    }

    utterance.volume = options.volume ?? 1.0;

    let hasCleanedUp = false;
    const cleanup = () => {
      if (!hasCleanedUp) {
        hasCleanedUp = true;
        activeUtterances.delete(utterance);
        options.onEnd?.();
        resolve();
      }
    };

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = cleanup;
    utterance.onerror = cleanup;

    const estimatedDuration = Math.max(1000, (text.length / 8) * 1000);
    const watchdog = setTimeout(cleanup, estimatedDuration + 1500);

    const origEnd = utterance.onend;
    utterance.onend = (e) => {
      clearTimeout(watchdog);
      if (typeof origEnd === 'function') origEnd.call(utterance, e);
    };

    try {
      synth.speak(utterance);
    } catch {
      clearTimeout(watchdog);
      cleanup();
    }
  });
}

// ==========================================
// Calibrated Phonics Pronunciation
// ==========================================

export type PhonicsVoiceMode = 'sound' | 'anchor' | 'thai';

/**
 * Synthesize acoustic formant for vowels as ultra-reliable audio fallback
 */
export function playVowelFormant(vowel: string) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now); // Friendly child/youth pitch (A3)

    // Formant 1 and Formant 2 for short vowels
    // 'i' (/ɪ/ - อิ): F1 ~ 390Hz, F2 ~ 2100Hz
    // 'a' (/æ/ - แอ): F1 ~ 750Hz, F2 ~ 1700Hz
    // 'e' (/e/ - เอะ): F1 ~ 550Hz, F2 ~ 1850Hz
    // 'o' (/ɒ/ - ออ): F1 ~ 570Hz, F2 ~ 950Hz
    // 'u' (/ʌ/ - อะ): F1 ~ 640Hz, F2 ~ 1250Hz
    // Long vowels
    let f1Freq = 390;
    let f2Freq = 2100;
    const lower = vowel.toLowerCase();
    if (lower === 'i' || lower === '/ɪ/') {
      f1Freq = 390;
      f2Freq = 2100;
    } else if (lower === 'a' || lower === '/æ/') {
      f1Freq = 750;
      f2Freq = 1700;
    } else if (lower === 'e' || lower === '/e/' || lower === '/ɛ/') {
      f1Freq = 550;
      f2Freq = 1850;
    } else if (lower === 'o' || lower === '/ɒ/') {
      f1Freq = 570;
      f2Freq = 950;
    } else if (lower === 'u' || lower === '/ʌ/') {
      f1Freq = 640;
      f2Freq = 1250;
    } else if (lower === 'long-a' || lower === '/eɪ/') {
      f1Freq = 480;
      f2Freq = 2100;
    } else if (lower === 'long-e' || lower === '/iː/') {
      f1Freq = 300;
      f2Freq = 2400;
    } else if (lower === 'long-i' || lower === '/aɪ/') {
      f1Freq = 650;
      f2Freq = 1800;
    } else if (lower === 'long-o' || lower === '/oʊ/') {
      f1Freq = 480;
      f2Freq = 850;
    } else if (lower === 'long-u' || lower === '/juː/' || lower === '/uː/') {
      f1Freq = 320;
      f2Freq = 900;
    } else if (lower === 'dip-oi' || lower === 'oi' || lower === 'oy' || lower === '/ɔɪ/') {
      f1Freq = 500;
      f2Freq = 1600;
    } else if (lower === 'dip-ou' || lower === 'ou' || lower === 'ow' || lower === '/aʊ/') {
      f1Freq = 650;
      f2Freq = 1100;
    } else if (lower === 'dip-oo' || lower === 'oo' || lower === '/ʊ/') {
      f1Freq = 350;
      f2Freq = 950;
    } else if (lower === 'dip-aw' || lower === 'aw' || lower === 'au' || lower === '/ɔː/') {
      f1Freq = 580;
      f2Freq = 880;
    } else if (lower === 'dip-air' || lower === 'air' || lower === 'ear' || lower === '/eər/' || lower === '/ɪər/') {
      f1Freq = 490;
      f2Freq = 1950;
    }

    const filter1 = ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(f1Freq, now);
    filter1.Q.setValueAtTime(5.0, now);

    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(f2Freq, now);
    filter2.Q.setValueAtTime(6.0, now);

    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const master = ctx.createGain();

    gain1.gain.setValueAtTime(0.35, now);
    gain2.gain.setValueAtTime(0.25, now);

    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(0.25, now + 0.04);
    master.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(filter1);
    osc.connect(filter2);
    filter1.connect(gain1);
    filter2.connect(gain2);
    gain1.connect(master);
    gain2.connect(master);
    master.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  } catch {
    //
  }
}

/**
 * Exact Phonics Thai mapping table specified by user:
 * A a /æ/ แอ | B b /b/ บึ | C c /k/ คึ | D d /d/ ดึ | E e /e/ เอะ
 * F f /f/ ฟึ | G g /g/ กึ | H h /h/ ฮึ | I i /ɪ/ อิ | J j /dʒ/ จึ
 * K k /k/ คึ | L l /l/ ลึ | M m /m/ มึ | N n /n/ นึ | O o /ɒ/ ออ
 * P p /p/ พึ | Q q /kw/ ควึ | R r /r/ รึ | S s /s/ ซึ | T t /t/ ทึ
 * U u /ʌ/ อะ | V v /v/ วึ | W w /w/ วึ | X x /ks/ คสึ | Y y /j/ ยึ | Z z /z/ ซึ
 *
 * Plus Long Vowels (สระเสียงยาว):
 * Long A /eɪ/ เอ | Long E /iː/ อี | Long I /aɪ/ ไอ | Long O /oʊ/ โอ | Long U /juː/ ยู
 *
 * Plus Diphthongs (สระประสม):
 * OI / OY /ɔɪ/ ออย | OU / OW /aʊ/ เอา | OO /ʊ/, /uː/ อู | AW / AU /ɔː/ ออ | AIR / EAR /eər/, /ɪər/ แอร์
 */
export const PHONICS_SOUND_TABLE: Record<string, string> = {
  a: 'แอ',
  b: 'บึ',
  c: 'คึ',
  d: 'ดึ',
  e: 'เอะ',
  f: 'ฟึ',
  g: 'กึ',
  h: 'ฮึ',
  i: 'อิ',
  j: 'จึ',
  k: 'คึ',
  l: 'ลึ',
  m: 'มึ',
  n: 'นึ',
  o: 'ออ',
  p: 'พึ',
  q: 'ควึ',
  r: 'รึ',
  s: 'ซึ',
  t: 'ทึ',
  u: 'อะ',
  v: 'วึ',
  w: 'วึ',
  x: 'คสึ',
  y: 'ยึ',
  z: 'ซึ',
  // Long Vowels (สระเสียงยาว 5 เสียง)
  'long-a': 'เอ',
  'long-e': 'อี',
  'long-i': 'ไอ',
  'long-o': 'โอ',
  'long-u': 'ยู',
  // Diphthongs (สระประสม 5 เสียง)
  'dip-oi': 'ออย',
  'dip-ou': 'เอา',
  'dip-oo': 'อู',
  'dip-aw': 'ออ',
  'dip-air': 'แอร์',
  // Short and Long OO distinction
  oo_short: 'อุ',
  oo_long: 'อู',
  // Thai Direct Phoneme Sounds
  'แอ': 'แอ',
  'เอะ': 'เอะ',
  'อิ': 'อิ',
  'เอาะ': 'เอาะ',
  'อะ': 'อะ',
  'เอ': 'เอ',
  'อี': 'อี',
  'ไอ': 'ไอ',
  'โอ': 'โอ',
  'ยู': 'ยู',
  'ออย': 'ออย',
  'เอา': 'เอา',
  'อาว': 'อาว',
  'อุ': 'อุ',
  'อู': 'อู',
  'ออ': 'ออ',
  'แอร์': 'แอร์',
  'เอีย': 'เอีย',
  // IPA aliases
  '/æ/': 'แอ',
  '/b/': 'บึ',
  '/k/': 'คึ',
  '/d/': 'ดึ',
  '/e/': 'เอะ',
  '/ɛ/': 'เอะ',
  '/f/': 'ฟึ',
  '/g/': 'กึ',
  '/h/': 'ฮึ',
  '/ɪ/': 'อิ',
  '/dʒ/': 'จึ',
  '/l/': 'ลึ',
  '/m/': 'มึ',
  '/n/': 'นึ',
  '/ɒ/': 'ออ',
  '/p/': 'พึ',
  '/kw/': 'ควึ',
  '/r/': 'รึ',
  '/s/': 'ซึ',
  '/t/': 'ทึ',
  '/ʌ/': 'อะ',
  '/v/': 'วึ',
  '/w/': 'วึ',
  '/ks/': 'คสึ',
  '/j/': 'ยึ',
  '/z/': 'ซึ',
  // Long Vowels IPA
  '/eɪ/': 'เอ',
  '/iː/': 'อี',
  '/aɪ/': 'ไอ',
  '/oʊ/': 'โอ',
  '/juː/': 'ยู',
  '/uː/': 'อู',
  // Diphthongs IPA
  '/ɔɪ/': 'ออย',
  '/aʊ/': 'เอา',
  '/ɔː/': 'ออ',
  '/ʊ/': 'อุ',
  '/eər/': 'แอร์',
  '/ɪər/': 'เอีย',
  // Digraphs & vowel teams
  ai: 'เอ',
  ay: 'เอ',
  ee: 'อี',
  ea: 'อี',
  ie: 'ไอ',
  igh: 'ไอ',
  oa: 'โอ',
  ow: 'เอา',
  ue: 'ยู',
  ew: 'ยู',
  oo: 'อู',
  oi: 'ออย',
  oy: 'ออย',
  ou: 'เอา',
  aw: 'ออ',
  au: 'ออ',
  air: 'แอร์',
  ear: 'เอีย',
  eer: 'เอีย',
  are: 'แอร์',
  // Consonant Digraphs & Blends
  ck: 'คึ',
  sh: 'ชึ',
  ch: 'ชึ',
  th: 'ธึ',
  wh: 'วึ',
  ph: 'ฟึ',
  qu: 'ควึ',
  cl: 'คลึ',
  cr: 'ครึ',
  br: 'บรึ',
  dr: 'ดรึ',
  fl: 'ฟลึ',
  fr: 'ฟรึ',
  gl: 'กลึ',
  gr: 'กรึ',
  pl: 'พลึ',
  pr: 'พรึ',
  sk: 'สคึ',
  sl: 'สลึ',
  sm: 'สมึ',
  sn: 'สนึ',
  sp: 'สพึ',
  st: 'สตึ',
  sw: 'สวึ',
  tr: 'ทรึ',
};

/**
 * Play Phonics Sound for any letter or phonics symbol
 * Uses the exact Phonics Thai sounds defined in the syllabus
 */
export const playPhonicsSound = (letter: string, customRate: number = 0.8) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    playVowelFormant(letter);
    return;
  }

  window.speechSynthesis.cancel(); // หยุดเสียงค้างเดิม
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  const soundKey = letter.toLowerCase().trim();
  let soundText = PHONICS_SOUND_TABLE[soundKey] || LETTER_PHONICS_MAP[soundKey]?.soundTh || letter;
  const isThaiSound = /[\u0E00-\u0E7F]/.test(soundText);

  const utterance = new SpeechSynthesisUtterance(soundText);

  if (isThaiSound) {
    const thaiVoice = getThaiVoice();
    if (thaiVoice) {
      utterance.voice = thaiVoice;
    }
    utterance.lang = 'th-TH';
  } else {
    const voice = getEnglishVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = 'en-US';
  }

  utterance.rate = customRate || 0.8; // ปรับช้าลงเล็กน้อยเพื่อให้เด็กฟังชัดเจน
  utterance.pitch = 1.1; // ปรับระดับเสียงให้สดใสขึ้น

  activeUtterances.add(utterance);
  utterance.onend = () => activeUtterances.delete(utterance);
  utterance.onerror = () => {
    activeUtterances.delete(utterance);
    // Fallback if browser lacks voice
    if (['i', 'a', 'e', 'o', 'u'].includes(letter.toLowerCase())) {
      playVowelFormant(letter);
    }
  };

  // Safe timeout to prevent Chrome bug where immediate speak after cancel drops audio
  setTimeout(() => {
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      playVowelFormant(letter);
    }
  }, 25);
};

/**
 * Pronounce an individual letter with high phonics accuracy
 */
export async function speakLetterPhoneme(
  letter: string,
  rate: number = 0.85,
  mode: PhonicsVoiceMode = 'sound'
): Promise<void> {
  const lower = letter.toLowerCase().trim();
  const phonics = LETTER_PHONICS_MAP[lower];

  if (mode === 'anchor') {
    // Anchor word mode: e.g. "a as in apple" or "c as in cat"
    const anchor = phonics?.anchorWord ? `${lower}, as in ${phonics.anchorWord}` : lower;
    await speakText(anchor, { rate: rate * 0.95 });
    return;
  }

  // เสียงสระสั้น i ออกเสียงเป็น "อิ" ชัดเจน 100%
  if (lower === 'i' || lower === '/ɪ/') {
    playPhonicsSound('i', rate);
    await new Promise((r) => setTimeout(r, 380));
    return;
  }

  if (lower === 'a' || lower === '/æ/') {
    playPhonicsSound('a', rate);
    await new Promise((r) => setTimeout(r, 380));
    return;
  }

  if (lower === 'e' || lower === '/ɛ/') {
    playPhonicsSound('e', rate);
    await new Promise((r) => setTimeout(r, 380));
    return;
  }

  if (lower === 'o' || lower === '/ɒ/') {
    playPhonicsSound('o', rate);
    await new Promise((r) => setTimeout(r, 380));
    return;
  }

  if (lower === 'u' || lower === '/ʌ/') {
    playPhonicsSound('u', rate);
    await new Promise((r) => setTimeout(r, 380));
    return;
  }

  // Long Vowels (สระเสียงยาว 5 เสียง: เอ, อี, ไอ, โอ, ยู)
  if (lower === 'long-a' || lower === '/eɪ/') {
    playPhonicsSound('long-a', rate);
    await new Promise((r) => setTimeout(r, 400));
    return;
  }

  if (lower === 'long-e' || lower === '/iː/') {
    playPhonicsSound('long-e', rate);
    await new Promise((r) => setTimeout(r, 400));
    return;
  }

  if (lower === 'long-i' || lower === '/aɪ/') {
    playPhonicsSound('long-i', rate);
    await new Promise((r) => setTimeout(r, 400));
    return;
  }

  if (lower === 'long-o' || lower === '/oʊ/') {
    playPhonicsSound('long-o', rate);
    await new Promise((r) => setTimeout(r, 400));
    return;
  }

  if (lower === 'long-u' || lower === '/juː/' || lower === '/uː/') {
    playPhonicsSound('long-u', rate);
    await new Promise((r) => setTimeout(r, 400));
    return;
  }

  // Diphthongs (สระประสม 5 เสียง: ออย, เอา/อาว, อุ/อู, ออ, แอร์/เอีย)
  if (lower === 'dip-oi' || lower === 'oi' || lower === 'oy' || lower === '/ɔɪ/') {
    playPhonicsSound('dip-oi', rate);
    await new Promise((r) => setTimeout(r, 400));
    return;
  }

  if (lower === 'dip-ou' || lower === 'ou' || lower === 'ow' || lower === '/aʊ/') {
    playPhonicsSound('dip-ou', rate);
    await new Promise((r) => setTimeout(r, 400));
    return;
  }

  if (lower === 'dip-oo' || lower === 'oo' || lower === '/ʊ/') {
    playPhonicsSound('dip-oo', rate);
    await new Promise((r) => setTimeout(r, 400));
    return;
  }

  if (lower === 'dip-aw' || lower === 'aw' || lower === 'au' || lower === '/ɔː/') {
    playPhonicsSound('dip-aw', rate);
    await new Promise((r) => setTimeout(r, 400));
    return;
  }

  if (lower === 'dip-air' || lower === 'air' || lower === 'ear' || lower === 'eer' || lower === 'are' || lower === '/eər/' || lower === '/ɪər/') {
    playPhonicsSound('dip-air', rate);
    await new Promise((r) => setTimeout(r, 400));
    return;
  }

  if (mode === 'thai') {
    // Thai teacher guidance
    const thaiText = phonics ? `เสียง ${phonics.soundTh}` : lower;
    await speakText(thaiText, { lang: 'th-TH', rate });
    return;
  }

  playPhonicsSound(lower, rate);
  await new Promise((r) => setTimeout(r, 350));
}

export interface BlendingStep {
  indices: number[];
  soundKey: string;
  soundLabel: string;
  isMagicE?: boolean;
  isVowel?: boolean;
}

/**
 * Combines an onset consonant with a vowel/diphthong sound to form the blended "body" (Syllable Base):
 * e.g., Onset 'ค' + Vowel 'เอ' -> 'เค' (เค + คึ -> เค้ก / cake)
 * e.g., Onset 'ค' + Diphthong 'ออย' -> 'คอย' (คอย + นึ -> คอยน์ / coin)
 * e.g., Onset 'บ' + Diphthong 'อุ' -> 'บุ' (บุ + คึ -> บุค / book)
 */
export function combineOnsetAndVowel(onsetInitial: string, vowelSound: string): string {
  const c = onsetInitial || 'อ';
  const v = vowelSound || '';
  if (!v) return c;
  if (v.includes('เอาะ')) return `เ${c}าะ`;
  if (v.includes('เอา') || v.includes('อาว')) return `เ${c}า`;
  if (v.includes('เอีย')) return `เ${c}ีย`;
  if (v.includes('เอะ')) return `เ${c}ะ`;
  if (v.includes('แอร์')) return `แ${c}ร์`;
  if (v.includes('แอ')) return `แ${c}`;
  if (v.includes('ออย')) return `${c}อย`;
  if (v.includes('อู')) return `${c}ู`;
  if (v.includes('อุ')) return `${c}ุ`;
  if (v.includes('ออ')) return `${c}อ`;
  if (v.includes('เอ')) return `เ${c}`;
  if (v.includes('อี')) return `${c}ี`;
  if (v.includes('ไอ')) return `ไ${c}`;
  if (v.includes('โอ')) return `โ${c}`;
  if (v.includes('ยู')) return `${c}ิว`;
  if (v.includes('อิ')) return `${c}ิ`;
  if (v.includes('อะ')) return `${c}ะ`;
  return `${c}${v}`;
}

/**
 * Builds pedagogically accurate phonics blending steps:
 * - For Magic E words (cake, bike, bone, cute): blends Initial + Long Vowel (a_e) together + Final Consonant
 * - For Vowel Teams (rain, boat, tree, night): blends Initial + Vowel Team (ai, oa, ee, igh) + Final Consonant
 * - For Diphthongs (coin, cow, book, saw, chair): blends Initial + Diphthong (oi, ow, oo, aw, air) + Final Consonant
 * - For Short Vowels (cat, bed, pig, hot, sun): blends C + V + C
 */
export function buildPhonicsBlendingSteps(word: PhonicsWord): BlendingStep[] {
  const letters = word.letters;
  if (!letters || letters.length === 0) {
    return word.word.split('').map((char, idx) => ({
      indices: [idx],
      soundKey: char.toLowerCase(),
      soundLabel: PHONICS_SOUND_TABLE[char.toLowerCase()] || char,
      isVowel: ['a', 'e', 'i', 'o', 'u'].includes(char.toLowerCase()),
    }));
  }

  // Check if Magic E word (e.g. cake, bike, bone, cute)
  const isMagicE =
    word.pattern?.includes('_e') ||
    (letters.length >= 3 &&
      letters[letters.length - 1].letter.toLowerCase() === 'e' &&
      letters[letters.length - 1].soundTh.includes('ไม่ออกเสียง'));

  if (isMagicE) {
    const magicEIndex = letters.length - 1;
    // Find vowel index (a, i, o, u)
    const vowelIndex = letters.findIndex(
      (l, idx) =>
        idx < magicEIndex &&
        (l.soundTh === 'เอ' ||
          l.soundTh === 'ไอ' ||
          l.soundTh === 'โอ' ||
          l.soundTh === 'ยู' ||
          l.soundTh === 'อู' ||
          l.letter.toLowerCase() === word.baseLetter ||
          ['a', 'i', 'o', 'u'].includes(l.letter.toLowerCase()))
    );

    const steps: BlendingStep[] = [];
    for (let i = 0; i < letters.length; i++) {
      if (i === magicEIndex) {
        continue; // Handled together with vowel!
      }

      if (i === vowelIndex) {
        const vowelSoundLabel =
          letters[vowelIndex].soundTh ||
          (word.vowel === 'long-a'
            ? 'เอ'
            : word.vowel === 'long-i'
            ? 'ไอ'
            : word.vowel === 'long-o'
            ? 'โอ'
            : 'ยู');
        steps.push({
          indices: [vowelIndex, magicEIndex],
          soundKey: word.vowel,
          soundLabel: vowelSoundLabel,
          isMagicE: true,
          isVowel: true,
        });
      } else {
        const seg = letters[i];
        if (seg.soundTh && !seg.soundTh.includes('ไม่ออกเสียง')) {
          const spokenLabel = PHONICS_SOUND_TABLE[seg.letter.toLowerCase()] || seg.soundTh;
          steps.push({
            indices: [i],
            soundKey: seg.letter.toLowerCase(),
            soundLabel: spokenLabel,
            isVowel: false,
          });
        }
      }
    }
    return steps;
  }

  // Vowel Teams, Diphthongs, and Short Vowels:
  const steps: BlendingStep[] = [];
  for (let i = 0; i < letters.length; i++) {
    const seg = letters[i];
    if (seg.soundTh.includes('ไม่ออกเสียง') || seg.soundIpa === '') {
      continue;
    }

    const isVowelSegment =
      seg.letter.toLowerCase() === word.vowel ||
      seg.letter.toLowerCase() === word.baseLetter ||
      (word.pattern && seg.letter.toLowerCase() === word.pattern.toLowerCase()) ||
      ['เอ', 'อี', 'ไอ', 'โอ', 'ยู', 'อู', 'อุ', 'ออย', 'เอา', 'แอร์', 'เอีย', 'แอ', 'เอะ', 'อิ', 'เอาะ', 'อะ'].includes(seg.soundTh);

    let soundKey = seg.letter.toLowerCase();
    let soundLabel = seg.soundTh;

    if (isVowelSegment) {
      if (seg.soundTh === 'อุ') {
        soundKey = 'oo_short';
      } else if (seg.soundTh === 'อู') {
        soundKey = 'oo_long';
      } else if (word.vowelCategory && word.vowelCategory !== 'short') {
        soundKey = word.vowel;
      }
      soundLabel = seg.soundTh;
    } else {
      soundLabel = PHONICS_SOUND_TABLE[seg.letter.toLowerCase()] || seg.soundTh;
    }

    steps.push({
      indices: [i],
      soundKey,
      soundLabel,
      isVowel: isVowelSegment,
    });
  }

  return steps;
}

/**
 * Builds teacher script following authentic Phonics Blending Technique (เทคนิคการออกเสียงโฟนิกส์):
 * e.g. "เสียง คึ รวมกับสระ เอ เป็น เค ... เค รวมกับตัวสะกด คึ ผสมเป็นคำว่า เค้ก ... cake แปลว่า อบขนม"
 * e.g. "เสียง คึ รวมกับสระ ออย เป็น คอย ... คอย รวมกับตัวสะกด นึ ผสมเป็นคำว่า คอยน์ ... coin แปลว่า เหรียญเงิน"
 * e.g. "เสียง คึ รวมกับสระ เอา ผสมเป็นคำว่า คาว ... cow แปลว่า แม่วัว"
 */
export function buildPhonicsCoachScript(word: PhonicsWord): string {
  const steps = buildPhonicsBlendingSteps(word);
  if (!steps || steps.length === 0) {
    return `${word.word} อ่านว่า ${word.phoneticTh} แปลว่า ${word.meaningTh}`;
  }

  const vowelStepIdx = steps.findIndex((s) => s.isVowel || s.isMagicE);
  const onsetStep = steps[0];
  const vowelStep = vowelStepIdx !== -1 ? steps[vowelStepIdx] : (steps.length > 1 ? steps[1] : null);

  // If there are consonants after the vowel, take the final coda
  const codaStep = vowelStepIdx !== -1 && vowelStepIdx < steps.length - 1 ? steps[steps.length - 1] : null;

  if (vowelStep && codaStep && steps.length >= 3) {
    // 3-part Phonics Blending: Onset + Vowel -> Body ... Body + Coda -> Word!
    const onsetLabel = onsetStep.soundLabel;
    const vowelLabel = vowelStep.soundLabel;
    const codaLabel = codaStep.soundLabel;

    const rawInitial = (word.letters && word.letters[0]?.soundTh) || onsetLabel || 'อ';
    const onsetInitial = rawInitial.replace(/[ึะ]/g, '').trim() || 'อ';
    const bodySound = combineOnsetAndVowel(onsetInitial, vowelLabel);

    return `เสียง ${onsetLabel} รวมกับสระ ${vowelLabel} เป็น ${bodySound} ... ${bodySound} รวมกับตัวสะกด ${codaLabel} ผสมเป็นคำว่า ${word.phoneticTh} ... ${word.word} แปลว่า ${word.meaningTh}`;
  } else if (vowelStep && steps.length === 2) {
    // 2-part Phonics Blending: Onset + Vowel -> Word! (e.g. cow, day, saw, chair, sea)
    const onsetLabel = onsetStep.soundLabel;
    const vowelLabel = vowelStep.soundLabel;
    return `เสียง ${onsetLabel} รวมกับสระ ${vowelLabel} ผสมเป็นคำว่า ${word.phoneticTh} ... ${word.word} แปลว่า ${word.meaningTh}`;
  } else {
    const sequence = steps.map((s) => s.soundLabel).join(' ... ');
    return `${sequence} ... รวมเสียงเป็นคำว่า ${word.phoneticTh} ... ${word.word} แปลว่า ${word.meaningTh}`;
  }
}

/**
 * Enhanced Phonics Blending for a PhonicsWord:
 * Follows authentic Phonics Pronunciation Technique:
 * - Magic E: highlights vowel & final e together with long vowel sound (no letter-by-letter spelling!)
 * - Vowel teams & Diphthongs: sounds out digraphs as 1 unit
 */
export async function soundOutAndBlendWord(
  word: PhonicsWord,
  onStepChange?: (activeIndices: number[] | null) => void,
  speedRate: number = 0.85
): Promise<void> {
  stopSpeaking();
  await new Promise((r) => setTimeout(r, 60));

  const steps = buildPhonicsBlendingSteps(word);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    onStepChange?.(step.indices);
    playLetterClickSound();

    playPhonicsSound(step.soundKey, speedRate);

    // Pedagogical pause between phonemes so kids distinguish each sound
    await new Promise((r) => setTimeout(r, 480));
  }

  // Highlight all segments when blending into whole word!
  const allIndices = word.letters ? word.letters.map((_, idx) => idx) : [];
  onStepChange?.(allIndices);
  await new Promise((r) => setTimeout(r, 260));

  // Announce the blended word cleanly with English voice!
  playSparkleSound();
  await speakText(word.word, { rate: speedRate, pitch: 1.05 });
  await new Promise((r) => setTimeout(r, 380));

  onStepChange?.(null);
}

/**
 * Sequential sound-out and blending of a full word (backwards compatible)
 */
export async function soundOutAndBlend(
  word: string,
  onStepChange?: (stepIndex: number | null) => void,
  speedRate: number = 0.85,
  mode: PhonicsVoiceMode = 'sound'
): Promise<void> {
  stopSpeaking();
  await new Promise((r) => setTimeout(r, 60));

  const letters = word.toLowerCase().split('');

  for (let i = 0; i < letters.length; i++) {
    onStepChange?.(i);
    playLetterClickSound();

    const char = letters[i];
    playPhonicsSound(char, speedRate);

    await new Promise((r) => setTimeout(r, 450));
  }

  onStepChange?.(null);
  await new Promise((r) => setTimeout(r, 260));

  playSparkleSound();
  await speakText(word, { rate: speedRate, pitch: 1.05 });
}

/**
 * Thai Teacher Phonics Coaching:
 * Teaches proper phonics blending technique:
 * e.g. "เสียง คึ รวมกับสระ เอ เป็น เค ... เค รวมกับตัวสะกด คึ ผสมเป็นคำว่า เค้ก ... cake แปลว่า ขนมเค้ก"
 */
export async function speakThaiPhonicsCoachWord(
  word: PhonicsWord,
  speedRate: number = 0.9
): Promise<void> {
  stopSpeaking();
  await new Promise((r) => setTimeout(r, 50));

  const fullCoachScript = buildPhonicsCoachScript(word);
  await speakText(fullCoachScript, { lang: 'th-TH', rate: speedRate });
}

export async function speakThaiPhonicsCoach(
  word: string,
  lettersTh: string[],
  readingTh: string,
  meaningTh: string,
  speedRate: number = 0.9
): Promise<void> {
  stopSpeaking();
  await new Promise((r) => setTimeout(r, 50));

  const sequence = lettersTh.join(' ... ');
  const fullCoachScript = `${sequence} ... รวมเสียงเป็นคำว่า ${readingTh} ... ${word} แปลว่า ${meaningTh}`;

  await speakText(fullCoachScript, { lang: 'th-TH', rate: speedRate });
}
