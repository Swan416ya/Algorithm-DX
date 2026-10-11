/**
 * maimai 官网皮肤的三件小事：深色模式开关、移动端菜单开关、回到顶部。
 *
 * 只做这一层需要的行为，不碰 app.js 的数据逻辑；无依赖、原生 ESM。
 *
 * 深色模式：
 *   · 主题落在 <html data-mm-theme="light|dark">，首屏由各页 <head> 里的一小段脚本先定好，
 *     这里只负责开关、记忆（localStorage）和把主题转告背景 iframe。
 *   · 背景是 iframe 里的官方动态页，换主题不重载它，改发 postMessage 就地换贴图，
 *     官方那套入场动画不会重播。
 */

const THEME_KEY = 'mm-theme';

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

function storedTheme() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

const currentTheme = () => (document.documentElement.dataset.mmTheme === 'dark' ? 'dark' : 'light');

const bgFrame = document.querySelector('.mm-bg-frame');

function tellBackground(theme) {
  if (!bgFrame || !bgFrame.contentWindow) return;
  // 背景页认的是 night/day 两个词（见 bg.html 的 message 监听）
  bgFrame.contentWindow.postMessage({ mmTheme: theme === 'dark' ? 'night' : 'day' }, location.origin);
}

function applyTheme(theme, { remember = true, notify = true } = {}) {
  document.documentElement.dataset.mmTheme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelectorAll('.brand .mark').forEach((mark) => {
    mark.src = theme === 'dark' ? '/algorithm-dx-icon.svg' : '/algorithm-dx-icon-light.svg';
  });
  const button = document.getElementById('mmThemeBtn');
  if (button) {
    button.setAttribute('aria-checked', String(theme === 'dark'));
    button.title = theme === 'dark' ? '切换到浅色模式' : '切换到深色模式';
  }
  if (remember) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* 隐私模式下写不进去就算了，当次会话照样能用 */
    }
  }
  if (notify) tellBackground(theme);
}

// 首屏脚本已经定过主题，这里补齐图标/开关状态，并把主题同步给背景
applyTheme(storedTheme() ?? (prefersDark() ? 'dark' : 'light'), { remember: false });

const themeBtn = document.getElementById('mmThemeBtn');

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  });
}

// 用户没手动选过时，跟随系统切换
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  if (!storedTheme()) applyTheme(event.matches ? 'dark' : 'light', { remember: false });
});

// iframe 的 src 放在 data-src 里，这里按当前主题挂上（深色直接带 ?night=1，
// 免得先亮后暗地闪一下）；之后切换主题只发消息，不重载，官方入场动画不会重播。
if (bgFrame) {
  const baseSrc = bgFrame.getAttribute('data-src') || '/vendor/maimai/bg.html';
  if (!bgFrame.getAttribute('src')) {
    bgFrame.setAttribute('src', currentTheme() === 'dark' ? `${baseSrc}?night=1` : baseSrc);
  }
  bgFrame.addEventListener('load', () => tellBackground(currentTheme()));
}

const menuBtn = document.getElementById('mmMenuBtn');

if (menuBtn) {
  const setOpen = (open) => {
    document.body.classList.toggle('mm-menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  };
  menuBtn.addEventListener('click', () => setOpen(!document.body.classList.contains('mm-menu-open')));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
  // 菜单里点走一项就收起来，否则新页面加载前会停在展开态
  document.querySelectorAll('.site-header .nav a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });
}

const topLink = document.querySelector('.mm-top');

if (topLink) {
  const sync = () => topLink.classList.toggle('off', window.scrollY < 600);
  sync();
  window.addEventListener('scroll', sync, { passive: true });
  topLink.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}