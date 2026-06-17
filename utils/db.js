/**
 * utils/db.js
 * Database helper utilities.
 */

/**
 * Safely parses and formats MongoDB URI, percent-encoding the password 
 * if it contains unencoded special characters like '@'.
 * 
 * @param {string} uri - The raw MongoDB connection string
 * @returns {string} The formatted/escaped connection string
 */
function formatMongoUri(uri) {
    if (!uri) return uri;
    try {
        // Find the protocol prefix
        const protocolMatch = uri.match(/^(mongodb(?:\+srv)?:\/\/)(.*)$/);
        if (!protocolMatch) return uri;
        
        const protocol = protocolMatch[1];
        const rest = protocolMatch[2];
        
        // Find the last '@' symbol which separates credentials from the host
        const lastAtIndex = rest.lastIndexOf('@');
        if (lastAtIndex === -1) return uri; // No credentials/auth info
        
        const credentials = rest.substring(0, lastAtIndex);
        const hostAndRest = rest.substring(lastAtIndex + 1);
        
        // Split credentials into user and password
        const colonIndex = credentials.indexOf(':');
        if (colonIndex === -1) return uri; // Just username, no password
        
        const user = credentials.substring(0, colonIndex);
        const password = credentials.substring(colonIndex + 1);
        
        // URL encode the password's '@' symbol if present to prevent parsing errors
        let encodedPassword = password;
        if (password.includes('@')) {
            encodedPassword = password.replace(/@/g, '%40');
        }
        
        return `${protocol}${user}:${encodedPassword}@${hostAndRest}`;
    } catch (e) {
        return uri;
    }
}

module.exports = { formatMongoUri };
