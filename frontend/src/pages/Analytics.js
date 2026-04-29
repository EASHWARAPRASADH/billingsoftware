import { Button } from "@/components/ui/button";
import { expenseService } from "@/services/expenseService";
import { invoiceService } from "@/services/invoiceService";
import { DollarSign, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

const COLORS = ["#0ea5e9", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#6366f1", "#d946ef"];

export default function Analytics() {
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState("monthly");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [{ data: expensesData }, { data: invoicesData }] = await Promise.all([
        expenseService.getAll(),
        invoiceService.getAll()
      ]);
      setExpenses(expensesData || []);
      setInvoices(invoicesData || []);
    } catch (error) {
      console.error("Fetch analytics error:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const processExpensesByCategory = () => {
    if (!Array.isArray(expenses)) return [];
    const categoryMap = {};
    expenses.forEach((exp) => {
      // Ensure amount is a number
      const amount = parseFloat(exp.amount) || 0;
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + amount;
    });
    return Object.entries(categoryMap).map(([name, value], idx) => ({ id: `cat-${idx}`, name, value }));
  };

  const processMonthlyExpenses = () => {
    if (!Array.isArray(expenses)) return [];
    const monthMap = {};

    expenses.forEach((exp) => {
      const date = new Date(exp.expense_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const amount = parseFloat(exp.amount) || 0;
      monthMap[monthKey] = (monthMap[monthKey] || 0) + amount;
    });

    const sortedMonths = Object.keys(monthMap).sort();
    return sortedMonths.slice(-6).map((month, idx) => ({
      id: `exp-${idx}`,
      month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      expenses: monthMap[month]
    }));
  };

  const processMonthlyRevenue = () => {
    if (!Array.isArray(invoices)) return [];
    const monthMap = {};

    invoices.forEach((inv) => {
      if (inv.status === "paid") {
        const date = new Date(inv.invoice_date); // Supabase field: invoice_date
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const total = parseFloat(inv.total_amount) || 0; // Supabase field: total_amount
        monthMap[monthKey] = (monthMap[monthKey] || 0) + total;
      }
    });

    const sortedMonths = Object.keys(monthMap).sort();
    return sortedMonths.slice(-6).map((month, idx) => ({
      id: `rev-${idx}`,
      month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      revenue: monthMap[month]
    }));
  };

  const processProfitTrends = () => {
    const monthMap = {};

    if (Array.isArray(invoices)) {
      invoices.forEach((inv) => {
        if (inv.status === "paid") {
          const date = new Date(inv.invoice_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          const total = parseFloat(inv.total_amount) || 0;
          monthMap[monthKey] = (monthMap[monthKey] || { revenue: 0, expenses: 0 });
          monthMap[monthKey].revenue += total;
        }
      });
    }

    if (Array.isArray(expenses)) {
      expenses.forEach((exp) => {
        const date = new Date(exp.expense_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const amount = parseFloat(exp.amount) || 0;
        monthMap[monthKey] = (monthMap[monthKey] || { revenue: 0, expenses: 0 });
        monthMap[monthKey].expenses += amount;
      });
    }

    const sortedMonths = Object.keys(monthMap).sort();
    return sortedMonths.slice(-6).map((month, idx) => {
      const data = monthMap[month];
      return {
        id: `profit-${idx}`,
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses
      };
    });
  };

  const processYearlyExpenses = () => {
    if (!Array.isArray(expenses)) return [];
    const yearMap = {};
    expenses.forEach((exp) => {
      const year = new Date(exp.expense_date).getFullYear().toString();
      const amount = parseFloat(exp.amount) || 0;
      yearMap[year] = (yearMap[year] || 0) + amount;
    });
    return Object.keys(yearMap).sort().map(year => ({
      year,
      expenses: yearMap[year]
    }));
  };

  const processYearlyRevenue = () => {
    if (!Array.isArray(invoices)) return [];
    const yearMap = {};
    invoices.forEach((inv) => {
      if (inv.status === "paid") {
        const year = new Date(inv.invoice_date).getFullYear().toString();
        const total = parseFloat(inv.total_amount) || 0;
        yearMap[year] = (yearMap[year] || 0) + total;
      }
    });
    return Object.keys(yearMap).sort().map(year => ({
      year,
      revenue: yearMap[year]
    }));
  };

  const processYearlyProfit = () => {
    const yearMap = {};

    if (Array.isArray(invoices)) {
      invoices.forEach((inv) => {
        if (inv.status === "paid") {
          const year = new Date(inv.invoice_date).getFullYear().toString();
          const total = parseFloat(inv.total_amount) || 0;
          yearMap[year] = (yearMap[year] || { revenue: 0, expenses: 0 });
          yearMap[year].revenue += total;
        }
      });
    }

    if (Array.isArray(expenses)) {
      expenses.forEach((exp) => {
        const year = new Date(exp.expense_date).getFullYear().toString();
        const amount = parseFloat(exp.amount) || 0;
        yearMap[year] = (yearMap[year] || { revenue: 0, expenses: 0 });
        yearMap[year].expenses += amount;
      });
    }

    return Object.keys(yearMap).sort().map(year => ({
      year,
      revenue: yearMap[year].revenue,
      expenses: yearMap[year].expenses,
      profit: yearMap[year].revenue - yearMap[year].expenses
    }));
  };

  const expensesByCategory = processExpensesByCategory();
  const monthlyExpenses = processMonthlyExpenses();
  const monthlyRevenue = processMonthlyRevenue();
  const profitTrends = processProfitTrends();

  const yearlyExpenses = processYearlyExpenses();
  const yearlyRevenue = processYearlyRevenue();
  const yearlyProfit = processYearlyProfit();

  const currentExpensesData = viewType === "monthly" ? monthlyExpenses : yearlyExpenses;
  const currentRevenueData = viewType === "monthly" ? monthlyRevenue : yearlyRevenue;
  const currentProfitData = viewType === "monthly" ? profitTrends : yearlyProfit;
  const xAxisKey = viewType === "monthly" ? "month" : "year";

  const totalExpenses = Array.isArray(expenses)
    ? expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)
    : 0;
  const totalRevenue = Array.isArray(invoices)
    ? invoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0)
    : 0;
  const totalProfit = totalRevenue - totalExpenses;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-32 rounded-2xl"></div>
        <div className="skeleton h-96 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in" data-testid="analytics-container">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-sky-700 to-sky-500 bg-clip-text text-transparent">Analytics & Reports</h1>
        <div className="analytics-filters space-x-2">
          <Button
            variant={viewType === "monthly" ? "default" : "outline"}
            onClick={() => setViewType("monthly")}
          >
            Monthly
          </Button>
          <Button
            variant={viewType === "yearly" ? "default" : "outline"}
            onClick={() => setViewType("yearly")}
          >
            Yearly
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6 scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
            <div className="p-3 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600">
              <DollarSign className="text-white" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800" data-testid="total-revenue-analytics">₹{totalRevenue.toFixed(2)}</p>
        </div>

        <div className="glass rounded-2xl p-6 scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Expenses</h3>
            <div className="p-3 rounded-xl bg-gradient-to-br from-sky-300 to-sky-500">
              <DollarSign className="text-white" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800" data-testid="total-expenses-analytics">₹{totalExpenses.toFixed(2)}</p>
        </div>

        <div className="glass rounded-2xl p-6 scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Net Profit</h3>
            <div className={`p-3 rounded-xl bg-gradient-to-br ${totalProfit >= 0 ? "from-blue-400 to-sky-600" : "from-red-400 to-pink-500"}`}>
              <TrendingUp className="text-white" size={20} />
            </div>
          </div>
          <p className={`text-3xl font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`} data-testid="net-profit-analytics">
            ₹{totalProfit.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category */}
        <div className="glass rounded-2xl p-6 slide-in">
          <h2 className="text-xl font-semibold text-sky-900 mb-4">Expenses by Category</h2>
          {expensesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, value }) => `${name}: ₹${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={entry.id || `cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">No expense data available</div>
          )}
        </div>

        {/* Monthly/Yearly Expenses Trend */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{viewType === 'monthly' ? 'Monthly' : 'Yearly'} Expenses Trend</h2>
          {currentExpensesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={currentExpensesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey={xAxisKey} stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                  formatter={(value) => `₹${value.toFixed(2)}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ fill: "#0ea5e9", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">No expense data available</div>
          )}
        </div>

        {/* Monthly/Yearly Revenue Trend */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{viewType === 'monthly' ? 'Monthly' : 'Yearly'} Revenue Trend</h2>
          {currentRevenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={currentRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey={xAxisKey} stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                  formatter={(value) => `₹${value.toFixed(2)}`}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">No revenue data available</div>
          )}
        </div>

        {/* Profit/Loss Trend */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Profit/Loss Trend</h2>
          {currentProfitData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={currentProfitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey={xAxisKey} stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                  formatter={(value) => `₹${value.toFixed(2)}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    const color = payload.profit >= 0 ? "#10b981" : "#ef4444";
                    return <circle cx={cx} cy={cy} r={4} fill={color} />;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">No data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
