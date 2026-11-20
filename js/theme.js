/* SWAG 行政平台：配色（平台、工作台、合約庫共用）
 * 選好的配色存在這台電腦（localStorage: pf_theme），iframe 裡的頁面會跟著換 */
(function () {
  var THEMES = [
    {id: 'swagteal', n: 'SWAG 品牌色', pri: '#00A393', pink: '#00CDB8', side: '#0B0F10', side2: '#151B1C'},
    {id: 'swag', n: '粉紫', pri: '#6B4EFF', pink: '#FF4D8D', side: '#141128', side2: '#1D1838'},
    {id: 'ocean', n: '海洋藍', pri: '#2563EB', pink: '#06B6D4', side: '#0B1B33', side2: '#10284A'},
    {id: 'forest', n: '森林綠', pri: '#059669', pink: '#65A30D', side: '#0C1F17', side2: '#123024'},
    {id: 'sunset', n: '夕陽橘', pri: '#EA580C', pink: '#F43F5E', side: '#22110A', side2: '#331A10'},
    {id: 'berry', n: '莓果紅', pri: '#BE185D', pink: '#F97316', side: '#1F0A15', side2: '#2E0F1F'},
    {id: 'mono', n: '沉穩灰', pri: '#334155', pink: '#64748B', side: '#0F172A', side2: '#1E293B'}
  ];
  var KEY = 'pf_theme';
  function load() {
    try { var t = JSON.parse(localStorage.getItem(KEY) || 'null'); if (t && t.pri) return t; } catch (e) {}
    return THEMES[0];
  }
  function apply(t) {
    t = t || load();
    var r = document.documentElement.style;
    r.setProperty('--pri', t.pri);
    r.setProperty('--pink', t.pink);
    r.setProperty('--side', t.side);
    r.setProperty('--side2', t.side2);
    r.setProperty('--grad', 'linear-gradient(135deg,' + t.pink + ' 0%,' + t.pri + ' 100%)');
  }
  function save(t) {
    try { localStorage.setItem(KEY, JSON.stringify(t)); } catch (e) {}
    apply(t);
    // 同一個視窗裡的 iframe（工作台、合約庫）立即跟著換
    try { [].forEach.call(document.querySelectorAll('iframe'), function (f) { try { f.contentWindow.SWAG_THEME && f.contentWindow.SWAG_THEME.apply(t); } catch (e) {} }); } catch (e) {}
  }
  apply();
  window.addEventListener('storage', function (e) { if (e.key === KEY) apply(); });
  window.SWAG_THEME = {list: THEMES, load: load, apply: apply, save: save};
})();
