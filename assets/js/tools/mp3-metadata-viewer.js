/**
 * MP3 metadata viewer — reads ID3v2.3 / ID3v2.4 / ID3v1 tags from the bytes
 * of an uploaded MP3 file. No external library, no upload.
 *
 * We support the most-asked-for frames:
 *   TIT2 / TPE1 / TPE2 / TALB / TYER / TDRC / TCON / TRCK / COMM / APIC
 * and the legacy ID3v1 footer (last 128 bytes of the file) as a fallback.
 */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const dropZone = $('id3-drop');
  const controls = $('id3-controls');
  const fileInfo = $('id3-file-info');
  const fields   = $('id3-fields');
  const cover    = $('id3-cover');
  const noCover  = $('id3-no-cover');
  const resetBtn = $('id3-reset-btn');

  function err(msg) { Utils.showToast(msg, 'error'); }
  function fmtBytes(b) {
    if (!b) return '0 B';
    const k = 1024, u = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return (b / Math.pow(k, i)).toFixed(1) + ' ' + u[i];
  }

  // ── ID3v2 parser ────────────────────────────────────────────────────────
  // Frames begin after a 10-byte header: ID3 + version + flags + size (synchsafe).

  function readSynchsafe(view, offset) {
    return (view.getUint8(offset)     & 0x7F) << 21
         | (view.getUint8(offset + 1) & 0x7F) << 14
         | (view.getUint8(offset + 2) & 0x7F) << 7
         | (view.getUint8(offset + 3) & 0x7F);
  }

  function decodeText(bytes, encoding) {
    // encoding byte: 0 ISO-8859-1, 1 UTF-16 BOM, 2 UTF-16BE, 3 UTF-8
    try {
      if (encoding === 0) return new TextDecoder('iso-8859-1').decode(bytes);
      if (encoding === 1) return new TextDecoder('utf-16').decode(bytes);
      if (encoding === 2) return new TextDecoder('utf-16be').decode(bytes);
      return new TextDecoder('utf-8').decode(bytes);
    } catch {
      return '';
    }
  }

  function parseId3v2(buffer) {
    const view = new DataView(buffer);
    if (buffer.byteLength < 10) return null;
    if (view.getUint8(0) !== 0x49 || view.getUint8(1) !== 0x44 || view.getUint8(2) !== 0x33) return null;
    const major = view.getUint8(3);
    const tagSize = readSynchsafe(view, 6);
    const end = 10 + tagSize;
    let p = 10;

    const out = { _hasTag: true, _version: major };
    while (p + 10 < end) {
      // v2.2 used 6-byte frame headers; we ignore those (rare today).
      const id = String.fromCharCode(view.getUint8(p), view.getUint8(p + 1), view.getUint8(p + 2), view.getUint8(p + 3));
      if (!/^[A-Z0-9]{4}$/.test(id)) break;
      const size = (major === 4)
        ? readSynchsafe(view, p + 4)
        : view.getUint32(p + 4);
      const frameStart = p + 10;
      const frameEnd   = frameStart + size;
      if (frameEnd > end || size <= 0) break;

      const frameBytes = new Uint8Array(buffer, frameStart, size);

      if (id === 'APIC') {
        // text encoding(1) | mime\0 | picture type(1) | description(\0[\0]) | image data
        let i = 0;
        const enc = frameBytes[i++];
        let mimeEnd = i;
        while (mimeEnd < frameBytes.length && frameBytes[mimeEnd] !== 0) mimeEnd++;
        const mime = new TextDecoder('iso-8859-1').decode(frameBytes.slice(i, mimeEnd));
        i = mimeEnd + 1;
        i += 1; // skip picture type
        // skip description (null-terminated, possibly UTF-16 with double null)
        if (enc === 1 || enc === 2) {
          while (i + 1 < frameBytes.length && !(frameBytes[i] === 0 && frameBytes[i + 1] === 0)) i += 2;
          i += 2;
        } else {
          while (i < frameBytes.length && frameBytes[i] !== 0) i++;
          i += 1;
        }
        const imageBytes = frameBytes.slice(i);
        out.APIC = { mime: mime || 'image/jpeg', bytes: imageBytes };
      } else if (id.startsWith('T')) {
        const enc = frameBytes[0];
        out[id] = decodeText(frameBytes.slice(1), enc).replace(/\0+$/, '');
      } else if (id === 'COMM') {
        // text encoding(1) | language(3) | short desc(\0) | full text
        const enc = frameBytes[0];
        let i = 4; // skip lang
        if (enc === 1 || enc === 2) {
          while (i + 1 < frameBytes.length && !(frameBytes[i] === 0 && frameBytes[i + 1] === 0)) i += 2;
          i += 2;
        } else {
          while (i < frameBytes.length && frameBytes[i] !== 0) i++;
          i += 1;
        }
        out.COMM = decodeText(frameBytes.slice(i), enc).replace(/\0+$/, '');
      }
      p = frameEnd;
    }
    return out;
  }

  function parseId3v1(buffer) {
    const len = buffer.byteLength;
    if (len < 128) return null;
    const view = new DataView(buffer, len - 128, 128);
    if (view.getUint8(0) !== 0x54 || view.getUint8(1) !== 0x41 || view.getUint8(2) !== 0x47) return null;
    const dec = new TextDecoder('iso-8859-1');
    function read(off, n) {
      const arr = [];
      for (let i = 0; i < n; i++) arr.push(view.getUint8(off + i));
      return dec.decode(new Uint8Array(arr)).replace(/\0+$/, '').trim();
    }
    const title = read(3, 30);
    const artist = read(33, 30);
    const album  = read(63, 30);
    const year   = read(93, 4);
    const comment = read(97, 30);
    const genre  = view.getUint8(127);
    return { _hasTag: true, _version: 1, TIT2: title, TPE1: artist, TALB: album, TYER: year, COMM: comment, _genreId: genre };
  }

  function row(label, value) {
    if (!value) return '';
    return `
      <div class="grid grid-cols-3 gap-3 py-1.5 border-b border-slate-100 last:border-0">
        <dt class="text-slate-500 col-span-1">${label}</dt>
        <dd class="text-slate-900 col-span-2 break-words">${Utils.escapeHtml(String(value))}</dd>
      </div>`;
  }

  function render(meta, file) {
    const html = [
      row('Title',   meta.TIT2),
      row('Artist',  meta.TPE1 || meta.TPE2),
      row('Album',   meta.TALB),
      row('Year',    meta.TYER || meta.TDRC),
      row('Genre',   meta.TCON),
      row('Track',   meta.TRCK),
      row('Comment', meta.COMM),
      row('File',    file.name),
      row('Size',    fmtBytes(file.size)),
      row('ID3 version', meta._version === 1 ? 'ID3v1' : `ID3v2.${meta._version}`),
    ].filter(Boolean).join('');
    fields.innerHTML = html || `<p class="text-slate-500 text-sm">No tags found in this file.</p>`;

    if (meta.APIC && meta.APIC.bytes && meta.APIC.bytes.length) {
      const blob = new Blob([meta.APIC.bytes], { type: meta.APIC.mime || 'image/jpeg' });
      if (cover._url) URL.revokeObjectURL(cover._url);
      cover._url = URL.createObjectURL(blob);
      cover.src = cover._url;
      cover.classList.remove('hidden');
      noCover.classList.add('hidden');
    } else {
      cover.classList.add('hidden');
      noCover.classList.remove('hidden');
    }
  }

  function handleFile(file) {
    if (!/\.mp3$/i.test(file.name) && file.type !== 'audio/mpeg') {
      err('Please select an MP3 file.');
      return;
    }
    fileInfo.textContent = `${file.name} — ${fmtBytes(file.size)}`;

    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result;
      const meta = parseId3v2(buffer) || parseId3v1(buffer) || { _hasTag: false };
      render(meta, file);
      dropZone.classList.add('hidden');
      controls.classList.remove('hidden');
    };
    reader.onerror = () => err('Could not read this file.');
    reader.readAsArrayBuffer(file);
  }

  function reset() {
    fields.innerHTML = '';
    fileInfo.textContent = '';
    if (cover._url) URL.revokeObjectURL(cover._url);
    cover.src = '';
    cover.classList.add('hidden');
    noCover.classList.remove('hidden');
    controls.classList.add('hidden');
    dropZone.classList.remove('hidden');
  }

  Utils.setupDropZone(dropZone, handleFile);
  resetBtn.addEventListener('click', reset);
})();
