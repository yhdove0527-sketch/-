import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  Sparkles,
  BarChart3,
  BookOpen,
  KeyRound,
  CheckCircle,
  FileText,
  RotateCcw,
  Search,
  Plus,
  Trash2,
  Edit3,
  Send,
  Database,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Printer,
  Copy,
  Check,
} from 'lucide-react';
import {
  StudentProfile,
  getAllStudents,
  getStudentTypingRecords,
  resetStudentPassword,
  getEvaluations,
  saveEvaluation,
  EvaluationData,
  TypingRecordData,
  saveClassConfig,
} from '../lib/firebase.ts';
import { sha256 } from '../lib/hash.ts';
import {
  requestGenerateSentences,
  requestEvaluationDraft,
  testGeminiConnection,
} from '../lib/aiClient.ts';
import { PracticeItem } from '../lib/curriculumData.ts';

interface TeacherDashboardViewProps {
  onBackToStudentView: () => void;
  onOpenSystemDiagnostics: () => void;
  onDeployCustomSetToClass?: (items: PracticeItem[], title: string) => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  onBackToStudentView,
  onOpenSystemDiagnostics,
  onDeployCustomSetToClass,
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'analytics' | 'evaluations' | 'ai_generator' | 'settings'>('roster');
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected student for detailed analytics
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [studentRecords, setStudentRecords] = useState<TypingRecordData[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Password reset state
  const [resettingKey, setResettingKey] = useState<string | null>(null);
  const [resetSuccessKey, setResetSuccessKey] = useState<string | null>(null);

  // Evaluations state
  const [evaluations, setEvaluations] = useState<Record<string, EvaluationData>>({});
  const [generatingDraftFor, setGeneratingDraftFor] = useState<string | null>(null);
  const [editingDraftStudentKey, setEditingDraftStudentKey] = useState<string | null>(null);
  const [draftEditText, setDraftEditText] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // AI Sentence Generator state
  const [generatorTopic, setGeneratorTopic] = useState('');
  const [generatorStage, setGeneratorStage] = useState(1);
  const [isGeneratingSet, setIsGeneratingSet] = useState(false);
  const [generatedSet, setGeneratedSet] = useState<{
    title: string;
    items: Array<{ id: string; text: string; meaning: string; subject: string }>;
  } | null>(null);

  // Load students & evaluations
  const loadData = async () => {
    setIsLoading(true);
    try {
      const studentList = await getAllStudents();
      setStudents(studentList);
      if (studentList.length > 0 && !selectedStudent) {
        setSelectedStudent(studentList[0]);
      }

      const evalList = await getEvaluations();
      const evalMap: Record<string, EvaluationData> = {};
      evalList.forEach((e) => {
        evalMap[e.studentKey] = e;
      });
      setEvaluations(evalMap);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch student typing history when selected student changes
  useEffect(() => {
    if (!selectedStudent) return;
    const fetchRecords = async () => {
      setRecordsLoading(true);
      try {
        const records = await getStudentTypingRecords(selectedStudent.studentKey);
        setStudentRecords(records);
      } catch (err) {
        console.error('Error fetching student records:', err);
      } finally {
        setRecordsLoading(false);
      }
    };
    fetchRecords();
  }, [selectedStudent]);

  // Handle password reset to '1234'
  const handleResetPassword = async (studentKey: string) => {
    setResettingKey(studentKey);
    try {
      const defaultHash = await sha256('1234');
      await resetStudentPassword(studentKey, defaultHash);
      setResetSuccessKey(studentKey);
      setTimeout(() => setResetSuccessKey(null), 3000);
    } catch (err) {
      alert('비밀번호 초기화 실패: ' + err);
    } finally {
      setResettingKey(null);
    }
  };

  // AI Evaluation Draft Generation
  const handleGenerateAiDraft = async (stu: StudentProfile) => {
    setGeneratingDraftFor(stu.studentKey);
    try {
      const mistakeKeysStr = Object.keys(stu.mistakeKeys || {}).slice(0, 5).join(', ');
      const draft = await requestEvaluationDraft({
        studentName: stu.studentName,
        grade: stu.grade,
        classNum: stu.classNum,
        studentNumber: stu.studentNumber,
        highestWpm: stu.highestWpm || 0,
        highestAccuracy: stu.highestAccuracy || 0,
        clearedStage: stu.clearedStage || 0,
        totalAttempts: stu.totalAttempts || 0,
        mistakeSummary: mistakeKeysStr,
      });

      const newEval: EvaluationData = {
        studentKey: stu.studentKey,
        studentName: stu.studentName,
        grade: stu.grade,
        classNum: stu.classNum,
        studentNumber: stu.studentNumber,
        aiDraft: draft,
        approvedContent: draft, // default approved to draft content
        teacherNotes: '',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveEvaluation(newEval);
      setEvaluations((prev) => ({ ...prev, [stu.studentKey]: newEval }));
    } catch (err) {
      alert('AI 평가 초안 생성 중 오류가 발생했습니다.');
    } finally {
      setGeneratingDraftFor(null);
    }
  };

  // Approve Evaluation
  const handleApproveEvaluation = async (stuKey: string) => {
    const current = evaluations[stuKey];
    if (!current) return;

    const updated: EvaluationData = {
      ...current,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveEvaluation(updated);
      setEvaluations((prev) => ({ ...prev, [stuKey]: updated }));
    } catch (err) {
      alert('승인 저장 실패: ' + err);
    }
  };

  // Save manual edit of evaluation text
  const handleSaveDraftEdit = async (stuKey: string) => {
    const current = evaluations[stuKey];
    if (!current) return;

    const updated: EvaluationData = {
      ...current,
      approvedContent: draftEditText,
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveEvaluation(updated);
      setEvaluations((prev) => ({ ...prev, [stuKey]: updated }));
      setEditingDraftStudentKey(null);
    } catch (err) {
      alert('수정 저장 실패: ' + err);
    }
  };

  // Copy evaluation text
  const handleCopyEvaluation = (stuKey: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(stuKey);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate curriculum sentences with AI
  const handleGenerateSentenceSet = async () => {
    if (!generatorTopic.trim()) {
      alert('생성할 주제를 입력해 주세요! (예: 4학년 사회 지역 문화유산)');
      return;
    }
    setIsGeneratingSet(true);
    setGeneratedSet(null);
    try {
      const result = await requestGenerateSentences(generatorTopic.trim(), generatorStage);
      setGeneratedSet(result);
    } catch (err) {
      alert('문장 생성 실패: ' + err);
    } finally {
      setIsGeneratingSet(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(s.studentNumber).includes(searchTerm) ||
      s.studentKey.includes(searchTerm)
  );

  // Aggregate stats
  const totalStudents = students.length;
  const avgCpm = totalStudents > 0 ? Math.round(students.reduce((acc, s) => acc + (s.highestWpm || 0), 0) / totalStudents) : 0;
  const avgAcc = totalStudents > 0 ? Math.round(students.reduce((acc, s) => acc + (s.highestAccuracy || 0), 0) / totalStudents) : 0;
  const clearedAllCount = students.filter((s) => (s.clearedStage || 0) >= 3).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Overview Cards */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-purple-700/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-purple-600/80 text-purple-200 text-xs font-bold px-3 py-1 rounded-full border border-purple-400">
                초등 4학년 학급 관리 & 과정중심평가
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
              교사용 종합 관제 대시보드 👩‍🏫
            </h2>
            <p className="text-xs sm:text-sm text-purple-200 mt-1">
              학생별 타자 성장도 관찰, 취약 자모 오타 분석, AI 평가 초안 생성 및 교과 문장 출제
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSystemDiagnostics}
              className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 border border-purple-400 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>연동 점검 (CRUD & AI)</span>
            </button>
            <button
              onClick={onBackToStudentView}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs transition-colors shadow-sm"
            >
              학생 화면으로
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-6">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-purple-500/40">
            <span className="block text-[11px] text-purple-200 font-semibold">등록된 학생</span>
            <span className="text-2xl sm:text-3xl font-black font-heading mt-1 block">
              {totalStudents} <span className="text-xs font-normal text-purple-300">명</span>
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-purple-500/40">
            <span className="block text-[11px] text-purple-200 font-semibold">학급 평균 타수</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-300 font-heading mt-1 block">
              {avgCpm} <span className="text-xs font-normal text-purple-300">타/분</span>
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-purple-500/40">
            <span className="block text-[11px] text-purple-200 font-semibold">학급 평균 정확도</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-300 font-heading mt-1 block">
              {avgAcc} <span className="text-xs font-normal text-purple-300">%</span>
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-purple-500/40">
            <span className="block text-[11px] text-purple-200 font-semibold">3단계 전과정 완주</span>
            <span className="text-2xl sm:text-3xl font-black text-pink-300 font-heading mt-1 block">
              {clearedAllCount} <span className="text-xs font-normal text-purple-300">명</span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>학급 성취도 한눈에 보기</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>상세 오타 분석 & 성장 그래프</span>
        </button>

        <button
          onClick={() => setActiveTab('evaluations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'evaluations'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>과정중심평가 승인함 (AI 생성)</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_generator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'ai_generator'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>AI 맞춤 연습 문장 출제기</span>
        </button>
      </div>

      {/* TAB 1: Roster & Achievement Table */}
      {activeTab === 'roster' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-heading">
                학급 학생 연습 현황표
              </h3>
              <p className="text-xs text-slate-500">
                학생들의 최고 타수, 정확도, 도달 단계 및 비밀번호 초기화 관리
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="학생 이름 / 번호 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-purple-400 w-48 sm:w-60"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <button
                onClick={loadData}
                title="새로고침"
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-500 text-xs uppercase font-extrabold">
                  <th className="py-3 px-3">번호</th>
                  <th className="py-3 px-3">이름</th>
                  <th className="py-3 px-3">최고 타수</th>
                  <th className="py-3 px-3">최고 정확도</th>
                  <th className="py-3 px-3">클리어 단계</th>
                  <th className="py-3 px-3">총 시도</th>
                  <th className="py-3 px-3">오답 단어</th>
                  <th className="py-3 px-3 text-center">비밀번호 관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      {isLoading ? '학생 목록을 불러오는 중...' : '등록된 학생이 없거나 검색 결과가 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((stu) => (
                    <tr key={stu.studentKey} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-600">
                        {stu.studentNumber}번
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {stu.studentName}
                      </td>
                      <td className="py-3 px-3 font-black text-amber-600">
                        {stu.highestWpm || 0}타
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-600">
                        {stu.highestAccuracy || 0}%
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          {'⭐'.repeat(Math.min(3, stu.clearedStage || 0)) || '새싹'} ({stu.clearedStage || 0}단계)
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-semibold">
                        {stu.totalAttempts || 0}회
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200">
                          {(stu.incorrectWords || []).length}개
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleResetPassword(stu.studentKey)}
                          disabled={resettingKey === stu.studentKey}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-slate-600 hover:text-rose-600 font-bold text-xs transition-colors flex items-center justify-center gap-1 mx-auto"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>
                            {resetSuccessKey === stu.studentKey
                              ? '1234로 초기화됨!'
                              : resettingKey === stu.studentKey
                              ? '초기화 중...'
                              : '초기화(1234)'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Detailed Analytics & Growth Graph */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Student Selector */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-slate-900 font-heading">
              학생 선택
            </h4>
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {students.map((s) => (
                <button
                  key={s.studentKey}
                  onClick={() => setSelectedStudent(s)}
                  className={`w-full text-left p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between ${
                    selectedStudent?.studentKey === s.studentKey
                      ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-2xs'
                      : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{s.studentNumber}번 {s.studentName}</span>
                  <span className="text-amber-600 font-black">{s.highestWpm}타</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Detailed Stats */}
          {selectedStudent ? (
            <div className="lg:col-span-2 space-y-6">
              {/* Selected Student Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 font-heading">
                      {selectedStudent.studentName} 학생 타자 분석 리포트
                    </h3>
                    <p className="text-xs text-slate-500">
                      고유번호: {selectedStudent.studentKey} • 총 {selectedStudent.totalAttempts || 0}회 시도
                    </p>
                  </div>
                </div>

                {/* Growth Trend Visualizer */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span>최근 연습 타수(CPM) 변화 추이 그래프</span>
                  </h4>
                  {studentRecords.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                      아직 저장된 상세 연습 기록이 없습니다.
                    </p>
                  ) : (
                    <div className="h-32 flex items-end gap-2 pt-4 px-2">
                      {studentRecords.slice(0, 10).reverse().map((r, idx) => {
                        const heightPct = Math.min(100, Math.max(15, Math.round((r.cpm / 250) * 100)));
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                            <span className="text-[10px] font-bold text-amber-600">{r.cpm}</span>
                            <div
                              className="w-full bg-gradient-to-t from-purple-600 to-amber-400 rounded-t-lg transition-all"
                              style={{ height: `${heightPct}%` }}
                              title={`${r.stageTitle || r.stage + '단계'}: ${r.cpm}타 / ${r.accuracy}%`}
                            />
                            <span className="text-[9px] text-slate-400">{idx + 1}회</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Mistakes and Jamo Analysis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                    <h5 className="text-xs font-bold text-amber-900 mb-2">
                      자주 헷갈리는 자음·모음
                    </h5>
                    {Object.keys(selectedStudent.mistakeKeys || {}).length === 0 ? (
                      <p className="text-xs text-slate-400">오타 자모 데이터 없음</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(selectedStudent.mistakeKeys || {})
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 8)
                          .map(([key, count]) => (
                            <span key={key} className="px-2.5 py-1 bg-white rounded-lg border border-amber-300 text-xs font-bold text-slate-800">
                              {key}: <span className="text-amber-600">{count}회</span>
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
                    <h5 className="text-xs font-bold text-rose-900 mb-2">
                      수집된 오답 단어 목록 ({selectedStudent.incorrectWords?.length || 0}개)
                    </h5>
                    {(!selectedStudent.incorrectWords || selectedStudent.incorrectWords.length === 0) ? (
                      <p className="text-xs text-slate-400">오답 단어가 없습니다.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {selectedStudent.incorrectWords.slice(0, 15).map((w, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white rounded-md border border-rose-200 text-xs font-bold text-slate-700">
                            {w}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 text-center py-20 bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
              학생을 선택해 주세요.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Process-based Evaluation Approval Desk (과정중심평가 승인함) */}
      {activeTab === 'evaluations' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-900 font-heading">
                과정중심평가 승인함 (AI 생기부 초안) 📝
              </h3>
              <p className="text-xs text-slate-500">
                AI가 누적 타수, 정확도, 오타 경향, 끈기를 종합 분석하여 생성한 초안을 검토·수정하고 최종 승인합니다.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {students.map((stu) => {
              const evalData = evaluations[stu.studentKey];
              const isApproved = evalData?.status === 'approved';
              const isGenerating = generatingDraftFor === stu.studentKey;
              const isEditing = editingDraftStudentKey === stu.studentKey;

              return (
                <div
                  key={stu.studentKey}
                  className={`p-5 rounded-3xl border-2 transition-all ${
                    isApproved
                      ? 'bg-emerald-50/50 border-emerald-300'
                      : evalData
                      ? 'bg-amber-50/50 border-amber-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-white border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700">
                        {stu.studentNumber}
                      </span>
                      <div>
                        <h4 className="text-base font-bold text-slate-900">
                          {stu.studentName} 학생
                        </h4>
                        <p className="text-xs text-slate-500">
                          최고 {stu.highestWpm || 0}타 • 정확도 {stu.highestAccuracy || 0}% • 총 {stu.totalAttempts || 0}회 시도
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isApproved ? (
                        <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-300">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          교사 최종 승인 완료
                        </span>
                      ) : evalData ? (
                        <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full border border-amber-300">
                          초안 검토 중
                        </span>
                      ) : (
                        <span className="bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
                          초안 미생성
                        </span>
                      )}

                      {!evalData ? (
                        <button
                          onClick={() => handleGenerateAiDraft(stu)}
                          disabled={isGenerating}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{isGenerating ? 'AI 생성 중...' : 'AI 초안 생성'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleGenerateAiDraft(stu)}
                          disabled={isGenerating}
                          title="새로 재생성"
                          className="p-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Evaluation Text Display or Editor */}
                  {evalData && (
                    <div className="mt-3 space-y-3">
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={draftEditText}
                            onChange={(e) => setDraftEditText(e.target.value)}
                            rows={4}
                            className="w-full p-3 rounded-2xl border-2 border-purple-300 text-xs font-medium text-slate-800 focus:outline-hidden"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingDraftStudentKey(null)}
                              className="px-3 py-1.5 rounded-xl bg-slate-200 text-xs font-bold text-slate-700"
                            >
                              취소
                            </button>
                            <button
                              onClick={() => handleSaveDraftEdit(stu.studentKey)}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
                            >
                              수정 내용 저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 text-xs leading-relaxed text-slate-800 font-medium">
                          {evalData.approvedContent || evalData.aiDraft}
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => {
                            setEditingDraftStudentKey(stu.studentKey);
                            setDraftEditText(evalData.approvedContent || evalData.aiDraft);
                          }}
                          className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>문구 직접 수정하기</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyEvaluation(stu.studentKey, evalData.approvedContent || evalData.aiDraft)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                          >
                            {copiedKey === stu.studentKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === stu.studentKey ? '복사됨!' : '평가문 복사'}</span>
                          </button>

                          {!isApproved && (
                            <button
                              onClick={() => handleApproveEvaluation(stu.studentKey)}
                              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold flex items-center gap-1 shadow-xs"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>최종 승인하기</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: AI Custom Sentence Generator (AI 맞춤 연습 문장 출제기) */}
      {activeTab === 'ai_generator' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-900 font-heading">
                AI 맞춤 연습 문장 출제기 (Gemini 3.8 Flash) ✨
              </h3>
              <p className="text-xs text-slate-500">
                선생님이 원하는 학습 주제를 입력하면 4학년 수준에 꼭 맞는 10개 연습 텍스트를 즉시 생성합니다.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  학습 주제 입력 (교과 단원명, 핵심 키워드)
                </label>
                <input
                  type="text"
                  placeholder="예: 4학년 2학기 화산과 지진, 우리 고장의 문화유산, 사이버 예절"
                  value={generatorTopic}
                  onChange={(e) => setGeneratorTopic(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-amber-300 text-xs sm:text-sm font-semibold bg-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  연습 난이도 단계
                </label>
                <select
                  value={generatorStage}
                  onChange={(e) => setGeneratorStage(Number(e.target.value))}
                  className="w-full px-3 py-3 rounded-xl border border-amber-300 text-xs sm:text-sm font-semibold bg-white focus:outline-hidden"
                >
                  <option value={1}>1단계: 낱말/단어 (10개)</option>
                  <option value={2}>2단계: 짧은 글/속담 (10개)</option>
                  <option value={3}>3단계: 온전한 교과 문장 (10개)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateSentenceSet}
              disabled={isGeneratingSet}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGeneratingSet ? 'AI가 4학년 맞춤 연습 문장 생성 중...' : '맞춤 연습 문장 세트 생성하기'}</span>
            </button>
          </div>

          {/* Generated Result Preview */}
          {generatedSet && (
            <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-900 font-heading">
                  생성 결과: {generatedSet.title}
                </h4>
                {onDeployCustomSetToClass && (
                  <button
                    onClick={() => {
                      onDeployCustomSetToClass(generatedSet.items as any, generatedSet.title);
                      alert('학급 맞춤 연습 코스로 성공적으로 배포되었습니다!');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>학급에 배포하기</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {generatedSet.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">{idx + 1}. {item.text}</span>
                      <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded-md">
                        {item.subject}
                      </span>
                    </div>
                    {item.meaning && <p className="text-[11px] text-slate-500">{item.meaning}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
