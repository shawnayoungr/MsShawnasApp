// Main Express server for local API proxying

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const app = express();
const PORT = process.env.PORT || 5177;

app.use(cors());
app.use(express.json());

// Mount career routes (canonical path `/api/careers/careeronestop/*`)
const careerRoutes = require('./career-routes');
app.use('/api/careers/careeronestop', careerRoutes);
// Backwards-compatible mount for legacy/misspelled frontend calls
app.use('/api/careers/careeronestoap', careerRoutes);

// Colleges local data
const collegesRoutes = require('./colleges-routes');
app.use('/api/colleges', collegesRoutes);

// Serve static files (for production build, if needed)
app.use(express.static(path.join(__dirname, '../dist')));

app.listen(PORT, () => {
  console.log(`API Proxy server running on http://localhost:${PORT}`);
});
