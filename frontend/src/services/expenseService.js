
import api from '../config/api';

/**
 * Expense Service - Handles all expense-related operations with the Backend API
 */
export const expenseService = {
    /**
     * Get all expenses for the current user
     */
    async getAll() {
        try {
            const response = await api.get('/expenses');
            return { data: response.data, error: null };
        } catch (error) {
            console.error('Error fetching expenses:', error);
            return { data: null, error };
        }
    },

    /**
     * Create a new expense
     */
    async create(expenseData) {
        try {
            const response = await api.post('/expenses', expenseData);
            return { data: response.data, error: null };
        } catch (error) {
            console.error('Error creating expense:', error);
            return { data: null, error };
        }
    },

    /**
     * Update an existing expense
     */
    async update(id, expenseData) {
        try {
            const response = await api.put(`/expenses/${id}`, expenseData);
            return { data: response.data, error: null };
        } catch (error) {
            console.error('Error updating expense:', error);
            return { data: null, error };
        }
    },

    /**
     * Delete an expense
     */
    async delete(id) {
        try {
            await api.delete(`/expenses/${id}`);
            return { error: null };
        } catch (error) {
            console.error('Error deleting expense:', error);
            return { error };
        }
    }
};

export default expenseService;
