// Klien REST ke GAS: POST text/plain (tanpa preflight), dedupe baca in-flight, SWR localStorage.
const Sesi = {
  get t() { try { return localStorage.getItem('sa_t') || ''; } catch (e) { return ''; } },
  set(t) { try { t ? localStorage.setItem('sa_t', t) : localStorage.removeItem('sa_t'); } catch (e) {} }
};
const READ = /\.(list|dashboard|rekap|riwayat|config|stats)$/, inflight = {};
let epoch = 0;
const GAS_RE = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]{20,}\/exec$/;
async function apiRun(action, data) {
  if (window.DEMO) { await new Promise(r => setTimeout(r, 120)); const f = DemoData[action]; return f ? { success: true, data: f(data || {}), ms: 12 } : { success: true, data: {}, message: 'Mode demo — tidak disimpan.' }; }
  const raw = String(APP_CONFIG.GAS_URL || '').trim(), url = raw.replace(/\/macros\/u\/\d+\/s\//, '/macros/s/');
  if (/GANTI|XXXX/.test(url)) return { success: false, message: 'Konfigurasi belum lengkap: isi GAS_URL di js/config.js dengan URL deployment (berakhiran /exec).' };
  if (!GAS_RE.test(url)) return { success: false, message: 'GAS_URL di js/config.js tidak valid. Salin ulang dari Deploy → Kelola deployment (bentuk: https://script.google.com/macros/s/…/exec), bukan URL editor atau /dev.' };
  let r;
  try { r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token: Sesi.t, data: data || {} }) }); }
  catch (e) { return { success: false, message: 'Tidak bisa terhubung ke server. Periksa internet, lalu pastikan deployment memakai akses "Siapa saja" (bukan "Hanya saya").' }; }
  try { const j = await r.json(); if (j.code === 'SESI') { Sesi.set(''); if (window.onSesiHabis) window.onSesiHabis(); } return j; }
  catch (e) { return { success: false, message: 'Server membalas halaman Google, bukan data. URL deployment salah atau sudah dihapus. Tes: buka URL /exec di tab baru (jendela Incognito) — harus tampil {"success":true,"app":"SI-ABSEN"}.' }; }
}
function api(action, data) {
  if (!READ.test(action)) { epoch++; return apiRun(action, data); }
  const k = epoch + '|' + action + '|' + Sesi.t + '|' + JSON.stringify(data || {});
  if (inflight[k]) return inflight[k];
  const p = apiRun(action, data); inflight[k] = p; p.finally(() => delete inflight[k]); return p;
}
// Render dari cache lokal dulu, lalu segarkan dari server.
async function apiSWR(action, data, render) {
  if (window.DEMO) { const r = await api(action, data); if (r.success) render(r.data, false); return r; }
  const ck = 'sa_c_' + action + JSON.stringify(data || {});
  try { const c = JSON.parse(localStorage.getItem(ck) || 'null'); if (c) render(c, true); } catch (e) {}
  const r = await api(action, data);
  if (r.success) { try { localStorage.setItem(ck, JSON.stringify(r.data)); } catch (e) {} render(r.data, false); }
  return r;
}
// Panaskan server (cache) saat halaman login dibuka.
function warmUp() { try { fetch(APP_CONFIG.GAS_URL + '?w=1', { mode: 'no-cors' }); } catch (e) {} }
