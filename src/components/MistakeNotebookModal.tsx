import React from 'react';
import { BookOpen, Sparkles, Target, Trash2, X, Play, ArrowRight, Award } from 'lucide-react';
import { StudentProfile } from '../lib/firebase.ts';

interface MistakeNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  onStartMistakePractice: (words: string[]) => void;
  onClearMistakes?: () => void;
}

export const MistakeNotebookModal: React.FC<MistakeNotebookModalProps> = ({
  isOpen,
  onClose,
  student,
  onStartMistakePractice,
  onClearMistakes,
}) => {
  if (!isOpen) return null;

  const words = student.incorrectWords || [];
  const mistakeKeysEntries = Object.entries(student.mistakeKeys || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border-4 border-amber-300 p-6 sm:p-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-3xl">
            📖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
                나만의 오답 단어장
              </h3>
              <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                {words.length}개 단어 수집됨
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              연습하면서 실수했던 낱말을 모아 집중 반복 연습으로 완벽하게 마스터해요!
            </p>
          </div>
        </div>

        {/* Top Mistaken Keys Analysis */}
        {mistakeKeysEntries.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
            <h4 className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
              <span>🔍</span>
              <span>내가 가장 자주 헷갈리는 자음·모음 TOP</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {mistakeKeysEntries.slice(0, 6).map(([keyName, count]) => (
                <span
                  key={keyName}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-slate-800 text-xs font-bold shadow-2xs"
                >
                  <span className="text-amber-600 font-extrabold">{keyName}</span>
                  <span className="text-[11px] text-slate-400">({count}회)</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Collected Incorrect Words */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between">
            <span>수집된 오타 낱말 목록</span>
            <span className="text-slate-400 text-[11px]">클릭 시 해당 단어 확인</span>
          </h4>

          {words.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <span className="text-4xl block mb-2">🎉</span>
              <p className="text-sm font-bold text-slate-700">현재 오답 단어장이 깨끗해요!</p>
              <p className="text-xs text-slate-400 mt-1">
                타자 연습 중 틀린 단어가 발생하면 여기에 자동으로 쏙쏙 모입니다.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
              {words.map((w, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-slate-900 font-bold text-sm shadow-2xs hover:border-rose-400 transition-colors"
                >
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          {words.length > 0 && (
            <button
              onClick={() => {
                onStartMistakePractice(words);
                onClose();
              }}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-extrabold text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>오답 낱말 집중 연습 시작하기!</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
