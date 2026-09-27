
import express from 'express';
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Lokasi folder backend
const __dirname = dirname(fileURLToPath(import.meta.url));

// Import database
const dbPath = join(__dirname, '../database/database.js');
const { default: db } = await import(`file://${dbPath}`);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Menampilkan frontend
app.use(express.static(join(__dirname, '../frontend')));

// GET: DAFTAR MATA KULIAH
app.get('/api/mata-kuliah', (req, res) => {
  db.all(
    'SELECT * FROM mata_kuliah ORDER BY id ASC',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(rows);
    }
  );
});

// GET: SEMUA TUGAS
app.get('/api/tugas', (req, res) => {
  const sql = `
    SELECT
      tugas.*,
      mata_kuliah.nama_mata_kuliah
    FROM tugas
    JOIN mata_kuliah
      ON tugas.mata_kuliah_id = mata_kuliah.id
    ORDER BY tugas.id DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

// POST: TAMBAH TUGAS
app.post('/api/tugas', (req, res) => {
  const {
    nama_tugas,
    mata_kuliah_id,
    deadline
  } = req.body;

  if (!nama_tugas || !mata_kuliah_id) {
    return res.status(400).json({
      message: 'Nama tugas dan mata kuliah wajib diisi.'
    });
  }

  const sql = `
    INSERT INTO tugas
      (nama_tugas, mata_kuliah_id, deadline)
    VALUES (?, ?, ?)
  `;

  db.run(
    sql,
    [nama_tugas, mata_kuliah_id, deadline || null],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        id: this.lastID,
        message: 'Tugas berhasil ditambahkan.'
      });
    }
  );
});

// PUT: EDIT TUGAS
app.put('/api/tugas/:id', (req, res) => {
  const { id } = req.params;

  const {
    nama_tugas,
    mata_kuliah_id,
    deadline
  } = req.body;

  const sql = `
    UPDATE tugas
    SET nama_tugas = ?,
        mata_kuliah_id = ?,
        deadline = ?
    WHERE id = ?
  `;

  db.run(
    sql,
    [
      nama_tugas,
      mata_kuliah_id,
      deadline || null,
      id
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          message: 'Tugas tidak ditemukan.'
        });
      }

      res.json({
        message: 'Tugas berhasil diedit.'
      });
    }
  );
});

// PUT: SELESAIKAN / BATALKAN TUGAS
app.put('/api/tugas/selesai/:id', (req, res) => {
  const { id } = req.params;

  const sql = `
    UPDATE tugas
    SET status = CASE
      WHEN status = 'Selesai'
      THEN 'Belum Selesai'
      ELSE 'Selesai'
    END
    WHERE id = ?
  `;

  db.run(sql, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        message: 'Tugas tidak ditemukan.'
      });
    }

    res.json({
      message: 'Status tugas berhasil diubah.'
    });
  });
});

// DELETE: HAPUS TUGAS
app.delete('/api/tugas/:id', (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM tugas WHERE id = ?',
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        message: 'Tugas berhasil dihapus.'
      });
    }
  );
});

// JALANKAN SERVER
app.listen(PORT, () => {
  console.log(
    `🚀 Server berjalan di http://localhost:${PORT}`
  );
});