
import api from '../config/api';

/**
 * Profile Service - Handles all business profile operations with the Backend API
 */
export const profileService = {
    /**
     * Get business profile for the current user
     */
    async get() {
        try {
            const response = await api.get('/profile');
            return { data: response.data, error: null };
        } catch (error) {
            console.error('Error fetching profile:', error);
            return { data: null, error };
        }
    },

    /**
     * Update business profile
     */
    async update(profileData) {
        try {
            const response = await api.put('/profile', profileData);
            return { data: response.data, error: null };
        } catch (error) {
            console.error('Error updating profile:', error);
            return { data: null, error };
        }
    }
};

export default profileService;
