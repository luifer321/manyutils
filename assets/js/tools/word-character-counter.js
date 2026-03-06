(function () {
  'use strict';

  var input = document.getElementById('wc-input');
  var clearBtn = document.getElementById('wc-clear-btn');
  var copyBtn = document.getElementById('wc-copy-btn');

  var charsEl = document.getElementById('wc-chars');
  var charsNoSpacesEl = document.getElementById('wc-chars-no-spaces');
  var wordsEl = document.getElementById('wc-words');
  var sentencesEl = document.getElementById('wc-sentences');
  var paragraphsEl = document.getElementById('wc-paragraphs');
  var avgWordEl = document.getElementById('wc-avg-word');
  var readTimeEl = document.getElementById('wc-read-time');
  var speakTimeEl = document.getElementById('wc-speak-time');

  function formatTime(minutes) {
    if (minutes < 1) {
      var seconds = Math.ceil(minutes * 60);
      return seconds + ' sec';
    }
    if (minutes < 60) {
      return Math.ceil(minutes) + ' min';
    }
    var hrs = Math.floor(minutes / 60);
    var mins = Math.ceil(minutes % 60);
    return hrs + ' hr ' + mins + ' min';
  }

  function updateStats() {
    var text = input.value;

    var chars = text.length;
    var charsNoSpaces = text.replace(/\s/g, '').length;

    var words = text.trim() === '' ? [] : text.trim().split(/\s+/);
    var wordCount = words.length;

    var sentenceMatches = text.match(/[.!?]+/g);
    var sentenceCount = sentenceMatches ? sentenceMatches.length : 0;

    var paragraphs = text.trim() === '' ? [] : text.trim().split(/\n\s*\n/);
    var paragraphCount = paragraphs.length;

    var avgLength = 0;
    if (wordCount > 0) {
      var totalLetters = words.reduce(function (sum, w) {
        return sum + w.replace(/[^a-zA-Z0-9]/g, '').length;
      }, 0);
      avgLength = (totalLetters / wordCount).toFixed(1);
    }

    var readMinutes = wordCount / 200;
    var speakMinutes = wordCount / 150;

    charsEl.textContent = typeof Utils !== 'undefined' ? Utils.formatNumber(chars) : chars;
    charsNoSpacesEl.textContent = typeof Utils !== 'undefined' ? Utils.formatNumber(charsNoSpaces) : charsNoSpaces;
    wordsEl.textContent = typeof Utils !== 'undefined' ? Utils.formatNumber(wordCount) : wordCount;
    sentencesEl.textContent = typeof Utils !== 'undefined' ? Utils.formatNumber(sentenceCount) : sentenceCount;
    paragraphsEl.textContent = typeof Utils !== 'undefined' ? Utils.formatNumber(paragraphCount) : paragraphCount;
    avgWordEl.textContent = avgLength;
    readTimeEl.textContent = wordCount === 0 ? '0 sec' : formatTime(readMinutes);
    speakTimeEl.textContent = wordCount === 0 ? '0 sec' : formatTime(speakMinutes);
  }

  input.addEventListener('input', updateStats);

  clearBtn.addEventListener('click', function () {
    input.value = '';
    updateStats();
    input.focus();
  });

  copyBtn.addEventListener('click', function () {
    var text = input.value;
    if (!text) return;
    if (typeof Utils !== 'undefined') {
      Utils.copyToClipboard(text);
      Utils.showToast('Text copied to clipboard!', 'success');
    } else {
      navigator.clipboard.writeText(text);
    }
  });

  updateStats();
})();
