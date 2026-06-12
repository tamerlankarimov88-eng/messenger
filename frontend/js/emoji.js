'use strict';

const APPLE_EMOJI_CDNS = [
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple',
  'https://unpkg.com/emoji-datasource-apple@15.1.2/img/apple',
];

function toUnified(str) {
  const parts = [];
  for (let i = 0; i < str.length; i++) {
    const cp = str.codePointAt(i);
    parts.push(cp.toString(16));
    if (cp > 0xffff) i++;
  }
  return parts.join('-');
}

function appleEmojiUrl(emoji, size = 64, cdnIdx = 0) {
  const base = APPLE_EMOJI_CDNS[cdnIdx] || APPLE_EMOJI_CDNS[0];
  return `${base}/${size}/${toUnified(emoji)}.png`;
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function appleEmojiImg(emoji, size = 20, className = 'e-img') {
  const unicode = escHtml(emoji);
  const unified = escHtml(toUnified(emoji));
  const url = appleEmojiUrl(emoji);
  return `<span class="e-wrap" style="display:inline-block;position:relative;width:${size}px;height:${size}px;line-height:${size}px;font-size:${size}px;text-align:center;vertical-align:-0.15em;font-family:'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif">${unicode}<img class="${className}" src="${url}" alt="" draggable="false" width="${size}" height="${size}" data-u="${unified}" style="position:absolute;left:0;top:0" onerror="window.__emojiImgErr&&window.__emojiImgErr(this)"></span>`;
}

window.__emojiImgErr = function (img) {
  const n = parseInt(img.dataset.f || '0', 10);
  const u = img.dataset.u;
  if (n < APPLE_EMOJI_CDNS.length - 1) {
    img.dataset.f = String(n + 1);
    img.src = `${APPLE_EMOJI_CDNS[n + 1]}/64/${u}.png`;
    return;
  }
  img.remove();
};

function setEmojiEl(el, emoji, size) {
  el.innerHTML = '';
  el.classList.add('emoji-font');
  el.style.position = 'relative';
  if (size) el.style.fontSize = `${size}px`;
  const wrap = document.createElement('span');
  wrap.className = 'e-wrap';
  wrap.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%';
  wrap.textContent = emoji;
  const img = document.createElement('img');
  img.className = 'e-img e-av';
  img.src = appleEmojiUrl(emoji);
  img.alt = '';
  img.draggable = false;
  img.dataset.u = toUnified(emoji);
  img.style.cssText = 'position:absolute;inset:0;margin:auto;max-width:85%;max-height:85%;object-fit:contain';
  img.onerror = function () { window.__emojiImgErr(this); };
  el.appendChild(wrap);
  el.appendChild(img);
}

const EMOJI_RE = /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu;

function formatTextWithAppleEmojis(text, emojiSize = 20) {
  if (!text) return '';
  try {
    let result = '';
    let lastIndex = 0;
    const str = String(text);
    const re = new RegExp(EMOJI_RE.source, 'gu');
    let match;
    while ((match = re.exec(str)) !== null) {
      const idx = match.index;
      if (idx > lastIndex) result += escHtml(str.slice(lastIndex, idx));
      result += appleEmojiImg(match[0], emojiSize);
      lastIndex = idx + match[0].length;
    }
    if (lastIndex < str.length) result += escHtml(str.slice(lastIndex));
    return result || escHtml(str);
  } catch {
    return escHtml(text);
  }
}

function setPickerEmoji(el, emoji, size) {
  el.classList.add('emoji-font');
  el.textContent = emoji;
  el.style.fontSize = `${size}px`;
  el.dataset.emoji = emoji;
}
