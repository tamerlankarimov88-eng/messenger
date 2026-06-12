'use strict';
/* ═══════════════════════════════════════════════════════
   АЛАБУГА ПОЛИТЕХ — app.js v5.0
   Telegram-style, instant messaging, full sync
═══════════════════════════════════════════════════════ */
const API = location.origin + '/api';
let ME = null, NET = null, ACTIVE = null;
let CHATS = [], GROUPS = [], SEARCH_RES = [], UNREAD = {}, PINS = new Set(), FOLDERS = {}, CUR_FOLDER = 'Все';
let FS = 14, SOUND = true;
let AUTH_PHONE = '', PENDING = null;
let selGM = new Set(), selGE = '👥', selGAvB64 = null, myAvB64Pending = null;
let REPLY = null;
let vRec = null, vChunks = [], vTimer = null, vSec = 0, vAnim = null;
let SEARCH_Q = '';
let TYPING_TIMER = null, IS_TYPING = false;
let UNREAD_FILTER = false;
let FAVORITES = [];
let DRAFTS = {};
let CHAT_BG_COLOR = '';
// Avatar crop state
let cropImg = null, cropX = 0, cropY = 0, cropScale = 1, cropDragging = false, cropDX = 0, cropDY = 0;
// T9 / spellcheck context
let lastCtxTarget = null;
// Refresh interval id
let refreshIntervalId = null;

/* ═══ EMOJI DATA ═══ */
const EPC = [
  {i:'😀',e:['😀','😃','😄','😁','😆','😅','😂','🤣','🥲','☺️','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🫣','🤭','🫢','🤫','😶','😐','😑','😬','🙄','😯','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','💩','👻','💀','☠️','👽','👾','🤖']},
  {i:'👋',e:['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅','💪','🦾']},
  {i:'❤️',e:['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','💌','💤','💢','💣','💥','💦','💫','🌟','⭐','✨','⚡','🔥','💯']},
  {i:'🐶',e:['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🐺','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🐢','🐍','🦎','🐙','🦑','🦐','🦀','🐠','🐟','🐬','🐳','🦈']},
  {i:'🍏',e:['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🥑','🥦','🥬','🥒','🌶','🌽','🥕','🍞','🥐','🥖','🧀','🥚','🍳','🥞','🧇','🍗','🍖','🌭','🍔','🍟','🍕','🍣','🍱','🧁','🍰','🎂','🍭','🍬','🍫','🍿','☕','🍵','🧃','🥤','🧋','🍺','🍷','🥃']},
  {i:'⚽',e:['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🥊','🥋','🎽','🛹','🏆','🥇','🥈','🥉','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸','🎻','🎲','♟','🎯','🎳','🎮','🎰','🧩']},
  {i:'🚗',e:['🚗','🚕','🚙','🚌','🏎','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🛴','🚲','🛵','🏍','🚀','✈️','🛫','🛬','🛩','💺','🛸','🚁','⛵','🚤','🛥','🛳','🚢','⚓','🗺','🗽','🗼','🏰','🏯','🌋','⛰','🏔','🏕']},
  {i:'💡',e:['💡','🔦','📔','📕','📖','📗','📘','📙','📚','📓','📒','📄','📰','📑','🔖','💰','💵','💳','🧾','✉️','📧','📨','📩','📤','📥','📦','✏️','✒️','🖊','🖌','📝','💼','📁','📂','🗂','📅','📆','📇','📈','📉','📊','📋','📌','📍','📎','🖇','📏','📐','✂️','🔒','🔓','🔑','🔨','⛏','⚒','🛠','⚔️','💻','🖥','⌨️','🖱','💾','💿','📀','📱','📲','☎️','📞','📡','🔋','🔌']},
];
const RP_EMOJIS = ['👍','❤️','😂','🔥','😮','😢','🙏','👎'];
const AV_E = ['😀','😎','🧑‍💻','👨‍🔬','👩‍🏫','🤖','🦾','🚀','🔥','⚡','💡','🎯','🏆','💎','⚙️','🔧','📡','🏭','🎓','✨','🌟','💻','📱','🦊'];
const AV_C = ['#2AABEE','#1A5276','#117A65','#6C3483','#1E8449','#2E86C1','#B7950B','#C0392B','#D35400','#1ABC9C','#2980B9','#7D3C98'];
const GP_E = ['👥','🏭','💼','🔬','🎓','⚙️','📡','🚀','💡','🏆','🔐','📊'];
const BG_PRESETS = [
  {id:'none',color:'',label:'Авто (тема)'},
  {id:'tg',color:'#182533',label:'Telegram'},
  {id:'black',color:'#0A0A0A',label:'Чёрный'},
  {id:'blue',color:'#1A3A5C',label:'Синий'},
  {id:'green',color:'#1A2F1A',label:'Зелёный'},
  {id:'purple',color:'#1E1A2F',label:'Фиолет'},
  {id:'brown',color:'#2A1F1A',label:'Коричневый'},
];

