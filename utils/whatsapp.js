/**
 * utils/whatsapp.js
 * Utility to send WhatsApp messages using Meta WhatsApp Cloud API
 */

require('dotenv').config();
const axios = require('axios');

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

/**
 * Sends a WhatsApp message to a parent about their child's absence
 * @param {string} parentNumber - The parent's mobile number
 * @param {string} studentName - The name of the student
 * @param {string} className - The class of the student
 */
const sendWhatsAppMessage = async (parentNumber, studentName, className) => {
    try {
        if (!accessToken || !phoneNumberId) {
            console.warn('[META WHATSAPP WARNING] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID in .env');
            return { success: false, error: 'Missing API credentials' };
        }

        // WhatsApp Cloud API expects numbers without '+' or 'whatsapp:' prefix
        // Just the country code and number. Example: 919876543210
        let formattedTo = parentNumber.trim().replace(/\D/g, ''); // Extract only digits
        
        // Ensure India country code '91' is prefixed if missing on 10-digit number
        if (formattedTo.length === 10) {
            formattedTo = '91' + formattedTo;
        } else if (formattedTo.length === 12 && formattedTo.startsWith('91')) {
            // It's already fine
        }

        const currentDate = new Date().toLocaleDateString('en-GB');

        const messageBody = `Dear Parent,\n\nThis is to inform you that your child ${studentName} was marked absent from today's class.\n\nClass: ${className}\nDate: ${currentDate}\n\nRegular attendance is important for academic progress.\n\nIf this absence was planned, kindly ignore this notification.\n\nThank you for your cooperation.\n\nShri Ganesh Classes`;

        const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;
        
        const payload = {
            messaging_product: "whatsapp",
            to: formattedTo,
            type: "text",
            text: {
                body: messageBody
            }
        };

        const config = {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        };

        const response = await axios.post(url, payload, config);

        console.log(`✓ Message sent successfully`);
        
        return { success: true, sid: response.data.messages[0].id };
    } catch (error) {
        if (error.response) {
            console.error(`✓ Message delivery error:`, JSON.stringify(error.response.data, null, 2));
            return { success: false, error: error.response.data.error?.message || 'API Error' };
        } else if (error.request) {
            console.error(`✓ Message delivery error: No response received from Meta API.`);
            return { success: false, error: 'No response from API' };
        } else {
            console.error(`✓ Message delivery error: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
};

module.exports = { sendWhatsAppMessage };
