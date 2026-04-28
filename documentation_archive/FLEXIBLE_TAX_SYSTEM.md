# Flexible Tax System for Invoices

## Overview
Implemented a flexible tax calculation system that allows users to choose between:
1. **Automatic 18% GST** - Toggle on/off for each invoice
2. **Manual Tax Amount** - Enter any custom tax amount
3. **No Tax** - Leave both options unchecked/empty

## Features

### 1. **18% GST Toggle**
- Checkbox to apply/remove 18% GST automatically
- When enabled, tax is calculated as: `tax = subtotal × 18%`
- Can be toggled on/off for each invoice independently
- Automatically clears manual tax when enabled

### 2. **Manual Tax Input**
- Optional number input field for custom tax amounts
- Accepts any positive decimal value (e.g., 100, 250.50, 1500)
- When manual tax is entered, GST toggle is automatically disabled
- Takes priority over automatic GST calculation

### 3. **Smart Tax Calculation Priority**
```
Priority Order:
1. Manual Tax (if entered) → Use exact amount entered
2. 18% GST (if toggled) → Calculate automatically
3. No Tax (default) → Tax = 0
```

### 4. **Visual Feedback**
- Helper text shows current tax mode:
  - "Using manual tax amount" - when manual tax is entered
  - "Using 18% GST" - when GST toggle is on
  - "No tax applied" - when neither is active
- Totals section displays tax type:
  - "Tax (Manual):" - for manual tax
  - "Tax (18% GST):" - for automatic GST
  - "Tax:" - for no tax

## Implementation Details

### Frontend Changes (`InvoiceForm.js`)

#### New State Variables
```javascript
const [applyGST, setApplyGST] = useState(false);  // Toggle for 18% GST
const [manualTax, setManualTax] = useState("");   // Manual tax amount
```

#### Updated Tax Calculation
```javascript
const calculateTotals = () => {
  const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
  
  let tax = 0;
  if (manualTax !== "" && manualTax !== null) {
    tax = parseFloat(manualTax) || 0;  // Manual tax takes priority
  } else if (applyGST) {
    tax = subtotal * (taxRate / 100);   // Then 18% GST
  }
  // Otherwise tax = 0
  
  const total = subtotal + tax;
  return { subtotal, tax, total };
};
```

#### New UI Section - Tax Configuration
Located between "Line Items" and "Totals" sections:
- **Left Column**: Checkbox for "Apply 18% GST automatically"
- **Right Column**: Input field for "Manual Tax Amount (Optional)"
- Helper text showing current tax mode

#### Mutual Exclusivity Logic
```javascript
// When GST is toggled ON
onChange={(e) => {
  setApplyGST(e.target.checked);
  if (e.target.checked) {
    setManualTax("");  // Clear manual tax
  }
}}

// When manual tax is entered
onChange={(e) => {
  setManualTax(e.target.value);
  if (e.target.value !== "") {
    setApplyGST(false);  // Disable GST toggle
  }
}}
```

### Backend Changes

#### Database Model (`Invoice.js`)
Added two new fields:
```javascript
applyGST: {
  type: DataTypes.BOOLEAN,
  defaultValue: false
},
isManualTax: {
  type: DataTypes.BOOLEAN,
  defaultValue: false
}
```

#### API Routes (`invoices.js`)
**Validation Added:**
```javascript
body('applyGST').optional().isBoolean(),
body('isManualTax').optional().isBoolean()
```

**Allowed Fields Updated:**
```javascript
const allowedFields = [
  // ... existing fields
  'applyGST', 'isManualTax'
];
```

## User Workflows

### Scenario 1: Create Invoice with 18% GST
1. Fill in invoice details (client, items, dates)
2. Check "Apply 18% GST automatically"
3. Tax is calculated automatically: `subtotal × 18%`
4. Submit invoice

**Result:** Invoice saved with `applyGST: true`, `isManualTax: false`

### Scenario 2: Create Invoice with Manual Tax
1. Fill in invoice details
2. Enter custom tax amount (e.g., 500)
3. GST checkbox is automatically unchecked
4. Tax shows as ₹500.00
5. Submit invoice

**Result:** Invoice saved with `applyGST: false`, `isManualTax: true`, `tax: 500`

### Scenario 3: Create Invoice with No Tax
1. Fill in invoice details
2. Leave both GST checkbox unchecked and manual tax empty
3. Tax shows as ₹0.00
4. Submit invoice

