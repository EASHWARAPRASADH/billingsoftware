import { supabase } from '../config/supabase';

/**
 * Product Service - Handles all product-related operations with Supabase
 */
export const productService = {
    /**
     * Get all products for the current user
     */
    async getAll() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('user_id', user.id)
                .order('name', { ascending: true });

            if (error) throw error;
            return { data: data || [], error: null };
        } catch (error) {
            console.error('Error fetching products:', error);
            return { data: [], error };
        }
    },

    /**
     * Create a new product
     */
    async create(productData) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('products')
                .insert({
                    ...productData,
                    user_id: user.id,
                    gst_rate: parseFloat(productData.gst_rate) || 0,
                    hsn_code: productData.hsn_code || ''
                })
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error creating product:', error);
            return { data: null, error };
        }
    }
};

export default productService;
