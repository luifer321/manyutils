#!/usr/bin/env node
/**
 * One-shot generator for the 9 image-conversion pages + their tool JS files.
 * Run once (or whenever a new converter is added) — checked-in output is what
 * the build pipeline ships.
 *
 *   node scripts/_gen-converter-pages.js
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const CONVERTERS = [
  // raster ↔ raster
  { slug: 'png-to-jpg',  i18nKey: 'png_to_jpg',  inputAccept: 'image/png',  inputExt: 'PNG',  outputType: 'image/jpeg', outputExt: 'jpg',  outputLabel: 'JPG',  hasQuality: true,  fillBg: '#ffffff', defaultName: 'JPG' },
  { slug: 'jpg-to-png',  i18nKey: 'jpg_to_png',  inputAccept: 'image/jpeg', inputExt: 'JPG',  outputType: 'image/png',  outputExt: 'png',  outputLabel: 'PNG',  hasQuality: false, fillBg: null,      defaultName: 'PNG' },
  { slug: 'png-to-webp', i18nKey: 'png_to_webp', inputAccept: 'image/png',  inputExt: 'PNG',  outputType: 'image/webp', outputExt: 'webp', outputLabel: 'WebP', hasQuality: true,  fillBg: null,      defaultName: 'WebP' },
  { slug: 'webp-to-png', i18nKey: 'webp_to_png', inputAccept: 'image/webp', inputExt: 'WebP', outputType: 'image/png',  outputExt: 'png',  outputLabel: 'PNG',  hasQuality: false, fillBg: null,      defaultName: 'PNG' },
  { slug: 'webp-to-jpg', i18nKey: 'webp_to_jpg', inputAccept: 'image/webp', inputExt: 'WebP', outputType: 'image/jpeg', outputExt: 'jpg',  outputLabel: 'JPG',  hasQuality: true,  fillBg: '#ffffff', defaultName: 'JPG' },
  { slug: 'jpg-to-webp', i18nKey: 'jpg_to_webp', inputAccept: 'image/jpeg', inputExt: 'JPG',  outputType: 'image/webp', outputExt: 'webp', outputLabel: 'WebP', hasQuality: true,  fillBg: null,      defaultName: 'WebP' },
  // SVG → raster
  { slug: 'svg-to-png',  i18nKey: 'svg_to_png',  inputAccept: 'image/svg+xml', inputExt: 'SVG', outputType: 'image/png',  outputExt: 'png',  outputLabel: 'PNG',  hasQuality: false, fillBg: null,      isSvg: true, defaultName: 'PNG' },
  { slug: 'svg-to-jpg',  i18nKey: 'svg_to_jpg',  inputAccept: 'image/svg+xml', inputExt: 'SVG', outputType: 'image/jpeg', outputExt: 'jpg',  outputLabel: 'JPG',  hasQuality: true,  fillBg: '#ffffff', isSvg: true, defaultName: 'JPG' },
  { slug: 'svg-to-webp', i18nKey: 'svg_to_webp', inputAccept: 'image/svg+xml', inputExt: 'SVG', outputType: 'image/webp', outputExt: 'webp', outputLabel: 'WebP', hasQuality: true,  fillBg: null,      isSvg: true, defaultName: 'WebP' },
];

const PAGE_TPL = (c) => {
  const titleHuman = `${c.inputExt} to ${c.outputLabel}`;
  const prefix = 'imgconv';
  return `<!DOCTYPE html>
<html lang="en" data-tool="${c.slug}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="alternate icon" href="/assets/favicon.svg">
  <link rel="apple-touch-icon" href="/assets/favicon.svg">
  <link rel="mask-icon" href="/assets/favicon.svg" color="#6366f1">
  <meta name="theme-color" content="#6366f1">
  <title>${titleHuman} Converter — Free Online ${c.inputExt} to ${c.outputLabel} | ManyUtils</title>
  <meta name="description" content="Convert ${c.inputExt} to ${c.outputLabel} online for free. 100% browser-based — your files never leave your device. Drag, drop, download in seconds.">
  <meta name="keywords" content="${c.inputExt.toLowerCase()} to ${c.outputLabel.toLowerCase()}, free ${c.inputExt.toLowerCase()} to ${c.outputLabel.toLowerCase()} converter, online image converter, browser image converter">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="https://manyutils.com/${c.slug}/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${titleHuman} Converter — Free &amp; Browser-Based | ManyUtils">
  <meta property="og:description" content="Convert ${c.inputExt} to ${c.outputLabel} online for free. 100% browser-based — your files never leave your device.">
  <meta property="og:url" content="https://manyutils.com/${c.slug}/">
  <meta property="og:site_name" content="ManyUtils">
  <meta property="og:image" content="https://manyutils.com/assets/images/og-default.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${titleHuman} Converter — Free &amp; Browser-Based | ManyUtils">
  <meta name="twitter:description" content="Convert ${c.inputExt} to ${c.outputLabel} online for free. 100% browser-based — no upload.">
  <meta name="twitter:image" content="https://manyutils.com/assets/images/og-default.png">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "${titleHuman} Converter",
    "url": "https://manyutils.com/${c.slug}/",
    "description": "Convert ${c.inputExt} to ${c.outputLabel} online for free. 100% browser-based — files never leave your device.",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "All",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "featureList": ["${c.inputExt} to ${c.outputLabel} conversion", "Drag & drop upload", "Quality slider"${c.hasQuality ? '' : ' /* no quality for lossless output */'}, "100% browser-based", "No upload — privacy-friendly"]
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
        <li class="text-slate-700 font-medium" data-i18n="tools.${c.i18nKey}.name">${titleHuman} Converter</li>
      </ol>
    </nav>

    <div class="lg:grid lg:grid-cols-12 lg:gap-8">
      <div class="lg:col-span-8">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 mb-2" data-i18n="tools.${c.i18nKey}.name">${titleHuman} Converter</h1>
          <p class="text-slate-500 mb-6" data-i18n="tools.${c.i18nKey}.description">Convert ${c.inputExt} files to ${c.outputLabel} format directly in your browser. No upload, no signup.</p>

          <div id="tool-container">
            <div class="space-y-6">
              <div id="${prefix}-drop" class="drop-zone" data-accept="${c.inputAccept}" tabindex="0" role="button" aria-label="Upload ${c.inputExt} file">
                <div class="flex flex-col items-center justify-center py-10 text-center">
                  <svg class="w-10 h-10 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"/></svg>
                  <p class="text-sm font-medium text-slate-600 mb-1" data-i18n="common.drop_image_here">Drag &amp; drop your ${c.inputExt} here</p>
                  <p class="text-xs text-slate-400" data-i18n="common.or_click_to_browse">or click to browse</p>
                </div>
              </div>

              <div id="${prefix}-controls" class="hidden space-y-5">
                <div id="${prefix}-file-info" class="text-sm text-slate-500"></div>
