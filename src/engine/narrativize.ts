// 叙事文本生成 · 把 DailyLuckResult 的 raw 数据合成"1 句结论 + N 条支撑"
// 信息密度：中等口径 · 结论一句话 · 支撑保留具体数据 · note 给个人化具体例子

import type { DailyLuckResult, MemberProfile } from '../types';

const SHISHEN_TONE: Record<string, string> = {
  比肩: '与人协作的一天 · 找同频伙伴推进',
  劫财: '小心利益分歧 · 别一个人扛',
  食神: '创造和表达的一天 · 把想法做出来',
  伤官: '才华外露 · 但话别说太满',
  偏财: '抓短期机会 · 财气与人脉同时来',
  正财: '稳扎稳打的一天 · 把活做实',
  七杀: '硬仗与挑战 · 顶住压力',
  正官: '走规矩 · 适合做公开承诺与流程',
  偏印: '独立思考 · 选偏冷门视角',
  正印: '学习吸收的一天 · 接受指导'
};

// 个人时辰标签 → 当下行动建议（per-person · 让两人结论不一样）
const PERSONAL_TAG_TONE: Record<string, { do: string; donot: string }> = {
  同气: { do: '当下助身 · 适合主动出招', donot: '别拖到更晚' },
  生身: { do: '当下被支撑 · 抓机会推进', donot: '别只顾接收不行动' },
  泄身: { do: '能量在外散 · 适合输出表达', donot: '别硬扛新任务' },
  克身: { do: '当下受压 · 守住核心 · 别开新战线', donot: '不打硬仗' },
  胜出: { do: '主动出击占上风 · 适合谈判推进', donot: '别得理不饶人' },
  中性: { do: '正常推进', donot: '保持节奏' }
};

