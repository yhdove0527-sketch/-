import { GoogleGenAI } from '@google/genai';

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * 1. 학생용 맞춤형 AI 교정 피드백 생성 (귀여운 마스코트 '퐁이' 어조)
 */
export async function generateStudentAiFeedback(params: {
  studentName: string;
  stage: number;
  cpm: number;
  accuracy: number;
  mistakeKeys: string[];
  incorrectWords: string[];
}): Promise<string> {
  const ai = getAiClient();
  const { studentName, stage, cpm, accuracy, mistakeKeys, incorrectWords } = params;

  const prompt = `당신은 초등학교 4학년 타자 연습 웹앱의 친절하고 귀여운 캐릭터 코치 '타자요정 퐁이'입니다.
학생 정보:
- 학생 이름: ${studentName || '친구'}
- 연습 단계: ${stage}단계
- 현재 타수: ${cpm}타/분 (CPM)
- 정확도: ${accuracy}%
- 자주 틀린 글자/자모: ${mistakeKeys.length > 0 ? mistakeKeys.slice(0, 5).join(', ') : '없음 (아주 잘 침)'}
- 틀린 낱말: ${incorrectWords.length > 0 ? incorrectWords.slice(0, 5).join(', ') : '없음'}

지침:
1. 초등학교 4학년 눈높이에 맞게 다정하고 칭찬 가득한 말투("~해요!", "~해봐요!", "최고야!")로 작성하세요.
2. 만약 틀린 자음/모음/받침(예: 'ㄹ 받침', 'ㅐ/ㅔ 모음', '쌍자음' 등)이 있다면, 구체적인 손가락 위치나 치는 꿀팁을 1문장으로 친절하게 알려주세요.
3. 2~3문장 이내(최대 120자)로 읽기 쉽게 작성하세요. 귀여운 이모지(✨, 👏, 💡 등)를 1~2개 포함하세요.
4. 순수 텍스트만 출력하세요.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });
    return response.text?.trim() || `${studentName} 친구, 정말 멋진 도전이었어요! 조금만 더 손가락에 힘을 빼고 리듬을 타면 타수가 쑥쑥 올라갈 거예요! ✨`;
  } catch (error) {
    console.error('Gemini Feedback Generation Error:', error);
    return `${studentName} 친구, 꾸준히 연습하는 모습이 정말 멋져요! 다음엔 손가락 위치를 한 번 더 신경 써서 도전해봐요! 👏`;
  }
}

/**
 * 2. 4학년 맞춤형 연습 단어/문장 세트 자동 생성 (주제별)
 */
export async function generateCurriculumSentences(topic: string, stage: number): Promise<{
  title: string;
  items: Array<{ id: string; text: string; meaning: string; subject: string }>;
}> {
  const ai = getAiClient();
  const stageName = stage === 1 ? '핵심 낱말(단어 10개)' : stage === 2 ? '짧은 글/속담/관용구(10개)' : '교과서 온전한 문장(10개)';

  const prompt = `초등학교 4학년 수준에 적합한 한글 타자 연습 콘텐츠 세트를 JSON 형식으로 생성해 주세요.
주제: "${topic}"
단계: ${stage}단계 (${stageName})

요구사항:
1. 반드시 초등학교 4학년(11세) 교과 과정(국어, 사회, 과학, 도덕 등) 또는 일상생활 및 교양에 맞는 10개의 연습 항목을 작성하세요.
2. 1단계는 2~4글자의 핵심 단어/낱말 10개.
   2단계는 8~18글자 내외의 의미 있는 짧은 문장이나 속담, 관용구 10개.
   3단계는 20~35글자 내외의 4학년 교과서 길잡이 문장 10개.
3. 각 항목마다 뜻(meaning)과 관련 교과목(subject: 국어, 사회, 과학, 도덕 중 하나)을 포함하세요.
4. 반드시 유효한 JSON 형식으로만 응답하세요:
{
  "title": "세트 제목 (예: 4학년 탐구: ${topic})",
  "items": [
    { "id": "1", "text": "연습할 텍스트", "meaning": "간단한 설명", "subject": "과학" }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
      return {
        title: parsed.title || `${topic} 연습 세트`,
        items: parsed.items.slice(0, 10).map((it: any, idx: number) => ({
          id: `custom-${idx + 1}`,
          text: String(it.text || '').trim(),
          meaning: String(it.meaning || '').trim(),
          subject: it.subject || '국어',
        })),
      };
    }
  } catch (err) {
    console.error('Gemini Sentence Generation Error:', err);
  }

  // Fallback if needed
  return {
    title: `${topic} 4학년 연습 세트`,
    items: [
      { id: 'custom-1', text: `${topic}을 바르게 배우고 익힙니다.`, meaning: `${topic} 관련 기본 문장`, subject: '국어' },
      { id: 'custom-2', text: `우리는 친구와 함께 즐겁게 공부합니다.`, meaning: `협동과 배려의 태도`, subject: '도덕' },
    ],
  };
}

