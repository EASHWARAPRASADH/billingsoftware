-- ========================================
-- Bill Management System - MySQL Queries
-- Database: billmanagement
-- ========================================

-- Use the database
USE billmanagement;

-- ========================================
-- 1. VIEW ALL TABLES
-- ========================================
SHOW TABLES;

-- ========================================
-- 2. VIEW ALL USERS
-- ========================================
SELECT 
    id,
    username,
    email,
    role,
    createdAt,
    updatedAt
FROM Users
ORDER BY createdAt DESC;

-- ========================================
-- 3. VIEW ALL BUSINESS PROFILES
-- ========================================
SELECT 
    id,
    userId,
    businessName,
    email,
    phone,
    address,
    taxRate,
    currency,
    createdAt,
    updatedAt
FROM BusinessProfiles
ORDER BY createdAt DESC;

-- ========================================
-- 4. VIEW ALL INVOICES (Complete Details)
-- ========================================
SELECT 
    i.id,
    i.invoiceNumber,
    i.clientName,
    i.clientEmail,
    i.clientAddress,
    i.subtotal,
    i.tax,
    i.total,
    i.status,
    i.issueDate,
    i.dueDate,
    i.notes,
    i.items,
    i.userId,
    u.username AS createdBy,
    u.email AS userEmail,
    i.createdAt,
    i.updatedAt
FROM Invoices i
LEFT JOIN Users u ON i.userId = u.id
ORDER BY i.createdAt DESC;

-- ========================================
-- 5. VIEW INVOICES SUMMARY (Without Items)
-- ========================================
SELECT 
    i.invoiceNumber,
    i.clientName,
    i.clientEmail,
    i.subtotal,
    i.tax,
    i.total,
    i.status,
    i.issueDate,
    i.dueDate,
    u.username AS createdBy,
    i.createdAt
FROM Invoices i
LEFT JOIN Users u ON i.userId = u.id
ORDER BY i.createdAt DESC;

-- ========================================
-- 6. VIEW ALL EXPENSES/BILLS
-- ========================================
SELECT 
    e.id,
    e.description,
    e.category,
    e.amount,
    e.date,
    e.notes,
    e.userId,
    u.username AS createdBy,
    u.email AS userEmail,
    e.createdAt,
    e.updatedAt
FROM Expenses e
LEFT JOIN Users u ON e.userId = u.id
ORDER BY e.date DESC;

-- ========================================
-- 7. VIEW INVOICES BY STATUS
-- ========================================
-- Paid Invoices
SELECT 
    invoiceNumber,
    clientName,
    total,
    issueDate,
    status
FROM Invoices
WHERE status = 'paid'
ORDER BY issueDate DESC;

-- Pending Invoices (Draft + Sent)
SELECT 
    invoiceNumber,
    clientName,
    total,
    issueDate,
    dueDate,
    status
FROM Invoices
WHERE status IN ('draft', 'sent')
ORDER BY dueDate ASC;

-- Overdue Invoices
SELECT 
    invoiceNumber,
    clientName,
    total,
    issueDate,
    dueDate,
    status
FROM Invoices
WHERE status = 'overdue'
ORDER BY dueDate ASC;

-- ========================================
-- 8. VIEW UNIQUE CLIENTS/CUSTOMERS
-- ========================================
SELECT DISTINCT
    clientName,
    clientEmail,
    clientAddress,
    COUNT(*) AS totalInvoices,
    SUM(total) AS totalAmount,
    MIN(issueDate) AS firstInvoice,
    MAX(issueDate) AS lastInvoice
FROM Invoices
GROUP BY clientName, clientEmail, clientAddress
ORDER BY totalAmount DESC;

-- ========================================
-- 9. FINANCIAL SUMMARY
-- ========================================
-- Total Revenue (Paid Invoices)
SELECT 
    COUNT(*) AS totalPaidInvoices,
    SUM(subtotal) AS totalRevenue,
    SUM(tax) AS totalTaxCollected,
    SUM(total) AS totalAmount
FROM Invoices
WHERE status = 'paid';

-- Total Expenses
SELECT 
    COUNT(*) AS totalExpenses,
    SUM(amount) AS totalExpenseAmount
FROM Expenses;

-- Combined Financial Overview
SELECT 
    (SELECT IFNULL(SUM(total), 0) FROM Invoices WHERE status = 'paid') AS totalRevenue,
    (SELECT IFNULL(SUM(amount), 0) FROM Expenses) AS totalExpenses,
    (SELECT IFNULL(SUM(total), 0) FROM Invoices WHERE status = 'paid') - 
    (SELECT IFNULL(SUM(amount), 0) FROM Expenses) AS netProfit;

-- ========================================
-- 10. MONTHLY REVENUE REPORT
-- ========================================
SELECT 
    DATE_FORMAT(issueDate, '%Y-%m') AS month,
    COUNT(*) AS invoiceCount,
    SUM(subtotal) AS subtotal,
    SUM(tax) AS tax,
    SUM(total) AS total
FROM Invoices
WHERE status = 'paid'
GROUP BY DATE_FORMAT(issueDate, '%Y-%m')
ORDER BY month DESC;

