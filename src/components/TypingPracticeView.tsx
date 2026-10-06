import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Award,
  ChevronRight,
  BookOpen,
  Volume2,
} from 'lucide-react';
import { sound } from '../lib/sound.ts';
import { countKeystrokes, analyzeMistakes } from '../lib/hangul.ts';
import { PracticeStage, PracticeItem } from '../lib/curriculumData.ts';
import { StudentProfile, saveTypingRecord, updateStudentProgress, TypingRecordData } from '../lib/firebase.ts';
import { requestStudentAiFeedback } from '../lib/aiClient.ts';
import { OnscreenKeyboard } from './OnscreenKeyboard.tsx';

interface TypingPracticeViewProps {
  stage: PracticeStage;
  customItems?: PracticeItem[];
  student: StudentProfile;
  onBack: () => void;
  onFinished: (updatedStudent: StudentProfile) => void;
}

export const TypingPracticeView: React.FC<TypingPracticeViewProps> = ({
  stage,
  customItems,
  student,
  onBack,
  onFinished,
}) => {
  const items = customItems || stage.items;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');

  // Sentence timing & keystrokes
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [totalCorrectKeystrokes, setTotalCorrectKeystrokes] = useState(0);

  // Cumulative session mistakes
  const [sessionMistakeKeys, setSessionMistakeKeys] = useState<string[]>([]);
  const [sessionIncorrectWords, setSessionIncorrectWords] = useState<string[]>([]);

  // Real-time metrics
  const [liveCpm, setLiveCpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);

  // Completion modal state
  const [isCompleted, setIsCompleted] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [finalStats, setFinalStats] = useState<{
    cpm: number;
    wpm: number;
    accuracy: number;
    passed: boolean;
    durationSeconds: number;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const currentItem = items[currentIndex];
  const targetText = currentItem?.text || '';

  // Focus input automatically
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex, isCompleted]);

  // Live CPM ticker
  useEffect(() => {
    if (!startTime || isCompleted) return;
    const interval = setInterval(() => {
      const elapsedMinutes = (Date.now() - startTime) / 60000;
      if (elapsedMinutes > 0.01) {
        const currentCpm = Math.round(totalCorrectKeystrokes / elapsedMinutes);
        setLiveCpm(currentCpm);
      }
    }, 400);
    return () => clearInterval(interval);
  }, [startTime, totalCorrectKeystrokes, isCompleted]);

  // Handle typing input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!startTime) {
      setStartTime(Date.now());
    }

    // Play key tap sound
    sound.playKeyTap();
    setInputVal(val);

    // Calculate live keystrokes & accuracy for current sentence
    const currentAnalysis = analyzeMistakes(targetText.slice(0, val.length), val);
    const strokeCount = countKeystrokes(val);
    const correctCount = currentAnalysis.correctKeys;

    if (val.length > 0 && targetText.startsWith(val)) {
      // Good typing
    } else if (val.length > 0 && val[val.length - 1] !== targetText[val.length - 1]) {
      sound.playMistake();
    }

    // Check if sentence complete
    if (val === targetText) {
      finishCurrentSentence(val);
    }
  };

  // Move to next sentence
  const finishCurrentSentence = (finalVal: string) => {
    sound.playSuccessBell();

    const analysis = analyzeMistakes(targetText, finalVal);
    const targetStrokes = countKeystrokes(targetText);

    setTotalKeystrokes((prev) => prev + targetStrokes);
    setTotalCorrectKeystrokes((prev) => prev + analysis.correctKeys);

    if (analysis.mistakeKeys.length > 0) {
      setSessionMistakeKeys((prev) => [...prev, ...analysis.mistakeKeys]);
    }
    if (analysis.incorrectWords.length > 0) {
      setSessionIncorrectWords((prev) => Array.from(new Set([...prev, ...analysis.incorrectWords])));
    }

    setInputVal('');

    if (currentIndex + 1 < items.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // All 10 items completed!
      completeSession(
        totalKeystrokes + targetStrokes,
        totalCorrectKeystrokes + analysis.correctKeys,
        [...sessionMistakeKeys, ...analysis.mistakeKeys],
        Array.from(new Set([...sessionIncorrectWords, ...analysis.incorrectWords]))
      );
    }
  };

  // Handle Enter key for manual submission if length matches
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputVal.trim().length > 0) {
        finishCurrentSentence(inputVal);
      }
    }
  };

  // Complete entire set
  const completeSession = async (
    finalTotalStrokes: number,
    finalCorrectStrokes: number,
    finalMistakeKeys: string[],
    finalIncorrectWords: string[]
  ) => {
    setIsCompleted(true);
    const durationSeconds = startTime ? Math.max(5, Math.round((Date.now() - startTime) / 1000)) : 10;
    const durationMinutes = durationSeconds / 60;

    const cpm = Math.round(finalCorrectStrokes / durationMinutes);
    const wpm = Math.round(cpm / 5);
    const accuracy = finalTotalStrokes > 0 ? Math.min(100, Math.round((finalCorrectStrokes / finalTotalStrokes) * 100)) : 100;

    const isPassed = accuracy >= stage.targetAccuracy && cpm >= stage.targetCpm;

    setFinalStats({
      cpm,
      wpm,
      accuracy,
      passed: isPassed,
      durationSeconds,
    });

    if (isPassed) {
      sound.playClearFanfare();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {}
    }

    // Call server Gemini AI feedback
    setIsAiLoading(true);
    let generatedAiFeedback = '';
    try {
      generatedAiFeedback = await requestStudentAiFeedback({
        studentName: student.studentName,
        stage: stage.stageNumber,
        cpm,
        accuracy,
        mistakeKeys: finalMistakeKeys,
        incorrectWords: finalIncorrectWords,
      });
      setAiFeedback(generatedAiFeedback);
    } catch {
      setAiFeedback(`${student.studentName} 친구, 끝까지 멋지게 완주했어요! 손가락 위치를 확인하며 한 번 더 도전해 볼까요? ✨`);
    } finally {
      setIsAiLoading(false);
    }

    // Save record to Firestore
    const recordId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: TypingRecordData = {
      id: recordId,
      studentKey: student.studentKey,
      studentName: student.studentName,
      stage: stage.stageNumber,
      stageTitle: stage.title,
      mode: 'normal',
      cpm,
      wpm,
      accuracy,
      durationSeconds,
      mistakeCount: finalMistakeKeys.length,
      mistakeKeys: finalMistakeKeys.slice(0, 15),
      incorrectWords: finalIncorrectWords.slice(0, 20),
      passed: isPassed,
      aiFeedback: generatedAiFeedback,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveTypingRecord(record);
      await updateStudentProgress(student.studentKey, {
        wpm: cpm,
        accuracy,
        clearedStage: isPassed ? Math.max(student.clearedStage || 0, stage.stageNumber) : student.clearedStage,
        newIncorrectWords: finalIncorrectWords,
        newMistakeKeys: finalMistakeKeys,
      });
    } catch (err) {
      console.warn('Failed to save typing record to Firestore:', err);
    }
  };

  // Render character by character with accurate coloration
  const renderTextDisplay = () => {
    return (
      <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wide text-slate-800 leading-relaxed font-heading select-none flex flex-wrap items-center justify-center gap-y-2">
        {targetText.split('').map((char, index) => {
          let charStyle = 'text-slate-400';
          const typedChar = inputVal[index];
          const isCurrent = index === inputVal.length;

          if (index < inputVal.length) {
            if (typedChar === char) {
              charStyle = 'text-emerald-600 bg-emerald-50 rounded-sm';
            } else {
              charStyle = 'text-rose-500 bg-rose-100 rounded-sm underline decoration-rose-500 decoration-wavy';
            }
          }

          return (
            <span
              key={index}
              className={`relative px-0.5 transition-colors ${charStyle} ${
                isCurrent ? 'bg-amber-200 text-slate-900 rounded-md ring-2 ring-amber-400 animate-pulse font-black' : ''
              }`}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })}
      </div>
    );
  };

  const nextExpectedChar = targetText[inputVal.length];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between bg-white/90 backdrop-blur-md p-4 rounded-3xl border-2 border-amber-200 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>단계 목록으로</span>
        </button>

        <div className="text-center">
          <span className="text-xs font-extrabold text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
            {stage.title}
          </span>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            {currentIndex + 1} / {items.length} 퀘스트
          </p>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="block text-[10px] font-bold text-slate-400">현재 타수</span>
            <span className="text-base sm:text-lg font-black text-amber-600 font-heading">
              {liveCpm} <span className="text-xs font-semibold">타</span>
            </span>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-right">
            <span className="block text-[10px] font-bold text-slate-400">목표 기준</span>
            <span className="text-xs font-bold text-slate-600">
              {stage.targetCpm}타 / {stage.targetAccuracy}%
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden p-0.5 border border-slate-300">
        <div
          className="bg-gradient-to-r from-amber-400 to-orange-400 h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
        />
      </div>

      {/* Main Typing Display Box */}
      <div className="relative bg-white rounded-3xl p-6 sm:p-10 border-4 border-amber-300 shadow-xl space-y-6 text-center">
        {/* Subject & Meaning Tag */}
        {currentItem?.subject && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-sky-100 text-sky-800 border border-sky-300">
            <span>📚 [{currentItem.subject}]</span>
            {currentItem.meaning && <span className="font-medium text-slate-600">• {currentItem.meaning}</span>}
          </div>
        )}

        {/* Big Target Sentence */}
        <div className="p-4 sm:p-6 bg-amber-50/40 rounded-3xl border-2 border-dashed border-amber-200 min-h-[120px] flex items-center justify-center">
          {renderTextDisplay()}
        </div>

        {/* Typing Input */}
        <div className="max-w-2xl mx-auto relative">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="여기에 위 글자를 그대로 입력하세요..."
            autoFocus
            className="w-full text-center py-4 px-6 rounded-2xl border-4 border-amber-400 bg-white text-slate-900 font-bold text-xl sm:text-2xl shadow-lg focus:border-orange-500 focus:ring-4 focus:ring-amber-200 focus:outline-hidden transition-all"
          />
          <p className="text-xs text-slate-400 mt-2 font-medium">
            💡 글자를 다 치면 자동으로 다음 문장으로 넘어가거나 [Enter]를 누를 수 있어요!
          </p>
        </div>
      </div>

      {/* Onscreen Visual Keyboard with Finger Guide */}
      <OnscreenKeyboard expectedNextChar={nextExpectedChar} />

      {/* RESULT MODAL UPON 10-SET COMPLETION */}
      {isCompleted && finalStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border-4 border-amber-300 p-6 sm:p-8 space-y-6">
            {/* Header Icon & Message */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-100 text-5xl mb-1 border-3 border-amber-300 shadow-inner">
                {finalStats.passed ? '🏆' : '💪'}
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                {finalStats.passed ? '미션 클리어 대성공!' : '정말 수고했어요!'}
              </h3>
              <p className="text-sm font-semibold text-slate-600">
                {finalStats.passed
                  ? `목표 기준(${stage.targetCpm}타, ${stage.targetAccuracy}%)을 멋지게 통과했어요!`
                  : `조금만 더 연습하면 통과할 수 있어요! (목표: ${stage.targetCpm}타 / ${stage.targetAccuracy}%)`}
              </p>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center">
                <span className="block text-[11px] font-bold text-slate-500">평균 타수</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-700 font-heading">
                  {finalStats.cpm}
                </span>
                <span className="text-xs font-semibold text-slate-400 block">타/분</span>
              </div>

              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center">
                <span className="block text-[11px] font-bold text-slate-500">정확도</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-heading">
                  {finalStats.accuracy}%
                </span>
                <span className="text-xs font-semibold text-slate-400 block">정타율</span>
              </div>

              <div className="bg-sky-50 p-4 rounded-2xl border border-sky-200 text-center">
                <span className="block text-[11px] font-bold text-slate-500">소요 시간</span>
                <span className="text-2xl sm:text-3xl font-black text-sky-700 font-heading">
                  {finalStats.durationSeconds}초
                </span>
                <span className="text-xs font-semibold text-slate-400 block">집중 완주</span>
              </div>
            </div>

            {/* Mistake analysis box */}
            {sessionMistakeKeys.length > 0 && (
              <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-200 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-rose-900 mb-1.5">
                  <span>⚠️</span>
                  <span>자주 헷갈렸던 글자/자모:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(new Set(sessionMistakeKeys)).slice(0, 8).map((k, idx) => (
                    <span key={idx} className="bg-white px-2.5 py-1 rounded-lg border border-rose-300 font-bold text-rose-800">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Coach Feedback Box */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-50 via-amber-50 to-pink-50 rounded-2xl border-2 border-purple-200 shadow-sm relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🧚</span>
                <span className="text-xs font-bold text-purple-900 font-heading">
                  타자요정 퐁이의 맞춤형 코칭 피드백 (Gemini AI)
                </span>
              </div>
              {isAiLoading ? (
                <div className="flex items-center gap-2 text-xs text-purple-700 font-medium py-2">
                  <Sparkles className="w-4 h-4 animate-spin text-purple-500" />
                  <span>퐁이가 학생의 타자 패턴을 분석하고 있어요...</span>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                  {aiFeedback}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setInputVal('');
                  setStartTime(null);
                  setTotalKeystrokes(0);
                  setTotalCorrectKeystrokes(0);
                  setSessionMistakeKeys([]);
                  setSessionIncorrectWords([]);
                  setIsCompleted(false);
                }}
                className="flex-1 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>한 번 더 도전하기</span>
              </button>

              <button
                onClick={() => {
                  const updatedStudent: StudentProfile = {
                    ...student,
                    highestWpm: Math.max(student.highestWpm || 0, finalStats.cpm),
                    highestAccuracy: Math.max(student.highestAccuracy || 0, finalStats.accuracy),
                    clearedStage: finalStats.passed ? Math.max(student.clearedStage || 0, stage.stageNumber) : student.clearedStage,
                    incorrectWords: Array.from(new Set([...(student.incorrectWords || []), ...sessionIncorrectWords])),
                  };
                  onFinished(updatedStudent);
                }}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>단계 목록으로 돌아가기</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
