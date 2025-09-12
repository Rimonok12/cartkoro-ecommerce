const axios = require("axios");
const qs = require("querystring");

async function sendSmsViaBulkSmsBD({ number, message }) {
  const api_key = process.env.BULKSMS_API_KEY;
  const senderid = process.env.BULKSMS_SENDER_ID;

  if (!api_key || !senderid) {
    throw new Error(
      "SMS not configured: missing BULKSMS_API_KEY or BULKSMS_SENDER_ID"
    );
  }
  const body = qs.stringify({
    api_key,
    senderid,
    number,
    message,
  });

  const { data, status } = await axios.post(
    "http://bulksmsbd.net/api/smsapi",
    body,
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 10_000,
      // If the API supports only HTTP, keep as-is. If HTTPS is available, switch the URL.
    }
  );

  // Optional: basic success check — adjust to the provider’s actual response shape
  if (status !== 200) {
    throw new Error(`SMS API HTTP ${status}`);
  }
  // Many gateways return strings like "SMS SENT" or JSON; log for visibility
  return data;
}

function toIntlBD(local) {
  return `880${local.slice(1)}`;
}

module.exports = {
  toIntlBD,
  sendSmsViaBulkSmsBD,
};
