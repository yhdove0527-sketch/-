export interface PracticeItem {
  id: string;
  text: string;
  meaning?: string;
  subject?: '국어' | '사회' | '과학' | '도덕' | '속담/관용구';
}

export interface PracticeStage {
  stageNumber: number;
  title: string;
  subtitle: string;
  targetCpm: number;
  targetAccuracy: number;
  description: string;
  icon: string;
  color: string;
  items: PracticeItem[];
}

export const CURRICULUM_STAGES: PracticeStage[] = [
  {
    stageNumber: 1,
    title: '1단계: 교과 핵심 낱말 연습',
    subtitle: '4학년 국어·사회·과학 필수 어휘 10개 완주',
    targetCpm: 80,
    targetAccuracy: 90,
    description: '초등 4학년 교과서에 자주 나오는 핵심 단어를 바른 손가락으로 익혀보아요.',
    icon: '🌱',
    color: 'from-amber-400 to-orange-400',
    items: [
      { id: 's1-1', text: '공감대화', meaning: '상대방의 마음에 귀 기울여 나누는 따뜻한 이야기', subject: '국어' },
      { id: 's1-2', text: '문화유산', meaning: '조상들이 물려준 소중한 문화적 가치와 보물', subject: '사회' },
      { id: 's1-3', text: '화산분출', meaning: '지하의 마그마가 지표면 밖으로 뿜어져 나오는 현상', subject: '과학' },
      { id: 's1-4', text: '삼권분립', meaning: '국가의 권력을 셋으로 나누어 서로 견제하게 하는 원리', subject: '사회' },
      { id: 's1-5', text: '생태환경', meaning: '생물과 그것을 둘러싸고 있는 자연의 상태', subject: '과학' },
      { id: 's1-6', text: '배려하는마음', meaning: '다른 사람을 도와주거나 보살펴 주려는 따뜻한 태도', subject: '도덕' },
      { id: 's1-7', text: '지층누적', meaning: '자갈, 모래, 진흙이 오랜 세월 쌓여 만들어진 층', subject: '과학' },
      { id: 's1-8', text: '지속가능', meaning: '미래 세대를 위해 환경을 훼손하지 않고 유지하는 것', subject: '사회' },
      { id: 's1-9', text: '올바른맞춤법', meaning: '말을 글로 적을 때 정해진 규칙에 맞게 쓰는 법', subject: '국어' },
      { id: 's1-10', text: '자연보호', meaning: '소중한 지구의 숲과 바다를 아끼고 지키는 실천', subject: '과학' },
    ],
  },
  {
    stageNumber: 2,
    title: '2단계: 지혜의 짧은 글 연습',
    subtitle: '4학년 필수 속담·관용구·명언 10개 완주',
    targetCpm: 120,
    targetAccuracy: 90,
    description: '조상들의 지혜와 교훈이 담긴 속담과 관용구를 리듬감 있게 쳐보아요.',
    icon: '🌿',
    color: 'from-emerald-400 to-teal-500',
    items: [
      { id: 's2-1', text: '가는 말이 고와야 오는 말이 곱다.', meaning: '내가 남에게 따뜻하게 말해야 남도 나에게 좋게 대합니다.', subject: '속담/관용구' },
      { id: 's2-2', text: '티끌 모아 태산이라 작은 정성이 소중하다.', meaning: '아무리 작은 것이라도 꾸준히 모으면 큰 결실을 맺습니다.', subject: '속담/관용구' },
      { id: 's2-3', text: '발 없는 말이 천 리를 가니 조심하자.', meaning: '말은 순식간에 널리 퍼지므로 늘 신중하게 말해야 합니다.', subject: '속담/관용구' },
      { id: 's2-4', text: '백지장도 맞들면 낫다는 협동의 힘.', meaning: '쉬운 일이라도 서로 힘을 합치면 훨씬 수월해집니다.', subject: '속담/관용구' },
      { id: 's2-5', text: '천 리 길도 한 걸음부터 차근차근 나아가자.', meaning: '아무리 큰 목표라도 첫걸음을 내딛는 것에서 시작됩니다.', subject: '속담/관용구' },
      { id: 's2-6', text: '돌다리도 두들겨 보고 건너는 지혜를 배우자.', meaning: '잘 아는 일이라도 한 번 더 꼼꼼히 확인하고 행동해요.', subject: '속담/관용구' },
      { id: 's2-7', text: '고생 끝에 즐거운 낙이 찾아온다.', meaning: '어려움을 참고 이겨내면 보람차고 기쁜 순간이 옵니다.', subject: '속담/관용구' },
      { id: 's2-8', text: '시작이 반이라는 마음으로 용기를 내자.', meaning: '어떤 일이든 시작하면 이미 절반은 이룬 셈입니다.', subject: '속담/관용구' },
      { id: 's2-9', text: '세 살 버릇 여든까지 가니 바르게 익히자.', meaning: '어릴 때 들인 좋은 습관은 평생의 든든한 밑거름이 됩니다.', subject: '속담/관용구' },
      { id: 's2-10', text: '우물을 파도 한 우물을 파는 끈기가 필요하다.', meaning: '한 가지 일에 정성을 다해 집중해야 성공할 수 있습니다.', subject: '속담/관용구' },
    ],
  },
  {
    stageNumber: 3,
    title: '3단계: 교과서 온전한 문장 연습',
    subtitle: '국어·사회·과학 4학년 교과서 길잡이 문장 10개 완주',
    targetCpm: 150,
    targetAccuracy: 90,
    description: '4학년 교과서의 깊이 있는 탐구 문장과 길잡이 글을 완벽하게 마스터해요.',
    icon: '🌳',
    color: 'from-blue-400 to-indigo-500',
    items: [
      { id: 's3-1', text: '우리는 서로 다른 생각을 존중하며 따뜻한 배려의 대화를 나눕니다.', subject: '국어' },
      { id: 's3-2', text: '화산과 지진은 지구 내부의 강한 힘으로 일어나는 역동적인 자연 현상입니다.', subject: '과학' },
      { id: 's3-3', text: '조상들의 깊은 슬기와 지혜가 깃든 문화유산을 아끼고 자랑스럽게 보존합시다.', subject: '사회' },
      { id: 's3-4', text: '친구가 고민으로 힘들어할 때 다정한 눈빛으로 위로와 응원의 말을 건넵니다.', subject: '도덕' },
      { id: 's3-5', text: '심어 둔 강낭콩이 튼튼하게 싹을 틔우고 잎을 펼쳐 아름다운 꽃을 피웁니다.', subject: '과학' },
      { id: 's3-6', text: '우리가 함께 살아가는 마을에는 다양한 공공 기관과 이웃들이 서로 협력합니다.', subject: '사회' },
      { id: 's3-7', text: '민주주의는 모든 시민의 자유와 권리가 평등하게 존중받는 정의로운 사회입니다.', subject: '사회' },
      { id: 's3-8', text: '햇빛은 공기 속을 곧게 나아가다가 매끄러운 거울 면을 만나면 반사됩니다.', subject: '과학' },
      { id: 's3-9', text: '상대방의 의견과 글의 중심 내용을 주의 깊게 경청하며 바른 태도를 지킵니다.', subject: '국어' },
      { id: 's3-10', text: '아름답고 소중한 우리말을 올바른 맞춤법과 띄어쓰기로 바르게 사용합시다.', subject: '국어' },
    ],
  },
];