-- ========================================
-- 11. MONTHLY EXPENSE REPORT
-- ========================================
SELECT 
    DATE_FORMAT(date, '%Y-%m') AS month,
    category,
    COUNT(*) AS expenseCount,
    SUM(amount) AS totalAmount
FROM Expenses
GROUP BY DATE_FORMAT(date, '%Y-%m'), category
ORDER BY month DESC, totalAmount DESC;

-- ========================================
-- 12. CLIENT WISE INVOICE SUMMARY
-- ========================================
SELECT 
    clientName,
    COUNT(*) AS totalInvoices,
    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paidInvoices,
    SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draftInvoices,
    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS sentInvoices,
    SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) AS overdueInvoices,
    SUM(total) AS totalAmount,
    SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) AS paidAmount,
    SUM(CASE WHEN status != 'paid' THEN total ELSE 0 END) AS pendingAmount
FROM Invoices
GROUP BY clientName
ORDER BY totalAmount DESC;

-- ========================================
-- 13. RECENT ACTIVITY (Last 30 Days)
-- ========================================
-- Recent Invoices
SELECT 
    invoiceNumber,
    clientName,
    total,
    status,
    issueDate,
    createdAt
FROM Invoices
WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY createdAt DESC
LIMIT 20;

-- Recent Expenses
SELECT 
    description,
    category,
    amount,
    date,
    createdAt
FROM Expenses
WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY createdAt DESC
LIMIT 20;

-- ========================================
-- 14. TOP CLIENTS BY REVENUE
-- ========================================
SELECT 
    clientName,
    clientEmail,
    COUNT(*) AS totalInvoices,
    SUM(total) AS totalRevenue,
    AVG(total) AS avgInvoiceAmount,
    MAX(issueDate) AS lastInvoiceDate
FROM Invoices
WHERE status = 'paid'
GROUP BY clientName, clientEmail
ORDER BY totalRevenue DESC
LIMIT 10;

-- ========================================
-- 15. EXPENSE BREAKDOWN BY CATEGORY
-- ========================================
SELECT 
    category,
    COUNT(*) AS expenseCount,
    SUM(amount) AS totalAmount,
    AVG(amount) AS avgAmount,
    MIN(amount) AS minAmount,
    MAX(amount) AS maxAmount
FROM Expenses
GROUP BY category
ORDER BY totalAmount DESC;

-- ========================================
-- 16. INVOICE AGING REPORT
-- ========================================
SELECT 
    invoiceNumber,
    clientName,
    total,
    issueDate,
    dueDate,
    status,
    DATEDIFF(NOW(), dueDate) AS daysOverdue,
    CASE 
        WHEN DATEDIFF(NOW(), dueDate) <= 0 THEN 'Current'
        WHEN DATEDIFF(NOW(), dueDate) BETWEEN 1 AND 30 THEN '1-30 Days'
        WHEN DATEDIFF(NOW(), dueDate) BETWEEN 31 AND 60 THEN '31-60 Days'
        WHEN DATEDIFF(NOW(), dueDate) BETWEEN 61 AND 90 THEN '61-90 Days'
        ELSE 'Over 90 Days'
    END AS agingBucket
FROM Invoices
WHERE status != 'paid'
ORDER BY dueDate ASC;

-- ========================================
-- 17. YEAR-TO-DATE SUMMARY
-- ========================================
SELECT 
    YEAR(issueDate) AS year,
    COUNT(*) AS totalInvoices,
    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paidInvoices,
    SUM(subtotal) AS totalSubtotal,
    SUM(tax) AS totalTax,
    SUM(total) AS totalAmount,
    SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) AS paidAmount
FROM Invoices
WHERE YEAR(issueDate) = YEAR(NOW())
GROUP BY YEAR(issueDate);

-- ========================================
-- 18. SEARCH QUERIES
-- ========================================
-- Search Invoice by Invoice Number
SELECT * FROM Invoices WHERE invoiceNumber = 'INV-00001';

-- Search Invoices by Client Name
SELECT * FROM Invoices WHERE clientName LIKE '%client name%';

-- Search Invoices by Date Range
SELECT * FROM Invoices 
WHERE issueDate BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY issueDate DESC;

-- Search Expenses by Category
SELECT * FROM Expenses WHERE category = 'Office Supplies';

-- ========================================
-- 19. DATABASE STATISTICS
-- ========================================
SELECT 
    (SELECT COUNT(*) FROM Users) AS totalUsers,
    (SELECT COUNT(*) FROM BusinessProfiles) AS totalBusinessProfiles,
    (SELECT COUNT(*) FROM Invoices) AS totalInvoices,
    (SELECT COUNT(*) FROM Expenses) AS totalExpenses;

-- ========================================
-- 20. COMPLETE DATA EXPORT
-- ========================================
-- All Invoices with User Details
SELECT 
    i.*,
    u.username,
    u.email AS userEmail,
    bp.businessName,
    bp.phone AS businessPhone,
    bp.address AS businessAddress
FROM Invoices i
LEFT JOIN Users u ON i.userId = u.id
LEFT JOIN BusinessProfiles bp ON u.id = bp.userId
ORDER BY i.createdAt DESC;

-- ========================================
-- END OF QUERIES
-- ========================================
