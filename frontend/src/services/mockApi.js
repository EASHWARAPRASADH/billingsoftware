import axios from "axios";

const API_KEY = "cashpulse_";

// Mock data generators
const generateId = () => Math.random().toString(36).substr(2, 9);

const getMockUser = () => ({
  id: "user-1",
  email: localStorage.getItem(API_KEY + "email") || "demo@example.com",
  business_name: localStorage.getItem(API_KEY + "business_name") || "My Business"
});

const getMockProfile = () => ({
  user_id: "user-1",
  business_name: localStorage.getItem(API_KEY + "business_name") || "My Business",
  email: localStorage.getItem(API_KEY + "email") || "demo@example.com",
  phone: localStorage.getItem(API_KEY + "phone") || "",
  address: localStorage.getItem(API_KEY + "address") || "",
  tax_rate: parseFloat(localStorage.getItem(API_KEY + "tax_rate") || "18"),
  currency: localStorage.getItem(API_KEY + "currency") || "INR",
  updated_at: new Date().toISOString()
});

const getStorageData = (key, defaultValue = []) => {
  const data = localStorage.getItem(API_KEY + key);
  return data ? JSON.parse(data) : defaultValue;
};

const setStorageData = (key, data) => {
  localStorage.setItem(API_KEY + key, JSON.stringify(data));
};

// Mock API object
const mockApi = {
  // Auth endpoints
  async register(email, password, business_name) {
    const token = "mock_token_" + Math.random().toString(36);
    localStorage.setItem(API_KEY + "token", token);
    localStorage.setItem(API_KEY + "email", email);
    localStorage.setItem(API_KEY + "business_name", business_name);
    
    return {
      access_token: token,
      user: {
        id: "user-1",
        email,
        business_name
      }
    };
  },

  async login(email, password) {
    const token = "mock_token_" + Math.random().toString(36);
    localStorage.setItem(API_KEY + "token", token);
    localStorage.setItem(API_KEY + "email", email);
    
    return {
      access_token: token,
      user: getMockUser()
    };
  },

  // Auth endpoints
  async getMe() {
    return getMockUser();
  },

  // Profile endpoints
  async getProfile() {
    return getMockProfile();
  },

  async updateProfile(data) {
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        localStorage.setItem(API_KEY + key, data[key].toString());
      }
    });
    return getMockProfile();
  },

  // Invoice endpoints
  async createInvoice(invoiceData) {
    const invoices = getStorageData("invoices", []);
    const invoiceCount = invoices.length;
    const invoice = {
      id: generateId(),
      user_id: "user-1",
      invoice_number: `INV-${String(invoiceCount + 1).padStart(5, "0")}`,
      created_at: new Date().toISOString(),
      ...invoiceData
    };
    invoices.push(invoice);
    setStorageData("invoices", invoices);
    return invoice;
  },

  async getInvoices() {
    return getStorageData("invoices", []);
  },

  async getInvoice(id) {
    const invoices = getStorageData("invoices", []);
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) throw new Error("Invoice not found");
    return invoice;
  },

  async updateInvoice(id, data) {
    const invoices = getStorageData("invoices", []);
    const index = invoices.findIndex(inv => inv.id === id);
    if (index === -1) throw new Error("Invoice not found");
    invoices[index] = { ...invoices[index], ...data };
    setStorageData("invoices", invoices);
    return invoices[index];
  },

  async deleteInvoice(id) {
    const invoices = getStorageData("invoices", []);
    const filtered = invoices.filter(inv => inv.id !== id);
    setStorageData("invoices", filtered);
    return { message: "Invoice deleted successfully" };
  },

  // Expense endpoints
  async createExpense(expenseData) {
    const expenses = getStorageData("expenses", []);
    const expense = {
      id: generateId(),
      user_id: "user-1",
      created_at: new Date().toISOString(),
      ...expenseData
    };
    expenses.push(expense);
    setStorageData("expenses", expenses);
    return expense;
  },

  async getExpenses() {
    return getStorageData("expenses", []);
  },

  async getExpense(id) {
    const expenses = getStorageData("expenses", []);
    const expense = expenses.find(exp => exp.id === id);
    if (!expense) throw new Error("Expense not found");
    return expense;
  },

  async updateExpense(id, data) {
    const expenses = getStorageData("expenses", []);
    const index = expenses.findIndex(exp => exp.id === id);
    if (index === -1) throw new Error("Expense not found");
    expenses[index] = { ...expenses[index], ...data };
    setStorageData("expenses", expenses);
    return expenses[index];
  },

  async deleteExpense(id) {
    const expenses = getStorageData("expenses", []);
    const filtered = expenses.filter(exp => exp.id !== id);
    setStorageData("expenses", filtered);
    return { message: "Expense deleted successfully" };
  },

  // Dashboard endpoints
  async getDashboard() {
    const invoices = getStorageData("invoices", []);
    const expenses = getStorageData("expenses", []);

    const totalRevenue = invoices
      .filter(inv => inv.status === "paid")
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const pendingInvoices = invoices.filter(inv => ["draft", "sent"].includes(inv.status)).length;
    const paidInvoices = invoices.filter(inv => inv.status === "paid").length;

    return {
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      pending_invoices: pendingInvoices,
      paid_invoices: paidInvoices,
      recent_invoices: invoices.slice(-5).reverse(),
      recent_expenses: expenses.slice(-5).reverse()
    };
  }
};

