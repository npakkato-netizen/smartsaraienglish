import React from 'react';
import { PhonicsWord } from '../types/phonics';
import { VOWEL_INFO_MAP } from '../data/phonicsData';
import { GRADE_BADGES, SecondaryGrade, VocabTopic } from '../data/secondaryVocabData';
import { PenTool, Sparkles, GraduationCap } from 'lucide-react';

export type HandwritingFontType = 'fredoka' | 'school' | 'nunito';

interface TracingWorksheetProps {
  pages: PhonicsWord[][];
  currentPageIndex: number;
  viewMode: 'single' | 'all';
  showStudentHeader?: boolean;
  showMeaning?: boolean;
  showPhonetic?: boolean;
  paperSize?: 'a4' | 'a5';
  colorMode?: 'bw' | 'color';
  fontType?: HandwritingFontType;
  showStartDot?: boolean;
}

/**
 * Checks if the first letter of a word has an ascender or is uppercase
 */
const hasTallFirstLetter = (word: string): boolean => {
  if (!word || word.length === 0) return false;
  const first = word[0];
  return /[A-Zbdhklft]/.test(first);
};

/**
 * Returns matching font-family for tracing.
 * Default is 'Fredoka' to match the vocabulary words displayed throughout the app!
 */
export const getTracingFontFamily = (fontType: HandwritingFontType = 'fredoka'): string => {
  switch (fontType) {
    case 'fredoka':
      return "'Fredoka', sans-serif";
    case 'school':
      return "'Edu AU VIC WA NT Hand Dots', 'Raleway Dots', cursive, sans-serif";
    case 'nunito':
      return "'Nunito', sans-serif";
    default:
      return "'Fredoka', sans-serif";
  }
};

/**
 * Returns matching font-family for the solid model word.
 * Matches the vocabulary word font ('Fredoka') 1:1!
 */
export const getModelFontFamily = (fontType: HandwritingFontType = 'fredoka'): string => {
  switch (fontType) {
    case 'fredoka':
      return "'Fredoka', sans-serif";
    case 'school':
      return "'Edu AU VIC WA NT Hand', 'Edu VIC WA NT Beginner', cursive, sans-serif";
    case 'nunito':
      return "'Nunito', sans-serif";
    default:
      return "'Fredoka', sans-serif";
  }
};

/**
 * Standard 4-Line Primary Handwriting SVG Component
 * - Single-line dotted tracing (เส้นประแบบเส้นเดี่ยว ไม่กลวง)
 * - Uses the EXACT same font as the vocabulary words displayed (Fredoka)
 * - Black & White ruling lines (บรรทัดขาวดำ สำหรับพิมพ์และถ่ายเอกสารคมชัด)
 * - Headline (y=16): เส้นบน
 * - Midline (y=34): เส้นประกลาง
 * - Baseline (y=52): เส้นฐานล่างทึบ
 * - Descender (y=66): เส้นใต้ฐาน
 */
