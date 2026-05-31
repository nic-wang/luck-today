/**
 * 家庭成员档案 · 命理今日 & 家庭看板共享
 *
 * 加载方式：<script src="lib/members.js"></script>（在 relations.js / app.js 之前）
 * 暴露：window.MEMBERS · window.MEMBER_ORDER
 *
 * 字段说明：
 *   - 身份：id / name / alias / emoji / photo / photoPos / role
 *   - 主题色：color（主色）/ colorBg（淡底）
 *   - 命理档案：
 *       birth（人类可读）/ birthDate（YYYY-MM-DD · 程序用）/ birthHour（24h · 人才有）/ gender
 *       bazi / zodiac / wuxing / yong / mainWuxing
 *   - 展示：chips / highlight
 *   - 签到挑战池（仅人）：challenges
 *
 * photo 路径约定：**相对仓库根**（不带 ../）
 *   - index.html 在根目录，直接用 m.photo 即可
 *   - family/index.html 在子目录，用 '../' + m.photo
 *   （用 window.MEMBER_PHOTO(m) helper 避免手拼）
 *
 * mainWuxing 备注：
 *   人的 mainWuxing 可以自动推（日干五行），但宠物部分只有 2 柱 / 无日柱，
 *   无法自动推 → 保留手填。保留字段统一交互也更简单。
 */

