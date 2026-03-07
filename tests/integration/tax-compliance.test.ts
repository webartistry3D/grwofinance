import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a test app instance
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register all routes (this will include tax compliance routes)
import { registerRoutes } from '../../../server/routes';
registerRoutes(app);

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

describe('Tax Compliance API Integration Tests', () => {
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

  describe('GET /api/tax/compliance/dashboard', () => {
    it('should return tax compliance dashboard data', async () => {
      const response = await request(app)
        .get('/api/tax/compliance/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('firsCompliance');
      expect(response.body).toHaveProperty('taxSummary');
      expect(response.body).toHaveProperty('upcomingDeadlines');
      expect(response.body).toHaveProperty('recentReports');
      expect(response.body).toHaveProperty('quickActions');

      // Check FIRS compliance structure
      expect(response.body.firsCompliance).toHaveProperty('status');
      expect(response.body.firsCompliance).toHaveProperty('lastFilingDate');
      expect(response.body.firsCompliance).toHaveProperty('nextFilingDate');
      expect(response.body.firsCompliance).toHaveProperty('complianceScore');

      // Check tax summary structure
      expect(response.body.taxSummary).toHaveProperty('vatCollected');
      expect(response.body.taxSummary).toHaveProperty('vatPaid');
      expect(response.body.taxSummary).toHaveProperty('whtDeducted');
      expect(response.body.taxSummary).toHaveProperty('whtPaid');
      expect(response.body.taxSummary).toHaveProperty('netTaxPosition');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/tax/compliance/dashboard')
        .expect(401);
    });

    it('should handle invalid token', async () => {
      await request(app)
        .get('/api/tax/compliance/dashboard')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('GET /api/tax/calendar', () => {
    it('should return tax calendar entries', async () => {
      const response = await request(app)
        .get('/api/tax/calendar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const calendarEntry = response.body[0];
        expect(calendarEntry).toHaveProperty('id');
        expect(calendarEntry).toHaveProperty('title');
        expect(calendarEntry).toHaveProperty('description');
        expect(calendarEntry).toHaveProperty('dueDate');
        expect(calendarEntry).toHaveProperty('status');
        expect(calendarEntry).toHaveProperty('taxType');
        expect(calendarEntry).toHaveProperty('userId');
      }
    });

    it('should filter by tax type', async () => {
      const response = await request(app)
        .get('/api/tax/calendar?taxType=VAT')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        response.body.forEach((entry: any) => {
          expect(entry.taxType).toBe('VAT');
        });
      }
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/tax/calendar?status=pending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        response.body.forEach((entry: any) => {
          expect(entry.status).toBe('pending');
        });
      }
    });
  });

  describe('POST /api/tax/calendar', () => {
    it('should create new tax calendar entry', async () => {
      const newEntry = {
        title: 'Q1 VAT Filing',
        description: 'First quarter VAT filing deadline',
        dueDate: '2024-04-20T00:00:00.000Z',
        taxType: 'VAT',
        status: 'pending'
      };

      const response = await request(app)
        .post('/api/tax/calendar')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newEntry)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newEntry.title);
      expect(response.body.description).toBe(newEntry.description);
      expect(response.body.taxType).toBe(newEntry.taxType);
      expect(response.body.status).toBe(newEntry.status);
      expect(response.body.userId).toBe(userId);
    });

    it('should validate required fields', async () => {
      const invalidEntry = {
        description: 'Missing required fields'
      };

      const response = await request(app)
        .post('/api/tax/calendar')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEntry)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate tax type', async () => {
      const invalidEntry = {
        title: 'Invalid Tax Type',
        description: 'Test with invalid tax type',
        dueDate: '2024-04-20T00:00:00.000Z',
        taxType: 'INVALID_TYPE',
        status: 'pending'
      };

      await request(app)
        .post('/api/tax/calendar')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEntry)
        .expect(400);
    });
  });

  describe('PATCH /api/tax/calendar/:id', () => {
    let calendarId: string;

    beforeAll(async () => {
      // Create a calendar entry for testing
      const response = await request(app)
        .post('/api/tax/calendar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Calendar Entry',
          description: 'For testing purposes',
          dueDate: '2024-04-20T00:00:00.000Z',
          taxType: 'VAT',
          status: 'pending'
        });
      
      calendarId = response.body.id;
    });

    it('should update calendar entry status', async () => {
      const updateData = {
        status: 'completed'
      };

      const response = await request(app)
        .patch(`/api/tax/calendar/${calendarId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('completed');
    });

    it('should validate status values', async () => {
      const invalidUpdate = {
        status: 'invalid_status'
      };

      await request(app)
        .patch(`/api/tax/calendar/${calendarId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate)
        .expect(400);
    });

    it('should handle non-existent entry', async () => {
      await request(app)
        .patch('/api/tax/calendar/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'completed' })
        .expect(404);
    });
  });

  describe('DELETE /api/tax/calendar/:id', () => {
    let calendarId: string;

    beforeAll(async () => {
      // Create a calendar entry for deletion testing
      const response = await request(app)
        .post('/api/tax/calendar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'To Be Deleted',
          description: 'For deletion testing',
          dueDate: '2024-04-20T00:00:00.000Z',
          taxType: 'VAT',
          status: 'pending'
        });
      
      calendarId = response.body.id;
    });

    it('should delete calendar entry', async () => {
      await request(app)
        .delete(`/api/tax/calendar/${calendarId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/tax/calendar/${calendarId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle non-existent entry deletion', async () => {
      await request(app)
        .delete('/api/tax/calendar/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/tax/reports', () => {
    it('should return tax reports', async () => {
      const response = await request(app)
        .get('/api/tax/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const report = response.body[0];
        expect(report).toHaveProperty('id');
        expect(report).toHaveProperty('title');
        expect(report).toHaveProperty('reportType');
        expect(report).toHaveProperty('period');
        expect(report).toHaveProperty('generatedDate');
        expect(report).toHaveProperty('filePath');
        expect(report).toHaveProperty('userId');
      }
    });

    it('should filter by report type', async () => {
      const response = await request(app)
        .get('/api/tax/reports?reportType=VAT')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        response.body.forEach((report: any) => {
          expect(report.reportType).toBe('VAT');
        });
      }
    });
  });

  describe('POST /api/tax/reports', () => {
    it('should generate new tax report', async () => {
      const reportData = {
        title: 'Q1 2024 VAT Report',
        reportType: 'VAT',
        period: '2024-Q1',
        includeDetails: true
      };

      const response = await request(app)
        .post('/api/tax/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(reportData.title);
      expect(response.body.reportType).toBe(reportData.reportType);
      expect(response.body.period).toBe(reportData.period);
      expect(response.body).toHaveProperty('filePath');
      expect(response.body.userId).toBe(userId);
    });

    it('should calculate tax amounts correctly', async () => {
      const reportData = {
        title: 'Test Tax Calculation Report',
        reportType: 'VAT',
        period: '2024-Q1',
        includeDetails: true
      };

      const response = await request(app)
        .post('/api/tax/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportData)
        .expect(201);

      expect(response.body).toHaveProperty('vatCollected');
      expect(response.body).toHaveProperty('vatPaid');
      expect(response.body).toHaveProperty('netVat');
      expect(response.body).toHaveProperty('totalTransactions');
      
      // Verify calculations
      const expectedNetVat = response.body.vatCollected - response.body.vatPaid;
      expect(response.body.netVat).toBe(expectedNetVat);
    });
  });

  describe('GET /api/tax/reports/:id/download', () => {
    let reportId: string;

    beforeAll(async () => {
      // Create a report for download testing
      const response = await request(app)
        .post('/api/tax/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Download Test Report',
          reportType: 'VAT',
          period: '2024-Q1',
          includeDetails: true
        });
      
      reportId = response.body.id;
    });

    it('should download report file', async () => {
      const response = await request(app)
        .get(`/api/tax/reports/${reportId}/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/(pdf|excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)/);
      expect(response.headers['content-disposition']).toMatch(/attachment/);
    });

    it('should handle non-existent report download', async () => {
      await request(app)
        .get('/api/tax/reports/99999/download')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Tax Receipts API', () => {
    describe('GET /api/tax/receipts', () => {
      it('should return tax receipts', async () => {
        const response = await request(app)
          .get('/api/tax/receipts')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        
        if (response.body.length > 0) {
          const receipt = response.body[0];
          expect(receipt).toHaveProperty('id');
          expect(receipt).toHaveProperty('title');
          expect(receipt).toHaveProperty('receiptType');
          expect(receipt).toHaveProperty('amount');
          expect(receipt).toHaveProperty('receiptDate');
          expect(receipt).toHaveProperty('filePath');
          expect(receipt).toHaveProperty('userId');
        }
      });
    });

    describe('POST /api/tax/receipts', () => {
      it('should upload tax receipt', async () => {
        const receiptData = {
          title: 'VAT Receipt Test',
          receiptType: 'VAT',
          amount: 7500,
          receiptDate: '2024-03-15T00:00:00.000Z',
          description: 'Test VAT receipt upload'
        };

        const response = await request(app)
          .post('/api/tax/receipts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(receiptData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.title).toBe(receiptData.title);
        expect(response.body.receiptType).toBe(receiptData.receiptType);
        expect(response.body.amount).toBe(receiptData.amount);
        expect(response.body.userId).toBe(userId);
      });
    });

    describe('PATCH /api/tax/receipts/:id', () => {
      let receiptId: string;

      beforeAll(async () => {
        // Create a receipt for testing
        const response = await request(app)
          .post('/api/tax/receipts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Update Test Receipt',
            receiptType: 'VAT',
            amount: 5000,
            receiptDate: '2024-03-15T00:00:00.000Z'
          });
        
        receiptId = response.body.id;
      });

      it('should update receipt details', async () => {
        const updateData = {
          title: 'Updated Receipt Title',
          amount: 6000
        };

        const response = await request(app)
          .patch(`/api/tax/receipts/${receiptId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.title).toBe(updateData.title);
        expect(response.body.amount).toBe(updateData.amount);
      });
    });
  });

  describe('WHT Tracking API', () => {
    describe('GET /api/tax/wht', () => {
      it('should return WHT records', async () => {
        const response = await request(app)
          .get('/api/tax/wht')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        
        if (response.body.length > 0) {
          const whtRecord = response.body[0];
          expect(whtRecord).toHaveProperty('id');
          expect(whtRecord).toHaveProperty('contractorName');
          expect(whtRecord).toHaveProperty('contractAmount');
          expect(whtRecord).toHaveProperty('whtRate');
          expect(whtRecord).toHaveProperty('whtAmount');
          expect(whtRecord).toHaveProperty('status');
          expect(whtRecord).toHaveProperty('userId');
        }
      });
    });

    describe('POST /api/tax/wht', () => {
      it('should create new WHT record', async () => {
        const whtData = {
          contractorName: 'Test Contractor',
          contractAmount: 100000,
          whtRate: 10,
          whtAmount: 10000,
          status: 'pending'
        };

        const response = await request(app)
          .post('/api/tax/wht')
          .set('Authorization', `Bearer ${authToken}`)
          .send(whtData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.contractorName).toBe(whtData.contractorName);
        expect(response.body.contractAmount).toBe(whtData.contractAmount);
        expect(response.body.whtRate).toBe(whtData.whtRate);
        expect(response.body.whtAmount).toBe(whtData.whtAmount);
        expect(response.body.status).toBe(whtData.status);
        expect(response.body.userId).toBe(userId);
      });

      it('should validate WHT calculations', async () => {
        const whtData = {
          contractorName: 'Calculation Test',
          contractAmount: 200000,
          whtRate: 10,
          whtAmount: 20000, // Correct calculation: 200000 * 0.10 = 20000
          status: 'pending'
        };

        const response = await request(app)
          .post('/api/tax/wht')
          .set('Authorization', `Bearer ${authToken}`)
          .send(whtData)
          .expect(201);

        expect(response.body.whtAmount).toBe(20000);
      });
    });

    describe('PATCH /api/tax/wht/:id', () => {
      let whtId: string;

      beforeAll(async () => {
        // Create a WHT record for testing
        const response = await request(app)
          .post('/api/tax/wht')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            contractorName: 'Status Update Test',
            contractAmount: 50000,
            whtRate: 10,
            whtAmount: 5000,
            status: 'pending'
          });
        
        whtId = response.body.id;
      });

      it('should update WHT status to remitted', async () => {
        const updateData = {
          status: 'remitted',
          remittanceDate: new Date().toISOString()
        };

        const response = await request(app)
          .patch(`/api/tax/wht/${whtId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.status).toBe('remitted');
        expect(response.body).toHaveProperty('remittanceDate');
      });

      it('should update WHT status to certified', async () => {
        const updateData = {
          status: 'certified',
          certificateNumber: 'WHT-2024-001',
          certificateDate: new Date().toISOString()
        };

        const response = await request(app)
          .patch(`/api/tax/wht/${whtId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.status).toBe('certified');
        expect(response.body.certificateNumber).toBe(updateData.certificateNumber);
        expect(response.body).toHaveProperty('certificateDate');
      });
    });
  });

  describe('FIRS Compliance API', () => {
    describe('GET /api/tax/firs/compliance', () => {
      it('should return FIRS compliance status', async () => {
        const response = await request(app)
          .get('/api/tax/firs/compliance')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('complianceScore');
        expect(response.body).toHaveProperty('lastFilingDate');
        expect(response.body).toHaveProperty('nextFilingDate');
        expect(response.body).toHaveProperty('requiredFilings');
        expect(response.body).toHaveProperty('completedFilings');
      });
    });

    describe('POST /api/tax/firs/compliance', () => {
      it('should submit FIRS compliance form', async () => {
        const complianceData = {
          taxId: '12345678-0001',
          businessName: 'Test Business Ltd',
          businessType: 'Limited Liability Company',
          taxYear: '2024',
          filingFrequency: 'monthly',
          vatRegistration: true,
          whtRegistration: true,
          payeRegistration: true,
          annualTurnover: 5000000,
          numberOfEmployees: 25
        };

        const response = await request(app)
          .post('/api/tax/firs/compliance')
          .set('Authorization', `Bearer ${authToken}`)
          .send(complianceData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.taxId).toBe(complianceData.taxId);
        expect(response.body.businessName).toBe(complianceData.businessName);
        expect(response.body.userId).toBe(userId);
      });
    });
  });
});
