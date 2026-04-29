import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { invoiceService } from "@/services/invoiceService";
import { Search, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function PaymentStatus() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await invoiceService.getAll();
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error("Fetch invoices error:", error);
      toast.error("Failed to load payment status");
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    return (
      (invoice.client_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.invoice_number || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return <div className="skeleton h-96 rounded-2xl"></div>;
  }

  // Calculate totals
  const totalReceived = invoices.reduce((sum, inv) => {
      // If status is paid, assume full amount is received if field is missing
      const received = parseFloat(inv.amount_received || (inv.status === 'paid' ? inv.total_amount : 0));
      return sum + received;
  }, 0);

  const totalPending = invoices.reduce((sum, inv) => {
      const total = parseFloat(inv.total_amount || 0);
      const received = parseFloat(inv.amount_received || (inv.status === 'paid' ? inv.total_amount : 0));
      return sum + (total - received);
  }, 0);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-sky-700 to-sky-500 bg-clip-text text-transparent">Payment Status</h1>
          <p className="text-gray-500 mt-2">Track collections and pending amounts</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6">
          <p className="text-sm font-medium text-gray-500">Total Received</p>
          <h3 className="text-2xl font-bold text-green-600">
            ₹{totalReceived.toFixed(2)}
          </h3>
        </div>
        <div className="glass rounded-2xl p-6">
          <p className="text-sm font-medium text-gray-500">Total Pending</p>
          <h3 className="text-2xl font-bold text-red-500">
            ₹{totalPending.toFixed(2)}
          </h3>
        </div>
        <div className="glass rounded-2xl p-6">
          <p className="text-sm font-medium text-gray-500">Overdue Invoices</p>
          <h3 className="text-2xl font-bold text-orange-500">
            {invoices.filter(inv => inv.status === 'overdue').length}
          </h3>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-6 slide-in">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search by client or invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Payment Table */}
      <div className="glass rounded-2xl p-6 scale-in">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Invoice No</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Client Info</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount Received</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount Pending</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => {
                const total = parseFloat(invoice.total_amount || 0);
                const received = parseFloat(invoice.amount_received || (invoice.status === 'paid' ? total : 0));
                const pending = total - received;

                return (
                  <tr key={invoice.id} className="border-b border-gray-100 hover:bg-white/50">
                    <td className="py-3 px-4 font-medium">{invoice.invoice_number}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{invoice.client_name}</p>
                      <p className="text-xs text-gray-500">{invoice.client_phone || 'No Phone'}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{invoice.invoice_date}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-3 py-1 rounded-full status-${invoice.status}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600">₹{received.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-red-500">₹{pending.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <Link to={`/invoices/${invoice.id}`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink size={16} />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
