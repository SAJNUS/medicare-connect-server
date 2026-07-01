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

const doctors = [
  // Cardiology
  { name: 'Irfan Khan', specialization: 'Cardiology', designation: 'Consultant', email: 'irfankhan@gmail.com', gender: 'Male', exp: 5, fee: 500 },
  { name: 'Nusrat Jahan', specialization: 'Cardiology', designation: 'Associate Professor', email: 'nusratjahan@gmail.com', gender: 'Female', exp: 10, fee: 1000 },
  { name: 'Shafiqur Rahman', specialization: 'Cardiology', designation: 'Professor', email: 'shafiqurrahman@gmail.com', gender: 'Male', exp: 15, fee: 1500 },
  
  // Neurology
  { name: 'Tariq Hasan', specialization: 'Neurology', designation: 'Consultant', email: 'tariqhasan@gmail.com', gender: 'Male', exp: 5, fee: 500 },
  { name: 'Farhana Akter', specialization: 'Neurology', designation: 'Associate Professor', email: 'farhanaakter@gmail.com', gender: 'Female', exp: 10, fee: 1000 },
  { name: 'Mahmudul Hasan', specialization: 'Neurology', designation: 'Professor', email: 'mahmudulhasan@gmail.com', gender: 'Male', exp: 15, fee: 1500 },
  
  // Pediatrics
  { name: 'Asif Iqbal', specialization: 'Pediatrics', designation: 'Consultant', email: 'asifiqbal@gmail.com', gender: 'Male', exp: 5, fee: 500 },
  { name: 'Sadia Afrin', specialization: 'Pediatrics', designation: 'Associate Professor', email: 'sadiaafrin@gmail.com', gender: 'Female', exp: 10, fee: 1000 },
  { name: 'Kamrul Islam', specialization: 'Pediatrics', designation: 'Professor', email: 'kamrulislam@gmail.com', gender: 'Male', exp: 15, fee: 1500 },
  
  // Orthopedics
  { name: 'Riaz Uddin', specialization: 'Orthopedics', designation: 'Consultant', email: 'riazuddin@gmail.com', gender: 'Male', exp: 5, fee: 500 },
  { name: 'Tahmina Begum', specialization: 'Orthopedics', designation: 'Associate Professor', email: 'tahminabegum@gmail.com', gender: 'Female', exp: 10, fee: 1000 },
  { name: 'Abdur Razzak', specialization: 'Orthopedics', designation: 'Professor', email: 'abdurrazzak@gmail.com', gender: 'Male', exp: 15, fee: 1500 },
  
  // Dermatology
  { name: 'Noman Chowdhury', specialization: 'Dermatology', designation: 'Consultant', email: 'nomanchowdhury@gmail.com', gender: 'Male', exp: 5, fee: 500 },
  { name: 'Samira Haque', specialization: 'Dermatology', designation: 'Associate Professor', email: 'samirahaque@gmail.com', gender: 'Female', exp: 10, fee: 1000 },
  { name: 'Kazi Monir', specialization: 'Dermatology', designation: 'Professor', email: 'kazimonir@gmail.com', gender: 'Male', exp: 15, fee: 1500 },
  
  // Gynecology
  { name: 'Shireen Akhter', specialization: 'Gynecology', designation: 'Consultant', email: 'shireenakhter@gmail.com', gender: 'Female', exp: 5, fee: 500 },
  { name: 'Rokeya Sultana', specialization: 'Gynecology', designation: 'Associate Professor', email: 'rokeyasultana@gmail.com', gender: 'Female', exp: 10, fee: 1000 },
  { name: 'Salma Begum', specialization: 'Gynecology', designation: 'Professor', email: 'salmabegum@gmail.com', gender: 'Female', exp: 15, fee: 1500 },
  
  // Dentistry
  { name: 'Sajjad Ali', specialization: 'Dentistry', designation: 'Consultant', email: 'sajjadali@gmail.com', gender: 'Male', exp: 5, fee: 500 },
  { name: 'Tanjina Islam', specialization: 'Dentistry', designation: 'Associate Professor', email: 'tanjinaislam@gmail.com', gender: 'Female', exp: 10, fee: 1000 },
  { name: 'Mizanur Rahman', specialization: 'Dentistry', designation: 'Professor', email: 'mizanurrahman@gmail.com', gender: 'Male', exp: 15, fee: 1500 },
  
  // Psychiatry
  { name: 'Fahim Shahriar', specialization: 'Psychiatry', designation: 'Consultant', email: 'fahimshahriar@gmail.com', gender: 'Male', exp: 5, fee: 500 },
  { name: 'Nadia Kamal', specialization: 'Psychiatry', designation: 'Associate Professor', email: 'nadiakamal@gmail.com', gender: 'Female', exp: 10, fee: 1000 },
  { name: 'Anisur Rahman', specialization: 'Psychiatry', designation: 'Professor', email: 'anisurrahman@gmail.com', gender: 'Male', exp: 15, fee: 1500 }
];

const getRandomRating = () => (4.5 + Math.random() * 0.5).toFixed(1);
const getRandomReviews = () => Math.floor(Math.random() * 100) + 10;

async function seedDoctors() {
  try {
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('users');
    const doctorsCollection = db.collection('doctors');

    console.log('Connected to MongoDB. Starting idempotent seeding...');

    let upsertCount = 0;

    for (const doc of doctors) {
      const formattedName = doc.name.toLowerCase().replace(/\s+/g, '_');
      const photoURL = `/doctors/dr_${formattedName}.png`;
      const password = doc.email.charAt(0).toUpperCase() + doc.email.slice(1);
      
      const now = new Date().toISOString();

      // 1. Upsert into Users Collection
      const userUpdate = {
        $set: {
          name: doc.name,
          email: doc.email,
          role: 'doctor',
          status: 'Active',
          demoPassword: password, // Helpful for demo reference
          passwordHash: 'FirebaseManaged',
          avatar: photoURL,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      };

      await usersCollection.updateOne({ email: doc.email }, userUpdate, { upsert: true });

      // 2. Upsert into Doctors Collection
      const doctorUpdate = {
        $set: {
          name: doc.name,
          email: doc.email,
          specialization: doc.specialization,
          designation: doc.designation,
          experience: doc.exp,
          consultationFee: doc.fee,
          qualifications: 'MBBS, FCPS',
          hospitalName: 'Medicare Connect General Hospital',
          bio: `Highly experienced ${doc.designation} specializing in ${doc.specialization}. Dedicated to providing the best patient care.`,
          rating: parseFloat(getRandomRating()),
          totalReviews: getRandomReviews(),
          availableDays: ['Monday', 'Wednesday', 'Friday'],
          availableSlots: ['10:00 AM', '12:00 PM', '04:00 PM', '06:00 PM'],
          verificationStatus: 'verified',
          photoURL: photoURL,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      };

      await doctorsCollection.updateOne({ email: doc.email }, doctorUpdate, { upsert: true });
      upsertCount++;
    }

    console.log(`[Seed] Successfully upserted ${upsertCount} doctors into both collections.`);
  } catch (error) {
    console.error('Error seeding doctors:', error);
  } finally {
    await client.close();
  }
}

seedDoctors();
