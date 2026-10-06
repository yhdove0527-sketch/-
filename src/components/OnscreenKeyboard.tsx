import React from 'react';
import { decomposeChar, SHIFT_KEY_MAP } from '../lib/hangul.ts';

interface OnscreenKeyboardProps {
  expectedNextChar?: string;
}

// 2-set Korean Keyboard rows with Shift and Hand layout
const KEYBOARD_ROWS = [
  [
    { key: 'q', ko: 'ㅂ', shiftKo: 'ㅃ', finger: 'left-pinky' },
    { key: 'w', ko: 'ㅈ', shiftKo: 'ㅉ', finger: 'left-ring' },
    { key: 'e', ko: 'ㄷ', shiftKo: 'ㄸ', finger: 'left-mid' },
    { key: 'r', ko: 'ㄱ', shiftKo: 'ㄲ', finger: 'left-index' },
    { key: 't', ko: 'ㅅ', shiftKo: 'ㅆ', finger: 'left-index' },
    { key: 'y', ko: 'ㅛ', shiftKo: '', finger: 'right-index' },
    { key: 'u', ko: 'ㅕ', shiftKo: '', finger: 'right-index' },
    { key: 'i', ko: 'ㅑ', shiftKo: '', finger: 'right-mid' },
    { key: 'o', ko: 'ㅐ', shiftKo: 'ㅒ', finger: 'right-ring' },
    { key: 'p', ko: 'ㅔ', shiftKo: 'ㅖ', finger: 'right-pinky' },
  ],
  [
    { key: 'a', ko: 'ㅁ', shiftKo: '', finger: 'left-pinky' },
    { key: 's', ko: 'ㄴ', shiftKo: '', finger: 'left-ring' },
    { key: 'd', ko: 'ㅇ', shiftKo: '', finger: 'left-mid' },
    { key: 'f', ko: 'ㄹ', shiftKo: '', finger: 'left-index', isHome: true },
    { key: 'g', ko: 'ㅎ', shiftKo: '', finger: 'left-index' },
    { key: 'h', ko: 'ㅗ', shiftKo: '', finger: 'right-index' },
    { key: 'j', ko: 'ㅓ', shiftKo: '', finger: 'right-index', isHome: true },
    { key: 'k', ko: 'ㅏ', shiftKo: '', finger: 'right-mid' },
    { key: 'l', ko: 'ㅣ', shiftKo: '', finger: 'right-ring' },
  ],
  [
    { key: 'z', ko: 'ㅋ', shiftKo: '', finger: 'left-pinky' },
    { key: 'x', ko: 'ㅌ', shiftKo: '', finger: 'left-ring' },
    { key: 'c', ko: 'ㅊ', shiftKo: '', finger: 'left-mid' },
    { key: 'v', ko: 'ㅍ', shiftKo: '', finger: 'left-index' },
    { key: 'b', ko: 'ㅠ', shiftKo: '', finger: 'right-index' },
    { key: 'n', ko: 'ㅜ', shiftKo: '', finger: 'right-index' },
    { key: 'm', ko: 'ㅡ', shiftKo: '', finger: 'right-mid' },
  ],
];

const FINGER_COLORS: Record<string, string> = {
  'left-pinky': 'border-rose-200 bg-rose-50/70 text-rose-900',
  'left-ring': 'border-amber-200 bg-amber-50/70 text-amber-900',
  'left-mid': 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
  'left-index': 'border-sky-200 bg-sky-50/70 text-sky-900',
  'right-index': 'border-cyan-200 bg-cyan-50/70 text-cyan-900',
  'right-mid': 'border-indigo-200 bg-indigo-50/70 text-indigo-900',
  'right-ring': 'border-purple-200 bg-purple-50/70 text-purple-900',
  'right-pinky': 'border-pink-200 bg-pink-50/70 text-pink-900',
};

