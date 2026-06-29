import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectDB } from './utils/db.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Setup
// Configure CORS for local development
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // standard Vite frontend ports
  credentials: true,
}));

// Parse JSON bodies and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// Root API Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the MediCare Connect API"
  });
});

// API Info Endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    endpoints: {
      health: "GET /health",
      auth: {
        jwt: "POST /auth/jwt",
        logout: "POST /auth/logout",
        adminTest: "GET /auth/admin-test",
        doctorTest: "GET /auth/doctor-test",
        patientTest: "GET /auth/patient-test"
      },
      users: {
        create: "POST /users",
        getAll: "GET /users",
        getByEmail: "GET /users/:email",
        updateRole: "PATCH /users/:email/role"
      },
      doctors: {
        create: "POST /doctors",
        getAll: "GET /doctors?search=&specialization=&sortBy=",
        getById: "GET /doctors/:id",
        updateVerification: "PATCH /doctors/:id/verification"
      }
    }
  });
});

// Basic Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running"
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/doctors', doctorRoutes);

// Catch-all route for undefined API endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
});
