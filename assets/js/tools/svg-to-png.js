(function () {
  'use strict';
  if (typeof ImageTool === 'undefined') return;

  ImageTool.create({
    prefix: 'imgconv',
    accept: 'image/svg+xml',
    outputType: 'image/png',
    outputExt: 'png',
    filenameSuffix: '-converted',
    hasQuality: false,
    defaultQuality: 90,
    // SVG decodes lazily in some browsers — wait until naturalWidth resolves before rendering.
    processCanvas: (img, cfg, opts, state) => {
      // SVG without intrinsic size renders at 300×150 by default. Fall back to a sane size.
      const w = (img.naturalWidth  || 1024);
      const h = (img.naturalHeight || 1024);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      
      ctx.drawImage(img, 0, 0, w, h);
      return canvas;
    },
  });
})();
