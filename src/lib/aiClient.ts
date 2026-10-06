/**
 * Client-side AI service consumer.
 * Strictly decoupled from server-side SDK and secrets.
 */

export interface StudentFeedbackPayload {
  studentName: string;
  stage: number;
  cpm: number;
  accuracy: number;
  mistakeKeys: string[];
  incorrectWords: string[];
}

export async function requestStudentAiFeedback(payload: StudentFeedbackPayload): Promise<string> {
  try {
    const res = await fetch('/api/ai/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('서버 응답 오류');
    const data = await res.json();
    if (data.success && data.feedback) {
      return data.feedback;
    }
    throw new Error(data.error || '피드백 생성 실패');
  } catch (error) {
    console.warn('AI feedback fetch failed, fallback used:', error);
    return `${payload.studentName} 친구, 끝까지 도전한 모습이 정말 훌륭해요! 자주 틀리는 글자를 손가락 위치를 확인하며 한 번 더 연습해 볼까요? ✨`;
  }
}

export async function requestGenerateSentences(topic: string, stage: number): Promise<{
  title: string;
  items: Array<{ id: string; text: string; meaning: string; subject: string }>;
}> {
  try {
    const res = await fetch('/api/ai/generate-sentences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, stage }),
    });
    if (!res.ok) throw new Error('서버 응답 오류');
    const data = await res.json();
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error(data.error || '문장 생성 실패');
  } catch (error) {
    console.error('Failed to generate sentences with AI:', error);
    throw error;
  }
}

export async function requestEvaluationDraft(payload: {
  studentName: string;
  grade: number;
  classNum: number;
  studentNumber: number;
  highestWpm: number;
  highestAccuracy: number;
  clearedStage: number;
  totalAttempts: number;
  mistakeSummary: string;
}): Promise<string> {
  try {
    const res = await fetch('/api/ai/evaluation-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('서버 응답 오류');
    const data = await res.json();
    if (data.success && data.draft) {
      return data.draft;
    }
    throw new Error(data.error || '초안 생성 실패');
  } catch (error) {
    console.error('Failed to generate evaluation draft:', error);
    throw error;
  }
}

export async function testGeminiConnection(): Promise<{
  success: boolean;
  message: string;
  model: string;
  latencyMs: number;
}> {
  try {
    const res = await fetch('/api/ai/test');
    const data = await res.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '네트워크 통신 실패',
      model: 'gemini-3.8-flash',
      latencyMs: 0,
    };
  }
}
