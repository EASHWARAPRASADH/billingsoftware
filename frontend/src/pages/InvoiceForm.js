import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { AlertCircle, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: "",
    status: "draft",
    notes: "",
    items: [
      { description: "", quantity: 1, rate: 0, amount: 0 }
    ]
  });
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const [taxRate, setTaxRate] = useState(0);

  useEffect(() => {
    fetchProfile();
    if (isEdit) {
      fetchInvoice();
    }
  }, [id]);

  useEffect(() => {
    // Debounce duplicate check
    const timer = setTimeout(() => {
      checkDuplicate();
    }, 800);

    return () => clearTimeout(timer);
  }, [formData.clientName, formData.issueDate, formData.items, taxRate]);

  const checkDuplicate = async () => {
    // Only check if we have minimum required fields and NOT in edit mode (optional: could warn in edit too but less useful)
    if (isEdit || !formData.clientName || !formData.issueDate) {
      setDuplicateWarning(null);
      return;
    }

    const { total } = calculateTotals();
    if (total <= 0) return;

    try {
      const response = await axios.post(`${API}/invoices/check-duplicate`, {
        clientName: formData.clientName,
        issueDate: formData.issueDate,
        total: total
      });

      if (response.data.exists) {
        setDuplicateWarning(response.data);
      } else {
        setDuplicateWarning(null);
      }
    } catch (error) {
      console.error("Duplicate check failed", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/profile`);
      setTaxRate(response.data.taxRate || 0);
    } catch (error) {
      console.error("Failed to load profile");
    }
  };

  const fetchInvoice = async () => {
    try {
      const response = await axios.get(`${API}/invoices/${id}`);
      setFormData(response.data);
    } catch (error) {
      toast.error("Failed to load invoice");
      navigate("/invoices");
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // Calculate amount
    if (field === "quantity" || field === "rate") {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }

    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, rate: 0, amount: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { subtotal, tax, total } = calculateTotals();
      const payload = {
        ...formData,
        subtotal,
        tax,
        total
      };

      if (isEdit) {
        await axios.put(`${API}/invoices/${id}`, payload);
        toast.success("Invoice updated successfully");
      } else {
        await axios.post(`${API}/invoices`, payload);
        toast.success("Invoice created successfully");
      }
      navigate("/invoices");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save invoice");
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, tax, total } = calculateTotals();

  return (
    <div className="space-y-6 fade-in" data-testid="invoice-form-container">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/invoices")} data-testid="back-btn">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-sky-700 to-sky-500 bg-clip-text text-transparent">
          {isEdit ? "Edit Invoice" : "Create Invoice"}
        </h1>
      </div>

      {duplicateWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md animate-in fade-in slide-in-from-top-2">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Possible Duplicate Invoice
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  A similar invoice ({duplicateWarning.invoiceNumber}) already exists for this client on this date with the same amount.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-6 scale-in">
        {/* Client Details */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-sky-900">Client Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                required
                className="mt-1"
                data-testid="client-name-input"
              />
            </div>
            <div>
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                className="mt-1"
                data-testid="client-email-input"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="clientAddress">Client Address</Label>
            <Textarea
              id="clientAddress"
              value={formData.clientAddress}
              onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
              className="mt-1"
              rows={2}
              data-testid="client-address-input"
            />
          </div>
        </div>

        {/* Invoice Details */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-sky-900">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="issueDate">Issue Date *</Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                required
                className="mt-1"
                data-testid="issue-date-input"
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
                className="mt-1"
                data-testid="due-date-input"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="mt-1" data-testid="status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-sky-900">Line Items</h2>
            <Button type="button" variant="outline" size="sm" onClick={addItem} data-testid="add-item-btn">
              <Plus size={16} className="mr-1" />
              Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end" data-testid={`item-row-${index}`}>
                <div className="col-span-5">
                  {index === 0 && <Label className="text-xs mb-1">Description</Label>}
                  <Input
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    required
                    data-testid={`item-description-${index}`}
                  />
                </div>
                <div className="col-span-2">
                  {index === 0 && <Label className="text-xs mb-1">Qty</Label>}
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                    required
                    min="0"
                    step="0.01"
                    data-testid={`item-quantity-${index}`}
                  />
                </div>
                <div className="col-span-2">
                  {index === 0 && <Label className="text-xs mb-1">Rate</Label>}
                  <Input
                    type="number"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) => handleItemChange(index, "rate", parseFloat(e.target.value) || 0)}
                    required
                    min="0"
                    step="0.01"
                    data-testid={`item-rate-${index}`}
                  />
                </div>
                <div className="col-span-2">
                  {index === 0 && <Label className="text-xs mb-1">Amount</Label>}
                  <Input
                    value={`₹${item.amount.toFixed(2)}`}
                    disabled
                    className="bg-gray-100"
                    data-testid={`item-amount-${index}`}
                  />
                </div>
                <div className="col-span-1">
                  {index === 0 && <div className="h-5"></div>}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={formData.items.length === 1}
                    data-testid={`remove-item-${index}-btn`}
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full md:w-1/3 space-y-2 glass-dark p-4 rounded-xl">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold" data-testid="subtotal-display">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax ({taxRate}% GST):</span>
              <span className="font-semibold" data-testid="tax-display">₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span data-testid="total-display">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="mt-1"
            rows={3}
            placeholder="Additional notes or payment terms..."
            data-testid="notes-input"
          />
        </div>

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate("/invoices")} data-testid="cancel-btn">
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 transition-all duration-300"
            disabled={loading}
            data-testid="save-invoice-btn"
          >
            {loading ? "Saving..." : isEdit ? "Update Invoice" : "Create Invoice"}
          </Button>
        </div>
      </form>
    </div>
  );
}
