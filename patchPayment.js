import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('medicare_connect');
    const result = await db.collection('payments').updateOne(
      { transactionId: "pi_3Tnt2FIuXNeVcAS84iT5KlUc" },
      { $set: { doctorName: "Dr. Adam Driver", type: "Video Consult" } }
    );
    console.log(result);
  } finally {
    await client.close();
  }
}
run();
