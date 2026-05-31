export type Wuxing = '金' | '木' | '水' | '火' | '土';
export type LuckTier = 'deterministic' | 'interpretive' | 'ritual';

export type MemberKind = 'human' | 'pet';

export interface MemberProfile {
  id: string;
  name: string;
  alias: string;
  kind: MemberKind;
  role: string;
  color: string;
  colorBg: string;
  photo: string;
  photoPos?: string;
  birthDate: string;
  birthHour?: number;
  gender?: '男' | '女';
  bazi: string;
  zodiac: string;
  wuxing: string;
  yong?: Wuxing;
  mainWuxing: Wuxing;
  chips: string[];
  highlight: string;
  challenges?: Array<{ tag: string; text: string }>;
  isGuest?: boolean;  // 访客模式标记 · UI 区分（true = 朋友自建档案 · false/undefined = 主理人 PIN 进入）
}

export interface RelationProfile {
  id: string;
  pair: [string, string];
  score: number;
  keyword: string;
  essence: string;
  mechanism: string;
  body: string;
  actions: string[];
}

export interface AlgorithmFactor {
  id: string;
  label: string;
  value: string | number;
  weight: number;
  tier: LuckTier;
  explanation: string;
}

export interface TimeWindow {
  zhi: string;
  range: string;
  gate: string;
  luck: '大吉' | '吉' | '中' | '凶' | '大凶';
  advice: string;
  personalTag: string;
  factorIds: string[];
}

export interface DailyLuckResult {
  algorithmVersion: string;
  memberId: string;
  date: string;
  lunar: string;
  ganzhi: string;
  score: number;
  label: string;
  advice: string;
  theme: {
    shiShen: string;
    title: string;
    scene: string;
    goodFor: string[];
    watchOut: string[];
  };
  dimensions: Record<'事业' | '财运' | '社交' | '健康', number>;
  radar: Array<{
    id: string;
    label: string;
    value: number;
    summary: string;
    detail: string;
  }>;
  currentWindow: TimeWindow;
  nextGoodWindow: TimeWindow;
  hours: TimeWindow[];
  recommendations: {
    colors: string[];
    foods: string[];
    drink: string;
    direction: string;
    numbers: number[];
    avoid: string[];
    yi: string[];
    ji: string[];
    avoidList: string[];
    wellness: Array<{ label: string; value: string }>;
    helper: Array<{ label: string; value: string }>;
    home: Array<{ label: string; value: string }>;
    speech: Array<{ label: string; value: string }>;
  };
  tarot: {
    id: number;
    name: string;
    en: string;
    emoji: string;
    reversed: boolean;
    keywords: string[];
    core: string;
    meaning: string;
    question: string;
    advice: string;
    action: string;
    tier: LuckTier;
    arcana?: 'major' | 'minor';
    suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  };
  factors: AlgorithmFactor[];
  explanation: string;
  qimen?: import('./engine/adapters/taobi').QimenChart | null;
}

export interface AlgorithmVersion {
  version: string;
  title: string;
  notes: string[];
}

export interface RelationTodayResult {
  relationId: string;
  score: number;
  delta: number;
  label: string;
  advice: string;
  dayGanzhi: string;
  dayWuxing: Wuxing;
  relationWuxing: Wuxing | null;
  realtimeReasons: string[];
  factors: AlgorithmFactor[];
}
