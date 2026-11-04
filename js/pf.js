/* SWAG 行政平台：登入與後端呼叫
 * - 用 Google Identity Services 取得公司帳號的 ID Token，交給後端驗證後換成工作階段代碼（6 小時，使用中自動延長）
 * - 所有模組（含 iframe 裡的工作台、合約庫）都透過 PF.call(函式名稱, 參數) 呼叫後端 */
window.PF = (function () {
  const C = window.PF_CONFIG || {};
  const KEY = 'pf_session_v1';
  let session = '';
  try { session = localStorage.getItem(KEY) || ''; } catch (e) {}
  let waiting = null;         // 等待重新登入的 Promise
  let onNeedLogin = null;     // 由畫面註冊：顯示登入畫面
  let gisReady = null;
  let idTok = null;           // {token, nonce, exp}：最近一次 Google 登入（給設備資產的 Supabase 用）
  let rawNonce = '';
  let credHandler = null;
  const tokWaiters = [];
  async function newNonce() {
    const a = new Uint8Array(16); crypto.getRandomValues(a);
    rawNonce = Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
    const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawNonce));
    return Array.from(new Uint8Array(h), b => b.toString(16).padStart(2, '0')).join('');
  }
  function jwtExp(t) { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp || 0; } catch (e) { return 0; } }
  function onCred(r) {
    idTok = {token: r.credential, nonce: rawNonce, exp: jwtExp(r.credential)};
    tokWaiters.splice(0).forEach(f => f(idTok));
    if (credHandler) credHandler(r.credential);
  }
  async function initGis() {
    await loadGis();
    google.accounts.id.initialize({
      client_id: C.CLIENT_ID, callback: onCred, nonce: await newNonce(),
      auto_select: true, cancel_on_tap_outside: false, hd: C.DOMAIN, ux_mode: 'popup', itp_support: true
    });
  }
  const fresh = () => idTok && idTok.exp * 1000 - Date.now() > 120000 ? idTok : null;
  /** 給設備資產用的 Google ID Token。interactive=false：只試自動登入（約 5 秒）；true：必要時跳出登入畫面 */
  async function getIdToken(interactive) {
    if (fresh()) return fresh();
    const wait = new Promise(res => tokWaiters.push(res));
    if (interactive) {
      setSession('');               // 重新走一次平台登入，順便更新工作階段
      needLogin().catch(() => {});
      return wait;
    }
    try { await initGis(); google.accounts.id.prompt(); } catch (e) { return null; }
    return Promise.race([wait, new Promise(res => setTimeout(() => res(null), 5000))]);
  }

  async function post(body) {
    let r;
    try {
      r = await fetch(C.API_URL, {method: 'POST', body: JSON.stringify(body), headers: {'Content-Type': 'text/plain;charset=utf-8'}});
    } catch (e) { throw new Error('連不上伺服器，請檢查網路後再試一次'); }
    const t = await r.text();
    try { return JSON.parse(t); } catch (e) {
      if (/<html/i.test(t)) throw new Error('後端回應不是資料（請確認 Apps Script 部署的存取權是「所有人」並已部署新版本）');
      throw new Error('後端回應格式錯誤');
    }
  }

  function setSession(s) {
    session = s || '';
    try { s ? localStorage.setItem(KEY, s) : localStorage.removeItem(KEY); } catch (e) {}
  }

  function needLogin() {
    if (!waiting) {
      waiting = new Promise((resolve, reject) => {
        if (onNeedLogin) onNeedLogin(resolve, reject); else reject(new Error('請重新登入'));
      }).finally(() => { waiting = null; });
    }
    return waiting;
  }

  async function call(fn, args) {
    if (!session) await needLogin();
    let j = await post({fn, args: args || [], s: session});
    if (!j.ok && j.auth) {
      setSession('');
      await needLogin();
      j = await post({fn, args: args || [], s: session});
    }
    if (!j.ok) throw new Error(j.error || '發生錯誤');
    return j.data;
  }

  /** 用 Google 的 ID Token 登入；回傳 {me} 或 {denied, email} */
  async function loginWithToken(idToken) {
    const j = await post({fn: 'pf_login', args: [idToken]});
    if (!j.ok) throw new Error(j.error || '登入失敗');
    if (j.data.denied) return j.data;
    setSession(j.data.session);
    return j.data;
  }

  function loadGis() {
    if (gisReady) return gisReady;
    gisReady = new Promise((resolve, reject) => {
      if (window.google && google.accounts && google.accounts.id) return resolve();
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = () => resolve(); s.onerror = () => reject(new Error('無法載入 Google 登入元件'));
      document.head.appendChild(s);
    });
    return gisReady;
  }

  /** 在 el 放 Google 登入按鈕；登入成功呼叫 onCredential(idToken) */
  async function renderButton(el, onCredential) {
    credHandler = onCredential;
    await initGis();
    el.innerHTML = '';
    google.accounts.id.renderButton(el, {theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', locale: 'zh-TW', width: 280});
    try { google.accounts.id.prompt(); } catch (e) {}
  }

  function logout() {
    const s = session;
    setSession('');
    if (s) post({fn: 'pf_apiLogout', args: [], s}).catch(() => {});
    idTok = null;
    try { google.accounts.id.disableAutoSelect(); } catch (e) {}
    // 一起登出設備資產（Supabase 的登入資料存在同一個網域）
    try { Object.keys(localStorage).filter(k => /^sb-.*-auth-token/.test(k)).forEach(k => localStorage.removeItem(k)); } catch (e) {}
  }

  return {
    call, loginWithToken, renderButton, logout, getIdToken,
    hasSession: () => !!session,
    setLoginHandler: f => { onNeedLogin = f; }
  };
})();