/* ═══ INIT ═══ */
document.addEventListener('DOMContentLoaded', () => {
  loadTheme(); loadFont(); loadSound(); loadChatBg();
  const mi = document.getElementById('msg-inp');
  mi.addEventListener('keydown', onKey);
  mi.addEventListener('input', () => { onType(); autoGrow(mi); onTypingInput(); saveDraft(); });
  mi.addEventListener('contextmenu', onMsgInputCtx);
  document.getElementById('emoji-btn').addEventListener('click', e => { e.stopPropagation(); toggleEP(); });
  document.getElementById('ep').addEventListener('click', e => e.stopPropagation());
  document.getElementById('a-phone').addEventListener('keydown', e => { if (e.key === 'Enter') stepPhone(); });
  document.getElementById('a-pw-login').addEventListener('keydown', e => { if (e.key === 'Enter') stepLogin(); });
  document.getElementById('a-pw2').addEventListener('keydown', e => { if (e.key === 'Enter') stepRegister(); });
  document.addEventListener('click', () => { hideCtx(); hideEP(); hideRP(); closeSbMenu(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { hideCtx(); hideEP(); hideRP(); closeAllModals(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); wrapMd('**', '**'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); wrapMd('_', '_'); }
  });
  buildBgPicker();

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

/* ═══ BACKGROUND PICKER ═══ */
function buildBgPicker() {
  const c = document.getElementById('bg-presets'); if (!c) return;
  c.innerHTML = '';
  BG_PRESETS.forEach(p => {
    const d = document.createElement('div');
    d.className = 'bg-opt' + (CHAT_BG_COLOR === p.color ? ' sel' : '');
    d.title = p.label;
    d.dataset.color = p.color;
    d.style.background = p.color || 'var(--bg2)';
    if (!p.color) d.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t2)" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    d.onclick = e => { e.stopPropagation(); setChatBgColor(p.color); };
    c.appendChild(d);
  });
  // sync custom color input
  const cc = document.getElementById('bg-custom-color');
  if (cc && CHAT_BG_COLOR && !BG_PRESETS.find(p => p.color === CHAT_BG_COLOR)) cc.value = CHAT_BG_COLOR;
}
function setChatBgColor(color) {
  CHAT_BG_COLOR = color;
  lsSet('chatbg', color);
  const msgs = document.getElementById('msgs');
  if (msgs) msgs.style.background = color || '';
  // sync custom color input
  const cc = document.getElementById('bg-custom-color');
  if (cc && color) { try { cc.value = color; } catch {} }
  // update sel state on presets
  document.querySelectorAll('.bg-opt:not(.bg-opt-custom)').forEach(el => {
    el.classList.toggle('sel', el.dataset.color === color);
  });
  const customBtn = document.getElementById('bg-custom-btn');
  if (customBtn) {
    const isPreset = BG_PRESETS.some(p => p.color === color);
    customBtn.classList.toggle('sel', !!color && !isPreset);
  }
}
function loadChatBg() {
  CHAT_BG_COLOR = lsGet('chatbg') || '';
  const msgs = document.getElementById('msgs');
  if (msgs && CHAT_BG_COLOR) msgs.style.background = CHAT_BG_COLOR;
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
  const v = inp.value.trim(), h = document.getElementById('h-un');
  if (!v) { h.textContent = ''; h.className = 'hint'; return false; }
  if (v.length < 3) { h.textContent = 'Минимум 3 символа'; h.className = 'hint err'; return false; }
  if (!/^[A-Za-z0-9_]+$/.test(v)) { h.textContent = 'Латиница, цифры, _'; h.className = 'hint err'; return false; }
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
      setTimeout(() => document.getElementById('a-pw-login').focus(), 60);
    } else {
      showStep('as-reg');
      setTimeout(() => document.getElementById('a-dn').focus(), 60);
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
  const un = document.getElementById('a-un').value.trim();
  const p1 = document.getElementById('a-pw1').value;
  const p2 = document.getElementById('a-pw2').value;
  if (!dn) return toast('Введите имя', 'e');
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
    id: d.user_id || d.id, username: d.username, display_name: d.display_name,
    avatar_emoji: d.avatar_emoji || '😊', avatar_color: d.avatar_color || '#2AABEE',
    avatar_b64: d.avatar_b64, token: d.token, theme: d.theme || 'dark',
    phone: d.phone, birth_date: d.birth_date,
    hide_online: d.hide_online || false, hide_phone: d.hide_phone || false,
  };
  PINS = new Set((d.pinned_chats || '').split(',').filter(Boolean));
  try { FOLDERS = JSON.parse(d.folders || '{}'); } catch { FOLDERS = {}; }
  try { FAVORITES = JSON.parse(d.favorites || '[]'); } catch { FAVORITES = []; }
  saveSession();
  setTheme(ME.theme);
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'flex';
  document.getElementById('sidebar').classList.remove('off');
  renderSBUser(); buildEP(); renderFolderTabs();
  await refreshAll();
  startWS(); reqPush();
  checkBirthdays();
  if (refreshIntervalId) clearInterval(refreshIntervalId);
  refreshIntervalId = setInterval(refreshAll, 8000);
  setInterval(checkBirthdays, 3600000);
}
async function restoreSession(s) {
  try { const me = await req('/me', 'GET', null, s.token); ME = { ...s, ...me, token: s.token }; }
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
    refreshIntervalId = setInterval(refreshAll, 8000);
    refreshAll().catch(() => {});
    return;
  }
  PINS = new Set((ME.pinned_chats || '').split(',').filter(Boolean));
  try { FOLDERS = JSON.parse(ME.folders || '{}'); } catch { FOLDERS = {}; }
  try { FAVORITES = JSON.parse(ME.favorites || '[]'); } catch { FAVORITES = []; }
  saveSession();
  setTheme(ME.theme);
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'flex';
  document.getElementById('sidebar').classList.remove('off');
  renderSBUser(); buildEP(); renderFolderTabs();
  await refreshAll(); startWS(); reqPush();
  checkBirthdays();
  if (refreshIntervalId) clearInterval(refreshIntervalId);
  refreshIntervalId = setInterval(refreshAll, 8000);
  setInterval(checkBirthdays, 3600000);
}
function saveSession() {
  const s = JSON.stringify(ME);
  sessionStorage.setItem('ap_s', s);
  try { localStorage.setItem('ap_s_bk', s); } catch {}
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
  ME = null; ACTIVE = null; CHATS = []; GROUPS = []; UNREAD = {}; PINS = new Set(); FOLDERS = {}; FAVORITES = []; DRAFTS = {};
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
    renderContacts(); checkBirthdays();
    // update active chat header online status
    if (ACTIVE?.type === 'dm') {
      const partner = CHATS.find(c => c.id === ACTIVE.id);
      if (partner) {
        const sub = partner.hide_online ? '' : (onlineUsers.has(ACTIVE.id) ? 'онлайн' : '');
        if (sub) document.getElementById('ch-sub').textContent = sub;
      }
    }
  } catch {}
}
const onlineUsers = new Set();

/* ═══ WEBSOCKET ═══ */
function startWS() {
  if (NET) NET.close();
  NET = new NetworkManager(ME.token, onWS);
  NET.connect();
}
let _typingTimeouts = {};
async function onWS(d) {
  if (d.event === 'typing') {
    const isG = !!d.group_id;
    const relevant = (isG && ACTIVE?.type === 'group' && ACTIVE?.id === d.group_id) ||
      (!isG && ACTIVE?.type === 'dm' && ACTIVE?.id === d.sender_id);
    if (relevant) {
      const ind = document.getElementById('typing-ind');
      const nm = document.getElementById('typing-name');
      if (d.typing) {
        nm.textContent = d.display_name;
        ind.style.display = 'flex';
        clearTimeout(_typingTimeouts[d.sender_id]);
        _typingTimeouts[d.sender_id] = setTimeout(() => { ind.style.display = 'none'; }, 4500);
      } else { ind.style.display = 'none'; }
    }
    return;
  }
  if (d.event === 'read') {
    // mark the specific message
    document.querySelectorAll(`.ticks[data-id="${d.msg_id}"] .tick`).forEach(t => {
      t.className = 'tick read';
    });
    // also mark all older ticks as read
    document.querySelectorAll('.ticks .tick').forEach(t => {
      const id = parseInt(t.closest('.ticks')?.dataset.id || '0');
      if (id <= d.msg_id && t.classList.contains('delivered')) t.className = 'tick read';
    });
    return;
  }
  if (d.event === 'deleted') {
    // Telegram-style: fully remove the message row
    const row = document.querySelector(`.mr[data-id="${d.id}"]`);
    if (row) row.remove();
    return;
  }
  if (d.event !== 'message') return;

  const isG = !!d.group_id;
  const fromMe = d.sender_id === ME.id;
  const key = isG ? `g_${d.group_id}` : (fromMe ? `dm_${d.recipient_id}` : `dm_${d.sender_id}`);
  const inView = ACTIVE && (
    (isG && ACTIVE.type === 'group' && ACTIVE.id === d.group_id) ||
    (!isG && ACTIVE.type === 'dm' && (ACTIVE.id === d.sender_id || (fromMe && ACTIVE.id === d.recipient_id)))
  );

  if (inView) {
    if (fromMe && d.temp_id) {
      const tb = document.querySelector(`.bub[data-tmp="${d.temp_id}"]`);
      if (tb) {
        tb.dataset.id = d.id; tb.removeAttribute('data-tmp');
        const row = tb.closest('.mr'); if (row) row.dataset.id = d.id;
        const ticks = tb.closest('.bw')?.querySelector('.ticks');
        if (ticks) ticks.dataset.id = d.id;
        return;
      }
    }
    if (fromMe && !d.temp_id) return; // already shown via optimistic
    const sndr = isG ? (ACTIVE.members || []).find(m => m.id === d.sender_id) || null : null;
    appendBub(document.getElementById('msgs'), d, fromMe, sndr, true);
    scrollMsgs();
    if (!fromMe) req(`/messages/${d.id}/read`, 'POST').catch(() => {});
    if (document.getElementById('typing-ind').style.display !== 'none') {
      document.getElementById('typing-ind').style.display = 'none';
    }
  } else {
    if (!fromMe) {
      UNREAD[key] = (UNREAD[key] || 0) + 1;
      const sender = CHATS.find(c => c.id === d.sender_id);
      pushNotify(sender?.display_name || 'Сообщение', d.text?.slice(0, 60) || '📩');
      if (SOUND) playPing();
      refreshAll();
    }
  }
  // update sidebar last message immediately for everyone
  if (isG) {
    const group = GROUPS.find(g => g.id === d.group_id);
    if (group) { group.last_text = d.text?.slice(0, 60) || ''; group.last_ts = d.timestamp; if (!fromMe) group.unread = (group.unread || 0) + 1; }
  } else {
    const partnerId = fromMe ? d.recipient_id : d.sender_id;
    const chat = CHATS.find(c => c.id === partnerId);
    if (chat) { chat.last_text = d.text?.slice(0, 60) || ''; chat.last_ts = d.timestamp; }
  }
  renderContacts();
}