/**
 * 3. 교사용 과정중심평가 AI 평가 초안(Draft) 자동 생성
 */
export async function generateEvaluationDraft(studentData: {
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
  const ai = getAiClient();
  const { studentName, grade, classNum, studentNumber, highestWpm, highestAccuracy, clearedStage, totalAttempts, mistakeSummary } = studentData;

  const prompt = `당신은 대한민국 초등학교 교육과정 및 '과정중심평가' 전문가 교사입니다.
다음 학생의 한글 타자 연습 누적 성취 데이터를 바탕으로 학교생활기록부(교과학습발달상황) 또는 정보통신활용 타자능력 과정중심평가에 기재할 전문적이고 교육적인 서술형 평가 문안 초안을 작성해 주세요.

학생 인적사항 및 연습 기록:
- 학생: ${grade}학년 ${classNum}반 ${studentNumber}번 ${studentName}
- 최고 타수(CPM): ${highestWpm}타/분
- 최고 정확도: ${highestAccuracy}%
- 클리어한 단계: ${clearedStage}단계 (1: 낱말 완주, 2: 짧은 글 완주, 3: 교과 문장 완주)
- 총 연습 시도 횟수: ${totalAttempts}회
- 주요 오타 경향 및 보완점: ${mistakeSummary || '전반적으로 높은 정확도 유지'}

작성 지침:
1. 어조: '~함.', '~보임.', '~발전함.' 식의 정중하고 객관적인 학교생활기록부 관찰 서술어 사용.
2. 내용 구성:
   - 바른 자세와 손가락 운지법 습득 태도
   - 타수와 정확도 성장 과정 (노력 및 성취도)
   - 4학년 교과 어휘 및 문장 타자 입력에 대한 자신감과 디지털 문해력 태도
3. 길이는 3~4문장 내외 (약 180~250자)로 작성하여 교사가 바로 활용하거나 수정하기 좋게 작성하세요.
4. 순수 평가 문장만 출력하세요 (제목이나 머리말 제외).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });
    return response.text?.trim() || `${studentName} 학생은 꾸준한 반복 연습을 통해 기본 자리 운지법을 안정적으로 익히고 있으며, 교과 낱말과 문장을 바른 맞춤법으로 입력하는 능력이 꾸준히 향상되고 있음. 어려운 어휘나 받침에서도 포기하지 않고 집중하여 스스로 오타를 교정하려는 자기주도적 학습 태도가 돋보임.`;
  } catch (error) {
    console.error('Gemini Evaluation Draft Error:', error);
    return `${studentName} 학생은 올바른 손가락 자세로 차분하게 타자 연습에 참여하며 꾸준한 향상을 보임. 다양한 교과 문장을 입력하며 정확도를 높이고자 노력하는 끈기 있는 태도를 지님.`;
  }
}

/**
 * 4. Gemini API 연결 테스트용 헬스체크
 */
export async function testGeminiHealth(): Promise<{ success: boolean; message: string; model: string; latencyMs: number }> {
  const startTime = Date.now();
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: '초등 4학년 학생들을 위한 1문장 응원 메시지를 한글로 작성해줘.',
    });
    const latencyMs = Date.now() - startTime;
    return {
      success: true,
      message: response.text?.trim() || '연결 성공',
      model: 'gemini-3.8-flash',
      latencyMs,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
      model: 'gemini-3.8-flash',
      latencyMs,
    };
  }
}
