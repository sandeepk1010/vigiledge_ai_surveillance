// Clear all test data from database
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'anpr-backend', '.env') });
const { pool } = require('./anpr-backend/src/config/db');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function checkCounts() {
  const result = await pool.query('SELECT COUNT(*) FROM vehicle_detections');
  return parseInt(result.rows[0].count);
}

async function clearData() {
  console.log('\n' + '='.repeat(60));
  console.log('CLEARING ALL TEST DATA');
  console.log('='.repeat(60));
  
  try {
    const count = await checkCounts();
    console.log(`\nCurrent detections in database: ${count}`);
    
    if (count === 0) {
      console.log('\n✅ Database is already empty!');
      console.log('Ready to receive real ANPR data!');
      process.exit(0);
    }
    
    console.log('\n⚠️  WARNING: This will delete ALL detections and related data!');
    
    rl.question('\n❓ Are you sure you want to delete all data? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() !== 'yes') {
        console.log('\n❌ Cancelled - No data was deleted');
        rl.close();
        process.exit(0);
      }
      
      console.log('\n🗑️  Starting cleanup process...\n');
      
      try {
        // Delete in correct order due to foreign key constraints
        console.log('Deleting vehicle_images...');
        const r1 = await pool.query('DELETE FROM vehicle_images');
        console.log(`✅ Deleted ${r1.rowCount} image records`);
        
        console.log('Deleting events...');
        const r2 = await pool.query('DELETE FROM events');
        console.log(`✅ Deleted ${r2.rowCount} event records`);
        
        console.log('Deleting vehicle_detections...');
        const r3 = await pool.query('DELETE FROM vehicle_detections');
        console.log(`✅ Deleted ${r3.rowCount} detection records`);
        
        console.log('Deleting vehicles...');
        const r4 = await pool.query('DELETE FROM vehicles');
        console.log(`✅ Deleted ${r4.rowCount} vehicle records`);
        
        // Verify
        const finalCount = await checkCounts();
        
        console.log('\n' + '='.repeat(60));
        console.log('VERIFICATION');
        console.log('='.repeat(60));
        
        if (finalCount === 0) {
          console.log('\n✅ SUCCESS! Database is now empty');
          console.log('\n' + '='.repeat(60));
          console.log('NEXT STEPS:');
          console.log('='.repeat(60));
          console.log(`
1. Send a webhook from your ANPR camera to:
   http://localhost:5000/webhook  (for camera1)
   http://localhost:5000/webhooks (for camera2)

2. Or test with Python:
   python send_test_detection.py

3. Check dashboard at:
   http://localhost:3000

4. Or debug console:
   http://localhost:5000/debug.html

The dashboard will auto-refresh every 2 seconds!
`);
        } else {
          console.log(`\n⚠️  Warning: Still ${finalCount} detections remaining`);
        }
        
        rl.close();
        process.exit(0);
        
      } catch (err) {
        console.error('\n❌ Error during cleanup:', err.message);
        rl.close();
        process.exit(1);
      }
    });
    
  } catch (err) {
    console.error('Error:', err.message);
    rl.close();
    process.exit(1);
  }
}

clearData();