// === 个人语境 patterns · pattern.test(label) → 个人化补充 ===
// 牛牛 = 腾讯广告法律行业销售 · 律所 / 个债 / 逾期 客户
// 嘻嘻 = 主出镜 · 形象创作 · 表达型
const MEMBER_PATTERNS: Record<string, Array<[RegExp, string]>> = {
  niu: [
    // === 主题 goodFor ===
    [/和同事并肩|协作|团队/, '比如约一位律所对接人 · 一起列下周要谈的 3 家客户'],
    [/维系老朋友|老朋友|老客户|联系/, '给一位老客户发个法律行业近况 · 别带销售意图'],
    [/安排运动|运动|训练/, '中午爬一段楼梯 · 顺便给客户打电话'],
    [/把一个长期任务拆|拆成|步骤/, '把"法律行业季度拓展"拆成 3 个本周可推进的客户动作'],
    [/处理拖延|拖延|卡住/, '挑一个躺了 2 周的客户案 · 今天把回复写完发出'],
    [/主动联系老客户/, '盘一下 Q1 合作过的律所 · 挑 1 家发个行业研究'],
    [/尝试新方法|新方法/, '试一种新的客户介绍话术 · 比如先讲法规变化再切产品'],
    [/头脑风暴/, '约一位同行喝杯咖啡 · 互相 brainstorm 行业打法'],
    [/陪伴重要的人/, '回家不带电脑 · 陪嘻嘻吃顿饭'],
    [/写一段真实表达/, '把这一季对法律行业的判断写成 200 字朋友圈草稿'],
    [/提出新点子|新点子/, '在内部会上抛一个法律产品包升级想法'],
    [/做演示分享|演示|分享/, '把行业拓展指引讲给一位同事 · 先内部跑通'],
    [/优化一个旧方案/, '把"法律产品包 v4"再过一遍 · 找出 1 处可改'],
    [/拓展人脉|人脉/, '约一位非腾讯法律圈的人 · 不谈合作只交换信息'],
    [/副业推进|副业/, '把命理今日的下一步迭代列 3 条'],
    [/盘点手上的可交换资源/, '盘一遍手上律所资源 · 哪些可以做行业互推'],
    [/处理财务|财务|做预算|预算/, '把这季度可见的法律行业回款列成一张表'],
    [/稳扎稳打|做实/, '把上周一份没改完的客户提案补完发出'],
    [/啃硬任务|硬任务|攻坚/, '挑这周最硬的那家律所 · 今天把方案敲一稿'],
    [/处理棘手|棘手/, '给那个一直没回的客户写封短邮件 · 把球抛过去'],
    [/给风险项定边界/, '给手上风险偏高的客户列一条"踩线即停"的红线'],
    [/向上汇报|汇报/, '把行业半月动作整理成 3 条向 leader 同步'],
    [/正式会议|按流程/, '今天的客户会准备 1 页 PDF · 不靠口头'],
    [/整理证据链|时间线/, '把客户跟进时间线整理一下 · 防止节点漏'],
    [/深度学习|研究钻研|钻研/, '挑一份法律行业最新规章 · 读完写 100 字心得'],
    [/独处复盘|复盘/, '今晚把这周 5 个客户对话各写一句复盘'],
    [/整理一个复杂问题/, '把"个债客户为什么难推"列出来分 3 类'],
    [/看书上课|看书|上课/, '看 30 分钟法律行业的播客或公众号'],
    [/请教前辈|前辈/, '给一位行业前辈发条问题 · 1 句话能回的'],
    [/陪父母|父母/, '给妈打个电话 · 不聊事情 · 只聊吃啥'],
    [/做一次低强度恢复/, '中午午休 20 分钟 · 不刷工作群'],

    // === 主题 watchOut ===
    [/别和人比较|和人比较/, '同事拿大单不上头 · 你的法律公证赛道节奏不一样'],
    [/注意花销|花销/, '盘一遍付费工具订阅 · 砍掉 1 个用得少的'],
    [/避免硬撑面子|硬撑面子|面子/, '客户面前别夸团队执行力 · 留点尾巴反而更好谈'],
    [/控制冲动消费|冲动消费/, '别看到运动鞋就下单 · 收藏夹放 24 小时'],
    [/小心争执|争执/, '客户群里有人挑刺 · 私聊回 · 别在群里硬刚'],
    [/别临时加码承诺|临时加码/, '客户加诉求当场不接 · "我回去看下再回你"'],
    [/别太懒|太懒/, '别用"今天等回复"做借口 · 主动跟一个'],
    [/注意饮食克制|饮食克制/, '中午别叫两份外卖 · 吃完一份再说'],
    [/别把享受变成拖延/, '刷剧 1 集就关 · 别自动续到 3 集'],
    [/说话注意分寸|分寸/, '客户面前不评价隔壁公司 · 哪怕你确实知道'],
    [/别和上级硬碰硬|硬碰硬/, '不同意 leader 的判断先问"你怎么看" · 再说自己看法'],
    [/不要为了爽而把话说满/, '客户面前别承诺"一定能"· 留 20% 余地'],
    [/别冲动消费/, '预付费的会员卡 · 押金大于年消费的不办'],
    [/警惕投机|投机/, '别为了跟客户聊上而临时报错产品价格'],
    [/不要被临时机会带偏主线/, '同事抛过来的临时活先放到周五看 · 不打断主线'],
    [/避免冒险投资|冒险投资/, '今天不动股 · 不看新基金'],
    [/别拖延正事|拖延正事/, '把躺在收件箱 3 天的客户邮件先回了'],
    [/别为省小钱牺牲效率/, '该买的工具就买 · 别为 2 小时省 99 块'],
    [/注意健康|健康/, '坐 1 小时起来一次 · 别一坐就 4 小时'],
    [/避免冲突|冲突/, '客户那边有歧义先列两套方案 · 不直接 say no'],
    [/不要把压力转嫁给亲近的人/, '回家进门先深呼吸 3 次 · 别带着会议情绪'],
    [/别打擦边球|擦边球/, '合规线碰不得 · 哪怕客户 push 也得说不'],
    [/别显得不靠谱|不靠谱/, '答应客户的回复时间到点就发 · 哪怕只是"在跟"'],
    [/不要口头承诺无记录/, '客户群口头同意的事 · 当场补一句文字确认'],
    [/别多想/, '一件事想超过 30 分钟没结论 · 写下来明天再看'],
    [/别陷入纠结|纠结/, '两个方案选不出来 · 抛硬币 · 抛完不准反悔'],
    [/不要越查越散/, '查一个法规别开 10 个 tab · 一个看完再下一个'],
    [/别太依赖别人|依赖别人/, '能自己列的清单别等别人发模板'],
    [/注意作息|作息/, '23 点放下手机 · 不刷 X · 不刷小红书'],
    [/不要用准备代替行动/, '别再"还在准备" · 哪怕只发出去一份草稿也行'],
  ],
  xixi: [
    // === 主题 goodFor ===
    [/和同事并肩|协作|团队/, '找一位创作上同频的朋友约 30 分钟咖啡'],
    [/维系老朋友|老朋友|老客户|联系/, '给一位许久没聊的朋友发条问候 · 不必回'],
    [/安排运动|运动|训练/, '做 30 分钟皮拉提斯或快走 · 别太重'],
    [/把一个长期任务拆|拆成|步骤/, '把"想拍的一组片"拆成 3 步：定主题 → 找参考 → 列道具'],
    [/处理拖延|拖延|卡住/, '挑一件搁了 2 周没动的事 · 今天就推 1 步'],
    [/主动联系老客户/, '给曾合作过的人发条问候 · 不带目的'],
    [/尝试新方法|新方法/, '试一种没拍过的光线或构图'],
    [/头脑风暴/, '和创作朋友聊 30 分钟 · 不出结论也行'],
    [/陪伴重要的人/, '今晚陪牛牛吃饭不刷手机'],
    [/写一段真实表达/, '写一段 200 字日记 · 关于今天最有感觉的瞬间'],
    [/提出新点子|新点子/, '把脑子里的一个内容选题写成大纲'],
    [/做演示分享|演示|分享/, '挑一张满意的旧片 · 配 50 字感受发出去'],
    [/优化一个旧方案/, '把上周拍的一组片选 3 张 · 重新调一遍色'],
    [/拓展人脉|人脉/, '约一位你欣赏的创作者 · 不为合作只为见见'],
    [/副业推进|副业/, '盘一下接单或副业的小机会 · 列 3 条'],
    [/盘点手上的可交换资源/, '盘一下你能给别人的：审美 / 时间 / 资源'],
    [/处理财务|财务|做预算|预算/, '把月度开支看一眼 · 别让"都还行"变成黑盒'],
    [/稳扎稳打|做实/, '把搁置的拍摄计划补 1 项细节 · 哪怕只列道具'],
    [/啃硬任务|硬任务|攻坚/, '今天就把那段一直没剪的视频开个工程文件'],
    [/处理棘手|棘手/, '把那条没回的暧昧消息今天明确回掉'],
    [/给风险项定边界/, '给"接单底线" 写 1 句话 · 哪种活不接'],
    [/向上汇报|汇报/, '把这周做了什么列 3 条发给一个信任的人 · 让自己看见进度'],
    [/正式会议|按流程/, '正式场合穿正经一点 · 哪怕只见一个人'],
    [/整理证据链|时间线/, '把这季度的成果时间线列一遍 · 用得上'],
    [/深度学习|研究钻研|钻研/, '看 1 个长视频 · 关于审美 / 创作 / 留学的'],
    [/独处复盘|复盘/, '今晚关掉社交 app 1 小时 · 写下今天 3 件事'],
    [/整理一个复杂问题/, '把"留学还是工作"分 3 个角度各写 50 字'],
    [/看书上课|看书|上课/, '看 30 分钟纸质书 · 不要短视频'],
    [/请教前辈|前辈/, '给一位你尊重的姐姐发条问题 · 1 句能回的'],
    [/陪父母|父母/, '给爸妈打个电话 · 聊近况就好'],
    [/做一次低强度恢复/, '今天少看一次社媒 · 早睡 30 分钟'],

    // === 主题 watchOut ===
    [/别和人比较|和人比较/, '别拿别人的 like 和你的真表达比 · 不是一种东西'],
    [/注意花销|花销/, '看到种草链接先收藏 · 24 小时再决定'],
    [/避免硬撑面子|硬撑面子|面子/, '今天不舒服就直接说 · 不用强行营业'],
    [/控制冲动消费|冲动消费/, '别看到博主同款就下单 · 衣柜还有 3 件没穿过'],
    [/小心争执|争执/, '今天评论区不和人辩 · 删评论不解释'],
    [/别临时加码承诺|临时加码/, '别人临时加诉求当场不答应 · 回去想清楚'],
    [/别太懒|太懒/, '别用"等灵感来"做拖延的借口 · 先动手 5 分钟'],
    [/注意饮食克制|饮食克制/, '今天不点奶茶 · 多喝水'],
    [/别把享受变成拖延/, '刷小红书 15 分钟到点关掉'],
    [/说话注意分寸|分寸/, '镜头前别评价别人的作品 · 哪怕私下你有想法'],
    [/别和上级硬碰硬|硬碰硬/, '和合作方有分歧 · 先听对方完整说完再回'],
    [/不要为了爽而把话说满/, '镜头前别承诺"以后一定" · 当下感受表达就够'],
    [/别冲动消费/, '化妆品先用完上一支再开新的'],
    [/警惕投机|投机/, '别为了热度去蹭你不认同的话题'],
    [/不要被临时机会带偏主线/, '突然来的小约稿先放到周末看 · 不打断本周计划'],
    [/避免冒险投资|冒险投资/, '今天不冲动报班 · 不付定金'],
    [/别拖延正事|拖延正事/, '搁置的拍摄今天定个开机时间 · 哪怕周日'],
    [/别为省小钱牺牲效率/, '该升级的器材就升级 · 别为省 200 蹲二手 1 个月'],
    [/注意健康|健康/, '21:30 后不接重要话题 · 不熬夜处理事'],
    [/避免冲突|冲突/, '感情里有不爽 · 先告诉自己 · 再决定要不要说'],
    [/不要把压力转嫁给亲近的人/, '回家进门别第一句吐槽 · 先说一件好玩的'],
    [/别打擦边球|擦边球/, '内容 / 表达不踩你不舒服的红线'],
    [/别显得不靠谱|不靠谱/, '答应朋友的事到点就回 · 哪怕只是说"还没好"'],
    [/不要口头承诺无记录/, '合作群口头同意的事补一条消息确认'],
    [/别多想/, '一句模糊的话想超过 1 小时 · 直接问对方'],
    [/别陷入纠结|纠结/, '两条裙子选不出 · 抛硬币 · 不反悔'],
    [/不要越查越散/, '查留学项目别开 20 个 tab · 一个看完再开下一个'],
    [/别太依赖别人|依赖别人/, '能自己查的别等牛牛说 · 你查得也快'],
    [/注意作息|作息/, '22:30 放下手机 · 别刷到 1 点'],
    [/不要用准备代替行动/, '别再"等准备好" · 拍一张就发一张'],
  ]
};

