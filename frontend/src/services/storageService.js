import { supabase } from '../config/supabase';

/**
 * Storage Service - Handles file uploads to Supabase Storage
 */
export const storageService = {
    /**
     * Upload company logo
     * @param {File} file - The file to upload
     * @returns {Promise<{url: string, error: null} | {url: null, error: Error}>}
     */
    async uploadCompanyLogo(file) {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('User not authenticated');
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/logo.${fileExt}`;

            // Upload file to company-logos bucket
            const { data, error } = await supabase.storage
                .from('company-logos')
                .upload(fileName, file, {
                    upsert: true, // Replace if exists
                    contentType: file.type
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('company-logos')
                .getPublicUrl(fileName);

            return { url: publicUrl, error: null };
        } catch (error) {
            console.error('Error uploading company logo:', error);
            return { url: null, error };
        }
    },

    /**
     * Upload signature image
     * @param {File} file - The file to upload
     * @returns {Promise<{url: string, error: null} | {url: null, error: Error}>}
     */
    async uploadSignature(file) {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('User not authenticated');
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/signature.${fileExt}`;

            // Upload file to signatures bucket
            const { data, error } = await supabase.storage
                .from('signatures')
                .upload(fileName, file, {
                    upsert: true,
                    contentType: file.type
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('signatures')
                .getPublicUrl(fileName);

            return { url: publicUrl, error: null };
        } catch (error) {
            console.error('Error uploading signature:', error);
            return { url: null, error };
        }
    },

    /**
     * Upload expense receipt
     * @param {File} file - The file to upload
     * @param {string} expenseId - The expense ID
     * @returns {Promise<{url: string, error: null} | {url: null, error: Error}>}
     */
    async uploadReceipt(file, expenseId) {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('User not authenticated');
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/receipts/${expenseId}.${fileExt}`;

            // Upload file to receipts bucket
            const { data, error } = await supabase.storage
                .from('receipts')
                .upload(fileName, file, {
                    upsert: true,
                    contentType: file.type
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('receipts')
                .getPublicUrl(fileName);

            return { url: publicUrl, error: null };
        } catch (error) {
            console.error('Error uploading receipt:', error);
            return { url: null, error };
        }
    },

    /**
     * Delete a file from storage
     * @param {string} bucket - The bucket name
     * @param {string} filePath - The file path
     * @returns {Promise<{error: null} | {error: Error}>}
     */
    async deleteFile(bucket, filePath) {
        try {
            const { error } = await supabase.storage
                .from(bucket)
                .remove([filePath]);

            if (error) throw error;

            return { error: null };
        } catch (error) {
            console.error('Error deleting file:', error);
            return { error };
        }
    },

    /**
     * Get public URL for a file
     * @param {string} bucket - The bucket name
     * @param {string} filePath - The file path
     * @returns {string} Public URL
     */
    getPublicUrl(bucket, filePath) {
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrl;
    },

    /**
     * List files in a user's folder
     * @param {string} bucket - The bucket name
     * @returns {Promise<{files: Array, error: null} | {files: null, error: Error}>}
     */
    async listUserFiles(bucket) {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('User not authenticated');
            }

            const { data, error } = await supabase.storage
                .from(bucket)
                .list(user.id);

            if (error) throw error;

            return { files: data, error: null };
        } catch (error) {
            console.error('Error listing files:', error);
            return { files: null, error };
        }
    },

    /**
     * Upload file from base64 string (useful for canvas signatures)
     * @param {string} base64Data - Base64 encoded file data
     * @param {string} bucket - The bucket name
     * @param {string} fileName - The file name
     * @returns {Promise<{url: string, error: null} | {url: null, error: Error}>}
     */
    async uploadBase64(base64Data, bucket, fileName) {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('User not authenticated');
            }

            // Convert base64 to blob
            const base64Response = await fetch(base64Data);
            const blob = await base64Response.blob();

            const filePath = `${user.id}/${fileName}`;

            // Upload blob
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, blob, {
                    upsert: true,
                    contentType: 'image/png'
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return { url: publicUrl, error: null };
        } catch (error) {
            console.error('Error uploading base64 file:', error);
            return { url: null, error };
        }
    }
};

export default storageService;
