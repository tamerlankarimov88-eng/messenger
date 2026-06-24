'use strict';
/* ═══════════════════════════════════════════════════════
   КОРПОРАТИВНЫЙ ЧАТ — app.js v6.0
   Telegram-style · instant WS · saved messages · resizable
═══════════════════════════════════════════════════════ */
const API = location.origin + '/api';
let ME = null, NET = null, ACTIVE = null;
let OPEN_SEQ = 0;  // guards async message loads when switching chats quickly
let CHATS = [], GROUPS = [], SEARCH_RES = [], UNREAD = {}, PINS = new Set(), FOLDERS = {}, CUR_FOLDER = 'Все';
let CHAT_ORDERS = {};
const REACT_CACHE = new Map();
let FS = 16, SOUND = true;
let AUTH_PHONE = '', PENDING = null;
let selGM = new Set(), selGE = '👥', selGAvB64 = null, myAvB64Pending = null;
let REPLY = null;
let EDITING = null;  // message currently being edited inline
let STAGED = [];  // staged attachments awaiting caption/send (max 12)
const MAX_ATTACH = 12;
let _baseTitle = (typeof document !== 'undefined' ? document.title : '');
let vRec = null, vChunks = [], vTimer = null, vSec = 0, vAnim = null;
let SEARCH_Q = '';
let TYPING_TIMER = null, IS_TYPING = false;
let UNREAD_FILTER = false;
let DRAFTS = {};
let CHAT_THEME = 'classic';
let CHAT_BG_IMAGE = '';
const CHAT_THEMES = [
  { id: 'classic', name: 'Классика', bg: '#0E1621', out: '#2B5278', outT: '#FFFFFF', in: '#182533', inT: '#FFFFFF', acc: '#3390EC' },
  { id: 'night', name: 'Ночь', bg: '#05070C', out: '#2B5278', outT: '#FFFFFF', in: '#17212B', inT: '#FFFFFF', acc: '#3390EC' },
  { id: 'marine', name: 'Морская', bg: '#5790AF', out: '#EFFEDD', outT: '#000000', in: '#FFFFFF', inT: '#000000', acc: '#2481CC' },
  { id: 'forest', name: 'Лес', bg: '#324F38', out: '#49745A', outT: '#FFFFFF', in: '#253628', inT: '#FFFFFF', acc: '#4FA74F' },
  { id: 'day', name: 'День', bg: '#748B77', out: '#EFFEDD', outT: '#000000', in: '#FFFFFF', inT: '#000000', acc: '#58A349' },
  { id: 'purple', name: 'Сирень', bg: '#2D2131', out: '#773E85', outT: '#FFFFFF', in: '#342638', inT: '#FFFFFF', acc: '#903896' },
  { id: 'coral', name: 'Коралл', bg: '#9E5656', out: '#FFB7B7', outT: '#000000', in: '#FFFFFF', inT: '#000000', acc: '#E17055' },
  { id: 'neon', name: 'Неон', bg: '#120918', out: '#8774E1', outT: '#FFFFFF', in: '#211627', inT: '#FFFFFF', acc: '#8774E1' },
  { id: 'mint', name: 'Мята', bg: '#83AFAD', out: '#EFFFDE', outT: '#000000', in: '#FFFFFF', inT: '#000000', acc: '#45ADA8' },
  { id: 'sky', name: 'Небо', bg: '#A2C9EA', out: '#E3F2FD', outT: '#000000', in: '#FFFFFF', inT: '#000000', acc: '#3390EC' },
  { id: 'sunset', name: 'Закат', bg: '#6D394C', out: '#F5A962', outT: '#000000', in: '#FFFFFF', inT: '#000000', acc: '#E07A5F' },
  { id: 'mono', name: 'Графит', bg: '#181818', out: '#454545', outT: '#FFFFFF', in: '#242424', inT: '#FFFFFF', acc: '#707579' },
];
// Avatar crop state
let cropImg = null, cropX = 0, cropY = 0, cropScale = 1, cropDragging = false, cropDX = 0, cropDY = 0;
// Folder modal state
let folderEdit = null, folderEmoji = '📁', folderPick = new Set();
// Refresh interval id
let refreshIntervalId = null;

/* ═══ EMOJI DATA ═══ */
const EPC = [
  {i:'😀',e:['😀','😃','😄','😁','😆','😅','😂','🤣','🥲','☺️','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🫣','🤭','🫢','🤫','😶','😐','😑','😬','🙄','😯','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','💩','👻','💀','☠️','👽','👾','🤖']},
  {i:'👋',e:['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅','💪','🦾','👶','🧒','👦','👧','🧑','👨','👩','🧔','👱','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷','👮','🕵️','💂','👷','🤴','👸','👳','👲','🧕','🤵','👰','🤰','🤱','👼','🎅','🤶','🦸','🦹','🧙','🧚','🧛','🧜','🧝','🧞','🧟','💆','💇','🚶','🧍','🧎','🏃','💃','🕺','🧑‍⚕️','🧑‍🎓','🧑‍🏫','🧑‍💻','🧑‍🍳','🧑‍🔧','🧑‍🚀','🧑‍🎤','🧑‍🎨']},
  {i:'❤️',e:['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','💌','💤','💢','💣','💥','💦','💫','🌟','⭐','✨','⚡','🔥','💯']},
  {i:'🐶',e:['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🐺','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🐢','🐍','🦎','🐙','🦑','🦐','🦀','🐠','🐟','🐬','🐳','🦈']},
  {i:'🍏',e:['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🥑','🥦','🥬','🥒','🌶','🌽','🥕','🍞','🥐','🥖','🧀','🥚','🍳','🥞','🧇','🍗','🍖','🌭','🍔','🍟','🍕','🍣','🍱','🧁','🍰','🎂','🍭','🍬','🍫','🍿','☕','🍵','🧃','🥤','🧋','🍺','🍷','🥃']},
  {i:'⚽',e:['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🥊','🥋','🎽','🛹','🏆','🥇','🥈','🥉','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸','🎻','🎲','♟','🎯','🎳','🎮','🎰','🧩']},
  {i:'🚗',e:['🚗','🚕','🚙','🚌','🏎','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🛴','🚲','🛵','🏍','🚀','✈️','🛫','🛬','🛩','💺','🛸','🚁','⛵','🚤','🛥','🛳','🚢','⚓','🗺','🗽','🗼','🏰','🏯','🌋','⛰','🏔','🏕']},
  {i:'💡',e:['💡','🔦','📔','📕','📖','📗','📘','📙','📚','📓','📒','📄','📰','📑','🔖','💰','💵','💳','🧾','✉️','📧','📨','📩','📤','📥','📦','✏️','✒️','🖊','🖌','📝','💼','📁','📂','🗂','📅','📆','📇','📈','📉','📊','📋','📌','📍','📎','🖇','📏','📐','✂️','🔒','🔓','🔑','🔨','⛏','⚒','🛠','⚔️','💻','🖥','⌨️','🖱','💾','💿','📀','📱','📲','☎️','📞','📡','🔋','🔌']},
];
const RP_EMOJIS = ['👍','❤️','😂','🔥','😮','😢','🙏','👎'];
const AV_E = ['😀','😎','🧑‍💻','👨‍🔬','👩‍🏫','🤖','🦾','🚀','🔥','⚡','💡','🎯','🏆','💎','⚙️','🔧','📡','🏭','🎓','✨','🌟','💻','📱','🦊'];
const AV_C = ['#3390EC','#1A5276','#117A65','#6C3483','#1E8449','#2E86C1','#B7950B','#C0392B','#D35400','#1ABC9C','#2980B9','#7D3C98'];
const GP_E = ['👥','🏭','💼','🔬','🎓','⚙️','📡','🚀','💡','🏆','🔐','📊'];
const FOLDER_E = ['📁','💼','👥','⭐','🔥','📌','🏠','🎓','🔬','⚙️','📊','💬','🚀','❤️','✅','🔔'];

/* ═══ INIT ═══ */
document.addEventListener('DOMContentLoaded', () => {
  loadTheme(); loadFont(); loadSound(); loadChatTheme(); loadListWidth(); loadChatOrders();
  const mi = document.getElementById('msg-inp');
  mi.addEventListener('keydown', onKey);
  mi.addEventListener('paste', handlePaste);
  mi.addEventListener('input', () => { onType(); autoGrow(mi); onTypingInput(); saveDraft(); });
  mi.addEventListener('select', updateFmtPop);
  mi.addEventListener('keyup', updateFmtPop);
  mi.addEventListener('mouseup', updateFmtPop);
  mi.addEventListener('scroll', () => hideFmtPop());
  document.getElementById('emoji-btn').addEventListener('click', e => { e.stopPropagation(); toggleEP(); });
  document.getElementById('ep').addEventListener('click', e => e.stopPropagation());
  document.getElementById('a-phone').addEventListener('keydown', e => { if (e.key === 'Enter') stepPhone(); });
  document.getElementById('a-pw-login').addEventListener('keydown', e => { if (e.key === 'Enter') stepLogin(); });
  document.getElementById('a-pw2').addEventListener('keydown', e => { if (e.key === 'Enter') stepRegister(); });
  document.addEventListener('click', () => { hideCtx(); hideEP(); hideRP(); hideFmtPop(); closeSbMenu(); closeAttachMenu(); });
  window.addEventListener('focus', () => { if (!document.hidden) clearTitleBadge(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) clearTitleBadge(); });
  onType();
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (EDITING) { cancelEdit(); return; } if (SELECT_MODE) { exitSelect(); return; } hideCtx(); hideEP(); hideRP(); hideFmtPop(); closeForward(); closeAllModals(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'b' && document.activeElement === mi) { e.preventDefault(); applyFormat('bold'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i' && document.activeElement === mi) { e.preventDefault(); applyFormat('italic'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'u' && document.activeElement === mi) { e.preventDefault(); applyFormat('underline'); }
  });
  window.addEventListener('resize', clampListWidth);
  buildThemePicker();
  initReactPop();

  const saved = sessionStorage.getItem('ap_s') || localStorage.getItem('ap_s_bk');
  if (saved) { try { restoreSession(JSON.parse(saved)); } catch { showAuth(); } }
  else showAuth();
});

