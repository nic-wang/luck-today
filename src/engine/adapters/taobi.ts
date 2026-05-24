// taobi 奇门遁甲 adapter
// 输出标准九宫格（3x3）+ 值符 + 节气
//
// Canvas 结构（探针得出）：
//   canvas[row][col] = [
//     [shen八神, '', ''],
//     [men八门, '', gan三奇六仪],
//     [star九星, palace宫位名, gan三奇六仪],
//   ]
//
// 标准 3x3 落宫顺序（row 0..2 / col 0..2）：
//   巽4 · 离9 · 坤2
//   震3 · 中5 · 兑7
//   艮8 · 坎1 · 乾6

import { TheArtOfBecomingInvisible } from 'taobi';
import type { AlgorithmFactor } from '../../types';

export interface QimenCell {
  palace: string;
  shen: string;
  men: string;
  star: string;
  gan: string;
  isCenter: boolean;
}

export interface QimenChart {
  cells: QimenCell[];
  zhiFu: string;
  solarTerm?: string;
  generatedAt: string;
}

const STANDARD_PALACES = [
  '巽四', '离九', '坤二',
  '震三', '中五', '兑七',
  '艮八', '坎一', '乾六'
];

export function computeQimen(date: Date = new Date()): QimenChart | null {
  try {
    const tao = new TheArtOfBecomingInvisible(date);
    const canvas = tao.getCanvas();
    const cells: QimenCell[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const cell = canvas[r]?.[c];
        if (!cell) {
          cells.push({
            palace: STANDARD_PALACES[r * 3 + c],
            shen: '', men: '', star: '', gan: '',
            isCenter: r === 1 && c === 1
          });
          continue;
        }
        const [shenRow, menRow, starRow] = cell;
        cells.push({
          palace: starRow?.[1] || STANDARD_PALACES[r * 3 + c],
          shen: shenRow?.[0] || '',
          men: menRow?.[0] || '',
          star: starRow?.[0] || '',
          gan: starRow?.[2] || menRow?.[2] || '',
          isCenter: r === 1 && c === 1
        });
      }
    }
    let zhiFu = '';
    try { zhiFu = tao.getSymbol(true); } catch { /* ignore */ }
    let solarTerm: string | undefined;
    try { solarTerm = tao.getSolarTerms?.(true); } catch { /* ignore */ }
    return {
      cells,
      zhiFu,
      solarTerm,
      generatedAt: date.toISOString()
    };
  } catch (err) {
    console.warn('[qimen] compute failed:', err);
    return null;
  }
}

export function qimenFactor(chart: QimenChart | null): AlgorithmFactor | null {
  if (!chart) return null;
  return {
    id: 'qimen-zhifu',
    label: '奇门 · 值符',
    value: chart.zhiFu || '—',
    weight: 0.4,
    tier: 'interpretive',
    explanation: `taobi 算今日值符为 ${chart.zhiFu || '未知'}${chart.solarTerm ? `（${chart.solarTerm}节令）` : ''}，作为流派推断层信号。`
  };
}
