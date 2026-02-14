require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fetch = global.fetch || require('node-fetch');

async function main() {
  const url = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
  const endpoint = `${url}/webhook`;

  const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';

  const payload = {
    plate: 'POSTTEST' + Math.random().toString(36).substring(2,7).toUpperCase(),
    images: {
      plate: tinyPng,
      full: tinyPng
    }
  };

  try {
    console.log('POST', endpoint, 'payload.plate=', payload.plate);
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const body = await resp.json().catch(() => null);
    console.log('POST response status', resp.status, body);

    // Wait briefly then query detections
    await new Promise(r => setTimeout(r, 800));
    const detResp = await fetch(`${url}/api/detections?page=1&limit=5`);
    const detBody = await detResp.json().catch(() => null);
    console.log('/api/detections response', detResp.status);
    console.log(JSON.stringify(detBody, null, 2));
  } catch (e) {
    console.error('POST ERROR', e.message || e);
    process.exit(1);
  }
}

main();
