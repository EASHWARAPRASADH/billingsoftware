import { supabase } from '../config/supabase';

/**
 * Expense Service - Handles all expense-related operations with Supabase
 */
export const expenseService = {
    /**
     * Get all expenses for the current user
     */
    async getAll() {
        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .order('expense_date', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching expenses:', error);
            return { data: null, error };
        }
    },

    /**
     * Get a single expense by ID
     */
    async getById(id) {
        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching expense:', error);
            return { data: null, error };
        }
    },

    /**
     * Create a new expense
     */
    async create(expenseData) {
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('User not authenticated');
            }

            const { data, error } = await supabase
                .from('expenses')
                .insert({
                    ...expenseData,
                    user_id: user.id
                })
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
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
            const { data, error } = await supabase
                .from('expenses')
                .update(expenseData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
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
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Error deleting expense:', error);
            return { error };
        }
    },

    /**
     * Get expenses by category
     */
    async getByCategory(category) {
        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .eq('category', category)
                .order('expense_date', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching expenses by category:', error);
            return { data: null, error };
        }
    },

    /**
     * Get expenses by date range
     */
    async getByDateRange(startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .gte('expense_date', startDate)
                .lte('expense_date', endDate)
                .order('expense_date', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching expenses by date range:', error);
            return { data: null, error };
        }
    },

    /**
     * Get expense statistics
     */
    async getStats() {
        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('amount, category');

            if (error) throw error;

            // Calculate statistics
            const totalExpenses = data.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

            // Group by category
            const byCategory = data.reduce((acc, exp) => {
                const category = exp.category || 'Uncategorized';
                if (!acc[category]) {
                    acc[category] = { count: 0, total: 0 };
                }
                acc[category].count++;
                acc[category].total += parseFloat(exp.amount || 0);
                return acc;
            }, {});

            const stats = {
                total: data.length,
                totalAmount: totalExpenses,
                byCategory
            };

            return { data: stats, error: null };
        } catch (error) {
            console.error('Error fetching expense stats:', error);
            return { data: null, error };
        }
    },

    /**
     * Get monthly expenses summary
     */
    async getMonthlyExpenses(year, month) {
        try {
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .gte('expense_date', startDate)
                .lte('expense_date', endDate)
                .order('expense_date', { ascending: false });

            if (error) throw error;

            const total = data.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

            return {
                data: {
                    expenses: data,
                    total,
                    count: data.length
                },
                error: null
            };
        } catch (error) {
            console.error('Error fetching monthly expenses:', error);
            return { data: null, error };
        }
    }
};

export default expenseService;