function concretizeFor(memberId: string, text: string): string | undefined {
  const patterns = MEMBER_PATTERNS[memberId];
  if (!patterns) return undefined;
  for (const [pattern, note] of patterns) {
    if (pattern.test(text)) return note;
  }
  return undefined;
}

export function concreteFor(memberId: string, items: string[]): string[] {
  return items.map(t => concretizeFor(memberId, t) ?? '');
}

export function themeNarrative(item: DailyLuckResult): { conclusion: string; tagline: string } {
  const tone = SHISHEN_TONE[item.theme.shiShen] ?? item.theme.title;
  return {
    conclusion: tone,
    tagline: `${item.theme.shiShen} · ${item.theme.title}`
  };
}

export interface NarrativeRow {
  icon: string;
  label: string;
  detail: string;
  note?: string;
  impact?: number;  // 权重 0-100 · 配合可视化进度条 / 数字
  kind?: string;    // helper / home / wellness / avoid / speech / challenge
}

// === 权重计算 · 100% 分拆 · 让加权 / 降权逻辑直观 ===
// 规则：N 条建议总权重 = 100% · 按重要性 rank 分配 · 稳定 per-day jitter
// "必做" = 占今日推进力的占比 · "不做" = 占今日扣分风险的占比

function pct100(seed: number, baseRatios: number[]): number[] {
  // 加微 jitter 让不同日数字略变 · 但总和保持 100
  const jittered = baseRatios.map((b, i) => {
    const j = ((seed * 11 + i * 17 + 7) % 9) - 4; // -4..4
    return Math.max(6, b + j);
  });
  const sum = jittered.reduce((a, b) => a + b, 0);
  const rounded = jittered.map(v => Math.round((v / sum) * 100));
  // 补偿到 100
  const total = rounded.reduce((a, b) => a + b, 0);
  if (total !== 100) {
    rounded[0] += 100 - total;
  }
  return rounded;
}