function showAuth() {
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('app-screen').style.display = 'none';
  showStep('as-phone');
}
function showStep(id) {
  document.querySelectorAll('.astep').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

/* ═══ CHAT THEMES ═══ */
function hexToRgb(hex) {
  const h = (hex || '').replace('#', '');
  if (h.length !== 6) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function rgbToHex(r, g, b) {
  const c = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
function mixHex(c1, c2, t) {
  const a = hexToRgb(c1), b = hexToRgb(c2);
  if (!a || !b) return c1;
  return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
}
function shadeHex(hex, amt) {
  const c = hexToRgb(hex);
  if (!c) return hex;
  const f = n => Math.max(0, Math.min(255, n + amt));
  return rgbToHex(f(c.r), f(c.g), f(c.b));
}
function relLuminance(hex) {
  const c = hexToRgb(hex);
  if (!c) return 0;
  const lin = v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}
function contrastRatio(fg, bg) {
  const l1 = relLuminance(fg), l2 = relLuminance(bg);
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}
function ensureContrast(fg, bg, min = 4.5) {
  if (!fg || !bg) return fg || '#FFFFFF';
  if (contrastRatio(fg, bg) >= min) return fg;
  return isLightBg(bg) ? '#000000' : '#FFFFFF';
}
function pickMutedText(panelBg, light, min = 4.0) {
  const base = light ? '#000000' : '#FFFFFF';
  for (let mix = 0.3; mix <= 0.82; mix += 0.04) {
    const c = mixHex(base, panelBg, mix);
    if (contrastRatio(c, panelBg) >= min) return c;
  }
  return light ? '#4A4A4A' : '#B0BBC6';
}
function bubbleMetaColors(bubbleBg, accent) {
  const lightBubble = isLightBg(bubbleBg);
  const meta = pickMutedText(bubbleBg, lightBubble, 3.2);
  const tick = pickMutedText(bubbleBg, lightBubble, 2.6);
  const tickDel = pickMutedText(bubbleBg, lightBubble, 3.0);
  let tickRead = accent || '#3390EC';
  if (contrastRatio(tickRead, bubbleBg) < 2.5) tickRead = lightBubble ? shadeHex(tickRead, -24) : mixHex(tickRead, '#FFFFFF', 0.35);
  if (contrastRatio(tickRead, bubbleBg) < 2.5) tickRead = lightBubble ? '#2481CC' : '#53B8F6';
  return { meta, tick, tickDel, tickRead };
}
function ensureBubbleColor(color, chatBg, light, accent) {
  if (contrastRatio(color, chatBg) >= 1.45) return color;
  if (light) return mixHex(accent || color, '#FFFFFF', 0.62);
  return mixHex(accent || color, '#FFFFFF', 0.16);
}
function isLightBg(hex) {
  const c = hexToRgb(hex);
  if (!c) return false;
  return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255 > 0.55;
}
function buildThemePalette(t) {
  const bg = t.bg;
  const light = isLightBg(bg);
  const black = '#000000';
  const white = '#FFFFFF';

  const headBg = light ? mixHex(bg, white, 0.42) : mixHex(bg, white, 0.07);
  const sbBg = light ? mixHex(bg, white, 0.36) : mixHex(bg, white, 0.05);
  const railBg = light ? mixHex(bg, black, 0.14) : mixHex(bg, black, 0.30);
  const bg2 = light ? mixHex(bg, white, 0.52) : mixHex(bg, white, 0.11);
  const bg3 = light ? mixHex(bg, white, 0.60) : mixHex(bg, white, 0.17);
  const bg4 = light ? mixHex(bg, black, 0.10) : mixHex(bg, white, 0.24);
  const searchBg = light ? mixHex(bg, white, 0.58) : mixHex(bg, black, 0.20);
  const hoverBg = light ? mixHex(bg, black, 0.07) : mixHex(bg, white, 0.09);

  let acc = t.acc;
  if (contrastRatio(acc, headBg) < 2.4) acc = light ? shadeHex(acc, -28) : shadeHex(acc, 18);

  let active = acc;
  if (contrastRatio('#FFFFFF', active) < 3.2) active = light ? shadeHex(acc, -32) : mixHex(acc, white, 0.12);

  const inB = ensureBubbleColor(t.in, bg, light, acc);
  const outB = ensureBubbleColor(t.out, bg, light, acc);
  const inT = ensureContrast(t.inT, inB, 4.5);
  const outT = ensureContrast(t.outT, outB, 4.5);
  const t1 = ensureContrast(light ? black : white, headBg, 4.8);
  const t2 = pickMutedText(headBg, light, 4.2);
  const t3 = pickMutedText(headBg, light, 3.0);
  const brd = light ? 'rgba(0,0,0,.14)' : 'rgba(255,255,255,.12)';
  const outMeta = bubbleMetaColors(outB, acc);
  const inMeta = bubbleMetaColors(inB, acc);

  return {
    bg, headBg, sbBg, railBg, bg2, bg3, bg4, searchBg, hoverBg, inB, outB, inT, outT, acc, active, t1, t2, t3, brd, light,
    bubMetaOut: outMeta.meta, bubMetaOutTick: outMeta.tick, bubMetaOutTickDel: outMeta.tickDel, bubMetaOutTickRead: outMeta.tickRead,
    bubMetaInMsg: inMeta.meta,
  };
}
function buildThemePicker() {
  const c = document.getElementById('chat-themes');
  if (!c) return;
  c.innerHTML = '';
  CHAT_THEMES.forEach(t => {
    const card = document.createElement('div');
    card.className = 'chat-theme-card' + (CHAT_THEME === t.id ? ' sel' : '');
    card.title = t.name;
    card.onclick = () => setChatTheme(t.id);
    const p = buildThemePalette(t);
    card.innerHTML =
      `<div class="chat-theme-prev" style="background:${p.bg}">
        <div class="chat-theme-bub" style="background:${p.inB}"></div>
        <div class="chat-theme-bub" style="background:${p.outB}"></div>
      </div>
      <div class="chat-theme-lbl">${esc(t.name)}</div>`;
    c.appendChild(card);
  });
}
function setChatTheme(id, save = true) {
  const t = CHAT_THEMES.find(x => x.id === id) || CHAT_THEMES[0];
  const p = buildThemePalette(t);
  CHAT_THEME = t.id;
  if (save) lsSet('chattheme', t.id);
  const root = document.documentElement;
  const rgb = hexToRgb(p.acc);

  root.dataset.chatTheme = t.id;
  root.dataset.chatLight = p.light ? '1' : '0';
  root.style.setProperty('--chat-bg', p.bg);
  root.style.setProperty('--chat-pattern-o', p.light ? '0.10' : '0.20');
  root.style.setProperty('--bg0', p.bg);
  root.style.setProperty('--bg1', p.bg);
  root.style.setProperty('--head-bg', p.headBg);
  root.style.setProperty('--sb-bg', p.sbBg);
  root.style.setProperty('--rail-bg', p.railBg);
  root.style.setProperty('--bg2', p.bg2);
  root.style.setProperty('--bg3', p.bg3);
  root.style.setProperty('--bg4', p.bg4);
  root.style.setProperty('--search-bg', p.searchBg);
  root.style.setProperty('--hover', p.hoverBg);
  root.style.setProperty('--bgi', p.railBg);
  root.style.setProperty('--active', p.active);
  root.style.setProperty('--t1', p.t1);
  root.style.setProperty('--t2', p.t2);
  root.style.setProperty('--t3', p.t3);
  root.style.setProperty('--brd', p.brd);
  root.style.setProperty('--out', p.outB);
  root.style.setProperty('--out-t', p.outT);
  root.style.setProperty('--in', p.inB);
  root.style.setProperty('--in-t', p.inT);
  root.style.setProperty('--acc', p.acc);
  root.style.setProperty('--acc-d', shadeHex(p.acc, -22));
  root.style.setProperty('--acc-g', rgb ? `rgba(${rgb.r},${rgb.g},${rgb.b},.18)` : 'rgba(51,144,236,.18)');
  root.style.setProperty('--bub-meta-out', p.bubMetaOut);
  root.style.setProperty('--bub-meta-out-tick', p.bubMetaOutTick);
  root.style.setProperty('--bub-meta-out-tick-del', p.bubMetaOutTickDel);
  root.style.setProperty('--bub-meta-out-tick-read', p.bubMetaOutTickRead);
  root.style.setProperty('--bub-meta-in-msg', p.bubMetaInMsg);
  applyChatBg();
  buildThemePicker();
}
function loadChatTheme() {
  let id = lsGet('chattheme');
  if (!id) {
    const legacy = lsGet('chatbg');
    const legacyMap = { '#0E1621': 'classic', '#000000': 'mono', '#17243B': 'night', '#13241B': 'forest', '#1E1A2F': 'purple', '#2A1F1A': 'sunset' };
    if (legacy && legacyMap[legacy]) id = legacyMap[legacy];
  }
  CHAT_BG_IMAGE = lsGet('chatbgimg') || '';
  setChatTheme(id || 'classic', false);
}
function applyChatBg() {
  const ws = document.getElementById('chat-workspace');
  if (!ws) return;
  if (CHAT_BG_IMAGE) {
    ws.style.backgroundImage = `url('${CHAT_BG_IMAGE}')`;
    ws.style.backgroundSize = 'cover';
    ws.style.backgroundPosition = 'center';
    ws.style.backgroundColor = 'transparent';
    ws.classList.add('has-custom-bg');
  } else {
    ws.style.backgroundImage = '';
    ws.style.backgroundSize = '';
    ws.style.backgroundPosition = '';
    ws.style.backgroundColor = '';
    ws.classList.remove('has-custom-bg');
  }
}
function handleChatBgImage(inp) {
  const f = inp.files[0]; if (!f) return;
  if (f.size > 5 * 1024 * 1024) return toast('До 5 МБ', 'e');
  inp.value = '';
  const img = new Image();
  img.onload = () => {
    // downscale to max 1600px to keep localStorage small
    const max = 1600;
    let w = img.width, h = img.height;
    if (w > max || h > max) { const r = Math.min(max / w, max / h); w = Math.round(w * r); h = Math.round(h * r); }
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    const b64 = c.toDataURL('image/jpeg', 0.82);
    try {
      CHAT_BG_IMAGE = b64;
      lsSet('chatbgimg', b64);
      applyChatBg();
      updateBgImageUI();
      toast('Фон установлен', 'ok');
    } catch (e) { toast('Изображение слишком большое', 'e'); }
  };
  img.onerror = () => toast('Не удалось загрузить', 'e');
  img.src = URL.createObjectURL(f);
}
function clearChatBgImage() {
  CHAT_BG_IMAGE = '';
  lsSet('chatbgimg', '');
  applyChatBg();
  updateBgImageUI();
}
function updateBgImageUI() {
  const thumb = document.getElementById('bg-img-thumb');
  const clr = document.getElementById('bg-img-clear');
  if (thumb) {
    if (CHAT_BG_IMAGE) { thumb.style.display = 'block'; thumb.style.backgroundImage = `url('${CHAT_BG_IMAGE}')`; }
    else thumb.style.display = 'none';
  }
  if (clr) clr.style.display = CHAT_BG_IMAGE ? 'inline-flex' : 'none';
}

/* ═══ SPLITTER (resizable chat-list) ═══ */
const LIST_MIN = 240, LIST_MAX = 480;
function loadListWidth() {
  let w = parseInt(lsGet('listw') || '320');
  w = Math.max(LIST_MIN, Math.min(LIST_MAX, w));
  document.documentElement.style.setProperty('--list-w', w + 'px');
}
function clampListWidth() {
  // keep within bounds, also ensure chat pane has room on small windows
  let w = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--list-w')) || 320;
  const hardMax = Math.min(LIST_MAX, window.innerWidth - 72 - 360);
  w = Math.max(LIST_MIN, Math.min(hardMax > LIST_MIN ? hardMax : LIST_MAX, w));
  document.documentElement.style.setProperty('--list-w', w + 'px');
}
function startSplit(e) {
  if (window.innerWidth <= 820) return;
  e.preventDefault();
  const sp = document.getElementById('splitter');
  sp.classList.add('dragging'); document.body.classList.add('col-resizing');
  const rail = document.getElementById('nav-rail');
  const railW = rail ? rail.offsetWidth : 0;
  const move = ev => {
    const x = (ev.touches ? ev.touches[0].clientX : ev.clientX);
    let w = x - railW;
    const hardMax = Math.min(LIST_MAX, window.innerWidth - railW - 360);
    w = Math.max(LIST_MIN, Math.min(hardMax > LIST_MIN ? hardMax : LIST_MAX, w));
    document.documentElement.style.setProperty('--list-w', w + 'px');
  };
  const up = () => {
    sp.classList.remove('dragging'); document.body.classList.remove('col-resizing');
    const w = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--list-w')) || 320;
    lsSet('listw', w);
    document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
    document.removeEventListener('touchmove', move); document.removeEventListener('touchend', up);
  };
  document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
  document.addEventListener('touchmove', move, { passive:false }); document.addEventListener('touchend', up);
}

/* ═══ NAV RAIL ═══ */
function railSelect(el, folder) {
  CUR_FOLDER = folder;
  document.querySelectorAll('.nav-rail .rail-item[data-folder]').forEach(i => i.classList.remove('act'));
  if (el) el.classList.add('act');
  renderFolderTabs(); renderContacts();
}
function renderRail() {
  const cont = document.getElementById('rail-folders');
  if (!cont) return;
  const allItem = document.querySelector('.nav-rail .rail-item[data-folder="Все"]');
  if (allItem) allItem.classList.toggle('act', CUR_FOLDER === 'Все');
  cont.innerHTML = '';
  Object.keys(FOLDERS).forEach(name => {
    const it = document.createElement('div');
    it.className = 'rail-item' + (CUR_FOLDER === name ? ' act' : '');
    it.dataset.folder = name;
    const emoji = (FOLDERS[name] && FOLDERS[name].emoji) || '📁';
    it.innerHTML = `<span class="rail-emoji" style="font-size:24px;line-height:1">${emoji}</span><span class="rail-label">${esc(name).slice(0,8)}</span>`;
    it.onclick = () => railSelect(it, name);
    it.oncontextmenu = e => { e.preventDefault(); showCtxItems(e, [
      { label: 'Изменить папку', fn: () => openCreateFolder(name) },
      { label: 'Удалить папку', cls: 'ctx-del', fn: () => deleteFolder(name) },
    ]); };
    cont.appendChild(it);
  });
  // unread badge on "Все"
  const total = CHATS.reduce((s, c) => s + chatUnreadCount(c.chat_key, c.unread), 0) +
                GROUPS.reduce((s, g) => s + chatUnreadCount(`g_${g.id}`, g.unread), 0);
  const badge = document.getElementById('rail-badge-all');
  if (badge) { badge.style.display = total ? 'flex' : 'none'; badge.textContent = total > 99 ? '99+' : total; }
}

/* ═══ ATTACH MENU ═══ */
function toggleAttachMenu(e) {
  e.stopPropagation();
  if (!ACTIVE) return toast('Откройте чат', 'i');
  const existing = document.getElementById('attach-menu');
  if (existing) { existing.remove(); return; }
  const m = document.createElement('div'); m.className = 'ctx'; m.id = 'attach-menu'; m.style.display = 'block';
  m.innerHTML =
    `<div class="ctx-i" id="am-photo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg><span>Фото или картинка</span></div>`+
    `<div class="ctx-i" id="am-file"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg><span>Документ</span></div>`;
  document.body.appendChild(m);
  const rect = e.currentTarget.getBoundingClientRect();
  m.style.left = rect.left + 'px';
  m.style.top = (rect.top - m.offsetHeight - 8) + 'px';
  m.querySelector('#am-photo').onclick = ev => { ev.stopPropagation(); m.remove(); document.getElementById('photo-inp').click(); };
  m.querySelector('#am-file').onclick = ev => { ev.stopPropagation(); m.remove(); document.getElementById('file-inp').click(); };
}
function closeAttachMenu() { const m = document.getElementById('attach-menu'); if (m) m.remove(); }

/* ═══ FORMAT POPUP (over text selection) ═══ */
function updateFmtPop() {
  const mi = document.getElementById('msg-inp');
  const pop = document.getElementById('fmt-pop');
  if (!mi || !pop) return;
  if (mi.selectionStart === mi.selectionEnd) { hideFmtPop(); return; }
  // position above the textarea, near the caret horizontally
  const r = mi.getBoundingClientRect();
  pop.classList.add('show');
  const px = Math.min(r.left + 12, window.innerWidth - pop.offsetWidth - 12);
  pop.style.left = Math.max(8, px) + 'px';
  pop.style.top = (r.top - pop.offsetHeight - 6) + 'px';
}
function hideFmtPop() { const p = document.getElementById('fmt-pop'); if (p) p.classList.remove('show'); }
function fmtApply(e, kind) { e.preventDefault(); e.stopPropagation(); applyFormat(kind); }
const FMT_WRAP = { bold:['**','**'], italic:['__','__'], underline:['++','++'],
  strike:['~~','~~'], mono:['`','`'], spoiler:['||','||'] };
function applyFormat(kind) {
  const mi = document.getElementById('msg-inp');
  const [a, b] = FMT_WRAP[kind] || ['',''];
  const s = mi.selectionStart, en = mi.selectionEnd;
  const sel = mi.value.slice(s, en);
  mi.value = mi.value.slice(0, s) + a + sel + b + mi.value.slice(en);
  mi.selectionStart = s + a.length; mi.selectionEnd = en + a.length;
  mi.focus(); onType(); autoGrow(mi); hideFmtPop();
}

/* ═══ VALIDATION ═══ */
function fmtPhone(inp) {
  let d = inp.value.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (d.startsWith('9')) d = '7' + d;
  if (!d.startsWith('7') && d) d = '7' + d;
  d = d.slice(0, 11);
  let f = '';
  if (d.length > 0) f = '+' + d[0];
  if (d.length > 1) f += ' (' + d.slice(1, 4);
  if (d.length >= 4) f += ') ';
  if (d.length > 4) f += d.slice(4, 7);
  if (d.length > 7) f += '-' + d.slice(7, 9);
  if (d.length > 9) f += '-' + d.slice(9, 11);
  inp.value = f;
  const h = document.getElementById('h-phone');
  if (h) {
    if (!d) { h.textContent = ''; h.className = 'hint'; }
    else if (d.length === 11 && d[1] === '9') { h.textContent = '✓'; h.className = 'hint ok'; }
    else if (d.length === 11) { h.textContent = 'Мобильный номер начинается с 9'; h.className = 'hint err'; }
    else { h.textContent = ''; h.className = 'hint'; }
  }
}
function phoneDigits() { return document.getElementById('a-phone').value.replace(/\D/g, ''); }
function valUser(inp) {
  let v = inp.value.trim().replace(/^@+/, ''), h = document.getElementById('h-un');
  if (!v) { h.textContent = ''; h.className = 'hint'; return false; }
  if (v.length < 5) { h.textContent = 'Минимум 5 символов'; h.className = 'hint err'; return false; }
  if (v.length > 32) { h.textContent = 'Максимум 32 символа'; h.className = 'hint err'; return false; }
  if (!/^[A-Za-z]/.test(v)) { h.textContent = 'Должен начинаться с буквы'; h.className = 'hint err'; return false; }
  if (!/^[A-Za-z0-9_]+$/.test(v)) { h.textContent = 'Только латиница, цифры и _'; h.className = 'hint err'; return false; }
  if (/__/.test(v)) { h.textContent = 'Без двойного _'; h.className = 'hint err'; return false; }
  if (/_$/.test(v)) { h.textContent = 'Не может заканчиваться на _'; h.className = 'hint err'; return false; }
  h.textContent = '✓ @' + v; h.className = 'hint ok'; return true;
}
function valName(inp) {
  const v = inp.value.trim(), h = document.getElementById('h-dn');
  if (!h) return v.length >= 1;
  if (!v) { h.textContent = ''; h.className = 'hint'; return false; }
  if (v.length < 2) { h.textContent = 'Минимум 2 символа'; h.className = 'hint err'; return false; }
  if (v.length > 64) { h.textContent = 'Слишком длинное'; h.className = 'hint err'; return false; }
  h.textContent = '✓'; h.className = 'hint ok'; return true;
}
function valPw(inp) {
  const v = inp.value;
  const checks = {
    'req-len': v.length >= 8,
    'req-upper': /[A-Z]/.test(v),
    'req-lower': /[a-z]/.test(v),
    'req-digit': /[0-9]/.test(v),
  };
  Object.entries(checks).forEach(([id, ok]) => {
    const el = document.getElementById(id);
    if (el) el.className = 'pw-req' + (ok ? ' ok' : '');
  });
  return Object.values(checks).every(Boolean);
}
function pwValid(v) {
  return v.length >= 8 && /[A-Z]/.test(v) && /[a-z]/.test(v) && /[0-9]/.test(v);
}
function tglPw(id) { const i = document.getElementById(id); i.type = i.type === 'password' ? 'text' : 'password'; }

/* ═══ AUTH STEPS ═══ */
async function stepPhone() {
  const d = phoneDigits();
  if (d.length !== 11) return toast('Введите полный номер', 'e');
  if (d[1] !== '9') return toast('Мобильный номер начинается с 9', 'e');
  btnLoad('btn-phone', true);
  try {
    const r = await req('/check_phone', 'POST', { phone: '+' + d });
    AUTH_PHONE = r.phone;
    if (r.exists) {
      document.getElementById('login-sub').textContent = `Аккаунт @${r.username}`;
      showStep('as-login');
      setTimeout(() => document.getElementById('a-pw-login').focus(), 20);
    } else {
      showStep('as-reg');
      setTimeout(() => document.getElementById('a-dn').focus(), 20);
    }
  } catch (e) { toast(e.message, 'e'); }
  finally { btnLoad('btn-phone', false); }
}
async function stepLogin() {
  const p = document.getElementById('a-pw-login').value;
  if (!p) return toast('Введите пароль', 'e');
  btnLoad('btn-login', true);
  try {
    const d = await req('/login', 'POST', { login: AUTH_PHONE, password: p });
    await finishLogin(d);
  } catch (e) { toast(e.message, 'e'); }
  finally { btnLoad('btn-login', false); }
}
async function stepRegister() {
  const dn = document.getElementById('a-dn').value.trim();
  const un = document.getElementById('a-un').value.trim().replace(/^@+/, '');
  const p1 = document.getElementById('a-pw1').value;
  const p2 = document.getElementById('a-pw2').value;
  if (dn.length < 2) return toast('Введите имя (минимум 2 символа)', 'e');
  if (!valUser(document.getElementById('a-un'))) return toast('Проверьте username', 'e');
  if (!pwValid(p1)) return toast('Пароль не соответствует требованиям', 'e');
  if (p1 !== p2) return toast('Пароли не совпадают', 'e');
  btnLoad('btn-reg', true);
  try {
    const d = await req('/register', 'POST', { phone: AUTH_PHONE, username: un, password: p1, display_name: dn });
    PENDING = d; showStep('as-done');
  } catch (e) { toast(e.message, 'e'); }
  finally { btnLoad('btn-reg', false); }
}
async function stepRecover() {
  const p = document.getElementById('rec-pw').value;
  if (!pwValid(p)) return toast('Пароль не соответствует требованиям', 'e');
  try {
    await req('/recover', 'POST', { phone: AUTH_PHONE, new_password: p });
    toast('Пароль изменён! Войдите', 'ok'); showStep('as-login');
  } catch (e) { toast(e.message, 'e'); }
}
function enterApp() { if (PENDING) finishLogin(PENDING); }

async function finishLogin(d) {
  ME = {
    id: Number(d.user_id || d.id), username: d.username, display_name: d.display_name,
    avatar_emoji: d.avatar_emoji || '😊', avatar_color: d.avatar_color || '#2AABEE',
    avatar_b64: d.avatar_b64, token: d.token, theme: d.theme || 'dark',
    phone: d.phone, birth_date: d.birth_date,
    hide_online: d.hide_online || false, hide_phone: d.hide_phone || false,
  };
  PINS = new Set((d.pinned_chats || '').split(',').filter(Boolean));
  try { FOLDERS = JSON.parse(d.folders || '{}'); } catch { FOLDERS = {}; }
  migrateFolders();
  saveSession();
  setTheme(ME.theme);
  document.getElementById('auth-screen').style.display = 'none';
  const appScreen = document.getElementById('app-screen');
  appScreen.style.display = 'flex';
  appScreen.style.width = '100%';
  appScreen.style.height = '100%';
  document.getElementById('sidebar').classList.remove('off');
  renderSBUser(); buildEP(); renderFolderTabs();
  await refreshAll();
  startWS(); reqPush();
  checkBirthdays();
  if (refreshIntervalId) clearInterval(refreshIntervalId);
  startLiveSync();
  setInterval(checkBirthdays, 3600000);
  restoreActiveChat();
}
async function restoreSession(s) {
  try { const me = await req('/me', 'GET', null, s.token); ME = { ...s, ...me, token: s.token }; ME.id = Number(ME.user_id || ME.id); }
  catch (err) {
    // Only clear session on 401 auth error, not on network failure
    if (err.message && (err.message.includes('401') || err.message.includes('authenticated') || err.message.includes('expired'))) {
      clearSession(); showAuth(); return;
    }
    // Network error - restore from cache and try again
    ME = { ...s };
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    document.getElementById('sidebar').classList.remove('off');
    renderSBUser(); buildEP(); renderFolderTabs();
    toast('Восстановление соединения…', 'i');
    startWS();
    if (refreshIntervalId) clearInterval(refreshIntervalId);
    startLiveSync();
    refreshAll().then(() => restoreActiveChat()).catch(() => {});
    return;
  }
  PINS = new Set((ME.pinned_chats || '').split(',').filter(Boolean));
  try { FOLDERS = JSON.parse(ME.folders || '{}'); } catch { FOLDERS = {}; }
  migrateFolders();
  saveSession();
  setTheme(ME.theme);
  document.getElementById('auth-screen').style.display = 'none';
  const appSc = document.getElementById('app-screen');
  appSc.style.display = 'flex'; appSc.style.width = '100%'; appSc.style.height = '100%';
  document.getElementById('sidebar').classList.remove('off');
  renderSBUser(); buildEP(); renderFolderTabs();
  await refreshAll(); startWS(); reqPush();
  checkBirthdays();
  if (refreshIntervalId) clearInterval(refreshIntervalId);
  startLiveSync();
  setInterval(checkBirthdays, 3600000);
  restoreActiveChat();
}
function saveSession() {
  if (!ME) return;
  const s = JSON.stringify(ME);
  try { sessionStorage.setItem('ap_s', s); } catch {}
  try { localStorage.setItem('ap_s_bk', s); } catch {}
}
function saveActiveChat() {
  if (!ACTIVE) {
    sessionStorage.removeItem('ap_active');
    try { localStorage.removeItem('ap_active_bk'); } catch {}
    return;
  }
  // store a lightweight snapshot so the chat can be reopened even if the
  // chats/groups lists haven't finished loading after a reload
  const snap = {
    type: ACTIVE.type,
    id: ACTIVE.id,
    name: ACTIVE.name,
    user: ACTIVE.type === 'dm' ? ACTIVE.user : null,
    group: ACTIVE.type === 'group' ? ACTIVE.group : null,
    saved: ACTIVE.saved || false,
  };
  try {
    const s = JSON.stringify(snap);
    sessionStorage.setItem('ap_active', s);
    localStorage.setItem('ap_active_bk', s);
  } catch {}
}
async function restoreActiveChat() {
  let raw;
  try { raw = sessionStorage.getItem('ap_active') || localStorage.getItem('ap_active_bk'); } catch {}
  if (!raw) return;
  let ac;
  try { ac = JSON.parse(raw); } catch { return; }
  if (!ac || !ac.type) return;
  try {
    if (ac.type === 'dm') {
      const isSaved = ac.saved || isSavedPartnerId(ac.id);
      const c = isSaved
        ? (CHATS.find(x => x.is_saved) || {
            id: myUserId(), username: ME.username || 'saved', display_name: 'Избранное',
            is_saved: true, avatar_emoji: '🔖', avatar_color: '#2AABEE', chat_key: 'saved',
            ...(ac.user || {})
          })
        : (CHATS.find(x => x.id === ac.id && !x.is_saved) || ac.user || {
            id: ac.id, display_name: ac.name, username: '', is_saved: false
          });
      await openDM(c);
    } else if (ac.type === 'group') {
      let g = GROUPS.find(x => x.id === ac.id);
      if (!g && ac.group) g = ac.group;
      if (!g) { try { g = await req(`/groups/${ac.id}`); } catch {} }
      if (g) await openGroup(g);
    }
  } catch {}
}
function clearSession() {
  sessionStorage.removeItem('ap_s');
  try { localStorage.removeItem('ap_s_bk'); } catch {}
}
function confirmLogout() {
  showConfirm('Выйти?', `Выйти из аккаунта <b>@${esc(ME.username)}</b>?`, [
    { label: 'Отмена', cls: 'btn-ghost', fn: () => cm('m-confirm') },
    { label: 'Выйти', cls: 'btn-danger', fn: doLogout }
  ]);
}
function doLogout() {
  cm('m-confirm');
  if (NET) { NET.close(); NET = null; }
  clearSession();
  try { sessionStorage.removeItem('ap_active'); localStorage.removeItem('ap_active_bk'); } catch {}
  ME = null; ACTIVE = null; CHATS = []; GROUPS = []; UNREAD = {}; PINS = new Set(); FOLDERS = {}; DRAFTS = {};
  if (refreshIntervalId) { clearInterval(refreshIntervalId); refreshIntervalId = null; }
  closeAllModals(); closeDialog();
  document.getElementById('app-screen').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('a-pw-login').value = '';
  showStep('as-phone'); toast('Вы вышли', 'i');
}

/* ═══ BIRTHDAY CHECK ═══ */
function checkBirthdays() {
  if (!ME) return;
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayDD = `${dd}.${mm}`;
  const todayISO = `-${mm}-${dd}`;
  const bdays = [];
  CHATS.forEach(c => {
    if (!c.birth_date) return;
    const bd = c.birth_date;
    if (bd.includes(todayDD) || bd.endsWith(todayISO)) bdays.push(c.display_name);
  });
  const banner = document.getElementById('bday-banner');
  if (bdays.length && banner) {
    banner.innerHTML = `🎂 Сегодня день рождения: <b>${bdays.map(esc).join(', ')}</b>`;
    banner.style.display = 'block';
  } else if (banner) { banner.style.display = 'none'; }
}

/* ═══ DATA / REFRESH ═══ */
async function refreshAll() {
  if (!ME) return;
  try {
    const [chats, groups] = await Promise.all([req('/chats'), req('/groups')]);
    CHATS = chats; GROUPS = groups;
    chats.forEach(c => {
      if (c.is_saved || !c.id) return;
      if (c.online) onlineUsers.add(c.id);
      else onlineUsers.delete(c.id);
      if (c.last_seen) lastSeenMap[c.id] = c.last_seen;
    });
    CHATS.forEach(c => { delete UNREAD[c.chat_key]; });
    GROUPS.forEach(g => { delete UNREAD[`g_${g.id}`]; });
    await refreshOnline();
    renderContacts(); checkBirthdays();
    if (ACTIVE && ACTIVE.type === 'dm' && !ACTIVE.saved) {
      const c = CHATS.find(x => x.id === ACTIVE.id);
      if (c) {
        applyAvatarEl(document.getElementById('ch-av'), c.avatar_b64, c.avatar_emoji, c.avatar_color);
        document.getElementById('ch-name').textContent = c.display_name;
      }
    } else if (ACTIVE && ACTIVE.type === 'group') {
      const g = GROUPS.find(x => x.id === ACTIVE.id);
      if (g) {
        applyAvatarEl(document.getElementById('ch-av'), g.avatar_b64, g.avatar_emoji || '👥', '#2AABEE');
        document.getElementById('ch-name').textContent = g.name;
      }
    }
    updateActiveHeaderPresence();
    await syncActiveChat();
  } catch {}
}
async function syncActiveChat() {
  if (!ACTIVE) return;
  const dlg = document.getElementById('dialog');
  if (!dlg || dlg.style.display === 'none') return;
  const box = document.getElementById('msgs');
  if (!box) return;
  try {
    let msgs;
    if (ACTIVE.type === 'group') {
      msgs = await req(`/groups/${ACTIVE.id}/messages`);
    } else if (isActiveSaved()) {
      msgs = await req(`/messages/${myUserId()}`);
    } else {
      msgs = await req(`/messages/${ACTIVE.id}`);
    }
    mergeMsgsIntoView(msgs, ACTIVE.type === 'group' ? (ACTIVE.members || []) : null);
  } catch {}
}
function findDmChat(userId) {
  const id = parseInt(userId, 10);
  if (!id || Number.isNaN(id)) return null;
  if (isSavedPartnerId(id)) return CHATS.find(c => c.is_saved) || CHATS.find(c => c.chat_key === 'saved');
  return CHATS.find(c => !c.is_saved && c.id === id);
}
function myUserId() {
  const id = Number(ME?.id ?? ME?.user_id);
  return Number.isFinite(id) ? id : null;
}
function isSavedPartnerId(id) {
  const my = myUserId();
  const pid = Number(id);
  return my != null && pid === my;
}
function activeDmPartnerId() {
  if (!ACTIVE || ACTIVE.type !== 'dm') return null;
  return isActiveSaved() ? myUserId() : Number(ACTIVE.id);
}
function isMsgInActiveChat(d, fromMe) {
  if (!ACTIVE) return false;
  if (d.group_id) return ACTIVE.type === 'group' && ACTIVE.id === d.group_id;
  if (ACTIVE.type !== 'dm') return false;
  const my = myUserId();
  if (my == null) return false;
  if (isActiveSaved()) {
    return fromMe && Number(d.sender_id) === my && Number(d.recipient_id) === my;
  }
  const partnerId = Number(ACTIVE.id);
  return Number(d.sender_id) === partnerId || (fromMe && Number(d.recipient_id) === partnerId);
}
async function dispatchMsg(payload) {
  if (NET?.isOpen) {
    NET.send(payload);
    return;
  }
  const saved = await req('/messages/send', 'POST', payload);
  if (saved?.event === 'message') onWS(saved);
}
function touchChatRow(chat, preview, ts) {
  if (!chat) return;
  chat.last_text = (preview || '').slice(0, 60);
  chat.last_ts = ts || new Date().toISOString();
}
function sortByLastTs(items) {
  return items.sort((a, b) => (b.last_ts || '').localeCompare(a.last_ts || ''));
}
function loadChatOrders() {
  try { CHAT_ORDERS = JSON.parse(lsGet('chatorders') || '{}'); } catch { CHAT_ORDERS = {}; }
}
function saveChatOrders() {
  lsSet('chatorders', JSON.stringify(CHAT_ORDERS));
}
function getChatOrderKeys() {
  return CHAT_ORDERS[CUR_FOLDER] || [];
}
function setChatOrderKeys(keys) {
  CHAT_ORDERS[CUR_FOLDER] = keys;
  saveChatOrders();
}
function chatItemKey(x) {
  return x.member_count !== undefined ? `g_${x.id}` : x.chat_key;
}
function sortByCustomOrder(items, getKey) {
  const order = getChatOrderKeys();
  if (!order.length) return sortByLastTs([...items]);
  const idx = new Map(order.map((k, i) => [k, i]));
  return [...items].sort((a, b) => {
    const ka = getKey(a), kb = getKey(b);
    const ia = idx.has(ka) ? idx.get(ka) : 999999;
    const ib = idx.has(kb) ? idx.get(kb) : 999999;
    if (ia !== ib) return ia - ib;
    return (b.last_ts || '').localeCompare(a.last_ts || '');
  });
}
function persistChatOrderFromList(list) {
  if (!list) return;
  const keys = [...list.querySelectorAll('.ci[data-key]')].map(el => el.dataset.key).filter(Boolean);
  if (keys.length) setChatOrderKeys(keys);
}
function bindCiDrag(el, key) {
  if (!el || !key) return;
  let timer = null, dragActive = false, moved = false, sx = 0, sy = 0, pid = null;
  const list = () => document.getElementById('contacts');
  const clearTimer = () => { if (timer) { clearTimeout(timer); timer = null; } };
  const cleanup = () => {
    clearTimer();
    dragActive = false;
    el.classList.remove('ci-dragging');
    list()?.classList.remove('drag-reorder');
    document.body.classList.remove('chat-dragging');
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onUp);
    if (pid != null && el.releasePointerCapture) { try { el.releasePointerCapture(pid); } catch {} }
    pid = null;
  };
  const onMove = e => {
    if (!dragActive) {
      if (timer && (Math.abs(e.clientX - sx) > 12 || Math.abs(e.clientY - sy) > 12)) clearTimer();
      return;
    }
    e.preventDefault();
    moved = true;
    const listEl = list();
    if (!listEl) return;
    const pinned = PINS.has(key);
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const target = under?.closest?.('.ci[data-key]');
    if (!target || target === el || !listEl.contains(target)) return;
    if (PINS.has(target.dataset.key) !== pinned) return;
    const rect = target.getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    if (before) {
      if (el !== target && el.nextSibling !== target) listEl.insertBefore(el, target);
    } else {
      const next = target.nextSibling;
      if (el !== next) listEl.insertBefore(el, next);
    }
  };
  const onUp = () => {
    const wasDrag = dragActive;
    if (dragActive && moved) persistChatOrderFromList(list());
    if (wasDrag) {
      el._dragBlockClick = true;
      setTimeout(() => { el._dragBlockClick = false; }, 400);
    }
    cleanup();
  };
  el.addEventListener('pointerdown', e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (SEARCH_Q || UNREAD_FILTER) return;
    sx = e.clientX; sy = e.clientY;
    pid = e.pointerId;
    clearTimer();
    timer = setTimeout(() => {
      timer = null;
      dragActive = true;
      moved = false;
      hideCtx();
      el.classList.add('ci-dragging');
      list()?.classList.add('drag-reorder');
      document.body.classList.add('chat-dragging');
      if (pid != null) { try { el.setPointerCapture(pid); } catch {} }
      try { navigator.vibrate?.(10); } catch {}
      document.addEventListener('pointermove', onMove, { passive: false });
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    }, 420);
  });
  el.addEventListener('pointerup', () => { if (!dragActive) clearTimer(); });
  el.addEventListener('pointercancel', () => { if (!dragActive) clearTimer(); });
}
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const rd = new FileReader();
    rd.onload = () => resolve(rd.result);
    rd.onerror = () => reject(rd.error || new Error('read'));
    rd.readAsDataURL(file);
  });
}

