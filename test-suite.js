// ========================================
// COMPREHENSIVE TESTING SUITE
// Bill Management System
// ========================================

const axios = require('axios');

const API_URL = 'http://localhost:8000/api';
let authToken = '';
let testUserId = '';
let testInvoiceId = '';
let testExpenseId = '';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Test results tracking
const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
};

// Helper functions
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function testPass(name) {
    results.total++;
    results.passed++;
    log(`✓ PASS: ${name}`, 'green');
}

function testFail(name, error) {
    results.total++;
    results.failed++;
    results.errors.push({ test: name, error: error.message || error });
    log(`✗ FAIL: ${name}`, 'red');
    log(`  Error: ${error.message || error}`, 'red');
}

function section(name) {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`  ${name}`, 'cyan');
    log('='.repeat(60), 'cyan');
}

// ========================================
// 1. BACKEND API TESTS
// ========================================

async function testBackendHealth() {
    section('BACKEND HEALTH CHECK');

    try {
        const response = await axios.get(`${API_URL}/health`);
        if (response.data.status === 'OK') {
            testPass('Backend health endpoint responding');
        } else {
            testFail('Backend health check', 'Invalid response');
        }
    } catch (error) {
        testFail('Backend health check', error);
    }
}

// ========================================
// 2. AUTHENTICATION TESTS
// ========================================

async function testAuthentication() {
    section('AUTHENTICATION TESTS');

    // Test Registration
    try {
        const registerData = {
            username: `testuser_${Date.now()}`,
            email: `test_${Date.now()}@example.com`,
            password: 'Test@123456',
            role: 'user'
        };

        const response = await axios.post(`${API_URL}/auth/register`, registerData);

        if (response.data.token) {
            authToken = response.data.token;
            testUserId = response.data.user.id;
            testPass('User registration successful');
        } else {
            testFail('User registration', 'No token returned');
        }
    } catch (error) {
        testFail('User registration', error);
    }

    // Test Login
    try {
        const loginData = {
            email: 'admin@example.com',
            password: 'admin123'
        };

        const response = await axios.post(`${API_URL}/auth/login`, loginData);

        if (response.data.token) {
            authToken = response.data.token;
            testUserId = response.data.user.id;
            testPass('User login successful');
        } else {
            testFail('User login', 'No token returned');
        }
    } catch (error) {
        testFail('User login', error);
    }

    // Test invalid credentials
    try {
        await axios.post(`${API_URL}/auth/login`, {
            email: 'wrong@example.com',
            password: 'wrongpassword'
        });
        testFail('Invalid login rejection', 'Should have rejected invalid credentials');
    } catch (error) {
        if (error.response?.status === 401) {
            testPass('Invalid credentials properly rejected');
        } else {
            testFail('Invalid login rejection', error);
        }
    }
}

// ========================================
// 3. BUSINESS PROFILE TESTS
// ========================================

async function testBusinessProfile() {
    section('BUSINESS PROFILE TESTS');

    const headers = { Authorization: `Bearer ${authToken}` };

    // Create/Update Profile
    try {
        const profileData = {
            businessName: 'Test Business',
            email: 'business@test.com',
            phone: '1234567890',
            address: '123 Test Street',
            taxRate: 18.0,
            currency: 'INR'
        };

        const response = await axios.put(`${API_URL}/profile`, profileData, { headers });

        if (response.data.businessName === profileData.businessName) {
            testPass('Business profile creation/update');
        } else {
            testFail('Business profile creation/update', 'Data mismatch');
        }
    } catch (error) {
        testFail('Business profile creation/update', error);
    }

    // Get Profile
    try {
        const response = await axios.get(`${API_URL}/profile`, { headers });

        if (response.data.businessName) {
            testPass('Business profile retrieval');
        } else {
            testFail('Business profile retrieval', 'No data returned');
        }
    } catch (error) {
        testFail('Business profile retrieval', error);
    }
}

// ========================================
// 4. INVOICE TESTS
// ========================================

