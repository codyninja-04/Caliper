const axios = require('axios');

// Fires the Power Automate webhook that sends escalation emails via Outlook.
// Failure here must NEVER break the API response — escalation is best-effort.
async function triggerEscalation(ncrData) {
  const webhookUrl = process.env.POWER_AUTOMATE_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn(
      `[ncrEscalation] POWER_AUTOMATE_WEBHOOK_URL not set — skipping escalation for ${ncrData.ncr_number}`
    );
    return { delivered: false, reason: 'webhook_not_configured' };
  }

  try {
    await axios.post(webhookUrl, ncrData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    console.log(`[ncrEscalation] Escalation triggered for NCR ${ncrData.ncr_number}`);
    return { delivered: true };
  } catch (err) {
    // Swallow and log — the client should still get a clean 2xx.
    console.error(`[ncrEscalation] Webhook failed for ${ncrData.ncr_number}:`, err.message);
    return { delivered: false, reason: err.message };
  }
}

module.exports = { triggerEscalation };
