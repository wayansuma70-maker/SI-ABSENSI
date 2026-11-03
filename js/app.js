// SI-ABSEN SMPN 3 Kediri — antarmuka (vanilla JS). Semua teks dinamis di-escape.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)], sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bd = s => `<span class="bd ${esc(s)}">${esc(s)}</span>`;
function toast(m, t) { const e = $('#toast'); e.textContent = m; e.className = 'show ' + (t || ''); clearTimeout(toast.h); toast.h = setTimeout(() => e.className = '', 3200); }
const ok = (r, m) => { if (!r.success) { toast(r.message || 'Terjadi kesalahan.', 'err'); return false; } if (m !== false) toast(m || r.message || 'Berhasil.'); return true; };
let me = null, timer = null;
window.onSesiHabis = () => { me = null; login(); };

// ---------- wajah (face-api.js, berjalan di browser; hanya vektor 128 angka dikirim) ----------
const Face = {
  ok: false,
  async load() { if (this.ok) return;
    await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.js'; s.onload = res; s.onerror = () => rej(new Error('Gagal memuat pustaka wajah')); document.head.appendChild(s); });
    const u = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/';
    await Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri(u), faceapi.nets.faceLandmark68Net.loadFromUri(u), faceapi.nets.faceRecognitionNet.loadFromUri(u)]); this.ok = true; },
  async cam(v) { const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } }); v.srcObject = st; await v.play(); return st; },
  async desc(v) { const r = await faceapi.detectSingleFace(v, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: .5 })).withFaceLandmarks().withFaceDescriptor(); if (!r) return null; const E = p => (Math.hypot(p[1].x - p[5].x, p[1].y - p[5].y) + Math.hypot(p[2].x - p[4].x, p[2].y - p[4].y)) / (2 * Math.hypot(p[0].x - p[3].x, p[0].y - p[3].y)); this.ear = (E(r.landmarks.getLeftEye()) + E(r.landmarks.getRightEye())) / 2; return Array.from(r.descriptor).map(x => +x.toFixed(4)); }
};

// ---------- login ----------
async function login() {
  clearInterval(timer); warmUp();
  $('#app').innerHTML = `<div class="login"><div class="card"><div class="brand"><div class="logo">SI</div><div><h2>SI-ABSEN</h2><div class="mono">SMP NEGERI 3 KEDIRI</div></div></div>
  <div class="tabs"><button class="on" data-t="s">Staf / Guru</button><button data-t="w">Siswa (NIS)</button></div>
  <div id="ts"><p class="mono">Masuk dengan akun Google sekolah.</p><div id="gbtn"></div><p id="gmsg" class="mono"></p>
  <details><summary class="mono">Akses darurat</summary><label>Pengguna</label><input id="du" autocomplete="off"><label>Kata sandi</label><input id="dp" type="password" autocomplete="off"><p><button class="p" id="bd">Masuk darurat</button></p></details></div>
  <div id="tw" hidden><label>NIS</label><input id="nis" inputmode="numeric" autocomplete="username"><label>PIN</label><input id="pin" type="password" inputmode="numeric" autocomplete="current-password"><p><button class="p" id="bs" style="width:100%">Masuk Siswa</button></p></div>
  <p class="mono" style="margin:12px 0 0"><a href="#pos" id="lp">Mode Pos Absensi →</a></p></div></div>`;
  $$('.tabs button').forEach(b => b.onclick = () => { $$('.tabs button').forEach(x => x.classList.toggle('on', x === b)); $('#ts').hidden = b.dataset.t !== 's'; $('#tw').hidden = b.dataset.t !== 'w'; });
  const done = r => { if (!ok(r, false)) return; Sesi.set(r.data.token); me = r.data.me; shell(); };
  $('#bd').onclick = async () => done(await api('auth.darurat', { username: $('#du').value, password: $('#dp').value }));
  $('#bs').onclick = async () => done(await api('auth.siswa', { nis: $('#nis').value, pin: $('#pin').value }));
  $('#lp').onclick = e => { e.preventDefault(); posMode(); };
  const c = await api('auth.config');
  if (c.success && c.data.googleClientId) { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.onload = () => { google.accounts.id.initialize({ client_id: c.data.googleClientId, callback: async x => done(await api('auth.google', { idToken: x.credential })) }); google.accounts.id.renderButton($('#gbtn'), { theme: 'outline', size: 'large', width: 300 }); }; document.head.appendChild(s); }
  else $('#gmsg').textContent = c.success ? 'Google belum dikonfigurasi — gunakan akses darurat.' : (c.message || '');
}

