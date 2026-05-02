(function () {
  'use strict';
  if (typeof ImageTool === 'undefined') return;

  ImageTool.create({
    prefix: 'imgconv',
    accept: 'image/png',
    outputType: 'image/jpeg',
    outputExt: 'jpg',
    filenameSuffix: '-converted',
    hasQuality: true,
    defaultQuality: 90,
    fillBackground: '#ffffff',
  });
})();
