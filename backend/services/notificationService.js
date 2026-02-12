const { Expo } = require("expo-server-sdk");

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
const expo = new Expo();

const Notification = require("../models/Notification");

/**
 * Send push notifications to multiple tokens and persist them
 * @param {Array<{userId: string, pushToken: string}> | string[]} recipients - Array of recipient objects or just tokens (legacy)
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Optional data payload
 * @param {string} recipientModel - 'Driver' or 'User' (required for persistence)
 */
const sendPushNotification = async (recipients, title, body, data = {}, recipientModel = null) => {
    let messages = [];
    let tokens = [];

    // Handle legacy array of strings
    if (recipients.length > 0 && typeof recipients[0] === 'string') {
        tokens = recipients;
    } else {
        tokens = recipients.map(r => r.pushToken);
    }

    for (let pushToken of tokens) {
        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`Push token ${pushToken} is not a valid Expo push token`);
            continue;
        }

        messages.push({
            to: pushToken,
            sound: "default",
            title: title,
            body: body,
            data: data,
        });
    }

    // Persist to Database if recipientModel is provided and recipients are objects
    if (recipientModel && recipients.length > 0 && typeof recipients[0] !== 'string') {
        try {
            const notifications = recipients.map(r => ({
                recipient: r.userId,
                recipientModel: recipientModel,
                title: title,
                body: body,
                data: data,
                read: false,
                type: data.type || 'SYSTEM'
            }));

            await Notification.insertMany(notifications);
            console.log(`Persisted ${notifications.length} notifications to DB`);
        } catch (dbError) {
            console.error("Failed to persist notifications:", dbError);
        }
    }

    // The Expo push notification service accepts batches of notifications so
    // that you don't need to send 1000 requests to send 1000 notifications.
    // We recommend you batch your notifications to reduce the number of requests
    // and to compress them (notifications with similar content will get compressed).
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];

    for (let chunk of chunks) {
        try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log("Notification Ticket Chunk:", ticketChunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            console.error("Error sending notification chunk:", error);
        }
    }
};

module.exports = { sendPushNotification };