// ---------- shell ----------
const MENU = [
  ['dashboard', 'Dashboard', 'admin,guru,piket', pgDash], ['riwayat', 'Riwayat', 'siswa', pgRiwayat], ['scan', 'Scan Wajah', 'admin,siswa', pgScan],
  ['rekap', 'Rekap', 'admin,guru,piket', pgRekap], ['siswa', 'Data Siswa', 'admin,guru', pgSiswa], ['izin', 'Izin / Sakit', 'admin,guru', pgIzin], ['crm', 'CRM & WA', 'admin', pgCrm], ['master', 'Master Data', 'admin', pgMaster]
];
function shell() {
  const mn = MENU.filter(m => m[2].split(',').includes(me.role));
  $('#app').innerHTML = `<div class="shell"><aside><div class="brand"><div class="logo">SI</div><div><b>SI-ABSEN</b><div class="mono">SMPN 3 KEDIRI</div></div></div><nav>${mn.map(m => `<a href="#${m[0]}" data-p="${m[0]}"><span class="nm">▪</span>${esc(m[1])}</a>`).join('')}</nav></aside>
  <main><div class="top"><h1 id="ttl"></h1><div class="row"><span class="mono">${esc(me.nama || me.id)} · ${esc(me.role)}</span><button id="bb" title="Tampilkan/sembunyikan burung">🐦</button><button id="lo">Keluar</button></div></div><div id="pg"></div></main></div>`;
  $('#bb').onclick = () => toast(Bird.toggle() ? 'Burung aktif 🐦' : 'Burung disembunyikan');
  $('#lo').onclick = () => { Sesi.set(''); me = null; login(); };
  const nav = () => { clearInterval(timer); const id = (location.hash || '').slice(1), m = mn.find(x => x[0] === id) || mn[0];
    $$('nav a').forEach(a => a.classList.toggle('on', a.dataset.p === m[0])); $('#ttl').textContent = m[1]; m[3]($('#pg')); };
  onhashchange = nav; nav();
}
const kpi = (l, v, p) => `<div class="card kpi"><div class="lb">${l}</div><div class="v">${v}</div>${p != null ? `<div class="bar"><i style="width:${p}%"></i></div>` : ''}</div>`;
const tbl = (h, rows, empty) => `<div class="tw"><table><thead><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.join('') : `<tr><td colspan="${h.length}">${empty || 'Belum ada data.'}</td></tr>`}</tbody></table></div>`;

// ---------- dashboard ----------
function donut(p) { const t = p.reduce((a, b) => a + b[1], 0) || 1; let o = 25; const cols = ['#0F172A', '#64748B', '#94A3B8', '#E2E8F0'];
  return `<svg viewBox="0 0 36 36" width="170" height="170" role="img" aria-label="Komposisi kehadiran"><circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" stroke-width="5"/>${p.map((x, i) => { const l = x[1] / t * 100, s = `<circle cx="18" cy="18" r="15.9" fill="none" stroke="${cols[i]}" stroke-width="5" stroke-dasharray="${l} ${100 - l}" stroke-dashoffset="${o}"/>`; o -= l; return s; }).join('')}</svg>`; }
