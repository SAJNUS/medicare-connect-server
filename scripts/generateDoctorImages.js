import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the client public/doctors directory
const targetDir = path.join(__dirname, '..', '..', 'medicare-connect-client', 'public', 'doctors');

// The 24 Doctors List
const doctors = [
  // Cardiology
  { name: 'Irfan Khan', designation: 'Consultant', gender: 'Male' },
  { name: 'Nusrat Jahan', designation: 'Associate Professor', gender: 'Female' },
  { name: 'Shafiqur Rahman', designation: 'Professor', gender: 'Male' },
  
  // Neurology
  { name: 'Tariq Hasan', designation: 'Consultant', gender: 'Male' },
  { name: 'Farhana Akter', designation: 'Associate Professor', gender: 'Female' },
  { name: 'Mahmudul Hasan', designation: 'Professor', gender: 'Male' },
  
  // Pediatrics
  { name: 'Asif Iqbal', designation: 'Consultant', gender: 'Male' },
  { name: 'Sadia Afrin', designation: 'Associate Professor', gender: 'Female' },
  { name: 'Kamrul Islam', designation: 'Professor', gender: 'Male' },
  
  // Orthopedics
  { name: 'Riaz Uddin', designation: 'Consultant', gender: 'Male' },
  { name: 'Tahmina Begum', designation: 'Associate Professor', gender: 'Female' },
  { name: 'Abdur Razzak', designation: 'Professor', gender: 'Male' },
  
  // Dermatology
  { name: 'Noman Chowdhury', designation: 'Consultant', gender: 'Male' },
  { name: 'Samira Haque', designation: 'Associate Professor', gender: 'Female' },
  { name: 'Kazi Monir', designation: 'Professor', gender: 'Male' },
  
  // Gynecology
  { name: 'Shireen Akhter', designation: 'Consultant', gender: 'Female' },
  { name: 'Rokeya Sultana', designation: 'Associate Professor', gender: 'Female' },
  { name: 'Salma Begum', designation: 'Professor', gender: 'Female' },
  
  // Dentistry
  { name: 'Sajjad Ali', designation: 'Consultant', gender: 'Male' },
  { name: 'Tanjina Islam', designation: 'Associate Professor', gender: 'Female' },
  { name: 'Mizanur Rahman', designation: 'Professor', gender: 'Male' },
  
  // Psychiatry
  { name: 'Fahim Shahriar', designation: 'Consultant', gender: 'Male' },
  { name: 'Nadia Kamal', designation: 'Associate Professor', gender: 'Female' },
  { name: 'Anisur Rahman', designation: 'Professor', gender: 'Male' }
];

async function generateImages() {
  console.log(`[Image Generator] Verifying and mapping 24 doctor images in ${targetDir}`);
  
  if (!fs.existsSync(targetDir)) {
    console.error(`[Error] Directory not found: ${targetDir}`);
    console.error(`Please make sure the client directory exists.`);
    process.exit(1);
  }

  let successCount = 0;

  for (const doc of doctors) {
    // Determine the correct base image
    let baseFile = '';
    if (doc.designation === 'Consultant' && doc.gender === 'Male') baseFile = 'base_male_consultant.png';
    else if (doc.designation === 'Consultant' && doc.gender === 'Female') baseFile = 'base_female_consultant.png';
    else if (doc.designation === 'Associate Professor' && doc.gender === 'Female') baseFile = 'base_female_assoc_prof.png';
    else if (doc.designation === 'Professor' && doc.gender === 'Male') baseFile = 'base_male_prof.png';
    else if (doc.designation === 'Professor' && doc.gender === 'Female') baseFile = 'base_female_prof.png';

    const sourcePath = path.join(targetDir, baseFile);
    
    // Format name to filename (e.g., "Irfan Khan" -> "dr_irfan_khan.png")
    const formattedName = doc.name.toLowerCase().replace(/\s+/g, '_');
    const targetFilename = `dr_${formattedName}.png`;
    const destPath = path.join(targetDir, targetFilename);

    try {
      if (!fs.existsSync(sourcePath)) {
        console.error(`[Error] Base image ${baseFile} not found!`);
        continue;
      }
      
      // Copy the file
      fs.copyFileSync(sourcePath, destPath);
      console.log(`[Success] Created image for ${doc.name} -> /doctors/${targetFilename}`);
      successCount++;
    } catch (err) {
      console.error(`[Error] Failed to create image for ${doc.name}: ${err.message}`);
    }
  }
  
  console.log(`\n[Image Generator] Successfully mapped ${successCount}/24 doctor images.`);
}

generateImages();
