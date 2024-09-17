const fs = require('fs');
const csv = require('csv-parser');
const bcrypt = require('bcrypt');
const { writeToPath } = require('fast-csv');

const inputCsvFile = './schools.csv'; // Path to your input CSV file
const outputCsvFile = './schools_hashed.csv'; // Path for the output CSV file
const saltRounds = 10;

// Function to hash the password
async function hashPassword(password) {
    return await bcrypt.hash(password, saltRounds);
}

// Read and process the CSV file
const rows = [];

fs.createReadStream(inputCsvFile)
  .pipe(csv())
  .on('data', (row) => {
    rows.push(row); // Collect rows first
  })
  .on('end', async () => {
    // Once done reading, process the rows sequentially
    for (const row of rows) {
      try {
        if (row.password) {
          row.password = await hashPassword(row.password); // Hash the password
        }
      } catch (error) {
        console.error(`Error hashing password for row ${row.affiliationNumber}:`, error);
      }
    }

    // After processing, write the updated data to a new CSV file
    writeToPath(outputCsvFile, rows, { headers: true })
      .on('finish', () => {
        console.log('CSV file with hashed passwords created successfully.');
      });
  });
