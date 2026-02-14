require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fetch = global.fetch || require('node-fetch');

async function main() {
  const url = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
  const endpoint = `${url}/api/fetch-image`;

  const detectionId = parseInt(process.argv[2], 10) || 376;
  const filename = process.argv[3] || 'MH48AG4556-20260206122447-vehicle.jpg';

  try {
    console.log('POST', endpoint, 'detectionId=', detectionId, 'filename=', filename);
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ detectionId, filename })
    });
    const body = await resp.json().catch(() => null);
    console.log('Response', resp.status, body);
  } catch (e) {
    console.error('ERROR', e.message || e);
  }
}

main();
