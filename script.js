/**
 * StockWise – Sistem Manajemen Stok Barang Berbasis Web
 * File: script.js
 * Deskripsi: Seluruh logika aplikasi — navigasi, CRUD barang,
 *            transaksi masuk/keluar, LocalStorage, dashboard, laporan.
 *
 * Cara membaca komentar:
 *   // => komentar satu baris (penjelasan singkat)
 *   /* => komentar blok (penjelasan bagian besar)
 */

/* ============================================================
   1. KONSTANTA KUNCI LOCALSTORAGE
   Data disimpan di browser sehingga tidak hilang setelah refresh.
   ============================================================ */
const KEY_BARANG  = 'stockwise_barang';   // Data barang
const KEY_MASUK   = 'stockwise_masuk';    // Riwayat transaksi masuk
const KEY_KELUAR  = 'stockwise_keluar';   // Riwayat transaksi keluar

/* ============================================================
   2. FUNGSI UTILITAS LOCALSTORAGE
   Membaca dan menyimpan data dari/ke localStorage.
   ============================================================ */

/**
 * Membaca data dari localStorage.
 * Jika belum ada, kembalikan array kosong [].
 * @param {string} key - nama kunci
 * @returns {Array} array data
 */
function ambilData(key) {
  var raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Menyimpan data (array) ke localStorage.
 * @param {string} key - nama kunci
 * @param {Array}  data - data yang akan disimpan
 */
function simpanData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* ============================================================
   3. CONTOH DATA AWAL
   Diisi saat aplikasi pertama kali dibuka (localStorage kosong).
   ============================================================ */
function isiDataContoh() {
  // Cek apakah data barang sudah ada; kalau belum, isi contoh
  if (ambilData(KEY_BARANG).length === 0) {
    var contohBarang = [
      { kode: 'BRG001', nama: 'Buku Tulis A4',       kategori: 'Alat Tulis',   harga: 5000,   stok: 50 },
      { kode: 'BRG002', nama: 'Pulpen Biru',          kategori: 'Alat Tulis',   harga: 3000,   stok: 8  },
      { kode: 'BRG003', nama: 'Penggaris 30cm',       kategori: 'Alat Tulis',   harga: 7500,   stok: 25 },
      { kode: 'BRG004', nama: 'Kertas HVS A4 (rim)',  kategori: 'Kertas',       harga: 55000,  stok: 10 },
      { kode: 'BRG005', nama: 'Tinta Printer Hitam',  kategori: 'Elektronik',   harga: 85000,  stok: 5  },
      { kode: 'BRG006', nama: 'Spidol Whiteboard',    kategori: 'Alat Tulis',   harga: 12000,  stok: 30 },
      { kode: 'BRG007', nama: 'Amplop Coklat (pak)',  kategori: 'ATK',          harga: 18000,  stok: 15 },
      { kode: 'BRG008', nama: 'Gunting Besar',        kategori: 'Peralatan',    harga: 22000,  stok: 3  },
    ];
    simpanData(KEY_BARANG, contohBarang);
  }
}

/* ============================================================
   4. NAVIGASI HALAMAN
   Menampilkan section yang dipilih dan menyembunyikan yang lain.
   ============================================================ */

/**
 * Tampilkan halaman (section) berdasarkan nama.
 * @param {string} nama - 'dashboard' | 'barang' | 'masuk' | 'keluar' | 'laporan'
 */
function showPage(nama) {
  // Sembunyikan semua section
  var semua = document.querySelectorAll('.page');
  semua.forEach(function(el) { el.classList.remove('active'); });

  // Tampilkan section yang dipilih
  var target = document.getElementById('page-' + nama);
  if (target) target.classList.add('active');

  // Update judul di topbar
  var judulMap = {
    dashboard: 'Dashboard',
    barang:    'Data Barang',
    masuk:     'Barang Masuk',
    keluar:    'Barang Keluar',
    laporan:   'Laporan Stok'
  };
  document.getElementById('pageTitle').textContent = judulMap[nama] || nama;

  // Update tombol aktif di sidebar
  var navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(function(btn) { btn.classList.remove('active'); });
  var activeBtn = document.querySelector('.nav-item[onclick="showPage(\'' + nama + '\')"]');
  if (activeBtn) activeBtn.classList.add('active');

  // Tutup sidebar di mobile setelah memilih menu
  document.getElementById('sidebar').classList.remove('open');

  // Render ulang konten halaman yang dipilih
  if (nama === 'dashboard') renderDashboard();
  if (nama === 'barang')    renderTabelBarang();
  if (nama === 'masuk')     { populasiSelectBarang('pilihBarangMasuk'); renderTabelMasuk(); }
  if (nama === 'keluar')    { populasiSelectBarang('pilihBarangKeluar'); renderTabelKeluar(); }
  if (nama === 'laporan')   renderLaporan();
}

/** Toggle sidebar (buka/tutup) untuk tampilan mobile */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

/* ============================================================
   5. DASHBOARD
   Menghitung dan menampilkan statistik ringkas.
   ============================================================ */
function renderDashboard() {
  var barang  = ambilData(KEY_BARANG);
  var masuk   = ambilData(KEY_MASUK);
  var keluar  = ambilData(KEY_KELUAR);

  // Hitung total stok (jumlahkan semua field 'stok')
  var totalStok = barang.reduce(function(sum, b) { return sum + b.stok; }, 0);

  // Hitung total unit barang masuk
  var totalMasuk = masuk.reduce(function(sum, t) { return sum + t.jumlah; }, 0);

  // Hitung total unit barang keluar
  var totalKeluar = keluar.reduce(function(sum, t) { return sum + t.jumlah; }, 0);

  // Tampilkan ke kartu statistik
  document.getElementById('statJenis').textContent  = barang.length;
  document.getElementById('statStok').textContent   = totalStok;
  document.getElementById('statMasuk').textContent  = totalMasuk;
  document.getElementById('statKeluar').textContent = totalKeluar;

  // Tabel stok menipis (stok <= 10)
  var menipis = barang.filter(function(b) { return b.stok <= 10; });
  var tbody   = document.getElementById('bodyMenipis');
  if (menipis.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-row">Tidak ada stok menipis. 👍</td></tr>';
  } else {
    tbody.innerHTML = menipis.map(function(b) {
      return '<tr>' +
        '<td>' + b.kode + '</td>' +
        '<td>' + b.nama + '</td>' +
        '<td>' + b.kategori + '</td>' +
        '<td><span class="badge ' + (b.stok === 0 ? 'badge-habis' : 'badge-menipis') + '">' + b.stok + '</span></td>' +
      '</tr>';
    }).join('');
  }
}

/* ============================================================
   6. DATA BARANG – CRUD (Create, Read, Update, Delete)
   ============================================================ */

/**
 * Simpan (tambah atau update) data barang dari form.
 * Dipanggil saat form disubmit.
 */
function simpanBarang(event) {
  event.preventDefault(); // Cegah halaman refresh

  // Ambil nilai dari form
  var kode  = document.getElementById('kodeBarang').value.trim();
  var nama  = document.getElementById('namaBarang').value.trim();
  var kat   = document.getElementById('kategori').value.trim();
  var harga = parseInt(document.getElementById('harga').value);
  var stok  = parseInt(document.getElementById('stokAwal').value);
  var idx   = parseInt(document.getElementById('editIndex').value);

  // Validasi: tidak boleh kosong
  if (!kode || !nama || !kat || isNaN(harga) || isNaN(stok)) {
    tampilToast('Semua kolom wajib diisi!', 'error');
    return;
  }

  var barang = ambilData(KEY_BARANG);

  if (idx === -1) {
    // MODE TAMBAH BARU
    // Cek duplikat kode barang
    var duplikat = barang.some(function(b) { return b.kode === kode; });
    if (duplikat) {
      tampilToast('Kode barang "' + kode + '" sudah ada!', 'error');
      return;
    }
    barang.push({ kode: kode, nama: nama, kategori: kat, harga: harga, stok: stok });
    tampilToast('Barang berhasil ditambahkan! ✅', 'success');
  } else {
    // MODE EDIT
    // Cek duplikat kode (boleh sama dengan diri sendiri)
    var dupEdit = barang.some(function(b, i) { return b.kode === kode && i !== idx; });
    if (dupEdit) {
      tampilToast('Kode barang "' + kode + '" sudah digunakan!', 'error');
      return;
    }
    barang[idx] = { kode: kode, nama: nama, kategori: kat, harga: harga, stok: stok };
    tampilToast('Data barang berhasil diperbarui! ✅', 'success');
  }

  simpanData(KEY_BARANG, barang);
  resetFormBarang();
  renderTabelBarang();
}

/**
 * Isi form dengan data barang yang dipilih untuk diedit.
 * @param {number} idx - index barang di array
 */
function editBarang(idx) {
  var barang = ambilData(KEY_BARANG);
  var b = barang[idx];

  document.getElementById('editIndex').value    = idx;
  document.getElementById('kodeBarang').value   = b.kode;
  document.getElementById('namaBarang').value   = b.nama;
  document.getElementById('kategori').value     = b.kategori;
  document.getElementById('harga').value        = b.harga;
  document.getElementById('stokAwal').value     = b.stok;

  // Ubah judul form
  document.getElementById('formBarangTitle').textContent = '✏️ Edit Barang: ' + b.nama;

  // Scroll ke form
  document.getElementById('formBarang').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Hapus barang berdasarkan index.
 * Konfirmasi terlebih dahulu.
 * @param {number} idx - index barang
 */
function hapusBarang(idx) {
  var barang = ambilData(KEY_BARANG);
  var konfirm = confirm('Hapus barang "' + barang[idx].nama + '"?\nData tidak bisa dikembalikan!');
  if (!konfirm) return;

  barang.splice(idx, 1); // Hapus 1 elemen di posisi idx
  simpanData(KEY_BARANG, barang);
  renderTabelBarang();
  tampilToast('Barang berhasil dihapus.', 'info');
}

/** Reset form barang ke kondisi kosong (mode tambah) */
function resetFormBarang() {
  document.getElementById('formBarang').reset();
  document.getElementById('editIndex').value = -1;
  document.getElementById('formBarangTitle').textContent = '➕ Tambah Barang Baru';
}

/** Render tabel daftar barang (dengan fitur search) */
function renderTabelBarang() {
  var barang = ambilData(KEY_BARANG);
  var kata   = (document.getElementById('searchBarang').value || '').toLowerCase();

  // Filter berdasarkan kata kunci pencarian
  if (kata) {
    barang = barang.filter(function(b) {
      return b.kode.toLowerCase().includes(kata) ||
             b.nama.toLowerCase().includes(kata) ||
             b.kategori.toLowerCase().includes(kata);
    });
  }

  var tbody = document.getElementById('bodyBarang');
  if (barang.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">Tidak ada data yang cocok.</td></tr>';
    return;
  }

  tbody.innerHTML = barang.map(function(b, i) {
    // Cari index asli (penting untuk edit/hapus agar tidak terpengaruh filter)
    var idxAsli = ambilData(KEY_BARANG).findIndex(function(x) { return x.kode === b.kode; });
    return '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td><strong>' + b.kode + '</strong></td>' +
      '<td>' + b.nama + '</td>' +
      '<td>' + b.kategori + '</td>' +
      '<td>Rp ' + formatAngka(b.harga) + '</td>' +
      '<td><span class="badge ' + badgeStok(b.stok) + '">' + b.stok + '</span></td>' +
      '<td style="white-space:nowrap">' +
        '<button class="btn-edit" onclick="editBarang(' + idxAsli + ')">✏️ Edit</button> ' +
        '<button class="btn-hapus" onclick="hapusBarang(' + idxAsli + ')">🗑️ Hapus</button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

/* ============================================================
   7. BARANG MASUK
   ============================================================ */

/**
 * Simpan transaksi barang masuk dan tambah stok barang.
 */
function simpanMasuk(event) {
  event.preventDefault();

  var idxBarang  = parseInt(document.getElementById('pilihBarangMasuk').value);
  var jumlah     = parseInt(document.getElementById('jumlahMasuk').value);
  var keterangan = document.getElementById('keteranganMasuk').value.trim();

  // Validasi input
  if (isNaN(idxBarang) || idxBarang < 0) {
    tampilToast('Pilih barang terlebih dahulu!', 'error'); return;
  }
  if (isNaN(jumlah) || jumlah < 1) {
    tampilToast('Jumlah harus minimal 1!', 'error'); return;
  }

  var barang = ambilData(KEY_BARANG);
  var b = barang[idxBarang];

  // Tambah stok
  barang[idxBarang].stok += jumlah;
  simpanData(KEY_BARANG, barang);

  // Simpan riwayat transaksi masuk
  var masuk = ambilData(KEY_MASUK);
  masuk.push({
    tanggal:    formatTanggal(new Date()),
    kode:       b.kode,
    nama:       b.nama,
    jumlah:     jumlah,
    keterangan: keterangan || '-'
  });
  simpanData(KEY_MASUK, masuk);

  tampilToast('Barang masuk disimpan! Stok bertambah ' + jumlah + '.', 'success');
  document.getElementById('formMasuk').reset();
  populasiSelectBarang('pilihBarangMasuk');
  renderTabelMasuk();
}

/** Render tabel riwayat barang masuk */
function renderTabelMasuk() {
  var masuk = ambilData(KEY_MASUK);
  var tbody = document.getElementById('bodyMasuk');

  if (masuk.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">Belum ada transaksi masuk.</td></tr>';
    return;
  }

  // Tampilkan dari yang terbaru (balik urutan)
  var data = masuk.slice().reverse();
  tbody.innerHTML = data.map(function(t, i) {
    return '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td>' + t.tanggal + '</td>' +
      '<td>' + t.kode + '</td>' +
      '<td>' + t.nama + '</td>' +
      '<td><strong style="color:var(--teal)">+' + t.jumlah + '</strong></td>' +
      '<td>' + t.keterangan + '</td>' +
    '</tr>';
  }).join('');
}

/* ============================================================
   8. BARANG KELUAR
   ============================================================ */

/**
 * Tampilkan info stok tersedia saat pilih barang keluar.
 */
function tampilStokKeluar() {
  var idx = parseInt(document.getElementById('pilihBarangKeluar').value);
  var info = document.getElementById('infoStokKeluar');
  if (isNaN(idx) || idx < 0) { info.textContent = ''; return; }
  var barang = ambilData(KEY_BARANG);
  info.textContent = 'Stok tersedia: ' + barang[idx].stok + ' unit';
}

/**
 * Simpan transaksi barang keluar dan kurangi stok.
 * Tolak jika jumlah melebihi stok tersedia.
 */
function simpanKeluar(event) {
  event.preventDefault();

  var idxBarang  = parseInt(document.getElementById('pilihBarangKeluar').value);
  var jumlah     = parseInt(document.getElementById('jumlahKeluar').value);
  var keterangan = document.getElementById('keteranganKeluar').value.trim();

  // Validasi input
  if (isNaN(idxBarang) || idxBarang < 0) {
    tampilToast('Pilih barang terlebih dahulu!', 'error'); return;
  }
  if (isNaN(jumlah) || jumlah < 1) {
    tampilToast('Jumlah harus minimal 1!', 'error'); return;
  }

  var barang = ambilData(KEY_BARANG);
  var b = barang[idxBarang];

  // CEK STOK — tolak jika melebihi stok tersedia
  if (jumlah > b.stok) {
    tampilToast(
      '❌ Transaksi ditolak! Stok "' + b.nama + '" hanya ' + b.stok + ' unit, tidak cukup untuk ' + jumlah + ' unit.',
      'error'
    );
    return;
  }

  // Kurangi stok
  barang[idxBarang].stok -= jumlah;
  simpanData(KEY_BARANG, barang);

  // Simpan riwayat transaksi keluar
  var keluar = ambilData(KEY_KELUAR);
  keluar.push({
    tanggal:    formatTanggal(new Date()),
    kode:       b.kode,
    nama:       b.nama,
    jumlah:     jumlah,
    keterangan: keterangan || '-'
  });
  simpanData(KEY_KELUAR, keluar);

  tampilToast('Barang keluar disimpan! Stok berkurang ' + jumlah + '.', 'success');
  resetFormKeluar();
  renderTabelKeluar();
}

/** Reset form barang keluar */
function resetFormKeluar() {
  document.getElementById('formKeluar').reset();
  document.getElementById('infoStokKeluar').textContent = '';
}

/** Render tabel riwayat barang keluar */
function renderTabelKeluar() {
  var keluar = ambilData(KEY_KELUAR);
  var tbody  = document.getElementById('bodyKeluar');

  if (keluar.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">Belum ada transaksi keluar.</td></tr>';
    return;
  }

  var data = keluar.slice().reverse();
  tbody.innerHTML = data.map(function(t, i) {
    return '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td>' + t.tanggal + '</td>' +
      '<td>' + t.kode + '</td>' +
      '<td>' + t.nama + '</td>' +
      '<td><strong style="color:var(--orange)">-' + t.jumlah + '</strong></td>' +
      '<td>' + t.keterangan + '</td>' +
    '</tr>';
  }).join('');
}

/* ============================================================
   9. LAPORAN
   ============================================================ */

/** Render tabel laporan seluruh stok dan stok menipis */
function renderLaporan() {
  var barang = ambilData(KEY_BARANG);

  // Laporan seluruh stok
  var tbodyStok = document.getElementById('bodyLaporanStok');
  if (barang.length === 0) {
    tbodyStok.innerHTML = '<tr><td colspan="7" class="empty-row">Belum ada data barang.</td></tr>';
  } else {
    tbodyStok.innerHTML = barang.map(function(b, i) {
      return '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td>' + b.kode + '</td>' +
        '<td>' + b.nama + '</td>' +
        '<td>' + b.kategori + '</td>' +
        '<td>Rp ' + formatAngka(b.harga) + '</td>' +
        '<td>' + b.stok + '</td>' +
        '<td><span class="badge ' + badgeStok(b.stok) + '">' + labelStok(b.stok) + '</span></td>' +
      '</tr>';
    }).join('');
  }

  // Laporan stok menipis
  var menipis = barang.filter(function(b) { return b.stok <= 10; });
  var tbodyMenipis = document.getElementById('bodyLaporanMenipis');
  if (menipis.length === 0) {
    tbodyMenipis.innerHTML = '<tr><td colspan="5" class="empty-row">Tidak ada barang dengan stok menipis.</td></tr>';
  } else {
    tbodyMenipis.innerHTML = menipis.map(function(b, i) {
      return '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td>' + b.kode + '</td>' +
        '<td>' + b.nama + '</td>' +
        '<td>' + b.kategori + '</td>' +
        '<td><span class="badge ' + badgeStok(b.stok) + '">' + b.stok + '</span></td>' +
      '</tr>';
    }).join('');
  }
}

/** Cetak laporan — buka dialog cetak browser */
function cetakLaporan() {
  renderLaporan(); // Pastikan data terbaru
  window.print();
}

/* ============================================================
   10. HELPER (FUNGSI PEMBANTU)
   ============================================================ */

/**
 * Isi dropdown <select> dengan pilihan barang.
 * @param {string} idSelect - id elemen <select>
 */
function populasiSelectBarang(idSelect) {
  var barang = ambilData(KEY_BARANG);
  var select = document.getElementById(idSelect);
  select.innerHTML = '<option value="">-- Pilih Barang --</option>';
  barang.forEach(function(b, i) {
    var opt = document.createElement('option');
    opt.value       = i;
    opt.textContent = b.kode + ' – ' + b.nama + ' (Stok: ' + b.stok + ')';
    select.appendChild(opt);
  });
}

/**
 * Format angka menjadi format ribuan Indonesia.
 * Contoh: 55000 → "55.000"
 * @param {number} angka
 * @returns {string}
 */
function formatAngka(angka) {
  return angka.toLocaleString('id-ID');
}

/**
 * Format objek Date menjadi string "DD/MM/YYYY HH:MM".
 * @param {Date} d
 * @returns {string}
 */
function formatTanggal(d) {
  var dd   = String(d.getDate()).padStart(2, '0');
  var mm   = String(d.getMonth() + 1).padStart(2, '0'); // Bulan dimulai dari 0
  var yyyy = d.getFullYear();
  var hh   = String(d.getHours()).padStart(2, '0');
  var min  = String(d.getMinutes()).padStart(2, '0');
  return dd + '/' + mm + '/' + yyyy + ' ' + hh + ':' + min;
}

/**
 * Tentukan kelas badge berdasarkan jumlah stok.
 * @param {number} stok
 * @returns {string} nama kelas CSS
 */
function badgeStok(stok) {
  if (stok === 0)  return 'badge-habis';
  if (stok <= 10)  return 'badge-menipis';
  return 'badge-aman';
}

/**
 * Tentukan label teks status stok.
 * @param {number} stok
 * @returns {string}
 */
function labelStok(stok) {
  if (stok === 0)  return 'Habis';
  if (stok <= 10)  return 'Menipis';
  return 'Aman';
}

/**
 * Tampilkan notifikasi toast di pojok kanan bawah.
 * @param {string} pesan   - teks notifikasi
 * @param {string} tipe    - 'success' | 'error' | 'info'
 * @param {number} durasi  - berapa ms ditampilkan (default 3000)
 */
function tampilToast(pesan, tipe, durasi) {
  durasi = durasi || 3000;
  var toast = document.getElementById('toast');
  toast.textContent = pesan;
  toast.className   = 'toast ' + tipe + ' show';

  // Sembunyikan setelah durasi
  setTimeout(function() {
    toast.classList.remove('show');
  }, durasi);
}

/* ============================================================
   11. INISIALISASI — Dijalankan saat halaman pertama kali dimuat
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
  // Isi data contoh jika localStorage masih kosong
  isiDataContoh();

  // Tampilkan tanggal hari ini di topbar
  var hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  var bln  = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];
  var now  = new Date();
  document.getElementById('currentDate').textContent =
    hari[now.getDay()] + ', ' + now.getDate() + ' ' + bln[now.getMonth()] + ' ' + now.getFullYear();

  // Tampilkan halaman dashboard sebagai default
  showPage('dashboard');
});
