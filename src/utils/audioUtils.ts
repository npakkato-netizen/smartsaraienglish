/**
 * @license
 * Robust Phonics Audio & Speech Synthesis Engine
 * Designed for reliable playback on Chrome, Safari, Edge, iOS, and Android.
 */

import { LETTER_PHONICS_MAP } from '../data/phonicsData';
import { PhonicsWord } from '../types/phonics';
import { AUTHENTIC_PHONICS_AUDIO } from '../data/authenticPhonicsAudio';

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
let cachedFemaleTeacherVoice: SpeechSynthesisVoice | null = null;
let lastTargetKey = '';

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const update = () => {
      availableVoices = window.speechSynthesis.getVoices();
      cachedFemaleTeacherVoice = null;
      lastTargetKey = '';
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

let currentPreferredVoiceURI: string = '';
let currentVoiceMode: PhonicsVoiceMode = 'sound';
let currentDialect: 'en-US' | 'en-GB' = 'en-US';

export function setAudioEngineConfig(config: {
  preferredVoiceURI?: string;
  voiceMode?: PhonicsVoiceMode;
  dialect?: 'en-US' | 'en-GB';
}) {
  if (config.preferredVoiceURI !== undefined) currentPreferredVoiceURI = config.preferredVoiceURI;
  if (config.voiceMode !== undefined) currentVoiceMode = config.voiceMode;
  if (config.dialect !== undefined) currentDialect = config.dialect;
  cachedFemaleTeacherVoice = null;
  lastTargetKey = '';
}

export function getAudioEngineConfig() {
  return {
    preferredVoiceURI: currentPreferredVoiceURI,
    voiceMode: currentVoiceMode,
    dialect: currentDialect,
  };
}

const FEMALE_VOICE_KEYWORDS = [
  'samantha',
  'jenny',
  'ava',
  'victoria',
  'karen',
  'allison',
  'susan',
  'zira',
  'aria',
  'ana',
  'sonia',
  'natasha',
  'catherine',
  'fiona',
  'moira',
  'tessa',
  'veena',
  'hazel',
  'linda',
  'serena',
  'stephanie',
  'zoe',
  'female',
];

const MALE_VOICE_KEYWORDS = [
  'guy',
  'daniel',
  'alex',
  'oliver',
  'george',
  'david',
  'mark',
  'james',
  'ryan',
  'tom',
  'brian',
  'fred',
  'junior',
  'ralph',
  'male',
];

export function isFemaleVoice(voice: SpeechSynthesisVoice): boolean {
  const nameLower = voice.name.toLowerCase();
  // Explicit female label
  if (nameLower.includes('female')) return true;
  // Explicit male label (excluding female)
  if (MALE_VOICE_KEYWORDS.some((m) => nameLower.includes(m)) && !nameLower.includes('female')) {
    return false;
  }
  // Known female names
  if (FEMALE_VOICE_KEYWORDS.some((f) => nameLower.includes(f))) return true;
  // Google US English is female by default on Chrome/Chromium
  if (nameLower.includes('google us english') || nameLower.includes('google uk english female')) {
    return true;
  }
  return false;
}
export function getEnglishVoice(
  preferredVoiceURI?: string,
  dialect?: 'en-US' | 'en-GB'
): SpeechSynthesisVoice | null {
  const voices = getAllVoices();
  if (!voices.length) return null;

  const targetURI = preferredVoiceURI || currentPreferredVoiceURI;
  const targetDialect = dialect || currentDialect || 'en-US';
  const cacheKey = `${targetURI || 'auto'}_${targetDialect}`;

  // Return cached female teacher voice instance to ensure 100% timbre & voice identity parity across all letters A-Z
  if (
    cachedFemaleTeacherVoice &&
    lastTargetKey === cacheKey &&
    voices.includes(cachedFemaleTeacherVoice)
  ) {
    return cachedFemaleTeacherVoice;
  }

  if (targetURI) {
    const found = voices.find((v) => v.voiceURI === targetURI);
    if (found) {
      cachedFemaleTeacherVoice = found;
      lastTargetKey = cacheKey;
      return found;
    }
  }

  // Priority 1: When American English (General American - en-US) is target or default
  if (targetDialect === 'en-US') {
    // 1A. High-quality / Neural / Natural American FEMALE voices
    const usFemaleHQ = voices.find((v) => {
      const lang = v.lang.toLowerCase().replace('_', '-');
      if (!lang.startsWith('en-us')) return false;
      if (!isFemaleVoice(v)) return false;
      const n = v.name;
      return (
        n.includes('Google US English') ||
        n.includes('Natural') ||
        n.includes('Samantha') ||
        n.includes('Jenny') ||
        n.includes('Aria') ||
        n.includes('Ava') ||
        n.includes('Allison') ||
        n.includes('Victoria') ||
        n.includes('Susan') ||
        n.includes('Zira')
      );
    });
    if (usFemaleHQ) {
      cachedFemaleTeacherVoice = usFemaleHQ;
      lastTargetKey = cacheKey;
      return usFemaleHQ;
    }

    // 1B. Any American FEMALE voice (en-US)
    const usFemaleAny = voices.find((v) => {
      const lang = v.lang.toLowerCase().replace('_', '-');
      return lang.startsWith('en-us') && isFemaleVoice(v);
    });
    if (usFemaleAny) {
      cachedFemaleTeacherVoice = usFemaleAny;
      lastTargetKey = cacheKey;
      return usFemaleAny;
    }

    // 1C. Any en-US voice (preserves American pronunciation)
    const usAny = voices.find((v) => {
      const lang = v.lang.toLowerCase().replace('_', '-');
      return lang.startsWith('en-us');
    });
    if (usAny) {
      cachedFemaleTeacherVoice = usAny;
      lastTargetKey = cacheKey;
      return usAny;
    }
  }

  // Priority 2: For other dialects (e.g. en-GB if explicitly requested)
  const dialectPrefix = targetDialect.toLowerCase().replace('_', '-');
  const dialectVoiceHQ = voices.find(
    (v) =>
      v.lang.toLowerCase().replace('_', '-').startsWith(dialectPrefix) &&
      isFemaleVoice(v) &&
      (v.name.includes('Natural') ||
        v.name.includes('Google') ||
        v.name.includes('Samantha') ||
        v.name.includes('Jenny') ||
        v.name.includes('Ava') ||
        v.name.includes('Victoria') ||
        v.name.includes('Karen') ||
        v.name.includes('Allison') ||
        v.name.includes('Zira'))
  );
  if (dialectVoiceHQ) {
    cachedFemaleTeacherVoice = dialectVoiceHQ;
    lastTargetKey = cacheKey;
    return dialectVoiceHQ;
  }

  const dialectVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().replace('_', '-').startsWith(dialectPrefix) &&
      isFemaleVoice(v)
  );
  if (dialectVoice) {
    cachedFemaleTeacherVoice = dialectVoice;
    lastTargetKey = cacheKey;
    return dialectVoice;
  }

  // Priority 3: Fallback - Any American English voice
  const fallbackUS = voices.find((v) =>
    v.lang.toLowerCase().replace('_', '-').startsWith('en-us')
  );
  if (fallbackUS) {
    cachedFemaleTeacherVoice = fallbackUS;
    lastTargetKey = cacheKey;
    return fallbackUS;
  }

  // Priority 4: Fallback - Any English female voice
  const femaleAny = voices.find(
    (v) => v.lang.toLowerCase().startsWith('en') && isFemaleVoice(v)
  );
  if (femaleAny) {
    cachedFemaleTeacherVoice = femaleAny;
    lastTargetKey = cacheKey;
    return femaleAny;
  }

  // Priority 5: Fallback - Any English voice
  const anyEnglish = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
  if (anyEnglish) {
    cachedFemaleTeacherVoice = anyEnglish;
    lastTargetKey = cacheKey;
    return anyEnglish;
  }

  // Return null so utterance uses utterance.lang = 'en-US' which triggers system English speech
  return null;
}

