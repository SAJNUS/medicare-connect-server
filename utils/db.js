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

    // Seed default admin user
    const adminEmail = "medicare@gmail.com";
    const existingAdmin = await usersCollection.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await usersCollection.insertOne({
        name: "Admin System",
        email: adminEmail,
        role: "admin",
        status: "Active",
        passwordHash: "FirebaseManaged", // Placeholder since Firebase handles auth
        createdAt: new Date().toISOString()
      });
      console.log(`[Seed] Default admin account seeded: ${adminEmail}`);
    } else {
      // Ensure existing admin has the correct role and status
      if (existingAdmin.role !== 'admin' || existingAdmin.status !== 'Active') {
        await usersCollection.updateOne(
          { email: adminEmail },
          { $set: { role: 'admin', status: 'Active' } }
        );
        console.log(`[Seed] Default admin account role/status synchronized.`);
      }
    }

    // Seed developer account
    const devEmail = "sajnussaharearhojayfa@gmail.com";
    const existingDev = await usersCollection.findOne({ email: devEmail });
    if (!existingDev) {
      await usersCollection.insertOne({
        name: "Developer",
        email: devEmail,
        role: "developer",
        status: "Active",
        passwordHash: "FirebaseManaged",
        createdAt: new Date().toISOString()
      });
      console.log(`[Seed] Developer account seeded: ${devEmail}`);
    } else {
      if (existingDev.role !== 'developer') {
        await usersCollection.updateOne(
          { email: devEmail },
          { $set: { role: 'developer' } }
        );
        console.log(`[Seed] Developer account role synchronized.`);
      }
    }

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1); // Exit process with failure
  }
};

export default client;
