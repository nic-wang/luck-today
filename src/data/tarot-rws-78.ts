// RWS 78 张完整塔罗 · 中文释义 · luck-today 内化版
// 22 大阿尔卡纳（0-21）+ 56 小阿尔卡纳（4 花色 × 14 张）= 78
//
// 字段语义：
//   core    · 牌的内核一句话
//   upright · 正位日常意涵
//   reversed· 逆位提醒
//   advice  · 用神层建议
//   action  · 今日具体动作

export type TarotArcana = 'major' | 'minor';
export type TarotSuit = 'wands' | 'cups' | 'swords' | 'pentacles';

export interface TarotCardData {
  id: number;
  name: string;
  en: string;
  emoji: string;
  arcana: TarotArcana;
  suit?: TarotSuit;
  number?: number; // minor 1-10 / 11-14（侍/骑/后/王）
  keywords: string[];
  core: string;
  upright: string;
  reversed: string;
  advice: string;
  action: string;
}

// === 大阿尔卡纳 22 ===
export const MAJOR_ARCANA: TarotCardData[] = [
  { id: 0, name: '愚者', en: 'The Fool', emoji: '🃏', arcana: 'major', keywords: ['新开始','冒险','自由'], core: '未知之旅的起点，重点不是莽撞，而是轻装上路。', upright: '可以开一个小新局。', reversed: '先别跳，摸清边界。', advice: '选一个成本低、反馈快的新动作。', action: '今天只迈第一步，不做终局承诺。' },
  { id: 1, name: '魔术师', en: 'The Magician', emoji: '🎩', arcana: 'major', keywords: ['资源','行动','连接'], core: '工具已经在手里，关键是把意图落到一个动作。', upright: '资源可调用，适合启动。', reversed: '小心只讲概念不落地。', advice: '把散落资源连成一个可交付。', action: '列出手头 3 个资源，立刻组合成一个输出。' },
  { id: 2, name: '女祭司', en: 'The High Priestess', emoji: '🌙', arcana: 'major', keywords: ['直觉','观察','静心'], core: '答案不一定在外部信息里，先听见自己的判断。', upright: '少说多听，容易看到暗线。', reversed: '别把直觉压成焦虑。', advice: '先记录感觉，再判断事实。', action: '写下一个隐约不对劲的点，晚上再复核。' },
  { id: 3, name: '皇后', en: 'The Empress', emoji: '👑', arcana: 'major', keywords: ['滋养','创造','丰盛'], core: '让事情有机生长，不强求节奏。', upright: '适合慢工出细活。', reversed: '别用照顾别人逃避自己。', advice: '把舒适和产出放在同一个动作里。', action: '挑一件让你身体放松又有产出的事。' },
  { id: 4, name: '皇帝', en: 'The Emperor', emoji: '⚔️', arcana: 'major', keywords: ['结构','边界','秩序'], core: '用规则对抗混乱，先立边界再推进。', upright: '适合定规则、排优先级。', reversed: '别把控制感当安全感。', advice: '把一件乱事压成 3 条规则。', action: '今天只守一个最关键边界。' },
  { id: 5, name: '教皇', en: 'The Hierophant', emoji: '📜', arcana: 'major', keywords: ['传承','规范','请教'], core: '别全自己想，先看看是否有现成路径。', upright: '适合学习、咨询、走流程。', reversed: '小心被规矩束缚住。', advice: '找一个比你走过这条路的人。', action: '请教一个具体问题，不要泛泛聊。' },
  { id: 6, name: '恋人', en: 'The Lovers', emoji: '💞', arcana: 'major', keywords: ['关系','选择','对齐'], core: '关系需要明确选择，模糊会消耗双方。', upright: '适合表达真实偏好。', reversed: '小心逃避选择。', advice: '把"我想要什么"说清楚。', action: '对重要的人做一次不拐弯的表达。' },
  { id: 7, name: '战车', en: 'The Chariot', emoji: '🛞', arcana: 'major', keywords: ['推进','意志','整合'], core: '把对立力量驾驭起来朝同一方向走。', upright: '适合主动出击。', reversed: '小心硬推变内耗。', advice: '聚焦一个目标，砍掉次要分支。', action: '今天只推一件最重要的事到底。' },
  { id: 8, name: '力量', en: 'Strength', emoji: '🦁', arcana: 'major', keywords: ['柔克','耐心','内力'], core: '真正的力量是温柔地坚持，不是硬碰。', upright: '适合温和地处理棘手关系。', reversed: '别用蛮力解决情绪问题。', advice: '柔软但不让步。', action: '面对一个让你烦的人，平静讲完你的立场。' },
  { id: 9, name: '隐士', en: 'The Hermit', emoji: '🕯️', arcana: 'major', keywords: ['复盘','独处','找光'], core: '独处不是退缩，是为了看清下一步。', upright: '适合深度整理。', reversed: '别把独处变成回避沟通。', advice: '关掉输入，留出思考窗口。', action: '留 30 分钟无通知时间。' },
  { id: 10, name: '命运之轮', en: 'Wheel of Fortune', emoji: '🎡', arcana: 'major', keywords: ['转折','周期','顺势'], core: '事情在变动，顺势比硬推省力。', upright: '留意新机会。', reversed: '暂时卡住也是周期一部分。', advice: '看清趋势，不要只看当下情绪。', action: '抓住今天出现的一次小转机。' },
  { id: 11, name: '正义', en: 'Justice', emoji: '⚖️', arcana: 'major', keywords: ['公平','决断','因果'], core: '今天的选择会有明确回报或代价。', upright: '适合做明确的判断和承诺。', reversed: '别为了和平回避对错。', advice: '把模糊地带说清楚。', action: '把一个悬而未决的事当面定下来。' },
  { id: 12, name: '倒吊人', en: 'The Hanged Man', emoji: '🙃', arcana: 'major', keywords: ['暂停','换角度','放下'], core: '硬推不动时，反过来看就有路。', upright: '适合换视角。', reversed: '别一直停着不动。', advice: '把你不想做的那一种解法试一下。', action: '今天故意用相反的方式做一件小事。' },
  { id: 13, name: '死神', en: 'Death', emoji: '☠️', arcana: 'major', keywords: ['结束','蜕变','清场'], core: '该结束的让它结束，新的才有空间。', upright: '适合断舍离、收尾。', reversed: '别死扛已经过期的事。', advice: '今天结束一件该结束的。', action: '关掉一个长期消耗你的频道 / 聊天 / 项目。' },
  { id: 14, name: '节制', en: 'Temperance', emoji: '🍷', arcana: 'major', keywords: ['平衡','调和','耐心'], core: '把两种能量调在一起，速度慢一点更稳。', upright: '适合协调和修复。', reversed: '小心两头摇摆。', advice: '不要走极端，给双方都留余地。', action: '把一个冲突改成折中方案。' },
  { id: 15, name: '恶魔', en: 'The Devil', emoji: '😈', arcana: 'major', keywords: ['执念','上瘾','枷锁'], core: '看清自己被什么绑住，然后选是否松开。', upright: '识别习惯陷阱。', reversed: '正在松绑的迹象。', advice: '不否定欲望，但要看清成本。', action: '记一笔今天最容易上头的诱惑及其代价。' },
  { id: 16, name: '高塔', en: 'The Tower', emoji: '🏰', arcana: 'major', keywords: ['震动','瓦解','释放'], core: '虚假结构倒掉，反而让真东西露出来。', upright: '突发变化在所难免。', reversed: '抗拒变化只会延迟。', advice: '把会被冲掉的提前清场。', action: '今天承认一件你一直假装没事的事。' },
  { id: 17, name: '星星', en: 'The Star', emoji: '⭐', arcana: 'major', keywords: ['希望','修复','长期'], core: '恢复信心靠小而连续的事，不靠突然爆发。', upright: '适合修复节奏。', reversed: '别因为短期低分否定长期。', advice: '做一件能恢复信心的小事。', action: '补一个会让明天更轻松的动作。' },
  { id: 18, name: '月亮', en: 'The Moon', emoji: '🌑', arcana: 'major', keywords: ['迷雾','潜意识','焦虑'], core: '看不清的时候别乱动，等月光照清楚。', upright: '当心信息不全。', reversed: '迷雾在散。', advice: '别在情绪里做决定。', action: '把焦虑写成一句具体的事，再判断真伪。' },
  { id: 19, name: '太阳', en: 'The Sun', emoji: '☀️', arcana: 'major', keywords: ['明朗','展示','确认'], core: '把成果放到光下，反馈会比猜测更有用。', upright: '适合表达、展示、出场。', reversed: '别为了被看见而过度表演。', advice: '拿出一个真实成果。', action: '今天给一个人看你的阶段性结果。' },
  { id: 20, name: '审判', en: 'Judgement', emoji: '🎺', arcana: 'major', keywords: ['觉醒','回头','宣告'], core: '该做的清算来了，该做的回应也到了。', upright: '适合做关键宣布。', reversed: '别再拖那个回应。', advice: '把欠的话一次说完。', action: '回应一件你压了很久的关键消息。' },
  { id: 21, name: '世界', en: 'The World', emoji: '🌍', arcana: 'major', keywords: ['完成','整合','闭环'], core: '一个阶段闭环，下个阶段才能开始。', upright: '适合做总结和庆祝。', reversed: '差最后一公里别松手。', advice: '把当前阶段画一个明确的句号。', action: '把一件 80% 的事推到 100% 完成。' }
];

