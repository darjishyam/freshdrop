const bcrypt = require("bcryptjs");

async function test() {
    try {
        console.log("Starting bcrypt test...");
        const hashed = await bcrypt.hash("adminpassword123", 10);
        console.log("Hashed:", hashed);
        const match = await bcrypt.compare("adminpassword123", hashed);
        console.log("Match:", match);
    } catch (err) {
        console.error("Bcrypt Error:", err);
    }
}

test();
