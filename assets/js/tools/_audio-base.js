/**
 * Shared audio helpers used by audio-cutter, volume-changer, speed-changer
 * and audio-to-wav. Encapsulates the boring bits:
 *
 *   - decode a File into an AudioBuffer (any format the browser supports)
 *   - render an AudioBuffer back to a downloadable WAV blob
 *   - format seconds as MM:SS.xx for the inline labels
 *
 * Browser format support varies: MP3 / WAV / AAC / FLAC are widely decodable
 * via decodeAudioData, but Ogg Vorbis / Opus depend on the platform. We
 * surface a clear error message instead of silently failing.
 */
window.AudioBase = (function () {
  'use strict';

  // Re-use a single AudioContext to play previews and decode.
  let _ctx;
  function ctx() {
    if (!_ctx) {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return _ctx;
  }

  function decode(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('audio/') && !/\.(mp3|wav|m4a|aac|ogg|flac|webm|opus)$/i.test(file.name)) {
        return reject(new Error('Please select an audio file (MP3, WAV, M4A, AAC, OGG, FLAC).'));
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read this file.'));
      reader.onload = () => {
        ctx().decodeAudioData(
          reader.result.slice(0),
          buf => resolve(buf),
          err => reject(new Error('Could not decode this audio. Try MP3, WAV, or M4A.')),
        );
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function fmtTime(s) {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = (s - m * 60).toFixed(2);
    return `${m}:${sec.padStart(5, '0')}`;
  }

  // 16-bit PCM WAV encoder. Produces a Blob suitable for Utils.downloadFile.
  // Adapted from the public-domain pattern shared in MDN's Web Audio examples.
  function encodeWav(buffer) {
    const numCh = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length * numCh * 2 + 44;
    const out = new ArrayBuffer(length);
    const view = new DataView(out);

    let p = 0;
    function writeStr(s) { for (let i = 0; i < s.length; i++) view.setUint8(p++, s.charCodeAt(i)); }
    function w16(n)     { view.setUint16(p, n, true); p += 2; }
    function w32(n)     { view.setUint32(p, n, true); p += 4; }

    writeStr('RIFF');
    w32(length - 8);
    writeStr('WAVE');
    writeStr('fmt ');
    w32(16);                        // chunk size
    w16(1);                         // PCM
    w16(numCh);
    w32(sampleRate);
    w32(sampleRate * numCh * 2);    // byte rate
    w16(numCh * 2);                 // block align
    w16(16);                        // bits per sample
    writeStr('data');
    w32(buffer.length * numCh * 2);

    // Interleave channels and write 16-bit signed samples.
    const channels = [];
    for (let c = 0; c < numCh; c++) channels.push(buffer.getChannelData(c));
    for (let i = 0; i < buffer.length; i++) {
      for (let c = 0; c < numCh; c++) {
        const sample = Math.max(-1, Math.min(1, channels[c][i]));
        view.setInt16(p, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        p += 2;
      }
    }

    return new Blob([out], { type: 'audio/wav' });
  }

  /**
   * Build a brand-new AudioBuffer that is `outBuffer.length` long, copying the
   * given subrange of `inBuffer` into it. Used by the cutter and to apply gain.
   */
  function copyRange(inBuffer, fromSec, toSec) {
    const sr = inBuffer.sampleRate;
    const startSample = Math.floor(fromSec * sr);
    const endSample   = Math.floor(toSec * sr);
    const len = Math.max(1, endSample - startSample);
    const out = ctx().createBuffer(inBuffer.numberOfChannels, len, sr);
    for (let c = 0; c < inBuffer.numberOfChannels; c++) {
      const src = inBuffer.getChannelData(c);
      out.getChannelData(c).set(src.subarray(startSample, startSample + len));
    }
    return out;
  }

  /**
   * Apply a constant gain factor to a buffer (≥ 1 boosts, < 1 reduces).
   * Hard-clips at ±1 because we render to PCM.
   */
  function applyGain(inBuffer, gain) {
    const sr = inBuffer.sampleRate;
    const out = ctx().createBuffer(inBuffer.numberOfChannels, inBuffer.length, sr);
    for (let c = 0; c < inBuffer.numberOfChannels; c++) {
      const src = inBuffer.getChannelData(c);
      const dst = out.getChannelData(c);
      for (let i = 0; i < src.length; i++) {
        const v = src[i] * gain;
        dst[i] = v > 1 ? 1 : v < -1 ? -1 : v;
      }
    }
    return out;
  }

  /**
   * Resample / time-stretch using linear interpolation. Speed > 1 = faster,
   * < 1 = slower. For "preserve pitch" we'd need a real time-stretch algorithm
   * (PSOLA or phase vocoder) — we keep it simple and let pitch shift, which is
   * what most users actually want from a "speed changer".
   */
  function changeSpeed(inBuffer, speed) {
    if (speed <= 0) speed = 1;
    const sr = inBuffer.sampleRate;
    const outLen = Math.max(1, Math.round(inBuffer.length / speed));
    const out = ctx().createBuffer(inBuffer.numberOfChannels, outLen, sr);
    for (let c = 0; c < inBuffer.numberOfChannels; c++) {
      const src = inBuffer.getChannelData(c);
      const dst = out.getChannelData(c);
      for (let i = 0; i < outLen; i++) {
        const srcIdx = i * speed;
        const lo = Math.floor(srcIdx);
        const hi = Math.min(src.length - 1, lo + 1);
        const t = srcIdx - lo;
        dst[i] = src[lo] * (1 - t) + src[hi] * t;
      }
    }
    return out;
  }

  return { ctx, decode, fmtTime, encodeWav, copyRange, applyGain, changeSpeed };
})();