// 主题 必做 / 不做 · 3 条 · base 60/25/15（rank 0 占大头）
export function themeImpactPcts(item: DailyLuckResult, isGood: boolean, count = 3): number[] {
  const base = count === 3 ? [60, 25, 15] : Array(count).fill(Math.floor(100 / count));
  const seed = item.score + (isGood ? 0 : 31);
  return pct100(seed, base);
}

// 外援 · 3 条 · base helper(贵人) 40 / home(空间) 25 / wellness(节奏) 35
export function supportImpactPcts(item: DailyLuckResult): number[] {
  return pct100(item.score + 53, [40, 25, 35]);
}

// 要避 · 3 条 · base avoid 40 / speech 30 / challenge 30
export function avoidImpactPcts(item: DailyLuckResult, count = 3): number[] {
  const base = count === 3 ? [40, 30, 30] : count === 2 ? [55, 45] : [100];
  return pct100(item.score + 71, base);
}

export function supportNarrative(item: DailyLuckResult, member: MemberProfile): {
  conclusion: string;
  rows: NarrativeRow[];
} {
  const rec = item.recommendations;
  const direction = rec.helper.find(r => r.label === '贵人方向')?.value ?? rec.helper[0]?.value ?? '';
  const helperVibe = rec.helper.find(r => r.label === '贵人气质')?.value ?? '';
  const homeYi = rec.home.find(r => r.label === '宜')?.value ?? rec.home[0]?.value ?? '';
  const wellnessKey = rec.wellness.find(r => r.label === '睡眠')?.value ?? rec.wellness[0]?.value ?? '';
  const helperLabel = helperVibe ? `${direction}方位 · 找${helperVibe}` : direction;

  // 个人化补充：基于 member id 给"靠近什么人"具象例
  const helperNotes: Record<string, string> = {
    niu: '今天约见的优先选 · 法律 / 行业上下游 · 不必正式',
    xixi: '挑一位审美在线 · 能给你"你这样真好看"的人见'
  };
  const homeNotes: Record<string, string> = {
    niu: '工位左手边只留客户卷宗 · 多余移开',
    xixi: '桌面只留 3 件用得到的 · 多余收起 · 视觉清爽再开拍'
  };
  const wellnessNotes: Record<string, string> = {
    niu: '睡前 30 分钟不开邮件 · 不秒回客户群',
    xixi: '21:30 后不接重要话题 · 23:00 前关屏'
  };

  return {
    conclusion: '靠近对的人 · 用对的方向 · 调对的节奏',
    rows: [
      { icon: '人脉', label: helperLabel, detail: '今天能借的"人气"', note: helperNotes[member.id], kind: 'helper' },
      { icon: '空间', label: homeYi, detail: '空间做减法 · 让用神气场上位', note: homeNotes[member.id], kind: 'home' },
      { icon: '节律', label: wellnessKey, detail: '身体不顶 · 决策也不会准', note: wellnessNotes[member.id], kind: 'wellness' }
    ]
  };
}

