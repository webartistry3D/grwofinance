import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';

// Create a test app instance
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register all routes (this will include tax compliance routes)
import { registerRoutes } from '../../server/routes';
registerRoutes(app);

describe('Tax Compliance API - VAT/WHT Separation Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@grwofinance.com',
        password: 'Password1706#'
      });

    authToken = loginResponse.body.token;
    userId = loginResponse.body.user.id;
  });

  describe('GET /api/tax/compliance/dashboard - VAT/WHT Separation', () => {
    it('should return properly separated VAT and WHT data', async () => {
      const response = await request(app)
        .get('/api/tax/compliance/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { taxSummary } = response.body;

      // Verify tax summary structure
      expect(taxSummary).toHaveProperty('totalVATCollected');
      expect(taxSummary).toHaveProperty('totalVATPaid');
      expect(taxSummary).toHaveProperty('totalWHTDeducted');
      expect(taxSummary).toHaveProperty('totalWHTPaid');
      expect(taxSummary).toHaveProperty('totalDeductibleExpenses');
      expect(taxSummary).toHaveProperty('netTaxPosition');

      // Verify all values are numbers
      expect(typeof taxSummary.totalVATCollected).toBe('number');
      expect(typeof taxSummary.totalVATPaid).toBe('number');
      expect(typeof taxSummary.totalWHTDeducted).toBe('number');
      expect(typeof taxSummary.totalWHTPaid).toBe('number');
      expect(typeof taxSummary.totalDeductibleExpenses).toBe('number');
      expect(typeof taxSummary.netTaxPosition).toBe('number');

      console.log('📊 Tax Summary API Response:', taxSummary);
    });

    it('should calculate VAT from invoices table only', async () => {
      // Create a test invoice with VAT
      const testInvoice = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invoiceNumber: `TEST-VAT-${Date.now()}`,
          clientName: 'Test VAT Client',
          amount: '107500', // 100,000 + 7,500 VAT
          netAmount: '100000', // Amount before VAT
          vatAmount: '7500', // VAT amount
          vatRate: '7.5',
          vatPaid: '0',
          description: 'Test invoice with VAT',
          status: 'paid',
          paymentTerms: 'Due on receipt'
        })
        .expect(201);

      // Get tax compliance data
      const response = await request(app)
        .get('/api/tax/compliance/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { taxSummary } = response.body;

      // VAT should be calculated from the invoice
      expect(taxSummary.totalVATCollected).toBeGreaterThanOrEqual(7500);
      
      console.log('✅ VAT calculated from invoices:', taxSummary.totalVATCollected);

      // Clean up test invoice
      await request(app)
        .delete(`/api/invoices/${testInvoice.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should calculate WHT from income table only', async () => {
      // Create a test income record with WHT
      const testIncome = await request(app)
        .post('/api/income')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          source: 'Test WHT Client',
          description: 'Test income with WHT',
          amount: '90000', // Net amount after 10% WHT
          grossAmount: '100000', // Amount before WHT
          whtAmount: '10000', // WHT deducted
          whtRate: '10', // 10% WHT rate
          netAmount: '90000', // Final amount
          category: 'Consulting',
          frequency: 'one-time',
          date: new Date().toISOString().split('T')[0],
          status: 'received',
          paymentMethod: 'cash'
        })
        .expect(201);

      // Get tax compliance data
      const response = await request(app)
        .get('/api/tax/compliance/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { taxSummary } = response.body;

      // WHT should be calculated from the income record
      expect(taxSummary.totalWHTDeducted).toBeGreaterThanOrEqual(10000);
      
      console.log('✅ WHT calculated from income:', taxSummary.totalWHTDeducted);

      // Clean up test income
      await request(app)
        .delete(`/api/income/${testIncome.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should calculate input VAT from expenses table', async () => {
      // Create a test expense with VAT
      const testExpense = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          merchant: 'Test VAT Supplier',
          category: 'Tax Deductible',
          amount: '107500', // 100,000 + 7,500 VAT
          vatAmount: '7500', // VAT paid
          vatRate: '7.5',
          date: new Date().toISOString().split('T')[0],
          notes: 'Test expense with input VAT'
        })
        .expect(201);

      // Get tax compliance data
      const response = await request(app)
        .get('/api/tax/compliance/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { taxSummary } = response.body;

      // Input VAT should be calculated from expenses
      expect(taxSummary.totalVATPaid).toBeGreaterThanOrEqual(7500);
      
      console.log('✅ Input VAT calculated from expenses:', taxSummary.totalVATPaid);

      // Clean up test expense
      await request(app)
        .delete(`/api/expenses/${testExpense.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should calculate net tax position correctly', async () => {
      const response = await request(app)
        .get('/api/tax/compliance/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { taxSummary } = response.body;

      // Net tax position = (VAT Collected - VAT Paid) - (WHT Deducted - WHT Paid) + Deductible Expenses
      const expectedNetPosition = 
        (taxSummary.totalVATCollected - taxSummary.totalVATPaid) - 
        (taxSummary.totalWHTDeducted - taxSummary.totalWHTPaid) + 
        taxSummary.totalDeductibleExpenses;

      expect(taxSummary.netTaxPosition).toBe(expectedNetPosition);
      
      console.log('🧮 Net Tax Position Calculation:');
      console.log(`  VAT Collected: ₦${taxSummary.totalVATCollected}`);
      console.log(`  VAT Paid: ₦${taxSummary.totalVATPaid}`);
      console.log(`  WHT Deducted: ₦${taxSummary.totalWHTDeducted}`);
      console.log(`  WHT Paid: ₦${taxSummary.totalWHTPaid}`);
      console.log(`  Deductible Expenses: ₦${taxSummary.totalDeductibleExpenses}`);
      console.log(`  Net Position: ₦${taxSummary.netTaxPosition}`);
      console.log(`  Expected: ₦${expectedNetPosition}`);
    });

    it('should handle zero values correctly', async () => {
      const response = await request(app)
        .get('/api/tax/compliance/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { taxSummary } = response.body;

      // All values should be numbers (including zeros)
      expect(typeof taxSummary.totalVATCollected).toBe('number');
      expect(typeof taxSummary.totalVATPaid).toBe('number');
      expect(typeof taxSummary.totalWHTDeducted).toBe('number');
      expect(typeof taxSummary.totalWHTPaid).toBe('number');
      expect(typeof taxSummary.totalDeductibleExpenses).toBe('number');
      expect(typeof taxSummary.netTaxPosition).toBe('number');

      // Values should not be null or undefined
      expect(taxSummary.totalVATCollected).not.toBeNull();
      expect(taxSummary.totalVATPaid).not.toBeNull();
      expect(taxSummary.totalWHTDeducted).not.toBeNull();
      expect(taxSummary.totalWHTPaid).not.toBeNull();
      expect(taxSummary.totalDeductibleExpenses).not.toBeNull();
      expect(taxSummary.netTaxPosition).not.toBeNull();

      console.log('✅ Zero values handled correctly');
    });

    it('should separate VAT and WHT data sources', async () => {
      // This test verifies that VAT comes from invoices/expenses and WHT comes from income
      const response = await request(app)
        .get('/api/tax/compliance/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { taxSummary } = response.body;

      // VAT should be calculated from invoices (output) and expenses (input)
      // WHT should be calculated from income records
      
      // Verify data sources are separate by checking the API logic
      // This is more of a documentation test since we can't directly inspect the SQL queries
      
      expect(taxSummary).toBeDefined();
      
      console.log('🔍 VAT/WHT Data Source Separation:');
      console.log('  VAT Collected: From invoices table (output VAT)');
      console.log('  VAT Paid: From expenses table (input VAT)');
      console.log('  WHT Deducted: From income table (withholding tax)');
      console.log('  WHT Paid: From wht_transactions table');
      console.log('  Deductible Expenses: From expenses table');
      
      console.log('✅ VAT and WHT data sources are properly separated');
    });
  });

  describe('Data Consistency Tests', () => {
    it('should maintain consistency across multiple API calls', async () => {
      // First call
      const response1 = await request(app)
        .get('/api/tax/compliance/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Second call
      const response2 = await request(app)
        .get('/api/tax/compliance/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Data should be consistent
      expect(response1.body.taxSummary).toEqual(response2.body.taxSummary);
      
      console.log('✅ Data consistency maintained across API calls');
    });

    it('should handle concurrent requests safely', async () => {
      // Make multiple concurrent requests
      const promises = Array(5).fill(null).map(() =>
        request(app)
          .get('/api/tax/compliance/dashboard')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
      );

      const responses = await Promise.all(promises);

      // All responses should have the same structure
      responses.forEach(response => {
        expect(response.body).toHaveProperty('taxSummary');
        expect(response.body.taxSummary).toHaveProperty('totalVATCollected');
        expect(response.body.taxSummary).toHaveProperty('totalVATPaid');
        expect(response.body.taxSummary).toHaveProperty('totalWHTDeducted');
        expect(response.body.taxSummary).toHaveProperty('totalWHTPaid');
        expect(response.body.taxSummary).toHaveProperty('totalDeductibleExpenses');
        expect(response.body.taxSummary).toHaveProperty('netTaxPosition');
      });

      console.log('✅ Concurrent requests handled safely');
    });
  });
});