export const OnscreenKeyboard: React.FC<OnscreenKeyboardProps> = ({ expectedNextChar }) => {
  // Determine target Jamo to highlight
  let targetJamo: string | null = null;
  let isSpace = false;

  if (expectedNextChar) {
    if (expectedNextChar === ' ') {
      isSpace = true;
    } else {
      const decomp = decomposeChar(expectedNextChar);
      if (decomp.isHangul && decomp.keys.length > 0) {
        targetJamo = decomp.keys[0]; // first stroke needed
      } else {
        targetJamo = expectedNextChar;
      }
    }
  }

  return (
    <div className="bg-slate-900/90 text-white p-3 sm:p-4 rounded-3xl shadow-xl border-4 border-amber-300 max-w-3xl mx-auto select-none backdrop-blur-sm">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/60 text-xs px-2">
        <span className="text-amber-300 font-bold flex items-center gap-1.5">
          <span>🖐️</span>
          <span>바른 손가락 자리 가이드 (왼손 ↔ 오른손)</span>
        </span>
        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> 왼손(자음)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span> 오른손(모음)
          </span>
        </div>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        {/* Row 1 */}
        <div className="flex justify-center gap-1 sm:gap-1.5">
          {KEYBOARD_ROWS[0].map((k) => {
            const isTarget = targetJamo === k.ko || targetJamo === k.shiftKo || (SHIFT_KEY_MAP[targetJamo || ''] === k.ko);
            return (
              <div
                key={k.key}
                className={`w-7 sm:w-12 h-9 sm:h-12 rounded-xl flex flex-col items-center justify-center font-bold text-xs sm:text-base border transition-all duration-150 ${
                  isTarget
                    ? 'bg-amber-400 text-slate-900 border-yellow-200 ring-4 ring-amber-300 animate-bounce scale-110 z-10 font-extrabold shadow-lg'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {k.shiftKo && <span className="text-[9px] sm:text-[10px] text-slate-400 -mb-1">{k.shiftKo}</span>}
                <span>{k.ko}</span>
              </div>
            );
          })}
        </div>

        {/* Row 2 */}
        <div className="flex justify-center gap-1 sm:gap-1.5">
          {KEYBOARD_ROWS[1].map((k) => {
            const isTarget = targetJamo === k.ko;
            return (
              <div
                key={k.key}
                className={`w-7 sm:w-12 h-9 sm:h-12 rounded-xl flex flex-col items-center justify-center font-bold text-xs sm:text-base border transition-all duration-150 relative ${
                  isTarget
                    ? 'bg-amber-400 text-slate-900 border-yellow-200 ring-4 ring-amber-300 animate-bounce scale-110 z-10 font-extrabold shadow-lg'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <span>{k.ko}</span>
                {k.isHome && (
                  <span className="w-1.5 h-0.5 bg-amber-400 rounded-full absolute bottom-1"></span>
                )}
              </div>
            );
          })}
        </div>

        {/* Row 3 */}
        <div className="flex justify-center gap-1 sm:gap-1.5">
          {KEYBOARD_ROWS[2].map((k) => {
            const isTarget = targetJamo === k.ko;
            return (
              <div
                key={k.key}
                className={`w-7 sm:w-12 h-9 sm:h-12 rounded-xl flex items-center justify-center font-bold text-xs sm:text-base border transition-all duration-150 ${
                  isTarget
                    ? 'bg-amber-400 text-slate-900 border-yellow-200 ring-4 ring-amber-300 animate-bounce scale-110 z-10 font-extrabold shadow-lg'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <span>{k.ko}</span>
              </div>
            );
          })}
        </div>

        {/* Space Bar Row */}
        <div className="flex justify-center pt-1">
          <div
            className={`w-44 sm:w-64 h-8 sm:h-10 rounded-2xl flex items-center justify-center text-xs font-bold border transition-all duration-150 ${
              isSpace
                ? 'bg-amber-400 text-slate-900 border-yellow-200 ring-4 ring-amber-300 animate-bounce scale-105 z-10 shadow-lg'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <span>스페이스 (띄어쓰기)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
