
import api from '../config/api';

/**
 * Invoice Service - Handles all invoice-related operations with the Backend API
 */
export const invoiceService = {
    /**
     * Get all invoices for the current user
     */
    async getAll() {
        try {
            const response = await api.get('/invoices');
            return { data: response.data, error: null };
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
            const response = await api.get(`/invoices/${id}`);
            return { data: response.data, error: null };
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
            const response = await api.post('/invoices', invoiceData);
            return { data: response.data, error: null };
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
            const response = await api.put(`/invoices/${id}`, invoiceData);
            return { data: response.data, error: null };
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
            await api.delete(`/invoices/${id}`);
            return { error: null };
        } catch (error) {
            console.error('Error deleting invoice:', error);
            return { error };
        }
    },

    /**
     * Check for duplicate invoices
     */
    async checkDuplicate(client_name, invoice_date, total_amount) {
        try {
            const response = await api.post('/invoices/check-duplicate', {
                client_name,
                invoice_date,
                total_amount
            });
            return { data: response.data, error: null };
        } catch (error) {
            console.error('Error checking duplicate:', error);
            return { data: null, error };
        }
    }
};

export default invoiceService;
