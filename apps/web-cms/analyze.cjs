const fs = require('fs');
const meta = JSON.parse(fs.readFileSync('.open-next/server-functions/default/handler.mjs.meta.json', 'utf8'));
const inputs = meta.outputs['.open-next/server-functions/default/handler.mjs'].inputs;
const sorted = Object.entries(inputs).sort((a, b) => b[1].bytesInOutput - a[1].bytesInOutput);
for (let i = 0; i < 20; i++) {
  console.log(`${sorted[i][1].bytesInOutput} bytes - ${sorted[i][0]}`);
}
