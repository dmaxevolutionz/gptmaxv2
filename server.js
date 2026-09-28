/**
 * server.js - Backend Server untuk GPTmax V2 advance
 * Menjalankan server lokal dan memproses eksekusi generator.py via API
 */
const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// Serve file statis (index.html, app.js, emiten.js, assets, dll)
app.use(express.static(path.join(__dirname)));

// Endpoint API untuk Menjalankan generator.py
app.post('/api/run-generator', (req, res) => {
  console.log('⚡ Memulai eksekusi generator.py...');

  // Perintah python (gunakan 'python3' jika di Linux/Mac)
  const pythonCmd = process.platform === 'win32' ? 'python generator.py' : 'python3 generator.py';

  exec(pythonCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error eksekusi generator: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Gagal menjalankan generator.py',
        error: error.message
      });
    }

    if (stderr) {
      console.warn(`⚠️ Warning Python: ${stderr}`);
    }

    console.log(`✅ Generator selesai:\n${stdout}`);
    return res.json({
      status: 'success',
      message: 'Berhasil memperbarui data pasar dari YFinance (emiten.js baru dibuat)!',
      output: stdout
    });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 GPTmax V2 advance berjalan di http://localhost:${PORT}`);
});