import React from 'react';
import { UserStats } from '../types/phonics';
import { Award, Star, X, CheckCircle2, Lock } from 'lucide-react';

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  desc: string;
  icon: string;
  req: string;
  isUnlocked: (stats: UserStats) => boolean;
}

export const BADGE_LIST: BadgeDefinition[] = [
  {
    id: 'first-word',
    title: 'ก้าวแรกคนเก่ง (First Steps)',
    desc: 'ฝึกออกเสียงคำแรกสำเร็จ',
    icon: '🌱',
    req: 'ฝึกคำศัพท์อย่างน้อย 1 คำ',
    isUnlocked: (s) => s.wordsPracticed.length >= 1,
  },
  {
    id: 'bubble-popper',
    title: 'เซียนฟองสบู่สะกดคำ (Spelling Ace)',
    desc: 'สะกดคำในเกมฟองสบู่ถูกต้อง 5 คำ',
    icon: '🫧',
    req: 'สะกดคำถูกต้อง 5 ครั้ง',
    isUnlocked: (s) => s.spellingScore >= 5,
  },
  {
    id: 'short-a-master',
    title: 'ผู้เชี่ยวชาญสระ Short A',
    desc: 'ฝึกคำศัพท์สระ A /æ/ ครบ 5 คำ',
    icon: '🍎',
    req: 'ฝึกคำสระ A อย่างน้อย 5 คำ',
    isUnlocked: (s) => s.wordsPracticed.filter((id) => id.startsWith('a-')).length >= 5,
  },
  {
    id: 'short-e-master',
    title: 'ผู้เชี่ยวชาญสระ Short E',
    desc: 'ฝึกคำศัพท์สระ E /ɛ/ ครบ 5 คำ',
    icon: '🥚',
    req: 'ฝึกคำสระ E อย่างน้อย 5 คำ',
    isUnlocked: (s) => s.wordsPracticed.filter((id) => id.startsWith('e-')).length >= 5,
  },
  {
    id: 'short-i-master',
    title: 'ผู้เชี่ยวชาญสระ Short I',
    desc: 'ฝึกคำศัพท์สระ I /ɪ/ ครบ 5 คำ',
    icon: '🦎',
    req: 'ฝึกคำสระ I อย่างน้อย 5 คำ',
    isUnlocked: (s) => s.wordsPracticed.filter((id) => id.startsWith('i-')).length >= 5,
  },
  {
    id: 'short-o-master',
    title: 'ผู้เชี่ยวชาญสระ Short O',
    desc: 'ฝึกคำศัพท์สระ O /ɒ/ ครบ 5 คำ',
    icon: '🐙',
    req: 'ฝึกคำสระ O อย่างน้อย 5 คำ',
    isUnlocked: (s) => s.wordsPracticed.filter((id) => id.startsWith('o-')).length >= 5,
  },
  {
    id: 'short-u-master',
    title: 'ผู้เชี่ยวชาญสระ Short U',
    desc: 'ฝึกคำศัพท์สระ U /ʌ/ ครบ 5 คำ',
    icon: '☂️',
    req: 'ฝึกคำสระ U อย่างน้อย 5 คำ',
    isUnlocked: (s) => s.wordsPracticed.filter((id) => id.startsWith('u-')).length >= 5,
  },
  {
    id: 'star-collector',
    title: 'นักสะสมดวงดาว (Star Master)',
    desc: 'สะสมดาวครบ 25 ดวง',
    icon: '⭐',
    req: 'มีคะแนนดาวสะสม 25 ดวง',
    isUnlocked: (s) => s.stars >= 25,
  },
  {
    id: 'phonics-superstar',
    title: 'Phonics Super Star 🌟',
    desc: 'ฝึกคำศัพท์รวมมากกว่า 20 คำ',
    icon: '👑',
    req: 'ฝึกคำศัพท์ครบ 20 คำ',
    isUnlocked: (s) => s.wordsPracticed.length >= 20,
  },
];

export const BadgesModal: React.FC<BadgesModalProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-purple-200 relative max-h-[85vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bubble text-xl font-black text-slate-800">
              เหรียญรางวัลความสำเร็จ (Badges)
            </h3>
            <p className="text-xs text-slate-500">
              สะสมดาวและฝึกฝนเพื่อปลดล็อกเหรียญรางวัลทั้งหมด!
            </p>
          </div>
        </div>

        {/* Badges List */}
        <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
          {BADGE_LIST.map((b) => {
            const unlocked = b.isUnlocked(stats);

            return (
              <div
                key={b.id}
                className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition ${
                  unlocked
                    ? 'bg-gradient-to-r from-purple-50 to-amber-50 border-purple-200 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-inner border border-slate-100 shrink-0">
                  {b.icon}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{b.title}</span>
                    {unlocked ? (
                      <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-600 bg-emerald-100 px-2 py-0.2 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> ปลดล็อกแล้ว
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.2 rounded-full">
                        <Lock className="w-3 h-3" /> ล็อกอยู่
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{b.desc}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    เงื่อนไข: {b.req}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-600 flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
            <span>ดาวของคุณ: {stats.stars} ดวง</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