async function testInvoices() {
    section('INVOICE TESTS');

    const headers = { Authorization: `Bearer ${authToken}` };

    // Create Invoice
    try {
        const invoiceData = {
            clientName: 'Test Client',
            clientEmail: 'client@test.com',
            clientAddress: '456 Client Street',
            items: [
                {
                    description: 'Test Item 1',
                    quantity: 2,
                    rate: 100,
                    amount: 200
                },
                {
                    description: 'Test Item 2',
                    quantity: 1,
                    rate: 150,
                    amount: 150
                }
            ],
            subtotal: 350,
            tax: 63,
            total: 413,
            status: 'draft',
            issueDate: '2024-12-14',
            dueDate: '2024-12-31',
            notes: 'Test invoice notes'
        };

        const response = await axios.post(`${API_URL}/invoices`, invoiceData, { headers });

        if (response.data.id) {
            testInvoiceId = response.data.id;
            testPass('Invoice creation');
        } else {
            testFail('Invoice creation', 'No ID returned');
        }
    } catch (error) {
        testFail('Invoice creation', error);
    }

    // Get All Invoices
    try {
        const response = await axios.get(`${API_URL}/invoices`, { headers });

        if (Array.isArray(response.data)) {
            testPass('Get all invoices');
        } else {
            testFail('Get all invoices', 'Invalid response format');
        }
    } catch (error) {
        testFail('Get all invoices', error);
    }

    // Get Single Invoice
    if (testInvoiceId) {
        try {
            const response = await axios.get(`${API_URL}/invoices/${testInvoiceId}`, { headers });

            if (response.data.id === testInvoiceId) {
                testPass('Get single invoice');
            } else {
                testFail('Get single invoice', 'ID mismatch');
            }
        } catch (error) {
            testFail('Get single invoice', error);
        }

        // Update Invoice
        try {
            const updateData = {
                status: 'sent',
                notes: 'Updated notes'
            };

            const response = await axios.put(`${API_URL}/invoices/${testInvoiceId}`, updateData, { headers });

            if (response.data.status === 'sent') {
                testPass('Invoice update');
            } else {
                testFail('Invoice update', 'Update not reflected');
            }
        } catch (error) {
            testFail('Invoice update', error);
        }
    }

    // Test duplicate detection
    try {
        const duplicateCheck = {
            clientName: 'Test Client',
            issueDate: '2024-12-14',
            total: 413
        };

        const response = await axios.post(`${API_URL}/invoices/check-duplicate`, duplicateCheck, { headers });

        if (response.data.exists !== undefined) {
            testPass('Duplicate invoice detection');
        } else {
            testFail('Duplicate invoice detection', 'Invalid response');
        }
    } catch (error) {
        testFail('Duplicate invoice detection', error);
    }
}

// ========================================
// 5. EXPENSE TESTS
// ========================================

async function testExpenses() {
    section('EXPENSE TESTS');

    const headers = { Authorization: `Bearer ${authToken}` };

    // Create Expense
    try {
        const expenseData = {
            description: 'Test Expense',
            category: 'Office Supplies',
            amount: 500,
            date: '2024-12-14',
            notes: 'Test expense notes'
        };

        const response = await axios.post(`${API_URL}/expenses`, expenseData, { headers });

        if (response.data.id) {
            testExpenseId = response.data.id;
            testPass('Expense creation');
        } else {
            testFail('Expense creation', 'No ID returned');
        }
    } catch (error) {
        testFail('Expense creation', error);
    }

    // Get All Expenses
    try {
        const response = await axios.get(`${API_URL}/expenses`, { headers });

        if (Array.isArray(response.data)) {
            testPass('Get all expenses');
        } else {
            testFail('Get all expenses', 'Invalid response format');
        }
    } catch (error) {
        testFail('Get all expenses', error);
    }

    // Get Single Expense
    if (testExpenseId) {
        try {
            const response = await axios.get(`${API_URL}/expenses/${testExpenseId}`, { headers });

            if (response.data.id === testExpenseId) {
                testPass('Get single expense');
            } else {
                testFail('Get single expense', 'ID mismatch');
            }
        } catch (error) {
            testFail('Get single expense', error);
        }

        // Update Expense
        try {
            const updateData = {
                amount: 600,
                notes: 'Updated expense'
            };

            const response = await axios.put(`${API_URL}/expenses/${testExpenseId}`, updateData, { headers });

            if (parseFloat(response.data.amount) === 600) {
                testPass('Expense update');
            } else {
                testFail('Expense update', 'Update not reflected');
            }
        } catch (error) {
            testFail('Expense update', error);
        }
    }
}

// ========================================
// 6. DASHBOARD TESTS
// ========================================

