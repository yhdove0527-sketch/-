import React, { useState } from 'react';
import { Shield, KeyRound, X, AlertCircle } from 'lucide-react';
import { sha256 } from '../lib/hash.ts';
import { getClassConfig, saveClassConfig } from '../lib/firebase.ts';

interface TeacherLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!password.trim()) {
      setErrorMsg('비밀번호를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check stored admin hash in Firestore 'classes/teacher_admin'
      const adminConfig = await getClassConfig('teacher_admin');
      const inputHash = await sha256(password.trim());

      // Default password is 'admin1234'
      const defaultHash = await sha256('admin1234');
      const expectedHash = adminConfig?.classPasswordHash || defaultHash;

      if (inputHash === expectedHash) {
        // If first time, save the default hash to Firestore
        if (!adminConfig) {
          await saveClassConfig('teacher_admin', {
            classId: 'teacher_admin',
            schoolYear: '2026',
            grade: 4,
            classNum: 0,
            classPasswordHash: defaultHash,
            className: '교사용 관리자',
          });
        }
        onLoginSuccess();
        onClose();
      } else {
        setErrorMsg('관리자 비밀번호가 일치하지 않습니다. (초기 비밀번호: admin1234)');
      }
    } catch {
      // Fallback
      if (password.trim() === 'admin1234') {
        onLoginSuccess();
        onClose();
      } else {
        setErrorMsg('확인에 실패했습니다. 초기 비밀번호는 admin1234 입니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 border-purple-300 p-6 sm:p-8 animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 text-3xl mb-3 border-2 border-purple-300">
            <Shield className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 font-heading">
            교사용 대시보드 로그인
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            학급 타자 성취도, 오타 분석 및 AI 과정중심평가 관리
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              관리자 비밀번호 <span className="text-purple-600 font-normal">(초기 비밀번호: admin1234)</span>
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-purple-200 text-slate-900 font-bold text-sm focus:border-purple-400 focus:outline-hidden"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-base shadow-md transition-colors cursor-pointer"
          >
            {isSubmitting ? '확인 중...' : '대시보드 입장'}
          </button>
        </form>
      </div>
    </div>
  );
};
