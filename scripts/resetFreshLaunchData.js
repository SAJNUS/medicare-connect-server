import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not defined in the environment variables.");
  process.exit(1);
}

const client = new MongoClient(uri);

async function resetFreshLaunchData() {
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully.");

    const db = client.db();
    
    // Collections
    const usersCollection = db.collection('users');
    const appointmentsCollection = db.collection('appointments');
    const paymentsCollection = db.collection('payments');
    const reviewsCollection = db.collection('reviews');
    const prescriptionsCollection = db.collection('prescriptions');
    const favoritesCollection = db.collection('favorites');

    // 1. Delete all appointments, payments, reviews, prescriptions, favorites
    const clearCollections = [
      { name: 'appointments', collection: appointmentsCollection },
      { name: 'payments', collection: paymentsCollection },
      { name: 'reviews', collection: reviewsCollection },
      { name: 'prescriptions', collection: prescriptionsCollection },
      { name: 'favorites', collection: favoritesCollection }
    ];

    for (const { name, collection } of clearCollections) {
      const result = await collection.deleteMany({});
      console.log(`Deleted ${result.deletedCount} items from ${name} collection.`);
    }

    // 2. Delete all patient accounts and test users
    // Keep only:
    // - role: 'doctor'
    // - email: 'medicare@gmail.com' (admin)
    // - email: 'sajnussaharearhojayfa@gmail.com' (developer)
    
    const protectedEmails = [
      'medicare@gmail.com',
      'sajnussaharearhojayfa@gmail.com'
    ];

    const deleteUsersQuery = {
      $and: [
        { role: { $ne: 'doctor' } },
        { email: { $nin: protectedEmails } }
      ]
    };

    const usersResult = await usersCollection.deleteMany(deleteUsersQuery);
    console.log(`Deleted ${usersResult.deletedCount} patient/test accounts from users collection.`);

    console.log("\n--- Verification ---");
    console.log("Remaining Doctors:", await usersCollection.countDocuments({ role: 'doctor' }));
    console.log("Remaining Admins/Devs:", await usersCollection.countDocuments({ email: { $in: protectedEmails } }));
    console.log("Remaining Appointments:", await appointmentsCollection.countDocuments({}));
    console.log("Remaining Payments:", await paymentsCollection.countDocuments({}));
    console.log("Remaining Reviews:", await reviewsCollection.countDocuments({}));
    console.log("Remaining Prescriptions:", await prescriptionsCollection.countDocuments({}));

    console.log("\n✅ Reset to Fresh Production Launch State completed successfully!");

  } catch (err) {
    console.error("Error during reset:", err);
  } finally {
    await client.close();
  }
}

resetFreshLaunchData();