export const PenmanshipTracingLine: React.FC<{
  word: string;
  repeatCount?: number;
  showModelWord?: boolean;
  showStartDot?: boolean;
  colorMode?: 'bw' | 'color';
  fontType?: HandwritingFontType;
  customWidth?: number;
}> = ({
  word,
  repeatCount = 4,
  showModelWord = true,
  showStartDot = true,
  colorMode = 'bw',
  fontType = 'fredoka',
  customWidth = 880,
}) => {
  const isBw = colorMode === 'bw';
  const tracingFont = getTracingFontFamily(fontType);
  const modelFont = getModelFontFamily(fontType);

  const wordLen = word.length;

  // Intelligently cap repetitions based on word length so long words (M.1 - M.6) never collide
  const maxAllowedSlots =
    wordLen >= 12 ? 2 :
    wordLen >= 9 ? 3 :
    wordLen >= 6 ? 4 : 5;

  const effectiveRepeat = Math.max(1, Math.min(repeatCount, maxAllowedSlots - (showModelWord ? 1 : 0)));
  const totalSlots = effectiveRepeat + (showModelWord ? 1 : 0);
  const slotWidth = (customWidth - 36) / Math.max(1, totalSlots);

  // Dynamic font size and spacing calibrated for primary and secondary vocabularies
  const fontSize =
    wordLen >= 13 ? 24 :
    wordLen >= 10 ? 28 :
    wordLen >= 8 ? 32 :
    wordLen >= 6 ? 37 :
    wordLen >= 5 ? 41 : 45;

  const letterSpacing =
    wordLen >= 11 ? 0.6 :
    wordLen >= 8 ? 1.0 :
    wordLen >= 6 ? 1.5 : 2.2;

  const isTall = hasTallFirstLetter(word);

  return (
    <div className="w-full overflow-hidden bg-white rounded-lg border border-slate-300 shadow-2xs py-0.5">
      <svg
        viewBox={`0 0 ${customWidth} 76`}
        className="w-full h-auto select-none block"
        preserveAspectRatio="xMinYMid meet"
      >
        {/* Shaded Track (only in color mode) */}
        {!isBw && (
          <rect
            x="0"
            y="34"
            width={customWidth}
            height="18"
            fill="#fef3c7"
            fillOpacity="0.45"
          />
        )}

        {/* Guideline 1: Headline (Top Line) เส้นบน */}
        <line
          x1="0"
          y1="16"
          x2={customWidth}
          y2="16"
          stroke={isBw ? '#000000' : '#94a3b8'}
          strokeWidth={isBw ? '0.85' : '1.1'}
        />

        {/* Guideline 2: Midline (Dashed) เส้นประกลาง */}
        <line
          x1="0"
          y1="34"
          x2={customWidth}
          y2="34"
          stroke={isBw ? '#000000' : '#f59e0b'}
          strokeWidth={isBw ? '1.1' : '1.3'}
          strokeDasharray="4,4"
        />

        {/* Guideline 3: Baseline (Solid Line) เส้นฐานล่างหลักที่ตัวหนังสือวางอยู่ */}
        <line
          x1="0"
          y1="52"
          x2={customWidth}
          y2="52"
          stroke={isBw ? '#000000' : '#dc2626'}
          strokeWidth={isBw ? '1.6' : '1.6'}
        />

        {/* Guideline 4: Descender Line (Bottom Dashed) เส้นใต้ฐาน */}
        <line
          x1="0"
          y1="66"
          x2={customWidth}
          y2="66"
          stroke={isBw ? '#475569' : '#cbd5e1'}
          strokeWidth="0.8"
          strokeDasharray="3,3"
        />

        {/* Left Margin Visual Line Indicators (ขาวดำ คมชัด) */}
        <g opacity={isBw ? '0.8' : '0.6'}>
          <circle cx="8" cy="16" r="1.5" fill={isBw ? '#000000' : '#94a3b8'} />
          <circle cx="8" cy="34" r="1.5" fill={isBw ? '#475569' : '#f59e0b'} />
          <circle cx="8" cy="52" r="1.8" fill={isBw ? '#000000' : '#dc2626'} />
          <circle cx="8" cy="66" r="1.5" fill={isBw ? '#94a3b8' : '#cbd5e1'} />
        </g>

        {/* 1. Solid Model Word (ตัวอย่างคำต้นแบบ: ฟอนต์ Fredoka เหมือนคำศัพท์ที่แสดง 100%) */}
        {showModelWord && (
          <g>
            {/* Model Badge */}
            <rect
              x="22"
              y="3"
              width="46"
              height="11"
              rx="2"
              fill={isBw ? '#f1f5f9' : '#dbeafe'}
              stroke={isBw ? '#94a3b8' : 'none'}
              strokeWidth="0.5"
            />
            <text
              x="45"
              y="11"
              textAnchor="middle"
              fontFamily="'Mitr', 'Prompt', system-ui, sans-serif"
              fontSize="7.5"
              fontWeight="700"
              fill={isBw ? '#0f172a' : '#1d4ed8'}
            >
              ต้นแบบ
            </text>

            {/* Model Text: Uses exact same font as vocabulary display ('Fredoka') */}
            <text
              x="24"
              y="52"
              dominantBaseline="alphabetic"
              fontFamily={modelFont}
              fontSize={fontSize}
              fontWeight="600"
              letterSpacing={letterSpacing}
              fill="#000000"
            >
              {word}
            </text>
          </g>
        )}

        {/* 2. Dotted Tracing Words (คำเส้นประเดี่ยว: ฟอนต์ Fredoka ชนิดเดียวกับคำศัพท์) */}
        {Array.from({ length: effectiveRepeat }).map((_, idx) => {
          const startX = (showModelWord ? slotWidth : 0) + idx * slotWidth + 24;
          const startDotY = isTall ? 19 : 34;

          return (
            <g key={idx}>
              {/* Step indicator tag */}
              <text
                x={startX}
                y="11"
                fontFamily="'Mitr', 'Prompt', system-ui, sans-serif"
                fontSize="7.5"
                fontWeight="600"
                fill={isBw ? '#64748b' : '#94a3b8'}
              >
                คัดตาม {idx + 1}
              </text>

              {/* Start dot (จุดเริ่มจรดดินสอ) */}
              {showStartDot && (
                <circle
                  cx={startX - 2}
                  cy={startDotY}
                  r="2"
                  fill={isBw ? '#000000' : '#e11d48'}
                >
                  <title>จุดเริ่มต้นจรดดินสอ</title>
                </circle>
              )}

              {/* Dotted Word Rendering:
                  For Fredoka: Uses slender weight 300 with faint fill + thin dashed stroke to form a crisp single-line dotted trace! */}
              {fontType === 'school' ? (
                <text
                  x={startX}
                  y="52"
                  dominantBaseline="alphabetic"
                  fontFamily={tracingFont}
                  fontSize={fontSize}
                  fontWeight="400"
                  letterSpacing={letterSpacing}
                  fill="#000000"
                >
                  {word}
                </text>
              ) : (
                <g>
                  {/* Layer A: Faint Solid Ghost Fill (รูปทรงตัวอักษรสีเทาอ่อน ชัดเจน ไม่หลงทิศ) */}
                  <text
                    x={startX}
                    y="52"
                    dominantBaseline="alphabetic"
                    fontFamily={tracingFont}
                    fontSize={fontSize}
                    fontWeight="300"
                    letterSpacing={letterSpacing}
                    fill="#94a3b8"
                    fillOpacity="0.32"
                  >
                    {word}
                  </text>
                  {/* Layer B: Single-Line Dotted Stroke (เส้นประเดี่ยว คมชัด) */}
                  <text
                    x={startX}
                    y="52"
                    dominantBaseline="alphabetic"
                    fontFamily={tracingFont}
                    fontSize={fontSize}
                    fontWeight="300"
                    letterSpacing={letterSpacing}
                    fill="none"
                    stroke="#000000"
                    strokeWidth="1.15"
                    strokeDasharray="2.2,2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {word}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/**
 * Letter-by-letter Phonics Tracing Row with individual sound breakdowns
 * Pure Black & White 4-line rulings and Fredoka single-line dotted letter font
 */
export const LetterByLetterTracingRow: React.FC<{
  word: PhonicsWord;
  colorMode?: 'bw' | 'color';
  fontType?: HandwritingFontType;
}> = ({ word, colorMode = 'bw', fontType = 'fredoka' }) => {
  const isBw = colorMode === 'bw';
  const tracingFont = getTracingFontFamily(fontType);

  const letters = word.letters && word.letters.length > 0
    ? word.letters
    : word.word.split('').map((char) => ({
        letter: char,
        soundIpa: '',
        soundTh: char,
      }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="text-[11px] font-bold text-slate-700 font-thai shrink-0 flex items-center gap-1">
        <PenTool className="w-3.5 h-3.5 text-slate-800" />
        <span>แยกคัดทีละเสียง (Phonics):</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {letters.map((seg, idx) => {
          const isTall = /[A-Zbdhklft]/.test(seg.letter);
          return (
            <div
              key={idx}
              className="flex items-center bg-white border border-slate-400 rounded-lg p-1 shadow-2xs hover:border-black transition"
            >
              {/* Individual 4-Line Handwriting Cell (Black & White) */}
              <div className="w-13 h-15 bg-white border border-slate-300 rounded overflow-hidden flex flex-col justify-center relative">
                <svg viewBox="0 0 52 64" className="w-full h-full select-none block">
                  {/* Shaded Track in color mode only */}
                  {!isBw && (
                    <rect x="0" y="27" width="52" height="17" fill="#fef3c7" fillOpacity="0.45" />
                  )}

                  {/* Topline */}
                  <line
                    x1="0"
                    y1="12"
                    x2="52"
                    y2="12"
                    stroke={isBw ? '#000000' : '#94a3b8'}
                    strokeWidth={isBw ? '0.8' : '0.9'}
                  />

                  {/* Midline (Dashed) */}
                  <line
                    x1="0"
                    y1="27"
                    x2="52"
                    y2="27"
                    stroke={isBw ? '#000000' : '#f59e0b'}
                    strokeWidth={isBw ? '1' : '1.1'}
                    strokeDasharray="3,3"
                  />

                  {/* Baseline (Solid) */}
                  <line
                    x1="0"
                    y1="44"
                    x2="52"
                    y2="44"
                    stroke={isBw ? '#000000' : '#dc2626'}
                    strokeWidth="1.5"
                  />

                  {/* Descender line */}
                  <line
                    x1="0"
                    y1="56"
                    x2="52"
                    y2="56"
                    stroke={isBw ? '#475569' : '#cbd5e1'}
                    strokeWidth="0.8"
                    strokeDasharray="2.5,2.5"
                  />

                  {/* Start dot */}
                  <circle
                    cx="12"
                    cy={isTall ? 14 : 27}
                    r="1.7"
                    fill={isBw ? '#000000' : '#e11d48'}
                  />

                  {/* Single-Line Dotted Letter (Same font as word) */}
                  {fontType === 'school' ? (
                    <text
                      x="26"
                      y="44"
                      textAnchor="middle"
                      dominantBaseline="alphabetic"
                      fontFamily={tracingFont}
                      fontSize="36"
                      fontWeight="400"
                      fill="#000000"
                    >
                      {seg.letter}
                    </text>
                  ) : (
                    <g>
                      <text
                        x="26"
                        y="44"
                        textAnchor="middle"
                        dominantBaseline="alphabetic"
                        fontFamily={tracingFont}
                        fontSize="36"
                        fontWeight="300"
                        fill="#94a3b8"
                        fillOpacity="0.32"
                      >
                        {seg.letter}
                      </text>
                      <text
                        x="26"
                        y="44"
                        textAnchor="middle"
                        dominantBaseline="alphabetic"
                        fontFamily={tracingFont}
                        fontSize="36"
                        fontWeight="300"
                        fill="none"
                        stroke="#000000"
                        strokeWidth="1.15"
                        strokeDasharray="2.2,2.5"
                        strokeLinecap="round"
                      >
                        {seg.letter}
                      </text>
                    </g>
                  )}
                </svg>
              </div>

              {/* Sound phonetic guide */}
              <div className="ml-1.5 pr-1 text-left">
                <div className="font-bubble font-black text-xs text-slate-900 leading-tight">
                  {seg.letter}
                </div>
                <div className="text-[10px] font-thai text-slate-800 font-bold leading-tight">
                  {seg.soundTh}
                </div>
                {seg.soundIpa && (
                  <div className="font-mono text-[9px] text-slate-500 leading-none">
                    /{seg.soundIpa}/
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Blank Penmanship Practice Line for student independent writing
 * Perfectly matches the 4-line spacing and styling of PenmanshipTracingLine in Black & White
 */
export const BlankHandwritingPracticeLine: React.FC<{
  label?: string;
  customWidth?: number;
  colorMode?: 'bw' | 'color';
  repeatCount?: number;
}> = ({
  label = '',
  customWidth = 880,
  colorMode = 'bw',
  repeatCount = 5,
}) => {
  const isBw = colorMode === 'bw';
  const slotWidth = (customWidth - 36) / Math.max(1, repeatCount);
  const guideDots = Array.from({ length: repeatCount }, (_, i) => 24 + i * slotWidth);

  return (
    <div className="w-full bg-white rounded-lg border border-slate-300 shadow-2xs py-0.5">
      {label && (
        <div className="px-3 pt-0.5 flex items-center justify-between text-[10px] font-bold text-slate-600 font-thai">
          <span>{label}</span>
          <span className="font-normal text-slate-500">
            วางตัวอักษรบนเส้นฐานทึบ (Baseline)
          </span>
        </div>
      )}
      <svg
        viewBox={`0 0 ${customWidth} 76`}
        className="w-full h-auto select-none block"
        preserveAspectRatio="xMinYMid meet"
      >
        {/* Shaded Middle Track (color mode only) */}
        {!isBw && (
          <rect
            x="0"
            y="34"
            width={customWidth}
            height="18"
            fill="#fef3c7"
            fillOpacity="0.45"
          />
        )}

        {/* Guideline 1: Headline */}
        <line
          x1="0"
          y1="16"
          x2={customWidth}
          y2="16"
          stroke={isBw ? '#000000' : '#94a3b8'}
          strokeWidth={isBw ? '0.85' : '1.1'}
        />

        {/* Guideline 2: Midline (Dashed) */}
        <line
          x1="0"
          y1="34"
          x2={customWidth}
          y2="34"
          stroke={isBw ? '#000000' : '#f59e0b'}
          strokeWidth={isBw ? '1.1' : '1.3'}
          strokeDasharray="4,4"
        />

        {/* Guideline 3: Baseline (Solid) */}
        <line
          x1="0"
          y1="52"
          x2={customWidth}
          y2="52"
          stroke={isBw ? '#000000' : '#dc2626'}
          strokeWidth="1.6"
        />

        {/* Guideline 4: Descender Line (Dashed) */}
        <line
          x1="0"
          y1="66"
          x2={customWidth}
          y2="66"
          stroke={isBw ? '#475569' : '#cbd5e1'}
          strokeWidth="0.8"
          strokeDasharray="3,3"
        />

        {/* Left Margin Indicator */}
        <g opacity={isBw ? '0.8' : '0.6'}>
          <circle cx="8" cy="16" r="1.5" fill={isBw ? '#000000' : '#94a3b8'} />
          <circle cx="8" cy="34" r="1.5" fill={isBw ? '#475569' : '#f59e0b'} />
          <circle cx="8" cy="52" r="1.8" fill={isBw ? '#000000' : '#dc2626'} />
          <circle cx="8" cy="66" r="1.5" fill={isBw ? '#94a3b8' : '#cbd5e1'} />
        </g>

        {/* Starter guide dots spaced across the line for repetition guide */}
        {guideDots.map((x, i) => (
          <g key={i} opacity={isBw ? '0.7' : '0.6'}>
            <circle cx={x} cy="34" r="2" fill={isBw ? '#000000' : '#f59e0b'} />
            <text
              x={x + 5}
              y="11"
              fontFamily="'Mitr', system-ui, sans-serif"
              fontSize="7"
              fill={isBw ? '#475569' : '#94a3b8'}
            >
              ครั้งที่ {i + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

/**
 * Tracing Exercise Card for a Single Phonics Word
 * Formatted with model word card on the left and full-width handwriting lines stretching edge-to-edge
 */
export const TracingExerciseCard: React.FC<{
  word: PhonicsWord;
  showMeaning?: boolean;
  showPhonetic?: boolean;
  colorMode?: 'bw' | 'color';
  fontType?: HandwritingFontType;
  showStartDot?: boolean;
  paperSize?: 'a4' | 'a5';
}> = ({
  word,
  showMeaning = true,
  showPhonetic = true,
  colorMode = 'bw',
  fontType = 'fredoka',
  showStartDot = true,
  paperSize = 'a4',
}) => {
  const vowelInfo = VOWEL_INFO_MAP[word.vowel];
  const isBw = colorMode === 'bw';
  const isA5 = paperSize === 'a5';
  const wordLen = word.word.length;

  // Secondary vocabulary metadata detection
  const isSec = !!(word as any).isSecondary || !!(word as any).secondaryGrade;
  const secGrade = (word as any).secondaryGrade as SecondaryGrade | undefined;
  const secPos = (word as any).secondaryPos || word.pattern;
  const secTopic = (word as any).secondaryTopic as VocabTopic | undefined;
  const secSynonyms = (word as any).secondarySynonyms as string[] | undefined;
  const secBadge = secGrade ? GRADE_BADGES[secGrade] : undefined;

  const letters = word.letters && word.letters.length > 0
    ? word.letters
    : word.word.split('').map((char) => ({
        letter: char,
        soundIpa: '',
        soundTh: char,
      }));

  // Expand repetitions to fill the full wide line edge-to-edge
  const repeatCount = isA5
    ? (wordLen >= 9 ? 1 : wordLen >= 6 ? 2 : 3)
    : (wordLen >= 12 ? 1 : wordLen >= 9 ? 2 : wordLen >= 6 ? 3 : wordLen >= 4 ? 4 : 5);
  const totalSlots = repeatCount + 1; // 1 model word + repeatCount tracing repetitions

  return (
    <div className="border border-slate-300 rounded-xl p-2 sm:p-2.5 bg-white avoid-break shadow-2xs hover:border-black transition w-full">
      <div className="flex flex-row items-stretch gap-2 sm:gap-2.5">
        {/* Left Column: คำศัพท์ต้นแบบด้านซ้าย (Model Vocabulary Card on the Left) */}
        <div className="w-28 sm:w-34 shrink-0 bg-slate-50/90 rounded-xl p-2 border border-slate-200 flex flex-col justify-between text-center">
          <div>
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-700 mb-0.5 gap-1">
              {isSec ? (
                <>
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold text-[8.5px] border ${
                      isBw
                        ? 'bg-slate-200 text-black border-slate-400'
                        : secBadge
                        ? `${secBadge.bg} ${secBadge.color}`
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    {secGrade || 'ม.1-6'}
                  </span>
                  <span className="font-mono text-slate-800 font-bold bg-white px-1 py-0.2 rounded border border-slate-300 text-[8.5px]">
                    [{secPos || 'n.'}]
                  </span>
                </>
              ) : (
                <>
                  <span
                    className={`px-1 py-0.2 rounded font-thai border ${
                      isBw
                        ? 'bg-slate-200 text-black border-slate-400'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    {vowelInfo?.name || word.vowel}
                  </span>
                  <span className="font-mono text-slate-800 font-bold bg-white px-1 py-0.2 rounded border border-slate-300">
                    {word.family}
                  </span>
                </>
              )}
            </div>

            <div className="my-0.5">
              <span className="text-3xl block leading-none select-none">{word.emoji || (isSec ? '📖' : '🦁')}</span>
              <div className="font-bubble text-xl sm:text-2xl font-black text-slate-900 tracking-wide mt-0.5">
                {word.word}
              </div>
            </div>

            {showPhonetic && (
              <div className="text-[10px] font-bold text-slate-800 font-thai leading-tight">
                อ่านว่า: <span className={isBw ? 'text-black underline' : 'text-amber-800'}>{word.phoneticTh}</span>
                <span className="font-mono text-[8.5px] text-slate-500 ml-0.5">/{word.phoneticIPA}/</span>
              </div>
            )}

            {showMeaning && (
              <div className="text-[10px] font-bold text-slate-900 font-thai mt-0.5 line-clamp-2">
                {word.meaningTh}
              </div>
            )}

            {/* Phonics Sound Breakdown Chips (Only for Primary Phonics) */}
            {!isSec && (
              <div className="mt-1 pt-1 border-t border-slate-200 flex items-center justify-center gap-0.5 flex-wrap">
                {letters.map((seg, sIdx) => (
                  <span
                    key={sIdx}
                    className="inline-flex items-center gap-0.5 bg-white border border-slate-300 rounded px-1 py-0.2 text-[8.5px] font-mono shadow-2xs"
                    title={`${seg.letter} = ${seg.soundTh}`}
                  >
                    <strong className="text-slate-900 font-black">{seg.letter}</strong>
                    <span className="text-slate-500 text-[7.5px] font-thai">/{seg.soundTh}/</span>
                  </span>
                ))}
              </div>
            )}

            {/* Secondary Topic & Synonyms Badge (For Secondary M.1 - M.6) */}
            {isSec && (
              <div className="mt-1 pt-1 border-t border-slate-200 text-left space-y-0.5">
                {secTopic && (
                  <div className="text-[8px] font-thai text-slate-500 truncate" title={secTopic}>
                    หมวด: {secTopic}
                  </div>
                )}
                {secSynonyms && secSynonyms.length > 0 && (
                  <div className="text-[8px] font-thai text-slate-600 truncate" title={secSynonyms.join(', ')}>
                    เหมือน: {secSynonyms.slice(0, 2).join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Student Self-Check Checkboxes */}
          <div className="mt-1 pt-1 border-t border-slate-200 grid grid-cols-3 gap-0.5 text-[8px] text-slate-600 font-thai">
            <label className="flex flex-col items-center cursor-pointer">
              <input type="checkbox" className="rounded text-black scale-75 cursor-pointer" />
              <span>{isSec ? 'จำศัพท์' : 'อ่านได้'}</span>
            </label>
            <label className="flex flex-col items-center cursor-pointer">
              <input type="checkbox" className="rounded text-black scale-75 cursor-pointer" />
              <span>คัดสวย</span>
            </label>
            <label className="flex flex-col items-center cursor-pointer">
              <input type="checkbox" className="rounded text-black scale-75 cursor-pointer" />
              <span>{isSec ? 'แต่งประโยค' : 'จำได้'}</span>
            </label>
          </div>
        </div>

        {/* Right Column: บรรทัดคัดลายมือยาวชิดขอบ (Full-Length Lines Stretching to Edge) */}
        <div className="flex-1 min-w-0 flex flex-col justify-between space-y-1.5">
          {/* Step 1: PenmanshipTracingLine */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-800 font-thai mb-0.5">
              <div className="flex items-center gap-1">
                <span className="bg-black text-white w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-[9px] font-bold">
                  1
                </span>
                <span>เขียนตามรอยประ (ตัวหนังสือ Fredoka วางบนเส้นฐานทึบ):</span>
              </div>
              <span className="text-[9px] text-slate-400 font-thai">
                คำต้นแบบ + คัดตาม {repeatCount} ครั้ง (ยาวเต็มบรรทัดชิดขอบ)
              </span>
            </div>
            <PenmanshipTracingLine
              word={word.word}
              repeatCount={repeatCount}
              showModelWord={true}
              colorMode={colorMode}
              fontType={fontType}
              showStartDot={showStartDot}
              customWidth={880}
            />
          </div>

          {/* Optional: Example Sentence Display for Secondary Words */}
          {isSec && word.sentence && (
            <div className="text-[9.5px] text-slate-600 font-thai italic truncate bg-slate-50/80 px-2 py-0.5 rounded border border-slate-200">
              <strong className="font-semibold text-slate-700 not-italic">ตัวอย่างประโยค: </strong>
              &ldquo;{word.sentence}&rdquo; {word.sentenceTh ? `(${word.sentenceTh})` : ''}
            </div>
          )}

          {/* Step 2: BlankHandwritingPracticeLine */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-800 font-thai mb-0.5">
              <div className="flex items-center gap-1">
                <span className="bg-black text-white w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-[9px] font-bold">
                  2
                </span>
                <span>คัดคำนี้ด้วยตนเองในบรรทัด 4 เส้น (วางตัวอักษรบนเส้นฐานทึบ):</span>
              </div>
              <span className="text-[9px] text-slate-400 font-thai">
                เขียนเอง {totalSlots} ครั้งตามจุดเริ่ม • (ยาวเต็มบรรทัดชิดขอบ)
              </span>
            </div>
            <BlankHandwritingPracticeLine
              label=""
              colorMode={colorMode}
              customWidth={880}
              repeatCount={totalSlots}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Complete Printable Tracing Worksheet Component
 */
export const TracingWorksheet: React.FC<TracingWorksheetProps> = ({
  pages,
  currentPageIndex,
  viewMode,
  showStudentHeader = true,
  showMeaning = true,
  showPhonetic = true,
  paperSize = 'a4',
  colorMode = 'bw',
  fontType = 'fredoka',
  showStartDot = true,
}) => {
  const isBw = colorMode === 'bw';

  return (
    <>
      {pages.map((pageWords, pageIdx) => {
        const isHiddenOnScreen = viewMode === 'single' && pageIdx !== currentPageIndex;
        const firstWord = pageWords[0] || pages[0]?.[0];
        const isSecondaryPage = !!(firstWord as any)?.isSecondary || !!(firstWord as any)?.secondaryGrade;
        const pageGrade = (firstWord as any)?.secondaryGrade as SecondaryGrade | undefined;

        return (
          <div
            key={pageIdx}
            data-page-active={pageIdx === currentPageIndex}
            className={`${
              paperSize === 'a5'
                ? 'phonics-a5-page paper-size-a5 min-h-[210mm] p-3 sm:p-4'
                : 'phonics-a4-page paper-size-a4 min-h-[297mm] p-4 sm:p-5'
            } bg-white text-slate-900 shadow-lg print:shadow-none border border-slate-300 w-full flex flex-col justify-between rounded-xl relative ${
              isHiddenOnScreen ? 'hidden print:flex' : 'flex'
            }`}
            style={{ boxSizing: 'border-box' }}
          >
            <div>
              {/* Header */}
              <div className="border-b-2 border-black pb-3 mb-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white text-xl shadow-xs shrink-0">
                      {isSecondaryPage ? '🎓' : '✏️'}
                    </div>
                    <div>
                      <h1 className="font-bubble text-xl sm:text-2xl font-black text-black leading-tight">
                        {isSecondaryPage
                          ? 'ใบงานฝึกคัดคำศัพท์ภาษาอังกฤษ ม.1 - ม.6 (Secondary Word Handwriting)'
                          : 'แบบฝึกหัดเขียนตามรอยประ (Phonics Word Tracing)'}
                      </h1>
                      <p className="text-xs text-slate-600 font-thai">
                        {isSecondaryPage
                          ? `ฝึกคัดลายมือคำศัพท์มาตรฐานหลักสูตรแกนกลาง สพฐ. ${
                              pageGrade ? `ระดับชั้น ${pageGrade}` : 'ระดับชั้น ม.1 - ม.6'
                            } บรรทัด 4 เส้น (${paperSize.toUpperCase()})`
                          : `ฝึกคัดลายมือตามรอยประ ตัวหนังสือชนิดเดียวกับคำศัพท์ (Fredoka) เส้นเดี่ยว บรรทัดขาวดำ 4 เส้น (${paperSize.toUpperCase()})`}
                      </p>
                    </div>
                  </div>

                  {/* Score box */}
                  <div className="border-2 border-black rounded-xl px-3 py-1 text-center bg-white">
                    <div className="text-[10px] font-bold text-slate-600 font-thai">คะแนนที่ได้</div>
                    <div className="text-sm font-black text-black">____ / 10</div>
                  </div>
                </div>

                {/* Handwriting Guideline Visual Guide / Legend */}
                <div className="flex items-center justify-between bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-[10px] font-thai text-slate-700 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-black">📏 ระดับบรรทัด 4 เส้น (ขาวดำ):</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-black inline-block"></span>
                      เส้นบน (ตัวพิมพ์ใหญ่/ตัวสูง)
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 border border-black border-dashed inline-block"></span>
                      เส้นประกลาง (ตัวพิมพ์เล็ก)
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-1 bg-black inline-block"></span>
                      เส้นฐานทึบ (ตัวอักษรวางบนเส้นนี้)
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
                      เส้นใต้ฐาน (หาง g, p, y)
                    </span>
                  </div>
                  <span className="text-black font-semibold hidden sm:inline">
                    ตัวอักษรเดียวกับคำศัพท์ที่แสดง คมชัด พิมพ์ขาวดำได้ทันที
                  </span>
                </div>

                {/* Student Info Bar */}
                {showStudentHeader && (
                  <div className="grid grid-cols-3 gap-3 pt-2 text-xs font-thai border-t border-slate-300 text-slate-800">
                    <div>ชื่อ-นามสกุล: ___________________________</div>
                    <div>ชั้น: _______ เลขที่: _____</div>
                    <div>วันที่: ___________________</div>
                  </div>
                )}
              </div>

              {/* Exercises List (4 words per page) */}
              <div className="space-y-2 sm:space-y-2.5">
                {pageWords.map((word, idx) => (
                  <TracingExerciseCard
                    key={word.id || `${pageIdx}-${idx}`}
                    word={word}
                    showMeaning={showMeaning}
                    showPhonetic={showPhonetic}
                    colorMode={colorMode}
                    fontType={fontType}
                    showStartDot={showStartDot}
                    paperSize={paperSize}
                  />
                ))}
              </div>
            </div>

            {/* Page Footer */}
            <div className="mt-4 pt-2 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 font-thai">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-slate-700" />
                <span>
                  {isSecondaryPage
                    ? `Smart Sarai English — ใบงานฝึกคัดคำศัพท์ภาษาอังกฤษ ม.1 - ม.6 หลักสูตรแกนกลาง สพฐ. ${paperSize.toUpperCase()}`
                    : `Phonics Kids — ใบงานคัดลายมือตัวอักษรเดียวกับคำศัพท์ เส้นเดี่ยว บรรทัดขาวดำ 4 เส้น ${paperSize.toUpperCase()}`}
                </span>
              </div>
              <div className="font-bold text-slate-800">
                หน้า {pageIdx + 1} จาก {pages.length}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};