(function (root) {
  'use strict';

  const MEMBERS = {
    niu: {
      id: 'niu', name: '牛牛', alias: '王宁',
      emoji: '人', color: '#5C8A6B', colorBg: '#E2EDE5',
      photo: 'assets/photos/牛牛-像素图.jpg',
      photoPos: 'center center',
      role: '人 · 主理',
      // 命理
      birth: '1989-05-15 未时',
      birthDate: '1989-05-15',
      birthHour: 14,
      gender: '男',
      bazi: '己巳·己巳·乙亥·癸未',
      zodiac: '蛇',
      wuxing: '乙木',
      yong: '水',
      mainWuxing: '木',
      chips: ['乙木', '用神水', '蛇', '驿马已激活'],
      highlight: '乙木藤蔓 · 初夏巳月炎燥 · 火旺土重木弱金严重不足 · 用神水调候 · 当前乙丑积累期（2022-2031）· 2032 甲子大爆发',
      challenges: [
        { tag: '事业', text: '今天主动向一位同事请教一个具体问题，记录在备忘里' },
        { tag: '财运', text: '今天记录所有支出，找出 1 笔可以省下的' },
        { tag: '健康', text: '今天做 10 分钟拉伸，把肩颈放松一次' },
        { tag: '社交', text: '给一位 30 天没联系的朋友发个问候' },
        { tag: '学习', text: '看 1 篇高质量长文，提取 3 个要点' }
      ]
    },
    xixi: {
      id: 'xixi', name: '嘻嘻', alias: '郭玉玺',
      emoji: '人', color: '#C9A26B', colorBg: '#F5EBD8',
      photo: 'assets/photos/嘻嘻-像素图.jpg',
      photoPos: 'center center',
      role: '人 · 主出镜',
      birth: '1999-06-03 亥时',
      birthDate: '1999-06-03',
      birthHour: 22,
      gender: '女',
      bazi: '己卯·己巳·丙戌·己亥',
      zodiac: '兔',
      wuxing: '丙火',
      yong: '水',
      mainWuxing: '火',
      chips: ['丙火', '用神水', '兔', '巳月帝旺'],
      highlight: '丙火太阳 · 巳月帝旺身强 · 用神水调候制旺火 · 紫微财帛太阳+巨门 · 2027 文昌黄金年 · 2031 辛亥留学窗',
      challenges: [
        { tag: '形象', text: '今天搭一身让自己满意的造型，自拍存档' },
        { tag: '社交', text: '今天给一位喜欢的家人/朋友寄一句感谢' },
        { tag: '心情', text: '今天写 3 件让自己开心的小事' },
        { tag: '学习', text: '今天背 5 个英语长句' },
        { tag: '健康', text: '今天喝够 1.5 升水，睡前不刷手机 30 分钟' }
      ]
    },
    paopao: {
      id: 'paopao', name: '泡泡', alias: '黄条条 · 条条',
      emoji: '猫', color: '#A8C4D6', colorBg: '#E8F0F5',
      photo: 'assets/photos/泡泡-像素图.png',
      photoPos: 'center center',
      role: '田园橘猫',
      birth: '2021-04-16',
      birthDate: '2021-04-16',
      bazi: '辛丑·壬辰',
      zodiac: '牛',
      wuxing: '辛金 + 壬水',
      yong: '—',
      mainWuxing: '水',
      chips: ['辛金', '壬水', '牛', '丙辛合水'],
      highlight: '辛金生壬水 · 名字带水气 · 与嘻嘻产生"丙辛合水" · 全家唯一合化关系 · 嘻嘻命理专属化合搭子'
    },
    dandan: {
      id: 'dandan', name: '蛋蛋', alias: '曼基康深灰',
      emoji: '猫', color: '#6B8FA8', colorBg: '#DCE6EE',
      photo: 'assets/photos/蛋蛋-像素图.jpg',
      photoPos: 'center center',
      role: '柯基猫 · 实际最大',
      birth: '2020-07-26',
      birthDate: '2020-07-26',
      bazi: '庚子·癸未',
      zodiac: '鼠',
      wuxing: '庚金 + 子癸双水',
      yong: '—',
      mainWuxing: '水',
      chips: ['庚金', '子+癸双水', '鼠', '水库'],
      highlight: '全家最强水库 · 庚子双水（子+癸）+ 庚金生水 = 直接补水到顶 · 与牛牛"乙庚合金"加固结构 · 5y9m · 家里实际最大'
    },
    xiaowu: {
      id: 'xiaowu', name: '小五', alias: '金渐层',
      emoji: '猫', color: '#92B884', colorBg: '#E0EBD8',
      photo: 'assets/photos/小五-像素图.png',
      photoPos: 'center center',
      role: '金渐层短毛',
      birth: '2022-03-09',
      birthDate: '2022-03-09',
      bazi: '壬寅·癸卯',
      zodiac: '虎',
      wuxing: '壬癸双水 + 寅卯双木',
      yong: '—',
      mainWuxing: '水',
      chips: ['壬癸双水', '寅卯木', '虎', '挚友'],
      highlight: '命理"灌溉神器" · 水木顶配 · 壬寅+癸卯 · 与牛牛乙木同类共振 + 双水滋润 = 牛牛命理挚友 · 嘻嘻的灭火解药'
    },
    xiaomiji: {
      id: 'xiaomiji', name: '小米鸡', alias: '糯米鸡 · 绿和尚',
      emoji: '鸟', color: '#C8B870', colorBg: '#F0EBD0',
      photo: 'assets/photos/糯米鸡-像素图.png',
      photoPos: 'center center',
      role: '绿和尚鹦鹉',
      birth: '2026-03-05',
      birthDate: '2026-03-05',
      bazi: '丙午·庚寅',
      zodiac: '马',
      wuxing: '丙午双火 + 庚金 + 寅木',
      yong: '—',
      mainWuxing: '火',
      chips: ['丙午双火', '马', '幼鸟期', '火警'],
      highlight: '全家最火 · 丙午年柱 + 寅木助火 · 名字"糯米鸡（水土金）"反向补救火气 · 幼鸟期说话黄金训练窗'
    }
  };

  const MEMBER_ORDER = ['niu', 'xixi', 'paopao', 'dandan', 'xiaowu', 'xiaomiji'];

  // index.html 里 USERS 的 accent 字段兼容（保留 color+bg 别名 · 避免 app.js 里大量改字段名）
  Object.values(MEMBERS).forEach(m => {
    m.accent = { color: m.color, bg: m.colorBg };
    // 兼容 luck-engine.compute() 期望的 year/month/day/hour
    if (m.birthDate) {
      const [y, mo, d] = m.birthDate.split('-').map(Number);
      m.year = y;
      m.month = mo;
      m.day = d;
      if (m.birthHour !== undefined) m.hour = m.birthHour;
    }
  });

  root.MEMBERS = MEMBERS;
  root.MEMBER_ORDER = MEMBER_ORDER;

  /**
   * 给 family 子目录用的 photo 辅助：
   *   MEMBER_PHOTO(member)  → 返回相对当前页面的 photo 路径
   *   根据页面位置自动加 ../ 前缀
   */
  root.MEMBER_PHOTO = function (member) {
    if (!member || !member.photo) return null;
    // 判断当前页面在子目录还是根：URL 含 '/family/' → 需要回退 '../'
    const inSubdir = typeof location !== 'undefined' && location.pathname.includes('/family/');
    return inSubdir ? '../' + member.photo : member.photo;
  };

})(typeof window !== 'undefined' ? window : globalThis);