const FILE_MIME = {
  pdf: 'application/pdf', txt: 'text/plain', html: 'text/html', htm: 'text/html',
  doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip', rar: 'application/x-rar-compressed', '7z': 'application/x-7z-compressed',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
  bmp: 'image/bmp', svg: 'image/svg+xml', mp4: 'video/mp4', webm: 'video/webm',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
};
function mimeFromExt(ext) {
  return FILE_MIME[(ext || '').toLowerCase()] || 'application/octet-stream';
}
function normalizeFileSrc(text, fname) {
  if (!text || text.startsWith('🔒')) return null;
  if (text.startsWith('data:') || text.startsWith('blob:')) return text;
  const trimmed = text.replace(/\s/g, '');
  if (/^[A-Za-z0-9+/=]{40,}$/.test(trimmed)) {
    const ext = (fname || '').split('.').pop();
    return `data:${mimeFromExt(ext)};base64,${trimmed}`;
  }
  return null;
}
function isBrowserViewable(fname, mime) {
  const ext = (fname || '').split('.').pop().toLowerCase();
  if (['pdf', 'txt', 'html', 'htm', 'svg', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'mp4', 'webm', 'mp3', 'wav', 'ogg'].includes(ext)) return true;
  const m = mime || mimeFromExt(ext);
  return m.startsWith('image/') || m.startsWith('text/') || m.startsWith('audio/') || m.startsWith('video/') || m === 'application/pdf';
}
async function blobFromSrc(src) {
  const r = await fetch(src);
  if (!r.ok) throw new Error('fetch failed');
  return r.blob();
}
function downloadBlob(blob, fname) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname || 'file';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
async function downloadFile(src, fname) {
  const normalized = normalizeFileSrc(src, fname);
  if (!normalized) { toast('Файл недоступен', 'e'); return; }
  try {
    const blob = await blobFromSrc(normalized);
    downloadBlob(blob, fname || 'file');
  } catch {
    toast('Не удалось скачать файл', 'e');
  }
}
async function openFile(src, fname) {
  const normalized = normalizeFileSrc(src, fname);
  if (!normalized) { toast('Файл недоступен', 'e'); return; }
  try {
    const blob = await blobFromSrc(normalized);
    const mime = blob.type || mimeFromExt((fname || '').split('.').pop());
    if (isBrowserViewable(fname, mime)) {
      const url = URL.createObjectURL(blob);
      const w = window.open(url, '_blank', 'noopener');
      if (!w) {
        URL.revokeObjectURL(url);
        downloadBlob(blob, fname || 'file');
      } else {
        setTimeout(() => URL.revokeObjectURL(url), 120000);
      }
    } else {
      downloadBlob(blob, fname || 'file');
    }
  } catch {
    toast('Не удалось открыть — скачиваем…', 'i');
    await downloadFile(normalized, fname);
  }
}
function downloadData(dataUrl, fname) {
  downloadFile(dataUrl, fname);
}
function dataURLtoBlob(dataUrl) {
  const [head, b64] = dataUrl.split(',');
  const mime = (head.match(/data:([^;]+)/) || [, 'application/octet-stream'])[1];
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function patchTempBubbleImage(tmpOrId, src, m) {
  if (!src) return;
  const tb = document.querySelector(
    typeof tmpOrId === 'string' && String(tmpOrId).startsWith('t')
      ? `.bub[data-tmp="${tmpOrId}"]`
      : `.bub[data-id="${tmpOrId}"]`
  );
  if (!tb || (m?.msg_type && m.msg_type !== 'image')) return;

  tb.querySelector('.fb')?.remove();

  let img = tb.querySelector('.img-bub');
  if (!img) {
    img = document.createElement('img');
    img.className = 'img-bub';
    img.alt = m?.file_name || 'Изображение';
    const before = tb.querySelector('.bub-media-foot') || tb.querySelector('.reacts');
    tb.insertBefore(img, before);
    if (m?.caption && !tb.querySelector('.bub-media-foot')) appendMediaCaption(tb, m, m.sender_id === ME.id);
  }

  img.onerror = null;
  img.src = src;
  img.onclick = e => {
    e.stopPropagation();
    if (SELECT_MODE && m?.id && m.id !== 'tmp') { toggleSelect(m); return; }
    openLightbox(src, m?.file_name);
  };
}

function confirmTempBubble(d) {
  if (!d.temp_id) return false;
  const tb = document.querySelector(`.bub[data-tmp="${d.temp_id}"]`);
  if (!tb) return false;
  if (d.msg_type === 'image' && d.text) patchTempBubbleImage(d.temp_id, d.text, d);
  tb.dataset.id = d.id;
  tb.removeAttribute('data-tmp');
  const row = tb.closest('.mr');
  if (row) { row.dataset.id = d.id; row.removeAttribute('data-tmp'); }
  const bm = tb.closest('.bw')?.querySelector('.bm');
  const inline = tb.closest('.bub')?.querySelector('.bub-meta-in');
  if (inline) inline.innerHTML = buildInlineMeta(d, d.sender_id === ME.id);
  else if (bm) {
    const t = new Date(d.timestamp || Date.now());
    let meta = `<span>${fmtTime(t)}</span>`;
    if (d.edited) meta += `<span style="font-style:italic;opacity:.7"> изменено</span>`;
    meta += tickHtml(d);
    bm.innerHTML = meta;
  }
  return true;
}
function mergeMsgsIntoView(msgs, members) {
  const box = document.getElementById('msgs');
  if (!box || !Array.isArray(msgs)) return;
  const existing = new Set();
  box.querySelectorAll('.mr[data-id]').forEach(r => {
    const id = parseInt(r.dataset.id, 10);
    if (id) existing.add(id);
  });
  const pendingRows = [...box.querySelectorAll('.mr[data-tmp]')];
  let added = false;
  msgs.forEach(m => {
    if (!m || m.deleted || existing.has(m.id)) return;
    if (m.sender_id === ME.id && pendingRows.length) {
      const row = pendingRows.shift();
      const bub = row?.querySelector('.bub');
      if (bub) {
        bub.dataset.id = m.id;
        bub.removeAttribute('data-tmp');
        row.dataset.id = m.id;
        row.removeAttribute('data-tmp');
        const bm = row.querySelector('.bm');
        const inline = row.querySelector('.bub-meta-in');
        if (inline) inline.innerHTML = buildInlineMeta(m, true);
        else if (bm) {
          const t = new Date(m.timestamp || Date.now());
          let meta = `<span>${fmtTime(t)}</span>`;
          if (m.edited) meta += `<span style="font-style:italic;opacity:.7"> изменено</span>`;
          meta += tickHtml(m);
          bm.innerHTML = meta;
        }
        if (m.msg_type === 'image' && m.text) patchTempBubbleImage(m.id, m.text, m);
        existing.add(m.id);
        return;
      }
    }
    const mine = m.sender_id === ME.id;
    const sndr = members ? members.find(x => x.id === m.sender_id) : null;
    appendBub(box, m, mine, sndr, false);
    existing.add(m.id);
    added = true;
  });
  if (added) scrollMsgs();
}
function startLiveSync() {
  if (refreshIntervalId) clearInterval(refreshIntervalId);
  refreshIntervalId = setInterval(() => {
    if (!ME) return;
    if (!NET || !NET.isOpen) {
      refreshAll();
    } else {
      syncActiveChat();
    }
  }, NET?.isOpen ? 12000 : 4000);
}

/* ═══ PRESENCE (online status) ═══ */
const onlineUsers = new Set();
const lastSeenMap = {};
let _lastSeenTimer = null;
async function refreshOnline() {
  try {
    const res = await req('/online');
    onlineUsers.clear();
    Object.entries(res || {}).forEach(([id, v]) => {
      const uid = parseInt(id, 10);
      if (typeof v === 'object' && v !== null) {
        if (v.online) onlineUsers.add(uid);
        else onlineUsers.delete(uid);
        if (v.last_seen) lastSeenMap[uid] = v.last_seen;
      } else if (v) {
        onlineUsers.add(uid);
      }
    });
  } catch {}
}
function fmtLastSeen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'был(а) только что';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `был(а) ${mins} ${plural(mins, ['минуту', 'минуты', 'минут'])} назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `был(а) ${hrs} ${plural(hrs, ['час', 'часа', 'часов'])} назад`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `был(а) ${days} ${plural(days, ['день', 'дня', 'дней'])} назад`;
  return 'был(а) ' + d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}
function fmtReadAt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return fmtTime(d);
  const y = new Date(now); y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'вчера в ' + fmtTime(d);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ' в ' + fmtTime(d);
}
function startLastSeenTicker() {
  if (_lastSeenTimer) clearInterval(_lastSeenTimer);
  _lastSeenTimer = setInterval(() => {
    if (ACTIVE?.type === 'dm' && !ACTIVE.saved && !CH_SUB_TYPING) updateActiveHeaderPresence();
  }, 30000);
}
function stopLastSeenTicker() {
  if (_lastSeenTimer) { clearInterval(_lastSeenTimer); _lastSeenTimer = null; }
}
let CH_SUB_STATIC = '';
let CH_SUB_ONLINE = false;
let CH_SUB_TYPING = false;
function setChSub(text, online = false) {
  CH_SUB_STATIC = text;
  CH_SUB_ONLINE = online;
  if (CH_SUB_TYPING) return;
  const sub = document.getElementById('ch-sub');
  if (!sub) return;
  sub.className = 'ch-sub' + (online ? ' online' : '');
  sub.textContent = text;
}
function showTypingInSub(name) {
  CH_SUB_TYPING = true;
  const sub = document.getElementById('ch-sub');
  if (!sub) return;
  sub.className = 'ch-sub typing';
  const who = name && ACTIVE?.type === 'group' ? esc(name) + ' ' : '';
  sub.innerHTML = `<span class="tg-typing-dots" aria-hidden="true"><span></span><span></span><span></span></span><span>${who}печатает</span>`;
}
function hideTypingInSub() {
  if (!CH_SUB_TYPING) return;
  CH_SUB_TYPING = false;
  setChSub(CH_SUB_STATIC, CH_SUB_ONLINE);
}
function updateActiveHeaderPresence() {
  if (ACTIVE?.type !== 'dm' || ACTIVE.saved) return;
  const partner = CHATS.find(c => c.id === ACTIVE.id) || ACTIVE.user;
  if (partner && partner.hide_online) { setChSub('@' + (partner.username || ''), false); return; }
  if (onlineUsers.has(ACTIVE.id)) setChSub('в сети', true);
  else {
    const ls = lastSeenMap[ACTIVE.id] || partner?.last_seen;
    if (ls) setChSub(fmtLastSeen(ls), false);
    else setChSub(partner ? '@' + (partner.username || '') : 'не в сети', false);
  }
}

/* ═══ WEBSOCKET ═══ */
function startWS() {
  if (NET) NET.close();
  NET = new NetworkManager(ME.token, onWS, (reconnected) => {
    refreshAll();
    if (reconnected) toast('Соединение восстановлено', 'ok');
    startLiveSync();
  });
  NET.connect();
  startLiveSync();
}
let _typingTimeouts = {};
async function onWS(d) {
  if (d.event === 'presence_snapshot') {
    onlineUsers.clear();
    (d.online || []).forEach(id => onlineUsers.add(parseInt(id, 10)));
    renderContacts();
    updateActiveHeaderPresence();
    return;
  }
  if (d.event === 'presence') {
    const uid = parseInt(d.user_id, 10);
    if (!uid) return;
    if (d.online) onlineUsers.add(uid);
    else {
      onlineUsers.delete(uid);
      if (d.last_seen) lastSeenMap[uid] = d.last_seen;
    }
    renderContacts();
    updateActiveHeaderPresence();
    return;
  }
  if (d.event === 'typing') {
    if (isActiveSaved()) return;
    if (d.sender_id === ME.id) return;
    const isG = !!d.group_id;
    const relevant = (isG && ACTIVE?.type === 'group' && ACTIVE?.id === d.group_id) ||
      (!isG && ACTIVE?.type === 'dm' && !isActiveSaved() && ACTIVE?.id === d.sender_id);
    if (relevant) {
      if (d.typing) {
        showTypingInSub(d.display_name);
        clearTimeout(_typingTimeouts[d.sender_id]);
        _typingTimeouts[d.sender_id] = setTimeout(hideTypingInSub, 4500);
      } else hideTypingInSub();
    }
    return;
  }
  if (d.event === 'read') {
    const setTicksRead = (wrap) => {
      if (!wrap) return;
      let ticks = wrap.querySelectorAll('.tick');
      if (ticks.length < 2) {
        const s = document.createElement('span');
        s.className = 'tick read';
        s.textContent = '✓';
        wrap.appendChild(s);
        ticks = wrap.querySelectorAll('.tick');
      }
      ticks.forEach(t => { t.className = 'tick read'; });
    };
    document.querySelectorAll('.ticks').forEach(wrap => {
      const id = parseInt(wrap.dataset.id || '0');
      if (id && id <= d.msg_id) setTicksRead(wrap);
    });
    return;
  }
  if (d.event === 'deleted') {
    // self_only — только у удалившего; без флага — у всех (delete for all)
    if (typeof removeMsgRow === 'function') removeMsgRow(d.id);
    else { const row = document.querySelector(`.mr[data-id="${d.id}"]`); if (row) row.remove(); }
    return;
  }
  if (d.event === 'edited') {
    applyEdit(d.id, d.text || '');
    return;
  }
  if (d.event === 'reaction') {
    applyReactions(d.id, d.reactions || {});
    return;
  }
  if (d.event === 'pinned') {
    const bub = document.querySelector(`.bub[data-id="${d.id}"]`);
    if (bub) bub.classList.toggle('pinned-mark', d.pinned);
    if (ACTIVE) loadPinnedBar();
    return;
  }
  if (d.event === 'profile') {
    // a contact changed name/avatar — update local data, list and open header live
    const c = CHATS.find(x => x.id === d.id);
    if (c) { c.display_name = d.display_name; c.avatar_emoji = d.avatar_emoji;
             c.avatar_color = d.avatar_color; c.avatar_b64 = d.avatar_b64; }
    renderContacts();
    if (ACTIVE && ACTIVE.type === 'dm' && ACTIVE.id === d.id) {
      applyAvatarEl(document.getElementById('ch-av'), d.avatar_b64, d.avatar_emoji, d.avatar_color);
      document.getElementById('ch-name').textContent = d.display_name;
    }
    return;
  }
  if (d.event === 'group_update') {
    const gid = d.group_id;
    if (gid && ACTIVE?.type === 'group' && ACTIVE.id === gid) {
      if (d.removed_uid === ME.id || d.left_uid === ME.id || d.left) {
        closeDialog();
        cm('m-ginfo');
      } else {
        req(`/groups/${gid}/members`).then(members => {
          if (ACTIVE?.type === 'group' && ACTIVE.id === gid) {
            ACTIVE.members = members;
            setChSub(`${members.length} ${plural(members.length, ['участник', 'участника', 'участников'])}`);
          }
        }).catch(() => {});
      }
    }
    refreshAll();
    return;
  }
  if (d.event !== 'message') return;

  const isG = !!d.group_id;
  const fromMe = d.sender_id === ME.id;
  const key = isG ? `g_${d.group_id}` : (fromMe ? `dm_${d.recipient_id}` : `dm_${d.sender_id}`);
  const inView = isMsgInActiveChat(d, fromMe);

  if (inView) {
    if (fromMe) {
      if (confirmTempBubble(d)) return;
      if (!d.temp_id || document.querySelector(`.mr[data-id="${d.id}"]`)) return;
    } else if (document.querySelector(`.mr[data-id="${d.id}"]`)) {
      return;
    }
    const sndr = isG ? (ACTIVE.members || []).find(m => m.id === d.sender_id) || null : null;
    appendBub(document.getElementById('msgs'), d, fromMe, sndr, true);
    scrollMsgs();
    if (!fromMe) req(`/messages/${d.id}/read`, 'POST').catch(() => {});
    hideTypingInSub();
  } else {
    if (!fromMe) {
      UNREAD[key] = (UNREAD[key] || 0) + 1;
      let senderName = (CHATS.find(c => c.id === d.sender_id) || {}).display_name;
      if (isG) {
        const grp = GROUPS.find(g => g.id === d.group_id);
        const gname = grp ? grp.name : 'Группа';
        senderName = senderName ? `${senderName} · ${gname}` : gname;
      }
      const preview = previewText(d);
      pushNotify(senderName || 'Новое сообщение', preview);
      if (SOUND) playPing();
      bumpTitleBadge();
    }
    const needListRefresh = isG
      ? !GROUPS.find(g => g.id === d.group_id)
      : !findDmChat(fromMe ? d.recipient_id : d.sender_id);
    if (needListRefresh) refreshAll();
  }
  const preview = previewText(d);
  if (isG) {
    const group = GROUPS.find(g => g.id === d.group_id);
    if (group) {
      group.last_text = preview.slice(0, 60);
      group.last_ts = d.timestamp;
    }
  } else {
    const partnerId = fromMe ? d.recipient_id : d.sender_id;
    const chat = findDmChat(partnerId);
    if (chat) {
      chat.last_text = preview.slice(0, 60);
      chat.last_ts = d.timestamp;
    } else if (fromMe) {
      refreshAll();
    }
  }
  renderContacts();
}

/* ═══ TYPING ═══ */
function onTypingInput() {
  if (!ACTIVE || isActiveSaved()) return;
  if (!IS_TYPING) { IS_TYPING = true; sendTyping(true); }
  clearTimeout(TYPING_TIMER);
  TYPING_TIMER = setTimeout(() => { IS_TYPING = false; sendTyping(false); }, 3000);
}
function sendTyping(typing) {
  if (!ME || !ACTIVE || isActiveSaved()) return;
  const body = { typing };
  if (ACTIVE.type === 'dm') body.recipient_id = Number(ACTIVE.id);
  else body.group_id = ACTIVE.id;
  req('/typing', 'POST', body).catch(() => {});
}

/* ═══ DRAFTS ═══ */
function draftKey(active = ACTIVE) {
  if (!active) return '';
  if (active.type === 'dm' && (active.saved || isSavedPartnerId(active.id))) return 'saved';
  return `${active.type}_${active.id}`;
}
function saveDraft() {
  if (!ACTIVE) return;
  const key = draftKey();
  const val = document.getElementById('msg-inp').value;
  if (val.trim()) DRAFTS[key] = val;
  else delete DRAFTS[key];
}
function restoreDraft() {
  if (!ACTIVE) return;
  const key = draftKey();
  const mi = document.getElementById('msg-inp');
  mi.value = DRAFTS[key] || '';
  autoGrow(mi); onType();
}

/* ═══ UNREAD FILTER ═══ */
function toggleUnreadFilter() {
  UNREAD_FILTER = !UNREAD_FILTER;
  const btn = document.getElementById('sb-mi-unread');
  if (btn) btn.classList.toggle('active-mi', UNREAD_FILTER);
  renderContacts();
}

/* ═══ SIDEBAR MENU ═══ */
function toggleSbMenu(e) {
  if (e) e.stopPropagation();
  const m = document.getElementById('sb-menu');
  if (!m) return;
  const open = m.style.display === 'none' || !m.style.display;
  m.style.display = open ? 'block' : 'none';
}
function closeSbMenu() {
  const m = document.getElementById('sb-menu'); if (m) m.style.display = 'none';
}

/* ═══ FOLDER ═══ */
function migrateFolders() {
  // Old shape: FOLDERS[name] = [keys].  New shape: {emoji, chats:[keys]}
  Object.keys(FOLDERS).forEach(n => {
    if (Array.isArray(FOLDERS[n])) FOLDERS[n] = { emoji: '📁', chats: FOLDERS[n] };
    else if (!FOLDERS[n] || typeof FOLDERS[n] !== 'object') FOLDERS[n] = { emoji: '📁', chats: [] };
    else if (!Array.isArray(FOLDERS[n].chats)) FOLDERS[n].chats = [];
  });
}
function folderKeys(n) {
  const f = FOLDERS[n];
  if (!f) return [];
  return Array.isArray(f) ? f : (f.chats || []);
}
function renderFolderTabs() {
  const ft = document.getElementById('folder-tabs');
  if (!ft) return;
  const names = ['Все', ...Object.keys(FOLDERS)];
  if (names.length === 1) { ft.innerHTML = ''; renderRail(); return; }
  ft.innerHTML = '';
  names.forEach(n => {
    const t = document.createElement('div');
    t.className = 'ftab' + (n === CUR_FOLDER ? ' act' : '');
    const emoji = n === 'Все' ? '' : (FOLDERS[n]?.emoji ? FOLDERS[n].emoji + ' ' : '');
    t.textContent = emoji + n;
    t.onclick = () => { CUR_FOLDER = n; renderFolderTabs(); renderContacts(); };
    if (n !== 'Все') t.oncontextmenu = e => {
      e.preventDefault();
      showCtxItems(e, [
        { label: 'Изменить папку', fn: () => openCreateFolder(n) },
        { label: 'Удалить папку', cls: 'ctx-del', fn: () => deleteFolder(n) }
      ]);
    };
    ft.appendChild(t);
  });
  renderRail();
}
function deleteFolder(n) {
  hideCtx();
  if (!FOLDERS[n]) return;
  delete FOLDERS[n];
  if (CUR_FOLDER === n) CUR_FOLDER = 'Все';
  saveFolders();
  // repaint tabs + rail + list so the removed folder disappears everywhere
  renderFolderTabs();
  renderRail();
  renderContacts();
  toast('Папка удалена', 'ok');
}
function saveFolders() {
  if (!ME) return;
  ME.folders = JSON.stringify(FOLDERS); saveSession();
  req('/me', 'PATCH', { folders: ME.folders }).catch(() => {});
}
function openCreateFolder(editName) {
  closeSbMenu();
  folderEdit = editName || null;
  const existing = editName ? FOLDERS[editName] : null;
  folderEmoji = (existing && existing.emoji) || '📁';
  folderPick = new Set(existing ? folderKeys(editName) : []);
  document.getElementById('folder-modal-title').textContent = editName ? 'Изменить папку' : 'Новая папка';
  document.getElementById('folder-name').value = editName || '';
  document.getElementById('folder-emoji-preview').textContent = folderEmoji;
  // emoji row
  const er = document.getElementById('folder-emoji-row'); er.innerHTML = '';
  FOLDER_E.forEach(e => {
    const d = document.createElement('div');
    d.className = 'folder-emoji-opt' + (e === folderEmoji ? ' sel' : '');
    d.textContent = e;
    d.onclick = () => {
      folderEmoji = e;
      document.getElementById('folder-emoji-preview').textContent = e;
      er.querySelectorAll('.folder-emoji-opt').forEach(x => x.classList.remove('sel'));
      d.classList.add('sel');
    };
    er.appendChild(d);
  });
  // chat pick list
  const cp = document.getElementById('folder-chat-pick'); cp.innerHTML = '';
  const entries = [
    ...GROUPS.map(g => ({ key: `g_${g.id}`, name: g.name, emoji: g.avatar_emoji || '👥', color: '#2AABEE', b64: g.avatar_b64 })),
    ...CHATS.filter(c => !c.is_saved).map(c => ({ key: c.chat_key, name: c.display_name, emoji: c.avatar_emoji, color: c.avatar_color, b64: c.avatar_b64 }))
  ];
  if (!entries.length) cp.innerHTML = '<div style="color:var(--t3);font-size:13px;padding:14px;text-align:center">Нет чатов для добавления</div>';
  entries.forEach(en => {
    const row = document.createElement('div');
    row.className = 'fcp-row' + (folderPick.has(en.key) ? ' sel' : '');
    row.innerHTML = avHtml(en.b64, en.emoji, en.color, 38) +
      `<span class="fcp-name">${esc(en.name)}</span><span class="fcp-check">${folderPick.has(en.key) ? '✓' : ''}</span>`;
    row.onclick = () => {
      if (folderPick.has(en.key)) { folderPick.delete(en.key); row.classList.remove('sel'); row.querySelector('.fcp-check').textContent = ''; }
      else { folderPick.add(en.key); row.classList.add('sel'); row.querySelector('.fcp-check').textContent = '✓'; }
    };
    cp.appendChild(row);
  });
  om('m-folder');
}
function saveFolderModal() {
  const name = document.getElementById('folder-name').value.trim();
  if (!name) return toast('Введите название папки', 'e');
  if (name === 'Все') return toast('Это имя зарезервировано', 'e');
  if (folderEdit && folderEdit !== name) delete FOLDERS[folderEdit];
  else if (!folderEdit && FOLDERS[name]) return toast('Такая папка уже есть', 'e');
  FOLDERS[name] = { emoji: folderEmoji, chats: [...folderPick] };
  saveFolders();
  if (folderEdit && CUR_FOLDER === folderEdit) CUR_FOLDER = name;
  folderEdit = null;
  cm('m-folder');
  renderFolderTabs(); renderContacts();
  toast('Папка сохранена', 'ok');
}

/* ═══ CONTACTS ═══ */
function renderContacts() {
  const list = document.getElementById('contacts'); list.innerHTML = '';
  if (SEARCH_Q) {
    const q = SEARCH_Q.replace(/^@/, '').toLowerCase();
    // 1) local matches among existing chats & groups (instant)
    const localChats = CHATS.filter(c => !c.is_saved && (
      (c.display_name || '').toLowerCase().includes(q) ||
      (c.username || '').toLowerCase().includes(q)));
    const localGroups = GROUPS.filter(g => (g.name || '').toLowerCase().includes(q));
    // 2) server matches (new people), excluding ones already shown locally
    const localIds = new Set(localChats.map(c => c.id));
    const remote = SEARCH_RES.filter(u => u.id !== ME.id && !localIds.has(u.id));
    if (!localChats.length && !localGroups.length && !remote.length) {
      list.innerHTML = emptyHtml('Никого не найдено');
      return;
    }
    if (localGroups.length) { list.appendChild(searchHeader('Группы')); localGroups.forEach(g => list.appendChild(mkGCI(g))); }
    if (localChats.length) { list.appendChild(searchHeader('Чаты')); localChats.forEach(c => list.appendChild(mkCCI(c))); }
    if (remote.length) { list.appendChild(searchHeader('Глобальный поиск')); remote.forEach(u => list.appendChild(mkSearchCI(u))); }
    return;
  }
  let chats = [...CHATS], groups = [...GROUPS];
  if (CUR_FOLDER !== 'Все') {
    const keys = new Set(folderKeys(CUR_FOLDER));
    chats = chats.filter(c => keys.has(c.chat_key));
    groups = groups.filter(g => keys.has(`g_${g.id}`));
  }
  if (UNREAD_FILTER) {
    chats = chats.filter(c => chatUnreadCount(c.chat_key, c.unread) > 0);
    groups = groups.filter(g => chatUnreadCount(`g_${g.id}`, g.unread) > 0);
  }
  const pinned = sortByCustomOrder([
    ...groups.filter(g => PINS.has(`g_${g.id}`)),
    ...chats.filter(c => PINS.has(c.chat_key))
  ], chatItemKey);
  const restG = sortByCustomOrder(groups.filter(g => !PINS.has(`g_${g.id}`)), g => `g_${g.id}`);
  const restC = sortByCustomOrder(chats.filter(c => !PINS.has(c.chat_key)), c => c.chat_key);
  if (!pinned.length && !restG.length && !restC.length) {
    list.innerHTML = emptyHtml(UNREAD_FILTER ? 'Нет непрочитанных' : CUR_FOLDER !== 'Все' ? 'Папка пуста' : 'Нет чатов. Найдите коллегу через поиск');
    return;
  }
  const all = [...pinned, ...restG, ...restC];
  all.forEach(x => {
    const el = x.member_count !== undefined ? mkGCI(x) : mkCCI(x);
    list.appendChild(el);
    bindCiDrag(el, chatItemKey(x));
  });
  renderRail();
  twemojify(list);
  if (typeof bumpTitleBadge === 'function' && !document.hidden && document.hasFocus()) {
    // when window is focused, only badge if there's still unread elsewhere
    const n = totalUnread();
    document.title = n > 0 ? `(${n > 99 ? '99+' : n}) ${_baseTitle}` : _baseTitle;
  } else if (typeof bumpTitleBadge === 'function') {
    bumpTitleBadge();
  }
}
function emptyHtml(t) { return `<div style="padding:40px 20px;text-align:center;color:var(--t3);font-size:13.5px;line-height:1.6">${t}</div>`; }
function searchHeader(t) { const d = document.createElement('div'); d.className = 'search-hdr'; d.textContent = t; return d; }
function ensureAvEmojiEl(el) {
  if (!el) return null;
  let inner = el.querySelector('.av-emoji-inner');
  if (!inner) {
    inner = document.createElement('span');
    inner.className = 'av-emoji-inner';
    const overlay = el.querySelector('.av-preview-cam, .cg-av-cam');
    if (overlay) el.insertBefore(inner, overlay);
    else el.appendChild(inner);
  }
  return inner;
}
function applyAvatarEl(el, b64, emoji, color) {
  if (!el) return;
  const inner = ensureAvEmojiEl(el);
  if (b64) {
    el.style.backgroundImage = `url('${b64}')`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.style.backgroundColor = 'transparent';
    if (inner) { inner.textContent = ''; inner.style.display = 'none'; }
  } else {
    el.style.backgroundImage = '';
    el.style.backgroundSize = '';
    el.style.backgroundPosition = '';
    el.style.backgroundColor = color || '#2AABEE';
    if (inner) { inner.textContent = emoji || '😊'; inner.style.display = ''; }
  }
}
function avHtml(b64, emoji, color, sz, online = false) {
  const dot = online ? `<span class="av-dot"></span>` : '';
  const inner = b64
    ? `<div class="ci-av" style="background-image:url('${b64}')"></div>`
    : `<div class="ci-av" style="background:${color};font-size:${Math.round(sz * .42)}px"><span class="av-emoji-inner">${emoji}</span></div>`;
  return `<div class="ci-av-wrap${online ? ' online' : ''}" style="width:${sz}px;height:${sz}px;min-width:${sz}px">${inner}${dot}</div>`;
}
function chatUnreadCount(key, serverCount = 0) {
  return (UNREAD[key] || 0) + (serverCount || 0);
}
function isSavedChat(c) {
  return !!(c && (c.is_saved || c.chat_key === 'saved' || isSavedPartnerId(c.id)));
}
function isActiveSaved() {
  return !!(ACTIVE?.type === 'dm' && (ACTIVE.saved || isSavedPartnerId(ACTIVE.id)));
}
function mkCCI(c) {
  const key = c.chat_key;
  const d = document.createElement('div');
  const isSaved = isSavedChat(c);
  const isActive = ACTIVE?.type === 'dm' && (isSaved ? isActiveSaved() : (ACTIVE.id === c.id && !ACTIVE.saved));
  d.className = 'ci' + (isActive ? ' act' : '') + (PINS.has(key) ? ' pinned' : '');
  d.dataset.key = key;
  const time = c.last_ts ? fmtTime(new Date(c.last_ts)) : '';
  const unread = chatUnreadCount(key, c.unread);
  const draft = DRAFTS[isSaved ? 'saved' : `dm_${c.id}`];
  let subHtml = draft
    ? `<span class="ci-draft-mark">Черновик: </span>${esc(draft.slice(0,40))}`
    : esc(c.last_text || (isSaved ? 'Сохранённые сообщения' : '@' + c.username));
  let avatar;
  if (isSaved) {
    avatar = `<div class="ci-av saved-ico" style="width:50px;height:50px;min-width:50px;background:#2AABEE">🔖</div>`;
  } else {
    const isOnline = onlineUsers.has(c.id) && !c.hide_online;
    avatar = avHtml(c.avatar_b64, c.avatar_emoji, c.avatar_color, 50, isOnline);
  }
  const pinIco = (PINS.has(key) && !unread) ? '<span class="ci-pin">📌</span>' : '';
  d.innerHTML = avatar +
    `<div class="ci-info">
      <div class="ci-top"><span class="ci-name">${esc(c.display_name)}</span><span class="ci-time">${time}</span></div>
      <div class="ci-bot"><span class="ci-sub">${subHtml}</span>${unread ? `<div class="ub">${unread > 99 ? '99+' : unread}</div>` : pinIco}</div>
    </div>`;
  d.addEventListener('click', () => { if (d._dragBlockClick) return; openDM(c); });
  d.addEventListener('contextmenu', e => { e.preventDefault(); chatCtx(e, key, c); });
  return d;
}
function mkGCI(g) {
  const key = `g_${g.id}`;
  const d = document.createElement('div');
  d.className = 'ci' + (ACTIVE?.type === 'group' && ACTIVE?.id === g.id ? ' act' : '') + (PINS.has(key) ? ' pinned' : '');
  d.dataset.key = key;
  const unread = chatUnreadCount(`g_${g.id}`, g.unread);
  const time = g.last_ts ? fmtTime(new Date(g.last_ts)) : '';
  const draft = DRAFTS[`group_${g.id}`];
  let subHtml = draft ? `<span class="ci-draft-mark">Черновик</span>` : esc(g.last_text || `${g.member_count} участников`);
  const pinIco = (PINS.has(key) && !unread) ? '<span class="ci-pin">📌</span>' : '';
  d.innerHTML = avHtml(g.avatar_b64, g.avatar_emoji || '👥', '#2AABEE', 50) +
    `<div class="ci-info">
      <div class="ci-top"><span class="ci-name">${esc(g.name)}</span><span class="ci-time">${time}</span></div>
      <div class="ci-bot"><span class="ci-sub">${subHtml}</span>${unread ? `<div class="ub">${unread > 99 ? '99+' : unread}</div>` : pinIco}</div>
    </div>`;
  d.addEventListener('click', () => { if (d._dragBlockClick) return; openGroup(g); });
  d.addEventListener('contextmenu', e => { e.preventDefault(); chatCtx(e, key, g); });
  return d;
}
function mkSearchCI(u) {
  const d = document.createElement('div'); d.className = 'ci';
  d.innerHTML = avHtml(u.avatar_b64, u.avatar_emoji, u.avatar_color, 50) +
    `<div class="ci-info">
      <div class="ci-top"><span class="ci-name">${esc(u.display_name)}</span></div>
      <div class="ci-bot"><span class="ci-sub">@${esc(u.username)}</span></div>
    </div>`;
  d.addEventListener('click', () => { clearSearch(); openDM({ ...u, chat_key: `dm_${u.id}` }); });
  return d;
}
function chatCtx(e, key, obj) {
  // saved-messages chat can't be pinned/foldered
  if (key === 'saved' || obj?.is_saved) {
    showCtxItems(e, [{ label: PINS.has(key) ? 'Открепить' : 'Закрепить', fn: () => pinChat(key) }]);
    return;
  }
  const items = [{ label: PINS.has(key) ? 'Открепить' : 'Закрепить', fn: () => pinChat(key) }];
  Object.keys(FOLDERS).forEach(f => {
    const inF = folderKeys(f).includes(key);
    items.push({
      label: inF ? `Убрать из «${f}»` : `В папку «${f}»`,
      fn: () => {
        const cur = folderKeys(f);
        const next = inF ? cur.filter(k => k !== key) : [...new Set([...cur, key])];
        FOLDERS[f] = { emoji: (FOLDERS[f] && FOLDERS[f].emoji) || '📁', chats: next };
        saveFolders(); renderFolderTabs(); renderRail(); renderContacts();
        toast(inF ? `Убрано из «${f}»` : `Добавлено в «${f}»`, 'ok');
      }
    });
  });
  showCtxItems(e, items);
}
async function pinChat(key) {
  hideCtx();
  const p = !PINS.has(key);
  if (p) PINS.add(key); else PINS.delete(key);
  renderContacts();
  try { await req('/pin', 'POST', { chat_key: key, pinned: p }); } catch {}
}

/* ═══ SEARCH ═══ */
let _searchTimer = null, _searchSeq = 0;
async function onSearch(q) {
  SEARCH_Q = q.trim();
  const clr = document.getElementById('srch-clear');
  if (clr) clr.style.display = SEARCH_Q ? 'flex' : 'none';
  clearTimeout(_searchTimer);
  if (!SEARCH_Q) { SEARCH_RES = []; renderContacts(); return; }
  // render local matches instantly on every keystroke
  renderContacts();
  // strip leading @ for username search
  const qn = SEARCH_Q.startsWith('@') ? SEARCH_Q.slice(1) : SEARCH_Q;
  const seq = ++_searchSeq;               // sequence guard against stale responses
  _searchTimer = setTimeout(async () => {
    try {
      const res = await req('/users?q=' + encodeURIComponent(qn));
      // ignore if a newer query started or the box was cleared meanwhile
      if (seq !== _searchSeq || !SEARCH_Q) return;
      SEARCH_RES = res; renderContacts();
    } catch {}
  }, 140);
}
function clearSearch() {
  _searchSeq++;                            // invalidate any in-flight request
  document.getElementById('srch').value = '';
  const clr = document.getElementById('srch-clear'); if (clr) clr.style.display = 'none';
  SEARCH_Q = ''; SEARCH_RES = []; renderContacts();
}

/* ═══ DIALOG ═══ */
async function openDM(c) {
  saveDraft();
  if (STAGED.length) cancelStaged();
  if (EDITING) cancelEdit();
  const isSaved = isSavedChat(c);
  if (isSaved) {
    c.is_saved = true;
    c.chat_key = 'saved';
    c.display_name = 'Избранное';
    c.id = myUserId();
  }
  const sameOpen = ACTIVE?.type === 'dm' && (
    (isSaved && ACTIVE.saved) || (!isSaved && !ACTIVE.saved && ACTIVE.id === c.id)
  );
  if (sameOpen) {
    showDialog();
    hideTypingInSub();
    return;
  }
  ACTIVE = { type: 'dm', id: c.id, name: isSaved ? 'Избранное' : c.display_name, user: c, saved: isSaved };
  UNREAD[isSaved ? 'saved' : `dm_${c.id}`] = 0;
  if (c) c.unread = 0;
  const _cc = isSaved ? CHATS.find(x => x.is_saved) : CHATS.find(x => x.id === c.id && !x.is_saved);
  if (_cc) _cc.unread = 0;
  saveActiveChat();
  renderContacts();
  if (isSaved) setHead(null, '🔖', '#2AABEE', 'Избранное', 'Сохранённые сообщения');
  else {
    setHead(c.avatar_b64, c.avatar_emoji, c.avatar_color, c.display_name, '@' + c.username);
    updateActiveHeaderPresence();
  }
  showDialog();
  restoreDraft();
  hideTypingInSub();
  showMsgsLoading();
  const openSeq = ++OPEN_SEQ;
  const partnerId = isSaved ? myUserId() : c.id;
  try {
    const msgs = await req(`/messages/${partnerId}`);
    if (openSeq !== OPEN_SEQ) return;
    if (ACTIVE?.type === 'dm' && (
      (isSaved && isActiveSaved()) || (!isSaved && !ACTIVE.saved && ACTIVE.id === c.id)
    )) {
      renderMsgs(msgs, 'dm');
      loadPinnedBar();
      if (!isSaved) checkBirthdays();
    }
  } catch {
    if (openSeq !== OPEN_SEQ) return;
    if (ACTIVE?.type === 'dm' && (
      (isSaved && isActiveSaved()) || (!isSaved && !ACTIVE.saved && ACTIVE.id === c.id)
    )) {
      document.getElementById('msgs').innerHTML = `<div style="text-align:center;color:var(--t3);font-size:13px;margin-top:40px">Не удалось загрузить · <a href="#" onclick="openSavedChat();return false" style="color:var(--accent)">повторить</a></div>`;
    }
  }
}
function openSavedChat() {
  closeSbMenu();
  const saved = CHATS.find(c => c.is_saved) ||
    { id: myUserId(), username: ME.username || 'saved', display_name: 'Избранное', is_saved: true,
      avatar_emoji: '🔖', avatar_color: '#2AABEE', chat_key: 'saved' };
  openDM(saved);
}
async function openGroup(g) {
  saveDraft();
  if (STAGED.length) cancelStaged();
  if (EDITING) cancelEdit();
  const members = await req(`/groups/${g.id}/members`).catch(() => []);
  ACTIVE = { type: 'group', id: g.id, name: g.name, members, group: g };
  UNREAD[`g_${g.id}`] = 0;
  g.unread = 0;
  const _gg = GROUPS.find(x => x.id === g.id); if (_gg) _gg.unread = 0;
  saveActiveChat(); renderContacts();
  setHead(g.avatar_b64, g.avatar_emoji || '👥', '#2AABEE', g.name, `${members.length} участников`, true);
  showDialog();
  restoreDraft();
  hideTypingInSub();
  showMsgsLoading();
  const openSeq = ++OPEN_SEQ;
  const gid = g.id;
  try {
    const msgs = await req(`/groups/${gid}/messages`);
    if (openSeq !== OPEN_SEQ) return;
    if (ACTIVE?.type === 'group' && ACTIVE.id === gid) { renderMsgs(msgs, 'group', members); loadPinnedBar(); }
  }
  catch {
    if (openSeq !== OPEN_SEQ) return;
    if (ACTIVE?.type === 'group' && ACTIVE.id === gid) document.getElementById('msgs').innerHTML = `<div style="text-align:center;color:var(--t3);font-size:13px;margin-top:40px">Не удалось загрузить сообщения</div>`;
  }
}
function setHead(b64, emoji, color, name, sub, online = false) {
  applyAvatarEl(document.getElementById('ch-av'), b64, emoji, color);
  document.getElementById('ch-name').textContent = name;
  CH_SUB_TYPING = false;
  setChSub(sub, online);
  twemojify(document.querySelector('.chat-head'));
}
function showDialog() {
  document.getElementById('welcome').style.display = 'none';
  document.getElementById('dialog').style.display = 'flex';
  const mi = document.getElementById('msg-inp'); mi.disabled = false;
  hideEP(); cancelReply();
  if (typeof closeChatSearch === 'function') closeChatSearch();
  if (window.innerWidth <= 680) document.getElementById('sidebar').classList.add('off');
  // Apply chat bg
  applyChatBg();
  // init send/voice visibility based on current input
  onType();
  mi.focus();
  startLastSeenTicker();
}
function closeDialog() {
  stopLastSeenTicker();
  if (SELECT_MODE) exitSelect();
  if (STAGED.length) cancelStaged();
  if (EDITING) cancelEdit();
  saveDraft(); ACTIVE = null; REPLY = null; IS_TYPING = false;
  onType();
  if (typeof closeChatSearch === 'function') closeChatSearch();
  saveActiveChat();
  document.getElementById('dialog').style.display = 'none';
  document.getElementById('welcome').style.display = 'flex';
  document.getElementById('sidebar').classList.remove('off');
  renderContacts();
}
function viewActiveProfile() {
  if (!ACTIVE) return;
  if (ACTIVE.type === 'dm' && ACTIVE.saved) { showSavedInfo(); return; }
  if (ACTIVE.type === 'dm') showUserProfile(ACTIVE.id);
  else if (ACTIVE.type === 'group') showGroupInfo(ACTIVE.id);
}
function openChatMenu(e) {
  if (!ACTIVE) return;
  const items = [];
  if (ACTIVE.type === 'dm' && ACTIVE.saved) items.push({ label: 'Избранное', fn: () => showSavedInfo() });
  else if (ACTIVE.type === 'dm') items.push({ label: 'Профиль', fn: () => showUserProfile(ACTIVE.id) });
  else if (ACTIVE.type === 'group') items.push({ label: 'Информация о группе', fn: () => showGroupInfo(ACTIVE.id) });
  items.push({ label: 'Поиск', fn: () => openChatSearch() });
  showCtxItems(e, items);
}
function showSavedInfo() {
  document.querySelectorAll('#saved-tabs .up-tab').forEach((t, i) => t.classList.toggle('act', i === 0));
  om('m-saved');
  loadSavedTab('media');
}
function switchSavedTab(btn, tab) {
  document.querySelectorAll('#saved-tabs .up-tab').forEach(t => t.classList.remove('act'));
  btn.classList.add('act');
  loadSavedTab(tab);
}
async function loadSavedTab(tab) {
  const tc = document.getElementById('saved-tab-content');
  if (!tc || !ME) return;
  tc.innerHTML = '<div class="up-tc-empty">Загрузка…</div>';
  try {
    const items = await req(`/shared/${ME.id}?kind=${tab}`);
    renderSharedTab(tc, items, tab);
  } catch (e) { tc.innerHTML = `<div class="up-tc-empty">${esc(e.message)}</div>`; }
}
function renderSharedTab(tc, items, tab) {
  if (!items.length) {
    const empty = {
      media: 'Нет медиа',
      files: 'Нет файлов',
      links: 'Нет ссылок',
      voice: 'Нет голосовых',
    }[tab] || 'Пусто';
    tc.innerHTML = `<div class="up-tc-empty">${empty}</div>`;
    return;
  }
  if (tab === 'media') {
    tc.innerHTML = '';
    const grid = document.createElement('div'); grid.className = 'up-media-grid';
    items.forEach(m => {
      if (!m.text || !m.text.startsWith('data:')) return;
      const im = document.createElement('img'); im.src = m.text; im.className = 'up-media-thumb';
      im.onclick = () => openLightbox(m.text, m.file_name);
      grid.appendChild(im);
    });
    if (!grid.children.length) { tc.innerHTML = '<div class="up-tc-empty">Нет медиа</div>'; return; }
    tc.appendChild(grid);
  } else if (tab === 'files') {
    tc.innerHTML = '';
    items.forEach(m => {
      const ext = (m.file_name || '').split('.').pop().toLowerCase();
      const ico = { pdf:'📄', doc:'📝', docx:'📝', xls:'📊', xlsx:'📊', zip:'🗜️', rar:'🗜️', txt:'📃', ppt:'📈', pptx:'📈' }[ext] || '📎';
      const row = document.createElement('div'); row.className = 'up-file-row';
      row.innerHTML = `<span class="up-file-ico">${ico}</span><div class="up-file-info"><div class="up-file-name">${esc(m.file_name || 'Файл')}</div><div class="up-file-sub">${ext ? ext.toUpperCase() : ''}</div></div>`;
      const src = normalizeFileSrc(m.text, m.file_name);
      if (src) row.onclick = () => openFile(src, m.file_name);
      tc.appendChild(row);
    });
  } else if (tab === 'links') {
    tc.innerHTML = '';
    items.forEach(item => {
      let host = item.url;
      try { host = new URL(item.url).hostname; } catch {}
      const row = document.createElement('a');
      row.className = 'up-link-row';
      row.href = item.url;
      row.target = '_blank';
      row.rel = 'noopener noreferrer';
      row.innerHTML = `<span class="up-link-ico">🔗</span><div class="up-file-info"><div class="up-link-url">${esc(item.url)}</div><div class="up-link-sub">${esc(host)}</div></div>`;
      tc.appendChild(row);
    });
  } else if (tab === 'voice') {
    tc.innerHTML = '';
    items.forEach(m => {
      const row = document.createElement('div'); row.className = 'up-voice-row';
      if (m.text && m.text.startsWith('data:')) row.appendChild(buildVoicePlayer(m.text));
      else row.textContent = '🎤 Голосовое';
      tc.appendChild(row);
    });
  }
}
let GINFO_GID = null, GINFO_IS_ADMIN = false, GINFO_MEMBERS = [], selGAdd = new Set();
function isGroupAdmin() {
  if (ACTIVE?.type !== 'group') return false;
  const g = GROUPS.find(x => x.id == ACTIVE.id);
  if (g?.is_admin) return true;
  return !!(ACTIVE.members || []).find(m => memberUserId(m) === ME.id && m.is_admin);
}
function groupApiError(err, action) {
  const m = String(err?.message || err || '');
  if (m === 'Not Found' || m.includes('404')) {
    return 'Сервер устарел — перезапустите backend (uvicorn) и обновите страницу';
  }
  return m || action || 'Ошибка';
}
function memberUserId(u) {
  const id = u?.user_id ?? u?.id;
  const n = parseInt(id, 10);
  return Number.isFinite(n) ? n : 0;
}
async function showGroupInfo(gid) {
  try {
    GINFO_GID = parseInt(gid, 10);
    if (!GINFO_GID) return toast('Группа не найдена', 'e');
    const g = GROUPS.find(x => x.id == GINFO_GID) || await req(`/groups/${GINFO_GID}`);
    GINFO_MEMBERS = await req(`/groups/${GINFO_GID}/members`);
    GINFO_IS_ADMIN = !!(g?.is_admin || GINFO_MEMBERS.find(m => memberUserId(m) === ME.id)?.is_admin);
    const av = document.getElementById('ginfo-av');
    applyAvatarEl(av, g?.avatar_b64, (g && g.avatar_emoji) || '👥', '#2AABEE');
    document.getElementById('ginfo-name').textContent = (g && g.name) || (ACTIVE && ACTIVE.name) || 'Группа';
    document.getElementById('ginfo-sub').textContent = `${GINFO_MEMBERS.length} ${plural(GINFO_MEMBERS.length, ['участник', 'участника', 'участников'])}`;
    document.getElementById('ginfo-add-btn').style.display = GINFO_IS_ADMIN ? '' : 'none';
    document.getElementById('ginfo-clear-btn').style.display = GINFO_IS_ADMIN ? '' : 'none';
    document.querySelectorAll('#ginfo-tabs .up-tab').forEach((t, i) => t.classList.toggle('act', i === 0));
    om('m-ginfo');
    loadGroupTab('members');
  } catch (e) { toast(e.message, 'e'); }
}
function switchGroupTab(btn, tab) {
  document.querySelectorAll('#ginfo-tabs .up-tab').forEach(t => t.classList.remove('act'));
  btn.classList.add('act');
  loadGroupTab(tab);
}
async function loadGroupTab(tab) {
  const tc = document.getElementById('ginfo-tab-content');
  if (!tc || !GINFO_GID) return;
  if (tab === 'members') { renderGroupMembers(tc); return; }
  tc.innerHTML = '<div class="up-tc-empty">Загрузка…</div>';
  try {
    const items = await req(`/groups/${GINFO_GID}/shared?kind=${tab}`);
    renderSharedTab(tc, items, tab);
  } catch (e) { tc.innerHTML = `<div class="up-tc-empty">${esc(groupApiError(e, 'Не удалось загрузить'))}</div>`; }
}
function renderGroupMembers(tc) {
  tc.innerHTML = '';
  const wrap = document.createElement('div'); wrap.className = 'ginfo-members';
  if (!GINFO_MEMBERS.length) {
    wrap.innerHTML = '<div class="up-tc-empty">Нет участников</div>';
    tc.appendChild(wrap);
    return;
  }
  GINFO_MEMBERS.forEach(u => {
    const uid = memberUserId(u);
    const row = document.createElement('div'); row.className = 'ginfo-mrow';
    row.innerHTML = avHtml(u.avatar_b64, u.avatar_emoji, u.avatar_color, 40) +
      `<div class="ginfo-minfo"><div class="ginfo-mname">${esc(u.display_name)}${u.is_admin ? ' <span class="ginfo-admin">админ</span>' : ''}</div><div class="ginfo-mun">@${esc(u.username)}</div></div>`;
    if (GINFO_IS_ADMIN && uid && uid !== ME.id) {
      const kick = document.createElement('button');
      kick.className = 'ginfo-kick';
      kick.title = 'Удалить из группы';
      kick.textContent = '✕';
      kick.onclick = e => { e.stopPropagation(); kickGroupMember(uid, u.display_name); };
      row.appendChild(kick);
    }
    if (uid && uid !== ME.id) row.onclick = () => { cm('m-ginfo'); showUserProfile(uid); };
    wrap.appendChild(row);
  });
  tc.appendChild(wrap);
}
async function openAddGroupMembers() {
  if (!GINFO_GID || !GINFO_IS_ADMIN) return;
  selGAdd = new Set();
  const ml = document.getElementById('gadd-mlist'); ml.innerHTML = '';
  const existing = new Set(GINFO_MEMBERS.map(m => memberUserId(m)));
  let candidates = CHATS.filter(u => u.id !== ME.id && !existing.has(u.id) && !u.is_saved);
  if (!candidates.length) { try { candidates = (await req('/users')).filter(u => u.id !== ME.id && !existing.has(u.id)); } catch { candidates = []; } }
  if (!candidates.length) ml.innerHTML = emptyHtml('Все контакты уже в группе');
  else candidates.forEach(u => {
    const d = document.createElement('label');
    d.className = 'mchk';
    const box = document.createElement('span'); box.className = 'mchk-box';
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.value = u.id;
    cb.onchange = () => {
      if (cb.checked) selGAdd.add(u.id); else selGAdd.delete(u.id);
      d.classList.toggle('sel', cb.checked);
      renderGAddChips(candidates);
    };
    box.appendChild(cb); d.appendChild(box);
    const av = document.createElement('span'); av.className = 'mchk-av';
    av.innerHTML = avHtml(u.avatar_b64, u.avatar_emoji, u.avatar_color, 40);
    d.appendChild(av);
    const info = document.createElement('span'); info.className = 'mchk-info';
    info.innerHTML = `<span class="mchk-name">${esc(u.display_name || u.username)}</span><span class="mchk-sub">@${esc(u.username || '')}</span>`;
    d.appendChild(info);
    ml.appendChild(d);
  });
  renderGAddChips(candidates);
  om('m-gadd');
}
function renderGAddChips(candidates) {
  const row = document.getElementById('gadd-chips');
  if (!row) return;
  row.innerHTML = '';
  candidates.filter(u => selGAdd.has(u.id)).forEach(u => {
    const c = document.createElement('div'); c.className = 'chip';
    c.innerHTML = `${u.avatar_emoji || '😊'} ${esc(u.display_name)}`;
    const x = document.createElement('span'); x.className = 'chip-x'; x.textContent = '×';
    x.onclick = e => {
      e.stopPropagation();
      selGAdd.delete(u.id);
      const cb = document.querySelector(`#gadd-mlist input[value="${u.id}"]`);
      if (cb) { cb.checked = false; cb.closest('.mchk')?.classList.remove('sel'); }
      renderGAddChips(candidates);
    };
    c.appendChild(x); row.appendChild(c);
  });
}
async function submitAddGroupMembers() {
  const gid = parseInt(GINFO_GID, 10);
  if (!gid || !selGAdd.size) return toast('Выберите участников', 'i');
  try {
    const r = await req(`/groups/${gid}/members`, 'POST', { member_ids: [...selGAdd].map(id => parseInt(id, 10)).filter(Boolean) });
    toast(`Добавлено: ${r.added}`, 'ok');
    cm('m-gadd');
    GINFO_MEMBERS = await req(`/groups/${gid}/members`);
    if (ACTIVE?.type === 'group' && ACTIVE.id == gid) {
      ACTIVE.members = GINFO_MEMBERS;
      setChSub(`${GINFO_MEMBERS.length} ${plural(GINFO_MEMBERS.length, ['участник', 'участника', 'участников'])}`);
    }
    document.getElementById('ginfo-sub').textContent = `${GINFO_MEMBERS.length} ${plural(GINFO_MEMBERS.length, ['участник', 'участника', 'участников'])}`;
    loadGroupTab('members');
    await refreshAll();
  } catch (e) { toast(groupApiError(e, 'Не удалось добавить'), 'e'); }
}
function kickGroupMember(uid, name) {
  if (!GINFO_GID || !GINFO_IS_ADMIN) return;
  const gid = parseInt(GINFO_GID, 10);
  const userId = parseInt(uid, 10);
  if (!gid || !userId) return toast('Некорректный участник', 'e');
  showConfirm('Удалить участника?', `Удалить ${name || 'участника'} из группы?`, [
    { label: 'Отмена', cls: 'btn-ghost', fn: () => cm('m-confirm') },
    { label: 'Удалить', cls: 'btn-danger', fn: () => doKickMember(gid, userId) }
  ]);
}
async function doKickMember(gid, uid) {
  cm('m-confirm');
  gid = parseInt(gid, 10);
  uid = parseInt(uid, 10);
  if (!gid || !uid) return toast('Некорректный участник', 'e');
  try {
    await req(`/groups/${gid}/members/remove`, 'POST', { user_id: uid });
    toast('Участник удалён', 'ok');
    GINFO_MEMBERS = GINFO_MEMBERS.filter(m => memberUserId(m) !== uid);
    if (ACTIVE?.type === 'group' && ACTIVE.id == gid) {
      ACTIVE.members = GINFO_MEMBERS;
      setChSub(`${GINFO_MEMBERS.length} ${plural(GINFO_MEMBERS.length, ['участник', 'участника', 'участников'])}`);
    }
    document.getElementById('ginfo-sub').textContent = `${GINFO_MEMBERS.length} ${plural(GINFO_MEMBERS.length, ['участник', 'участника', 'участников'])}`;
    loadGroupTab('members');
    await refreshAll();
  } catch (e) { toast(groupApiError(e, 'Не удалось удалить'), 'e'); }
}
function leaveGroup() {
  if (!GINFO_GID) return;
  showConfirm('Покинуть группу?', 'Вы больше не будете получать сообщения из этой группы.', [
    { label: 'Отмена', cls: 'btn-ghost', fn: () => cm('m-confirm') },
    { label: 'Покинуть', cls: 'btn-danger', fn: () => doLeaveGroup() }
  ]);
}
async function doLeaveGroup() {
  cm('m-confirm');
  const gid = parseInt(GINFO_GID, 10);
  if (!gid) return toast('Группа не найдена', 'e');
  try {
    await req(`/groups/${gid}/leave`, 'POST', {});
    cm('m-ginfo');
    toast('Вы вышли из группы', 'ok');
    if (ACTIVE?.type === 'group' && ACTIVE.id == gid) closeDialog();
    GINFO_GID = null;
    await refreshAll();
  } catch (e) { toast(groupApiError(e, 'Не удалось выйти'), 'e'); }
}
function clearGroupHistory() {
  if (!GINFO_GID || !GINFO_IS_ADMIN) return;
  showConfirm('Очистить историю?', 'Все сообщения будут удалены у всех участников. Это необратимо.', [
    { label: 'Отмена', cls: 'btn-ghost', fn: () => cm('m-confirm') },
    { label: 'Очистить', cls: 'btn-danger', fn: () => doClearGroupHistory() }
  ]);
}
async function doClearGroupHistory() {
  cm('m-confirm');
  const gid = parseInt(GINFO_GID, 10);
  if (!gid) return;
  try {
    const r = await req(`/groups/${gid}/messages`, 'DELETE');
    toast(`Удалено сообщений: ${r.cleared}`, 'ok');
    if (ACTIVE?.type === 'group' && ACTIVE.id == gid) {
      document.getElementById('msgs').innerHTML = '';
    }
  } catch (e) { toast(groupApiError(e, 'Не удалось очистить'), 'e'); }
}
let CHAT_SEARCH_ON = false, CHAT_SEARCH_HITS = [], CHAT_SEARCH_IDX = -1;
function openChatSearch() {
  if (!ACTIVE) return toast('Откройте чат', 'i');
  const bar = document.getElementById('chat-search-bar');
  if (!bar) return;
  CHAT_SEARCH_ON = !CHAT_SEARCH_ON;
  bar.style.display = CHAT_SEARCH_ON ? 'flex' : 'none';
  if (CHAT_SEARCH_ON) {
    const inp = document.getElementById('chat-search-inp');
    inp.value = ''; inp.focus();
    CHAT_SEARCH_HITS = []; CHAT_SEARCH_IDX = -1;
    updateChatSearchCount();
  } else {
    clearChatSearchHighlights();
  }
}
function clearChatSearchHighlights() {
  document.querySelectorAll('.msg-search-hit').forEach(el => el.classList.remove('msg-search-hit', 'msg-search-current'));
}
function runChatSearch(q) {
  clearChatSearchHighlights();
  CHAT_SEARCH_HITS = []; CHAT_SEARCH_IDX = -1;
  const query = q.trim().toLowerCase();
  if (!query) { updateChatSearchCount(); return; }
  document.querySelectorAll('#msgs .bub').forEach(bub => {
    const sp = bub.querySelector('span');
    const txt = (sp ? sp.textContent : bub.textContent || '').toLowerCase();
    if (txt.includes(query)) { bub.classList.add('msg-search-hit'); CHAT_SEARCH_HITS.push(bub); }
  });
  if (CHAT_SEARCH_HITS.length) { CHAT_SEARCH_IDX = CHAT_SEARCH_HITS.length - 1; focusChatHit(); }
  updateChatSearchCount();
}
function focusChatHit() {
  CHAT_SEARCH_HITS.forEach(b => b.classList.remove('msg-search-current'));
  const hit = CHAT_SEARCH_HITS[CHAT_SEARCH_IDX];
  if (hit) { hit.classList.add('msg-search-current'); hit.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  updateChatSearchCount();
}
function chatSearchNav(dir) {
  if (!CHAT_SEARCH_HITS.length) return;
  CHAT_SEARCH_IDX = (CHAT_SEARCH_IDX + dir + CHAT_SEARCH_HITS.length) % CHAT_SEARCH_HITS.length;
  focusChatHit();
}
function updateChatSearchCount() {
  const c = document.getElementById('chat-search-count');
  if (c) c.textContent = CHAT_SEARCH_HITS.length ? `${CHAT_SEARCH_IDX + 1}/${CHAT_SEARCH_HITS.length}` : '0/0';
}
function closeChatSearch() {
  CHAT_SEARCH_ON = false;
  const bar = document.getElementById('chat-search-bar');
  if (bar) bar.style.display = 'none';
  clearChatSearchHighlights();
}
let UP_UID = null;
async function showUserProfile(uid) {
  try {
    UP_UID = uid;
    const u = await req(`/users/${uid}`);
    const av = document.getElementById('up-av');
    applyAvatarEl(av, u.avatar_b64, u.avatar_emoji, u.avatar_color);
    document.getElementById('up-name').textContent = u.display_name;
    document.getElementById('up-un').textContent = '@' + u.username;
    const rows = document.getElementById('up-rows'); rows.innerHTML = '';
    if (uid !== ME.id && !u.hide_online) {
      const st = u.online ? 'в сети' : (u.last_seen ? fmtLastSeen(u.last_seen) : 'давно не был(а) в сети');
      rows.innerHTML = `<div class="up-row"><span class="up-k">Статус</span><span class="${u.online ? 'up-status-online' : ''}">${esc(st)}</span></div>`;
      if (u.last_seen && !u.online) lastSeenMap[uid] = u.last_seen;
    }
    if (u.phone) rows.innerHTML += `<div class="up-row"><span class="up-k">Телефон</span><span>${esc(u.phone)}</span></div>`;
    if (u.birth_date) rows.innerHTML += `<div class="up-row"><span class="up-k">День рождения</span><span>${esc(u.birth_date)}</span></div>`;
    const writeBtn = document.getElementById('up-write');
    const tabs = document.getElementById('up-tabs');
    const tc = document.getElementById('up-tab-content');
    if (uid === ME.id) {
      writeBtn.style.display = 'none';
      tabs.style.display = 'none';
      tc.innerHTML = '';
    } else {
      writeBtn.style.display = '';
      writeBtn.onclick = () => { cm('m-uprofile'); openDM({ ...u, chat_key: `dm_${u.id}` }); };
      tabs.style.display = 'flex';
      tabs.querySelectorAll('.up-tab').forEach((t, i) => t.classList.toggle('act', i === 0));
      loadUpTab('media');
    }
    om('m-uprofile');
  } catch (e) { toast(e.message, 'e'); }
}
function switchUpTab(btn, tab) {
  document.querySelectorAll('#up-tabs .up-tab').forEach(t => t.classList.remove('act'));
  btn.classList.add('act');
  loadUpTab(tab);
}
async function loadUpTab(tab) {
  const tc = document.getElementById('up-tab-content');
  if (!tc || UP_UID === null) return;
  tc.innerHTML = '<div class="up-tc-empty">Загрузка…</div>';
  try {
    if (tab === 'groups') {
      const groups = await req(`/common_groups/${UP_UID}`);
      if (!groups.length) { tc.innerHTML = '<div class="up-tc-empty">Нет общих групп</div>'; return; }
      tc.innerHTML = '';
      groups.forEach(g => {
        const row = document.createElement('div'); row.className = 'up-grp-row';
        row.innerHTML = avHtml(g.avatar_b64, g.avatar_emoji, '#2AABEE', 40) +
          `<div class="up-grp-info"><div class="up-grp-name">${esc(g.name)}</div><div class="up-grp-sub">${g.member_count} участников</div></div>`;
        row.onclick = () => { const gg = GROUPS.find(x => x.id === g.id); if (gg) { cm('m-uprofile'); openGroup(gg); } };
        tc.appendChild(row);
      });
      return;
    }
    const items = await req(`/shared/${UP_UID}?kind=${tab}`);
    if (!items.length) {
      tc.innerHTML = `<div class="up-tc-empty">${tab === 'media' ? 'Нет медиа' : tab === 'files' ? 'Нет файлов' : 'Нет голосовых'}</div>`;
      return;
    }
    if (tab === 'media') {
      tc.innerHTML = '';
      const grid = document.createElement('div'); grid.className = 'up-media-grid';
      items.forEach(m => {
        if (!m.text || !m.text.startsWith('data:')) return;
        const im = document.createElement('img'); im.src = m.text; im.className = 'up-media-thumb';
        im.onclick = () => openLightbox(m.text, m.file_name);
        grid.appendChild(im);
      });
      tc.appendChild(grid);
    } else if (tab === 'files') {
      tc.innerHTML = '';
      items.forEach(m => {
        const ext = (m.file_name || '').split('.').pop().toLowerCase();
        const ico = { pdf:'📄', doc:'📝', docx:'📝', xls:'📊', xlsx:'📊', zip:'🗜️', rar:'🗜️', txt:'📃', ppt:'📈', pptx:'📈' }[ext] || '📎';
        const row = document.createElement('div'); row.className = 'up-file-row';
        row.innerHTML = `<span class="up-file-ico">${ico}</span><div class="up-file-info"><div class="up-file-name">${esc(m.file_name || 'Файл')}</div><div class="up-file-sub">${ext ? ext.toUpperCase() : ''}</div></div>`;
        const src = normalizeFileSrc(m.text, m.file_name);
      if (src) row.onclick = () => openFile(src, m.file_name);
        tc.appendChild(row);
      });
    } else if (tab === 'voice') {
      tc.innerHTML = '';
      items.forEach(m => {
        const row = document.createElement('div'); row.className = 'up-voice-row';
        if (m.text && m.text.startsWith('data:')) row.appendChild(buildVoicePlayer(m.text));
        else row.textContent = '🎤 Голосовое';
        tc.appendChild(row);
      });
    }
  } catch (e) { tc.innerHTML = `<div class="up-tc-empty">${esc(e.message)}</div>`; }
}

/* ═══ MARKDOWN (Telegram-style tokens) ═══ */
function renderMd(text) {
  let s = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Pull out fragments that must NOT be touched by inline rules (code, links),
  // replace them with placeholders, run inline formatting, then restore them.
  const slots = [];
  const stash = (html) => { slots.push(html); return `\u0000${slots.length - 1}\u0000`; };
  // fenced + inline code
  s = s.replace(/```([\s\S]*?)```/g, (_, c) => stash(`<code class="md-pre">${c}</code>`));
  s = s.replace(/`([^`\n]+)`/g, (_, c) => stash(`<code class="md-code">${c}</code>`));
  // links (protected so __ ~~ etc. inside URLs are left alone)
  s = s.replace(/(https?:\/\/[^\s<]+)/g, (u) => stash(`<a class="md-link" href="${u}" target="_blank" rel="noopener">${u}</a>`));
  // inline styles on the remaining plain text
  s = s.replace(/\|\|([\s\S]+?)\|\|/g, '<span class="md-spoiler" onclick="this.classList.add(\'revealed\')">$1</span>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<b class="md-b">$1</b>');
  s = s.replace(/__(.+?)__/g, '<i class="md-i">$1</i>');
  s = s.replace(/\+\+(.+?)\+\+/g, '<u class="md-u">$1</u>');
  s = s.replace(/~~(.+?)~~/g, '<s class="md-s">$1</s>');
  // restore protected fragments
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => slots[+i]);
  return s;
}
function hasMd(text) { return /\*\*|__|\+\+|~~|`|\|\||https?:\/\//.test(text); }

/* ═══ RENDER MESSAGES ═══ */
function showMsgsLoading() {
  const area = document.getElementById('msgs');
  if (!area) return;
  area.innerHTML = `<div class="msgs-loading"><div class="msgs-spin"></div></div>`;
  applyChatBg();
}
function renderMsgs(msgs, type, members = []) {
  const area = document.getElementById('msgs'); area.innerHTML = '';
  applyChatBg();
  if (!msgs.length) {
    const hint = isActiveSaved()
      ? 'Сохраняйте сюда заметки, ссылки и пересланные сообщения'
      : 'Начните переписку 👋';
    area.innerHTML = `<div style="text-align:center;color:var(--t3);font-size:13px;margin-top:40px">${hint}</div>`;
    return;
  }
  let ld = '';
  for (const m of msgs) {
    if (m.deleted) continue; // skip deleted messages entirely
    const d = new Date(m.timestamp);
    const ds = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    if (ds !== ld) { ld = ds; area.appendChild(mkDsep(ds)); }
    const mine = m.sender_id === ME.id;
    const sndr = type === 'group' ? (members.find(u => u.id === m.sender_id) || null) : null;
    appendBub(area, m, mine, sndr, false);
  }
  scrollMsgs();
}
function tickHtml(m) {
  const mine = m.sender_id === ME.id;
  let cls = 'tick';
  if (m.is_read) cls = 'tick read';
  else if (m.is_delivered) cls = 'tick delivered';
  const dbl = m.is_delivered || m.is_read;
  const one = `<span class="${cls}">✓</span>`;
  const two = `${one}<span class="${cls}">✓</span>`;
  const click = mine ? ` class="ticks ticks-click" onclick="showReadInfo(event,${m.id})" title="Кто просмотрел"` : ` class="ticks"`;
  return `<span${click} data-id="${m.id}">${dbl ? two : one}</span>`;
}
async function showReadInfo(e, msgId) {
  e.stopPropagation();
  e.preventDefault();
  try {
    const info = await req(`/messages/${msgId}/read-info`);
    const list = document.getElementById('readinfo-list');
    const title = document.getElementById('readinfo-title');
    if (!list) return;
    if (info.readers && info.readers.length) {
      title.textContent = info.readers.length === 1 ? 'Просмотрено' : 'Просмотрели';
      list.innerHTML = info.readers.map(r =>
        `<div class="readinfo-row"><div class="readinfo-name">${esc(r.display_name)}</div><div class="readinfo-time">${fmtReadAt(r.read_at)}</div></div>`
      ).join('');
    } else if (info.is_delivered) {
      title.textContent = 'Доставлено';
      list.innerHTML = '<div class="readinfo-empty">Сообщение доставлено, но ещё не просмотрено</div>';
    } else {
      title.textContent = 'Статус';
      list.innerHTML = '<div class="readinfo-empty">Сообщение ещё не доставлено</div>';
    }
    om('m-readinfo');
  } catch (err) { toast(err.message || 'Не удалось загрузить', 'e'); }
}
function buildInlineMeta(m, mine) {
  const t = new Date(m.timestamp || Date.now());
  let html = `<span class="bmi-time">${fmtTime(t)}</span>`;
  if (m.edited) html += `<span class="bmi-ed"> изменено</span>`;
  if (mine) html += tickHtml(m);
  return html;
}
function appendMediaCaption(bub, m, mine) {
  const cap = (m.caption || '').trim();
  if (!cap) return false;
  bub.classList.add('bub-media');
  const foot = document.createElement('div');
  foot.className = 'bub-media-foot';
  const capEl = document.createElement('div');
  capEl.className = 'bub-cap';
  if (hasMd(cap)) capEl.innerHTML = renderMd(cap);
  else capEl.textContent = cap;
  foot.appendChild(capEl);
  const meta = document.createElement('div');
  meta.className = 'bub-meta-in';
  meta.innerHTML = buildInlineMeta(m, mine);
  foot.appendChild(meta);
  bub.appendChild(foot);
  return true;
}
function mkDsep(l) { const d = document.createElement('div'); d.className = 'dsep'; d.innerHTML = `<span>${l}</span>`; return d; }
function prevMsgRow(area) {
  for (let el = area.lastElementChild; el; el = el.previousElementSibling) {
    if (el.classList.contains('mr')) return el;
  }
  return null;
}
function isGroupMsgHead(area, m, mine, sender) {
  if (mine || !sender) return false;
  const prev = prevMsgRow(area);
  if (!prev || prev.classList.contains('out')) return true;
  if (prev.dataset.senderId !== String(m.sender_id)) return true;
  const prevTs = Number(prev.dataset.ts);
  const ts = new Date(m.timestamp).getTime();
  if (prevTs && ts - prevTs > 5 * 60 * 1000) return true;
  return false;
}

function appendBub(area, m, mine, sender = null, animate = true) {
  if (m.deleted) return; // Telegram-style: don't show deleted
  // Remove "start chat" placeholder if present
  const placeholder = area.querySelector('div[style*="text-align:center"]');
  if (placeholder && placeholder.textContent.includes('Начните')) placeholder.remove();
  const text = m.text || '';
  const isE = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\s){1,3}$/u.test(text.trim()) && text.trim().length > 0;
  const row = document.createElement('div');
  row.className = 'mr ' + (mine ? 'out' : 'in');
  row.dataset.id = m.id;
  if (m.temp_id) row.dataset.tmp = m.temp_id;

  const isGroupIn = !mine && sender;
  const isHead = isGroupIn && isGroupMsgHead(area, m, mine, sender);
  if (isGroupIn) {
    row.classList.add('mr-g');
    row.classList.add(isHead ? 'mr-g-head' : 'mr-g-cont');
    row.dataset.senderId = m.sender_id;
    row.dataset.ts = String(new Date(m.timestamp).getTime());
    if (isHead) {
      const av = document.createElement('div'); av.className = 'mr-av';
      applyAvatarEl(av, sender.avatar_b64, sender.avatar_emoji || '😊', sender.avatar_color || '#2AABEE');
      row.appendChild(av);
    } else {
      const sp = document.createElement('div');
      sp.className = 'mr-av-sp';
      sp.setAttribute('aria-hidden', 'true');
      row.appendChild(sp);
    }
  }

  const bw = document.createElement('div'); bw.className = 'bw' + (isGroupIn ? ' bw-g' : '');
  if (isHead) {
    const sn = document.createElement('div');
    sn.className = 'bw-sn';
    sn.textContent = sender.display_name;
    sn.style.color = senderNameColor(m.sender_id);
    bw.appendChild(sn);
  }

  const bub = document.createElement('div');
  bub.dataset.id = m.id;
  if (m.temp_id) bub.dataset.tmp = m.temp_id;
  bub.classList.add('bub', mine ? 'out' : 'in');
  if (isE && m.msg_type === 'text') bub.classList.add('big-e');
  if (m.pinned) bub.classList.add('pinned-mark');
  if (!animate) bub.style.animation = 'none';
  let inlineMeta = false;

  if (m.forward_from_name) {
    bub.appendChild(buildForwardFrom(m.forward_from_name, m.forward_from_id));
  }

  // reply
  if (m.reply_to_id && m.reply_preview) {
    bub.appendChild(buildReplyQuote(m.reply_to_id, m.reply_preview, m.reply_from_name, m.reply_from_id));
  }

  if (m.msg_type === 'voice') {
    bub.appendChild(buildVoicePlayer(text));
  } else if (m.msg_type === 'image' && (text.startsWith('data:') || text.startsWith('blob:'))) {
    const img = document.createElement('img');
    img.src = text; img.className = 'img-bub'; img.loading = 'eager';
    img.alt = m.file_name || 'Изображение';
    img.onclick = e => { e.stopPropagation(); if (SELECT_MODE) { toggleSelect(m); return; } openLightbox(text, m.file_name); };
    bub.appendChild(img);
    inlineMeta = appendMediaCaption(bub, m, mine);
  } else if (m.msg_type === 'file' && (m.file_name || text)) {
    const fname = m.file_name || 'Файл';
    const ext = (fname.split('.').pop() || '').toLowerCase();
    const src = normalizeFileSrc(text, fname);
    const ico = { pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', mp4: '🎬', mp3: '🎵', zip: '🗜️', rar: '🗜️', txt: '📃', ppt: '📈', pptx: '📈' }[ext] || '📎';
    const f = document.createElement('div'); f.className = 'fb';
    const action = src ? (isBrowserViewable(fname, '') ? 'открыть' : 'скачать') : 'недоступен';
    f.innerHTML = `<span class="fb-ic">${ico}</span><div class="fb-meta"><div class="fn">${esc(fname)}</div><div class="fsz">${ext ? ext.toUpperCase() + ' · ' : ''}${action}</div></div>`;
    if (src) {
      f.style.cursor = 'pointer';
      f.onclick = e => { e.stopPropagation(); if (SELECT_MODE) { toggleSelect(m); return; } openFile(src, fname); };
      f.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); downloadFile(src, fname); };
    }
    bub.appendChild(f);
    if (!inlineMeta) inlineMeta = appendMediaCaption(bub, m, mine);
  } else if (isE) {
    const span = document.createElement('span');
    span.className = 'bub-txt';
    span.textContent = text;
    bub.appendChild(span);
  } else {
    const wrap = document.createElement('div');
    wrap.className = 'bub-text-wrap';
    const span = document.createElement('span');
    span.className = 'bub-txt';
    if (!isE && hasMd(text)) span.innerHTML = renderMd(text);
    else span.textContent = text;
    wrap.appendChild(span);
    const meta = document.createElement('div');
    meta.className = 'bub-meta-in';
    meta.innerHTML = buildInlineMeta(m, mine);
    wrap.appendChild(meta);
    bub.appendChild(wrap);
    inlineMeta = true;
  }

  // reactions
  mountReactions(bub, m.id, m.reactions || {});

  bub.addEventListener('contextmenu', e => {
    if (row.dataset.lpFired) { e.preventDefault(); return; }
    e.preventDefault(); msgCtx(e, m, mine);
  });
  bub.addEventListener('dblclick', e => { if (SELECT_MODE) return; e.preventDefault(); showReactPop(e, m.id); });
  bw.appendChild(bub);

  if (!inlineMeta) {
    const bm = document.createElement('div');
    bm.className = 'bm' + (mine ? ' out' : '');
    const t = new Date(m.timestamp);
    let meta = `<span>${fmtTime(t)}</span>`;
    if (m.edited) meta += `<span style="font-style:italic;opacity:.7"> изменено</span>`;
    if (mine) meta += tickHtml(m);
    bm.innerHTML = meta;
    bw.appendChild(bm);
  }
  row.appendChild(bw);
  row.appendChild(createMsgSelChk());
  bindMsgSelectRow(row, m);
  area.appendChild(row);
  twemojify(row);
}

