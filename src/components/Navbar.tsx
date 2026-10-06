import React from 'react';
import { Volume2, VolumeX, ShieldCheck, UserCheck, Sparkles, BookOpen, LogOut, RefreshCw } from 'lucide-react';
import { sound } from '../lib/sound.ts';
import { StudentProfile } from '../lib/firebase.ts';

interface NavbarProps {
  currentStudent: StudentProfile | null;
  isTeacher: boolean;
  onLogout: () => void;
  onOpenTeacherLogin: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSystemDiagnostics: () => void;
  dbStatus: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStudent,
  isTeacher,
  onLogout,
  onOpenTeacherLogin,
  soundEnabled,
  onToggleSound,
  onOpenSystemDiagnostics,
  dbStatus,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-amber-200 shadow-sm px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Mascot */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 flex items-center justify-center text-2xl shadow-md border-2 border-amber-300 transform -rotate-3 hover:rotate-0 transition-transform">
            ⌨️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-amber-900 font-heading">
                타자나라
              </h1>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300 shadow-xs">
                초등 4학년 맞춤
              </span>
            </div>
            <p className="text-xs text-amber-700/80 hidden sm:block">
              교과 연계 단계별 한글 타자 & AI 맞춤 피드백
            </p>
          </div>
        </div>

        {/* Right Info & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? '효과음 켜짐' : '효과음 꺼짐'}
            className="p-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors shadow-xs"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-amber-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
          </button>

          {/* Diagnostics Button */}
          <button
            onClick={onOpenSystemDiagnostics}
            title="시스템 연결 상태 진단 (Firebase & Gemini)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-xs"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${dbStatus ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="hidden md:inline">시스템 진단</span>
          </button>

          {/* Student Status or Teacher Status */}
          {currentStudent ? (
            <div className="flex items-center gap-2 pl-2 border-l border-amber-200">
              <div className="flex items-center gap-2 bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 px-3.5 py-1.5 rounded-2xl shadow-xs">
                <span className="text-lg">🎒</span>
                <div className="text-left">
                  <div className="text-xs font-bold text-sky-950 flex items-center gap-1">
                    <span>{currentStudent.grade}학년 {currentStudent.classNum}반 {currentStudent.studentNumber}번</span>
                    <span className="text-sky-700 font-extrabold">{currentStudent.studentName}</span>
                  </div>
                  <div className="text-[11px] text-sky-600 font-medium flex items-center gap-2">
                    <span>최고 {currentStudent.highestWpm || 0}타</span>
                    <span>•</span>
                    <span className="text-amber-600 font-bold">
                      {'⭐'.repeat(Math.min(3, currentStudent.clearedStage || 0)) || '새싹'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="로그아웃"
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : isTeacher ? (
            <div className="flex items-center gap-2 pl-2 border-l border-amber-200">
              <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 px-3.5 py-1.5 rounded-2xl">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-purple-900">교사 대시보드</span>
              </div>
              <button
                onClick={onLogout}
                title="학생 화면으로 돌아가기"
                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                나가기
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenTeacherLogin}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors shadow-xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>선생님 전용</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
