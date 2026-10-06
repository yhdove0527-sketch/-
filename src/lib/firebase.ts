import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID (CRITICAL)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Firestore error handler conforming to skill guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface StudentProfile {
  studentKey: string;
  schoolYear: string;
  grade: number;
  classNum: number;
  studentNumber: number;
  studentName: string;
  passwordHash: string;
  highestWpm: number;
  highestAccuracy: number;
  clearedStage: number; // 0: None, 1: Stage 1 cleared, 2: Stage 2 cleared, 3: Stage 3 cleared
  totalAttempts: number;
  incorrectWords: string[];
  mistakeKeys: Record<string, number>;
  lastPracticedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TypingRecordData {
  id: string;
  studentKey: string;
  studentName: string;
  stage: number;
  stageTitle: string;
  mode: string;
  cpm: number;
  wpm: number;
  accuracy: number;
  durationSeconds: number;
  mistakeCount: number;
  mistakeKeys: string[];
  incorrectWords: string[];
  passed: boolean;
  aiFeedback?: string;
  createdAt: string;
}

export interface EvaluationData {
  studentKey: string;
  studentName: string;
  grade: number;
  classNum: number;
  studentNumber: number;
  aiDraft: string;
  approvedContent: string;
  teacherNotes: string;
  status: 'draft' | 'approved';
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Real Firestore CRUD verification testing Create -> Read -> Update -> Delete
 */
export async function testFirestoreCRUD(): Promise<{
  success: boolean;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  message: string;
  details?: string;
}> {
  const testId = `healthcheck_${Date.now()}`;
  const testDocRef = doc(db, 'test', testId);
  const result = {
    success: false,
    create: false,
    read: false,
    update: false,
    delete: false,
    message: '',
    details: '',
  };

  try {
    // 1. Create
    await setDoc(testDocRef, {
      testId,
      message: 'Firestore 연결 점검 테스트',
      timestamp: new Date().toISOString(),
    });
    result.create = true;

    // 2. Read from server (not cache)
    const snapshot = await getDocFromServer(testDocRef);
    if (!snapshot.exists() || snapshot.data()?.testId !== testId) {
      throw new Error('문서를 서버에서 정상적으로 읽어오지 못했습니다.');
    }
    result.read = true;

    // 3. Update
    await updateDoc(testDocRef, {
      message: 'Firestore 수정 검증 완료',
      verifiedAt: new Date().toISOString(),
    });
    result.update = true;

    // 4. Delete
    await deleteDoc(testDocRef);
    result.delete = true;

    result.success = true;
    result.message = 'Firestore 실제 CRUD(생성·읽기·수정·삭제) 통신이 성공적으로 검증되었습니다!';
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.success = false;
    result.message = 'Firestore 연결 테스트 중 문제가 발생했습니다.';
    result.details = errorMsg;
    console.error('Firestore CRUD test failed:', error);
    return result;
  }
}

/**
 * Fetch or initialize class configuration
 */
export async function getClassConfig(classId: string) {
  const path = `classes/${classId}`;
  try {
    const snap = await getDoc(doc(db, 'classes', classId));
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function saveClassConfig(classId: string, data: any) {
  const path = `classes/${classId}`;
  try {
    await setDoc(doc(db, 'classes', classId), {
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Fetch student profile
 */
export async function getStudentProfile(studentKey: string): Promise<StudentProfile | null> {
  const path = `students/${studentKey}`;
  try {
    const snap = await getDoc(doc(db, 'students', studentKey));
    if (snap.exists()) {
      return snap.data() as StudentProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

/**
 * Save new student profile
 */
export async function saveStudentProfile(student: StudentProfile): Promise<void> {
  const path = `students/${student.studentKey}`;
  try {
    await setDoc(doc(db, 'students', student.studentKey), {
      ...student,
      createdAt: student.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

/**
 * Update student typing progress and incorrect words
 */
export async function updateStudentProgress(
  studentKey: string,
  updates: {
    wpm?: number;
    accuracy?: number;
    clearedStage?: number;
    newIncorrectWords?: string[];
    newMistakeKeys?: string[];
  }
): Promise<void> {
  const path = `students/${studentKey}`;
  try {
    const snap = await getDoc(doc(db, 'students', studentKey));
    if (!snap.exists()) return;
    const current = snap.data() as StudentProfile;

    const highestWpm = Math.max(current.highestWpm || 0, updates.wpm || 0);
    const highestAccuracy = Math.max(current.highestAccuracy || 0, updates.accuracy || 0);
    const clearedStage = Math.max(current.clearedStage || 0, updates.clearedStage || 0);
    const totalAttempts = (current.totalAttempts || 0) + 1;

    // Merge incorrect words (max 50 unique)
    const existingWords = current.incorrectWords || [];
    const combinedWords = Array.from(new Set([...existingWords, ...(updates.newIncorrectWords || [])])).slice(-50);

    // Merge mistake keys count
    const mistakeKeys = { ...(current.mistakeKeys || {}) };
    (updates.newMistakeKeys || []).forEach((key) => {
      mistakeKeys[key] = (mistakeKeys[key] || 0) + 1;
    });

    await updateDoc(doc(db, 'students', studentKey), {
      highestWpm,
      highestAccuracy,
      clearedStage,
      totalAttempts,
      incorrectWords: combinedWords,
      mistakeKeys,
      lastPracticedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Save individual typing exercise record
 */
export async function saveTypingRecord(record: TypingRecordData): Promise<void> {
  const path = `typingRecords/${record.id}`;
  try {
    await setDoc(doc(db, 'typingRecords', record.id), record);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

/**
 * Get all students for teacher dashboard
 */
export async function getAllStudents(): Promise<StudentProfile[]> {
  const path = 'students';
  try {
    const snap = await getDocs(collection(db, 'students'));
    const list: StudentProfile[] = [];
    snap.forEach((d) => {
      list.push(d.data() as StudentProfile);
    });
    return list.sort((a, b) => a.studentNumber - b.studentNumber);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

/**
 * Get typing records for a student
 */
export async function getStudentTypingRecords(studentKey: string): Promise<TypingRecordData[]> {
  const path = 'typingRecords';
  try {
    const q = query(
      collection(db, 'typingRecords'),
      where('studentKey', '==', studentKey),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    const list: TypingRecordData[] = [];
    snap.forEach((d) => list.push(d.data() as TypingRecordData));
    return list;
  } catch {
    // Fallback without composite index if necessary
    try {
      const qFallback = query(
        collection(db, 'typingRecords'),
        where('studentKey', '==', studentKey),
        limit(30)
      );
      const snapFallback = await getDocs(qFallback);
      const listFallback: TypingRecordData[] = [];
      snapFallback.forEach((d) => listFallback.push(d.data() as TypingRecordData));
      return listFallback.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }
}

/**
 * Reset student password by teacher
 */
export async function resetStudentPassword(studentKey: string, newPasswordHash: string): Promise<void> {
  const path = `students/${studentKey}`;
  try {
    await updateDoc(doc(db, 'students', studentKey), {
      passwordHash: newPasswordHash,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Get or save evaluations
 */
export async function getEvaluations(): Promise<EvaluationData[]> {
  const path = 'evaluations';
  try {
    const snap = await getDocs(collection(db, 'evaluations'));
    const list: EvaluationData[] = [];
    snap.forEach((d) => list.push(d.data() as EvaluationData));
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function saveEvaluation(evaluation: EvaluationData): Promise<void> {
  const path = `evaluations/${evaluation.studentKey}`;
  try {
    await setDoc(doc(db, 'evaluations', evaluation.studentKey), {
      ...evaluation,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