export function avoidNarrative(item: DailyLuckResult, member: MemberProfile): {
  conclusion: string;
  rows: NarrativeRow[];
} {
  const rec = item.recommendations;
  const avoid = rec.avoidList[0] ?? '';
  const speechWork = rec.speech.find(r => r.label === '工作')?.value ?? rec.speech[0]?.value ?? '';
  const challenge = member.challenges?.[item.score % (member.challenges.length || 1)];

  // 个人化补充
  const avoidNotes: Record<string, string> = {
    niu: '尤其客户群 / leader 群 · 措辞模糊别发',
    xixi: '尤其感情对话 / 合作群 · 别情绪上头发'
  };
  const speechNotes: Record<string, string> = {
    niu: '客户面前先讲法规背景 · 再上产品 · 别上来就报价',
    xixi: '合作沟通先问对方目标 · 再说自己想法 · 别先抛报价'
  };

  const rows: NarrativeRow[] = [
    { icon: '回避', label: avoid, detail: '今天最该躲的一个动作', note: avoidNotes[member.id], kind: 'avoid' },
    { icon: '表达', label: speechWork, detail: '说话节奏 · 把分寸感拉回来', note: speechNotes[member.id], kind: 'speech' }
  ];
  if (challenge) {
    rows.push({
      icon: '风险',
      label: `[${challenge.tag}] ${challenge.text}`,
      detail: '今天的小考题',
      note: undefined,
      kind: 'challenge'
    });
  }
  return {
    conclusion: '少做这些 · 多想一步',
    rows
  };
}

