import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import academicRoutes from './routes/academic.js';
import arrearRoutes from './routes/arrears.js';
import dashboardRoutes from './routes/dashboard.js';
import excelRoutes from './routes/excel.js';
import reportRoutes from './routes/reports.js';
import departmentRoutes from './routes/departments.js';
import sectionRoutes from './routes/sections.js';
import subjectRoutes from './routes/subjects.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - allow all origins (Vercel deployments, mobile devices, local dev) and expose headers
app.use(cors({
  origin: function (origin, callback) {
    // Allow all origins (mobile apps, local dev, preview domains, curl)
    callback(null, true);
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition', 'Content-Length']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/arrears', arrearRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/excel', excelRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Automated Student Academic System API is running!' });
});

// Serve frontend static build if available (Unified single-URL production architecture)
const clientDistCandidates = [
  path.join(__dirname, '../../client/dist'),
  path.join(__dirname, '../client/dist'),
  path.join(process.cwd(), 'client/dist'),
  path.join(process.cwd(), 'dist')
];
const clientDistPath = clientDistCandidates.find(p => fs.existsSync(p));

if (clientDistPath) {
  console.log(`Serving static client from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