// === 小阿尔卡纳 56 张 ===
// 火（Wands）= 行动 / 激情 / 启动
// 水（Cups）= 情感 / 关系 / 内在
// 风（Swords）= 思维 / 冲突 / 决策
// 土（Pentacles）= 物质 / 工作 / 实质
//
// 数字共性：1 起势 / 2 选择 / 3 协作 / 4 稳定 / 5 失衡 / 6 流通 / 7 评估
// 8 推进 / 9 接近 / 10 完成 / 11 侍（学徒）/ 12 骑（行动）/ 13 后（成熟）/ 14 王（掌控）

const SUITS: Array<{ key: TarotSuit; zh: string; emoji: string }> = [
  { key: 'wands', zh: '权杖', emoji: '🔥' },
  { key: 'cups', zh: '圣杯', emoji: '🌊' },
  { key: 'swords', zh: '宝剑', emoji: '🗡️' },
  { key: 'pentacles', zh: '钱币', emoji: '💰' }
];

// 每张牌的核心叙述（按 suit × number 写）
type MinorReading = Pick<TarotCardData, 'keywords' | 'core' | 'upright' | 'reversed' | 'advice' | 'action'>;

const MINOR_READINGS: Record<TarotSuit, Record<number, MinorReading>> = {
  wands: {
    1: { keywords: ['启动','灵感','干劲'], core: '一团新的火苗，先抓住它。', upright: '冲动是合理的。', reversed: '动力空转。', advice: '把灵感落到一个动作。', action: '把今天的灵感立刻发起一条消息或一行字。' },
    2: { keywords: ['抉择','视野','规划'], core: '站在阳台上看远，再决定下一步。', upright: '适合做中长期规划。', reversed: '想得多走得少。', advice: '把视野压成一个 30 天目标。', action: '今天写下接下来 30 天最重要的一件事。' },
    3: { keywords: ['等待回流','拓展','信心'], core: '已经把船放出去，先稳住。', upright: '回报正在路上。', reversed: '等不及就乱出招。', advice: '保持节奏不要补打。', action: '不去 push 一件已经发出的事。' },
    4: { keywords: ['庆祝','安顿','节点'], core: '小阶段成果值得一个仪式。', upright: '适合庆祝、休整。', reversed: '别只剩形式。', advice: '在节点上停一下，再启动下一段。', action: '给一件完成的小事做个明确收尾。' },
    5: { keywords: ['竞争','摩擦','内斗'], core: '众人争抢，先看清是不是值得参战。', upright: '适合区分真假对手。', reversed: '内耗严重。', advice: '不进入消耗战。', action: '今天主动放弃一个不重要的争论。' },
    6: { keywords: ['胜利','认可','凯旋'], core: '阶段性胜出，记得让别人看到。', upright: '适合宣布、展示。', reversed: '别为掌声折腰。', advice: '把战果落成一个可见输出。', action: '把今天的小胜对一个人讲清楚。' },
    7: { keywords: ['坚守','防御','立场'], core: '势单力薄但底牌是合理的。', upright: '适合守住立场。', reversed: '硬扛容易崩。', advice: '挑一个山头守住，不要全线作战。', action: '在一个最重要的事上不让步。' },
    8: { keywords: ['加速','信息','落地'], core: '消息在飞，节奏变快。', upright: '适合赶进度。', reversed: '小心快而不准。', advice: '快但要校准方向。', action: '今天处理掉积压的几条信息回复。' },
    9: { keywords: ['坚持','警惕','最后一关'], core: '已经累但还差一口气。', upright: '咬住别松。', reversed: '过度防御。', advice: '看清是真威胁还是惯性紧张。', action: '把"再撑一下"写成具体多久。' },
    10: { keywords: ['超载','收尾','放下'], core: '担太多了，挑能放下的放下。', upright: '推完最后一程。', reversed: '该求助了。', advice: '别把自己当唯一节点。', action: '今天把一件压在你身上的事委托出去。' },
    11: { keywords: ['新鲜热情','信使','试水'], core: '一个新机会的先锋牌。', upright: '适合试一下新事。', reversed: '三分钟热度。', advice: '试，但定一个 deadline。', action: '今天试一个新工具或新做法 30 分钟。' },
    12: { keywords: ['冲','直接','快进'], core: '直球出击型，速度优先。', upright: '适合主动联系、提案。', reversed: '小心鲁莽。', advice: '出手前 60 秒 sanity check。', action: '今天主动 ping 一个你最近想找的人。' },
    13: { keywords: ['稳热','感染力','统筹'], core: '热度可控，能带动别人。', upright: '适合做组织者。', reversed: '小心控制欲。', advice: '点燃别人但不要替他烧。', action: '在一个小群里发起一次推动。' },
    14: { keywords: ['领导','远见','决断'], core: '有底气拍板。', upright: '适合做关键决定。', reversed: '专横。', advice: '听一句反对意见再拍板。', action: '把一个悬着的决策今天拍下来。' }
  },
  cups: {
    1: { keywords: ['情感涌起','新关系','灵感'], core: '心打开了一道口。', upright: '适合释放感受。', reversed: '情绪堵着。', advice: '允许自己被打动。', action: '今天对一个人说一句不绕弯的感谢。' },
    2: { keywords: ['连接','对等','共鸣'], core: '两个人开始对齐。', upright: '适合修复关系。', reversed: '一头热。', advice: '看对方是否在同一频段。', action: '约一个一对一的认真聊。' },
    3: { keywords: ['同庆','友情','圈子'], core: '共同分享带来加成。', upright: '适合社交。', reversed: '社交损耗。', advice: '在好的圈子里花时间。', action: '今天约一个让你能放松的人。' },
    4: { keywords: ['倦怠','审视','静水'], core: '已经有的看腻了，可能错过新的。', upright: '适合反思。', reversed: '走出停滞。', advice: '别忽视眼前的好。', action: '写下三件已经拥有但没认真感谢的事。' },
    5: { keywords: ['失去','遗憾','转身'], core: '失去的看清，剩下的才不会忽略。', upright: '允许难过。', reversed: '开始放下。', advice: '哀悼之后看身后还有什么。', action: '把一件遗憾说出口或写下来。' },
    6: { keywords: ['回忆','情谊','旧友'], core: '过去的能量回来给你养分。', upright: '适合回顾、联系旧友。', reversed: '别困在过去。', advice: '从过去取力量但不停在那里。', action: '联系一个很久没说话的旧朋友。' },
    7: { keywords: ['幻象','选择困难','理想'], core: '机会一堆但要分清真假。', upright: '小心眼花缭乱。', reversed: '开始落地。', advice: '只做能写在纸上的那一种。', action: '把脑里 5 个想法砍到 1 个。' },
    8: { keywords: ['离开','寻找','长程'], core: '为了更远的东西，离开当下舒适。', upright: '适合主动转身。', reversed: '逃避而非选择。', advice: '走，要带着方向。', action: '退出一个不再值得的群 / 项目。' },
    9: { keywords: ['满足','心愿','果实'], core: '愿望成真型，享受它。', upright: '适合奖赏自己。', reversed: '满足容易变贪。', advice: '收获时记得感恩。', action: '今天给自己一个小奖励，不带罪恶感。' },
    10: { keywords: ['圆满','家庭','归属'], core: '关系层面的安稳。', upright: '适合维护家与家人。', reversed: '形式和睦实质疏远。', advice: '把表面温度变成真实连接。', action: '陪家人或重要的人吃一顿没手机的饭。' },
    11: { keywords: ['敏感','艺术','直觉'], core: '感性的小信使。', upright: '适合创作和表达。', reversed: '过度敏感。', advice: '把情绪转成作品。', action: '把今天的一个感觉写成一段文字或一张图。' },
    12: { keywords: ['浪漫','邀请','理想'], core: '带着情绪的提议。', upright: '适合表达心意。', reversed: '飘忽不靠谱。', advice: '浪漫可以，落实优先。', action: '把一个心意配上具体安排。' },
    13: { keywords: ['共情','成熟','照顾'], core: '稳定的情感容器。', upright: '适合做倾听者。', reversed: '情感越界。', advice: '共情但保留边界。', action: '认真听一个朋友说话不打断。' },
    14: { keywords: ['情商','把控','深度'], core: '懂情绪也能管理它。', upright: '适合主导关系节奏。', reversed: '情绪操控。', advice: '把情商用在合作上。', action: '在一次紧张对话里主动降温。' }
  },
  swords: {
    1: { keywords: ['想清','破局','一刀'], core: '思路一旦劈开，就能下手。', upright: '适合做关键决策。', reversed: '想了但下不去手。', advice: '把决定写成一句话。', action: '把一个悬而未决的判断写成 yes 或 no。' },
    2: { keywords: ['僵局','回避','蒙眼'], core: '不看不代表没事。', upright: '暂停以便看清。', reversed: '该睁眼了。', advice: '逼自己看一眼回避的事。', action: '今天只做一个你一直绕开的决定。' },
    3: { keywords: ['伤心','背叛感','清创'], core: '痛要先承认才能愈合。', upright: '允许难受。', reversed: '伤口在结痂。', advice: '别假装没事。', action: '把一件让你难过的事讲给可信任的人。' },
    4: { keywords: ['休整','静养','清空'], core: '战斗暂停，恢复要紧。', upright: '适合休息。', reversed: '强撑会更差。', advice: '把"再坚持一下"换成"先停一下"。', action: '今天提前 1 小时停止工作。' },
    5: { keywords: ['冲突','胜负空','面子'], core: '赢了面子可能输了关系。', upright: '小心皮洛斯式胜利。', reversed: '从冲突里抽离。', advice: '不需要每场都赢。', action: '今天主动让一个无关紧要的争论。' },
    6: { keywords: ['过渡','搬离','重整'], core: '从风暴里慢慢移到平静水域。', upright: '适合做迁移。', reversed: '搬不动。', advice: '一段一段过，不一口气。', action: '清理一件长期想搬走但没搬的事。' },
    7: { keywords: ['策略','取舍','偷渡'], core: '会用巧劲，但要看是否光明。', upright: '适合战术取舍。', reversed: '别绕得过头。', advice: '不损人不绕路。', action: '把一件你想省事的做法摆到桌面上看是否能见光。' },
    8: { keywords: ['困局','自缚','视角'], core: '绳子其实是自己绑上的。', upright: '看清困局来源。', reversed: '开始解开。', advice: '问"如果没人禁止，你会怎么做"。', action: '今天做一件你"以为不能做"的小事。' },
    9: { keywords: ['焦虑','失眠','放大'], core: '黑夜里的思维比白天暗 10 倍。', upright: '焦虑被夸大了。', reversed: '正在缓解。', advice: '别在凌晨做决定。', action: '把焦虑写成清单留到白天再看。' },
    10: { keywords: ['崩盘','结束','重启'], core: '最坏的发生过了，反而能起来。', upright: '到底是新的开始。', reversed: '快从灰里站起。', advice: '让结束彻底，不要半生不死。', action: '宣布一件早该结束的事正式结束。' },
    11: { keywords: ['好奇','观察','直白'], core: '锐利但还嫩。', upright: '适合提问、探查。', reversed: '说话伤人。', advice: '直接但带温度。', action: '今天问一个你一直没问出口的问题。' },
    12: { keywords: ['冲动','果决','急速'], core: '说做就做，但容易过头。', upright: '适合斩钉截铁。', reversed: '别冲昏头。', advice: '快但留一手退路。', action: '在一件事上立刻给出最直接的答复。' },
    13: { keywords: ['理智','客观','清晰'], core: '冷静读懂局势。', upright: '适合做仲裁。', reversed: '冷漠。', advice: '保持距离不等于无情。', action: '把一件情绪化的事重写成事实陈述。' },
    14: { keywords: ['权威','真相','规则'], core: '该硬的时候要硬。', upright: '适合定规矩。', reversed: '滥权。', advice: '用真理而非权位说话。', action: '在一个模糊地带定一条明确规则。' }
  },
  pentacles: {
    1: { keywords: ['新机','落地','务实'], core: '一颗实在的种子。', upright: '适合开个小项目。', reversed: '机会被忽视。', advice: '把机会写成计划。', action: '把一个想法做成最小可执行版本。' },
    2: { keywords: ['平衡','双线','灵活'], core: '同时托住两件事。', upright: '适合多线并行。', reversed: '顾此失彼。', advice: '别把两件都搞砸。', action: '今天给两件并行的事各排一个时间块。' },
    3: { keywords: ['协作','工艺','打磨'], core: '团队配合出活。', upright: '适合分工。', reversed: '配合不顺。', advice: '把任务对齐到角色。', action: '把一件事的责任拆给具体的人。' },
    4: { keywords: ['守财','安全感','囤'], core: '守住没问题，但要看代价。', upright: '适合稳定。', reversed: '过度守。', advice: '安全感不能压过流动。', action: '把一笔停滞的资源 / 时间释放出去。' },
    5: { keywords: ['匮乏','寒冬','寻援'], core: '看似断粮但门是开的。', upright: '别独自硬扛。', reversed: '寒冬过去。', advice: '主动求援不丢人。', action: '今天向一个人开口要一次帮助。' },
    6: { keywords: ['给予','互助','流动'], core: '资源在不同人之间流转才活。', upright: '适合分享。', reversed: '不公平的给。', advice: '给的同时确认对方在一个平台。', action: '今天主动给出一个小帮助。' },
    7: { keywords: ['评估','耐心','长线'], core: '种下的不会立刻开花。', upright: '适合检视进度。', reversed: '太急放弃。', advice: '把节奏拉长一点。', action: '把一件想立刻看到结果的事推迟一周。' },
    8: { keywords: ['专注','打磨','复盘'], core: '一遍遍打磨直到熟练。', upright: '适合练手艺。', reversed: '机械重复。', advice: '把重复变成升级。', action: '今天把一件做过 10 次的事再做一次但留一个小改进。' },
    9: { keywords: ['自足','优雅','独立'], core: '自己给自己 OK。', upright: '适合独立完成。', reversed: '孤立。', advice: '自足不等于隔离。', action: '为自己做一件平常不舍得做的事。' },
    10: { keywords: ['传承','家底','结构'], core: '长期累积换来稳定的底盘。', upright: '适合做长期投资。', reversed: '形式很大实里空。', advice: '把家底当系统经营。', action: '今天为长期 5 年的事投入 30 分钟。' },
    11: { keywords: ['学徒','勤勉','起步'], core: '愿意从基本功做起。', upright: '适合学新东西。', reversed: '三天打鱼。', advice: '盯一个领域不要换。', action: '今天在一个领域学 30 分钟。' },
    12: { keywords: ['稳进','可靠','耐力'], core: '不快但走得到。', upright: '适合长跑型任务。', reversed: '太慢。', advice: '稳但每天有进度。', action: '今天对长期项目交一个小成果。' },
    13: { keywords: ['滋养','务实','照顾'], core: '把生活和工作都打理稳。', upright: '适合做守家人。', reversed: '只顾物质。', advice: '兼顾身体和情感。', action: '今天为身体或家做一件具体的事。' },
    14: { keywords: ['富足','商业','积累'], core: '有把生意做长的能力。', upright: '适合谈合作 / 议价。', reversed: '只看钱。', advice: '把财务和价值挂钩。', action: '盘一次下个月的现金流和重点开销。' }
  }
};

