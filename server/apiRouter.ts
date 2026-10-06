import express, { Request, Response } from 'express';
import {
  generateStudentAiFeedback,
  generateCurriculumSentences,
  generateEvaluationDraft,
  testGeminiHealth,
} from './geminiService.ts';

export const apiRouter = express.Router();

apiRouter.use(express.json());

// 1. Student AI Feedback
apiRouter.post('/ai/feedback', async (req: Request, res: Response) => {
  try {
    const { studentName, stage, cpm, accuracy, mistakeKeys, incorrectWords } = req.body;
    const feedback = await generateStudentAiFeedback({
      studentName: studentName || '친구',
      stage: Number(stage) || 1,
      cpm: Number(cpm) || 0,
      accuracy: Number(accuracy) || 0,
      mistakeKeys: Array.isArray(mistakeKeys) ? mistakeKeys : [],
      incorrectWords: Array.isArray(incorrectWords) ? incorrectWords : [],
    });
    res.json({ success: true, feedback });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'AI 피드백 생성 실패';
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// 2. Generate Curriculum Practice Sentences
apiRouter.post('/ai/generate-sentences', async (req: Request, res: Response) => {
  try {
    const { topic, stage } = req.body;
    if (!topic) {
      return res.status(400).json({ success: false, error: '주제를 입력해 주세요.' });
    }
    const result = await generateCurriculumSentences(String(topic), Number(stage) || 1);
    res.json({ success: true, data: result });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '문장 생성 실패';
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// 3. Generate Teacher Evaluation Draft
apiRouter.post('/ai/evaluation-draft', async (req: Request, res: Response) => {
  try {
    const { studentName, grade, classNum, studentNumber, highestWpm, highestAccuracy, clearedStage, totalAttempts, mistakeSummary } = req.body;
    const draft = await generateEvaluationDraft({
      studentName: studentName || '학생',
      grade: Number(grade) || 4,
      classNum: Number(classNum) || 1,
      studentNumber: Number(studentNumber) || 1,
      highestWpm: Number(highestWpm) || 0,
      highestAccuracy: Number(highestAccuracy) || 0,
      clearedStage: Number(clearedStage) || 0,
      totalAttempts: Number(totalAttempts) || 0,
      mistakeSummary: mistakeSummary || '',
    });
    res.json({ success: true, draft });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '평가 초안 생성 실패';
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// 4. Gemini Healthcheck Test
apiRouter.all('/ai/test', async (_req: Request, res: Response) => {
  try {
    const health = await testGeminiHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '연결 실패',
      latencyMs: 0,
    });
  }
});
