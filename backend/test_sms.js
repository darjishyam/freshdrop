const axios = require("axios");

const testSms = async () => {
  const url = `https://api.authkey.io/request`;
  const params = {
    authkey: "cc621653d3f02859",
    mobile: "9876543210",
    country_code: "91",
    sid: "FRESHD",
    company: "FreshDrop",
    otp: "123456",
  };

  try {
    const response = await axios.get(url, { params });
    console.log("SUCCESS:", JSON.stringify(response.data));
  } catch (error) {
    if (error.response) {
      console.log("API_ERROR:", JSON.stringify(error.response.data));
    } else {
      console.log("NET_ERROR:", error.message);
    }
  }
};

testSms();