async function testDashboard() {
    section('DASHBOARD TESTS');

    const headers = { Authorization: `Bearer ${authToken}` };

    try {
        const response = await axios.get(`${API_URL}/dashboard`, { headers });

        const requiredFields = ['totalRevenue', 'totalExpenses', 'pendingInvoices', 'paidInvoices', 'recentInvoices', 'recentExpenses'];
        const hasAllFields = requiredFields.every(field => response.data.hasOwnProperty(field));

        if (hasAllFields) {
            testPass('Dashboard data retrieval');
        } else {
            testFail('Dashboard data retrieval', 'Missing required fields');
        }
    } catch (error) {
        testFail('Dashboard data retrieval', error);
    }
}

// ========================================
// 7. DATA VALIDATION TESTS
// ========================================

async function testDataValidation() {
    section('DATA VALIDATION TESTS');

    const headers = { Authorization: `Bearer ${authToken}` };

    // Test invalid invoice (missing required fields)
    try {
        await axios.post(`${API_URL}/invoices`, {
            clientName: 'Test'
            // Missing required fields
        }, { headers });
        testFail('Invoice validation', 'Should reject invalid data');
    } catch (error) {
        if (error.response?.status === 400) {
            testPass('Invoice validation - rejects invalid data');
        } else {
            testFail('Invoice validation', error);
        }
    }

    // Test invalid expense (negative amount)
    try {
        await axios.post(`${API_URL}/expenses`, {
            description: 'Test',
            category: 'Test',
            amount: -100,
            date: '2024-12-14'
        }, { headers });
        testFail('Expense validation', 'Should reject negative amount');
    } catch (error) {
        if (error.response?.status === 400) {
            testPass('Expense validation - rejects negative amount');
        } else {
            testFail('Expense validation', error);
        }
    }
}

// ========================================
// 8. AUTHORIZATION TESTS
// ========================================

async function testAuthorization() {
    section('AUTHORIZATION TESTS');

    // Test access without token
    try {
        await axios.get(`${API_URL}/invoices`);
        testFail('Authorization check', 'Should require authentication');
    } catch (error) {
        if (error.response?.status === 401) {
            testPass('Authorization - blocks unauthenticated requests');
        } else {
            testFail('Authorization check', error);
        }
    }

    // Test with invalid token
    try {
        await axios.get(`${API_URL}/invoices`, {
            headers: { Authorization: 'Bearer invalid_token_here' }
        });
        testFail('Token validation', 'Should reject invalid token');
    } catch (error) {
        if (error.response?.status === 401) {
            testPass('Token validation - rejects invalid tokens');
        } else {
            testFail('Token validation', error);
        }
    }
}

// ========================================
// 9. CLEANUP TESTS (Delete test data)
// ========================================

async function cleanupTestData() {
    section('CLEANUP - Removing test data');

    const headers = { Authorization: `Bearer ${authToken}` };

    // Delete test invoice
    if (testInvoiceId) {
        try {
            await axios.delete(`${API_URL}/invoices/${testInvoiceId}`, { headers });
            testPass('Test invoice cleanup');
        } catch (error) {
            testFail('Test invoice cleanup', error);
        }
    }

    // Delete test expense
    if (testExpenseId) {
        try {
            await axios.delete(`${API_URL}/expenses/${testExpenseId}`, { headers });
            testPass('Test expense cleanup');
        } catch (error) {
            testFail('Test expense cleanup', error);
        }
    }
}

// ========================================
// MAIN TEST RUNNER
// ========================================

async function runAllTests() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║   BILL MANAGEMENT SYSTEM - COMPREHENSIVE TEST SUITE       ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

    const startTime = Date.now();

    // Run all test suites
    await testBackendHealth();
    await testAuthentication();
    await testBusinessProfile();
    await testInvoices();
    await testExpenses();
    await testDashboard();
    await testDataValidation();
    await testAuthorization();
    await cleanupTestData();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Print results
    section('TEST RESULTS SUMMARY');
    log(`\nTotal Tests:  ${results.total}`, 'cyan');
    log(`Passed:       ${results.passed}`, 'green');
    log(`Failed:       ${results.failed}`, results.failed > 0 ? 'red' : 'green');
    log(`Duration:     ${duration}s`, 'cyan');

    if (results.failed > 0) {
        log('\n╔════════════════════════════════════════════════════════════╗', 'red');
        log('║   FAILED TESTS DETAILS                                     ║', 'red');
        log('╚════════════════════════════════════════════════════════════╝\n', 'red');

        results.errors.forEach((error, index) => {
            log(`${index + 1}. ${error.test}`, 'yellow');
            log(`   Error: ${error.error}`, 'red');
        });
    }

    log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║   TEST SUITE COMPLETE                                      ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
    log(`\nFATAL ERROR: ${error.message}`, 'red');
    process.exit(1);
});
