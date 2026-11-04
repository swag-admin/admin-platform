/* SWAG 行政平台設定：部署後只要改這兩行 */
window.PF_CONFIG = {
  // Apps Script「部署 › 網頁應用程式」的網址（/exec 結尾）
  API_URL: 'https://script.google.com/macros/s/AKfycbxNVoD5P9vZy7j_DGvl34nnZ6jU5XiTJJrANK1QniLEAEs-EZiu2vzTNO978Z8d9yaO/exec',  // Google Cloud「OAuth 2.0 用戶端 ID」（網頁應用程式，已授權的 JavaScript 來源填 https://swag-admin.github.io）
  CLIENT_ID: '232346306074-il6ggn2dcuioh3tng0orev3b8hnoagrv.apps.googleusercontent.com',
  DOMAIN: 'swag.live'
};
/* 設備資產（Supabase）：和 asset-system/config.js 的值一樣 */
window.PF_CONFIG.ASSET_URL = '../asset-system/';
window.PF_CONFIG.SUPABASE_URL = 'https://blfzqritcaxojgeirfgd.supabase.co';
window.PF_CONFIG.SUPABASE_ANON_KEY = 'sb_publishable_KkZN60L0s7yHVq13Kc0SjA_nY4Rn0p1';
