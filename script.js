
const API_URL = '/api/tugas';
const MATKUL_URL = '/api/mata-kuliah';

// 1. AMBIL DAFTAR MATA KULIAH
async function ambilMataKuliah() {
    const select = document.getElementById('mata_kuliah');

    try {
        const response = await fetch(MATKUL_URL);

        if (!response.ok) {
            throw new Error('Gagal mengambil mata kuliah');
        }

        const data = await response.json();

        select.innerHTML = '<option value="">Pilih Mata Kuliah</option>';

        data.forEach(matkul => {
            const option = document.createElement('option');

            option.value = matkul.id;
            option.textContent = matkul.nama_mata_kuliah;

            select.appendChild(option);
        });

    } catch (error) {
        console.error(error);
        select.innerHTML = '<option value="">Gagal memuat mata kuliah</option>';
    }
}

// 2. AMBIL DAN TAMPILKAN SEMUA TUGAS
async function ambilTugas() {
    const tbody = document.getElementById('tugas-list');

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error('Gagal mengambil data tugas');
        }

        const data = await response.json();

        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; color:#64748b;">
                        Belum ada tugas. Santai dulu! 😎
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(tugas => {
            const tr = document.createElement('tr');

            const isSelesai = tugas.status === 'Selesai';

            if (isSelesai) {
                tr.classList.add('completed');
            }

            // Kolom nama tugas
            const tdNama = document.createElement('td');
            tdNama.textContent = tugas.nama_tugas;

            // Kolom mata kuliah
            const tdMatkul = document.createElement('td');
            tdMatkul.textContent = tugas.nama_mata_kuliah || '-';

            // Kolom deadline
            const tdDeadline = document.createElement('td');
            tdDeadline.textContent = tugas.deadline || '-';

            // Kolom status
            const tdStatus = document.createElement('td');

            const badge = document.createElement('span');

            badge.className = `badge ${
                isSelesai ? 'badge-success' : 'badge-pending'
            }`;

            badge.textContent = tugas.status;

            tdStatus.appendChild(badge);

            // Kolom aksi
            const tdAksi = document.createElement('td');

            // Tombol Done / Batalkan
            const btnDone = document.createElement('button');

            btnDone.className = 'btn-action btn-done';
            btnDone.textContent = isSelesai ? 'Batalkan' : 'Done';

            btnDone.addEventListener('click', () => {
                selesaiTugas(tugas.id);
            });

            tdAksi.appendChild(btnDone);

            // Tombol Hapus
            const btnHapus = document.createElement('button');

            btnHapus.className = 'btn-action btn-delete';
            btnHapus.textContent = 'Hapus';

            btnHapus.addEventListener('click', () => {
                hapusTugas(tugas.id);
            });

            tdAksi.appendChild(btnHapus);

            tr.append(
                tdNama,
                tdMatkul,
                tdDeadline,
                tdStatus,
                tdAksi
            );

            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error(error);

        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
                    Gagal mengambil data tugas.
                    Pastikan server berjalan.
                </td>
            </tr>
        `;
    }
}

// 3. TAMBAH TUGAS BARU
document.getElementById('todo-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nama_tugas = document.getElementById('nama_tugas').value.trim();

    const mata_kuliah_id = Number(
        document.getElementById('mata_kuliah').value
    );

    const deadline = document.getElementById('deadline').value;

    if (!nama_tugas || !mata_kuliah_id || !deadline) {
        alert('Lengkapi semua data tugas terlebih dahulu!');
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nama_tugas,
                mata_kuliah_id,
                deadline
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || result.error || 'Gagal menambahkan tugas');
        }

        alert('Tugas berhasil ditambahkan!');

        document.getElementById('todo-form').reset();

        await ambilTugas();

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
});

// 4. SELESAIKAN / BATALKAN TUGAS
async function selesaiTugas(id) {
    try {
        const response = await fetch(
            `${API_URL}/selesai/${id}`,
            {
                method: 'PUT'
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Gagal mengubah status');
        }

        await ambilTugas();

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

// 5. HAPUS TUGAS
async function hapusTugas(id) {
    if (!confirm('Yakin mau hapus tugas ini, bos?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Gagal menghapus tugas');
        }

        await ambilTugas();

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

// 6. JALANKAN APLIKASI
document.addEventListener('DOMContentLoaded', async () => {
    await ambilMataKuliah();
    await ambilTugas();
});