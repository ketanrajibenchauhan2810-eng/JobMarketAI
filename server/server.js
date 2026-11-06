
const express = require('express');
const cors = require('cors');
const Papa = require('papaparse');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vS7rSOJAlD-5GM2Pgj2sGhD1nd0K7yqDn7M4Co6BmJiyFdkzPYIkDETJkISKNiR2W29O030UpUF9GQF/pub?output=csv';

app.get('/', (req, res) => {
  res.json({ message: 'Job Market AI Backend is running!' });
});

app.get('/api/jobs', async (req, res) => {
  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error('Google Sheets CSV fetch failed');

    const csvText = await response.text();
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim()
    });

    const jobs = result.data.filter(row =>
      Object.values(row).some(value => String(value ?? '').trim() !== '')
    );

    res.json({ success: true, totalJobs: jobs.length, jobs });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/predict', (req, res) => {
  const pythonFile = path.join(__dirname, '..', 'ml', 'predict.py');
  const python = spawn('python', [pythonFile]);

  let output = '';
  let errorOutput = '';
  let responded = false;

  python.stdout.on('data', data => output += data.toString());
  python.stderr.on('data', data => errorOutput += data.toString());

  python.on('error', error => {
    responded = true;
    res.status(500).json({
      success: false,
      message: 'Python start failed. Check Python installation and PATH.',
      details: error.message
    });
  });

  python.on('close', code => {
    if (responded) return;

    try {
      const result = JSON.parse(output);

      if (code !== 0 || !result.success) {
        return res.status(500).json(result);
      }

      res.json(result);
    } catch {
      res.status(500).json({
        success: false,
        message: 'Prediction failed. Train the model and check Python.',
        details: errorOutput || output
      });
    }
  });

  python.stdin.end(JSON.stringify(req.body));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});