function pgDash(m) {
  const draw = d => { const pr = d.total ? Math.round((d.hadir + d.terlambat) / d.total * 100) : 0;
    m.innerHTML = `<div class="grid g4">${kpi('Total siswa', d.total)}${kpi('Hadir', d.hadir, d.total ? d.hadir / d.total * 100 : 0)}${kpi('Terlambat', d.terlambat, d.total ? d.terlambat / d.total * 100 : 0)}${kpi('Belum scan', d.belum, d.total ? d.belum / d.total * 100 : 0)}</div>
    <div class="grid g2"><div class="card"><h3>Komposisi hari ini · ${esc(d.tanggal)}</h3><div class="row"><div>${donut([['Hadir', d.hadir], ['Terlambat', d.terlambat], ['Sakit/Izin', d.sakit + d.izin], ['Belum', d.belum]])}</div><div><div class="kpi"><div class="v">${pr}%</div><div class="lb">Kehadiran</div></div><p class="mono">■ Hadir ${d.hadir}<br>■ Terlambat ${d.terlambat}<br>■ Sakit/Izin ${d.sakit + d.izin}<br>■ Belum ${d.belum}</p></div></div></div>
    <div class="card"><h3>Scan terbaru</h3>${tbl(['Jam', 'Nama', 'Kelas', 'Status'], d.terbaru.map(r => `<tr><td class="mono">${esc(r.jam)}</td><td>${esc(r.nama)}</td><td>${esc(r.kelas)}</td><td>${bd(r.status)}</td></tr>`))}</div></div>
    <div class="card"><h3>Siswa belum scan (${d.belum})</h3>${tbl(['NIS', 'Nama', 'Kelas', 'Wali', ''], d.belumList.map(r => `<tr><td class="mono">${esc(r.nis)}</td><td>${esc(r.nama)}</td><td>${esc(r.kelas)}</td><td>${esc(r.wali)}</td><td>${r.wa ? `<a href="https://wa.me/62${esc(r.wa.slice(1))}" target="_blank" rel="noopener">Hubungi ortu</a>` : '-'}</td></tr>`), 'Semua siswa sudah scan 🎉')}</div>`; };
  const load = () => { if (!document.hidden && $('#pg') === m) apiSWR('absen.dashboard', {}, draw); }; load(); timer = setInterval(load, 30000);
}

// ---------- scan wajah ----------
let posTok = ''; try { posTok = localStorage.getItem('sa_pos') || ''; } catch (e) {}
function pgScan(m, pos) {
  m.innerHTML = `<div class="grid g2"><div class="card"><div class="ph"><video id="v" playsinline muted></video></div><p class="mono" id="st">Kamera belum aktif.</p><div class="row"><button class="p" id="go">Mulai Scan</button></div></div>
  <div class="card"><h3>Hasil</h3><div id="rs" class="res">Menunggu wajah…</div><p class="mono">Lihat kamera. Pengenalan berjalan di perangkat; hanya vektor wajah yang dikirim, bukan foto.</p></div></div>`;
  const v = $('#v'); let st, run = false, low = false, blink = 0;
  $('#go').onclick = async () => { try { $('#go').disabled = true; $('#st').textContent = 'Memuat model wajah…'; await Face.load(); st = await Face.cam(v); run = true; $('#st').textContent = 'Memindai…';
    while (run && document.body.contains(v)) { const d = await Face.desc(v); if (!d) { await sleep(120); continue; } const e = Face.ear; if (e < .21) low = true; else if (e > .26 && low) { low = false; blink = Date.now(); }
      if (Date.now() - blink > 8000) { $('#st').textContent = 'Kedipkan mata untuk verifikasi…'; await sleep(30); continue; } blink = 0;
      const r = await api('absen.scan', { vektor: d, live: true, posToken: pos ? posTok : undefined }), b = $('#rs'); if (!b) break;
      b.className = 'res ' + (r.success ? 'ok' : 'bad'); b.innerHTML = r.success ? `${bd(r.data.status)} ${esc(r.data.nama)} (${esc(r.data.kelas)}) · ${esc(String(r.data.jam).slice(0, 5))}` : esc(r.message); await sleep(r.success ? 4000 : 1500); }
  } catch (e) { toast(e.message || 'Kamera tidak bisa diakses.', 'err'); $('#go').disabled = false; } if (st) st.getTracks().forEach(t => t.stop()); };
  new MutationObserver((_, o) => { if (!document.body.contains(v)) { run = false; if (st) st.getTracks().forEach(t => t.stop()); o.disconnect(); } }).observe(document.body, { childList: true, subtree: true });
}
function posMode() { if (!posTok) { const t = prompt('Tempel token pos absensi (dari log setup):'); if (!t) return; posTok = t.trim(); try { localStorage.setItem('sa_pos', posTok); } catch (e) {} }
  $('#app').innerHTML = `<main><div class="top"><h1>Pos Absensi</h1><button id="x">Keluar mode pos</button></div><div id="pg"></div></main>`; $('#x').onclick = () => { try { localStorage.removeItem('sa_pos'); } catch (e) {} posTok = ''; login(); }; pgScan($('#pg'), true); }