export function getThaiVoice(): SpeechSynthesisVoice | null {
  const voices = getAllVoices();
  return voices.find((v) => v.lang.toLowerCase().startsWith('th')) || null;
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

export type PhonicsVoiceMode = 'sound' | 'anchor' | 'thai' | 'letter';

// Cache for decoded AudioBuffers to guarantee 0ms instant playback without re-decoding
const decodedAudioBufferCache = new Map<string, AudioBuffer>();

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function cleanKeyInAudio(key: string): boolean {
  if (!key) return false;
  const k = key.toLowerCase().trim();
  return Boolean(AUTHENTIC_PHONICS_AUDIO[k]);
}

export async function getDecodedPhonicsBuffer(key: string): Promise<AudioBuffer | null> {
  const cleanKey = key.toLowerCase().trim();
  if (decodedAudioBufferCache.has(cleanKey)) {
    return decodedAudioBufferCache.get(cleanKey)!;
  }
  const dataUri = AUTHENTIC_PHONICS_AUDIO[cleanKey];
  if (!dataUri) return null;

  try {
    const ctx = getAudioContext();
    const base64Data = dataUri.split(',')[1];
    const arrayBuffer = base64ToArrayBuffer(base64Data);
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    decodedAudioBufferCache.set(cleanKey, audioBuffer);
    return audioBuffer;
  } catch (err) {
    console.warn('Failed to decode phonics audio buffer for', key, err);
    return null;
  }
}

/**
 * Plays an authentic, isolated native human phonics phoneme with crystalline clarity.
 * Used for /æ/ (Short A), /b/ (B), /ɡ/ (G), /h/ (H), /ɪ/ (Short I), /l/ (L), /ks/ (X), and /z/ (Z).
 */
export function playAuthenticPhonicsAudio(key: string, rate: number = 1.0): boolean {
  const cleanKey = key.toLowerCase().trim();
  const dataUri = AUTHENTIC_PHONICS_AUDIO[cleanKey];
  if (!dataUri) return false;

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (decodedAudioBufferCache.has(cleanKey)) {
      const buffer = decodedAudioBufferCache.get(cleanKey)!;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = rate;
      source.connect(ctx.destination);
      source.start();
      return true;
    }

    getDecodedPhonicsBuffer(cleanKey).then((buffer) => {
      if (buffer) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = rate;
        source.connect(ctx.destination);
        source.start();
      } else {
        const audio = new Audio(dataUri);
        audio.playbackRate = rate;
        audio.play().catch(() => {});
      }
    });
    return true;
  } catch {
    try {
      const audio = new Audio(dataUri);
      audio.playbackRate = rate;
      audio.play().catch(() => {});
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Asynchronously plays authentic phoneme audio, resolving when playback finishes.
 */
export function playAuthenticPhonicsAudioAsync(key: string, rate: number = 1.0): Promise<boolean> {
  return new Promise((resolve) => {
    const cleanKey = key.toLowerCase().trim();
    const dataUri = AUTHENTIC_PHONICS_AUDIO[cleanKey];
    if (!dataUri) {
      resolve(false);
      return;
    }

    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      getDecodedPhonicsBuffer(cleanKey).then((buffer) => {
        if (buffer) {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.playbackRate.value = rate;
          source.connect(ctx.destination);
          source.onended = () => resolve(true);
          source.start();
          setTimeout(() => resolve(true), Math.max(250, (buffer.duration / rate) * 1000 + 80));
        } else {
          const audio = new Audio(dataUri);
          audio.playbackRate = rate;
          audio.onended = () => resolve(true);
          audio.onerror = () => resolve(false);
          audio.play().catch(() => resolve(false));
          setTimeout(() => resolve(true), 600);
        }
      });
    } catch {
      resolve(false);
    }
  });
}

export const NATIVE_ENGLISH_PHONICS_TABLE: Record<string, string> = {
  // Consonants (Pure English onset/coda phonemes pronounced by American female teacher)
  b: 'buh', // [bʌ] - บึ/เบอะ
  c: 'kuh', // [kʌ] - คึ
  d: 'duh', // [dʌ] - ดึ
  f: 'fuh', // [fʌ] - ฟึ
  g: 'guh', // [ɡʌ] - เกอะ / กึ (adheres strictly to international Jolly/Oxford Phonics standards, NOT "กา")
  h: 'huh', // [hʌ] - เฮอะ / ฮึ (open-throat glottal breathing sound, NOT laughing "ฮา")
  j: 'juh', // [dʒʌ] - จึ
  k: 'kuh', // [kʌ] - คึ
  l: 'luh', // [lʌ] - เลอะ / ลึ (alveolar lateral liquid, NOT singing "ลา")
  m: 'muh', // [mʌ] - มึ
  n: 'nuh', // [nʌ] - นึ
  p: 'puh', // [pʌ] - พึ
  q: 'kwuh', // [kwʌ] - ควึ/เควอะ
  r: 'ruh', // [ɹʌ] - รึ
  s: 'suh', // [sʌ] - ซึ
  t: 'tuh', // [tʌ] - ทึ
  v: 'vuh', // [vʌ] - วึ
  w: 'wuh', // [wʌ] - วึ
  y: 'yuh', // [jʌ] - ยึ
  z: 'zee', // [ziː] - ซี (General American standard with rich vocal cord vibration)

  // Short Vowels (authentic native American English female teacher pronunciation)
  a: 'a', // Handled primarily via AUTHENTIC_PHONICS_AUDIO (/æ/ - แอะ/แอ)
  e: 'eh', // short /ɛ/ as in egg, bed, red
  i: 'ih', // Handled primarily via AUTHENTIC_PHONICS_AUDIO (/ɪ/ - อิ)
  o: 'ah', // short /ɑ/ as in ox, hot, box (General American short O)
  u: 'uh', // short /ʌ/ as in up, sun, cup

  // Consonant Digraphs & Blends
  ch: 'chuh',
  sh: 'shuh',
  th: 'thuh',
  wh: 'wuh',
  ph: 'fuh',
  ck: 'kuh',
  qu: 'kwuh',
  cl: 'cluh',
  cr: 'cruh',
  br: 'bruh',
  dr: 'druh',
  fl: 'fluh',
  fr: 'fruh',
  gl: 'gluh',
  gr: 'gruh',
  pl: 'pluh',
  pr: 'pruh',
  sk: 'skuh',
  sl: 'sluh',
  sm: 'smuh',
  sn: 'snuh',
  sp: 'spuh',
  st: 'stuh',
  sw: 'swuh',
  tr: 'truh',

  // Long Vowels
  'long-a': 'A',
  'a_e': 'A',
  ai: 'A',
  ay: 'A',
  'long-e': 'E',
  'long-i': 'I',
  'long-o': 'O',
  'long-u': 'U',
  ee: 'E',
  ea: 'E',
  ie: 'I',
  igh: 'I',
  oa: 'O',
  ow: 'ow',
  ue: 'U',
  ew: 'U',

  // Diphthongs
  'dip-oi': 'oy',
  'dip-ou': 'ow',
  'dip-oo': 'ooh',
  'dip-aw': 'aw',
  'dip-air': 'air',
  oi: 'oy',
  oy: 'oy',
  ou: 'ow',
  oo: 'ooh',
  oo_short: 'ooh',
  oo_long: 'ooh',
  aw: 'aw',
  au: 'aw',
  air: 'air',
  ear: 'ear',
  eer: 'ear',
  are: 'air',

  // IPA aliases
  '/æ/': 'a',
  '/b/': 'buh',
  '/k/': 'kuh',
  '/d/': 'duh',
  '/e/': 'eh',
  '/ɛ/': 'eh',
  '/f/': 'fuh',
  '/g/': 'guh',
  '/ɡ/': 'guh',
  '/h/': 'huh',
  '/ɪ/': 'ih',
  '/dʒ/': 'juh',
  '/l/': 'luh',
  '/m/': 'muh',
  '/n/': 'nuh',
  '/ɒ/': 'ah',
  '/ɑ/': 'ah',
  '/p/': 'puh',
  '/kw/': 'kwuh',
  '/r/': 'ruh',
  '/s/': 'suh',
  '/t/': 'tuh',
  '/ʌ/': 'uh',
  '/v/': 'vuh',
  '/w/': 'wuh',
  '/ks/': 'x',
  ks: 'x',
  x: 'x',
  '/j/': 'yuh',
  '/z/': 'zee',
  '/ʃ/': 'shuh',
  '/tʃ/': 'chuh',
  '/θ/': 'thuh',
  '/ð/': 'thuh',
  '/ŋ/': 'ng',
  '/ɹ/': 'ruh',
  '/eɪ/': 'A',
  '/iː/': 'E',
  '/aɪ/': 'I',
  '/oʊ/': 'O',
  '/juː/': 'U',
  '/uː/': 'ooh',
  '/ɔɪ/': 'oy',
  '/aʊ/': 'ow',
  '/ɔː/': 'aw',
  '/ʊ/': 'ooh',
  '/eər/': 'air',
  '/ɪər/': 'ear',
};

/**
 * Reverse mapping from Thai phonetic labels to standard English phonics keys.
 * Ensures that if legacy components pass Thai text (e.g. 'แอ', 'คึ', 'บึ'),
 * the pure phonics engine maps it back to English native speech immediately.
 */
export const THAI_TO_PHONEME_MAP: Record<string, string> = {
  'แอ': 'a',
  'แอะ': 'a',
  'แอะห์': 'a',
  'เอะ': 'e',
  'อิ': 'i',
  'ออ': 'o',
  'เอาะ': 'o',
  'เอาะ/ออ': 'o',
  'อะ': 'u',
  'เอ': 'long-a',
  'เอย์': 'long-a',
  'อี': 'long-e',
  'ไอ': 'long-i',
  'โอ': 'long-o',
  'ยู': 'long-u',
  'ยู/อู': 'long-u',
  'ออย': 'dip-oi',
  'เอา': 'dip-ou',
  'อาว': 'dip-ou',
  'เอา/อาว': 'dip-ou',
  'อุ': 'oo_short',
  'อู': 'oo_long',
  'แอร์': 'dip-air',
  'เอีย': 'ear',
  'บึ': 'b',
  'บ': 'b',
  'คึ': 'c',
  'ค': 'c',
  'ดึ': 'd',
  'ด': 'd',
  'ฟึ': 'f',
  'ฟ': 'f',
  'กึ': 'g',
  'ก': 'g',
  'ฮึ': 'h',
  'ฮ': 'h',
  'จึ': 'j',
  'จ': 'j',
  'ลึ': 'l',
  'ล': 'l',
  'มึ': 'm',
  'ม': 'm',
  'นึ': 'n',
  'น': 'n',
  'พึ': 'p',
  'พ': 'p',
  'ควึ': 'q',
  'คว': 'q',
  'รึ': 'r',
  'ร': 'r',
  'ซึ': 's',
  'ซ': 's',
  'ทึ': 't',
  'ท': 't',
  'ตึ': 't',
  'ต': 't',
  'ปึ': 'p',
  'ป': 'p',
  'วึ': 'w',
  'ว': 'w',
  'คสึ': 'x',
  'เอ็กซ์': 'x',
  'เอ๊กซ์': 'x',
  'ยึ': 'y',
  'ย': 'y',
  'ชึ': 'sh',
  'ช': 'sh',
  'ธึ': 'th',
  'ธ': 'th',
  'ซสึ': 'z',
  'ซึสั่น': 'z',
  'ซึ (สั่น)': 'z',
  'แซด': 'z',
  'ซี': 'z',
};

/**
 * Phonics Thai mapping table (used exclusively when user explicitly selects Thai Teacher Coaching Mode)
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
  z: 'ซึสั่น',
  'long-a': 'เอ',
  'long-e': 'อี',
  'long-i': 'ไอ',
  'long-o': 'โอ',
  'long-u': 'ยู',
  'dip-oi': 'ออย',
  'dip-ou': 'เอา',
  'dip-oo': 'อู',
  'dip-aw': 'ออ',
  'dip-air': 'แอร์',
  oo_short: 'อุ',
  oo_long: 'อู',
  'แอ': 'แอ',
  'เอะ': 'เอะ',
  'อิ': 'อิ',
  'เอาะ': 'เอาะ',
  'อะ': 'อะ',
  'เอ': 'เอ',
  'เอย์': 'เอ',
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
};

/**
 * Play Phonics Sound for any letter or phonics symbol.
 * Defaults to 100% authentic Native English Phonics pronunciation without Thai accent.
 */
export const playPhonicsSound = (
  letter: string,
  customRate: number = 0.88,
  preferredVoiceURI?: string,
  mode?: PhonicsVoiceMode
) => {
  const activeMode = mode || currentVoiceMode || 'sound';
  const voiceURI = preferredVoiceURI || currentPreferredVoiceURI;
  const rawKey = letter.toLowerCase().trim();
  const englishKey = THAI_TO_PHONEME_MAP[rawKey] || rawKey;

  // Mode 1: Thai Teacher Phonics Sound (เมื่อผู้ใช้เลือกโหมดครูไทยโดยเฉพาะ)
  if (activeMode === 'thai') {
    const soundText =
      PHONICS_SOUND_TABLE[rawKey] ||
      PHONICS_SOUND_TABLE[englishKey] ||
      LETTER_PHONICS_MAP[englishKey]?.soundTh ||
      letter;
    const utterance = new SpeechSynthesisUtterance(soundText);
    const thaiVoice = getThaiVoice();
    if (thaiVoice) utterance.voice = thaiVoice;
    utterance.lang = 'th-TH';
    utterance.rate = customRate || 0.85;
    utterance.pitch = 1.05;

    activeUtterances.add(utterance);
    utterance.onend = () => activeUtterances.delete(utterance);
    utterance.onerror = () => activeUtterances.delete(utterance);
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch {}
    }, 25);
    return;
  }

  // Mode 2: Anchor Word Mode (e.g. "A as in apple", "B as in bat")
  if (activeMode === 'anchor') {
    const detail = LETTER_PHONICS_MAP[englishKey];
    const textToSpeak = detail?.anchorWord
      ? `${englishKey.toUpperCase()}, as in ${detail.anchorWord}`
      : englishKey;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const enVoice = getEnglishVoice(voiceURI, currentDialect);
    if (enVoice) utterance.voice = enVoice;
    utterance.lang = currentDialect || 'en-US';
    utterance.rate = customRate || 0.85;
    utterance.pitch = 1.05;

    activeUtterances.add(utterance);
    utterance.onend = () => activeUtterances.delete(utterance);
    utterance.onerror = () => activeUtterances.delete(utterance);
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch {}
    }, 25);
    return;
  }

  // Mode 3: Alphabet Letter Name Mode (ชื่อตัวอักษร A-Z มาตรฐานสากล เช่น A, B, C, D... Z)
  if (activeMode === 'letter') {
    let letterText = englishKey.length === 1 ? englishKey.toUpperCase() : englishKey;
    if (englishKey === 'z') {
      letterText = currentDialect === 'en-GB' ? 'zed' : 'zee';
    } else if (englishKey === 'x') {
      letterText = 'X';
    }
    speakText(letterText, {
      rate: customRate || 0.85,
      pitch: 1.05,
      lang: currentDialect || 'en-US',
      voiceURI,
    });
    return;
  }

  // Mode 4: Pure Native English Phonics Sound (โหมดเสียงโฟนิกส์สากลมาตรฐาน)
  // For 'a' (/æ/), 'i' (/ɪ/), and 'x' (/ks/): play pure authentic phoneme audio without consonant tails or distortions!
  if (cleanKeyInAudio(englishKey) || cleanKeyInAudio(rawKey)) {
    const targetKey = cleanKeyInAudio(englishKey) ? englishKey : rawKey;
    playAuthenticPhonicsAudio(targetKey);
    return;
  }

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  const spokenPhoneme =
    NATIVE_ENGLISH_PHONICS_TABLE[englishKey] ||
    NATIVE_ENGLISH_PHONICS_TABLE[rawKey] ||
    englishKey;

  const utterance = new SpeechSynthesisUtterance(spokenPhoneme);
  const voice = getEnglishVoice(voiceURI, currentDialect || 'en-US');
  if (voice) {
    utterance.voice = voice;
  }
  utterance.lang = currentDialect || 'en-US';
  utterance.rate = customRate || 0.88;
  utterance.pitch = 1.05; // natural cheerful American female teacher pitch
  utterance.volume = 1.0; // 100% full volume

  activeUtterances.add(utterance);
  utterance.onend = () => activeUtterances.delete(utterance);
  utterance.onerror = () => activeUtterances.delete(utterance);

  setTimeout(() => {
    try {
      window.speechSynthesis.speak(utterance);
    } catch {}
  }, 25);
};