const COURT_NAMES = ['', '', '', '', '', '', '', '', '', '', '', '侍', '骑士', '后', '王']; // 11..14
const NUM_NAMES_ZH = ['', 'A', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

function buildMinor(suit: TarotSuit, suitZh: string, suitEmoji: string, num: number): TarotCardData {
  const reading = MINOR_READINGS[suit][num];
  const isCourt = num >= 11;
  const numLabel = isCourt ? COURT_NAMES[num] : NUM_NAMES_ZH[num];
  const enNum = isCourt
    ? ['Page', 'Knight', 'Queen', 'King'][num - 11]
    : ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'][num - 1];
  const enSuit = { wands: 'Wands', cups: 'Cups', swords: 'Swords', pentacles: 'Pentacles' }[suit];
  const id = 22 + (['wands', 'cups', 'swords', 'pentacles'].indexOf(suit)) * 14 + (num - 1);
  return {
    id,
    name: `${suitZh}${numLabel}`,
    en: `${enNum} of ${enSuit}`,
    emoji: suitEmoji,
    arcana: 'minor',
    suit,
    number: num,
    ...reading
  };
}

export const MINOR_ARCANA: TarotCardData[] = SUITS.flatMap(s =>
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(n => buildMinor(s.key, s.zh, s.emoji, n))
);

export const TAROT_RWS_78: TarotCardData[] = [...MAJOR_ARCANA, ...MINOR_ARCANA];
