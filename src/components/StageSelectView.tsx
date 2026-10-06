import React from 'react';
import { Lock, CheckCircle, Star, ArrowRight, BookOpen, Sparkles, Award, Flame, RotateCcw } from 'lucide-react';
import { CURRICULUM_STAGES, PracticeStage } from '../lib/curriculumData.ts';
import { StudentProfile } from '../lib/firebase.ts';

interface StageSelectViewProps {
  student: StudentProfile;
  onSelectStage: (stage: PracticeStage) => void;
  onOpenMistakeNotebook: () => void;
  onStartMistakePractice: () => void;
}

export const StageSelectView: React.FC<StageSelectViewProps> = ({
  student,
  onSelectStage,
  onOpenMistakeNotebook,
  onStartMistakePractice,
}) => {
  const cleared = student.clearedStage || 0;
  const incorrectCount = (student.incorrectWords || []).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Student Welcome & Level Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200 rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-amber-300">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/80 backdrop-blur-xs rounded-full text-xs font-bold text-amber-900 border border-amber-300/80">
              <span>🌟</span>
              <span>4학년 {student.classNum}반 {student.studentNumber}번</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-heading">
              반가워요, <span className="text-amber-800 underline decoration-amber-400 decoration-wavy">{student.studentName}</span> 대장님!
            </h2>
            <p className="text-sm sm:text-base text-slate-800 font-medium">
              오늘도 신나게 타자 카드를 깨고 목표 타수에 도달해 볼까요?
            </p>
          </div>

          {/* Quick Stats Pill Cards */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-3.5 border-2 border-amber-300 text-center min-w-[100px] shadow-sm">
              <span className="block text-[11px] font-bold text-slate-500">최고 타수</span>
              <span className="text-2xl font-black text-amber-600 font-heading">
                {student.highestWpm || 0}
                <span className="text-xs font-bold text-slate-500 ml-0.5">타</span>
              </span>
            </div>

            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-3.5 border-2 border-amber-300 text-center min-w-[100px] shadow-sm">
              <span className="block text-[11px] font-bold text-slate-500">최고 정확도</span>
              <span className="text-2xl font-black text-emerald-600 font-heading">
                {student.highestAccuracy || 0}
                <span className="text-xs font-bold text-slate-500 ml-0.5">%</span>
              </span>
            </div>

            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-3.5 border-2 border-amber-300 text-center min-w-[100px] shadow-sm">
              <span className="block text-[11px] font-bold text-slate-500">클리어 별점</span>
              <div className="text-xl font-bold text-amber-500 pt-0.5">
                {'⭐'.repeat(Math.min(3, cleared)) || '🌱'}
              </div>
            </div>
          </div>
        </div>

        {/* Decorative corner element */}
        <div className="absolute -bottom-6 -right-6 text-9xl opacity-20 select-none pointer-events-none">
          🏰
        </div>
      </div>

      {/* Special Feature: Mistake Notebook Banner */}
      <div className="bg-gradient-to-r from-rose-50 to-amber-50 border-3 border-rose-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 border-2 border-rose-300 flex items-center justify-center text-3xl shrink-0">
            📖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 font-heading">
                나만의 오답 단어장 & 집중 반복 연습
              </h3>
              <span className="bg-rose-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
                {incorrectCount}개 수집됨
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              연습 중 틀렸던 단어와 자음/모음을 분석하여 취약한 글자만 쏙쏙 골라 연습할 수 있어요!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMistakeNotebook}
            className="px-4 py-2.5 rounded-xl bg-white border-2 border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs transition-colors shadow-2xs"
          >
            단어장 열어보기
          </button>
          {incorrectCount > 0 && (
            <button
              onClick={onStartMistakePractice}
              className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-98"
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>오답 집중 연습 시작!</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 3 Stages Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
              단계별 교과 타자 퀘스트 🚀
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              세트를 완주하고 정확도 90% 이상 + 목표 타수를 달성하면 다음 단계가 해금됩니다!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CURRICULUM_STAGES.map((stage) => {
            const isUnlocked = stage.stageNumber === 1 || cleared >= stage.stageNumber - 1;
            const isCleared = cleared >= stage.stageNumber;

            return (
              <div
                key={stage.stageNumber}
                className={`relative rounded-3xl p-6 border-4 transition-all duration-200 flex flex-col justify-between ${
                  !isUnlocked
                    ? 'bg-slate-100/90 border-slate-200 opacity-75'
                    : isCleared
                    ? 'bg-white border-emerald-300 shadow-lg hover:shadow-xl hover:-translate-y-1'
                    : 'bg-white border-amber-300 shadow-lg hover:shadow-xl hover:-translate-y-1 ring-2 ring-amber-200'
                }`}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-3xl shadow-inner">
                    {stage.icon}
                  </div>
                  {isCleared ? (
                    <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-300">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      클리어 완료 ⭐
                    </span>
                  ) : !isUnlocked ? (
                    <span className="flex items-center gap-1 bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
                      <Lock className="w-3.5 h-3.5" />
                      이전 단계 클리어 필요
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-900 text-xs font-extrabold px-3 py-1 rounded-full border border-amber-300 animate-pulse">
                      도전 가능 🎯
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-2 mb-6">
                  <h4 className="text-xl font-black text-slate-900 font-heading">
                    {stage.title}
                  </h4>
                  <p className="text-xs font-semibold text-amber-700">
                    {stage.subtitle}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed pt-1">
                    {stage.description}
                  </p>
                </div>

                {/* Target Requirement Info */}
                <div className="pt-3 border-t border-slate-100 mb-6 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">목표 속도:</span>
                    <span className="font-bold text-amber-600">{stage.targetCpm} 타/분 이상</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">목표 정확도:</span>
                    <span className="font-bold text-emerald-600">{stage.targetAccuracy}% 이상</span>
                  </div>
                </div>

                {/* Play Button */}
                <button
                  disabled={!isUnlocked}
                  onClick={() => onSelectStage(stage)}
                  className={`w-full py-4 rounded-2xl font-extrabold text-base transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                    !isUnlocked
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : isCleared
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-slate-950'
                  }`}
                >
                  {!isUnlocked ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>잠겨있음</span>
                    </>
                  ) : isCleared ? (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>다시 연습하기</span>
                    </>
                  ) : (
                    <>
                      <span>연습 시작하기</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
