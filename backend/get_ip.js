const os = require('os');
const networkInterfaces = os.networkInterfaces();
let ipFound = false;





for (const interfaceName in networkInterfaces) {
    for (const iface of networkInterfaces[interfaceName]) {
        // Skip internal (loopback) and non-IPv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
            
            ipFound = true;
        }
    }
}

if (!ipFound) {
    
}

