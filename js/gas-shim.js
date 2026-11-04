/* 讓原本 Apps Script 版的頁面（工作台、合約庫）不用改程式就能在平台裡跑：
 * 把 google.script.run.xxx() 轉成呼叫平台後端（由外層 index.html 的 PF 負責登入與傳送） */
(function () {
  var P = null;
  try { P = window.parent !== window && window.parent.PF; } catch (e) {}
  var pre = (document.currentScript && document.currentScript.getAttribute('data-prefix')) || '';
  if (!P) { // 直接打開模組頁：導回平台
    var mod = (document.currentScript && document.currentScript.getAttribute('data-module')) || '';
    location.replace('index.html' + (mod ? '#' + mod : ''));
    return;
  }
  window.__PLATFORM = true;
  function mk(ok, fail) {
    return new Proxy({}, {
      get: function (_, k) {
        if (k === 'withSuccessHandler') return function (f) { return mk(f, fail); };
        if (k === 'withFailureHandler') return function (f) { return mk(ok, f); };
        if (k === 'withUserObject') return function () { return mk(ok, fail); };
        return function () {
          var args = [].slice.call(arguments);
          P.call(pre + String(k), args).then(function (r) {
            if (pre + String(k) === 'ct_apiBoot' && r && r.me) {
              window.__ctProxy = !!r.me.depts;
              document.documentElement.classList.toggle('pf-view', r.me.role === 'view');
              document.documentElement.classList.toggle('pf-dept', !!r.me.depts);
            }
            if (ok) ok(r);
          }, function (e) { if (fail) fail(e); else console.error(e); });
        };
      }
    });
  }
  window.google = window.google || {};
  window.google.script = {
    get run() { return mk(null, null); },
    host: { close: function () {}, setHeight: function () {}, origin: location.origin }
  };
  // 合約庫：部門主管沒有 Drive 資料夾權限，改由後端開檔
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href*="drive.google.com/file/d/"]');
    if (!a || !window.__ctProxy) return;
    var m = a.href.match(/\/file\/d\/([\w-]+)/);
    if (!m) return;
    e.preventDefault();
    var w = window.open('', '_blank');
    if (w) w.document.write('<p style="font:15px sans-serif;padding:30px;color:#555">檔案載入中…</p>');
    P.call('ct_apiGetFile', [m[1]]).then(function (f) {
      var bin = atob(f.b64), u8 = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      var url = URL.createObjectURL(new Blob([u8], { type: f.mime || 'application/octet-stream' }));
      if (w) w.location.href = url; else window.open(url, '_blank');
    }, function (err) {
      if (w) w.document.body.innerHTML = '<p style="font:15px sans-serif;padding:30px;color:#c0392b">無法開啟：' + String(err && err.message || err).replace(/</g, '&lt;') + '</p>';
    });
  }, true);
})();
