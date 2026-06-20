(function () {
  var s = document.currentScript;
  var key = s && s.dataset.key;
  if (!key || navigator.doNotTrack === '1') return;

  var base = new URL(s.src).origin + '/api/cbf/analytics/track';

  function send(path) {
    var p = new URLSearchParams({ key: key, path: path, ref: document.referrer, sw: screen.width });
    navigator.sendBeacon(base + '?' + p);
  }

  send(location.pathname);

  var orig = history.pushState;
  history.pushState = function () { orig.apply(this, arguments); send(location.pathname); };
  window.addEventListener('popstate', function () { send(location.pathname); });
})();
