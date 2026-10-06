/**
 * Hangul Jamo Decomposition and Keystroke Analysis Utility
 */

export const CHOSUNG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

export const JUNGSUNG = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];

export const JONGSUNG = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// Complex vowels keystroke breakdown
export const JUNGSUNG_KEYS: Record<string, string[]> = {
  'ㅘ': ['ㅗ', 'ㅏ'],
  'ㅙ': ['ㅗ', 'ㅐ'],
  'ㅚ': ['ㅗ', 'ㅣ'],
  'ㅝ': ['ㅜ', 'ㅓ'],
  'ㅞ': ['ㅜ', 'ㅔ'],
  'ㅟ': ['ㅜ', 'ㅣ'],
  'ㅢ': ['ㅡ', 'ㅣ'],
};

// Complex jongsung keystroke breakdown
export const JONGSUNG_KEYS: Record<string, string[]> = {
  'ㄳ': ['ㄱ', 'ㅅ'],
  'ㄵ': ['ㄴ', 'ㅈ'],
  'ㄶ': ['ㄴ', 'ㅎ'],
  'ㄺ': ['ㄹ', 'ㄱ'],
  'ㄻ': ['ㄹ', 'ㅁ'],
  'ㄼ': ['ㄹ', 'ㅂ'],
  'ㄽ': ['ㄹ', 'ㅅ'],
  'ㄾ': ['ㄹ', 'ㅌ'],
  'ㄿ': ['ㄹ', 'ㅍ'],
  'ㅀ': ['ㄹ', 'ㅎ'],
  'ㅄ': ['ㅂ', 'ㅅ'],
};

export interface HangulCharDecomposition {
  original: string;
  isHangul: boolean;
  chosung?: string;
  jungsung?: string;
  jongsung?: string;
  keys: string[];
}

/**
 * Decomposes a character into individual phonetic keystrokes
 */
export function decomposeChar(char: string): HangulCharDecomposition {
  const code = char.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const syllableIndex = code - 0xac00;
    const jongIndex = syllableIndex % 28;
    const jungIndex = Math.floor((syllableIndex - jongIndex) / 28) % 21;
    const choIndex = Math.floor((syllableIndex - jongIndex) / 28 / 21);

    const cho = CHOSUNG[choIndex];
    const jung = JUNGSUNG[jungIndex];
    const jong = JONGSUNG[jongIndex];

    const keys: string[] = [cho];
    if (JUNGSUNG_KEYS[jung]) {
      keys.push(...JUNGSUNG_KEYS[jung]);
    } else {
      keys.push(jung);
    }

    if (jong) {
      if (JONGSUNG_KEYS[jong]) {
        keys.push(...JONGSUNG_KEYS[jong]);
      } else {
        keys.push(jong);
      }
    }

    return {
      original: char,
      isHangul: true,
      chosung: cho,
      jungsung: jung,
      jongsung: jong || undefined,
      keys,
    };
  }

  return {
    original: char,
    isHangul: false,
    keys: [char],
  };
}

/**
 * Counts total actual keystrokes of a string in Korean typing standard
 */
export function countKeystrokes(text: string): number {
  let count = 0;
  for (const char of text) {
    const decomp = decomposeChar(char);
    count += decomp.keys.length;
  }
  return count;
}

/**
 * Detects mismatched keys between expected and typed text
 */
export function analyzeMistakes(
  expectedText: string,
  typedText: string
): {
  mistakeKeys: string[];
  incorrectWords: string[];
  totalExpectedKeys: number;
  correctKeys: number;
} {
  const mistakeKeys: string[] = [];
  const incorrectWords: string[] = [];

  const expectedWords = expectedText.trim().split(/\s+/);
  const typedWords = typedText.trim().split(/\s+/);

  for (let i = 0; i < expectedWords.length; i++) {
    const expWord = expectedWords[i];
    const actWord = typedWords[i] || '';
    if (expWord !== actWord && expWord.length > 0) {
      incorrectWords.push(expWord);
    }
  }

  let totalExpectedKeys = 0;
  let correctKeys = 0;

  for (let i = 0; i < expectedText.length; i++) {
    const expChar = expectedText[i];
    const actChar = typedText[i];
    const expDecomp = decomposeChar(expChar);
    totalExpectedKeys += expDecomp.keys.length;

    if (expChar === actChar) {
      correctKeys += expDecomp.keys.length;
    } else {
      // Record mistake keys
      if (expDecomp.isHangul) {
        if (expDecomp.jongsung) {
          mistakeKeys.push(`${expDecomp.jongsung}(받침)`);
        } else if (expDecomp.jungsung) {
          mistakeKeys.push(`${expDecomp.jungsung}(모음)`);
        } else if (expDecomp.chosung) {
          mistakeKeys.push(`${expDecomp.chosung}(초성)`);
        }
      } else {
        mistakeKeys.push(expChar === ' ' ? '스페이스(띄어쓰기)' : expChar);
      }
    }
  }

  return {
    mistakeKeys,
    incorrectWords: Array.from(new Set(incorrectWords)),
    totalExpectedKeys,
    correctKeys: Math.max(0, correctKeys),
  };
}

// 2-set Korean QWERTY keyboard mapping for visual layout
export const KEYBOARD_LAYOUT = [
  ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
  ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
  ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ'],
];

export const SHIFT_KEY_MAP: Record<string, string> = {
  'ㅃ': 'ㅂ',
  'ㅉ': 'ㅈ',
  'ㄸ': 'ㄷ',
  'ㄲ': 'ㄱ',
  'ㅆ': 'ㅅ',
  'ㅒ': 'ㅐ',
  'ㅖ': 'ㅔ',
};
