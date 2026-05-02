(function () {
  'use strict';
  if (typeof ImageTool === 'undefined') return;

  ImageTool.create({
    prefix: 'imgconv',
    accept: 'image/webp',
    outputType: 'image/png',
    outputExt: 'png',
    filenameSuffix: '-converted',
    hasQuality: false,
    defaultQuality: 90,
  });
})();
