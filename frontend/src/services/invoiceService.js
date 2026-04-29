import { supabase } from '../config/supabase';

/**
 * Invoice Service - Handles all invoice-related operations with Supabase
 */
export const invoiceService = {
    /**
     * Get all invoices for the current user
     */
    async getAll() {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching invoices:', error);
            return { data: null, error };
        }
    },

    /**
     * Get a single invoice by ID
     */
    async getById(id) {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching invoice:', error);
            return { data: null, error };
        }
    },

    /**
     * Create a new invoice
     */
    async create(invoiceData) {
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('User not authenticated');
            }

            const { data, error } = await supabase
                .from('invoices')
                .insert({
                    ...invoiceData,
                    user_id: user.id
                })
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error creating invoice:', error);
            return { data: null, error };
        }
    },

    /**
     * Update an existing invoice
     */
    async update(id, invoiceData) {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .update(invoiceData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error updating invoice:', error);
            return { data: null, error };
        }
    },

    /**
     * Delete an invoice
     */
    async delete(id) {
        try {
            const { error } = await supabase
                .from('invoices')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Error deleting invoice:', error);
            return { error };
        }
    },

    /**
     * Get invoices by status
     */
    async getByStatus(status) {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('status', status)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching invoices by status:', error);
            return { data: null, error };
        }
    },

    /**
     * Get invoices by date range
     */
    async getByDateRange(startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .gte('invoice_date', startDate)
                .lte('invoice_date', endDate)
                .order('invoice_date', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching invoices by date range:', error);
            return { data: null, error };
        }
    },

    /**
     * Search invoices by client name
     */
    async searchByClient(clientName) {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .ilike('client_name', `%${clientName}%`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error searching invoices:', error);
            return { data: null, error };
        }
    },

    /**
     * Get invoice statistics
     */
    async getStats() {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('total_amount, status');

            if (error) throw error;

            const stats = {
                total: data.length,
                totalRevenue: data.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0),
                pending: data.filter(inv => inv.status === 'pending').length,
                paid: data.filter(inv => inv.status === 'paid').length,
                overdue: data.filter(inv => inv.status === 'overdue').length
            };

            return { data: stats, error: null };
        } catch (error) {
            console.error('Error fetching invoice stats:', error);
            return { data: null, error };
        }
    }
};

export default invoiceService;
