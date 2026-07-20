#!/usr/bin/env node
/**
 * One-shot generator for the 5 audio-tool pages.
 * The shared shell (head/header/footer/breadcrumb/sidebar) is identical;
 * each tool's body controls are passed in inline.
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const SHELL = (cfg, body) => `<!DOCTYPE html>
<html lang="en" data-tool="${cfg.slug}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="alternate icon" href="/assets/favicon.svg">
  <link rel="apple-touch-icon" href="/assets/favicon.svg">
  <link rel="mask-icon" href="/assets/favicon.svg" color="#6366f1">
  <meta name="theme-color" content="#6366f1">
  <title>${cfg.title}</title>
  <meta name="description" content="${cfg.metaDesc}">
  <meta name="keywords" content="${cfg.keywords}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://manyutils.com/${cfg.slug}/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${cfg.title}">
  <meta property="og:description" content="${cfg.metaDesc}">
  <meta property="og:url" content="https://manyutils.com/${cfg.slug}/">
  <meta property="og:site_name" content="ManyUtils">
  <meta property="og:image" content="https://manyutils.com/assets/images/og-default.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${cfg.title}">
  <meta name="twitter:description" content="${cfg.metaDesc}">
  <meta name="twitter:image" content="https://manyutils.com/assets/images/og-default.png">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "${cfg.appName}",
    "url": "https://manyutils.com/${cfg.slug}/",
    "description": "${cfg.metaDesc}",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "All",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "featureList": ${JSON.stringify(cfg.features)}
  }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="/assets/js/tailwind-config.js"></script>
  <link rel="stylesheet" href="/assets/css/styles.css">
  <meta name="google-adsense-account" content="ca-pub-5377170083939417">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5377170083939417"
       crossorigin="anonymous"></script>
</head>
<body class="bg-slate-50 font-sans antialiased text-slate-800">
  <header id="header"></header>
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <nav aria-label="Breadcrumb" class="text-xs text-slate-500 mb-4">
      <ol class="flex flex-wrap items-center gap-1.5">
        <li><a href="/" class="hover:text-primary-600" data-i18n="common.home">Home</a></li>
        <li class="text-slate-300">/</li>
        <li><a href="/#tools" class="hover:text-primary-600" data-i18n="common.tools">Tools</a></li>
        <li class="text-slate-300">/</li>
        <li class="text-slate-700 font-medium" data-i18n="tools.${cfg.i18nKey}.name">${cfg.h1}</li>
      </ol>
    </nav>

    <div class="lg:grid lg:grid-cols-12 lg:gap-8">
      <div class="lg:col-span-8">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 mb-2" data-i18n="tools.${cfg.i18nKey}.name">${cfg.h1}</h1>
          <p class="text-slate-500 mb-2" data-i18n="tools.${cfg.i18nKey}.description">${cfg.lede}</p>
          <p class="text-xs text-emerald-600 mb-6" data-i18n="common.audio_privacy_note">Your audio stays on your device. Processing happens locally in your browser.</p>

          <div id="tool-container">
${body}
          </div>
        </div>

        <div class="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div id="seo-content"></div>
        </div>
      </div>
      <aside class="mt-8 lg:mt-0 lg:col-span-4">
        <div id="sidebar-content"></div>
      </aside>
    </div>
  </main>
  <footer id="footer"></footer>
  <script src="/assets/js/tools-registry.js"></script>
  <script src="/assets/js/guides-registry.js"></script>
  <script src="/assets/js/utils.js"></script>
  <script src="/assets/js/i18n.js"></script>
  <script src="/assets/js/components.js"></script>
  <script src="/assets/js/app.js"></script>
${cfg.usesAudioBase ? `  <script src="/assets/js/tools/_audio-base.js"></script>\n` : ''}  <script src="/assets/js/tools/${cfg.slug}.js"></script>
</body>
</html>
`;

const dropZone = (prefix, accept, txt, sub, iconDur) => `
            <div id="${prefix}-drop" class="drop-zone" data-accept="${accept}" tabindex="0" role="button" aria-label="Upload audio">
              <div class="flex flex-col items-center justify-center py-10 text-center">
                <svg class="w-10 h-10 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"/></svg>
                <p class="text-sm font-medium text-slate-600 mb-1">${txt}</p>
                <p class="text-xs text-slate-400">${sub}</p>
              </div>
            </div>`;

const TOOLS = [
  {
    slug: 'audio-cutter',
    i18nKey: 'audio_cutter',
    h1: 'Audio Cutter',
    title: 'Audio Cutter — Free Online MP3 / WAV Trimmer | ManyUtils',
    metaDesc: 'Trim and cut audio files online for free. Drag the start/end handles, preview, and download — 100% browser-based, no uploads.',
    keywords: 'audio cutter, mp3 cutter, wav cutter, online audio trimmer, free audio cutter, browser audio editor',
    appName: 'Audio Cutter',
    features: ['Visual trim handles', 'MP3, WAV, M4A, AAC input', 'WAV output', 'Live preview', '100% browser-based'],
    lede: 'Cut and trim audio with sub-second precision — drag the handles, preview, download.',
    usesAudioBase: true,
    body: `            <div class="space-y-6">
              ${dropZone('cutter', 'audio/*', 'Drag &amp; drop an audio file', 'or click to browse — MP3, WAV, M4A, AAC, OGG, FLAC')}

              <div id="cutter-controls" class="hidden space-y-5">
                <div id="cutter-file-info" class="text-sm text-slate-500"></div>

                <audio id="cutter-preview" controls class="w-full"></audio>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label for="cutter-start" class="block text-sm font-medium text-slate-700 mb-1.5">Start (s)</label>
                    <input type="number" id="cutter-start" min="0" step="0.01" value="0" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm">
                  </div>
                  <div>
                    <label for="cutter-end" class="block text-sm font-medium text-slate-700 mb-1.5">End (s)</label>
                    <input type="number" id="cutter-end" min="0.01" step="0.01" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm">
                  </div>
                </div>

                <input type="range" id="cutter-range-start" min="0" max="100" value="0" step="0.1" class="w-full accent-primary-500" aria-label="Start time">
                <input type="range" id="cutter-range-end"   min="0" max="100" value="100" step="0.1" class="w-full accent-primary-500" aria-label="End time">

                <p class="text-xs text-slate-500">Selection: <span id="cutter-selection" class="font-mono text-slate-700">0:00–0:00</span></p>

                <div class="flex flex-wrap gap-3">
                  <button id="cutter-process-btn" class="px-5 py-2.5 rounded-xl font-medium text-sm bg-primary-500 hover:bg-primary-600 text-white transition-colors">Cut &amp; preview</button>
                  <button id="cutter-reset-btn"   class="px-5 py-2.5 rounded-xl font-medium text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors" data-i18n="common.reset">Reset</button>
                </div>

                <div id="cutter-results" class="hidden space-y-3">
                  <p class="text-sm font-medium text-slate-700">Result</p>
                  <audio id="cutter-result-audio" controls class="w-full"></audio>
                  <button id="cutter-download-btn" class="px-5 py-2.5 rounded-xl font-medium text-sm bg-primary-500 hover:bg-primary-600 text-white transition-colors" data-i18n="common.download">Download WAV</button>
                </div>
              </div>
            </div>`,
  },
  {
    slug: 'volume-changer',
    i18nKey: 'volume_changer',
    h1: 'Audio Volume Booster &amp; Reducer',
    title: 'Audio Volume Booster — Increase or Reduce Volume Online | ManyUtils',
    metaDesc: 'Boost quiet audio or reduce loud audio in your browser. Adjustable gain from -20 dB to +20 dB. 100% private — no upload.',
    keywords: 'audio volume booster, volume reducer, increase audio volume, reduce mp3 volume, normalize audio, free audio louder',
    appName: 'Audio Volume Booster',
    features: ['Gain from -20 dB to +20 dB', 'MP3, WAV, M4A, AAC input', 'WAV output', 'Live preview', '100% browser-based'],
    lede: 'Adjust the loudness of any audio file from -20 dB to +20 dB — preview before downloading.',
    usesAudioBase: true,
    body: `            <div class="space-y-6">
              ${dropZone('vol', 'audio/*', 'Drag &amp; drop an audio file', 'or click to browse — MP3, WAV, M4A, AAC, OGG, FLAC')}

              <div id="vol-controls" class="hidden space-y-5">
                <div id="vol-file-info" class="text-sm text-slate-500"></div>

                <audio id="vol-preview" controls class="w-full"></audio>

                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <label for="vol-gain" class="block text-sm font-medium text-slate-700">Gain (dB)</label>
                    <span id="vol-gain-value" class="text-sm font-semibold text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-lg">+0 dB</span>
                  </div>
                  <input type="range" id="vol-gain" min="-20" max="20" step="0.5" value="0" class="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary-500">
                  <div class="flex justify-between text-xs text-slate-400 mt-1"><span>-20 dB</span><span>0 dB</span><span>+20 dB</span></div>
                </div>

                <p class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">Boosting too aggressively will clip — your audio may distort. Try +6 dB first and listen.</p>

                <div class="flex flex-wrap gap-3">
                  <button id="vol-process-btn" class="px-5 py-2.5 rounded-xl font-medium text-sm bg-primary-500 hover:bg-primary-600 text-white transition-colors">Apply &amp; preview</button>
                  <button id="vol-reset-btn"   class="px-5 py-2.5 rounded-xl font-medium text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors" data-i18n="common.reset">Reset</button>
                </div>

                <div id="vol-results" class="hidden space-y-3">
                  <p class="text-sm font-medium text-slate-700">Result</p>
                  <audio id="vol-result-audio" controls class="w-full"></audio>
                  <button id="vol-download-btn" class="px-5 py-2.5 rounded-xl font-medium text-sm bg-primary-500 hover:bg-primary-600 text-white transition-colors" data-i18n="common.download">Download WAV</button>
                </div>
              </div>
            </div>`,
  },
  {
    slug: 'audio-speed-changer',
    i18nKey: 'audio_speed_changer',
    h1: 'Audio Speed Changer',
    title: 'Audio Speed Changer — Speed Up or Slow Down Audio | ManyUtils',
    metaDesc: 'Speed up or slow down audio from 0.25× to 4× online. Useful for podcasts, voice notes, and language practice. Browser-based — no upload.',
    keywords: 'audio speed changer, slow down audio, speed up audio, podcast speed, audio tempo, free audio speed',
    appName: 'Audio Speed Changer',
    features: ['0.25× to 4× speed', 'MP3, WAV, M4A, AAC input', 'WAV output', 'Live preview', '100% browser-based'],
    lede: 'Speed audio up to 4× or slow it down to 0.25× — pitch follows speed (chipmunk / deeper voice).',
    usesAudioBase: true,
    body: `            <div class="space-y-6">
              ${dropZone('spd', 'audio/*', 'Drag &amp; drop an audio file', 'or click to browse — MP3, WAV, M4A, AAC, OGG, FLAC')}

              <div id="spd-controls" class="hidden space-y-5">
                <div id="spd-file-info" class="text-sm text-slate-500"></div>

                <audio id="spd-preview" controls class="w-full"></audio>

                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <label for="spd-speed" class="block text-sm font-medium text-slate-700">Speed</label>
                    <span id="spd-speed-value" class="text-sm font-semibold text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-lg">1.00×</span>
                  </div>
                  <input type="range" id="spd-speed" min="0.25" max="4" step="0.05" value="1" class="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary-500">
                  <div class="flex justify-between text-xs text-slate-400 mt-1"><span>0.25×</span><span>1×</span><span>4×</span></div>
                </div>

                <div class="flex flex-wrap gap-2">
                  <button data-speed="0.5"  class="spd-preset px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-slate-700 border border-slate-200 hover:border-primary-300">0.5×</button>
                  <button data-speed="0.75" class="spd-preset px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-slate-700 border border-slate-200 hover:border-primary-300">0.75×</button>
                  <button data-speed="1"    class="spd-preset px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-slate-700 border border-slate-200 hover:border-primary-300">1×</button>
                  <button data-speed="1.25" class="spd-preset px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-slate-700 border border-slate-200 hover:border-primary-300">1.25×</button>
                  <button data-speed="1.5"  class="spd-preset px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-slate-700 border border-slate-200 hover:border-primary-300">1.5×</button>
                  <button data-speed="2"    class="spd-preset px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-slate-700 border border-slate-200 hover:border-primary-300">2×</button>
                </div>

                <div class="flex flex-wrap gap-3">
                  <button id="spd-process-btn" class="px-5 py-2.5 rounded-xl font-medium text-sm bg-primary-500 hover:bg-primary-600 text-white transition-colors">Apply &amp; preview</button>
                  <button id="spd-reset-btn"   class="px-5 py-2.5 rounded-xl font-medium text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors" data-i18n="common.reset">Reset</button>
                </div>

                <div id="spd-results" class="hidden space-y-3">
                  <p class="text-sm font-medium text-slate-700">Result</p>
                  <audio id="spd-result-audio" controls class="w-full"></audio>
                  <button id="spd-download-btn" class="px-5 py-2.5 rounded-xl font-medium text-sm bg-primary-500 hover:bg-primary-600 text-white transition-colors" data-i18n="common.download">Download WAV</button>
                </div>
              </div>
            </div>`,
  },
  {
    slug: 'audio-to-wav',
    i18nKey: 'audio_to_wav',
    h1: 'Audio to WAV Converter',
    title: 'Audio to WAV — Convert MP3 / M4A / OGG / FLAC to WAV | ManyUtils',
    metaDesc: 'Convert any audio file to WAV (uncompressed PCM) directly in your browser. Supports MP3, M4A, AAC, OGG, FLAC. 100% private.',
    keywords: 'audio to wav, mp3 to wav, m4a to wav, ogg to wav, flac to wav, audio converter, free wav converter',
    appName: 'Audio to WAV Converter',
    features: ['Decode MP3, M4A, AAC, OGG, FLAC', 'PCM 16-bit WAV output', '100% browser-based', 'Drag &amp; drop'],
    lede: 'Convert MP3, M4A, AAC, OGG, FLAC and more into uncompressed 16-bit PCM WAV files.',
    usesAudioBase: true,
    body: `            <div class="space-y-6">
              ${dropZone('a2w', 'audio/*', 'Drag &amp; drop an audio file', 'or click to browse — MP3, M4A, AAC, OGG, FLAC')}

              <div id="a2w-controls" class="hidden space-y-5">
                <div id="a2w-file-info" class="text-sm text-slate-500"></div>
                <audio id="a2w-preview" controls class="w-full"></audio>

                <div class="flex flex-wrap gap-3">
                  <button id="a2w-process-btn" class="px-5 py-2.5 rounded-xl font-medium text-sm bg-primary-500 hover:bg-primary-600 text-white transition-colors">Convert to WAV</button>
                  <button id="a2w-reset-btn"   class="px-5 py-2.5 rounded-xl font-medium text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors" data-i18n="common.reset">Reset</button>
                </div>

                <div id="a2w-results" class="hidden space-y-3">
                  <p class="text-sm font-medium text-slate-700">Result</p>
                  <audio id="a2w-result-audio" controls class="w-full"></audio>
                  <p id="a2w-output-info" class="text-xs text-slate-500"></p>
                  <button id="a2w-download-btn" class="px-5 py-2.5 rounded-xl font-medium text-sm bg-primary-500 hover:bg-primary-600 text-white transition-colors" data-i18n="common.download">Download WAV</button>
                </div>
              </div>
            </div>`,
  },
  {
    slug: 'mp3-metadata-viewer',
    i18nKey: 'mp3_metadata_viewer',
    h1: 'MP3 Metadata Viewer',
    title: 'MP3 Metadata Viewer — Read ID3 Tags Online (Title, Artist, Album) | ManyUtils',
    metaDesc: 'View MP3 metadata (ID3v1 &amp; ID3v2 tags): title, artist, album, year, genre, comment, embedded artwork. 100% browser-based — no upload.',
    keywords: 'mp3 metadata viewer, id3 tag reader, view mp3 tags, mp3 info, mp3 properties, free metadata reader',
    appName: 'MP3 Metadata Viewer',
    features: ['ID3v1 &amp; ID3v2 tag parsing', 'Embedded album art preview', 'Bitrate, sample rate, duration', '100% browser-based'],
    lede: 'See the title, artist, album, year, genre and embedded artwork stored inside any MP3 — entirely in your browser.',
    usesAudioBase: false,
    body: `            <div class="space-y-6">
              ${dropZone('id3', 'audio/mpeg,.mp3', 'Drag &amp; drop an MP3 file', 'or click to browse — MP3 only')}

              <div id="id3-controls" class="hidden space-y-5">
                <div id="id3-file-info" class="text-sm text-slate-500"></div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
                  <div class="sm:col-span-1">
                    <p class="text-sm font-medium text-slate-700 mb-1.5">Album art</p>
                    <div class="border border-slate-200 rounded-xl bg-slate-50 aspect-square flex items-center justify-center overflow-hidden">
                      <img id="id3-cover" alt="Album art" class="max-w-full max-h-full hidden">
                      <span id="id3-no-cover" class="text-xs text-slate-400">No artwork embedded</span>
                    </div>
                  </div>
                  <dl id="id3-fields" class="sm:col-span-2 grid grid-cols-1 gap-2 text-sm"></dl>
                </div>

                <button id="id3-reset-btn" class="px-5 py-2.5 rounded-xl font-medium text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors" data-i18n="common.reset">Reset</button>
              </div>
            </div>`,
  },
];

let written = 0;
for (const t of TOOLS) {
  const dir = path.join(ROOT, t.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), SHELL(t, t.body), 'utf8');
  written++;
}
console.log(`Generated ${written} audio tool pages.`);