/* ═══ TYPING ═══ */
function onTypingInput() {
  if (!ACTIVE) return;
  if (!IS_TYPING) { IS_TYPING = true; sendTyping(true); }
  clearTimeout(TYPING_TIMER);
  TYPING_TIMER = setTimeout(() => { IS_TYPING = false; sendTyping(false); }, 3000);
}
function sendTyping(typing) {
  if (!ME || !ACTIVE) return;
  const body = { typing };
  if (ACTIVE.type === 'dm') body.recipient_id = ACTIVE.id;
  else body.group_id = ACTIVE.id;
  req('/typing', 'POST', body).catch(() => {});
}

/* ═══ DRAFTS ═══ */
function saveDraft() {
  if (!ACTIVE) return;
  const key = `${ACTIVE.type}_${ACTIVE.id}`;
  const val = document.getElementById('msg-inp').value;
  if (val.trim()) DRAFTS[key] = val;
  else delete DRAFTS[key];
}
function restoreDraft() {
  if (!ACTIVE) return;
  const key = `${ACTIVE.type}_${ACTIVE.id}`;
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
function toggleSbMenu() {
  const m = document.getElementById('sb-menu');
  const open = m.style.display === 'none' || !m.style.display;
  m.style.display = open ? 'block' : 'none';
  if (open) { setTimeout(() => document.addEventListener('click', closeSbMenu, { once: true }), 10); }
}
function closeSbMenu() {
  const m = document.getElementById('sb-menu'); if (m) m.style.display = 'none';
}

/* ═══ FOLDER ═══ */
function renderFolderTabs() {
  const ft = document.getElementById('folder-tabs');
  const names = ['Все', ...Object.keys(FOLDERS)];
  if (names.length === 1) { ft.innerHTML = ''; return; }
  ft.innerHTML = '';
  names.forEach(n => {
    const t = document.createElement('div');
    t.className = 'ftab' + (n === CUR_FOLDER ? ' act' : '');
    t.textContent = n;
    t.onclick = () => { CUR_FOLDER = n; renderFolderTabs(); renderContacts(); };
    if (n !== 'Все') t.oncontextmenu = e => {
      e.preventDefault();
      showCtxItems(e, [{ label: 'Удалить папку', cls: 'ctx-del', fn: () => { delete FOLDERS[n]; if (CUR_FOLDER === n) CUR_FOLDER = 'Все'; saveFolders(); renderFolderTabs(); renderContacts(); } }]);
    };
    ft.appendChild(t);
  });
}
function newFolder() {
  const name = prompt('Название папки:');
  if (!name?.trim()) return;
  if (FOLDERS[name.trim()]) return toast('Такая папка уже есть', 'e');
  FOLDERS[name.trim()] = []; saveFolders(); renderFolderTabs();
  toast(`Папка «${name.trim()}» создана`, 'ok');
}
function saveFolders() {
  if (!ME) return;
  ME.folders = JSON.stringify(FOLDERS); saveSession();
  req('/me', 'PATCH', { folders: ME.folders }).catch(() => {});
}

/* ═══ CONTACTS ═══ */
function renderContacts() {
  const list = document.getElementById('contacts'); list.innerHTML = '';
  if (SEARCH_Q) {
    if (!SEARCH_RES.length) { list.innerHTML = emptyHtml('Никого не найдено'); return; }
    SEARCH_RES.filter(u => u.id !== ME.id).forEach(u => list.appendChild(mkSearchCI(u)));
    return;
  }
  let chats = [...CHATS], groups = [...GROUPS];
  if (CUR_FOLDER !== 'Все') {
    const keys = new Set(FOLDERS[CUR_FOLDER] || []);
    chats = chats.filter(c => keys.has(c.chat_key));
    groups = groups.filter(g => keys.has(`g_${g.id}`));
  }
  if (UNREAD_FILTER) {
    chats = chats.filter(c => (UNREAD[c.chat_key] || 0) + (c.unread || 0) > 0);
    groups = groups.filter(g => (UNREAD[`g_${g.id}`] || 0) + (g.unread || 0) > 0);
  }
  const pinned = [
    ...groups.filter(g => PINS.has(`g_${g.id}`)),
    ...chats.filter(c => PINS.has(c.chat_key))
  ];
  const restG = groups.filter(g => !PINS.has(`g_${g.id}`));
  const restC = chats.filter(c => !PINS.has(c.chat_key));
  if (!pinned.length && !restG.length && !restC.length) {
    list.innerHTML = emptyHtml(UNREAD_FILTER ? 'Нет непрочитанных' : CUR_FOLDER !== 'Все' ? 'Папка пуста' : 'Нет чатов. Найдите коллегу через поиск');
    return;
  }
  const all = [...pinned, ...restG, ...restC];
  all.forEach(x => list.appendChild(x.member_count !== undefined ? mkGCI(x) : mkCCI(x)));
}
function emptyHtml(t) { return `<div style="padding:40px 20px;text-align:center;color:var(--t3);font-size:13.5px;line-height:1.6">${t}</div>`; }
function avHtml(b64, emoji, color, sz, online = false) {
  const onlineCls = online ? ' online' : '';
  if (b64) return `<div class="ci-av${onlineCls}" style="width:${sz}px;height:${sz}px;min-width:${sz}px;background-image:url('${b64}')"></div>`;
  return `<div class="ci-av${onlineCls}" style="width:${sz}px;height:${sz}px;min-width:${sz}px;background:${color};font-size:${Math.round(sz * .42)}px">${emoji}</div>`;
}
function mkCCI(c) {
  const key = c.chat_key;
  const d = document.createElement('div');
  d.className = 'ci' + (ACTIVE?.type === 'dm' && ACTIVE?.id === c.id ? ' act' : '') + (PINS.has(key) ? ' pinned' : '');
  const time = c.last_ts ? fmtTime(new Date(c.last_ts)) : '';
  const unread = (UNREAD[key] || 0) + (c.unread || 0);
  const draft = DRAFTS[`dm_${c.id}`];
  let subHtml = draft
    ? `<span class="ci-draft-mark">Черновик</span>`
    : esc(c.last_text || '@' + c.username);
  d.innerHTML = avHtml(c.avatar_b64, c.avatar_emoji, c.avatar_color, 50) +
    `<div class="ci-info">
      <div class="ci-top"><span class="ci-name">${esc(c.display_name)}</span><span class="ci-time">${time}</span></div>
      <div class="ci-bot"><span class="ci-sub">${subHtml}</span>${unread ? `<div class="ub">${unread > 99 ? '99+' : unread}</div>` : ''}</div>
    </div>`;
  d.addEventListener('click', () => openDM(c));
  d.addEventListener('contextmenu', e => { e.preventDefault(); chatCtx(e, key, c); });
  return d;
}
function mkGCI(g) {
  const key = `g_${g.id}`;
  const d = document.createElement('div');
  d.className = 'ci' + (ACTIVE?.type === 'group' && ACTIVE?.id === g.id ? ' act' : '') + (PINS.has(key) ? ' pinned' : '');
  const unread = (UNREAD[key] || 0) + (g.unread || 0);
  const time = g.last_ts ? fmtTime(new Date(g.last_ts)) : '';
  const draft = DRAFTS[`group_${g.id}`];
  let subHtml = draft ? `<span class="ci-draft-mark">Черновик</span>` : esc(g.last_text || `${g.member_count} участников`);
  d.innerHTML = avHtml(g.avatar_b64, g.avatar_emoji || '👥', '#2AABEE', 50) +
    `<div class="ci-info">
      <div class="ci-top"><span class="ci-name">${esc(g.name)}</span><span class="ci-time">${time}</span></div>
      <div class="ci-bot"><span class="ci-sub">${subHtml}</span>${unread ? `<div class="ub">${unread > 99 ? '99+' : unread}</div>` : ''}</div>
    </div>`;
  d.addEventListener('click', () => openGroup(g));
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
  const items = [{ label: PINS.has(key) ? 'Открепить' : 'Закрепить', fn: () => pinChat(key) }];
  Object.keys(FOLDERS).forEach(f => {
    const inF = (FOLDERS[f] || []).includes(key);
    items.push({
      label: inF ? `Убрать из «${f}»` : `В папку «${f}»`,
      fn: () => { if (inF) FOLDERS[f] = FOLDERS[f].filter(k => k !== key); else FOLDERS[f] = [...(FOLDERS[f] || []), key]; saveFolders(); renderContacts(); }
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
async function onSearch(q) {
  SEARCH_Q = q.trim();
  const clr = document.getElementById('srch-clear');
  if (clr) clr.style.display = SEARCH_Q ? 'flex' : 'none';
  if (!SEARCH_Q) { SEARCH_RES = []; renderContacts(); return; }
  try { SEARCH_RES = await req('/users?q=' + encodeURIComponent(SEARCH_Q)); renderContacts(); } catch {}
}
function clearSearch() {
  document.getElementById('srch').value = '';
  const clr = document.getElementById('srch-clear'); if (clr) clr.style.display = 'none';
  SEARCH_Q = ''; SEARCH_RES = []; renderContacts();
}

/* ═══ DIALOG ═══ */
async function openDM(c) {
  saveDraft();
  if (ACTIVE?.type === 'dm' && ACTIVE.id === c.id) return; // already open
  ACTIVE = { type: 'dm', id: c.id, name: c.display_name, user: c };
  UNREAD[`dm_${c.id}`] = 0;
  renderContacts();
  setHead(c.avatar_b64, c.avatar_emoji, c.avatar_color, c.display_name, '@' + c.username);
  showDialog();
  restoreDraft();
  document.getElementById('typing-ind').style.display = 'none';
  try { const msgs = await req(`/messages/${c.id}`); renderMsgs(msgs, 'dm'); loadPinnedBar(); checkBirthdays(); }
  catch { toast('Ошибка загрузки', 'e'); }
}
async function openGroup(g) {
  saveDraft();
  const members = await req(`/groups/${g.id}/members`).catch(() => []);
  ACTIVE = { type: 'group', id: g.id, name: g.name, members, group: g };
  UNREAD[`g_${g.id}`] = 0; renderContacts();
  setHead(g.avatar_b64, g.avatar_emoji || '👥', '#2AABEE', g.name, `${members.length} участников`, true);
  showDialog();
  restoreDraft();
  document.getElementById('typing-ind').style.display = 'none';
  try { const msgs = await req(`/groups/${g.id}/messages`); renderMsgs(msgs, 'group', members); loadPinnedBar(); }
  catch { toast('Ошибка загрузки', 'e'); }
}
function setHead(b64, emoji, color, name, sub) {
  const av = document.getElementById('ch-av');
  if (b64) { av.style.backgroundImage = `url('${b64}')`; av.textContent = ''; av.style.background = ''; }
  else { av.style.backgroundImage = ''; av.textContent = emoji; av.style.background = color; }
  document.getElementById('ch-name').textContent = name;
  document.getElementById('ch-sub').textContent = sub;
}
function showDialog() {
  document.getElementById('welcome').style.display = 'none';
  document.getElementById('dialog').style.display = 'flex';
  const mi = document.getElementById('msg-inp'); mi.disabled = false;
  hideEP(); cancelReply();
  if (window.innerWidth <= 680) document.getElementById('sidebar').classList.add('off');
  // Apply chat bg
  const msgs = document.getElementById('msgs');
  msgs.style.background = CHAT_BG_COLOR || '';
  // init send/voice visibility
  const sb = document.getElementById('send-btn');
  const vb = document.getElementById('voice-btn');
  if (sb) sb.style.display = 'none';
  if (vb) vb.style.display = 'flex';
  mi.focus();
}
function closeDialog() {
  saveDraft(); ACTIVE = null; REPLY = null; IS_TYPING = false;
  document.getElementById('dialog').style.display = 'none';
  document.getElementById('welcome').style.display = 'flex';
  document.getElementById('sidebar').classList.remove('off');
  renderContacts();
}
function viewActiveProfile() {
  if (!ACTIVE) return;
  if (ACTIVE.type === 'dm') showUserProfile(ACTIVE.id);
}
function openChatSearch() { toast('Поиск в чате (скоро)', 'i'); }
async function showUserProfile(uid) {
  try {
    const u = await req(`/users/${uid}`);
    const av = document.getElementById('up-av');
    if (u.avatar_b64) { av.style.backgroundImage = `url('${u.avatar_b64}')`; av.textContent = ''; }
    else { av.style.backgroundImage = ''; av.textContent = u.avatar_emoji; av.style.background = u.avatar_color; }
    document.getElementById('up-name').textContent = u.display_name;
    document.getElementById('up-un').textContent = '@' + u.username;
    const rows = document.getElementById('up-rows'); rows.innerHTML = '';
    if (u.phone) rows.innerHTML += `<div class="up-row"><span class="up-k">Телефон</span><span>${esc(u.phone)}</span></div>`;
    if (u.birth_date) rows.innerHTML += `<div class="up-row"><span class="up-k">День рождения</span><span>${esc(u.birth_date)}</span></div>`;
    document.getElementById('up-write').onclick = () => { cm('m-uprofile'); openDM({ ...u, chat_key: `dm_${u.id}` }); };
    om('m-uprofile');
  } catch (e) { toast(e.message, 'e'); }
}

/* ═══ MARKDOWN ═══ */
function renderMd(text) {
  let s = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  s = s.replace(/```([\s\S]*?)```/g, (_, c) => `<code class="md-pre">${c}</code>`);
  s = s.replace(/`([^`\n]+)`/g, (_, c) => `<code class="md-code">${c}</code>`);
  s = s.replace(/\*\*(.+?)\*\*/g, '<b class="md-b">$1</b>');
  s = s.replace(/\*(?!\*)(.+?)(?<!\*)\*/g, '<i class="md-i">$1</i>');
  s = s.replace(/_([^_\n]+)_/g, '<i class="md-i">$1</i>');
  s = s.replace(/~~(.+?)~~/g, '<s class="md-s">$1</s>');
  return s;
}
function hasMd(text) { return /\*\*|__|~~|`/.test(text); }
function wrapMd(before, after) {
  const mi = document.getElementById('msg-inp');
  const sel = mi.value.substring(mi.selectionStart, mi.selectionEnd);
  const start = mi.selectionStart;
  mi.value = mi.value.slice(0, start) + before + (sel || '') + after + mi.value.slice(mi.selectionEnd);
  mi.selectionStart = mi.selectionEnd = start + before.length + (sel || '').length;
  mi.focus(); onType(); autoGrow(mi);
}

/* ═══ T9 CONTEXT MENU (spellcheck suggestions) ═══ */
function onMsgInputCtx(e) {
  const word = getWordAt(e.target, e.target.selectionStart);
  if (!word) return; // use browser default
  const suggestions = getSpellSuggestions(word);
  if (!suggestions.length) return;
  e.preventDefault();
  const items = suggestions.slice(0, 5).map(s => ({
    label: s,
    fn: () => replaceWordAt(e.target, word, s)
  }));
  showCtxItems(e, items);
}
function getWordAt(el, pos) {
  const text = el.value;
  let start = pos, end = pos;
  while (start > 0 && /\S/.test(text[start - 1])) start--;
  while (end < text.length && /\S/.test(text[end])) end++;
  return { word: text.slice(start, end), start, end };
}
function replaceWordAt(el, wordObj, replacement) {
  el.value = el.value.slice(0, wordObj.start) + replacement + el.value.slice(wordObj.end);
  el.selectionStart = el.selectionEnd = wordObj.start + replacement.length;
  el.focus(); onType(); autoGrow(el);
}
// Simple Russian typo corrections dictionary
const SPELL_DICT = {
  // Common typos
  'прив':'привет','прибет':'привет','приевт':'привет',
  'спасиб':'спасибо','спс':'спасибо','спасибки':'спасибо','спосибо':'спасибо',
  'пожалста':'пожалуйста','пожлста':'пожалуйста','пжл':'пожалуйста','пжлст':'пожалуйста',
  'хорошо':'хорошо','харашо':'хорошо','хорошо':'хорошо',
  'канечно':'конечно','конешно':'конечно','кончено':'конечно',
  'сообзение':'сообщение','собщение':'сообщение','сообщение':'сообщение',
  'ситуация':'ситуация','ситуацыя':'ситуация',
  'вобщем':'в общем','вообщем':'в общем',
  'тожо':'тоже','тоже':'тоже',
  'нечего':'нечего','ничево':'ничего','ничео':'ничего',
  'дейтвительно':'действительно','действительно':'действительно',
  'расмотреть':'рассмотреть','расмотрим':'рассмотрим',
  'росмотрим':'рассмотрим',
  'учитаывать':'учитывать','учытывать':'учитывать',
  'разабраться':'разобраться','разобратся':'разобраться',
  'встретится':'встретиться','встретися':'встретиться',
  'находится':'находиться','находися':'находиться',
  'занятся':'заняться','заниматся':'заниматься',
  'поговорим':'поговорим','поговорем':'поговорим',
  'расскажу':'расскажу','росскажу':'расскажу',
  'извените':'извините','извентие':'извините',
  'обязательно':'обязательно','обязателно':'обязательно',
  'возможно':'возможно','возможна':'возможно',
  'например':'например','напремер':'например',
  'почему':'почему','поэтому':'поэтому','патаму':'потому',
  'здравствуй':'здравствуй','здраствуй':'здравствуй','здрасти':'здравствуй',
  'пожалуйства':'пожалуйста',
};
function getSpellSuggestions(wordObj) {
  const w = wordObj.word.toLowerCase();
  const fix = SPELL_DICT[w];
  if (fix && fix !== w) return [fix, fix[0].toUpperCase() + fix.slice(1)];
  // basic: find close matches
  return Object.entries(SPELL_DICT)
    .filter(([k]) => k !== w && levenshtein(w, k) <= 2)
    .slice(0, 3).map(([, v]) => v);
}
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

/* ═══ RENDER MESSAGES ═══ */
function renderMsgs(msgs, type, members = []) {
  const area = document.getElementById('msgs'); area.innerHTML = '';
  area.style.background = CHAT_BG_COLOR || '';
  if (!msgs.length) { area.innerHTML = `<div style="text-align:center;color:var(--t3);font-size:13px;margin-top:40px">Начните переписку 👋</div>`; return; }
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
function mkDsep(l) { const d = document.createElement('div'); d.className = 'dsep'; d.innerHTML = `<span>${l}</span>`; return d; }

function appendBub(area, m, mine, sender = null, animate = true) {
  if (m.deleted) return; // Telegram-style: don't show deleted
  const text = m.text || '';
  const isE = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\s){1,3}$/u.test(text.trim()) && text.trim().length > 0;
  const row = document.createElement('div');
  row.className = 'mr ' + (mine ? 'out' : 'in');
  row.dataset.id = m.id;
  if (m.temp_id) row.dataset.tmp = m.temp_id;

  if (!mine && sender) {
    const av = document.createElement('div'); av.className = 'mr-av';
    if (sender.avatar_b64) av.style.backgroundImage = `url('${sender.avatar_b64}')`;
    else { av.style.background = sender.avatar_color || '#2AABEE'; av.textContent = sender.avatar_emoji || '😊'; }
    row.appendChild(av);
  }
  const bw = document.createElement('div'); bw.className = 'bw';
  if (!mine && sender) { const sn = document.createElement('div'); sn.className = 'bw-sn'; sn.textContent = sender.display_name; bw.appendChild(sn); }

  const bub = document.createElement('div');
  bub.dataset.id = m.id;
  if (m.temp_id) bub.dataset.tmp = m.temp_id;
  bub.classList.add('bub', mine ? 'out' : 'in');
  if (isE && m.msg_type === 'text') bub.classList.add('big-e');
  if (m.pinned) bub.classList.add('pinned-mark');
  if (!animate) bub.style.animation = 'none';

  // reply
  if (m.reply_to_id && m.reply_preview) {
    const rq = document.createElement('div'); rq.className = 'rq';
    rq.innerHTML = `<div class="rq-name">↩ Ответ</div><div class="rq-text">${esc(m.reply_preview)}</div>`;
    rq.onclick = e => { e.stopPropagation(); scrollToMsg(m.reply_to_id); };
    bub.appendChild(rq);
  }

  if (m.msg_type === 'voice') {
    bub.appendChild(buildVoicePlayer(text));
  } else if (m.msg_type === 'image' && text.startsWith('data:')) {
    const img = document.createElement('img');
    img.src = text; img.className = 'img-bub';
    img.onclick = e => { e.stopPropagation(); openLightbox(text); };
    img.onerror = () => { img.replaceWith(document.createTextNode('🖼️ Изображение')); };
    bub.appendChild(img);
  } else if (m.msg_type === 'file' && m.file_name) {
    const ext = (m.file_name.split('.').pop() || '').toLowerCase();
    const ico = { pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', mp4: '🎬', mp3: '🎵', zip: '🗜️', rar: '🗜️' }[ext] || '📎';
    const f = document.createElement('div'); f.className = 'fb';
    f.innerHTML = `<span class="fi">${ico}</span><div><div class="fn">${esc(m.file_name)}</div><div style="font-size:11px;opacity:.6;margin-top:2px">Файл</div></div>`;
    if (text.startsWith('data:')) { f.style.cursor = 'pointer'; f.onclick = e => { e.stopPropagation(); downloadData(text, m.file_name); }; }
    bub.appendChild(f);
  } else {
    const span = document.createElement('span');
    if (!isE && hasMd(text)) span.innerHTML = renderMd(text);
    else span.textContent = text;
    bub.appendChild(span);
  }

  // reactions
  const reacts = m.reactions || {};
  if (Object.keys(reacts).length) {
    const rr = document.createElement('div'); rr.className = 'reacts';
    for (const [em, uids] of Object.entries(reacts)) {
      const r = document.createElement('div');
      r.className = 'react' + (uids.includes(ME.id) ? ' mine' : '');
      r.innerHTML = `${em} <span class="react-n">${uids.length}</span>`;
      r.onclick = e => { e.stopPropagation(); toggleReact(m.id, em); };
      rr.appendChild(r);
    }
    bub.appendChild(rr);
  }

  bub.addEventListener('contextmenu', e => { e.preventDefault(); msgCtx(e, m, mine); });
  bub.addEventListener('dblclick', e => { e.preventDefault(); showReactPop(e, m.id); });
  bw.appendChild(bub);

  // meta
  const bm = document.createElement('div');
  bm.className = 'bm' + (mine ? ' out' : '');
  const t = new Date(m.timestamp);
  let meta = `<span>${fmtTime(t)}</span>`;
  if (m.edited) meta += `<span style="font-style:italic;opacity:.7"> ред.</span>`;
  if (mine) {
    let cls = 'tick';
    if (m.is_read) cls = 'tick read';
    else if (m.is_delivered) cls = 'tick delivered';
    meta += `<span class="ticks" data-id="${m.id}"><span class="${cls}">✓</span><span class="${cls}">✓</span></span>`;
  }
  bm.innerHTML = meta;
  bw.appendChild(bm); row.appendChild(bw); area.appendChild(row);
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
function downloadData(dataUrl, fname) { const a = document.createElement('a'); a.href = dataUrl; a.download = fname || 'file'; a.click(); }
function openLightbox(src) { document.getElementById('lb-img').src = src; document.getElementById('lightbox').style.display = 'flex'; }
function closeLightbox() { document.getElementById('lightbox').style.display = 'none'; }
function scrollToMsg(id) {
  const r = document.querySelector(`.mr[data-id="${id}"]`);
  if (r) { r.scrollIntoView({ behavior: 'smooth', block: 'center' }); r.style.outline = '2px solid var(--acc)'; setTimeout(() => r.style.outline = '', 900); }
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
  const v = document.getElementById('msg-inp').value.trim();
  const sb = document.getElementById('send-btn');
  const vb = document.getElementById('voice-btn');
  sb.disabled = !v || !ACTIVE;
  if (vb) vb.style.display = (v || !ACTIVE) ? 'none' : 'flex';
  if (sb) sb.style.display = v && ACTIVE ? 'flex' : 'none';
}
function onKey(e) {
  if (e.key === 'Enter' && !e.shiftKey && !e.altKey) { e.preventDefault(); sendMsg(); }
}
async function sendMsg() {
  const mi = document.getElementById('msg-inp');
  const text = mi.value.trim();
  if (!text || !ACTIVE) return;
  mi.value = ''; autoGrow(mi); onType(); hideEP();
  // clear draft
  delete DRAFTS[`${ACTIVE.type}_${ACTIVE.id}`];
  // stop typing immediately
  IS_TYPING = false; clearTimeout(TYPING_TIMER); sendTyping(false);
  // update sidebar immediately
  const now = new Date().toISOString();
  if (ACTIVE.type === 'dm') {
    let chat = CHATS.find(c => c.id === ACTIVE.id);
    if (chat) { chat.last_text = text.slice(0, 60); chat.last_ts = now; }
  } else {
    let group = GROUPS.find(g => g.id === ACTIVE.id);
    if (group) { group.last_text = text.slice(0, 60); group.last_ts = now; }
  }
  renderContacts();
  send(text, 'text', null);
}
function send(text, type, fname) {
  if (!ACTIVE || !NET) return;
  const tmp = 't' + Date.now() + Math.random().toString(36).slice(2, 6);
  const fake = {
    id: 'tmp', temp_id: tmp, sender_id: ME.id, text, msg_type: type, file_name: fname,
    timestamp: new Date().toISOString(), is_read: false, is_delivered: false,
    edited: false, reactions: {}, reply_to_id: REPLY?.id, reply_preview: REPLY?.text?.slice(0, 60)
  };
  appendBub(document.getElementById('msgs'), fake, true, null, true);
  scrollMsgs();
  const payload = { text, msg_type: type, file_name: fname, temp_id: tmp };
  if (REPLY) { payload.reply_to_id = REPLY.id; payload.reply_preview = REPLY.text?.slice(0, 60); }
  if (ACTIVE.type === 'dm') payload.recipient_id = ACTIVE.id;
  else payload.group_id = ACTIVE.id;
  NET.send(payload);
  cancelReply();
}

/* Files */
function triggerFile() { document.getElementById('file-inp').click(); }
async function handleFile(inp) {
  const f = inp.files[0]; if (!f) return;
  if (f.size > 20 * 1024 * 1024) return toast('Максимум 20 МБ', 'e');
  inp.value = ''; toast('Отправка…', 'i');
  try {
    const fd = new FormData(); fd.append('file', f);
    const r = await fetch(`${API}/upload`, { method: 'POST', headers: { Authorization: `Bearer ${ME.token}` }, body: fd });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || 'Ошибка');
    const d = await r.json();
    send(d.data_b64, d.msg_type, d.file_name);
  } catch (e) { toast(e.message, 'e'); }
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
}

/* ═══ EMOJI PICKER ═══ */
function buildEP() {
  const cats = document.getElementById('ep-cats'), grid = document.getElementById('ep-grid');
  cats.innerHTML = '';
  EPC.forEach((c, i) => {
    const b = document.createElement('div'); b.className = 'epc' + (i === 0 ? ' act' : ''); b.textContent = c.i;
    b.addEventListener('click', e => { e.stopPropagation(); cats.querySelectorAll('.epc').forEach(x => x.classList.remove('act')); b.classList.add('act'); fillEP(c.e); });
    cats.appendChild(b);
  });
  fillEP(EPC[0].e);
}
function fillEP(arr) {
  const g = document.getElementById('ep-grid'); g.innerHTML = '';
  arr.forEach(e => { const b = document.createElement('div'); b.className = 'epb'; b.textContent = e; b.addEventListener('click', ev => { ev.stopPropagation(); insertEmoji(e); }); g.appendChild(b); });
}
function toggleEP() {
  const ep = document.getElementById('ep');
  const show = ep.style.display === 'none' || !ep.style.display;
  ep.style.display = show ? 'flex' : 'none';
  document.getElementById('emoji-btn').classList.toggle('act', show);
}
function hideEP() { document.getElementById('ep').style.display = 'none'; document.getElementById('emoji-btn')?.classList.remove('act'); }
function insertEmoji(e) {
  const mi = document.getElementById('msg-inp');
  const p = mi.selectionStart || mi.value.length;
  mi.value = mi.value.slice(0, p) + e + mi.value.slice(mi.selectionEnd || p);
  mi.setSelectionRange(p + e.length, p + e.length);
  mi.focus(); onType(); autoGrow(mi);
}

/* ═══ REPLY ═══ */
function setReply(m) {
  REPLY = { id: m.id, text: m.text || '' };
  document.getElementById('rb-name').textContent = 'Ответ';
  document.getElementById('rb-text').textContent = (m.text || '').slice(0, 80);
  document.getElementById('replybar').style.display = 'flex';
  document.getElementById('msg-inp').focus();
}
function cancelReply() { REPLY = null; document.getElementById('replybar').style.display = 'none'; }

/* ═══ CONTEXT MENU ═══ */
function showCtxItems(e, items) {
  const ctx = document.getElementById('ctx'); ctx.innerHTML = '';
  const ctxIcons = {
    'Реакция': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
    'Ответить': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>',
    'Закрепить': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    'В избранное': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
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
  if (m.id === 'tmp') return;
  const isFav = FAVORITES.includes(m.id);
  const items = [
    { label: 'Реакция', fn: () => showReactPop(e, m.id) },
    { label: 'Ответить', fn: () => setReply(m) },
    { label: m.pinned ? 'Открепить' : 'Закрепить', fn: () => togglePinMsg(m.id) },
    { label: isFav ? 'Убрать из избранного' : 'В избранное', fn: () => toggleFav(m) },
  ];
  if (mine) {
    items.push({ label: 'Редактировать', fn: () => editMsg(m) });
    items.push({ label: 'Удалить', cls: 'ctx-del', fn: () => delMsg(m, true) });
  } else {
    items.push({ label: 'Удалить у себя', cls: 'ctx-del', fn: () => delMsg(m, false) });
  }
  showCtxItems(e, items);
}
function showReactPop(e, msgId) {
  hideCtx();
  const rp = document.getElementById('react-pop'); rp.innerHTML = '';
  RP_EMOJIS.forEach(em => {
    const b = document.createElement('div'); b.className = 'rp-e'; b.textContent = em;
    b.onclick = ev => { ev.stopPropagation(); hideRP(); toggleReact(msgId, em); };
    rp.appendChild(b);
  });
  rp.style.left = Math.min(e.clientX - 140, window.innerWidth - 310) + 'px';
  rp.style.top = Math.max(8, e.clientY - 58) + 'px';
  rp.style.display = 'flex'; e.stopPropagation();
}
function hideRP() { document.getElementById('react-pop').style.display = 'none'; }
async function toggleReact(msgId, emoji) {
  try {
    const r = await req(`/messages/${msgId}/react`, 'POST', { emoji });
    const bub = document.querySelector(`.bub[data-id="${msgId}"]`); if (!bub) return;
    let rr = bub.querySelector('.reacts'); if (rr) rr.remove();
    if (Object.keys(r.reactions).length) {
      rr = document.createElement('div'); rr.className = 'reacts';
      for (const [em, uids] of Object.entries(r.reactions)) {
        const x = document.createElement('div');
        x.className = 'react' + (uids.includes(ME.id) ? ' mine' : '');
        x.innerHTML = `${em} <span class="react-n">${uids.length}</span>`;
        x.onclick = e => { e.stopPropagation(); toggleReact(msgId, em); };
        rr.appendChild(x);
      }
      bub.appendChild(rr);
    }
  } catch (e) { toast(e.message, 'e'); }
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
    const bar = document.getElementById('pinbar'), btn = document.getElementById('pinned-btn');
    if (pins.length) {
      const last = pins[pins.length - 1];
      bar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> <b>Закреплено:</b> ${esc((last.text || '').slice(0, 60))}`;
      bar.style.display = 'flex'; bar.onclick = () => scrollToMsg(last.id); btn.style.display = 'flex';
    } else { bar.style.display = 'none'; btn.style.display = 'none'; }
  } catch {}
}
function showPinned() { loadPinnedBar(); }

/* ═══ FAVORITES (as saved chat) ═══ */
async function toggleFav(m) {
  const add = !FAVORITES.includes(m.id);
  try {
    const r = await req('/favorites', 'POST', { msg_id: m.id, add });
    FAVORITES = r.favorites;
    toast(add ? 'Сохранено в избранном' : 'Убрано из избранного', 'ok');
  } catch (e) { toast(e.message, 'e'); }
}
async function openFavorites() {
  om('m-favorites');
  const list = document.getElementById('fav-list');
  list.innerHTML = '<div style="color:var(--t3);font-size:13px;text-align:center;padding:24px">Загрузка…</div>';
  try {
    const msgs = await req('/favorites');
    if (!msgs.length) {
      list.innerHTML = '<div style="color:var(--t3);font-size:13.5px;text-align:center;padding:24px">Нет сохранённых сообщений.<br><span style="font-size:12px">Нажмите ПКМ на сообщении → «В избранное»</span></div>';
      return;
    }
    list.innerHTML = '';
    msgs.forEach(m => {
      const d = document.createElement('div'); d.className = 'fav-item';
      let textPreview;
      if (m.msg_type === 'voice') textPreview = '🎤 Голосовое сообщение';
      else if (m.msg_type === 'image') textPreview = '🖼️ Изображение';
      else if (m.msg_type === 'file') textPreview = '📎 ' + (m.file_name || 'Файл');
      else textPreview = (m.text || '(пусто)').slice(0, 200);
      const ts = m.timestamp ? new Date(m.timestamp).toLocaleString('ru-RU', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '';
      d.innerHTML = `<div class="fav-body"><div class="fav-from">${ts}</div><div class="fav-text">${esc(textPreview)}</div></div><span class="fav-del" title="Убрать из избранного">✕</span>`;
      d.querySelector('.fav-del').onclick = ev => { ev.stopPropagation(); toggleFav(m).then(() => openFavorites()); };
      list.appendChild(d);
    });
  } catch (e) { list.innerHTML = `<div style="color:#FF453A;font-size:13px;text-align:center;padding:24px">${esc(e.message)}</div>`; }
}

/* ═══ EDIT / DELETE ═══ */
async function editMsg(m) {
  const nt = prompt('Редактировать:', m.text);
  if (nt === null || nt === m.text) return;
  try {
    await req(`/messages/${m.id}`, 'PATCH', { text: nt });
    const bub = document.querySelector(`.bub[data-id="${m.id}"]`);
    if (bub) { const sp = bub.querySelector('span'); if (sp) { if (hasMd(nt)) sp.innerHTML = renderMd(nt); else sp.textContent = nt; } }
    toast('Изменено', 'ok');
  } catch (e) { toast(e.message, 'e'); }
}
function delMsg(m, mine) {
  if (mine) {
    showConfirm('Удалить сообщение?', 'Удалить у всех или только у себя?', [
      { label: 'Отмена', cls: 'btn-ghost', fn: () => cm('m-confirm') },
      { label: 'У меня', cls: 'btn-ghost', fn: () => doDel(m.id, false) },
      { label: 'У всех', cls: 'btn-danger', fn: () => doDel(m.id, true) }
    ]);
  } else {
    showConfirm('Удалить?', 'Удалить у себя?', [
      { label: 'Отмена', cls: 'btn-ghost', fn: () => cm('m-confirm') },
      { label: 'Удалить', cls: 'btn-danger', fn: () => doDel(m.id, false) }
    ]);
  }
}
async function doDel(id, forAll) {
  cm('m-confirm');
  try {
    await req(`/messages/${id}?for_all=${forAll}`, 'DELETE');
    // Remove row immediately (Telegram-style, no "deleted" text)
    const row = document.querySelector(`.mr[data-id="${id}"]`); if (row) row.remove();
  } catch (e) { toast(e.message, 'e'); }
}

/* ═══ AVATAR CROP ═══ */
let cropCanvas, cropCtx, cropImgObj, cropXpos = 0, cropYpos = 0, _cropScale = 1;
let cropDown = false, cropLastX = 0, cropLastY = 0;
function handleAvatar(inp) {
  const f = inp.files[0]; if (!f) return;
  if (f.size > 5 * 1024 * 1024) return toast('До 5 МБ', 'e');
  const url = URL.createObjectURL(f);
  cropImgObj = new Image();
  cropImgObj.onload = () => {
    cropXpos = 0; cropYpos = 0; _cropScale = 1;
    cropCanvas = document.getElementById('crop-preview');
    cropCtx = cropCanvas.getContext('2d');
    setupCropListeners();
    drawCrop();
    om('m-av-crop');
  };
  cropImgObj.src = url;
}
function setupCropListeners() {
  cropCanvas.onmousedown = e => { cropDown = true; cropLastX = e.offsetX; cropLastY = e.offsetY; };
  cropCanvas.onmousemove = e => {
    if (!cropDown) return;
    cropXpos += e.offsetX - cropLastX; cropYpos += e.offsetY - cropLastY;
    cropLastX = e.offsetX; cropLastY = e.offsetY; drawCrop();
  };
  cropCanvas.onmouseup = cropCanvas.onmouseleave = () => { cropDown = false; };
  // touch support
  cropCanvas.ontouchstart = e => { e.preventDefault(); cropDown = true; cropLastX = e.touches[0].clientX; cropLastY = e.touches[0].clientY; };
  cropCanvas.ontouchmove = e => { e.preventDefault(); if (!cropDown) return; cropXpos += e.touches[0].clientX - cropLastX; cropYpos += e.touches[0].clientY - cropLastY; cropLastX = e.touches[0].clientX; cropLastY = e.touches[0].clientY; drawCrop(); };
  cropCanvas.ontouchend = () => { cropDown = false; };
}
function drawCrop() {
  if (!cropCtx || !cropImgObj) return;
  const sz = 240;
  cropCtx.clearRect(0, 0, sz, sz);
  cropCtx.save();
  cropCtx.beginPath(); cropCtx.arc(sz / 2, sz / 2, sz / 2, 0, Math.PI * 2); cropCtx.clip();
  const iw = cropImgObj.width * _cropScale, ih = cropImgObj.height * _cropScale;
  cropCtx.drawImage(cropImgObj, (sz - iw) / 2 + cropXpos, (sz - ih) / 2 + cropYpos, iw, ih);
  cropCtx.restore();
}
function cropZoom(delta) {
  _cropScale = Math.max(0.1, Math.min(5, _cropScale + delta));
  drawCrop();
}
function cancelAvatarCrop() { cm('m-av-crop'); }
function confirmAvatarCrop() {
  if (!cropCanvas) return;
  const out = document.createElement('canvas'); out.width = 256; out.height = 256;
  const ctx = out.getContext('2d');
  ctx.drawImage(cropCanvas, 0, 0, 256, 256);
  myAvB64Pending = out.toDataURL('image/jpeg', 0.88);
  const big = document.getElementById('pav-big');
  big.style.backgroundImage = `url('${myAvB64Pending}')`;
  big.textContent = ''; big.style.background = '';
  const delBtn = document.getElementById('av-del-btn');
  if (delBtn) delBtn.style.display = 'flex';
  cm('m-av-crop');
}
function clearAvatar() {
  myAvB64Pending = '';
  const big = document.getElementById('pav-big');
  big.style.backgroundImage = '';
  big.textContent = ME.avatar_emoji || '😊';
  big.style.background = ME.avatar_color || '#2AABEE';
  document.getElementById('av-del-btn').style.display = 'none';
}

/* ═══ PROFILE ═══ */
function openProfile() {
  myAvB64Pending = null;
  const big = document.getElementById('pav-big');
  if (ME.avatar_b64) { big.style.backgroundImage = `url('${ME.avatar_b64}')`; big.textContent = ''; big.style.background = ''; }
  else { big.style.backgroundImage = ''; big.textContent = ME.avatar_emoji || '😊'; big.style.background = ME.avatar_color || '#2AABEE'; }
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
    d.onclick = () => { eg.querySelectorAll('.pav-e').forEach(x => x.classList.remove('sel')); d.classList.add('sel'); myAvB64Pending = ''; big.style.backgroundImage = ''; big.textContent = e; big.style.background = document.querySelector('.pav-c.sel')?.style.background || ME.avatar_color; };
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
  const color = colorEl ? rgb2hex(colorEl.style.background) : ME.avatar_color;
  const body = { display_name: dn || ME.username, avatar_emoji: emoji, avatar_color: color, birth_date: bd };
  if (myAvB64Pending !== null) body.avatar_b64 = myAvB64Pending;
  try {
    await req('/me', 'PATCH', body);
    ME.display_name = body.display_name; ME.avatar_emoji = emoji; ME.avatar_color = color; ME.birth_date = bd;
    if (myAvB64Pending !== null) ME.avatar_b64 = myAvB64Pending || null;
    saveSession(); renderSBUser(); renderContacts();
    cm('m-profile'); toast('Сохранено', 'ok');
  } catch (e) { toast(e.message, 'e'); }
}
function rgb2hex(rgb) { const m = rgb.match(/\d+/g); if (!m) return rgb; return '#' + m.slice(0, 3).map(x => (+x).toString(16).padStart(2, '0')).join(''); }
function renderSBUser() {
  if (!ME) return;
  const av = document.getElementById('sb-av');
  const smav = document.getElementById('smenu-av');
  if (ME.avatar_b64) {
    [av, smav].forEach(el => { if (el) { el.style.backgroundImage = `url('${ME.avatar_b64}')`; el.textContent = ''; } });
  } else {
    [av, smav].forEach(el => { if (el) { el.style.backgroundImage = ''; el.textContent = ME.avatar_emoji || '😊'; el.style.background = ME.avatar_color || '#2AABEE'; } });
  }
  const snm = document.getElementById('smenu-name'); if (snm) snm.textContent = ME.display_name || ME.username;
  const sun = document.getElementById('smenu-un'); if (sun) sun.textContent = '@' + ME.username;
}

/* ═══ SETTINGS ═══ */
function openSettings() {
  updFontUI(); buildBgPicker();
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
  const v = parseInt(lsGet('fs') || '14');
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
function pushNotify(t, b) {
  if (document.getElementById('push-c')?.checked && Notification.permission === 'granted' && document.hidden)
    new Notification(`Политех · ${t}`, { body: b });
}
function loadSound() { SOUND = lsGet('snd') !== '0'; }

/* ═══ GROUPS ═══ */
async function openCreateGroup() {
  selGM = new Set(); selGE = '👥'; selGAvB64 = null;
  document.getElementById('g-name').value = '';
  document.getElementById('g-chips').innerHTML = '';
  document.getElementById('cg-av-emoji').textContent = '👥';
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
    const d = document.createElement('label'); d.className = 'mchk';
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = u.id; cb.onchange = () => tglGM(u.id);
    d.appendChild(cb);
    d.insertAdjacentHTML('beforeend', avHtml(u.avatar_b64, u.avatar_emoji, u.avatar_color, 36) + `<span style="font-size:13.5px">${esc(u.display_name)}</span>`);
    ml.appendChild(d);
  });
  om('m-cgroup');
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
function tglGM(id) {
  if (selGM.has(id)) selGM.delete(id); else selGM.add(id);
  const row = document.getElementById('g-chips'); row.innerHTML = '';
  [...CHATS, ...SEARCH_RES].filter(u => selGM.has(u.id)).forEach(u => {
    const c = document.createElement('div'); c.className = 'chip';
    c.innerHTML = `${u.avatar_emoji || '😊'} ${esc(u.display_name)}`;
    const x = document.createElement('span'); x.className = 'chip-x'; x.textContent = '×';
    x.onclick = () => { selGM.delete(u.id); const cb = document.querySelector(`#g-mlist input[value="${u.id}"]`); if (cb) cb.checked = false; tglGM(-1); };
    c.appendChild(x); row.appendChild(c);
  });
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
  const b = document.getElementById(id); if (!b) return; b.disabled = on;
  const sp = b.querySelector('.spin'), lb = b.querySelector('span');
  if (sp) sp.style.display = on ? 'block' : 'none';
  if (lb) lb.style.opacity = on ? 0 : 1;
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
