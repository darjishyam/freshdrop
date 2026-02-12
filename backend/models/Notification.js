const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'recipientModel'
        },
        recipientModel: {
            type: String,
            required: true,
            enum: ['Driver', 'User']
        },
        title: {
            type: String,
            required: true
        },
        body: {
            type: String,
            required: true
        },
        data: {
            type: Object,
            default: {}
        },
        read: {
            type: Boolean,
            default: false
        },
        type: {
            type: String,
            default: 'SYSTEM'
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Notification", notificationSchema);
