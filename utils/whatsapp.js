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

        const messageBody = `Your child ${studentName} is absent today.
Class: ${className}
Date: ${currentDate}
If this absence was planned, kindly ignore this notification.
Shri Ganesh Classes

आपला पाल्य ${studentName} आज वर्गात गैरहजर आहे.
इयत्ता: ${className}
दिनांक: ${currentDate}
जर ही गैरहजेरी पूर्वनियोजित असेल तर कृपया या संदेशाकडे दुर्लक्ष करा.
श्री गणेश क्लासेस

आपका बच्चा ${studentName} आज कक्षा में गैरहाजिर हैं।
कक्षा: ${className}
दिनांक: ${currentDate}
यदि यह गैरहाजिरी पूर्व नियोजित थी, तो कृपया इस संदेश को अनदेखा करें।
श्री गणेश क्लासेस`;

        const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;
        
        const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
        let payload;

        if (templateName) {
            // Template message (required to send directly without requiring "hii / start" first)
            // By default, expects a multilingual template with 9 placeholders (3 languages * 3 variables)
            let parameters = [
                { type: "text", text: studentName },
                { type: "text", text: className },
                { type: "text", text: currentDate }
            ];

            const paramsCount = parseInt(process.env.WHATSAPP_TEMPLATE_PARAMS_COUNT || '9', 10);
            if (paramsCount === 9) {
                parameters = [
                    ...parameters,
                    { type: "text", text: studentName },
                    { type: "text", text: className },
                    { type: "text", text: currentDate },
                    { type: "text", text: studentName },
                    { type: "text", text: className },
                    { type: "text", text: currentDate }
                ];
            }

            payload = {
                messaging_product: "whatsapp",
                to: formattedTo,
                type: "template",
                template: {
                    name: templateName,
                    language: {
                        code: process.env.WHATSAPP_TEMPLATE_LANG || 'en_US'
                    },
                    components: [
                        {
                            type: "body",
                            parameters: parameters
                        }
                    ]
                }
            };
        } else {
            // Free-form text message (only works if parent initiated chat in last 24 hours)
            payload = {
                messaging_product: "whatsapp",
                to: formattedTo,
                type: "text",
                text: {
                    body: messageBody
                }
            };
        }

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

/**
 * Sends a WhatsApp message to a parent about their child's pending fees
 * @param {string} parentNumber - The parent's mobile number
 * @param {string} studentName - The name of the student
 * @param {string} className - The class of the student
 * @param {number} pendingFee - The pending fee amount
 */
const sendWhatsAppFeeMessage = async (parentNumber, studentName, className, pendingFee) => {
    try {
        if (!accessToken || !phoneNumberId) {
            console.warn('[META WHATSAPP WARNING] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID in .env');
            return { success: false, error: 'Missing API credentials' };
        }

        let formattedTo = parentNumber.trim().replace(/\D/g, '');
        if (formattedTo.length === 10) {
            formattedTo = '91' + formattedTo;
        }

        const messageBody = `Dear Parent, this is a reminder that the pending fee for your ward ${studentName} in Class ${className} is Rs. ${pendingFee}. Please clear it at the earliest.
Shri Ganesh Classes

प्रिय पालक, कृपया नोंद घ्या की आपला पाल्य ${studentName} (इयत्ता: ${className}) याची थकबाकी रु. ${pendingFee} आहे. कृपया ती लवकरात लवकर जमा करावी.
श्री गणेश क्लासेस

प्रिय अभिभावक, कृपया ध्यान दें कि आपके बच्चे ${studentName} (कक्षा: ${className}) की बकाया फीस रु. ${pendingFee} है। कृपया इसे जल्द से जल्द जमा करें।
श्री गणेश क्लासेस`;

        const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;
        
        const feeTemplateName = process.env.WHATSAPP_FEE_TEMPLATE_NAME;
        let payload;

        if (feeTemplateName) {
            payload = {
                messaging_product: "whatsapp",
                to: formattedTo,
                type: "template",
                template: {
                    name: feeTemplateName,
                    language: {
                        code: process.env.WHATSAPP_TEMPLATE_LANG || 'en_US'
                    },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                { type: "text", text: studentName },
                                { type: "text", text: className },
                                { type: "text", text: String(pendingFee) }
                            ]
                        }
                    ]
                }
            };
        } else {
            payload = {
                messaging_product: "whatsapp",
                to: formattedTo,
                type: "text",
                text: {
                    body: messageBody
                }
            };
        }

        const config = {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        };

        const response = await axios.post(url, payload, config);
        console.log(`✓ Fee reminder sent successfully`);
        return { success: true, sid: response.data.messages[0].id };
    } catch (error) {
        if (error.response) {
            console.error(`✓ Fee message delivery error:`, JSON.stringify(error.response.data, null, 2));
            return { success: false, error: error.response.data.error?.message || 'API Error' };
        } else if (error.request) {
            console.error(`✓ Fee message delivery error: No response received from Meta API.`);
            return { success: false, error: 'No response from API' };
        } else {
            console.error(`✓ Fee message delivery error: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
};

module.exports = { sendWhatsAppMessage, sendWhatsAppFeeMessage };
