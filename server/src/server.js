import express from 'express';
import cors from 'cors';
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

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - allow all Vercel deployments + local dev
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow any veltech-academic-management Vercel deployment
    if (origin.includes('veltech-academic-management') && origin.includes('vercel.app')) {
      return callback(null, true);
    }
    // Allow localhost for local dev
    if (origin.startsWith('http://localhost')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
