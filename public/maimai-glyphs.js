/**
 * 官方结算素材拼字：CLEAR! / TRACK / 段位字母 / 大数字。
 *
 * 页面上这些原本是 CSS 画的花体字，形似但终归不是官方的。客户端里这几样都有现成精灵，
 * 尺寸和配色都是官方那套，这里只负责把格子拼成词，交给调用方塞进页面。
 *
 * 几个只看文件名读不出来的地方（都是对着抓图核过的）：
 *   · CLEAR! 是六个字母精灵，有 01/02/03 三套配色；抓图那套是 _01_（白字 + 蓝描边）
 *   · 段位没有 SS/SSS，是用 S 的颜色变体拼的：三个 S 就是 Blue/Red/Yellow
 *   · 大数字用分数那套金色精灵，格子号 0-9 是数字，10='+'、11='-'、12='/'、13='.'
 *   · '%' 是单独一张 UI_RSL_Score_Per_Gold
 */

const ASSETS = '/assets/mm-result/';
const RANK_LETTERS = new Set(['S', 'A', 'B', 'C', 'D']);

/** 大数字可选的四套配色，和客户端里的族名一致 */
export const NUMBER_COLOURS = ['Gold', 'Red', 'Blue', 'Base'];
/** 数字的两套图集：同一字体的两个尺寸，1110000 是大号 */
export const NUMBER_ATLASES = ['1110000', '0001111'];

/** 大数字的格子号：和 layout 里的编号一致 */
const DIGIT_CELL = { ...Object.fromEntries([...'0123456789'].map((c, i) => [c, i])), '+': 10, '-': 11, '/': 12, '.': 13 };

/**
 * 小数点的坑号**不是每族都一样**，这是逐族比字形才看出来的：
 * 0001111_Red 的 12/13 是反的（13 画的是逗号，12 才是小数点）。其余族都是 13。
 * 只影响小数点，数字 0~9 各族的坑号一致。
 */
const DOT_CELL = { Red: 12 };

function glyph(file, { className = '', height = '' } = {}) {
  const img = document.createElement('img');
  img.className = 'mm-glyph' + (className ? ' ' + className : '');
  img.src = ASSETS + file;
  img.alt = '';
  img.decoding = 'async';
  if (height) img.style.height = height;
  return img;
}

/** CLEAR! —— 六个字母精灵；抓图用的是 _01_ 那套配色 */
export function clearWord({ variant = '01' } = {}) {
  const word = document.createElement('span');
  word.className = 'mm-clear-word';
  for (let i = 1; i <= 6; i += 1) word.append(glyph(`UI_RSL_Text_Clear_${variant}_${String(i).padStart(2, '0')}.png`));
  return word;
}

/** TRACK —— 官方就一张图。prefab 里 UI_Track 是 93x30 抓图 = 112x36 原生，
    素材 UI_RSL_Text_TRACK 正好 110x36，所以是按原生尺寸贴的。 */
export function trackLabel() {
  const label = document.createElement('span');
  label.className = 'mm-track-label';
  label.append(glyph('UI_RSL_Text_TRACK.png'));
  return label;
}

/**
 * 轨道号码（"03"）。
 *
 * 官方不是写文字，是【数字精灵】+【同位的一块实心白块】两层：
 *   prefab: TrackNumber/UI_Track/NUM_TrackNumber          UI_CMN_Num_26p_N         50x28 抓图
 *           TrackNumber/UI_Track/NUM_TrackNumber_Outline  UI_CMN_Num_26p_Outline_N 50x28 抓图（同位）
 *   反编译: KOP_ResultTrackData 里 `_trackNoImages[0].ChangeSprite(trackNumber)`
 *           —— _trackNoImages 是数组，每个元素显示一位数字
 *
 * ⚠️ 那个 Outline **不是描边图，是一整块实心白**（实测不透明 56.8%，ASCII 是一片白）。
 *    它靠 MultipleImage 的 Subtract 混合（MultiImageBlendType.Subtract / _BlendOp=2）
 *    去"减掉"周围做镂空，**不能当普通图层叠上去** —— 叠上去数字会被整块盖住变全白。
 *    所以这里只画数字，描边用 CSS drop-shadow 近似；等解出 Subtract 的真实参数再换。
 * 数字本身是白色，这里按像素尺寸从 prefab 推：容器 60x34 原生放两位 => 每格 30x34 原生。
 */
export function trackNumber(value) {
  const row = document.createElement('span');
  row.className = 'mm-track-num';
  for (const ch of String(value)) {
    if (!/[0-9]/.test(ch)) continue;
    const cell = document.createElement('span');
    cell.className = 'mm-track-digit';
    cell.append(glyph(`UI_CMN_Num_26p_${ch}.png`, { className: 'mm-glyph mm-track-face' }));
    row.append(cell);
  }
  return row;
}

