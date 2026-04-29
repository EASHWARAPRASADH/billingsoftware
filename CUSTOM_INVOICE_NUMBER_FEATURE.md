# Custom Invoice Number Feature

## Overview
Added the ability to specify a custom invoice number when creating or updating invoices. If no custom number is provided, the system will auto-generate one using the format `INV-00001`, `INV-00002`, etc.

## Changes Made

### Frontend Changes (`frontend/src/pages/InvoiceForm.js`)

1. **Added Invoice Number Field to Form State**
   - Added `invoiceNumber: ""` to the initial `formData` state
   
2. **Added Invoice Number Input Field**
   - Created a new input field in the "Invoice Details" section
   - Positioned before the Issue Date and Due Date fields
   - Includes helpful placeholder text: "Leave empty for auto-generation"
   - Includes a hint text below the field explaining it's optional
   - Reorganized the layout to accommodate the new field (2 rows of 2 columns instead of 1 row of 3 columns)

### Backend Changes

#### 1. **Invoice Model** (`backend/models/Invoice.js`)
   - Removed the global `unique: true` constraint from `invoiceNumber`
   - Changed to `allowNull: true` to allow optional custom numbers
   - The `beforeCreate` hook still auto-generates invoice numbers when not provided
   - Auto-generation format: `INV-00001`, `INV-00002`, etc. (per user)

#### 2. **Invoice Routes** (`backend/routes/invoices.js`)

   **POST /api/invoices (Create Invoice)**
   - Added validation for optional `invoiceNumber` field
   - Added uniqueness check: If a custom invoice number is provided, validates that it doesn't already exist for that user
   - Returns error message if duplicate invoice number is detected
   
   **PUT /api/invoices/:id (Update Invoice)**
   - Added `invoiceNumber` to the validation rules
   - Added `invoiceNumber` to the `allowedFields` array
   - Added uniqueness check when updating invoice number (excludes current invoice from check)
   - Returns error message if duplicate invoice number is detected

## How It Works

### Creating a New Invoice

**Scenario 1: Auto-Generated Invoice Number**
1. User leaves the "Invoice Number" field empty
2. Backend receives the request without an `invoiceNumber`
3. The `beforeCreate` hook in the Invoice model generates a number (e.g., `INV-00001`)
4. Invoice is created with the auto-generated number

**Scenario 2: Custom Invoice Number**
1. User enters a custom invoice number (e.g., "2024-001")
2. Backend validates the number doesn't already exist for this user
3. If unique, invoice is created with the custom number
4. If duplicate, returns error: "Invoice number already exists. Please use a different number."

### Updating an Existing Invoice

**Scenario 1: Changing to a Custom Number**
1. User edits an invoice and enters a new invoice number
2. Backend checks if the new number is already used by another invoice (excluding the current one)
3. If unique, invoice is updated
4. If duplicate, returns error message

**Scenario 2: Keeping Existing Number**
1. User doesn't modify the invoice number field
2. Invoice updates normally without changing the invoice number

## Validation Rules

- **Optional Field**: Invoice number is not required
- **Uniqueness**: Each invoice number must be unique per user
- **Format**: No specific format enforced - users can use any text format they prefer
- **Auto-Generation**: If empty, system generates `INV-XXXXX` format

## User Experience

1. **Clear Labeling**: Field is labeled "Invoice Number" (not marked as required)
2. **Helpful Placeholder**: "Leave empty for auto-generation"
3. **Hint Text**: "Optional: If left empty, will be auto-generated"
4. **Error Handling**: Clear error message if duplicate number is entered
5. **Flexibility**: Users can use any numbering scheme (e.g., "2024-001", "INV-JAN-001", "CUST-ABC-001")

## Database Considerations

- The `invoiceNumber` field is stored as a STRING type
- No database-level unique constraint (handled at application level per user)
- Allows NULL values for backward compatibility

## Testing Recommendations

1. **Test Auto-Generation**: Create invoice without entering invoice number
2. **Test Custom Number**: Create invoice with custom number
3. **Test Duplicate Detection**: Try to create two invoices with same custom number
4. **Test Update**: Update an existing invoice's number
5. **Test Update Duplicate**: Try to update to a number that already exists
6. **Test Empty to Custom**: Update an auto-generated number to a custom one
7. **Test Custom to Empty**: Verify that clearing a custom number doesn't cause issues

## Migration Notes

- Existing invoices will retain their auto-generated invoice numbers
- No database migration required (field already exists)
- The change from `unique: true` to `allowNull: true` in the model may require a database schema update depending on your setup