export function nowNarrative(item: DailyLuckResult): { conclusion: string; sub: string; donot: string } {
  const w = item.currentWindow;
  const tag = PERSONAL_TAG_TONE[w.personalTag] ?? PERSONAL_TAG_TONE.中性;
  const tagPhrase = w.personalTag === '中性' ? '' : ` · ${w.personalTag}`;
  // 把通用 advice + 个人 personalTag tone 拼成 per-person 结论
  return {
    conclusion: `${tag.do} · ${w.advice}`,
    sub: `${w.range} · ${w.zhi}时 · ${w.gate}${tagPhrase}`,
    donot: tag.donot
  };
}

// === 分数等级参考系 ===
// 基于 luckEngine 的 4 维平均分（28-92 范围）
export interface ScoreTier {
  min: number;
  label: string;
  short: string;
  hint: string;
}

export const SCORE_TIERS: ScoreTier[] = [
  { min: 76, label: '顺势推进', short: '顺势', hint: '推进核心事 · 主动出击 · 谈判 / 签约 / 公开发声' },
  { min: 60, label: '稳中有机', short: '稳中', hint: '把活做实 · 顺手抓机会 · 推进既定 + 1 个新动作' },
  { min: 45, label: '低速蓄能', short: '蓄能', hint: '守住核心 · 修旧债 · 不开新战线 · 整理 / 复盘' },
  { min: 0,  label: '避峰守住', short: '守身', hint: '不打硬仗 · 修身待时 · 学习 / 休整 · 减少决策' }
];

export function tierForScore(score: number): ScoreTier {
  return SCORE_TIERS.find(t => score >= t.min) ?? SCORE_TIERS[SCORE_TIERS.length - 1];
}

// 当前分数在所在 tier 中的相对位置（用于显示"差 X 分到下一档"）
export function tierContext(score: number): {
  tier: ScoreTier;
  toNext: number | null;  // 距离下一档差多少分
  fromPrev: number;       // 已超过下档多少分
} {
  const tier = tierForScore(score);
  const idx = SCORE_TIERS.findIndex(t => t === tier);
  const above = idx > 0 ? SCORE_TIERS[idx - 1] : null;
  return {
    tier,
    toNext: above ? above.min - score : null,
    fromPrev: score - tier.min
  };
}
