
import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// 1. LOKASI DATABASE
const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'todo.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database error:', err.message);
  } else {
    console.log('SQLite database terkoneksi!');
  }
});

// 2. DAFTAR MATA KULIAH
const daftarMatkul = [
  'Matematika Bisnis',
  'Aplikasi Web',
  'Inovasi Teknologi',
  'Gudang Data',
  'Manajemen Sistem Basis Data',
  'Bahasa Markup',
  'Kepimpinan Berbasis Karakter 1',
  'Aljabar Linear'
];

// 3. BUAT DAN MIGRASI DATABASE
db.serialize(() => {

  // Aktifkan Foreign Key
  db.run('PRAGMA foreign_keys = ON');

  // Tabel mata kuliah
  db.run(`
    CREATE TABLE IF NOT EXISTS mata_kuliah (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_mata_kuliah TEXT NOT NULL UNIQUE
    )
  `);

  // Tabel tugas
  // Kolom mata_kuliah tetap disediakan
  // untuk mempertahankan data lama.
  db.run(`
    CREATE TABLE IF NOT EXISTS tugas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_tugas TEXT NOT NULL,
      mata_kuliah TEXT,
      mata_kuliah_id INTEGER,
      deadline TEXT,
      status TEXT DEFAULT 'Belum Selesai',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mata_kuliah_id)
        REFERENCES mata_kuliah(id)
    )
  `);

  // 4. CEK STRUKTUR TABEL TUGAS LAMA
  db.all('PRAGMA table_info(tugas)', [], (err, columns) => {

    if (err) {
      console.error('Gagal membaca tabel:', err.message);
      return;
    }

    const kolomAda = columns.map(col => col.name);

    // Tambahkan kolom jika database lama
    // belum mempunyai mata_kuliah_id
    const tambahKolom = (callback) => {
      if (!kolomAda.includes('mata_kuliah_id')) {
        db.run(
          'ALTER TABLE tugas ADD COLUMN mata_kuliah_id INTEGER',
          (err) => {
            if (err) {
              console.error(err.message);
              return;
            }

            callback();
          }
        );
      } else {
        callback();
      }
    };

    tambahKolom(() => {

      // 5. MASUKKAN 8 MATA KULIAH
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO mata_kuliah
          (nama_mata_kuliah)
        VALUES (?)
      `);

      daftarMatkul.forEach(nama => {
        stmt.run(nama);
      });

      stmt.finalize((err) => {

        if (err) {
          console.error('Gagal memasukkan matkul:', err.message);
          return;
        }

        // 6. MIGRASI DATA TUGAS LAMA

        // Kalau database sebelumnya mempunyai
        // kolom mata_kuliah berupa teks,
        // hubungkan tugas lama dengan tabel baru.
        if (kolomAda.includes('mata_kuliah')) {

          db.all(`
            SELECT DISTINCT mata_kuliah
            FROM tugas
            WHERE mata_kuliah IS NOT NULL
              AND mata_kuliah != ''
          `, [], (err, rows) => {

            if (err) {
              console.error(err.message);
              return;
            }

            const insertOld = db.prepare(`
              INSERT OR IGNORE INTO mata_kuliah
                (nama_mata_kuliah)
              VALUES (?)
            `);

            rows.forEach(row => {
              insertOld.run(row.mata_kuliah);
            });

            insertOld.finalize(() => {

              // Hubungkan tugas dengan ID matkul
              db.run(`
                UPDATE tugas
                SET mata_kuliah_id = (
                  SELECT id
                  FROM mata_kuliah
                  WHERE mata_kuliah.nama_mata_kuliah
                        = tugas.mata_kuliah
                )
                WHERE mata_kuliah_id IS NULL
                  AND mata_kuliah IS NOT NULL
              `, (err) => {

                if (err) {
                  console.error(
                    'Migrasi tugas gagal:',
                    err.message
                  );
                } else {
                  console.log(
                    'Database siap digunakan!'
                  );
                  console.log(
                    '8 mata kuliah berhasil dimasukkan.'
                  );
                }

              });
            });
          });

        } else {
          console.log('Database siap digunakan!');
        }

      });
    });
  });
});

export default db;