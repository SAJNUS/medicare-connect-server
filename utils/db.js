import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('Error: MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

// Create a reusable MongoClient instance
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;

// Exportable collection references
export let usersCollection;
export let doctorsCollection;
export let appointmentsCollection;
export let reviewsCollection;
export let paymentsCollection;
export let prescriptionsCollection;
export let schedulesCollection;
export let favoritesCollection;

export const connectDB = async () => {
  try {
    await client.connect();
    db = client.db(); // connects to 'medicare-connect' as specified in URI
    
    // Verify connection
    await db.command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB!");

    // Initialize collections
    usersCollection = db.collection('users');
    doctorsCollection = db.collection('doctors');
    appointmentsCollection = db.collection('appointments');
    reviewsCollection = db.collection('reviews');
    paymentsCollection = db.collection('payments');
    prescriptionsCollection = db.collection('prescriptions');
    schedulesCollection = db.collection('schedules');
    favoritesCollection = db.collection('favorites');

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1); // Exit process with failure
  }
};

export default client;
