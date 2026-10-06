import React, { useState } from 'react';
import { Database, Sparkles, CheckCircle2, XCircle, RefreshCw, X, ShieldAlert, Cpu } from 'lucide-react';
import { testFirestoreCRUD } from '../lib/firebase.ts';
import { testGeminiConnection } from '../lib/aiClient.ts';

interface SystemDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshParentStatus?: () => void;
}

export const SystemDiagnosticsModal: React.FC<SystemDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  onRefreshParentStatus,
}) => {
  const [firebaseTesting, setFirebaseTesting] = useState(false);
  const [firebaseResult, setFirebaseResult] = useState<{
    tested: boolean;
    success: boolean;
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    message: string;
    details?: string;
  } | null>(null);

  const [geminiTesting, setGeminiTesting] = useState(false);
  const [geminiResult, setGeminiResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    model: string;
    latencyMs: number;
  } | null>(null);

  if (!isOpen) return null;

  const runFirebaseTest = async () => {
    setFirebaseTesting(true);
    setFirebaseResult(null);
    try {
      const res = await testFirestoreCRUD();
      setFirebaseResult({
        tested: true,
        ...res,
      });
      if (onRefreshParentStatus) onRefreshParentStatus();
    } catch (err) {
      setFirebaseResult({
        tested: true,
        success: false,
        create: false,
        read: false,
        update: false,
        delete: false,
        message: '테스트 실행 중 오류가 발생했습니다.',
        details: String(err),
      });
    } finally {
      setFirebaseTesting(false);
    }
  };

  const runGeminiTest = async () => {
    setGeminiTesting(true);
    setGeminiResult(null);
    try {
      const res = await testGeminiConnection();
      setGeminiResult({
        tested: true,
        ...res,
      });
    } catch (err) {
      setGeminiResult({
        tested: true,
        success: false,
        message: String(err),
        model: 'gemini-3.8-flash',
        latencyMs: 0,
      });
    } finally {
      setGeminiTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-4 border-amber-300 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-2xl">
            🛠️
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 font-heading">
              시스템 연동 진단 및 연결 검증
            </h3>
            <p className="text-xs text-slate-500">
              실제 Firebase Firestore CRUD 통신 및 서버 사이드 Gemini AI API 응답을 실시간 검증합니다.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* 1. Firebase Firestore Real CRUD Test */}
          <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <Database className="w-6 h-6 text-amber-500" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    1. Firebase Cloud Firestore 실시간 연동 점검
                  </h4>
                  <p className="text-xs text-slate-500">
                    실제 Firestore 서버에 테스트 문서를 [생성 → 읽기 → 수정 → 삭제]하여 완전성을 검증합니다.
                  </p>
                </div>
              </div>
              <button
                onClick={runFirebaseTest}
                disabled={firebaseTesting}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${firebaseTesting ? 'animate-spin' : ''}`} />
                <span>{firebaseTesting ? '테스트 실행 중...' : 'Firebase CRUD 검증'}</span>
              </button>
            </div>

            {firebaseResult && (
              <div className={`p-4 rounded-xl border text-xs space-y-2.5 ${firebaseResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {firebaseResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                  <span>{firebaseResult.message}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <div className={`p-2 rounded-lg border text-center ${firebaseResult.create ? 'bg-white border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'}`}>
                    <span className="block font-bold">1. 생성 (Create)</span>
                    <span>{firebaseResult.create ? '✅ 성공' : '❌ 실패'}</span>
                  </div>
                  <div className={`p-2 rounded-lg border text-center ${firebaseResult.read ? 'bg-white border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'}`}>
                    <span className="block font-bold">2. 읽기 (Read)</span>
                    <span>{firebaseResult.read ? '✅ 성공' : '❌ 실패'}</span>
                  </div>
                  <div className={`p-2 rounded-lg border text-center ${firebaseResult.update ? 'bg-white border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'}`}>
                    <span className="block font-bold">3. 수정 (Update)</span>
                    <span>{firebaseResult.update ? '✅ 성공' : '❌ 실패'}</span>
                  </div>
                  <div className={`p-2 rounded-lg border text-center ${firebaseResult.delete ? 'bg-white border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'}`}>
                    <span className="block font-bold">4. 삭제 (Delete)</span>
                    <span>{firebaseResult.delete ? '✅ 성공' : '❌ 실패'}</span>
                  </div>
                </div>

                {firebaseResult.details && (
                  <p className="font-mono text-[11px] text-rose-600 bg-white/70 p-2 rounded-lg">
                    {firebaseResult.details}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 2. Gemini API Real Connection Test */}
          <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    2. Gemini AI (gemini-3.8-flash) 서버 API 연동 점검
                  </h4>
                  <p className="text-xs text-slate-500">
                    서버 측 Secret을 통해 Gemini API를 호출하여 안전성과 응답 속도를 점검합니다.
                  </p>
                </div>
              </div>
              <button
                onClick={runGeminiTest}
                disabled={geminiTesting}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${geminiTesting ? 'animate-spin' : ''}`} />
                <span>{geminiTesting ? '호출 중...' : 'Gemini AI 검증'}</span>
              </button>
            </div>

            {geminiResult && (
              <div className={`p-4 rounded-xl border text-xs space-y-2 ${geminiResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {geminiResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                    <span>{geminiResult.success ? 'Gemini 3.8 Flash 정상 통신 성공!' : '통신 실패'}</span>
                  </div>
                  <span className="font-mono font-bold text-[11px] bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    지연시간: {geminiResult.latencyMs}ms
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="block text-[11px] font-bold text-slate-500 mb-1">AI 모델 응답 샘플:</span>
                  <p className="text-xs text-slate-800 font-medium italic">
                    "{geminiResult.message}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
