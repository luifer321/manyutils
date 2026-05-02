(function () {
  'use strict';
  if (typeof ImageTool === 'undefined') return;

  ImageTool.create({
    prefix: 'imgconv',
    accept: 'image/jpeg',
    outputType: 'image/webp',
    outputExt: 'webp',
    filenameSuffix: '-converted',
    hasQuality: true,
    defaultQuality: 90,
  });
})();
