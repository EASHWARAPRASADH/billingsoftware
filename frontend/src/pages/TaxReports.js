import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/config/supabase";
import { invoiceService } from "@/services/invoiceService";
import { Calculator, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

export default function TaxReports() {
  const [invoices, setInvoices] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Parallel fetch for invoices and profile
      const [invoicesData, profileRes] = await Promise.all([
        invoiceService.getAll().then(res => res.data || []),
        supabase.auth.getUser().then(async ({ data: { user } }) => {
          if (user) {
            return supabase
              .from('business_profiles')
              .select('*')
              .eq('user_id', user.id)
              .single()
              .then(res => res.data);
          }
          return null;
        })
      ]);

      setInvoices(invoicesData);

      if (profileRes) {
        setProfile({
          taxRate: 0, // Not strictly in schema, but kept for logic if we added it
          currency: "INR",
          ...profileRes
        });
      }
    } catch (error) {
      console.error("Fetch tax data error:", error);
      toast.error("Failed to load tax data");
    } finally {
      setLoading(false);
    }
  };

  const calculateTaxByMonth = () => {
    const monthMap = {};

    invoices.forEach((inv) => {
      // Map Supabase fields
      const issueDate = inv.invoice_date;
      const subtotal = parseFloat(inv.subtotal || 0);
      const taxAmount = parseFloat(inv.tax_amount || 0);

      const date = new Date(issueDate);
      const year = date.getFullYear();
      if (year.toString() === selectedYear) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (!monthMap[monthKey]) {
          monthMap[monthKey] = {
            subtotal: 0,
            tax: 0,
            count: 0
          };
        }
        monthMap[monthKey].subtotal += subtotal;
        monthMap[monthKey].tax += taxAmount;
        monthMap[monthKey].count += 1;
      }
    });

    const sortedMonths = Object.keys(monthMap).sort();
    return sortedMonths.map((month) => {
      const data = monthMap[month];
      return {
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        subtotal: data.subtotal,
        tax: data.tax,
        count: data.count
      };
    });
  };

  const calculateAnnualTaxSummary = () => {
    const yearMap = {};

    invoices.forEach((inv) => {
      const issueDate = inv.invoice_date;
      const subtotal = parseFloat(inv.subtotal || 0);
      const taxAmount = parseFloat(inv.tax_amount || 0);

      const date = new Date(issueDate);
      const year = date.getFullYear();
      if (!yearMap[year]) {
        yearMap[year] = {
          subtotal: 0,
          tax: 0,
          count: 0,
          avgTaxRate: 0
        };
      }
      yearMap[year].subtotal += subtotal;
      yearMap[year].tax += taxAmount;
      yearMap[year].count += 1;
    });

    Object.keys(yearMap).forEach((year) => {
      const data = yearMap[year];
      data.avgTaxRate = data.subtotal > 0 ? ((data.tax / data.subtotal) * 100) : 0;
    });

    return yearMap;
  };

  const monthlyTaxData = calculateTaxByMonth();
  const annualTaxData = calculateAnnualTaxSummary();
  const selectedYearData = annualTaxData[selectedYear] || { subtotal: 0, tax: 0, count: 0, avgTaxRate: 0 };

  const getTaxFilingStatus = () => {
    const monthlyData = monthlyTaxData;
    if (monthlyData.length === 0) return "No Data";
    const lastMonth = new Date(monthlyData[monthlyData.length - 1].month);
    const now = new Date();
    const daysSinceLast = Math.floor((now - lastMonth) / (1000 * 60 * 60 * 24));

    if (daysSinceLast > 90) {
      return "Overdue";
    } else if (daysSinceLast > 30) {
      return "Due Soon";
    }
    return "Current";
  };

  const handleExportReport = () => {
    toast.success("Tax report ready for download");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-32 rounded-2xl"></div>
        <div className="skeleton h-96 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in" data-testid="tax-reports-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-sky-700 to-sky-500 bg-clip-text text-transparent">Tax Reports (India GST)</h1>
        <Button
          onClick={handleExportReport}
          className="bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 transition-all duration-300"
          data-testid="export-tax-report-btn"
        >
          <Download size={20} className="mr-2" />
          Export PDF
        </Button>
      </div>

      {/* Year Selector and Status */}
      <div className="glass rounded-2xl p-6 slide-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-2">Select Year</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger data-testid="year-select">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(annualTaxData)
                  .sort()
                  .reverse()
                  .map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <div>
              <p className="text-sm text-gray-600 mb-1">Filing Status</p>
              <p className={`text-lg font-semibold px-3 py-1 rounded-full inline-block ${getTaxFilingStatus() === "Current" ? "bg-green-100 text-green-700" :
                getTaxFilingStatus() === "Due Soon" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`} data-testid="filing-status">
                {getTaxFilingStatus()}
              </p>
            </div>
          </div>

          <div className="flex items-end">
            <p className="text-sm text-gray-600">Last Report Generated:</p>
            <p className="font-semibold ml-2">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Tax Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass rounded-2xl p-6 scale-in">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-800" data-testid="tax-total-revenue">
            ₹{selectedYearData.subtotal.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{selectedYearData.count} invoices</p>
        </div>

        <div className="glass rounded-2xl p-6 scale-in">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Tax Collected</h3>
          <p className="text-3xl font-bold text-blue-600" data-testid="tax-collected">
            ₹{selectedYearData.tax.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{selectedYearData.avgTaxRate.toFixed(2)}% average rate</p>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Tax Rate Profile</h3>
          <p className="text-3xl font-bold text-purple-600" data-testid="profile-tax-rate">
            {profile?.taxRate || 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Business tax setting</p>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Remaining Balance</h3>
          <p className="text-3xl font-bold text-green-600" data-testid="tax-remaining">
            ₹{(selectedYearData.subtotal - selectedYearData.tax).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">After tax collection</p>
        </div>
      </div>

      {/* Monthly Tax Chart */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Monthly Tax Collection - {selectedYear}</h2>
        {monthlyTaxData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyTaxData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                formatter={(value) => `₹${value.toFixed(2)}`}
              />
              <Legend />
              <Bar dataKey="subtotal" fill="#0ea5e9" name="Subtotal" radius={[8, 8, 0, 0]} />
              <Bar dataKey="tax" fill="#ef4444" name="Tax Collected" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-500">No tax data available for {selectedYear}</div>
        )}
      </div>

      {/* Monthly Tax Table */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Detailed Monthly Breakdown</h2>
        {monthlyTaxData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Month</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Invoices</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Subtotal</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Tax Rate</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Tax Collected</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTaxData.map((month, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-white/50">
                    <td className="py-3 px-4 font-medium">{month.month}</td>
                    <td className="py-3 px-4 text-right">{month.count}</td>
                    <td className="py-3 px-4 text-right font-semibold">₹{month.subtotal.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">{profile?.taxRate || 0}%</td>
                    <td className="py-3 px-4 text-right font-semibold text-blue-600">₹{month.tax.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No tax data available for {selectedYear}</p>
        )}
      </div>

      {/* Tax Information Section */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calculator size={24} />
          Tax Information
        </h2>
        <div className="space-y-3 text-gray-700">
          <p>
            <strong>Tax Rate Applied:</strong> {profile?.taxRate || 0}% on all invoices
          </p>
          <p>
            <strong>Currency:</strong> {profile?.currency || "INR"}
          </p>
          <p>
            <strong>Reporting Period:</strong> Year {selectedYear}
          </p>
          <p>
            <strong>Total Tax Collected:</strong> ₹{selectedYearData.tax.toFixed(2)} across {selectedYearData.count} invoices
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              💡 <strong>Tip:</strong> Keep these tax reports for your records and accounting purposes. The tax collected amount should match your quarterly or annual tax filing requirements based on your jurisdiction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
