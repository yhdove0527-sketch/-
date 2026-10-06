import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { StudentLoginModal } from './components/StudentLoginModal.tsx';
import { TeacherLoginModal } from './components/TeacherLoginModal.tsx';
import { SystemDiagnosticsModal } from './components/SystemDiagnosticsModal.tsx';
import { MistakeNotebookModal } from './components/MistakeNotebookModal.tsx';
import { StageSelectView } from './components/StageSelectView.tsx';
import { TypingPracticeView } from './components/TypingPracticeView.tsx';
import { TeacherDashboardView } from './components/TeacherDashboardView.tsx';
import { StudentProfile, testFirestoreCRUD } from './lib/firebase.ts';
import { PracticeStage, PracticeItem, CURRICULUM_STAGES } from './lib/curriculumData.ts';
import { sound } from './lib/sound.ts';

export default function App() {
  const [currentStudent, setCurrentStudent] = useState<StudentProfile | null>(() => {
    try {
      const saved = localStorage.getItem('current_student');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isTeacher, setIsTeacher] = useState<boolean>(() => {
    return localStorage.getItem('is_teacher_session') === 'true';
  });

  // Views & Modals
  const [currentView, setCurrentView] = useState<'stage_select' | 'typing_practice'>('stage_select');
  const [selectedStage, setSelectedStage] = useState<PracticeStage | null>(null);
  const [customPracticeItems, setCustomPracticeItems] = useState<PracticeItem[] | null>(null);

  const [isTeacherLoginOpen, setIsTeacherLoginOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isMistakeNotebookOpen, setIsMistakeNotebookOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Connection status
  const [dbStatus, setDbStatus] = useState<boolean>(false);

  // Boot connection check
  useEffect(() => {
    const checkDb = async () => {
      try {
        const res = await testFirestoreCRUD();
        setDbStatus(res.success);
      } catch {
        setDbStatus(false);
      }
    };
    checkDb();
  }, []);

  // Sync currentStudent to localStorage
  useEffect(() => {
    if (currentStudent) {
      localStorage.setItem('current_student', JSON.stringify(currentStudent));
    } else {
      localStorage.removeItem('current_student');
    }
  }, [currentStudent]);

  const handleStudentLoginSuccess = (student: StudentProfile) => {
    setCurrentStudent(student);
    setIsTeacher(false);
    localStorage.removeItem('is_teacher_session');
    setCurrentView('stage_select');
  };

  const handleTeacherLoginSuccess = () => {
    setIsTeacher(true);
    setCurrentStudent(null);
    localStorage.setItem('is_teacher_session', 'true');
    localStorage.removeItem('current_student');
  };

  const handleLogout = () => {
    setCurrentStudent(null);
    setIsTeacher(false);
    localStorage.removeItem('current_student');
    localStorage.removeItem('is_teacher_session');
    setCurrentView('stage_select');
    setSelectedStage(null);
    setCustomPracticeItems(null);
  };

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    sound.enabled = nextVal;
  };

  // Launch normal stage practice
  const handleSelectStage = (stage: PracticeStage) => {
    setSelectedStage(stage);
    setCustomPracticeItems(null);
    setCurrentView('typing_practice');
  };

  // Launch mistake notebook practice
  const handleStartMistakePractice = (wordsToPractice?: string[]) => {
    if (!currentStudent) return;
    const words = wordsToPractice || currentStudent.incorrectWords || [];
    if (words.length === 0) return;

    const mistakeStage: PracticeStage = {
      stageNumber: 99,
      title: '🎯 나만의 오답 단어 집중 연습',
      subtitle: `틀렸던 단어 ${words.length}개 집중 마스터 코스`,
      targetCpm: 80,
      targetAccuracy: 90,
      description: '실수했던 낱말들을 다시 차분하게 치며 완벽히 익혀보아요!',
      icon: '🎯',
      color: 'from-rose-400 to-amber-500',
      items: words.slice(0, 10).map((w, idx) => ({
        id: `mis-${idx}`,
        text: w,
        meaning: '내가 연습 중 틀렸던 낱말',
        subject: '국어',
      })),
    };

    setSelectedStage(mistakeStage);
    setCustomPracticeItems(mistakeStage.items);
    setCurrentView('typing_practice');
  };

  // When practice session is finished
  const handlePracticeFinished = (updatedStudent: StudentProfile) => {
    setCurrentStudent(updatedStudent);
    setCurrentView('stage_select');
    setSelectedStage(null);
    setCustomPracticeItems(null);
  };

  // Teacher custom sentence deployment
  const handleDeployCustomSetToClass = (items: PracticeItem[], title: string) => {
    // Stage custom set
    const customStage: PracticeStage = {
      stageNumber: 10,
      title: `📝 ${title}`,
      subtitle: '선생님이 배포한 4학년 맞춤 연습 세트',
      targetCpm: 100,
      targetAccuracy: 90,
      description: '선생님이 AI와 함께 만들어주신 특별 탐구 문장입니다.',
      icon: '✨',
      color: 'from-purple-400 to-indigo-500',
      items,
    };
    setSelectedStage(customStage);
    setCustomPracticeItems(items);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF7] text-slate-800">
      {/* Top Navigation */}
      <Navbar
        currentStudent={currentStudent}
        isTeacher={isTeacher}
        onLogout={handleLogout}
        onOpenTeacherLogin={() => setIsTeacherLoginOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenSystemDiagnostics={() => setIsDiagnosticsOpen(true)}
        dbStatus={dbStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* If Teacher Mode */}
        {isTeacher ? (
          <TeacherDashboardView
            onBackToStudentView={() => {
              setIsTeacher(false);
              localStorage.removeItem('is_teacher_session');
            }}
            onOpenSystemDiagnostics={() => setIsDiagnosticsOpen(true)}
            onDeployCustomSetToClass={handleDeployCustomSetToClass}
          />
        ) : !currentStudent ? (
          /* Student Login Screen */
          <StudentLoginModal
            onLoginSuccess={handleStudentLoginSuccess}
            onOpenTeacher={() => setIsTeacherLoginOpen(true)}
          />
        ) : currentView === 'stage_select' ? (
          /* Stage Selection Hub */
          <StageSelectView
            student={currentStudent}
            onSelectStage={handleSelectStage}
            onOpenMistakeNotebook={() => setIsMistakeNotebookOpen(true)}
            onStartMistakePractice={() => handleStartMistakePractice()}
          />
        ) : selectedStage ? (
          /* Interactive Typing Practice Engine */
          <TypingPracticeView
            stage={selectedStage}
            customItems={customPracticeItems || undefined}
            student={currentStudent}
            onBack={() => {
              setCurrentView('stage_select');
              setSelectedStage(null);
              setCustomPracticeItems(null);
            }}
            onFinished={handlePracticeFinished}
          />
        ) : null}
      </main>

      {/* Modals */}
      <TeacherLoginModal
        isOpen={isTeacherLoginOpen}
        onClose={() => setIsTeacherLoginOpen(false)}
        onLoginSuccess={handleTeacherLoginSuccess}
      />

      <SystemDiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        onRefreshParentStatus={async () => {
          const res = await testFirestoreCRUD();
          setDbStatus(res.success);
        }}
      />

      {currentStudent && (
        <MistakeNotebookModal
          isOpen={isMistakeNotebookOpen}
          onClose={() => setIsMistakeNotebookOpen(false)}
          student={currentStudent}
          onStartMistakePractice={(words) => handleStartMistakePractice(words)}
        />
      )}

      {/* Elementary School Friendly Footer */}
      <footer className="mt-auto border-t border-amber-200 bg-white/60 py-4 px-6 text-center text-xs text-amber-900/70">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>🎒 초등 4학년 맞춤형 타자나라</span>
            <span>•</span>
            <span>교육과정 연계 국어·사회·과학·도덕</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${dbStatus ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span>{dbStatus ? 'Firestore 실시간 연결 정상' : 'Firestore 상태 확인 중'}</span>
            </span>
            <span>•</span>
            <span>Gemini AI 맞춤 코칭</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