${c.hasQuality ? `
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <label for="${prefix}-quality" class="block text-sm font-medium text-slate-700" data-i18n="common.quality">Quality</label>
                    <span id="${prefix}-quality-value" class="text-sm font-semibold text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-lg">90%</span>
                  </div>
                  <input type="range" id="${prefix}-quality" min="1" max="100" value="90" class="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary-500">
                </div>` : ''}

                <div>
                  <button id="${prefix}-process-btn" class="px-5 py-2.5 rounded-xl font-medium text-sm bg-primary-500 hover:bg-primary-600 text-white transition-colors" data-i18n="common.convert">
                    Convert to ${c.outputLabel}
                  </button>
                </div>

                <div id="${prefix}-results" class="hidden space-y-4">
                  <div class="grid grid-cols-3 gap-3 text-center">
                    <div class="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <p class="text-xs text-slate-500 mb-0.5" data-i18n="common.original">Original</p>
                      <p id="${prefix}-original-size" class="text-sm font-semibold text-slate-900"></p>
                    </div>
                    <div class="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <p class="text-xs text-slate-500 mb-0.5" data-i18n="common.output">Output</p>
                      <p id="${prefix}-output-size" class="text-sm font-semibold text-slate-900"></p>
                    </div>
                    <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      <p class="text-xs text-emerald-600 mb-0.5" data-i18n="common.savings">Savings</p>
                      <p id="${prefix}-savings" class="text-sm font-semibold text-emerald-700"></p>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p class="text-sm font-medium text-slate-700 mb-1.5" data-i18n="common.original">Original</p>
                      <div class="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center min-h-[200px]">
                        <canvas id="${prefix}-canvas-preview" class="max-w-full h-auto"></canvas>
                      </div>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-slate-700 mb-1.5" data-i18n="common.output">Output</p>
                      <div class="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center min-h-[200px]">
                        <img id="${prefix}-preview-result" class="max-w-full h-auto" alt="Converted preview">
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-3">
                    <button id="${prefix}-download-btn" class="px-5 py-2.5 rounded-xl font-medium text-sm bg-primary-500 hover:bg-primary-600 text-white transition-colors" data-i18n="common.download">
                      Download ${c.outputLabel}
                    </button>
                    <button id="${prefix}-reset-btn" class="px-5 py-2.5 rounded-xl font-medium text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors" data-i18n="common.reset">
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
  <script src="/assets/js/tools/_image-base.js"></script>
  <script src="/assets/js/tools/${c.slug}.js"></script>
</body>
</html>
`;
};

const JS_TPL = (c) => {
  const filenameSuffix = `-converted`;
  const fillLine = c.fillBg ? `,\n    fillBackground: '${c.fillBg}'` : '';
  const svgRender = c.isSvg ? `,
    // SVG decodes lazily in some browsers — wait until naturalWidth resolves before rendering.
    processCanvas: (img, cfg, opts, state) => {
      // SVG without intrinsic size renders at 300×150 by default. Fall back to a sane size.
      const w = (img.naturalWidth  || 1024);
      const h = (img.naturalHeight || 1024);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ${c.fillBg ? `ctx.fillStyle = '${c.fillBg}'; ctx.fillRect(0, 0, w, h);` : ''}
      ctx.drawImage(img, 0, 0, w, h);
      return canvas;
    }` : '';

  return `(function () {
  'use strict';
  if (typeof ImageTool === 'undefined') return;

  ImageTool.create({
    prefix: 'imgconv',
    accept: '${c.inputAccept}',
    outputType: '${c.outputType}',
    outputExt: '${c.outputExt}',
    filenameSuffix: '${filenameSuffix}',
    hasQuality: ${c.hasQuality},
    defaultQuality: 90${fillLine}${svgRender},
  });
})();
`;
};

let written = 0;
for (const c of CONVERTERS) {
  const dir = path.join(ROOT, c.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), PAGE_TPL(c), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'assets', 'js', 'tools', `${c.slug}.js`), JS_TPL(c), 'utf8');
  written++;
}
console.log(`Generated ${written} converter pages + JS modules.`);
