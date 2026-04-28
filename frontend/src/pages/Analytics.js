import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { expenseService } from "@/services/expenseService";
import { invoiceService } from "@/services/invoiceService";
import { BarChart3, Calendar, Filter, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

const COLORS = ["#0ea5e9", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#6366f1", "#d946ef"];

export default function Analytics() {
  const { currencySymbol } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [processedData, setProcessedData] = useState(null);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, expRes] = await Promise.all([
        invoiceService.getAll(),
        expenseService.getAll()
      ]);

      if (invRes.error) throw invRes.error;
      if (expRes.error) throw expRes.error;

      const filteredInvoices = (invRes.data || []).filter(inv => {
        const date = (inv.invoice_date || "").split(' ')[0];
        return date >= startDate && date <= endDate;
      });

      const filteredExpenses = (expRes.data || []).filter(exp => {
        const date = (exp.expense_date || "").split(' ')[0];
        return date >= startDate && date <= endDate;
      });

      processAnalytics(filteredInvoices, filteredExpenses);
    } catch (error) {
      console.error("Analytics fetch error:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const processAnalytics = (invoices, expenses) => {
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const avgInvoiceValue = paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;

    // Monthly trends
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTrends = months.map((month, idx) => {
      const monthInvoices = paidInvoices.filter(inv => new Date(inv.invoice_date).getMonth() === idx);
      const monthExpenses = expenses.filter(exp => new Date(exp.expense_date).getMonth() === idx);
      
      return {
        name: month,
        revenue: monthInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0),
        expenses: monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
      };
    }).filter(m => m.revenue > 0 || m.expenses > 0);

    // Expense distribution
    const expenseCategories = {};
    expenses.forEach(exp => {
      const cat = exp.category || 'Other';
      expenseCategories[cat] = (expenseCategories[cat] || 0) + parseFloat(exp.amount || 0);
    });

    const expenseDistribution = Object.entries(expenseCategories).map(([name, value]) => ({ name, value }));

    setProcessedData({
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        avgInvoiceValue,
        invoiceCount: paidInvoices.length
      },
      monthlyTrends,
      expenseDistribution
    });
  };

  if (loading || !processedData) {
    return <div className="skeleton h-96 rounded-2xl"></div>;
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-sky-700 to-sky-500 bg-clip-text text-transparent">Financial Analytics</h1>
          <p className="text-gray-500 mt-2">Deep dive into your business performance</p>
        </div>
        <div className="flex flex-wrap gap-3 glass p-2 rounded-xl">
          <div className="flex items-center gap-2 px-3 border-r">
            <Calendar size={16} className="text-sky-600" />
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm font-medium focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 px-3">
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm font-medium focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass rounded-2xl p-6 hover-up border-b-4 border-green-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
          <h3 className="text-3xl font-bold text-gray-900">{currencySymbol}{processedData.summary.totalRevenue.toFixed(2)}</h3>
          <p className="text-xs text-green-600 mt-2 font-medium">From {processedData.summary.invoiceCount} paid invoices</p>
        </div>

        <div className="glass rounded-2xl p-6 hover-up border-b-4 border-red-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <TrendingDown size={20} />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">Total Expenses</p>
          <h3 className="text-3xl font-bold text-gray-900">{currencySymbol}{processedData.summary.totalExpenses.toFixed(2)}</h3>
          <p className="text-xs text-gray-500 mt-2">Operational overhead</p>
        </div>

        <div className="glass rounded-2xl p-6 hover-up border-b-4 border-blue-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <BarChart3 size={20} />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">Net Profit</p>
          <h3 className={`text-3xl font-bold ${processedData.summary.netProfit >= 0 ? "text-blue-600" : "text-red-600"}`}>
            {currencySymbol}{processedData.summary.netProfit.toFixed(2)}
          </h3>
          <p className="text-xs text-gray-500 mt-2 font-medium">
            Margin: {processedData.summary.totalRevenue > 0 ? ((processedData.summary.netProfit / processedData.summary.totalRevenue) * 100).toFixed(1) : 0}%
          </p>
        </div>

        <div className="glass rounded-2xl p-6 hover-up border-b-4 border-purple-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Filter size={20} />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">Avg. Invoice</p>
          <h3 className="text-3xl font-bold text-purple-600">{currencySymbol}{processedData.summary.avgInvoiceValue.toFixed(2)}</h3>
          <p className="text-xs text-gray-500 mt-2">Per paid customer</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Revenue vs Expenses</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={processedData.monthlyTrends}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} tickFormatter={(val) => `${currencySymbol}${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(val) => [`${currencySymbol}${parseFloat(val).toFixed(2)}`, '']}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExp)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Expense Distribution</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData.expenseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {processedData.expenseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val) => `${currencySymbol}${parseFloat(val).toFixed(2)}`}
                  contentStyle={{ borderRadius: '12px', border: 'none' }}
                />
                <Legend verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
