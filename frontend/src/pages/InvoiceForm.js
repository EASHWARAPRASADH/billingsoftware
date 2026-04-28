import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/config/supabase";
import { PRODUCTS as STATIC_PRODUCTS } from "@/data/products";
import { cn } from "@/lib/utils";
import { invoiceService } from "@/services/invoiceService";
import { productService } from "@/services/productService";
import { AlertCircle, ArrowLeft, Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
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
    invoiceNumber: "",
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: "",
    status: "draft",
    notes: "",
    amountReceived: 0,
    items: [
      { description: "", quantity: 1, rate: 0, amount: 0, hsn: "" }
    ]
  });
  const [openPopovers, setOpenPopovers] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const [taxValue, setTaxValue] = useState("");
  const [isTaxPercentage, setIsTaxPercentage] = useState(true);
  const [enableShipping, setEnableShipping] = useState(false);
  const [shippingCost, setShippingCost] = useState("");
  const [enableDiscount, setEnableDiscount] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState("");
  const [dynamicProducts, setDynamicProducts] = useState([]);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", hsn_code: "", gst_rate: "18" });
  const [activeItemIndex, setActiveItemIndex] = useState(null);

  // Combine static products from the file with dynamic ones from Supabase
  // Filter out duplicates if a user adds a product that's already in the static list
  const ALL_PRODUCTS = [
    ...STATIC_PRODUCTS,
    ...dynamicProducts.filter(dp => !STATIC_PRODUCTS.some(sp => sp.name === dp.name))
  ];

  useEffect(() => {
    fetchProfile();
    fetchDynamicProducts();
    if (isEdit) {
      fetchInvoice();
    }
  }, [id]);

  const fetchDynamicProducts = async () => {
    const { data } = await productService.getAll();
    if (data) {
      setDynamicProducts(data.map(p => ({
        name: p.name,
        hsn: p.hsn_code,
        gst: p.gst_rate
      })));
    }
  };

  useEffect(() => {
    // Only check duplicates for new invoices
    if (!isEdit) {
      const timer = setTimeout(() => {
        checkDuplicate();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [formData.clientName, formData.issueDate, formData.items, taxValue]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await profileService.get();
      if (data) {
        const globalTaxRate = data.tax_rate || 0;
        if (!taxValue && !isEdit) {
          setTaxValue(globalTaxRate.toString());
          setIsTaxPercentage(true);
        }
      }
    } catch (error) {
      console.error("Failed to load profile", error);
    }
  };

  const checkDuplicate = async () => {
    if (isEdit || !formData.clientName || !formData.issueDate) {
      setDuplicateWarning(null);
      return;
    }

    const { total } = calculateTotals();
    if (total <= 0) return;

    try {
      // Simple client-side check against Supabase
      const { data } = await supabase
        .from('invoices')
        .select('invoice_number, total_amount')
        .eq('client_name', formData.clientName)
        .eq('invoice_date', formData.issueDate)
        .eq('total_amount', total)
        .limit(1);

      if (data && data.length > 0) {
        setDuplicateWarning({ invoiceNumber: data[0].invoice_number });
      } else {
        setDuplicateWarning(null);
      }
    } catch (error) {
      console.error("Duplicate check failed", error);
    }
  };

  const fetchInvoice = async () => {
    try {
      const { data: invoice, error } = await invoiceService.getById(id);
      if (error) throw error;

      setFormData({
        clientName: invoice.client_name,
        clientEmail: invoice.client_email,
        clientAddress: invoice.client_address,
        invoiceNumber: invoice.invoice_number,
        issueDate: invoice.invoice_date,
        dueDate: invoice.due_date,
        status: invoice.status,
        notes: invoice.notes,
        amountReceived: parseFloat(invoice.amount_received || 0),
        items: Array.isArray(invoice.items) ? invoice.items : JSON.parse(invoice.items || '[]')
      });

      // Restore financial settings
      // Note: allow simpler logic since we stripped some complexities during migration
      // but try to infer state from values
      if (invoice.tax_amount > 0) {
        const subtotal = invoice.subtotal || 0;
        const taxAmount = invoice.tax_amount || 0;

        if (subtotal > 0 && taxAmount > 0) {
          // If it's a very round number relative to subtotal, assume it was a rate
          const inferredRate = (taxAmount / subtotal) * 100;
          // Heuristic: if it's an integer or clean 0.5 step, it was likely a rate
          if (Math.abs(inferredRate - Math.round(inferredRate * 2) / 2) < 0.01) {
            setTaxValue(parseFloat(inferredRate.toFixed(2)).toString());
            setIsTaxPercentage(true);
          } else {
            setTaxValue(taxAmount.toString());
            setIsTaxPercentage(false);
          }
        } else {
          setTaxValue("");
          setIsTaxPercentage(true);
        }

        // If it looks like a clean manual amount (not a calc), we could set manualTax too, 
        // but setting taxRate is usually safer for UI consistency unless we track "mode".
        // For backwards compatibility, if it doesn't match effectively, user can adjust.
      }

      if (parseFloat(invoice.shipping_cost) > 0) {
        setEnableShipping(true);
        setShippingCost(invoice.shipping_cost.toString());
      }
      if (parseFloat(invoice.discount_amount) > 0) {
        setEnableDiscount(true);
        setCouponDiscount(invoice.discount_amount.toString());
      }

    } catch (error) {
      toast.error("Failed to load invoice");
      navigate("/invoices");
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    if (field === "quantity" || field === "rate") {
      newItems[index].amount = (parseFloat(newItems[index].quantity) || 0) * (parseFloat(newItems[index].rate) || 0);
    }

    if (field === "description") {
      const product = ALL_PRODUCTS.find((p) => p.name === value);
      if (product) {
        setTaxValue(product.gst.toString());
        setIsTaxPercentage(true);
        newItems[index].hsn = product.hsn;
      }
    }

    setFormData({ ...formData, items: newItems });
  };

  const handleAddNewProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.hsn_code) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const { data, error } = await productService.create(newProduct);
      if (error) throw error;

      toast.success("Product added successfully");
      await fetchDynamicProducts();

      // Auto-select for the active item
      if (activeItemIndex !== null) {
        handleItemChange(activeItemIndex, "description", newProduct.name);
      }

      setIsAddProductModalOpen(false);
      setNewProduct({ name: "", hsn_code: "", gst_rate: "18" });
    } catch (error) {
      toast.error("Failed to add product");
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, rate: 0, amount: 0, hsn: "" }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);

    let tax = 0;
    const tv = parseFloat(taxValue) || 0;
    if (isTaxPercentage) {
      tax = subtotal * (tv / 100);
    } else {
      tax = tv;
    }

    const shipping = parseFloat(shippingCost) || 0;
    const discount = parseFloat(couponDiscount) || 0;
    const total = subtotal + shipping + tax - discount;
    const pending = total - (parseFloat(formData.amountReceived) || 0);

    return { subtotal, tax, total, shippingCost: shipping, couponDiscount: discount, pending };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { subtotal, tax, total, shippingCost: shipping, couponDiscount: discount } = calculateTotals();

      const payload = {
        client_name: formData.clientName,
        client_email: formData.clientEmail,
        client_phone: "", // Add if input exists
        client_address: formData.clientAddress,
        invoice_number: formData.invoiceNumber || `INV-${Date.now()}`, // Fallback if empty
        invoice_date: formData.issueDate,
        due_date: formData.dueDate,
        items: formData.items,
        subtotal,
        tax_amount: tax,
        discount_amount: discount,
        shipping_cost: shipping,
        total_amount: total,
        notes: formData.notes,
        terms: "", // Add if input exists
        status: formData.status,
        amount_received: parseFloat(formData.amountReceived) || 0
      };

      if (isEdit) {
        const { error } = await invoiceService.update(id, payload);
        if (error) throw error;
        toast.success("Invoice updated successfully");
      } else {
        const { error } = await invoiceService.create(payload);
        if (error) throw error;
        toast.success("Invoice created successfully");
      }
      navigate("/invoices");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save invoice");
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, tax, total, shippingCost: shipping, couponDiscount: discount } = calculateTotals();

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
                  A similar invoice ({duplicateWarning.invoiceNumber}) already exists.
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                placeholder="Leave empty for auto-generation"
                className="mt-1"
                data-testid="invoice-number-input"
              />
              <p className="text-xs text-gray-500 mt-1">Optional: If left empty, will be auto-generated</p>
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
            <div>
              <Label htmlFor="amountReceived">Amount Received (₹)</Label>
              <Input
                id="amountReceived"
                type="number"
                value={formData.amountReceived}
                onChange={(e) => setFormData({ ...formData, amountReceived: e.target.value })}
                className="mt-1"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="col-span-4">
                  {index === 0 && <Label className="text-xs mb-1">Description</Label>}
                  <Popover open={openPopovers[index]} onOpenChange={(open) => setOpenPopovers({ ...openPopovers, [index]: open })}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openPopovers[index]}
                        className="w-full justify-between font-normal h-10 px-3 bg-white border-sky-100 hover:border-sky-300 focus:ring-sky-500 overflow-hidden"
                      >
                        <span className="truncate">{item.description || "Select product..."}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search product..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const value = e.currentTarget.value;
                              if (value) {
                                handleItemChange(index, "description", value);
                                setOpenPopovers({ ...openPopovers, [index]: false });
                              }
                            }
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <p className="text-sm p-4 text-center text-gray-500">
                              No product found.<br />
                              <span className="text-xs">Press Enter to use custom name</span>
                            </p>
                          </CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              className="text-sky-600 font-medium cursor-pointer border-b border-sky-50"
                              onSelect={() => {
                                setActiveItemIndex(index);
                                setIsAddProductModalOpen(true);
                                setOpenPopovers({ ...openPopovers, [index]: false });
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add New Product...
                            </CommandItem>
                            {ALL_PRODUCTS.map((prod) => (
                              <CommandItem
                                key={`${prod.name}-${prod.hsn}`}
                                value={prod.name}
                                onSelect={(currentValue) => {
                                  handleItemChange(index, "description", currentValue);
                                  setOpenPopovers({ ...openPopovers, [index]: false });
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    item.description === prod.name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{prod.name}</span>
                                  <div className="flex gap-2 text-[10px] text-gray-500 font-medium">
                                    <span className="bg-sky-50 px-1 rounded text-sky-700">GST: {prod.gst}%</span>
                                    <span className="bg-orange-50 px-1 rounded text-orange-700">HSN: {prod.hsn}</span>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="col-span-2">
                  {index === 0 && <Label className="text-xs mb-1">HSN</Label>}
                  <Input
                    placeholder="HSN"
                    value={item.hsn || ""}
                    onChange={(e) => handleItemChange(index, "hsn", e.target.value)}
                    data-testid={`item-hsn-${index}`}
                  />
                </div>
                <div className="col-span-1">
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
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="pl-5"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, "rate", parseFloat(e.target.value) || 0)}
                      required
                      min="0"
                      step="0.01"
                      data-testid={`item-rate-${index}`}
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  {index === 0 && <Label className="text-xs mb-1">Amount</Label>}
                  <Input
                    value={`₹${(item.amount || 0).toFixed(2)}`}
                    disabled
                    className="bg-gray-50 font-medium text-sky-900 border-sky-50"
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
                    className="hover:bg-red-50 hover:text-red-600 transition-colors"
                    data-testid={`remove-item-${index}-btn`}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tax Configuration */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-sky-900">Tax & Additional Charges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="taxValue">{isTaxPercentage ? "Tax Rate (%)" : "Tax Amount (₹)"}</Label>
              <div className="flex gap-2 items-center mt-1">
                <Input
                  id="taxValue"
                  type="number"
                  value={taxValue}
                  onChange={(e) => setTaxValue(e.target.value)}
                  placeholder={isTaxPercentage ? "0" : "0.00"}
                  className="flex-grow"
                  min="0"
                  step="0.01"
                  data-testid="tax-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTaxPercentage(!isTaxPercentage)}
                  className="w-24 whitespace-nowrap text-xs h-10"
                >
                  {isTaxPercentage ? "Switch to ₹" : "Switch to %"}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {isTaxPercentage ? `Calculating ${taxValue || 0}% tax relative to subtotal.` : "Using a fixed manual tax amount."}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  id="enableShipping"
                  checked={enableShipping}
                  onChange={(e) => {
                    setEnableShipping(e.target.checked);
                    if (!e.target.checked) {
                      setShippingCost(""); // Clear shipping cost when disabled
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  data-testid="enable-shipping-checkbox"
                />
                <Label htmlFor="enableShipping" className="cursor-pointer">
                  Add Shipping Cost
                </Label>
              </div>
              {enableShipping && (
                <Input
                  id="shippingCost"
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  placeholder="Enter shipping cost"
                  className="mt-1"
                  min="0"
                  step="0.01"
                  data-testid="shipping-cost-input"
                />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  id="enableDiscount"
                  checked={enableDiscount}
                  onChange={(e) => {
                    setEnableDiscount(e.target.checked);
                    if (!e.target.checked) {
                      setCouponDiscount(""); // Clear discount when disabled
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  data-testid="enable-discount-checkbox"
                />
                <Label htmlFor="enableDiscount" className="cursor-pointer">
                  Add Coupon Discount
                </Label>
              </div>
              {enableDiscount && (
                <Input
                  id="couponDiscount"
                  type="number"
                  value={couponDiscount}
                  onChange={(e) => setCouponDiscount(e.target.value)}
                  placeholder="Enter discount amount"
                  className="mt-1"
                  min="0"
                  step="0.01"
                  data-testid="coupon-discount-input"
                />
              )}
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full md:w-1/3 space-y-2 glass-dark p-4 rounded-xl">
            <div className="flex justify-between">
              <span className="text-gray-600">Sub Total:</span>
              <span className="font-semibold" data-testid="subtotal-display">₹{subtotal.toFixed(2)}</span>
            </div>
            {shipping > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping cost:</span>
                <span className="font-semibold" data-testid="shipping-display">₹{shipping.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">
                Total Tax
                {subtotal > 0 && tax > 0 ? ` (${parseFloat(((tax / subtotal) * 100).toFixed(2))}%)` : ""}
                :
              </span>
              <span className="font-semibold" data-testid="tax-display">₹{tax.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Coupon Discount:</span>
                <span className="font-semibold" data-testid="discount-display">₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Grand Total:</span>
              <span data-testid="total-display">₹{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-red-500 pt-1">
              <span>Amount Pending:</span>
              <span>₹{(total - (parseFloat(formData.amountReceived) || 0)).toFixed(2)}</span>
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

      {/* Add Product Modal */}
      <Dialog open={isAddProductModalOpen} onOpenChange={setIsAddProductModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-sky-900 text-center">Add New Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddNewProduct} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="prodName">Product Name *</Label>
              <Input
                id="prodName"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Enter product name"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prodHSN">HSN Code *</Label>
                <Input
                  id="prodHSN"
                  value={newProduct.hsn_code}
                  onChange={(e) => setNewProduct({ ...newProduct, hsn_code: e.target.value })}
                  placeholder="e.g. 1234"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prodGST">GST Rate (%)</Label>
                <Select
                  value={newProduct.gst_rate}
                  onValueChange={(value) => setNewProduct({ ...newProduct, gst_rate: value })}
                >
                  <SelectTrigger id="prodGST">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddProductModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white">
                Add Product
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