/**
 * Asynchronously plays a single phoneme sound, resolving ONLY when the audio
 * has finished sounding out completely. Prevents overlapping speech or cutoffs,
 * guaranteeing clear and full consonant articulation for beginner learners.
 */
export function playPhonicsSoundAsync(
  letter: string,
  customRate: number = 0.74,
  preferredVoiceURI?: string,
  mode?: PhonicsVoiceMode
): Promise<void> {
  return new Promise((resolve) => {
    const rawKey = letter.toLowerCase().trim();
    const activeMode = mode || currentVoiceMode || 'sound';
    const englishKey = THAI_TO_PHONEME_MAP[rawKey] || rawKey;

    if (activeMode === 'letter') {
      let letterText = englishKey.length === 1 ? englishKey.toUpperCase() : englishKey;
      if (englishKey === 'z') {
        letterText = currentDialect === 'en-GB' ? 'zed' : 'zee';
      } else if (englishKey === 'x') {
        letterText = 'X';
      }
      speakText(letterText, {
        rate: Math.min(customRate || 0.78, 0.85),
        pitch: 1.05,
        lang: currentDialect || 'en-US',
        voiceURI: preferredVoiceURI,
      }).then(resolve);
      return;
    }

    if (activeMode === 'sound' && (cleanKeyInAudio(englishKey) || cleanKeyInAudio(rawKey))) {
      const targetKey = cleanKeyInAudio(englishKey) ? englishKey : rawKey;
      playAuthenticPhonicsAudioAsync(targetKey).then(() => resolve());
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    let textToSpeak = '';
    let voiceToUse: SpeechSynthesisVoice | null = null;
    let lang: string = currentDialect || 'en-US';
    let rate = customRate || 0.85;
    let pitch = 1.05;

    if (activeMode === 'thai') {
      textToSpeak =
        PHONICS_SOUND_TABLE[rawKey] ||
        PHONICS_SOUND_TABLE[englishKey] ||
        LETTER_PHONICS_MAP[englishKey]?.soundTh ||
        letter;
      voiceToUse = getThaiVoice();
      lang = 'th-TH';
      rate = Math.min(customRate || 0.80, 0.85);
      pitch = 1.05;
    } else if (activeMode === 'anchor') {
      const detail = LETTER_PHONICS_MAP[englishKey];
      textToSpeak = detail?.anchorWord
        ? `${englishKey.toUpperCase()}, as in ${detail.anchorWord}`
        : englishKey;
      voiceToUse = getEnglishVoice(preferredVoiceURI || currentPreferredVoiceURI, currentDialect || 'en-US');
    } else {
      textToSpeak =
        NATIVE_ENGLISH_PHONICS_TABLE[englishKey] ||
        NATIVE_ENGLISH_PHONICS_TABLE[rawKey] ||
        englishKey;
      voiceToUse = getEnglishVoice(preferredVoiceURI || currentPreferredVoiceURI, currentDialect || 'en-US');
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (voiceToUse) utterance.voice = voiceToUse;
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1.0;

    let finished = false;
    const finish = () => {
      if (!finished) {
        finished = true;
        activeUtterances.delete(utterance);
        resolve();
      }
    };

    activeUtterances.add(utterance);
    utterance.onend = finish;
    utterance.onerror = finish;

    // Safety watchdog timeout
    setTimeout(finish, 1500);

    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        finish();
      }
    }, 20);
  });
}