/**
 * 段位：从 D 到 SSS+。
 *
 * 官方只有 D/C/B/A/S 五张**单字**精灵，多字母的段位是重复拼出来的（SS/SSS、AA/AAA、BB/BBB）。
 * S 另有 Blue/Red/Yellow 三个配色：**三个 S 用主色 + Blue + Red，少于三个用 Yellow**
 * （客户端里就是这么配的）。末尾带 + 时补一张 UI_RSL_Rank_Plus。
 *
 * 注意：名字里带 _White 的那几张**不是白字**，是段位动画的碎裂特效，别拿来当字母用。
 */
export function rankWord(rank) {
  const word = document.createElement('span');
  word.className = 'mm-rank-word';
  const raw = String(rank ?? '').toUpperCase();
  const plus = raw.endsWith('+');
  const letters = raw.replace(/\+$/, '');
  if (!letters || ![...letters].every((c) => RANK_LETTERS.has(c))) {
    // 认不出来的段位（例如 AC）原样显示，至少不会画错
    word.textContent = String(rank ?? '');
    return word;
  }
  const files = letters === 'SSS'
    ? ['UI_RSL_Rank_S.png', 'UI_RSL_Rank_S_Blue.png', 'UI_RSL_Rank_S_Red.png']
    : [...letters].map((letter) => letter === 'S'
        ? 'UI_RSL_Rank_S_Yellow.png'
        : `UI_RSL_Rank_${letter}.png`);
  // ⭐ 多字母段位里，后面的字母比第一个小 —— 这是官方的排法，不是等大重复。
  //    量官方预制整图（UI_GAM_Rank_*）的内容宽度：
  //      A  单字 35  | AA 58 | AAA 82     => AAA 只有 3x35 的 78%
  //      B  单字 30  | BB 52 | BBB 75     => BBB 只有 3x30 的 83%
  //      S  单字 30  | SS 58 | SSS 85     => SSS 是 3x30 的 94%（基本等大）
  //    所以 A/B 族的第 2 个起缩到 0.72，S 族保持等大。
  const smallTail = letters[0] === 'A' || letters[0] === 'B';
  files.forEach((file, i) => {
    const cls = 'mm-rank-letter' + (smallTail && i > 0 ? ' mm-rank-letter-sm' : '');
    word.append(glyph(file, { className: cls }));
  });
  if (plus) word.append(glyph('UI_RSL_Rank_Plus.png', { className: 'mm-rank-plus' }));
  return word;
}

/**
 * 大数字：'98.7654' 或 '100.1445%'。
 *
 * 官方这套排法和普通文字排版不一样，是**两套图集混排**（对着抓图核过）：
 *   · 整数部分用大号图集 1110000（格子 72x98，字形 103 原生）
 *   · 小数点和小数部分用小号图集 0001111（格子 62x82，字形 83 原生）
 *   · '%' 用单独的 UI_RSL_Score_Per_*（58x54）
 * 三者的格子**底边对齐**，所以整行共用一条基线；缩放比 98 : 82 : 54。
 *
 * 配色由达成率决定：< 80 蓝、>= 97 金、其余红。
 */
export function scoreNumber(text, { colour = 'Gold' } = {}) {
  const row = document.createElement('span');
  row.className = 'mm-number';
  const value = String(text);
  const dot = value.indexOf('.');
  const whole = dot === -1 ? value.replace('%', '') : value.slice(0, dot);
  const fraction = dot === -1 ? '' : value.slice(dot + 1).replace('%', '');
  const hasPercent = value.endsWith('%');
  // '%' 只有 Gold/Red/Blue 三个变体，没有 Base，缺的落到 Gold
  const percentColour = ['Gold', 'Red', 'Blue'].includes(colour) ? colour : 'Gold';

  const digit = (ch, cls) => {
    const cell = ch === '.' ? (DOT_CELL[colour] ?? DIGIT_CELL['.']) : DIGIT_CELL[ch];
    if (cell === undefined) return null;
    const atlas = cls === 'mm-number-int' ? '1110000' : '0001111';
    return glyph(`UI_NUM_Score_${atlas}_${colour}_${cell}.png`, { className: 'mm-glyph ' + cls });
  };

  for (const ch of whole) {
    const img = digit(ch, 'mm-number-int');
    if (img) row.append(img);
  }
  if (fraction) {
    const point = digit('.', 'mm-number-frac');
    if (point) row.append(point);
    for (const ch of fraction) {
      const img = digit(ch, 'mm-number-frac');
      if (img) row.append(img);
    }
  }
  if (hasPercent) row.append(glyph(`UI_RSL_Score_Per_${percentColour}.png`, { className: 'mm-glyph mm-number-percent' }));
  return row;
}

/** 达成率对应哪套配色：< 80 蓝、>= 97 金、其余红 */
export function achievementColour(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'Gold';
  if (number >= 97) return 'Gold';
  if (number < 80) return 'Blue';
  return 'Red';
}
