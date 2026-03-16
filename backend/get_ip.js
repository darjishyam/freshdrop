const os = require('os');
const networkInterfaces = os.networkInterfaces();
let ipFound = false;

console.log('-------------------------------------------');
console.log('🔍 Detecting Local IP Addresses...');
console.log('-------------------------------------------');

for (const interfaceName in networkInterfaces) {
    for (const iface of networkInterfaces[interfaceName]) {
        // Skip internal (loopback) and non-IPv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
            console.log(`✅ Use this for mobile testing: http://${iface.address}:5000`);
            ipFound = true;
        }
    }
}

if (!ipFound) {
    console.log('❌ No external IPv4 address found. Check your network connection.');
}
console.log('-------------------------------------------');
