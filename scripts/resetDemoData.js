import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('Error: MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

const client = new MongoClient(uri);

async function resetDemoData() {
  try {
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('users');
    const doctorsCollection = db.collection('doctors');

    console.log('Connected to MongoDB.');

    // Delete all records from users collection EXCEPT protected accounts
    const protectedEmails = ['medicare@gmail.com', 'sajnussaharearhojayfa@gmail.com'];
    
    const usersDeleteResult = await usersCollection.deleteMany({
      email: { $nin: protectedEmails }
    });
    console.log(`[Reset] Deleted ${usersDeleteResult.deletedCount} users from the 'users' collection.`);

    // Delete all records from doctors collection EXCEPT protected accounts (if they existed)
    const doctorsDeleteResult = await doctorsCollection.deleteMany({
      email: { $nin: protectedEmails }
    });
    console.log(`[Reset] Deleted ${doctorsDeleteResult.deletedCount} doctors from the 'doctors' collection.`);

    console.log('Database reset completed successfully.');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await client.close();
  }
}

resetDemoData();
