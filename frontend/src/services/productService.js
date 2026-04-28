
import api from '../config/api';

/**
 * Product Service - Handles all product-related operations with the Backend API
 */
export const productService = {
    /**
     * Get all products for the current user
     */
    async getAll() {
        try {
            const response = await api.get('/products');
            return { data: response.data, error: null };
        } catch (error) {
            console.error('Error fetching products:', error);
            return { data: null, error };
        }
    },

    /**
     * Create a new product
     */
    async create(productData) {
        try {
            const response = await api.post('/products', productData);
            return { data: response.data, error: null };
        } catch (error) {
            console.error('Error creating product:', error);
            return { data: null, error };
        }
    },

    /**
     * Delete a product
     */
    async delete(id) {
        try {
            await api.delete(`/products/${id}`);
            return { error: null };
        } catch (error) {
            console.error('Error deleting product:', error);
            return { error };
        }
    }
};

export default productService;
