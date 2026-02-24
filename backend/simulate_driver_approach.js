const io = require("socket.io-client");

const fs = require('fs');

// LOAD CONFIG
let config;
try {
    const raw = fs.readFileSync('test_config.json');
    config = JSON.parse(raw);
} catch (e) {
    console.error("Could not read test_config.json. Run setup_geofencing_test.js first!");
    process.exit(1);
}

const SERVER_URL = "http://127.0.0.1:5000";
const DRIVER_ID = config.DRIVER_ID;
const CUSTOMER_LAT = config.CUSTOMER_LAT;
const CUSTOMER_LON = config.CUSTOMER_LON;

// Simulation Parameters
const START_DISTANCE_KM = 1.0; // Start 1km away
const SPEED_KM_PER_SEC = 0.2; // 200 meters per second (Super Fast!)
const UPDATE_INTERVAL_MS = 1000;

console.log("--- Driver Movement Simulation ---");
console.log(`Target: ${CUSTOMER_LAT}, ${CUSTOMER_LON}`);
console.log(`Driver ID: ${DRIVER_ID}`);

const socket = io(SERVER_URL);

socket.on("connect", () => {
    console.log("Connected to Server:", socket.id);
    socket.emit("joinDriverRoom", DRIVER_ID);
    startSimulation();
});

socket.on("disconnect", () => {
    console.log("Disconnected");
});

function startSimulation() {
    let currentDistanceKm = START_DISTANCE_KM;

    const interval = setInterval(() => {
        // Simple linear approach simulation (moving primarily Lat for simplicity)
        // 1 deg Lat ~= 111km. 
        // We want to be 'currentDistanceKm' away.
        // New Lat = Target Lat + (Dist / 111)

        const offsetLat = currentDistanceKm / 111;
        const currentLat = CUSTOMER_LAT + offsetLat;
        const currentLon = CUSTOMER_LON; // Keep lon same for simple approach

        console.log(`Distance: ${currentDistanceKm.toFixed(3)}km | Loc: ${currentLat.toFixed(6)}, ${currentLon.toFixed(6)}`);

        socket.emit("updateDriverLocation", {
            driverId: DRIVER_ID,
            latitude: currentLat,
            longitude: currentLon
        });

        currentDistanceKm -= SPEED_KM_PER_SEC;

        if (currentDistanceKm <= 0) {
            console.log("Arrived at destination!");
            clearInterval(interval);
            socket.disconnect();
            process.exit(0);
        }
    }, UPDATE_INTERVAL_MS);
}
