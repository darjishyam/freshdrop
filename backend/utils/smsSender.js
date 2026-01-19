const sendSms = async (phone, message) => {
  // Mock SMS Sender (Authkey Removed as requested)
  console.log("================ MOCK SMS SENDER ================");
  console.log(`[  TO  ] ${phone}`);
  console.log(`[ CODE ] ${message}`);
  console.log("------------------------------------------------");
  console.log("NOTE: This is a MOCK. Real SMS is NOT sent.");
  console.log(
    "To send real SMS, integrate Authkey/Twilio or use Firebase Client SDK.",
  );
  console.log("================================================");
  return true;
};

module.exports = sendSms;
