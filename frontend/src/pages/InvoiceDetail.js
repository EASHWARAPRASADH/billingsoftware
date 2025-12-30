import { API } from "@/App";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { ArrowLeft, Download, Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [invoiceRes, profileRes] = await Promise.all([
        axios.get(`${API}/invoices/${id}`),
        axios.get(`${API}/profile`)
      ]);
      setInvoice(invoiceRes.data);
      setProfile(profileRes.data);
    } catch (error) {
      toast.error("Failed to load invoice");
      navigate("/invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/invoices/${id}`);
      toast.success("Invoice deleted successfully");
      navigate("/invoices");
    } catch (error) {
      toast.error("Failed to delete invoice");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="skeleton h-96 rounded-2xl"></div>;
  }

  return (
    <div className="space-y-6 fade-in" data-testid="invoice-detail-container">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/invoices")} data-testid="back-to-invoices-btn">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-sky-700 to-sky-500 bg-clip-text text-transparent">Invoice Details</h1>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={handlePrint} data-testid="print-invoice-btn">
            <Download size={20} className="mr-2" />
            Print
          </Button>
          <Link to={`/invoices/${id}/edit`}>
            <Button variant="outline" data-testid="edit-invoice-btn">
              <Edit size={20} className="mr-2" />
              Edit
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" data-testid="delete-invoice-trigger">
                <Trash2 size={20} className="mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this invoice? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} data-testid="confirm-delete-invoice-btn">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Invoice Display */}
      <div className="glass rounded-2xl p-6 scale-in invoice-container" data-testid="invoice-display">
        {/* Auto Placement: Logo */}
        <div className="invoice-header">
          <img src="/images/logo.png" alt="Company Logo" className="logo-left" />
        </div>
        {/* Header */}
        <div className="flex justify-between mb-4 pb-4 border-b">
          <div className="flex items-start gap-4">
            {/* Logo removed from here to use absolute positioning */}
            <div className="ml-24"> {/* Reduced from ml-32 to match smaller logo */}
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{profile?.businessName}</h2>
              {profile?.email && <p className="text-gray-600">{profile.email}</p>}
              {profile?.phone && <p className="text-gray-600">{profile.phone}</p>}
              {profile?.address && <p className="text-gray-600">{profile.address}</p>}
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">INVOICE</h3>
            <p className="text-gray-600" data-testid="invoice-number">{invoice.invoiceNumber}</p>
            <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full status-${invoice.status}`}>
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Client & Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">BILL TO:</h4>
            <p className="font-semibold text-gray-800">{invoice.clientName}</p>
            {invoice.clientEmail && <p className="text-gray-600">{invoice.clientEmail}</p>}
            {invoice.clientAddress && <p className="text-gray-600">{invoice.clientAddress}</p>}
          </div>
          <div className="text-right">
            <div className="mb-2">
              <span className="text-sm font-semibold text-gray-600">Issue Date: </span>
              <span className="text-gray-800" data-testid="invoice-issue-date">{invoice.issueDate}</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-600">Due Date: </span>
              <span className="text-gray-800" data-testid="invoice-due-date">{invoice.dueDate}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-4">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 font-semibold text-gray-700">Description</th>
                <th className="text-right py-3 font-semibold text-gray-700">Quantity</th>
                <th className="text-right py-3 font-semibold text-gray-700">Rate</th>
                <th className="text-right py-3 font-semibold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3">{item.description}</td>
                  <td className="text-right py-3">{item.quantity}</td>
                  <td className="text-right py-3">₹{parseFloat(item.rate).toFixed(2)}</td>
                  <td className="text-right py-3 font-semibold">₹{parseFloat(item.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-4">
          <div className="w-full md:w-1/3 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold" data-testid="invoice-subtotal">₹{parseFloat(invoice.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax (18% GST):</span>
              <span className="font-semibold" data-testid="invoice-tax">₹{parseFloat(invoice.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t-2 pt-2">
              <span>Total:</span>
              <span data-testid="invoice-total">₹{parseFloat(invoice.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold text-gray-600 mb-2">NOTES:</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        {/* Auto Placement: Signature */}
        <div className="invoice-footer">
          <div className="signature-container">
            <img src="/images/CEO-Sign.png" alt="CEO Signature" className="signature-right" />
            <div className="signature-text">
              <p className="signature-name">Arun G</p>
              <p className="signature-title">CHIEF EXECUTIVE OFFICER</p>
              <p className="signature-auth">AUTHORISED SIGNATORY BY</p>
              <p className="signature-company">Technosprint Info Solutions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
