import { MongoClient } from 'mongodb';
async function test() {
  const uri = 'mongodb+srv://medicare_admin:MediCare%402026_DB@cluster0.ntmn97n.mongodb.net/medicareDB?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('medicareDB');
  const users = await db.collection('users').find().toArray();
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}
test();
