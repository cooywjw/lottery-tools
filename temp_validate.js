const fs = require('fs');
try {
  const data = fs.readFileSync('C:/Users/Administrator/.openclaw/openclaw.json', 'utf8');
  JSON.parse(data);
  console.log('JSON valid');
} catch (e) {
  console.error('JSON error:', e.message);
}
