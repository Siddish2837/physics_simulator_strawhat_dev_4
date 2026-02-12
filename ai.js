// ============================================================
// ai.js — Frontend AI Adapter (REST API Version)
// ============================================================

/**
 * Sends a physics problem text to the backend API for parsing.
 * 
 * @param {string} text — The natural language physics problem
 * @returns {Promise<object>} — Normalized physics parameters
 */
export async function extractParameters(text) {
    console.log('[ai.js] Sending problem to backend:', text);

    try {
        // Get the token from Clerk if available
        let headers = {
            'Content-Type': 'application/json'
        };

        if (window.Clerk && window.Clerk.session) {
            const token = await window.Clerk.session.getToken();
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/parse', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to parse physics problem');
        }

        console.log('[ai.js] Received parameters:', result.data);
        return result.data;

    } catch (error) {
        console.error('[ai.js] Extraction error:', error);
        throw error;
    }
}