// ---------- rekap, riwayat ----------
function pgRekap(m) {
  const t = new Date().toISOString().slice(0, 10); m.innerHTML = `<div class="card"><div class="row"><div class="f"><label>Dari</label><input type="date" id="d1" value="${t.slice(0, 8)}01"></div><div class="f"><label>Sampai</label><input type="date" id="d2" value="${t}"></div><div class="f"><label>Kelas</label><input id="kl" placeholder="mis. 7-A"></div><button class="p" id="ap" style="margin-top:22px">Terapkan</button><button id="cs" style="margin-top:22px">Unduh CSV</button></div></div><div id="rk"></div>`; let rows = [];
  const go = async () => { const r = await api('absen.rekap', { dari: $('#d1').value, sampai: $('#d2').value, kelas: $('#kl').value.trim() }); if (!ok(r, false)) return; rows = r.data.rows;
    $('#rk').innerHTML = `<p class="mono">${r.data.hariSekolah} hari sekolah tercatat</p>` + tbl(['NIS', 'Nama', 'Kelas', 'H', 'T', 'S', 'I', 'A', '%'], rows.map(x => `<tr><td class="mono">${esc(x.nis)}</td><td>${esc(x.nama)}</td><td>${esc(x.kelas)}</td><td>${x.hadir}</td><td>${x.terlambat}</td><td>${x.sakit}</td><td>${x.izin}</td><td>${x.alpa}</td><td><b>${x.persen}%</b></td></tr>`)); };
  $('#ap').onclick = go; $('#cs').onclick = () => { const c = [['NIS', 'Nama', 'Kelas', 'Hadir', 'Terlambat', 'Sakit', 'Izin', 'Alpa', 'Persen'], ...rows.map(x => [x.nis, x.nama, x.kelas, x.hadir, x.terlambat, x.sakit, x.izin, x.alpa, x.persen])].map(r => r.map(v => '"' + String(v).replace(/"/g, '""').replace(/^([=+\-@])/, "'$1") + '"').join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([c], { type: 'text/csv' })); a.download = 'rekap-absensi.csv'; a.click(); }; go();
}
async function pgRiwayat(m) {
  m.innerHTML = `<div class="card"><label>Bulan</label><input type="month" id="bl" value="${new Date().toISOString().slice(0, 7)}"></div><div id="rw"></div>`;
  const go = async () => { const r = await api('siswa.riwayat', { bulan: $('#bl').value }); if (!ok(r, false)) return; const s = r.data.ringkas;
    $('#rw').innerHTML = `<div class="grid g4">${kpi('Hadir', s.Hadir)}${kpi('Terlambat', s.Terlambat)}${kpi('Sakit', s.Sakit)}${kpi('Izin', s.Izin)}</div>` + tbl(['Tanggal', 'Jam', 'Status'], r.data.log.map(l => `<tr><td class="mono">${esc(l.tanggal)}</td><td class="mono">${esc(l.jam)}</td><td>${bd(l.status)}</td></tr>`)); };
  $('#bl').onchange = go; go();
}

// ---------- data siswa, pendaftaran wajah ----------
function pgSiswa(m) {
  const adm = me.role === 'admin'; m.innerHTML = `<div class="row"><div class="f"><input id="q" placeholder="Cari nama / NIS…"></div>${adm ? '<button class="p" id="add">+ Tambah siswa</button><button id="mg">Impor data lama</button>' : ''}</div><div id="ls" style="margin-top:12px"></div>`; let data = [];
  const draw = () => { const q = $('#q').value.toLowerCase(); $('#ls').innerHTML = tbl(['NIS', 'Nama', 'Kelas', 'WA ortu', 'Wajah', ''], data.filter(x => (x.nama + x.nis).toLowerCase().includes(q)).slice(0, 200).map(x => `<tr><td class="mono">${esc(x.nis)}</td><td>${esc(x.nama)}</td><td>${esc(x.kelas)}</td><td class="mono">${esc(x.wa)}</td><td>${x.wajah ? '✓' : '—'}</td><td>${adm ? `<button data-e="${esc(x.nis)}">Ubah</button> <button data-f="${esc(x.nis)}">Daftar wajah</button>` : ''}</td></tr>`)); };
  const load = async () => { const r = await api('siswa.list'); if (ok(r, false)) { data = r.data; draw(); } }; $('#q').oninput = draw; load();
  $('#ls').onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.e) form(data.find(x => x.nis === b.dataset.e)); if (b.dataset.f) enroll(b.dataset.f); };
  if (adm) { $('#add').onclick = () => form({}); $('#mg').onclick = () => migrasi(load); }
  function form(s) { const d = document.createElement('dialog'); d.innerHTML = `<h3>${s.nis ? 'Ubah' : 'Tambah'} siswa</h3><label>NIS</label><input id="fn" value="${esc(s.nis)}" ${s.nis ? 'readonly' : ''}><label>Nama</label><input id="fm" value="${esc(s.nama)}"><label>Kelas</label><input id="fk" value="${esc(s.kelas)}"><label>Nama wali</label><input id="fw" value="${esc(s.wali)}"><label>WhatsApp wali (08…)</label><input id="fa" value="${esc(s.wa)}">${s.nis ? '<label class="sw"><input type="checkbox" id="fr"> Reset PIN</label>' : ''}<p class="row"><button class="p" id="fs">Simpan</button><button id="fc">Batal</button></p>`; document.body.appendChild(d); d.showModal(); $('#fc', d).onclick = () => d.remove();
    $('#fs', d).onclick = async () => { const r = await api('siswa.save', { nis: $('#fn', d).value, nama: $('#fm', d).value, kelas: $('#fk', d).value.trim(), wali: $('#fw', d).value, wa: $('#fa', d).value, resetPin: $('#fr', d) && $('#fr', d).checked }); if (!ok(r)) return; d.remove(); if (r.data.pinBaru) alert('PIN siswa (catat & serahkan, tidak ditampilkan lagi): ' + r.data.pinBaru); load(); }; }
  function migrasi(done) { const d = document.createElement('dialog'); d.innerHTML = `<h3>Impor data siswa lama</h3><p class="mono">Sheet pertama dibaca (hanya baca). Kolom: NIS, Nama, Kelas, Wali, WA. Akun Google harus sama.</p><label>URL / ID spreadsheet lama</label><input id="ms"><pre id="mr" class="mono"></pre><p class="row"><button id="mp">Pindai (dry-run)</button><button class="p" id="mj">Jalankan</button><button id="mc">Tutup</button></p>`; document.body.appendChild(d); d.showModal(); $('#mc', d).onclick = () => d.remove();
    const run = async dry => { const r = await api('migrasi.jalankan', { source: $('#ms', d).value, dry }); if (ok(r, false)) { $('#mr', d).textContent = JSON.stringify(r.data.laporan) + '\nDari: ' + r.data.sumber + (dry ? '\n(dry-run, belum menulis)' : '\nSelesai.'); if (!dry) done(); } }; $('#mp', d).onclick = () => run(true); $('#mj', d).onclick = () => confirm('Jalankan impor?') && run(false); }
  function enroll(nis) { const d = document.createElement('dialog'); d.innerHTML = `<h3>Daftarkan wajah · ${esc(nis)}</h3><div class="ph"><video id="ev" playsinline muted></video></div><label class="sw"><input type="checkbox" id="ek"> Persetujuan tertulis orang tua sudah tercatat</label><p class="mono" id="es"></p><p class="row"><button class="p" id="eg">Ambil & simpan</button><button id="ec">Tutup</button></p>`; document.body.appendChild(d); d.showModal(); let st; const stop = () => { if (st) st.getTracks().forEach(t => t.stop()); d.remove(); }; $('#ec', d).onclick = stop;
    $('#eg', d).onclick = async () => { if (!$('#ek', d).checked) return toast('Centang persetujuan orang tua dulu.', 'err'); try { $('#eg', d).disabled = true; $('#es', d).textContent = 'Memuat model…'; await Face.load(); st = await Face.cam($('#ev', d)); const ds = [];
      for (let i = 0; i < 12 && ds.length < 3; i++) { const x = await Face.desc($('#ev', d)); if (x) { ds.push(x); $('#es', d).textContent = 'Sampel ' + ds.length + '/3 — gerakkan kepala sedikit'; await sleep(700); } else await sleep(400); }
      if (ds.length < 3) { $('#es', d).textContent = 'Wajah tidak terdeteksi. Coba lagi.'; $('#eg', d).disabled = false; return; }
      const avg = ds[0].map((_, i) => +((ds[0][i] + ds[1][i] + ds[2][i]) / 3).toFixed(4)), r = await api('wajah.simpan', { nis, vektor: avg, persetujuan: true }); if (ok(r)) { stop(); load(); } else $('#eg', d).disabled = false; } catch (e) { toast(e.message, 'err'); $('#eg', d).disabled = false; } }; }
}
async function pgIzin(m) {
  const r = await api('siswa.list'); if (!ok(r, false)) return; const opt = r.data.map(s => `<option value="${esc(s.nis)}">${esc(s.nama)} (${esc(s.kelas)})</option>`).join('');
  m.innerHTML = `<div class="card" style="max-width:520px"><label>Siswa</label><select id="zs">${opt}</select><label>Jenis</label><select id="zj"><option>Sakit</option><option>Izin</option></select><label>Tanggal</label><input type="date" id="zt" value="${new Date().toISOString().slice(0, 10)}"><label>Keterangan</label><textarea id="zk" rows="3"></textarea><label>Lampiran surat (JPG/PNG/PDF, maks 1,5 MB)</label><input type="file" id="zf" accept="image/jpeg,image/png,application/pdf"><p><button class="p" id="zb">Catat</button></p></div>`;
  $('#zb').onclick = async () => { let file; const f = $('#zf').files[0]; if (f) { if (f.size > 1.5e6) return toast('Berkas maksimal 1,5 MB.', 'err'); file = { tipe: f.type, b64: await new Promise(r => { const x = new FileReader(); x.onload = () => r(String(x.result).split(',')[1]); x.readAsDataURL(f); }) }; }
    $('#zb').disabled = true; const x = await api('izin.simpan', { nis: $('#zs').value, jenis: $('#zj').value, tanggal: $('#zt').value, keterangan: $('#zk').value, file }); $('#zb').disabled = false; if (ok(x)) { $('#zk').value = ''; $('#zf').value = ''; } };
}

// ---------- CRM & notifikasi WhatsApp ----------
async function pgCrm(m) {
  m.innerHTML = `<div id="ks" class="grid g4"></div><div class="grid g2"><div class="card"><h3>Kontak wali</h3><div class="row"><div class="f"><input id="cq" placeholder="Cari nama / WA…"></div><button id="dw">📱 Deteksi nomor WA</button></div><div id="cl" style="margin-top:10px"></div></div>
  <div><div class="card"><h3>Blast WhatsApp</h3><label>Pesan (pakai {nama} {wali} {kelas})</label><textarea id="bp" rows="4" placeholder="Assalamu'alaikum {wali}, …"></textarea><p class="mono">Dikirim bertahap tiap menit ke wali (WA valid, belum opt-out, tanpa nomor ganda).</p><button class="p" id="bs">Kirim ke semua kontak</button></div>
  <div class="card" id="cf"></div></div></div>`;
  const stats = async () => { const r = await api('crm.stats'); if (r.success) $('#ks').innerHTML = kpi('Kontak', r.data.total) + kpi('WA valid', r.data.waValid) + kpi('Tanpa WA', r.data.tanpaWA) + kpi('Opt-out', r.data.optOut) + kpi('Nomor ganda', r.data.duplikat); };
  const list = async () => { const r = await api('crm.list', { cari: $('#cq').value }); if (!ok(r, false)) return;
    $('#cl').innerHTML = tbl(['Siswa', 'Wali', 'WhatsApp', 'Opt-out'], r.data.rows.map(x => `<tr><td>${esc(x.nama)}<div class="mono">${esc(x.kelas)}</div></td><td>${esc(x.wali)}</td><td class="mono">${esc(x.wa)} ${!x.waValid ? '⚠' : x.statusWA === 'Terdaftar' ? '✓ WA' : x.statusWA ? '✕ bukan WA' : '? belum dicek'}</td><td><input type="checkbox" data-o="${esc(x.nis)}" ${x.optOut ? 'checked' : ''} aria-label="Opt-out"></td></tr>`)) + `<p class="mono">${r.data.total} kontak (menampilkan 50 pertama)</p>`; };
  $('#cl').onchange = async e => { const c = e.target.closest('[data-o]'); if (c) { ok(await api('crm.save', { nis: c.dataset.o, optOut: c.checked }), false); stats(); } };
  let t; $('#cq').oninput = () => { clearTimeout(t); t = setTimeout(list, 350); };
  $('#dw').onclick = async () => { const b = $('#dw'); b.disabled = true; let n = 0; for (;;) { const r = await api('wa.validasi'); if (!ok(r, false)) break; n += r.data.dicek; b.textContent = 'Mengecek… ' + n; if (!r.data.sisa || !r.data.dicek) break; } b.disabled = false; b.textContent = '📱 Deteksi nomor WA'; toast('Selesai: ' + n + ' nomor dicek.'); list(); };
  $('#bs').onclick = async () => { if (!confirm('Kirim blast ke semua kontak valid?')) return; const r = await api('wa.blast', { pesan: $('#bp').value }); if (ok(r)) $('#bp').value = ''; };
  const cfg = async () => { const r = await api('notif.config'); if (!ok(r, false)) return; const c = r.data;
    $('#cf').innerHTML = `<h3>Konfigurasi</h3><label class="sw"><input type="checkbox" id="wa" ${c.waAktif ? 'checked' : ''}> Notifikasi WhatsApp aktif</label><label>Token Fonnte</label><input id="tk" type="password" autocomplete="off" placeholder="${esc(c.token || 'belum diisi')}">
    <label>Google Client ID</label><input id="gc" autocomplete="off" placeholder="${esc(c.clientId || 'belum diisi')}"><p class="mono">Kosong = tidak berubah · <b>__HAPUS__</b> = hapus. Token pos: ${esc(c.posToken)}</p>
    ${Object.keys(c.events).map(k => `<label class="sw"><input type="checkbox" data-ev="${k}" ${c.events[k] ? 'checked' : ''}> ${k === 'SCAN_HADIR' ? 'Kabari ortu saat hadir' : 'Kabari ortu saat terlambat'}</label>`).join('')}<p><button class="p" id="sv">Simpan</button></p>`;
    $('#sv').onclick = async () => { const ev = {}; $$('[data-ev]').forEach(x => ev[x.dataset.ev] = x.checked); const r = await api('notif.save', { waAktif: $('#wa').checked, token: $('#tk').value, clientId: $('#gc').value, events: ev }); if (ok(r)) cfg(); }; };
  stats(); list(); cfg();
}

function pgMaster(m) {
  m.innerHTML = `<div class="grid g2"><div class="card"><div class="row"><h3 class="f">Kelas</h3><button class="p" id="nk">+ Kelas</button></div><div id="tk"></div></div><div class="card"><div class="row"><h3 class="f">Pengguna staf</h3><button class="p" id="nu">+ Pengguna</button></div><div id="tu"></div></div></div>`;
  const KF = [['Kode', 'Kode (7-A)'], ['Nama', 'Nama kelas'], ['Wali', 'Wali kelas'], ['JamMasuk', 'Jam masuk (07:00)'], ['Toleransi', 'Toleransi (menit)']],
    UF = [['Email', 'Email Google'], ['Nama', 'Nama'], ['Peran', 'Peran (admin/guru/piket)'], ['Kelas', 'Kelas diampu (7-A,7-B)'], ['Aktif', 'Aktif (YA/TIDAK)']], D = { kelas: [], pengguna: [] };
  const load = async () => { for (const [t, id, F] of [['kelas', '#tk', KF], ['pengguna', '#tu', UF]]) { const r = await api('master.list', { tabel: t }); if (!ok(r, false)) return; D[t] = r.data;
    $(id).innerHTML = tbl(F.map(f => f[1]).concat(['']), r.data.map((x, i) => `<tr>${F.map(f => `<td>${esc(x[f[0]])}</td>`).join('')}<td><button data-t="${t}" data-i="${i}">Ubah</button></td></tr>`)); } };
  const form = (t, F, s) => { const d = document.createElement('dialog'); d.innerHTML = `<h3>${s ? 'Ubah' : 'Tambah'} ${t}</h3>${F.map(f => `<label>${esc(f[1])}</label><input data-f="${f[0]}" value="${esc(s ? s[f[0]] : f[0] === 'Aktif' ? 'YA' : '')}" ${s && f === F[0] ? 'readonly' : ''}>`).join('')}<p class="row"><button class="p" id="s">Simpan</button><button id="c">Batal</button></p>`;
    document.body.appendChild(d); d.showModal(); $('#c', d).onclick = () => d.remove();
    $('#s', d).onclick = async () => { const o = { tabel: t }; $$('[data-f]', d).forEach(i => o[i.dataset.f] = i.value.trim()); if (ok(await api('master.save', o))) { d.remove(); load(); } }; };
  $('#nk').onclick = () => form('kelas', KF); $('#nu').onclick = () => form('pengguna', UF);
  m.onclick = e => { const b = e.target.closest('[data-i]'); if (b) form(b.dataset.t, b.dataset.t === 'kelas' ? KF : UF, D[b.dataset.t][b.dataset.i]); }; load();
}

// ---------- mulai ----------
(async () => { Bird.init(); if (location.hash === '#pos') return posMode();
  if (!Sesi.t) return login(); const r = await api('auth.me'); if (r.success) { me = r.data; shell(); } else login(); })();