export async function speakLetterPhoneme(
  letter: string,
  rate: number = 0.74,
  mode: PhonicsVoiceMode = 'sound',
  preferredVoiceURI?: string
): Promise<void> {
  const lower = letter.toLowerCase().trim();
  await playPhonicsSoundAsync(lower, Math.min(rate, 0.78), preferredVoiceURI, mode);
  await new Promise((r) => setTimeout(r, 480));
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
  if (v.includes('แอะ')) return `แ${c}ะ`;
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
      ['เอ', 'อี', 'ไอ', 'โอ', 'ยู', 'อู', 'อุ', 'ออย', 'เอา', 'แอร์', 'เอีย', 'แอะ', 'แอ', 'เอะ', 'อิ', 'เอาะ', 'อะ'].includes(seg.soundTh);

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
 * Calibrated specifically for early/beginner students (นักเรียนเริ่มเรียน):
 * - Consonants and vowels are sounded out with patient, deliberate enunciation (~0.74x)
 * - Waiting for each phoneme to fully finish playing (no sound overlaps or cutoffs)
 * - Generous pedagogical pause (~650ms) between letters so young learners clearly absorb each sound
 * - Breathing thinking pause (680ms) before smoothly blending into the complete word
 */
export async function soundOutAndBlendWord(
  word: PhonicsWord,
  onStepChange?: (activeIndices: number[] | null) => void,
  speedRate: number = 0.74,
  mode?: PhonicsVoiceMode,
  preferredVoiceURI?: string
): Promise<void> {
  stopSpeaking();
  await new Promise((r) => setTimeout(r, 80));

  const steps = buildPhonicsBlendingSteps(word);

  // Ample pedagogical pause calibrated for early/beginner learners
  // At speedRate 0.74, pause is ~620ms after the sound completes
  const pauseAfterSound = Math.max(450, Math.round(920 - speedRate * 420));

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    onStepChange?.(step.indices);
    playLetterClickSound();

    // Await full phoneme articulation so consonants (b, c, d, p, t, etc.) are 100% audible and never cut off
    await playPhonicsSoundAsync(step.soundKey, Math.min(speedRate, 0.76), preferredVoiceURI, mode);

    // Pedagogical pause between phonemes so kids distinguish each consonant clearly
    await new Promise((r) => setTimeout(r, pauseAfterSound));
  }

  // Highlight all segments when blending into whole word!
  const allIndices = word.letters ? word.letters.map((_, idx) => idx) : [];
  onStepChange?.(allIndices);

  // Anticipatory thinking pause before pronouncing the blended word
  await new Promise((r) => setTimeout(r, 680));

  // Announce the blended word cleanly with deliberate native English voice!
  playSparkleSound();
  await speakText(word.word, {
    rate: Math.min(speedRate, 0.80),
    pitch: 1.05,
    voiceURI: preferredVoiceURI || currentPreferredVoiceURI,
    lang: currentDialect || 'en-US',
  });
  await new Promise((r) => setTimeout(r, 480));

  onStepChange?.(null);
}

/**
 * Sequential sound-out and blending of a full word (backwards compatible)
 * Calibrated with patient pacing for early learners.
 */
export async function soundOutAndBlend(
  word: string,
  onStepChange?: (stepIndex: number | null) => void,
  speedRate: number = 0.74,
  mode: PhonicsVoiceMode = 'sound',
  preferredVoiceURI?: string
): Promise<void> {
  stopSpeaking();
  await new Promise((r) => setTimeout(r, 80));

  const letters = word.toLowerCase().split('');
  const pauseAfterSound = Math.max(450, Math.round(920 - speedRate * 420));

  for (let i = 0; i < letters.length; i++) {
    onStepChange?.(i);
    playLetterClickSound();

    const char = letters[i];
    await playPhonicsSoundAsync(char, Math.min(speedRate, 0.76), preferredVoiceURI, mode);

    await new Promise((r) => setTimeout(r, pauseAfterSound));
  }

  onStepChange?.(null);
  await new Promise((r) => setTimeout(r, 680));

  playSparkleSound();
  await speakText(word, {
    rate: Math.min(speedRate, 0.80),
    pitch: 1.05,
    voiceURI: preferredVoiceURI || currentPreferredVoiceURI,
    lang: currentDialect || 'en-US',
  });
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
