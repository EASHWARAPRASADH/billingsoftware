
/**
 * Storage Service - Refactored to use Base64 for MySQL migration
 * Instead of uploading to Supabase, we now return Base64 strings to be stored in MySQL.
 */
export const storageService = {
    /**
     * Convert file to Base64
     * @param {File} file 
     * @returns {Promise<string>}
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },

    /**
     * Upload company logo (returns base64)
     */
    async uploadCompanyLogo(file) {
        try {
            const base64 = await this.fileToBase64(file);
            return { url: base64, error: null };
        } catch (error) {
            console.error('Error processing company logo:', error);
            return { url: null, error };
        }
    },

    /**
     * Upload signature image (returns base64)
     */
    async uploadSignature(file) {
        try {
            const base64 = await this.fileToBase64(file);
            return { url: base64, error: null };
        } catch (error) {
            console.error('Error processing signature:', error);
            return { url: null, error };
        }
    },

    /**
     * Upload expense receipt (placeholder - could use base64 or backend upload)
     */
    async uploadReceipt(file, expenseId) {
        try {
            const base64 = await this.fileToBase64(file);
            return { url: base64, error: null };
        } catch (error) {
            console.error('Error processing receipt:', error);
            return { url: null, error };
        }
    }
};

export default storageService;
