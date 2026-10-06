import React, { useState } from 'react';
import { Sparkles, KeyRound, Lock, User, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { sha256 } from '../lib/hash.ts';
import { getStudentProfile, saveStudentProfile, getClassConfig, StudentProfile } from '../lib/firebase.ts';

interface StudentLoginModalProps {
  onLoginSuccess: (student: StudentProfile) => void;
  onOpenTeacher: () => void;
}

export const StudentLoginModal: React.FC<StudentLoginModalProps> = ({ onLoginSuccess, onOpenTeacher }) => {
  const [schoolYear, setSchoolYear] = useState('2026');
  const [grade, setGrade] = useState('4');
  const [classNum, setClassNum] = useState('1');
  const [studentNumber, setStudentNumber] = useState('1');
  const [studentName, setStudentName] = useState('');

  // Flow states
  const [isChecking, setIsChecking] = useState(false);
  const [existingStudent, setExistingStudent] = useState<StudentProfile | null>(null);
  const [step, setStep] = useState<'info' | 'enter_password' | 'create_password'>('info');

  const [passwordInput, setPasswordInput] = useState('');
  const [classPasswordInput, setClassPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Generated student key
  const paddedNum = String(studentNumber).padStart(2, '0');
  const studentKey = `${schoolYear}-${grade}-${classNum}-${paddedNum}`;

  const handleCheckStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!studentName.trim()) {
      setErrorMsg('이름을 입력해 주세요!');
      return;
    }

    setIsChecking(true);
    try {
      const profile = await getStudentProfile(studentKey);
      if (profile) {
        setExistingStudent(profile);
        setStep('enter_password');
      } else {
        setExistingStudent(null);
        setStep('create_password');
      }
    } catch (err) {
      setErrorMsg('학생 정보를 확인하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleLoginExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingStudent) return;
    setErrorMsg('');

    if (!passwordInput.trim()) {
      setErrorMsg('비밀번호를 입력해 주세요.');
      return;
    }

    const hash = await sha256(passwordInput.trim());
    if (hash === existingStudent.passwordHash) {
      onLoginSuccess(existingStudent);
    } else {
      setErrorMsg('비밀번호가 맞지 않아요. 생각이 안 나면 선생님께 초기화를 부탁해 보세요!');
    }
  };

  const handleRegisterNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!classPasswordInput.trim()) {
      setErrorMsg('학급 공통 비밀번호를 입력해 주세요 (기본: 1234)');
      return;
    }

    if (newPasswordInput.length < 4) {
      setErrorMsg('개인 비밀번호는 최소 4자리 이상으로 정해주세요.');
      return;
    }

    if (newPasswordInput !== newPasswordConfirm) {
      setErrorMsg('새 비밀번호 두 개가 서로 달라요. 다시 확인해 주세요!');
      return;
    }

    setIsChecking(true);
    try {
      // Check class password (default '1234' if classConfig not set)
      const classId = `${schoolYear}-${grade}-${classNum}`;
      const classConfig = await getClassConfig(classId);
      const classHash = await sha256(classPasswordInput.trim());

      const defaultClassHash = await sha256('1234');
      const expectedClassHash = classConfig?.classPasswordHash || defaultClassHash;

      if (classHash !== expectedClassHash) {
        setErrorMsg('학급 공통 비밀번호가 맞지 않아요. 선생님께 학급 비밀번호를 여쭤보세요!');
        setIsChecking(false);
        return;
      }

      // Hash student personal password
      const personalHash = await sha256(newPasswordInput.trim());
      const newStudent: StudentProfile = {
        studentKey,
        schoolYear,
        grade: Number(grade),
        classNum: Number(classNum),
        studentNumber: Number(studentNumber),
        studentName: studentName.trim(),
        passwordHash: personalHash,
        highestWpm: 0,
        highestAccuracy: 0,
        clearedStage: 0,
        totalAttempts: 0,
        incorrectWords: [],
        mistakeKeys: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveStudentProfile(newStudent);
      onLoginSuccess(newStudent);
    } catch (err) {
      setErrorMsg('등록하지 못했어요. 잠시 후 다시 시도해 주세요!');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-4 border-amber-300 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Cute Mascot Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-100 border-4 border-amber-300 text-4xl mb-3 shadow-inner">
            🐰
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            초등 4학년 타자나라 입장하기
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            내 번호와 이름으로 로그인하여 타자 실력을 뽐내보아요!
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Student Information Selection */}
        {step === 'info' && (
          <form onSubmit={handleCheckStudent} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">학년도</label>
                <select
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-amber-200 bg-amber-50/50 text-slate-900 font-bold text-sm focus:border-amber-400 focus:outline-hidden"
                >
                  <option value="2026">2026년</option>
                  <option value="2025">2025년</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">학년</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-amber-200 bg-amber-50/50 text-slate-900 font-bold text-sm focus:border-amber-400 focus:outline-hidden"
                >
                  <option value="4">4학년</option>
                  <option value="3">3학년</option>
                  <option value="5">5학년</option>
                  <option value="6">6학년</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">반</label>
                <select
                  value={classNum}
                  onChange={(e) => setClassNum(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-amber-200 bg-amber-50/50 text-slate-900 font-bold text-sm focus:border-amber-400 focus:outline-hidden"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}반
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">번호</label>
                <select
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-amber-200 bg-amber-50/50 text-slate-900 font-bold text-sm focus:border-amber-400 focus:outline-hidden"
                >
                  {Array.from({ length: 35 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}번
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">학생 이름</label>
              <input
                type="text"
                placeholder="예: 홍길동"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                maxLength={10}
                required
                className="w-full px-4 py-3 rounded-2xl border-2 border-amber-200 text-slate-900 font-bold text-base focus:border-amber-400 focus:ring-4 focus:ring-amber-100 focus:outline-hidden transition-all"
              />
            </div>

            {/* Student Key Badge */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">나의 고유 학번 키:</span>
              <span className="font-mono font-bold text-amber-900 bg-white px-2 py-1 rounded-lg border border-amber-200">
                {studentKey}
              </span>
            </div>

            <button
              type="submit"
              disabled={isChecking}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-extrabold text-lg shadow-lg hover:shadow-xl transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isChecking ? '확인 중...' : '다음 단계로'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        )}

        {/* STEP 2-A: Existing Student Login */}
        {step === 'enter_password' && existingStudent && (
          <form onSubmit={handleLoginExisting} className="space-y-4">
            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 text-center">
              <p className="text-xs text-sky-700 font-semibold mb-1">환영해요, 다시 만나서 반가워요!</p>
              <p className="text-lg font-bold text-sky-950">
                {existingStudent.grade}학년 {existingStudent.classNum}반 {existingStudent.studentNumber}번{' '}
                <span className="text-sky-600">{existingStudent.studentName}</span>
              </p>
              <div className="flex items-center justify-center gap-3 mt-2 text-xs font-semibold text-slate-600">
                <span>최고 타수: {existingStudent.highestWpm}타</span>
                <span>•</span>
                <span>최고 정확도: {existingStudent.highestAccuracy}%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">개인 비밀번호 입력</label>
              <input
                type="password"
                placeholder="설정했던 비밀번호를 입력하세요"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 rounded-2xl border-2 border-amber-200 text-slate-900 font-bold text-base focus:border-amber-400 focus:outline-hidden"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                💡 비밀번호가 기억나지 않으면 선생님께 초기화를 요청해 주세요!
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('info')}
                className="w-1/3 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
              >
                뒤로
              </button>
              <button
                type="submit"
                className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-extrabold text-base shadow-md transition-all active:scale-98"
              >
                로그인 & 타자 시작!
              </button>
            </div>
          </form>
        )}

        {/* STEP 2-B: First-Time Student Setup */}
        {step === 'create_password' && (
          <form onSubmit={handleRegisterNew} className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center">
              <span className="text-xs font-bold text-amber-800">
                🎉 {grade}학년 {classNum}반 {studentNumber}번 {studentName} 친구의 첫 방문입니다!
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                1. 학급 공통 비밀번호 <span className="text-amber-600 font-normal">(기본값: 1234)</span>
              </label>
              <input
                type="password"
                placeholder="선생님이 알려주신 학급 비밀번호 (예: 1234)"
                value={classPasswordInput}
                onChange={(e) => setClassPasswordInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-amber-200 text-slate-900 font-bold text-sm focus:border-amber-400 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                2. 나만의 개인 비밀번호 정하기 <span className="text-slate-500 font-normal">(4자리 이상)</span>
              </label>
              <input
                type="password"
                placeholder="앞으로 로그인할 때 사용할 비밀번호"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-amber-200 text-slate-900 font-bold text-sm focus:border-amber-400 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">3. 나만의 비밀번호 한 번 더 입력</label>
              <input
                type="password"
                placeholder="비밀번호 확인"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-amber-200 text-slate-900 font-bold text-sm focus:border-amber-400 focus:outline-hidden"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('info')}
                className="w-1/3 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
              >
                뒤로
              </button>
              <button
                type="submit"
                disabled={isChecking}
                className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-base shadow-md transition-all active:scale-98"
              >
                {isChecking ? '저장 중...' : '비밀번호 등록 및 입장!'}
              </button>
            </div>
          </form>
        )}

        {/* Teacher Entry Link */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={onOpenTeacher}
            className="text-xs text-slate-400 hover:text-purple-600 font-semibold underline transition-colors"
          >
            선생님이신가요? 교사용 관리자 로그인으로 이동
          </button>
        </div>
      </div>
    </div>
  );
};