// Axios interceptor setup
export const setupMockApi = () => {
  // Override axios to use mock API
  const originalPost = axios.post;
  const originalGet = axios.get;
  const originalPut = axios.put;
  const originalDelete = axios.delete;

  axios.post = async (url, data, config) => {
    try {
      if (url.includes("/auth/register")) {
        const result = await mockApi.register(data.email, data.password, data.business_name);
        return { data: result };
      }
      if (url.includes("/auth/login")) {
        const result = await mockApi.login(data.email, data.password);
        return { data: result };
      }
      if (url.includes("/invoices") && !url.includes("/invoices/")) {
        const result = await mockApi.createInvoice(data);
        return { data: result };
      }
      if (url.includes("/expenses") && !url.includes("/expenses/")) {
        const result = await mockApi.createExpense(data);
        return { data: result };
      }
    } catch (error) {
      return Promise.reject(error);
    }
    return originalPost.call(axios, url, data, config);
  };

  axios.get = async (url, config) => {
    try {
      if (url.includes("/auth/me")) {
        const result = await mockApi.getMe();
        return { data: result };
      }
      if (url.includes("/profile") && !url.match(/\/profile\//)) {
        const result = await mockApi.getProfile();
        return { data: result };
      }
      if (url.includes("/invoices/") && !url.includes("/invoices/new")) {
        const id = url.split("/").pop();
        const result = await mockApi.getInvoice(id);
        return { data: result };
      }
      if (url.includes("/invoices") && !url.includes("/invoices/")) {
        const result = await mockApi.getInvoices();
        return { data: result };
      }
      if (url.includes("/expenses/")) {
        const id = url.split("/").pop();
        const result = await mockApi.getExpense(id);
        return { data: result };
      }
      if (url.includes("/expenses") && !url.includes("/expenses/")) {
        const result = await mockApi.getExpenses();
        return { data: result };
      }
      if (url.includes("/dashboard")) {
        const result = await mockApi.getDashboard();
        return { data: result };
      }
    } catch (error) {
      return Promise.reject(error);
    }
    return originalGet.call(axios, url, config);
  };

  axios.put = async (url, data, config) => {
    try {
      if (url.includes("/profile") && !url.includes("/profile/")) {
        const result = await mockApi.updateProfile(data);
        return { data: result };
      }
      if (url.includes("/invoices/")) {
        const id = url.split("/").pop();
        const result = await mockApi.updateInvoice(id, data);
        return { data: result };
      }
      if (url.includes("/expenses/")) {
        const id = url.split("/").pop();
        const result = await mockApi.updateExpense(id, data);
        return { data: result };
      }
    } catch (error) {
      return Promise.reject(error);
    }
    return originalPut.call(axios, url, data, config);
  };

  axios.delete = async (url, config) => {
    try {
      if (url.includes("/invoices/")) {
        const id = url.split("/").pop();
        const result = await mockApi.deleteInvoice(id);
        return { data: result };
      }
      if (url.includes("/expenses/")) {
        const id = url.split("/").pop();
        const result = await mockApi.deleteExpense(id);
        return { data: result };
      }
    } catch (error) {
      return Promise.reject(error);
    }
    return originalDelete.call(axios, url, config);
  };
};

export default mockApi;