**Result:** Invoice saved with `applyGST: false`, `isManualTax: false`, `tax: 0`

### Scenario 4: Edit Invoice - Change Tax Method
1. Open existing invoice for editing
2. Previous tax configuration is restored:
   - If GST was applied → checkbox is checked
   - If manual tax was used → amount is shown in input
3. Change tax method as needed
4. Update invoice

**Result:** Invoice updated with new tax configuration

### Scenario 5: Switch from GST to Manual Tax
1. Create invoice with GST enabled
2. Subtotal = ₹10,000 → Tax = ₹1,800 (18%)
3. Uncheck GST and enter manual tax: ₹1,500
4. Tax changes to ₹1,500
5. Submit invoice

**Result:** Custom tax amount overrides automatic calculation

## Data Flow

### Creating Invoice
```
User Input (Frontend)
  ↓
applyGST: true/false
manualTax: "" or number
  ↓
Calculate Tax (Frontend)
  ↓
Payload: {
  ...formData,
  tax: calculated_amount,
  applyGST: boolean,
  isManualTax: boolean
}
  ↓
Backend Validation
  ↓
Save to Database
```

### Editing Invoice
```
Load Invoice (Backend)
  ↓
Response: {
  ...invoice_data,
  applyGST: boolean,
  isManualTax: boolean,
  tax: number
}
  ↓
Restore State (Frontend)
  ↓
if (applyGST) → Check GST toggle
if (isManualTax) → Fill manual tax input
  ↓
User can modify
  ↓
Save with new configuration
```

## Validation Rules

### Frontend Validation
- Manual tax must be a positive number
- GST toggle is boolean (checked/unchecked)
- Both fields are optional

### Backend Validation
```javascript
body('applyGST').optional().isBoolean()
body('isManualTax').optional().isBoolean()
body('tax').isFloat({ min: 0 })
```

## Display Examples

### Invoice with 18% GST
```
Subtotal:  ₹10,000.00
Tax (18% GST):  ₹1,800.00
─────────────────────
Total:  ₹11,800.00
```

### Invoice with Manual Tax
```
Subtotal:  ₹10,000.00
Tax (Manual):  ₹1,500.00
─────────────────────
Total:  ₹11,500.00
```

### Invoice with No Tax
```
Subtotal:  ₹10,000.00
Tax:  ₹0.00
─────────────────────
Total:  ₹10,000.00
```

## Backward Compatibility

### Existing Invoices
- Old invoices without `applyGST` or `isManualTax` fields will default to `false`
- Tax amount is preserved from existing data
- When editing old invoices:
  - If tax > 0 and matches 18% of subtotal → GST toggle will be checked
  - If tax > 0 but doesn't match 18% → Manual tax will be shown
  - If tax = 0 → Both fields remain empty

### Database Migration
No migration required as new fields have default values:
- `applyGST: false`
- `isManualTax: false`

## Testing Checklist

- [ ] Create invoice with 18% GST enabled
- [ ] Create invoice with manual tax (e.g., ₹500)
- [ ] Create invoice with no tax
- [ ] Toggle GST on → verify manual tax clears
- [ ] Enter manual tax → verify GST unchecks
- [ ] Edit invoice with GST → verify checkbox is checked
- [ ] Edit invoice with manual tax → verify amount is shown
- [ ] Switch from GST to manual tax
- [ ] Switch from manual tax to GST
- [ ] Switch from tax to no tax
- [ ] Verify totals calculate correctly in all scenarios
- [ ] Verify invoice detail page displays correct tax
- [ ] Verify PDF/print shows correct tax information

## Benefits

1. **Flexibility**: Users can choose the tax method per invoice
2. **Simplicity**: Default to no tax, opt-in for GST or custom amounts
3. **Accuracy**: Manual tax for special cases (different rates, discounts, etc.)
4. **User-Friendly**: Clear visual feedback and mutual exclusivity
5. **Backward Compatible**: Works with existing invoices
6. **Future-Proof**: Easy to add more tax options later

## Future Enhancements

Potential improvements:
- Multiple tax rates (5%, 12%, 18%, 28%)
- Tax presets/templates
- Tax breakdown (CGST + SGST)
- Tax exemption reasons
- Tax calculation history/audit trail