function createMsgSelChk() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mr-selchk';
  btn.setAttribute('aria-label', 'Выбрать сообщение');
  btn.tabIndex = -1;
  btn.innerHTML = '<svg viewBox="0 0 12 10" fill="none" aria-hidden="true"><path d="M1 5.2 4.2 8.4 11 1.2" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  return btn;
}
function bindMsgSelectRow(row, m) {
  if (!row || !m || m.id === 'tmp') return;
  const chk = row.querySelector('.mr-selchk');
  const canSelect = () => SELECT_MODE && m.id !== 'tmp';
  const onSelectTap = e => {
    if (!canSelect()) return;
    e.preventDefault();
    e.stopPropagation();
    toggleSelect(m);
  };
  row.addEventListener('click', e => {
    if (!canSelect()) return;
    if (e.target.closest('.react, .vb-btn, .img-bub, .fb, .ticks-click, .rq, .fwd-from')) return;
    onSelectTap(e);
  });
  chk?.addEventListener('click', onSelectTap);
  bindMsgLongPress(row, m);
}
function bindMsgLongPress(row, m) {
  if (!row || !m || m.id === 'tmp') return;
  let timer = null;
  let sx = 0, sy = 0;
  const LONG_MS = 480;
  const MOVE_TOL = 14;
  const clear = () => { if (timer) { clearTimeout(timer); timer = null; } };
  const fire = e => {
    clear();
    e?.preventDefault?.();
    row.dataset.lpFired = '1';
    setTimeout(() => { delete row.dataset.lpFired; }, 500);
    hideCtx(); hideEP(); hideRP(); hideFmtPop();
    enterSelect(m);
    try { navigator.vibrate?.(12); } catch {}
  };
  const start = (x, y, e) => {
    if (SELECT_MODE) return;
    sx = x; sy = y;
    clear();
    timer = setTimeout(() => fire(e), LONG_MS);
  };
  const move = (x, y) => {
    if (!timer) return;
    if (Math.abs(x - sx) > MOVE_TOL || Math.abs(y - sy) > MOVE_TOL) clear();
  };
  row.addEventListener('mousedown', e => { if (e.button !== 0) return; start(e.clientX, e.clientY, e); });
  row.addEventListener('mousemove', e => move(e.clientX, e.clientY));
  row.addEventListener('mouseup', clear);
  row.addEventListener('mouseleave', clear);
  row.addEventListener('touchstart', e => {
    if (!e.touches[0]) return;
    start(e.touches[0].clientX, e.touches[0].clientY, e);
  }, { passive: false });
  row.addEventListener('touchmove', e => {
    if (!e.touches[0]) return;
    move(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  row.addEventListener('touchend', clear);
  row.addEventListener('touchcancel', clear);
}

/* ═══ VOICE PLAYER ═══ */
function buildVoicePlayer(dataUrl) {
  const vb = document.createElement('div'); vb.className = 'vb';
  const btn = document.createElement('div'); btn.className = 'vb-btn';
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
  const svg = buildWaveSVG();
  const tspan = document.createElement('span'); tspan.className = 'vb-time-label'; tspan.textContent = '';
  vb.appendChild(btn); vb.appendChild(svg); vb.appendChild(tspan);
  let audio = null;
  btn.onclick = e => {
    e.stopPropagation();
    if (!audio) {
      audio = new Audio(dataUrl);
      audio.onended = () => { btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>'; tspan.textContent = ''; };
      audio.ontimeupdate = () => { const s = Math.round(audio.currentTime); tspan.textContent = `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`; };
    }
    if (audio.paused) { audio.play().catch(() => {}); btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'; }
    else { audio.pause(); btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>'; }
  };
  return vb;
}
function buildWaveSVG() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 120 28'); svg.setAttribute('width', '100'); svg.setAttribute('height', '28');
  svg.style.flex = '1';
  for (let i = 0; i < 28; i++) {
    const h = 3 + Math.random() * 18;
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', String(i * 4 + 2)); rect.setAttribute('y', String(14 - h / 2));
    rect.setAttribute('width', '3'); rect.setAttribute('height', String(h));
    rect.setAttribute('rx', '1.5'); rect.setAttribute('fill', 'currentColor'); rect.style.opacity = '0.65';
    svg.appendChild(rect);
  }
  return svg;
}
let _lbSrc = '', _lbName = '';
function openLightbox(src, fname) { _lbSrc = src; _lbName = fname || ('photo_' + Date.now() + '.jpg'); document.getElementById('lb-img').src = src; document.getElementById('lightbox').style.display = 'flex'; }
function closeLightbox() { document.getElementById('lightbox').style.display = 'none'; }
function downloadLightbox() { if (_lbSrc) downloadData(_lbSrc, _lbName); }
function scrollToMsg(id) {
  const r = document.querySelector(`.mr[data-id="${id}"]`);
  if (r) { r.scrollIntoView({ behavior: 'smooth', block: 'center' }); r.style.outline = '2px solid var(--acc)'; setTimeout(() => r.style.outline = '', 450); }
}
function scrollMsgs() {
  const a = document.getElementById('msgs');
  if (!a) return;
  a.scrollTop = a.scrollHeight;
  requestAnimationFrame(() => { a.scrollTop = a.scrollHeight; });
}
function fmtTime(d) { return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

/* ═══ SEND ═══ */
function autoGrow(t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 128) + 'px'; }
function onType() {
  const mi = document.getElementById('msg-inp');
  const v = mi ? mi.value.trim() : '';
  const sb = document.getElementById('send-btn');
  const ca = document.getElementById('composer-action');
  const hasStaged = STAGED.length > 0;
  const editing = !!EDITING;
  const showSend = (v || hasStaged || editing) && ACTIVE;
  if (sb) sb.disabled = !showSend;
  if (ca) {
    ca.classList.toggle('chat-open', !!ACTIVE);
    ca.classList.toggle('has-text', !!showSend);
  }
}
function onKey(e) {
  if (e.key === 'Enter' && !e.shiftKey && !e.altKey) { e.preventDefault(); sendMsg(); }
}
async function sendMsg() {
  // editing an existing message takes priority
  if (EDITING) { await commitEdit(); return; }
  // a staged file takes priority — send it (with optional caption)
  if (STAGED.length) { await sendStaged(); return; }
  const mi = document.getElementById('msg-inp');
  const text = mi.value.trim();
  if (!text || !ACTIVE) return;
  mi.value = ''; autoGrow(mi); onType(); hideEP();
  // clear draft
  delete DRAFTS[draftKey()];
  // stop typing immediately
  IS_TYPING = false; clearTimeout(TYPING_TIMER); sendTyping(false);
  // update sidebar immediately
  const now = new Date().toISOString();
  if (ACTIVE.type === 'dm') {
    touchChatRow(findDmChat(activeDmPartnerId()), text, now);
  } else {
    let group = GROUPS.find(g => g.id === ACTIVE.id);
    if (group) { group.last_text = text.slice(0, 60); group.last_ts = now; }
  }
  renderContacts();
  await send(text, 'text', null);
}
async function send(text, type, fname) {
  if (!ACTIVE || !ME) return;
  if (ACTIVE.type === 'dm' && isSavedPartnerId(ACTIVE.id) && !isActiveSaved()) {
    toast('Не удалось определить получателя', 'e');
    return;
  }
  const tmp = 't' + Date.now() + Math.random().toString(36).slice(2, 6);
  const fake = {
    id: 'tmp', temp_id: tmp, sender_id: myUserId(), text, msg_type: type, file_name: fname,
    timestamp: new Date().toISOString(), is_read: false, is_delivered: false,
    edited: false, reactions: {}, ...replyPayloadExtra()
  };
  appendBub(document.getElementById('msgs'), fake, true, null, true);
  scrollMsgs();
  const payload = { text, msg_type: type, file_name: fname, temp_id: tmp, ...replyPayloadExtra() };
  if (ACTIVE.type === 'dm') payload.recipient_id = activeDmPartnerId();
  else payload.group_id = ACTIVE.id;
  try {
    await dispatchMsg(payload);
  } catch (e) {
    document.querySelector(`.mr[data-tmp="${tmp}"]`)?.remove();
    toast(e.message || 'Не удалось отправить', 'e');
  }
  cancelReply();
}

/* Files — stage first, let user add a caption, then send on the send button */
function triggerFile() { document.getElementById('file-inp').click(); }

async function uploadAndSend(file, sizeLimit = 50 * 1024 * 1024) {
  // kept for compatibility (e.g. pasted images) — now routes through staging
  stageFile(file, sizeLimit);
}

function fileMsgKind(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const isImg = ['jpg','jpeg','png','gif','webp','bmp','svg'].includes(ext) || (file.type || '').startsWith('image/');
  return isImg ? 'image' : 'file';
}
function fileIco(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  return { pdf:'📄', doc:'📝', docx:'📝', xls:'📊', xlsx:'📊', mp4:'🎬', mp3:'🎵', zip:'🗜️', rar:'🗜️', txt:'📃', ppt:'📈', pptx:'📈' }[ext] || '📎';
}
function renderStagedUI() {
  const stage = document.getElementById('attach-stage');
  const grid = document.getElementById('as-grid');
  if (!STAGED.length) {
    stage.style.display = 'none';
    return;
  }
  grid.innerHTML = '';
  let totalBytes = 0;
  STAGED.forEach((st, idx) => {
    totalBytes += st.size || 0;
    const cell = document.createElement('div');
    cell.className = 'as-item';
    const inner = document.createElement('div');
    inner.className = 'as-item-in';
    if (st.msg_type === 'image' && st._objurl) {
      inner.style.backgroundImage = `url('${st._objurl}')`;
      inner.textContent = '';
    } else {
      inner.style.backgroundImage = '';
      inner.textContent = fileIco(st.file_name);
    }
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'as-item-rm';
    rm.textContent = '×';
    rm.title = 'Убрать';
    rm.onclick = e => { e.stopPropagation(); removeStaged(idx); };
    cell.appendChild(inner);
    cell.appendChild(rm);
    grid.appendChild(cell);
  });
  const isImg = STAGED[0].msg_type === 'image';
  document.getElementById('as-name').textContent = STAGED.length === 1
    ? STAGED[0].file_name
    : `${STAGED.length} ${isImg ? 'фото' : 'файла'}`;
  document.getElementById('as-size').textContent = (totalBytes / 1048576 >= 1)
    ? (totalBytes / 1048576).toFixed(1) + ' МБ'
    : Math.max(1, Math.round(totalBytes / 1024)) + ' КБ';
  stage.style.display = 'flex';
}
function removeStaged(idx) {
  const st = STAGED[idx];
  if (st?._objurl) { try { URL.revokeObjectURL(st._objurl); } catch {} }
  STAGED.splice(idx, 1);
  if (!STAGED.length) cancelStaged();
  else renderStagedUI();
  onType();
}
function stageFiles(files, forceKind = null, sizeLimit = 50 * 1024 * 1024) {
  if (!files?.length || !ACTIVE) return;
  let added = 0;
  for (const file of files) {
    if (STAGED.length >= MAX_ATTACH) {
      if (!added) toast(`Максимум ${MAX_ATTACH} вложений`, 'e');
      break;
    }
    if (file.size > sizeLimit) {
      toast(`${file.name}: слишком большой (макс. 50 МБ)`, 'e');
      continue;
    }
    const kind = fileMsgKind(file);
    if (forceKind === 'file' && kind === 'image') continue;
    if (forceKind === 'image' && kind !== 'image') continue;
    if (STAGED.length && STAGED[0].msg_type !== kind) {
      toast('Нельзя смешивать фото и документы', 'e');
      return;
    }
    const item = { file, msg_type: kind, file_name: file.name, size: file.size };
    if (kind === 'image') item._objurl = URL.createObjectURL(file);
    STAGED.push(item);
    added++;
  }
  if (!added) return;
  renderStagedUI();
  const mi = document.getElementById('msg-inp');
  mi.placeholder = 'Добавьте подпись…';
  mi.focus();
  onType();
}
function stageFile(file, sizeLimit = 50 * 1024 * 1024) {
  stageFiles([file], null, sizeLimit);
}

function cancelStaged() {
  STAGED.forEach(st => { if (st._objurl) { try { URL.revokeObjectURL(st._objurl); } catch {} } });
  STAGED = [];
  document.getElementById('attach-stage').style.display = 'none';
  document.getElementById('as-grid').innerHTML = '';
  const mi = document.getElementById('msg-inp');
  mi.placeholder = 'Сообщение';
  onType();
}

async function sendStaged() {
  if (!STAGED.length || !ACTIVE) return;
  const mi = document.getElementById('msg-inp');
  const caption = mi.value.trim();
  const items = STAGED.map(st => ({
    file: st.file,
    msg_type: st.msg_type,
    file_name: st.file_name,
    previewUrl: URL.createObjectURL(st.file),
  }));
  cancelStaged();
  mi.value = '';
  autoGrow(mi);
  onType();
  toast(items.length > 1 ? `Отправка ${items.length}…` : 'Отправка…', 'i');
  let lastPreview = '';
  for (let i = 0; i < items.length; i++) {
    const st = items[i];
    const cap = i === 0 ? caption : '';
    const tmp = 't' + Date.now() + Math.random().toString(36).slice(2, 6);
    let previewText = st.previewUrl;
    if (st.msg_type === 'image') {
      try { previewText = await fileToDataUrl(st.file); } catch {}
    }
    if (st.previewUrl && previewText !== st.previewUrl) {
      try { URL.revokeObjectURL(st.previewUrl); } catch {}
    }
    const fake = {
      id: 'tmp', temp_id: tmp, sender_id: ME.id, text: previewText,
      msg_type: st.msg_type, file_name: st.file_name, caption: cap || null,
      timestamp: new Date().toISOString(), is_read: false, is_delivered: false,
      edited: false, reactions: {},
      reply_to_id: i === 0 ? REPLY?.id : null,
      reply_preview: i === 0 ? REPLY?.text?.slice(0, 200) : null,
      reply_from_name: i === 0 ? REPLY?.author : null,
      reply_from_id: i === 0 ? REPLY?.author_id : null,
    };
    appendBub(document.getElementById('msgs'), fake, true, null, true);
    scrollMsgs();
    lastPreview = cap || (st.msg_type === 'image' ? '🖼️ Изображение' : '📎 ' + st.file_name);
    try {
      const fd = new FormData();
      fd.append('file', st.file);
      const r = await fetch(`${API}/upload`, { method: 'POST', headers: { Authorization: `Bearer ${ME.token}` }, body: fd });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || 'Ошибка загрузки');
      const d = await r.json();
      patchTempBubbleImage(tmp, d.data_b64, { ...fake, msg_type: d.msg_type, text: d.data_b64, file_name: d.file_name });
      const payload = { text: d.data_b64, msg_type: d.msg_type, file_name: d.file_name, temp_id: tmp };
      if (cap) payload.caption = cap;
      if (i === 0 && REPLY) {
        payload.reply_to_id = REPLY.id;
        payload.reply_preview = REPLY.text?.slice(0, 200);
        payload.reply_from_name = REPLY.author;
        payload.reply_from_id = REPLY.author_id;
      }
      if (ACTIVE.type === 'dm') payload.recipient_id = activeDmPartnerId();
      else payload.group_id = ACTIVE.id;
      await dispatchMsg(payload);
    } catch (e) {
      toast(e.message, 'e');
      const row = document.querySelector(`.mr[data-tmp="${tmp}"]`);
      if (row) row.remove();
      if (st.previewUrl) { try { URL.revokeObjectURL(st.previewUrl); } catch {} }
    }
  }
  if (lastPreview) {
    const now = new Date().toISOString();
    if (ACTIVE.type === 'dm') touchChatRow(findDmChat(activeDmPartnerId()), lastPreview, now);
    else {
      const group = GROUPS.find(g => g.id === ACTIVE.id);
      if (group) { group.last_text = lastPreview.slice(0, 60); group.last_ts = now; }
    }
    renderContacts();
  }
  cancelReply();
}

async function handleFile(inp, forceKind) {
  const files = [...(inp.files || [])];
  inp.value = '';
  if (!files.length) return;
  stageFiles(files, forceKind || null);
}
// Paste image from clipboard (Ctrl+V) into chat
async function handlePaste(e) {
  if (!ACTIVE) return;
  const items = (e.clipboardData || window.clipboardData)?.items;
  if (!items) return;
  for (const it of items) {
    if (it.type && it.type.startsWith('image/')) {
      const blob = it.getAsFile();
      if (blob) {
        e.preventDefault();
        if (STAGED.length >= MAX_ATTACH) return toast(`Максимум ${MAX_ATTACH} вложений`, 'e');
        const ext = (it.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
        const named = new File([blob], `screenshot_${Date.now()}.${ext}`, { type: it.type });
        stageFiles([named], 'image');
        return;
      }
    }
  }
}

/* Voice recording */
let vCanvas = null, vCtx2d = null;
async function startVoice() {
  if (!ACTIVE) return toast('Откройте чат', 'i');
  if (!navigator.mediaDevices?.getUserMedia) return toast('Браузер не поддерживает запись', 'e');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    vChunks = []; vSec = 0;
    vCanvas = document.getElementById('voice-wave'); vCtx2d = vCanvas?.getContext('2d');
    vRec = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '' });
    vRec.ondataavailable = e => { if (e.data.size) vChunks.push(e.data); };
    vRec.onstop = () => {
      stream.getTracks().forEach(t => t.stop()); cancelAnimationFrame(vAnim);
      if (!vChunks.length) return;
      const blob = new Blob(vChunks, { type: 'audio/webm' });
      if (blob.size > 5 * 1024 * 1024) { toast('Слишком длинное', 'e'); return; }
      const rd = new FileReader(); rd.onload = e => send(e.target.result, 'voice', null); rd.readAsDataURL(blob);
    };
    let analyser = null;
    try { const ac = new AudioContext(); const src = ac.createMediaStreamSource(stream); analyser = ac.createAnalyser(); analyser.fftSize = 64; src.connect(analyser); } catch {}
    vRec.start(100);
    document.getElementById('voice-bar').style.display = 'flex';
    document.getElementById('input-row').style.display = 'none';
    document.getElementById('voice-btn').classList.add('rec');
    document.getElementById('voice-time').textContent = '0:00';
    vTimer = setInterval(() => {
      vSec++;
      if (vSec >= 120) { stopVoice(); return; }
      document.getElementById('voice-time').textContent = `${Math.floor(vSec / 60)}:${(vSec % 60).toString().padStart(2, '0')}`;
    }, 1000);
    if (vCtx2d && analyser) {
      const buf = new Uint8Array(analyser.frequencyBinCount);
      function draw() { vAnim = requestAnimationFrame(draw); analyser.getByteFrequencyData(buf); const w = vCanvas.width, h = vCanvas.height; vCtx2d.clearRect(0, 0, w, h); vCtx2d.fillStyle = 'rgba(42,171,238,0.8)'; const bw = w / buf.length; buf.forEach((v, i) => { const bh = Math.max(2, (v / 255) * h); vCtx2d.fillRect(i * bw, h - bh, bw - 1, bh); }); }
      draw();
    }
  } catch { toast('Нет доступа к микрофону', 'e'); }
}
function stopVoice() { if (vRec && vRec.state !== 'inactive') vRec.stop(); endVoiceUI(); }
function cancelVoice() {
  if (vRec && vRec.state !== 'inactive') { vRec.ondataavailable = null; vRec.onstop = () => {}; vRec.stop(); }
  vChunks = []; cancelAnimationFrame(vAnim); endVoiceUI();
}
function endVoiceUI() {
  clearInterval(vTimer);
  document.getElementById('voice-bar').style.display = 'none';
  document.getElementById('input-row').style.display = 'flex';
  document.getElementById('voice-btn').classList.remove('rec');
  onType();
}

/* ═══ EMOJI RENDER — native system emoji (как в Telegram) ═══ */
function twemojify(el) { /* каждая ОС рисует свои эмодзи */ }


/* ═══ EMOJI PICKER ═══ */
function buildEP() {
  const cats = document.getElementById('ep-cats');
  cats.innerHTML = '';
  EPC.forEach((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'epc' + (i === 0 ? ' act' : '');
    b.textContent = c.i;
    b.addEventListener('click', e => {
      e.stopPropagation();
      cats.querySelectorAll('.epc').forEach(x => x.classList.remove('act'));
      b.classList.add('act');
      fillEP(c.e);
    });
    cats.appendChild(b);
  });
  fillEP(EPC[0].e);
}

function fillEP(arr) {
  const g = document.getElementById('ep-grid');
  g.innerHTML = '';
  g.scrollTop = 0;
  const frag = document.createDocumentFragment();
  arr.forEach(e => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'epb';
    b.title = e;
    b.textContent = e;
    b.addEventListener('click', ev => { ev.stopPropagation(); insertEmoji(e); });
    frag.appendChild(b);
  });
  g.appendChild(frag);
}
function toggleEP() {
  const dlg = document.getElementById('dialog');
  const show = !dlg.classList.contains('ep-open');
  dlg.classList.toggle('ep-open', show);
  document.getElementById('emoji-btn').classList.toggle('act', show);
}
function hideEP() {
  document.getElementById('dialog')?.classList.remove('ep-open');
  document.getElementById('emoji-btn')?.classList.remove('act');
}
function insertEmoji(e) {
  const mi = document.getElementById('msg-inp');
  const p = mi.selectionStart || mi.value.length;
  mi.value = mi.value.slice(0, p) + e + mi.value.slice(mi.selectionEnd || p);
  mi.setSelectionRange(p + e.length, p + e.length);
  mi.focus(); onType(); autoGrow(mi);
}

/* ═══ REPLY ═══ */
const REPLY_MEDIA = {
  photo: '🖼️ Фотография',
  video: '🎬 Видео',
  voice: '🎤 Голосовое сообщение',
  file: '📎 Файл',
  audio: '🎵 Аудио',
};
function replyMediaKind(m) {
  const t = m.text || '';
  const fn = (m.file_name || '').toLowerCase();
  const ext = fn.includes('.') ? fn.split('.').pop() : '';
  if (m.msg_type === 'voice') return 'voice';
  if (m.msg_type === 'image') return 'photo';
  if (/^(mp4|webm|mov|avi|mkv|m4v|3gp)$/i.test(ext)) return 'video';
  if (/^(mp3|ogg|wav|m4a|aac|flac)$/i.test(ext)) return 'audio';
  if (/^data:video/i.test(t) || /^video\//i.test(t.slice(5, 20))) return 'video';
  if (/^data:image/i.test(t)) return 'photo';
  if (/^data:audio/i.test(t)) return 'voice';
  if (t.startsWith('blob:') && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fn)) return 'photo';
  if (t.startsWith('blob:') && /\.(mp4|webm|mov)$/i.test(fn)) return 'video';
  if (m.msg_type === 'file' || /^data:/i.test(t)) return 'file';
  return null;
}
function replyImageSrc(m) {
  const kind = replyMediaKind(m);
  if (kind !== 'photo') return null;
  const t = m.text || '';
  if (t.startsWith('data:image') || t.startsWith('blob:')) return t;
  if (m.msg_type === 'image' && (t.startsWith('data:') || t.startsWith('blob:'))) return t;
  return null;
}
function replyPreviewText(m) {
  const kind = replyMediaKind(m);
  if (kind) return REPLY_MEDIA[kind];
  const t = (m.text || '').trim();
  if (/^data:|^blob:|;base64,/i.test(t) || /^[A-Za-z0-9+/=]{40,}$/.test(t)) return REPLY_MEDIA.file;
  return t.slice(0, 120);
}
function humanizeReplyPreview(pv) {
  if (!pv) return '';
  const p = pv.trim();
  if (p.startsWith('🖼️') || p.startsWith('🎤') || p.startsWith('📎') || p.startsWith('🎬') || p.startsWith('🎵')) return p;
  if (/data:video|video\//i.test(p)) return REPLY_MEDIA.video;
  if (/data:image|image\//i.test(p) || (p.startsWith('blob:') && /video/i.test(p))) {
    return /video/i.test(p) ? REPLY_MEDIA.video : REPLY_MEDIA.photo;
  }
  if (/data:audio|audio\//i.test(p)) return REPLY_MEDIA.voice;
  if (/^data:/i.test(p) || /^blob:/i.test(p) || /;base64,/i.test(p)) return REPLY_MEDIA.file;
  if (/^[A-Za-z0-9+/=]{30,}$/.test(p.replace(/\s/g, ''))) return REPLY_MEDIA.photo;
  return p.slice(0, 120);
}
function isFullImagePreview(pv) {
  return pv && (pv.startsWith('blob:') || (pv.startsWith('data:image') && pv.indexOf(',') > 0 && pv.length > pv.indexOf(',') + 32));
}
function setReplyBarThumb(m, src) {
  const el = document.getElementById('rb-thumb');
  if (!el) return;
  el.innerHTML = '';
  el.textContent = '';
  if (!m) { el.style.display = 'none'; return; }
  const kind = replyMediaKind(m);
  if (src && kind === 'photo') {
    el.style.display = 'block';
    el.style.background = '';
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    el.appendChild(img);
  } else if (kind === 'video') {
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.background = 'var(--bg3)';
    el.style.fontSize = '20px';
    el.textContent = '🎬';
  } else {
    el.style.display = 'none';
  }
}
function buildReplyQuote(replyToId, preview, authorName, authorId) {
  const rq = document.createElement('div');
  rq.className = 'rq';
  const bar = document.createElement('div');
  bar.className = 'rq-bar';
  const body = document.createElement('div');
  body.className = 'rq-body';
  const name = document.createElement('div');
  name.className = 'rq-name';
  name.textContent = authorName || 'Сообщение';
  const c = senderNameColor(authorId);
  name.style.color = c;
  bar.style.background = c;
  body.appendChild(name);
  const pv = preview || '';
  const label = humanizeReplyPreview(pv);
  if (isFullImagePreview(pv)) {
    const wrap = document.createElement('div');
    wrap.className = 'rq-media';
    const img = document.createElement('img');
    img.src = pv;
    img.alt = label;
    img.onerror = () => {
      wrap.remove();
      const tx = document.createElement('div');
      tx.className = 'rq-text';
      tx.textContent = REPLY_MEDIA.photo;
      body.appendChild(tx);
    };
    wrap.appendChild(img);
    body.appendChild(wrap);
  } else {
    const tx = document.createElement('div');
    tx.className = 'rq-text';
    tx.textContent = label;
    body.appendChild(tx);
  }
  rq.appendChild(bar);
  rq.appendChild(body);
  rq.onclick = e => { e.stopPropagation(); scrollToMsg(replyToId); };
  return rq;
}
function replyAuthorLabel(m) {
  if (m.sender_id === ME.id) return ME.display_name || ME.username || 'Вы';
  return senderDisplayName(m.sender_id);
}
function replyPayloadExtra() {
  if (!REPLY) return {};
  return {
    reply_to_id: REPLY.id,
    reply_preview: (REPLY.text || '').slice(0, 200),
    reply_from_name: REPLY.author,
    reply_from_id: REPLY.author_id,
  };
}
function replyAuthorName(m) {
  if (!ACTIVE) return 'Ответ';
  if (ACTIVE.type === 'group' && m.sender_id !== ME.id) {
    const mem = (ACTIVE.members || []).find(u => u.id === m.sender_id);
    return mem ? ('Ответ ' + mem.display_name) : 'Ответ';
  }
  if (m.sender_id === ME.id) return 'Ответ себе';
  return 'Ответ ' + (ACTIVE.name || '');
}
function setReply(m) {
  if (EDITING) cancelEdit();
  if (REPLY) cancelReply();
  const preview = replyPreviewText(m);
  const thumb = replyImageSrc(m);
  REPLY = { id: m.id, text: preview, author: replyAuthorLabel(m), author_id: m.sender_id };
  document.getElementById('rb-name').textContent = replyAuthorName(m);
  document.getElementById('rb-text').textContent = preview;
  setReplyBarThumb(m, thumb);
  document.getElementById('replybar').style.display = 'flex';
  document.getElementById('msg-inp').focus();
  onType();
}
function cancelReply() {
  REPLY = null;
  document.getElementById('replybar').style.display = 'none';
  setReplyBarThumb(null);
  onType();
}

/* ═══ CONTEXT MENU ═══ */
function showCtxItems(e, items) {
  const ctx = document.getElementById('ctx'); ctx.innerHTML = '';
  const ctxIcons = {
    'Реакция': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
    'Ответить': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>',
    'Переслать': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg>',
    'Выбрать': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    'Закрепить': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    'В Избранное': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
    'Редактировать': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    'Удалить': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
  };
  items.forEach(it => {
    const d = document.createElement('div'); d.className = 'ctx-i ' + (it.cls || '');
    const icon = Object.entries(ctxIcons).find(([k]) => it.label.includes(k));
    d.innerHTML = (icon ? icon[1] : '') + `<span>${it.label}</span>`;
    d.onclick = ev => { ev.stopPropagation(); hideCtx(); it.fn(); };
    ctx.appendChild(d);
  });
  const x = Math.min(e.clientX, window.innerWidth - 190);
  const y = Math.min(e.clientY, window.innerHeight - items.length * 42 - 16);
  ctx.style.left = x + 'px'; ctx.style.top = y + 'px'; ctx.style.display = 'block';
  e.stopPropagation();
}
function hideCtx() { document.getElementById('ctx').style.display = 'none'; }
function msgCtx(e, m, mine) {
  if (SELECT_MODE) { toggleSelect(m); return; }
  // Resolve the CURRENT message id from the DOM (an optimistic message gets its
  // real id assigned on WS-ack via data-id; the captured `m` may still hold the
  // temp id, which is why edit/delete used to fail until reload).
  const bubEl = e.currentTarget && e.currentTarget.classList?.contains('bub')
    ? e.currentTarget
    : (e.target.closest ? e.target.closest('.bub') : null);
  const liveId = bubEl?.dataset?.id;
  if (liveId && liveId !== 'tmp') m = { ...m, id: isNaN(+liveId) ? liveId : +liveId };
  // still pending server id → can't act on it yet
  if (m.id === 'tmp' || (typeof m.id === 'string' && m.id.startsWith('t'))) {
    return toast('Сообщение ещё отправляется…', 'i');
  }
  const items = [
    { label: 'Реакция', fn: () => showReactPop(e, m.id) },
    { label: 'Ответить', fn: () => setReply(m) },
    { label: 'Переслать', fn: () => openForward(m) },
    { label: 'Выбрать', fn: () => enterSelect(m) },
    { label: m.pinned ? 'Открепить' : 'Закрепить', fn: () => togglePinMsg(m.id) },
    { label: 'Скопировать', fn: () => copyMsg(m) },
    { label: 'В Избранное', fn: () => forwardToSaved(m) },
  ];
  if (m.msg_type === 'file' || m.msg_type === 'image') {
    const dlName = m.file_name || (m.msg_type === 'image' ? 'image.jpg' : 'file');
    items.splice(5, 0, { label: 'Скачать', fn: () => downloadFile(m.text, dlName) });
  }
  if (mine) {
    if (m.msg_type === 'text' && !m.deleted) items.push({ label: 'Редактировать', fn: () => editMsg(m) });
    items.push({ label: 'Удалить', cls: 'ctx-del', fn: () => delMsg(m, 'sender') });
  } else if (isGroupAdmin()) {
    items.push({ label: 'Удалить у всех', cls: 'ctx-del', fn: () => delMsg(m, 'admin') });
    items.push({ label: 'Удалить у себя', cls: 'ctx-del', fn: () => delMsg(m, false) });
  } else {
    items.push({ label: 'Удалить у себя', cls: 'ctx-del', fn: () => delMsg(m, false) });
  }
  showCtxItems(e, items);
}
function showReactPop(e, msgId) {
  hideCtx();
  hideRP();
  const rp = document.getElementById('react-pop');
  initReactPop();
  rp.dataset.msgId = String(msgId);
  rp.style.left = Math.min(e.clientX - 140, window.innerWidth - 310) + 'px';
  rp.style.top = Math.max(8, e.clientY - 58) + 'px';
  rp.style.display = 'flex';
  e.stopPropagation();
}
function hideRP() {
  const rp = document.getElementById('react-pop');
  if (rp) rp.style.display = 'none';
}
function initReactPop() {
  const rp = document.getElementById('react-pop');
  if (!rp || rp.dataset.ready) return;
  rp.innerHTML = '';
  RP_EMOJIS.forEach(em => {
    const b = document.createElement('div');
    b.className = 'rp-e';
    b.dataset.emoji = em;
    b.textContent = em;
    rp.appendChild(b);
  });
  rp.addEventListener('click', ev => {
    const btn = ev.target.closest('.rp-e');
    if (!btn) return;
    ev.stopPropagation();
    const id = rp.dataset.msgId;
    if (!id) return;
    hideRP();
    toggleReact(id, btn.dataset.emoji);
  });
  rp.dataset.ready = '1';
}
function cloneReactions(reactions) {
  const out = {};
  for (const [k, v] of Object.entries(reactions || {})) out[k] = [...v];
  return out;
}
function toggleReactionLocal(reactions, emoji, uid) {
  const r = cloneReactions(reactions);
  let lst = r[emoji] ? [...r[emoji]] : [];
  const i = lst.indexOf(uid);
  if (i >= 0) lst.splice(i, 1);
  else lst.push(uid);
  if (lst.length) r[emoji] = lst;
  else delete r[emoji];
  return r;
}
function buildReactEl(msgId, em, uids) {
  const el = document.createElement('div');
  el.className = 'react' + (uids.includes(ME.id) ? ' mine' : '');
  el.dataset.emoji = em;
  const emSpan = document.createElement('span');
  emSpan.className = 'react-e';
  emSpan.textContent = em;
  const nSpan = document.createElement('span');
  nSpan.className = 'react-n';
  nSpan.textContent = String(uids.length);
  el.appendChild(emSpan);
  el.appendChild(nSpan);
  el.onclick = e => { e.stopPropagation(); toggleReact(msgId, em); };
  return el;
}
function mountReactions(bub, msgId, reactions) {
  const entries = Object.entries(reactions || {});
  if (!entries.length) return;
  REACT_CACHE.set(String(msgId), cloneReactions(reactions));
  const rr = document.createElement('div');
  rr.className = 'reacts';
  for (const [em, uids] of entries) rr.appendChild(buildReactEl(msgId, em, uids));
  bub.appendChild(rr);
}
function applyReactionsDOM(msgId, reactions) {
  const bub = document.querySelector(`.bub[data-id="${msgId}"]`);
  if (!bub) return;
  const entries = Object.entries(reactions || {});
  let rr = bub.querySelector('.reacts');
  if (!entries.length) {
    rr?.remove();
    return;
  }
  if (!rr) {
    rr = document.createElement('div');
    rr.className = 'reacts';
    bub.appendChild(rr);
  }
  const existing = new Map([...rr.querySelectorAll('.react[data-emoji]')].map(el => [el.dataset.emoji, el]));
  const seen = new Set();
  for (const [em, uids] of entries) {
    seen.add(em);
    const mine = uids.includes(ME.id);
    const count = uids.length;
    let el = existing.get(em);
    if (!el) {
      rr.appendChild(buildReactEl(msgId, em, uids));
    } else {
      el.classList.toggle('mine', mine);
      const n = el.querySelector('.react-n');
      if (n && n.textContent !== String(count)) n.textContent = String(count);
    }
  }
  existing.forEach((el, em) => { if (!seen.has(em)) el.remove(); });
}
function reactionsEqual(a, b) {
  a = a || {}; b = b || {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const va = (a[k] || []).slice().sort((x, y) => x - y).join(',');
    const vb = (b[k] || []).slice().sort((x, y) => x - y).join(',');
    if (va !== vb) return false;
  }
  return true;
}
function applyReactions(msgId, reactions) {
  const r = reactions || {};
  const id = String(msgId);
  const prev = REACT_CACHE.get(id);
  if (prev && reactionsEqual(prev, r)) return;
  REACT_CACHE.set(id, cloneReactions(r));
  applyReactionsDOM(msgId, r);
}
function toggleReact(msgId, emoji) {
  hideRP();
  const id = String(msgId);
  const prev = cloneReactions(REACT_CACHE.get(id) || {});
  const next = toggleReactionLocal(prev, emoji, ME.id);
  applyReactions(msgId, next);
  try { navigator.vibrate?.(8); } catch {}
  req(`/messages/${msgId}/react`, 'POST', { emoji })
    .then(res => applyReactions(msgId, res.reactions || {}))
    .catch(err => {
      applyReactions(msgId, prev);
      toast(err.message || 'Ошибка', 'e');
    });
}
async function togglePinMsg(id) {
  try {
    const r = await req(`/messages/${id}/pin`, 'POST');
    const bub = document.querySelector(`.bub[data-id="${id}"]`);
    if (bub) bub.classList.toggle('pinned-mark', r.pinned);
    loadPinnedBar(); toast(r.pinned ? 'Закреплено' : 'Откреплено', 'ok');
  } catch (e) { toast(e.message, 'e'); }
}
async function loadPinnedBar() {
  if (!ACTIVE) return;
  const t = ACTIVE.type === 'group' ? 'g' : 'd';
  try {
    const pins = await req(`/pinned/${t}/${ACTIVE.id}`);
    const bar = document.getElementById('pinbar');
    if (pins.length) {
      const last = pins[pins.length - 1];
      bar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> <b>Закреплено:</b> ${esc((last.text || '').slice(0, 60))}`;
      bar.style.display = 'flex'; bar.onclick = () => scrollToMsg(last.id);
    } else bar.style.display = 'none';
  } catch {}
}
function showPinned() { loadPinnedBar(); }

/* ═══ SAVED MESSAGES (forward / copy) ═══ */
async function copyMsg(m) {
  // For media/files the "text" is a huge data: URL — never copy that.
  if (m.msg_type === 'image') {
    try {
      const blob = m.text && m.text.startsWith('data:') ? dataURLtoBlob(m.text) : null;
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        return toast('Изображение скопировано', 'ok');
      }
    } catch {}
    return toast('Изображение нельзя скопировать как текст', 'i');
  }
  if (m.msg_type === 'file') {
    try { await navigator.clipboard.writeText(m.file_name || 'файл'); toast('Имя файла скопировано', 'ok'); }
    catch { toast('Не удалось скопировать', 'e'); }
    return;
  }
  if (m.msg_type === 'voice') return toast('Голосовое нельзя скопировать', 'i');
  const t = m.text || '';
  if (!t) return toast('Нечего копировать', 'i');
  try { await navigator.clipboard.writeText(t); toast('Скопировано', 'ok'); }
  catch { toast('Не удалось скопировать', 'e'); }
}
async function forwardToSaved(m) {
  if (!ME) return toast('Нет соединения', 'e');
  const fwd = forwardPayloadFrom(m);
  const payload = {
    text: m.text, msg_type: m.msg_type || 'text', file_name: m.file_name || null,
    recipient_id: myUserId(), temp_id: 't' + Date.now(), ...fwd
  };
  if (m.caption) payload.caption = m.caption;
  if (ACTIVE && isActiveSaved()) {
    const fake = {
      id: 'tmp', temp_id: payload.temp_id, sender_id: myUserId(), text: m.text,
      msg_type: payload.msg_type, file_name: payload.file_name, timestamp: new Date().toISOString(),
      is_read: true, reactions: {}, ...fwd
    };
    if (m.caption) fake.caption = m.caption;
    appendBub(document.getElementById('msgs'), fake, true, null, true); scrollMsgs();
  }
  try {
    await dispatchMsg(payload);
  } catch (e) {
    toast(e.message || 'Не удалось переслать', 'e');
    return;
  }
  const saved = CHATS.find(c => c.is_saved);
  if (saved) { saved.last_text = (m.text || '📎 Вложение').slice(0,60); saved.last_ts = new Date().toISOString(); renderContacts(); }
  toast('Переслано в Избранное', 'ok');
}

/* ═══ SELECTION MODE (Telegram-style multi-select) ═══ */
let SELECT_MODE = false;
const SELECTED = new Map();   // id -> message object
function enterSelect(m) {
  SELECT_MODE = true;
  hideCtx(); hideEP(); hideRP(); hideFmtPop();
  document.getElementById('dialog').classList.add('select-mode');
  document.getElementById('select-bar').style.display = 'flex';
  SELECTED.clear();
  document.querySelectorAll('.mr.sel').forEach(r => r.classList.remove('sel'));
  if (m) toggleSelect(m, true);
  else updateSelectBar();
}
function exitSelect() {
  SELECT_MODE = false;
  document.getElementById('dialog').classList.remove('select-mode');
  document.getElementById('select-bar').style.display = 'none';
  document.querySelectorAll('.mr.sel').forEach(r => r.classList.remove('sel'));
  SELECTED.clear();
}
function toggleSelect(m, keepMode) {
  const id = m.id;
  const row = document.querySelector(`.mr[data-id="${id}"]`);
  if (SELECTED.has(id)) { SELECTED.delete(id); row?.classList.remove('sel'); }
  else { SELECTED.set(id, m); row?.classList.add('sel'); }
  if (!SELECTED.size && !keepMode) { exitSelect(); return; }
  updateSelectBar();
}
function updateSelectBar() {
  const n = SELECTED.size;
  document.getElementById('select-count').textContent =
    n + ' ' + plural(n, ['сообщение', 'сообщения', 'сообщений']);
  // delete-for-all if every selected message is mine, or admin in group
  const allMine = [...SELECTED.values()].every(m => m.sender_id === ME.id);
  const canDelAll = allMine || (ACTIVE?.type === 'group' && isGroupAdmin());
  document.getElementById('sel-del').dataset.allmine = canDelAll ? '1' : '0';
  document.getElementById('sel-del').dataset.onlymine = allMine ? '1' : '0';
}
function plural(n, forms) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return forms[0];
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return forms[1];
  return forms[2];
}
function selectForward() {
  if (!SELECTED.size) return;
  openForward([...SELECTED.values()]);
}
function selectDelete() {
  if (!SELECTED.size) return;
  const ids = [...SELECTED.keys()];
  const canDelAll = document.getElementById('sel-del').dataset.allmine === '1';
  const onlyMine = document.getElementById('sel-del').dataset.onlymine === '1';
  const n = ids.length;
  if (canDelAll) {
    const btns = [
      { label: 'Отмена', cls: 'btn-ghost', fn: () => cm('m-confirm') },
      { label: 'У всех', cls: 'btn-danger', fn: () => doBulkDel(ids, true) }
    ];
    if (onlyMine) btns.splice(1, 0, { label: 'У меня', cls: 'btn-ghost', fn: () => doBulkDel(ids, false) });
    showConfirm('Удалить сообщения?', `Удалить ${n} ${plural(n, ['сообщение','сообщения','сообщений'])}?`, btns);
  } else {
    showConfirm('Удалить?', `Удалить ${n} ${plural(n, ['сообщение','сообщения','сообщений'])} у себя?`, [
      { label: 'Отмена', cls: 'btn-ghost', fn: () => cm('m-confirm') },
      { label: 'Удалить', cls: 'btn-danger', fn: () => doBulkDel(ids, false) }
    ]);
  }
}
async function doBulkDel(ids, forAll) {
  cm('m-confirm');
  for (const id of ids) { try { await doDelSilent(id, forAll); } catch {} }
  exitSelect();
  toast('Удалено', 'ok');
}
function selectCopy() {
  if (!SELECTED.size) return;
  const txt = [...SELECTED.values()].map(m => m.text || '').filter(Boolean).join('\n');
  try { navigator.clipboard.writeText(txt); toast('Скопировано', 'ok'); } catch {}
  exitSelect();
}


let FWD_MSGS = [];          // messages queued for forwarding

function senderDisplayName(userId) {
  if (!userId) return 'Пользователь';
  if (ME && userId === ME.id) return ME.display_name || ME.username || 'Вы';
  const dm = findDmChat(userId);
  if (dm?.display_name) return dm.display_name;
  if (ACTIVE?.type === 'group' && ACTIVE.members) {
    const mem = ACTIVE.members.find(x => x.id === userId);
    if (mem?.display_name) return mem.display_name;
  }
  const c = CHATS.find(x => x.id === userId && !x.is_saved);
  if (c?.display_name) return c.display_name;
  return 'Пользователь';
}

function forwardPayloadFrom(m) {
  const id = m.forward_from_id || m.sender_id;
  const name = (m.forward_from_name || '').trim() || senderDisplayName(id);
  return { forward_from_id: id, forward_from_name: name.slice(0, 128) };
}

const SN_COLORS = ['#CC801F', '#3390EC', '#8471D5', '#4FAE4E', '#E17076', '#299AD6', '#57A3BC', '#C36479'];
function senderNameColor(userId) {
  if (!userId) return 'var(--acc)';
  return SN_COLORS[Math.abs(Number(userId)) % SN_COLORS.length];
}

function buildForwardFrom(name, authorId) {
  const el = document.createElement('div');
  el.className = 'fwd-from';
  const bar = document.createElement('div');
  bar.className = 'fwd-from-bar';
  const body = document.createElement('div');
  body.className = 'fwd-from-body';
  const label = document.createElement('div');
  label.className = 'fwd-from-label';
  label.textContent = 'Переслано от';
  const nm = document.createElement('div');
  nm.className = 'fwd-from-name';
  nm.textContent = name;
  const c = senderNameColor(authorId);
  label.style.color = c;
  nm.style.color = c;
  bar.style.background = c;
  body.appendChild(label);
  body.appendChild(nm);
  el.appendChild(bar);
  el.appendChild(body);
  return el;
}

function openForward(msgs) {
  FWD_MSGS = Array.isArray(msgs) ? msgs : [msgs];
  if (!FWD_MSGS.length) return;
  const modal = document.getElementById('fwd-modal');
  document.getElementById('fwd-count').textContent =
    FWD_MSGS.length === 1 ? 'Переслать сообщение' : `Переслать ${FWD_MSGS.length} сообщ.`;
  document.getElementById('fwd-search').value = '';
  renderFwdList('');
  modal.style.display = 'flex';
  setTimeout(() => document.getElementById('fwd-search').focus(), 20);
}
function closeForward() {
  document.getElementById('fwd-modal').style.display = 'none';
  FWD_MSGS = [];
}
function renderFwdList(q) {
  const box = document.getElementById('fwd-list'); box.innerHTML = '';
  q = (q || '').toLowerCase().trim();
  const targets = [];
  // saved messages first
  targets.push({ kind: 'saved', id: myUserId(), name: 'Избранное', emoji: '🔖', color: '#2AABEE' });
  CHATS.filter(c => !c.is_saved).forEach(c => targets.push({
    kind: 'dm', id: c.id, name: c.display_name, sub: '@' + (c.username || ''),
    b64: c.avatar_b64, emoji: c.avatar_emoji, color: c.avatar_color
  }));
  GROUPS.forEach(g => targets.push({
    kind: 'group', id: g.id, name: g.name, sub: 'группа',
    b64: g.avatar_b64, emoji: g.avatar_emoji || '👥', color: '#2AABEE'
  }));
  const filtered = targets.filter(t => !q || t.name.toLowerCase().includes(q) || (t.sub || '').toLowerCase().includes(q));
  if (!filtered.length) { box.innerHTML = `<div class="fwd-empty">Ничего не найдено</div>`; return; }
  filtered.forEach(t => {
    const row = document.createElement('div'); row.className = 'fwd-item';
    const av = t.kind === 'saved'
      ? `<div class="ci-av" style="width:42px;height:42px;min-width:42px;background:#2AABEE">🔖</div>`
      : avHtml(t.b64, t.emoji, t.color, 42);
    row.innerHTML = av + `<div class="fwd-meta"><div class="fwd-name">${esc(t.name)}</div>${t.sub ? `<div class="fwd-sub">${esc(t.sub)}</div>` : ''}</div>`;
    row.onclick = () => doForward(t);
    box.appendChild(row);
  });
}
async function doForward(target) {
  if (!ME) return toast('Нет соединения', 'e');
  const n = FWD_MSGS.length;
  for (const m of FWD_MSGS) {
    const fwd = forwardPayloadFrom(m);
    const payload = {
      text: m.text, msg_type: m.msg_type || 'text', file_name: m.file_name || null,
      temp_id: 't' + Date.now() + Math.random().toString(36).slice(2, 5), ...fwd
    };
    if (m.caption) payload.caption = m.caption;
    if (target.kind === 'group') payload.group_id = target.id;
    else payload.recipient_id = target.kind === 'saved' ? myUserId() : target.id;
    try { await dispatchMsg(payload); }
    catch (e) { toast(e.message || 'Не удалось переслать', 'e'); return; }
  }
  // optimistic sidebar bump
  const preview = (FWD_MSGS[0].text || '📎 Вложение').slice(0, 60);
  if (target.kind === 'group') {
    const g = GROUPS.find(x => x.id === target.id);
    if (g) { g.last_text = preview; g.last_ts = new Date().toISOString(); }
  } else {
    const c = target.kind === 'saved' ? findDmChat(myUserId()) : findDmChat(target.id);
    if (c) { c.last_text = preview; c.last_ts = new Date().toISOString(); }
  }
  renderContacts();
  closeForward();
  exitSelect();   // leave selection mode if active
  toast(n === 1 ? `Переслано → ${target.name}` : `${n} сообщ. → ${target.name}`, 'ok');
}

/* ═══ EDIT / DELETE ═══ */
function applyEdit(id, newText) {
  const bub = document.querySelector(`.bub[data-id="${id}"]`);
  if (!bub) return;
  const sp = bub.querySelector('span');
  if (sp) { if (hasMd(newText)) sp.innerHTML = renderMd(newText); else sp.textContent = newText; }
  const row = bub.closest('.mr');
  if (row) {
    const bm = row.querySelector('.bm');
    if (bm && !bm.querySelector('.edited-mark')) {
      const em = document.createElement('span'); em.className = 'edited-mark';
      em.style.cssText = 'font-style:italic;opacity:.7;margin-left:3px'; em.textContent = ' изменено';
      const ticks = bm.querySelector('.ticks');
      if (ticks) bm.insertBefore(em, ticks); else bm.appendChild(em);
    }
  }
}
function editMsg(m) {
  if (m.msg_type && m.msg_type !== 'text') return toast('Это сообщение нельзя редактировать', 'i');
  if (m.id === 'tmp') return toast('Сообщение ещё отправляется…', 'i');
  if (REPLY) cancelReply();
  EDITING = m;
  const eb = document.getElementById('editbar');
  document.getElementById('eb-text').textContent = (m.text || '').slice(0, 120);
  eb.style.display = 'flex';
  const mi = document.getElementById('msg-inp');
  mi.value = m.text || '';
  autoGrow(mi); onType(); mi.focus();
  // place caret at end
  mi.setSelectionRange(mi.value.length, mi.value.length);
}
function cancelEdit() {
  EDITING = null;
  document.getElementById('editbar').style.display = 'none';
  const mi = document.getElementById('msg-inp');
  mi.value = ''; autoGrow(mi); onType();
}
async function commitEdit() {
  const m = EDITING;
  const mi = document.getElementById('msg-inp');
  const nt = mi.value.trim();
  if (!m) return;
  if (nt === '' ) { return toast('Сообщение не может быть пустым', 'i'); }
  if (nt === m.text) { cancelEdit(); return; }
  // optimistic UI
  applyEdit(m.id, nt);
  const id = m.id;
  cancelEdit();
  try {
    await req(`/messages/${id}`, 'PATCH', { text: nt });
  } catch (e) { toast(e.message, 'e'); }
}
function delMsg(m, kind) {
  const isSender = m.sender_id === ME.id;
  if (isSender) {
    showConfirm('Удалить сообщение?', 'Удалить у всех или только у себя?', [
      { label: 'Отмена', cls: 'btn-ghost', fn: () => cm('m-confirm') },
      { label: 'У меня', cls: 'btn-ghost', fn: () => doDel(m.id, false) },
      { label: 'У всех', cls: 'btn-danger', fn: () => doDel(m.id, true) }
    ]);
  } else if (kind === 'admin') {
    showConfirm('Удалить сообщение?', 'Удалить у всех участников?', [
      { label: 'Отмена', cls: 'btn-ghost', fn: () => cm('m-confirm') },
      { label: 'У всех', cls: 'btn-danger', fn: () => doDel(m.id, true) }
    ]);
  } else {
    showConfirm('Удалить?', 'Удалить у себя?', [
      { label: 'Отмена', cls: 'btn-ghost', fn: () => cm('m-confirm') },
      { label: 'Удалить', cls: 'btn-danger', fn: () => doDel(m.id, false) }
    ]);
  }
}
function removeMsgRow(id) {
  REACT_CACHE.delete(String(id));
  const row = document.querySelector(`.mr[data-id="${id}"]`);
  if (!row) return;
  // collapse smoothly so neighbours don't "jump"
  const h = row.offsetHeight;
  row.style.cssText += `;height:${h}px;overflow:hidden;transition:height .1s ease,opacity .1s ease,margin .1s ease;`;
  // force reflow then collapse
  void row.offsetHeight;
  row.style.height = '0px'; row.style.opacity = '0'; row.style.marginBottom = '0px';
  setTimeout(() => row.remove(), 110);
}
async function doDel(id, forAll) {
  cm('m-confirm');
  try {
    await req(`/messages/${id}?for_all=${forAll}`, 'DELETE');
    removeMsgRow(id);
  } catch (e) { toast(e.message, 'e'); }
}
async function doDelSilent(id, forAll) {
  await req(`/messages/${id}?for_all=${forAll}`, 'DELETE');
  removeMsgRow(id);
}

/* ═══ AVATAR CROP ═══ */
const CROP_SZ = 240, CROP_OUT = 256;
let cropCanvas, cropCtx, cropImgObj, cropXpos = 0, cropYpos = 0, _cropScale = 1, cropBaseScale = 1, cropZoomMul = 1;
let cropDown = false, cropLastX = 0, cropLastY = 0;
function cropPointer(e) {
  const r = cropCanvas.getBoundingClientRect();
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (cx - r.left) * (cropCanvas.width / r.width),
    y: (cy - r.top) * (cropCanvas.height / r.height)
  };
}
function exportAvatarCrop() {
  const out = document.createElement('canvas');
  out.width = CROP_OUT; out.height = CROP_OUT;
  const ctx = out.getContext('2d');
  const ratio = CROP_OUT / CROP_SZ;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, CROP_OUT, CROP_OUT);
  ctx.save();
  ctx.beginPath();
  ctx.arc(CROP_OUT / 2, CROP_OUT / 2, CROP_OUT / 2, 0, Math.PI * 2);
  ctx.clip();
  const iw = cropImgObj.width * _cropScale * ratio;
  const ih = cropImgObj.height * _cropScale * ratio;
  ctx.drawImage(
    cropImgObj,
    (CROP_OUT - iw) / 2 + cropXpos * ratio,
    (CROP_OUT - ih) / 2 + cropYpos * ratio,
    iw, ih
  );
  ctx.restore();
  return out.toDataURL('image/jpeg', 0.85);
}
function handleAvatar(inp) {
  const f = inp.files[0]; if (!f) return;
  if (f.size > 5 * 1024 * 1024) return toast('До 5 МБ', 'e');
  const url = URL.createObjectURL(f);
  cropImgObj = new Image();
  cropImgObj.onload = () => {
    cropCanvas = document.getElementById('crop-preview');
    cropCanvas.width = CROP_SZ; cropCanvas.height = CROP_SZ;
    cropCtx = cropCanvas.getContext('2d');
    cropBaseScale = Math.max(CROP_SZ / cropImgObj.width, CROP_SZ / cropImgObj.height);
    cropZoomMul = 1;
    _cropScale = cropBaseScale;
    cropXpos = 0; cropYpos = 0;
    setupCropListeners();
    drawCrop();
    om('m-av-crop');
    inp.value = '';
    URL.revokeObjectURL(url);
  };
  cropImgObj.onerror = () => { inp.value = ''; toast('Не удалось загрузить изображение', 'e'); };
  cropImgObj.src = url;
}
function setupCropListeners() {
  cropCanvas.onmousedown = e => {
    e.preventDefault();
    cropDown = true;
    const p = cropPointer(e);
    cropLastX = p.x; cropLastY = p.y;
  };
  cropCanvas.onmousemove = e => {
    if (!cropDown) return;
    const p = cropPointer(e);
    cropXpos += p.x - cropLastX; cropYpos += p.y - cropLastY;
    cropLastX = p.x; cropLastY = p.y;
    clampCrop(); drawCrop();
  };
  cropCanvas.onmouseup = cropCanvas.onmouseleave = () => { cropDown = false; };
  cropCanvas.ontouchstart = e => {
    e.preventDefault();
    cropDown = true;
    const p = cropPointer(e);
    cropLastX = p.x; cropLastY = p.y;
  };
  cropCanvas.ontouchmove = e => {
    e.preventDefault();
    if (!cropDown) return;
    const p = cropPointer(e);
    cropXpos += p.x - cropLastX; cropYpos += p.y - cropLastY;
    cropLastX = p.x; cropLastY = p.y;
    clampCrop(); drawCrop();
  };
  cropCanvas.ontouchend = () => { cropDown = false; };
}
function clampCrop() {
  const iw = cropImgObj.width * _cropScale, ih = cropImgObj.height * _cropScale;
  const maxX = Math.max(0, (iw - CROP_SZ) / 2);
  const maxY = Math.max(0, (ih - CROP_SZ) / 2);
  cropXpos = Math.max(-maxX, Math.min(maxX, cropXpos));
  cropYpos = Math.max(-maxY, Math.min(maxY, cropYpos));
}
function drawCrop() {
  if (!cropCtx || !cropImgObj) return;
  const sz = CROP_SZ;
  cropCtx.clearRect(0, 0, sz, sz);
  cropCtx.save();
  cropCtx.beginPath(); cropCtx.arc(sz / 2, sz / 2, sz / 2, 0, Math.PI * 2); cropCtx.clip();
  const iw = cropImgObj.width * _cropScale, ih = cropImgObj.height * _cropScale;
  cropCtx.drawImage(cropImgObj, (sz - iw) / 2 + cropXpos, (sz - ih) / 2 + cropYpos, iw, ih);
  cropCtx.restore();
}
function cropZoom(delta) {
  cropZoomMul = Math.max(1, Math.min(4, cropZoomMul + delta));
  _cropScale = cropBaseScale * cropZoomMul;
  clampCrop(); drawCrop();
}
function cancelAvatarCrop() { cm('m-av-crop'); }
async function confirmAvatarCrop() {
  if (!cropImgObj) return;
  myAvB64Pending = exportAvatarCrop();
  const big = document.getElementById('pav-big');
  applyAvatarEl(big, myAvB64Pending);
  const delBtn = document.getElementById('av-del-btn');
  if (delBtn) delBtn.style.display = 'flex';
  cm('m-av-crop');
  try {
    await req('/me', 'PATCH', { avatar_b64: myAvB64Pending });
    ME.avatar_b64 = myAvB64Pending;
    myAvB64Pending = null;
    saveSession();
    renderSBUser();
    refreshAll();
    toast('Фото обновлено', 'ok');
  } catch (e) {
    toast(e.message || 'Не удалось сохранить фото', 'e');
  }
}
function clearAvatar() {
  myAvB64Pending = '';
  applyAvatarEl(document.getElementById('pav-big'), null, ME.avatar_emoji, ME.avatar_color);
  document.getElementById('av-del-btn').style.display = 'none';
}

/* ═══ PROFILE ═══ */
function openProfile() {
  myAvB64Pending = null;
  const big = document.getElementById('pav-big');
  applyAvatarEl(big, ME.avatar_b64, ME.avatar_emoji, ME.avatar_color);
  document.getElementById('av-del-btn').style.display = ME.avatar_b64 ? 'flex' : 'none';
  document.getElementById('p-dn').value = ME.display_name || '';
  document.getElementById('p-un').value = ME.username;
  document.getElementById('p-phone').value = ME.phone || '';
  const bd = ME.birth_date || '';
  let bdVal = bd;
  if (bd && bd.includes('.')) { const p = bd.split('.'); if (p.length === 3) bdVal = `${p[2]}-${p[1]}-${p[0]}`; }
  document.getElementById('p-bd').value = bdVal;
  const eg = document.getElementById('pav-emojis'); eg.innerHTML = '';
  AV_E.forEach(e => {
    const d = document.createElement('div'); d.className = 'pav-e' + (e === ME.avatar_emoji ? ' sel' : ''); d.textContent = e;
    d.onclick = () => {
      eg.querySelectorAll('.pav-e').forEach(x => x.classList.remove('sel')); d.classList.add('sel');
      myAvB64Pending = '';
      const selColor = document.querySelector('.pav-c.sel')?.style.backgroundColor || document.querySelector('.pav-c.sel')?.style.background || ME.avatar_color;
      applyAvatarEl(big, null, e, selColor);
      document.getElementById('av-del-btn').style.display = 'none';
    };
    eg.appendChild(d);
  });
  const cg = document.getElementById('pav-colors'); cg.innerHTML = '';
  AV_C.forEach(c => {
    const d = document.createElement('div'); d.className = 'pav-c' + (c === ME.avatar_color ? ' sel' : ''); d.style.background = c;
    d.onclick = () => { cg.querySelectorAll('.pav-c').forEach(x => x.classList.remove('sel')); d.classList.add('sel'); if (!big.style.backgroundImage) big.style.background = c; };
    cg.appendChild(d);
  });
  om('m-profile');
}
async function saveProfile() {
  const dn = document.getElementById('p-dn').value.trim();
  const bdRaw = document.getElementById('p-bd').value.trim();
  let bd = bdRaw;
  if (bdRaw && bdRaw.includes('-') && bdRaw.length === 10) { const p = bdRaw.split('-'); bd = `${p[2]}.${p[1]}.${p[0]}`; }
  const emoji = document.querySelector('.pav-e.sel')?.textContent || ME.avatar_emoji;
  const colorEl = document.querySelector('.pav-c.sel');
  const color = colorEl ? rgb2hex(colorEl.style.backgroundColor || colorEl.style.background) : ME.avatar_color;
  const body = { display_name: dn || ME.username, avatar_emoji: emoji, avatar_color: color, birth_date: bd || null };
  if (myAvB64Pending !== null) body.avatar_b64 = myAvB64Pending;
  try {
    await req('/me', 'PATCH', body);
    ME.display_name = body.display_name; ME.avatar_emoji = emoji; ME.avatar_color = color; ME.birth_date = bd;
    if (myAvB64Pending !== null) ME.avatar_b64 = myAvB64Pending || null;
    myAvB64Pending = null;
    saveSession(); renderSBUser(); renderContacts();
    // if my own saved-messages chat is open, repaint its header avatar too
    if (ACTIVE && ACTIVE.type === 'dm' && (ACTIVE.saved || ACTIVE.id === ME.id)) {
      setHead(null, '🔖', '#2AABEE', 'Избранное', 'Сохранённые сообщения');
    }
    // re-pull chats/groups so the partner side & member lists get my new avatar
    refreshAll();
    cm('m-profile'); toast('Сохранено', 'ok');
  } catch (e) { toast(e.message, 'e'); }
}
function rgb2hex(rgb) { const m = rgb.match(/\d+/g); if (!m) return rgb; return '#' + m.slice(0, 3).map(x => (+x).toString(16).padStart(2, '0')).join(''); }
function renderSBUser() {
  if (!ME) return;
  applyAvatarEl(document.getElementById('smenu-av'), ME.avatar_b64, ME.avatar_emoji, ME.avatar_color);
  const snm = document.getElementById('smenu-name'); if (snm) snm.textContent = ME.display_name || ME.username;
  const sun = document.getElementById('smenu-un'); if (sun) sun.textContent = '@' + ME.username;
}

/* ═══ SETTINGS ═══ */
function openSettings() {
  updFontUI(); buildThemePicker(); updateBgImageUI();
  document.getElementById('push-c').checked = ('Notification' in window) && Notification.permission === 'granted';
  document.getElementById('snd-c').checked = SOUND;
  document.getElementById('priv-online').checked = !!ME.hide_online;
  document.getElementById('priv-phone').checked = !!ME.hide_phone;
  om('m-settings');
}
function swtSp(btn) {
  document.querySelectorAll('.snav .si').forEach(b => b.classList.remove('active')); btn.classList.add('active');
  document.querySelectorAll('.sp').forEach(p => p.style.display = 'none');
  document.getElementById('sp-' + btn.dataset.p).style.display = 'block';
  if (btn.dataset.p === 'sessions') loadSessions();
}
function setTheme(t) {
  document.documentElement.dataset.theme = t; lsSet('theme', t);
  if (ME) { ME.theme = t; saveSession(); req('/me', 'PATCH', { theme: t }).catch(() => {}); }
  if (CHAT_THEME) setChatTheme(CHAT_THEME, false);
}
function loadTheme() { document.documentElement.dataset.theme = lsGet('theme') || 'dark'; }
function chFont(d) { setFont(Math.min(20, Math.max(11, FS + d))); }
function setFont(v) {
  FS = v;
  document.documentElement.style.setProperty('--fs', v + 'px');
  // also set on body for full inheritance
  document.body.style.fontSize = v + 'px';
  lsSet('fs', v); updFontUI();
  if (ME) { ME.ui_scale = String(v); saveSession(); req('/me','PATCH',{ui_scale:String(v)}).catch(()=>{}); }
}
function loadFont() {
  const v = parseInt(lsGet('fs') || '16');
  FS = v;
  document.documentElement.style.setProperty('--fs', v + 'px');
  document.body.style.fontSize = v + 'px';
  updFontUI();
}
function updFontUI() {
  const p = ((FS - 11) / 9) * 100;
  const f = document.getElementById('fs-f'); if (f) f.style.width = p + '%';
  const lbl = document.getElementById('fs-lbl'); if (lbl) lbl.textContent = FS + 'px';
}
async function savePrivacy() {
  const ho = document.getElementById('priv-online')?.checked || false;
  const hp = document.getElementById('priv-phone')?.checked || false;
  ME.hide_online = ho; ME.hide_phone = hp;
  try { await req('/me', 'PATCH', { hide_online: ho, hide_phone: hp }); } catch (e) { toast(e.message, 'e'); }
}
async function loadSessions() {
  const el = document.getElementById('sessions-list'); if (!el) return;
  el.innerHTML = '<div style="color:var(--t3);font-size:13px">Загрузка…</div>';
  try {
    const sessions = await req('/sessions');
    if (!sessions.length) { el.innerHTML = '<div style="color:var(--t3);font-size:13px">Нет данных</div>'; return; }
    el.innerHTML = '';
    sessions.slice().reverse().forEach((s, i) => {
      const d = document.createElement('div'); d.className = 'sess-item';
      const ua = s.ua || '';
      const isMob = /Mobile|Android|iPhone|iPad/.test(ua);
      const icon = isMob ? '📱' : '💻';
      const bname = ua.match(/(Chrome|Firefox|Safari|Edge|OPR)\/[\d.]+/)?.[0]?.split('/')[0] || 'Браузер';
      const ts = s.ts ? new Date(s.ts).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
      d.innerHTML = `<div class="sess-icon">${icon}</div><div><div class="sess-ua">${esc(bname)}${i === 0 ? ' <span style="color:#31D158;font-size:10px">(эта сессия)</span>' : ''}</div><div class="sess-ip">IP: ${esc(s.ip || '?')}</div><div class="sess-ts">${ts}</div></div>`;
      el.appendChild(d);
    });
  } catch (e) { el.innerHTML = `<div style="color:#FF453A;font-size:13px">${esc(e.message)}</div>`; }
}
async function clearSessions() {
  try { await req('/sessions/clear', 'POST'); toast('Другие сессии завершены', 'ok'); loadSessions(); }
  catch (e) { toast(e.message, 'e'); }
}
function reqPush() {}
function hdlPush(el) {
  if (!('Notification' in window)) { el.checked = false; return toast('Не поддерживается', 'e'); }
  if (el.checked) Notification.requestPermission().then(p => { if (p !== 'granted') { el.checked = false; toast('Отклонено', 'e'); } else toast('Push включены', 'ok'); });
}
function previewText(d) {
  if (!d) return '📩';
  if (d.caption) return d.caption.slice(0, 80);
  if (d.msg_type === 'voice') return '🎤 Голосовое сообщение';
  if (d.msg_type === 'image') return '🖼️ Изображение';
  if (d.msg_type === 'file') return '📎 ' + (d.file_name || 'Файл');
  return (d.text || '').slice(0, 80) || '📩';
}
function pushNotify(t, b) {
  // Telegram-web style: notify whenever the user isn't actively reading that chat,
  // not only when the tab is hidden.
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (!(document.getElementById('push-c')?.checked)) return;
  try {
    const n = new Notification(`Корпоративный чат · ${t}`, { body: b, tag: 'corp-chat-msg' });
    n.onclick = () => { try { window.focus(); } catch {} n.close(); };
  } catch {}
}
/* ═══ TITLE UNREAD BADGE ═══ */
function totalUnread() {
  let n = 0;
  CHATS.forEach(c => { n += chatUnreadCount(c.chat_key, c.unread); });
  GROUPS.forEach(g => { n += chatUnreadCount(`g_${g.id}`, g.unread); });
  return n;
}
function bumpTitleBadge() {
  const n = totalUnread();
  document.title = n > 0 ? `(${n > 99 ? '99+' : n}) ${_baseTitle}` : _baseTitle;
}
function clearTitleBadge() { document.title = _baseTitle; }
function loadSound() { SOUND = lsGet('snd') !== '0'; }

/* ═══ GROUPS ═══ */
async function openCreateGroup() {
  selGM = new Set(); selGE = '👥'; selGAvB64 = null;
  document.getElementById('g-name').value = '';
  document.getElementById('g-chips').innerHTML = '';
  document.getElementById('cg-av-emoji').textContent = '👥';
  document.getElementById('cg-av-emoji').style.display = '';
  document.getElementById('cg-av').style.backgroundImage = '';
  const er = document.getElementById('g-emoji-row'); er.innerHTML = '';
  GP_E.forEach(e => {
    const d = document.createElement('div'); d.className = 'em-opt' + (e === selGE ? ' sel' : ''); d.textContent = e;
    d.onclick = () => { er.querySelectorAll('.em-opt').forEach(x => x.classList.remove('sel')); d.classList.add('sel'); selGE = e; document.getElementById('cg-av-emoji').textContent = e; };
    er.appendChild(d);
  });
  const ml = document.getElementById('g-mlist'); ml.innerHTML = '';
  let candidates = CHATS;
  if (!candidates.length) { try { candidates = await req('/users'); } catch { candidates = []; } }
  candidates = candidates.filter(u => u.id !== ME.id);
  if (!candidates.length) ml.innerHTML = emptyHtml('Нет коллег');
  else candidates.forEach(u => {
    const d = document.createElement('label');
    d.className = 'mchk';
    const box = document.createElement('span');
    box.className = 'mchk-box';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = u.id;
    cb.checked = selGM.has(u.id);
    if (cb.checked) d.classList.add('sel');
    cb.onchange = () => {
      if (cb.checked) selGM.add(u.id);
      else selGM.delete(u.id);
      d.classList.toggle('sel', cb.checked);
      renderGMChips();
    };
    box.appendChild(cb);
    d.appendChild(box);
    const av = document.createElement('span');
    av.className = 'mchk-av';
    av.innerHTML = avHtml(u.avatar_b64, u.avatar_emoji, u.avatar_color, 40);
    d.appendChild(av);
    const info = document.createElement('span');
    info.className = 'mchk-info';
    info.innerHTML = `<span class="mchk-name">${esc(u.display_name || u.username)}</span><span class="mchk-sub">@${esc(u.username || '')}</span>`;
    d.appendChild(info);
    ml.appendChild(d);
  });
  renderGMChips();
  om('m-cgroup');
}
function renderGMChips() {
  const row = document.getElementById('g-chips');
  if (!row) return;
  row.innerHTML = '';
  [...CHATS, ...SEARCH_RES].filter(u => selGM.has(u.id)).forEach(u => {
    const c = document.createElement('div');
    c.className = 'chip';
    c.innerHTML = `${u.avatar_emoji || '😊'} ${esc(u.display_name)}`;
    const x = document.createElement('span');
    x.className = 'chip-x';
    x.textContent = '×';
    x.onclick = e => {
      e.stopPropagation();
      selGM.delete(u.id);
      const cb = document.querySelector(`#g-mlist input[value="${u.id}"]`);
      if (cb) {
        cb.checked = false;
        cb.closest('.mchk')?.classList.remove('sel');
      }
      renderGMChips();
    };
    c.appendChild(x);
    row.appendChild(c);
  });
}
function tglGM(id) {
  if (id === -1) { renderGMChips(); return; }
  if (selGM.has(id)) selGM.delete(id); else selGM.add(id);
  const cb = document.querySelector(`#g-mlist input[value="${id}"]`);
  if (cb) {
    cb.checked = selGM.has(id);
    cb.closest('.mchk')?.classList.toggle('sel', cb.checked);
  }
  renderGMChips();
}
function handleGroupAvatar(inp) {
  const f = inp.files[0]; if (!f) return;
  if (f.size > 2 * 1024 * 1024) return toast('До 2 МБ', 'e');
  const img = new Image(); img.onload = () => {
    const c = document.createElement('canvas'); const sz = Math.min(256, img.width, img.height); c.width = sz; c.height = sz;
    const ctx = c.getContext('2d'); const m = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, sz, sz);
    selGAvB64 = c.toDataURL('image/jpeg', .85);
    document.getElementById('cg-av').style.backgroundImage = `url('${selGAvB64}')`;
    document.getElementById('cg-av-emoji').style.display = 'none';
  }; img.src = URL.createObjectURL(f);
}
async function createGroup() {
  const name = document.getElementById('g-name').value.trim();
  if (!name) return toast('Введите название', 'e');
  try {
    const g = await req('/groups', 'POST', { name, avatar_emoji: selGE, avatar_b64: selGAvB64, member_ids: [...selGM] });
    toast('Группа создана!', 'ok'); cm('m-cgroup'); await refreshAll();
    openGroup(GROUPS.find(x => x.id === g.id) || g);
  } catch (e) { toast(e.message, 'e'); }
}

/* ═══ MODALS ═══ */
function om(id) { document.getElementById(id).style.display = 'flex'; }
function cm(id) { const e = document.getElementById(id); if (e) e.style.display = 'none'; }
function oc(e, id) { if (e.target.id === id) cm(id); }
function closeAllModals() { document.querySelectorAll('.overlay').forEach(o => o.style.display = 'none'); }
function showConfirm(t, b, btns) {
  document.getElementById('cfm-t').textContent = t;
  document.getElementById('cfm-b').innerHTML = b;
  const bc = document.getElementById('cfm-btns'); bc.innerHTML = '';
  btns.forEach(x => { const btn = document.createElement('button'); btn.className = x.cls; btn.textContent = x.label; btn.style.flex = '1'; btn.onclick = x.fn; bc.appendChild(btn); });
  om('m-confirm');
}

/* ═══ UTILS ═══ */
function playPing() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.frequency.value = 820; o.type = 'sine';
    g.gain.setValueAtTime(.07, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + .12);
    o.start(); o.stop(ac.currentTime + .12);
  } catch {}
}
function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function lsSet(k, v) { try { localStorage.setItem('ap_' + k, v); } catch {} }
function lsGet(k) { try { return localStorage.getItem('ap_' + k); } catch { return null; } }
function btnLoad(id, on) {
  const b = document.getElementById(id); if (!b) return;
  b.disabled = on;
  b.classList.toggle('is-loading', on);
  const sp = b.querySelector('.spin'), lb = b.querySelector('span');
  if (sp) sp.style.display = on ? 'block' : 'none';
  if (lb) lb.style.display = on ? 'none' : '';
}
function toast(m, t = 'i') {
  const map = { e: 'te', ok: 'tok', i: 'ti' };
  const c = document.getElementById('toasts');
  const x = document.createElement('div'); x.className = 'toast ' + (map[t] || 'ti'); x.textContent = m;
  c.appendChild(x);
  setTimeout(() => { x.style.animation = 'tOut .2s ease forwards'; setTimeout(() => x.remove(), 200); }, 2800);
}
async function req(path, method = 'GET', body = null, token = null) {
  const tok = token || ME?.token;
  const o = { method, headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) } };
  if (body) o.body = JSON.stringify(body);
  let r;
  try { r = await fetch(API + path, o); } catch { throw new Error('Нет соединения с сервером'); }
  if (!r.ok) {
    const e = await r.json().catch(() => ({ detail: 'Ошибка' }));
    let msg = e.detail;
    if (Array.isArray(msg)) msg = msg.map(x => x.msg || '').join('; ') || 'Некорректные данные';
    if (typeof msg !== 'string') msg = 'Ошибка ' + r.status;
    throw new Error(msg);
  }
  return r.json();
}
