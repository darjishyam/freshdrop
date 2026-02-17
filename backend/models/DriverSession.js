const mongoose = require("mongoose");

const driverSessionSchema = mongoose.Schema(
    {
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
        },
        startTime: {
            type: Date,
            required: true,
            default: Date.now
        },
        endTime: {
            type: Date,
        },
        duration: {
            type: Number, // In milliseconds
            default: 0
        }
    },
    {
        timestamps: true,
    }
);

// Index for quick lookup of driver's sessions
driverSessionSchema.index({ driver: 1, startTime: -1 });

module.exports = mongoose.model("DriverSession", driverSessionSchema);
