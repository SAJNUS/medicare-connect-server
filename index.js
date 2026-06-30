import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectDB } from './utils/db.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import Stripe from 'stripe';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Setup
// Configure CORS for local and production environments
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'https://medicare-connect-pearl.vercel.app'
  ],
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
      },
      appointments: {
        create: "POST /appointments",
        getAll: "GET /appointments?patientEmail=&doctorEmail=&status=",
        getById: "GET /appointments/:id",
        updateStatus: "PATCH /appointments/:id/status",
        updatePayment: "PATCH /appointments/:id/payment",
        delete: "DELETE /appointments/:id"
      },
      reviews: {
        create: "POST /reviews",
        getAll: "GET /reviews?patientEmail=&doctorEmail=&rating=",
        getById: "GET /reviews/:id",
        update: "PATCH /reviews/:id",
        delete: "DELETE /reviews/:id"
      },
      prescriptions: {
        create: "POST /prescriptions",
        getAll: "GET /prescriptions?patientEmail=&doctorEmail=&appointmentId=",
        getById: "GET /prescriptions/:id",
        update: "PATCH /prescriptions/:id",
        delete: "DELETE /prescriptions/:id"
      },
      payments: {
        create: "POST /payments",
        getAll: "GET /payments?patientEmail=&doctorEmail=&appointmentId=",
        getById: "GET /payments/:id",
        updateStatus: "PATCH /payments/:id/status",
        delete: "DELETE /payments/:id"
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

// Stripe Payment Intent Endpoint
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(amount),
      currency: "bdt",
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Stripe payment intent error:", error);
    res.status(500).json({ error: error.message });
  }
});

// API Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/doctors', doctorRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/reviews', reviewRoutes);
app.use('/prescriptions', prescriptionRoutes);
app.use('/payments', paymentRoutes);

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
