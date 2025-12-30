import { API } from "@/App";
import axios from "axios";
import { ArrowRight, Calendar, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD format
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API}/dashboard`);
      setStats(response.data);
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-32 rounded-2xl"></div>
        <div className="skeleton h-32 rounded-2xl"></div>
        <div className="skeleton h-64 rounded-2xl"></div>
      </div>
    );
  }

  // Safety check: if stats is null or undefined, show error state
  if (!stats) {
    return (
      <div className="space-y-6 fade-in bg-gray-50 -m-8 p-8 min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Unable to Load Dashboard</h2>
          <p className="text-red-600 mb-4">The backend server is not responding. Please ensure:</p>
          <ul className="text-left text-red-700 space-y-2 max-w-md mx-auto">
            <li>• MySQL database is running</li>
            <li>• Backend server is started (run: <code className="bg-red-100 px-2 py-1 rounded">npm start</code> in backend folder)</li>
            <li>• Backend is accessible at <code className="bg-red-100 px-2 py-1 rounded">http://localhost:8000</code></li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats from actual invoice and expense data
  const totalRevenue = stats.totalRevenue || 0;
  const totalExpenses = stats.totalExpenses || 0;
  const totalInvoices = stats.recentInvoices?.length || 0;
  const paidInvoices = stats.paidInvoices || 0;

  // Calculate percentages based on actual data
  const maxRevenue = Math.max(totalRevenue * 1.2, 10000); // Dynamic max based on actual revenue
  const revenuePercentage = Math.min(Math.round((totalRevenue / maxRevenue) * 100), 100);

  const maxExpenses = Math.max(totalExpenses * 1.2, 5000); // Dynamic max based on actual expenses
  const expensesPercentage = Math.min(Math.round((totalExpenses / maxExpenses) * 100), 100);

  const maxInvoices = Math.max(totalInvoices * 1.2, 10); // Dynamic max based on actual invoices
  const invoicesPercentage = Math.min(Math.round((totalInvoices / maxInvoices) * 100), 100);

  // CircularProgress component
  const CircularProgress = ({ percentage, color = "#FF6B6B" }) => {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-16 h-16">
        <svg className="transform -rotate-90" width="64" height="64">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="#f3f4f6"
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold" style={{ color }}>{percentage}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 fade-in bg-gray-50 -m-8 p-8 min-h-screen" data-testid="dashboard-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">
          Welcome to the TS-Billing
        </h1>
        <div className="flex items-center gap-3">
          {/* Date Picker */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 cursor-pointer">
              <Calendar size={18} className="text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm text-gray-700 border-none outline-none bg-transparent cursor-pointer"
              />
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-xs text-gray-500 mb-3">Total revenue from paid invoices</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toFixed(2)}</p>
            </div>
            <CircularProgress percentage={revenuePercentage} color="#10B981" />
          </div>
          <button
            onClick={() => navigate('/analytics')}
            className="w-full mt-4 bg-blue-500 text-white text-sm py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors"
          >
            See all reports
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Expenses */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Expenses</p>
              <p className="text-xs text-gray-500 mb-3">Total expenses recorded</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalExpenses.toFixed(2)}</p>
            </div>
            <CircularProgress percentage={expensesPercentage} color="#EF4444" />
          </div>
          <button
            onClick={() => navigate('/expenses')}
            className="w-full mt-4 bg-blue-500 text-white text-sm py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors"
          >
            See all reports
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Total Invoices */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Invoices</p>
              <p className="text-xs text-gray-500 mb-3">All invoices created</p>
              <p className="text-2xl font-bold text-gray-900">{totalInvoices}</p>
            </div>
            <CircularProgress percentage={invoicesPercentage} color="#3B82F6" />
          </div>
          <button
            onClick={() => navigate('/invoices')}
            className="w-full mt-4 bg-blue-500 text-white text-sm py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors"
          >
            See all reports
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Bottom Section: Recent Invoices & Client List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
              <p className="text-sm text-gray-500">Latest invoices from your store</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Total:</span>
              <span className="text-blue-600 font-medium">{stats.recentInvoices?.length || 0}</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">No</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">Invoice Number</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">Client</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">Amount</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">Date</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentInvoices?.slice(0, 3).map((invoice, index) => (
                  <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-700">{index + 1}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-xs font-semibold text-blue-600">
                          📄
                        </div>
                        <span className="text-sm text-gray-900 font-medium">{invoice.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-700">{invoice.clientName}</td>
                    <td className="py-3 px-2 text-sm text-gray-900 font-semibold">₹{parseFloat(invoice.total).toFixed(2)}</td>
                    <td className="py-3 px-2 text-xs text-gray-500">
                      {new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                        invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Client List */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Client List</h2>
              <p className="text-sm text-gray-500">Unique clients from your invoices</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Total:</span>
              <span className="text-blue-600 font-medium">
                {stats.recentInvoices ? [...new Set(stats.recentInvoices.map(inv => inv.clientName))].length : 0}
              </span>
            </div>
          </div>

          {/* Client Items */}
          <div className="space-y-3">
            {stats.recentInvoices && (() => {
              // Get unique clients
              // Get unique clients (filter out null/undefined)
              const uniqueClients = [...new Set(stats.recentInvoices
                .map(inv => inv.clientName)
                .filter(name => name))];

              return uniqueClients.slice(0, 5).map((clientName, index) => {
                // Count invoices for this client
                const clientInvoices = stats.recentInvoices.filter(inv => inv.clientName === clientName);
                const invoiceCount = clientInvoices.length;
                const totalAmount = clientInvoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);

                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                        {(clientName || "?").substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{clientName}</p>
                        <p className="text-xs text-gray-500">{invoiceCount} invoice{invoiceCount !== 1 ? 's' : ''} • ₹{totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-sm font-semibold text-gray-900">₹{totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
