// Mode demo: data contoh agar semua menu bisa dilihat tanpa backend. Tidak menyimpan apa pun.
const DemoData = (() => {
  const N = ['Adi Prasetyo', 'Bagas Pratama', 'Citra Dewi', 'Dina Permatasari', 'Eko Wahyudi', 'Fitri Handayani', 'Galih Saputra', 'Hana Putri', 'Indra Kurniawan', 'Jihan Safitri', 'Kevin Aditya', 'Lestari Ayu'], ST = ['Hadir', 'Hadir', 'Terlambat', 'Hadir', 'Sakit', 'Hadir'];
  const sis = N.map((n, i) => ({ nis: String(2407001 + i), nama: n, kelas: i % 2 ? '7-B' : '7-A', wali: 'Wali ' + n.split(' ')[0], wa: '0812340' + (1000 + i), aktif: true, wajah: i % 3 !== 0 }));
  return {
    'auth.config': () => ({ googleClientId: '' }),
    'absen.dashboard': () => ({ tanggal: new Date().toISOString().slice(0, 10), total: 32, hadir: 26, terlambat: 2, sakit: 1, izin: 1, belum: 2,
      tren: [{ t: 'Sen', n: 29 }, { t: 'Sel', n: 32 }, { t: 'Rab', n: 31 }, { t: 'Kam', n: 32 }, { t: 'Jum', n: 30 }],
      belumList: sis.slice(0, 2), terbaru: sis.slice(0, 6).map((s, i) => ({ jam: '07:' + (10 + i * 3) + ':00', nama: s.nama, kelas: s.kelas, status: ST[i] })) }),
    'absen.rekap': () => ({ hariSekolah: 20, rows: sis.map((s, i) => { const t = i % 3, h = 18 - t; return { nis: s.nis, nama: s.nama, kelas: s.kelas, hadir: h, terlambat: t, sakit: i % 2, izin: 0, alpa: 20 - h - t - (i % 2), persen: Math.round((h + t) / 20 * 100) }; }) }),
    'siswa.list': () => sis,
    'crm.stats': () => ({ total: 32, waValid: 30, tanpaWA: 2, optOut: 1, duplikat: 1 }),
    'crm.list': () => ({ total: sis.length, halaman: 1, rows: sis.map((s, i) => Object.assign({}, s, { waValid: true, optOut: i === 5, statusWA: i % 4 === 3 ? 'Tidak Terdaftar' : 'Terdaftar' })) }),
    'notif.config': () => ({ waAktif: false, tokenAda: false, token: '', clientIdAda: false, clientId: '', posToken: 'dEmo••••••xyz', events: { SCAN_HADIR: true, SCAN_TERLAMBAT: true }, antri: false }),
    'master.list': d => d.tabel === 'kelas' ? [{ Kode: '7-A', Nama: 'Kelas 7-A', Wali: 'Ibu Sri Wahyuni', JamMasuk: '07:00', Toleransi: 10 }, { Kode: '7-B', Nama: 'Kelas 7-B', Wali: 'Pak Andi', JamMasuk: '07:00', Toleransi: 10 }]
      : [{ Email: 'sri@smpn3kediri.sch.id', Nama: 'Ibu Sri Wahyuni', Peran: 'guru', Kelas: '7-A', Aktif: 'YA' }, { Email: 'andi@smpn3kediri.sch.id', Nama: 'Pak Andi', Peran: 'piket', Kelas: '', Aktif: 'YA' }],
    'siswa.riwayat': () => ({ bulan: new Date().toISOString().slice(0, 7), ringkas: { Hadir: 21, Terlambat: 1, Sakit: 0, Izin: 1 }, log: [{ tanggal: '2026-11-03', jam: '07:12', status: 'Hadir' }, { tanggal: '2026-11-02', jam: '07:05', status: 'Hadir' }, { tanggal: '2026-10-30', jam: '07:42', status: 'Terlambat' }] })
  };
})();
