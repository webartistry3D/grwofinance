import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';

// Create a test app for tax calculations
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Nigerian Tax Rates and Rules
const NIGERIAN_TAX_RATES = {
  VAT: 7.5, // 7.5% Value Added Tax
  WHT_CONTRACTS: 5, // 5% for contracts
  WHT_RENTALS: 10, // 10% for rentals
  WHT_INTEREST: 10, // 10% for interest
  WHT_DIVIDENDS: 10, // 10% for dividends
  WHT_ROYALTIES: 5, // 5% for royalties
  WHT_COMMISSIONS: 5, // 5% for commissions
  WHT_DIRECTORS_FEES: 10, // 10% for directors' fees
  CIT: 30, // 30% Company Income Tax
  PERSONAL_INCOME_TAX: {
    FIRST_300K: 7, // 7% on first ₦300,000
    NEXT_300K: 11, // 11% on next ₦300,000
    NEXT_500K: 15, // 15% on next ₦500,000
    NEXT_500K_2: 19, // 19% on next ₦500,000 (second bracket)
    NEXT_1600K: 21, // 21% on next ₦1,600,000
    ABOVE_3200K: 24, // 24% above ₦3,200,000
  }
};

// Mock tax calculation endpoints
app.post('/api/tax/calculations/vat', (req, res) => {
  const { grossAmount, exemptAmount = 0 } = req.body;
  
  // VAT Calculation: (Gross Amount - Exempt Amount) × 7.5%
  const taxableAmount = grossAmount - exemptAmount;
  const vatAmount = taxableAmount * (NIGERIAN_TAX_RATES.VAT / 100);
  const netAmount = grossAmount - vatAmount;
  
  res.json({
    grossAmount,
    exemptAmount,
    taxableAmount,
    vatRate: NIGERIAN_TAX_RATES.VAT,
    vatAmount: Math.round(vatAmount * 100) / 100, // Round to 2 decimal places
    netAmount: Math.round(netAmount * 100) / 100,
    calculation: `(${grossAmount} - ${exemptAmount}) × ${NIGERIAN_TAX_RATES.VAT}% = ${vatAmount.toFixed(2)}`,
  });
});

app.post('/api/tax/calculations/wht', (req, res) => {
  const { contractAmount, whtType, contractorType } = req.body;
  
  // WHT Rate based on type
  let whtRate;
  switch (whtType) {
    case 'contracts':
      whtRate = NIGERIAN_TAX_RATES.WHT_CONTRACTS;
      break;
    case 'rentals':
      whtRate = NIGERIAN_TAX_RATES.WHT_RENTALS;
      break;
    case 'interest':
      whtRate = NIGERIAN_TAX_RATES.WHT_INTEREST;
      break;
    case 'dividends':
      whtRate = NIGERIAN_TAX_RATES.WHT_DIVIDENDS;
      break;
    case 'royalties':
      whtRate = NIGERIAN_TAX_RATES.WHT_ROYALTIES;
      break;
    case 'commissions':
      whtRate = NIGERIAN_TAX_RATES.WHT_COMMISSIONS;
      break;
    case 'directors_fees':
      whtRate = NIGERIAN_TAX_RATES.WHT_DIRECTORS_FEES;
      break;
    default:
      whtRate = NIGERIAN_TAX_RATES.WHT_CONTRACTS;
  }
  
  // WHT Calculation: Contract Amount × WHT Rate
  const whtAmount = contractAmount * (whtRate / 100);
  const netAmount = contractAmount - whtAmount;
  
  res.json({
    contractAmount,
    whtType,
    contractorType,
    whtRate,
    whtAmount: Math.round(whtAmount * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
    calculation: `${contractAmount} × ${whtRate}% = ${whtAmount.toFixed(2)}`,
  });
});

app.post('/api/tax/calculations/paye', (req, res) => {
  const { annualIncome, allowances = 0, reliefs = 0, pension = 0 } = req.body;
  
  // PAYE Calculation (Simplified)
  const taxableIncome = annualIncome - allowances - reliefs - pension;
  let payeAmount = 0;
  let remainingIncome = taxableIncome;
  let taxBreakdown = [];
  
  // Tax brackets calculation
  if (remainingIncome > 0) {
    const firstBracket = Math.min(remainingIncome, 300000);
    const firstTax = firstBracket * (NIGERIAN_TAX_RATES.PERSONAL_INCOME_TAX.FIRST_300K / 100);
    payeAmount += firstTax;
    taxBreakdown.push({
      bracket: 'First ₦300,000',
      rate: NIGERIAN_TAX_RATES.PERSONAL_INCOME_TAX.FIRST_300K,
      amount: firstBracket,
      tax: firstTax
    });
    remainingIncome -= firstBracket;
  }
  
  if (remainingIncome > 0) {
    const secondBracket = Math.min(remainingIncome, 300000);
    const secondTax = secondBracket * (NIGERIAN_TAX_RATES.PERSONAL_INCOME_TAX.NEXT_300K / 100);
    payeAmount += secondTax;
    taxBreakdown.push({
      bracket: 'Next ₦300,000',
      rate: NIGERIAN_TAX_RATES.PERSONAL_INCOME_TAX.NEXT_300K,
      amount: secondBracket,
      tax: secondTax
    });
    remainingIncome -= secondBracket;
  }
  
  if (remainingIncome > 0) {
    const thirdBracket = Math.min(remainingIncome, 500000);
    const thirdTax = thirdBracket * (NIGERIAN_TAX_RATES.PERSONAL_INCOME_TAX.NEXT_500K / 100);
    payeAmount += thirdTax;
    taxBreakdown.push({
      bracket: 'Next ₦500,000',
      rate: NIGERIAN_TAX_RATES.PERSONAL_INCOME_TAX.NEXT_500K,
      amount: thirdBracket,
      tax: thirdTax
    });
    remainingIncome -= thirdBracket;
  }
  
  // Continue with remaining brackets...
  if (remainingIncome > 0) {
    const fourthBracket = Math.min(remainingIncome, 500000);
    const fourthTax = fourthBracket * (NIGERIAN_TAX_RATES.PERSONAL_INCOME_TAX.NEXT_500K_2 / 100);
    payeAmount += fourthTax;
    taxBreakdown.push({
      bracket: 'Next ₦500,000 (second)',
      rate: NIGERIAN_TAX_RATES.PERSONAL_INCOME_TAX.NEXT_500K_2,
      amount: fourthBracket,
      tax: fourthTax
    });
    remainingIncome -= fourthBracket;
  }
  
  if (remainingIncome > 0) {
    const fifthBracket = Math.min(remainingIncome, 1600000);
    const fifthTax = fifthBracket * (NIGERIAN_TAX_RATES.PERSONAL_INCOME_TAX.NEXT_1600K / 100);
    payeAmount += fifthTax;
    taxBreakdown.push({
      bracket: 'Next ₦1,600,000',
      rate: NIGERIAN_TAX_RATES.PERSONAL_INCOME_TAX.NEXT_1600K,
      amount: fifthBracket,
      tax: fifthTax
    });
    remainingIncome -= fifthBracket;
  }
  
  if (remainingIncome > 0) {
    const sixthTax = remainingIncome * (NIGERIAN_TAX_RATES.PERSONAL_INCOME_TAX.ABOVE_3200K / 100);
    payeAmount += sixthTax;
    taxBreakdown.push({
      bracket: 'Above ₦3,200,000',
      rate: NIGERIAN_TAX_RATES.PERSONAL_INCOME_TAX.ABOVE_3200K,
      amount: remainingIncome,
      tax: sixthTax
    });
  }
  
  const monthlyPaye = payeAmount / 12;
  
  res.json({
    annualIncome,
    allowances,
    reliefs,
    pension,
    taxableIncome,
    annualPaye: Math.round(payeAmount * 100) / 100,
    monthlyPaye: Math.round(monthlyPaye * 100) / 100,
    effectiveTaxRate: ((payeAmount / annualIncome) * 100).toFixed(2),
    taxBreakdown,
  });
});

app.post('/api/tax/calculations/cit', (req, res) => {
  const { assessableProfit, taxRate = NIGERIAN_TAX_RATES.CIT, reliefs = 0 } = req.body;
  
  // CIT Calculation: (Assessable Profit - Reliefs) × Tax Rate
  const taxableProfit = assessableProfit - reliefs;
  const citAmount = taxableProfit * (taxRate / 100);
  
  res.json({
    assessableProfit,
    reliefs,
    taxableProfit,
    taxRate,
    citAmount: Math.round(citAmount * 100) / 100,
    calculation: `(${assessableProfit} - ${reliefs}) × ${taxRate}% = ${citAmount.toFixed(2)}`,
  });
});

app.post('/api/tax/calculations/net-tax-position', (req, res) => {
  const { 
    vatCollected, 
    vatPaid, 
    whtDeducted, 
    whtPaid, 
    deductibleExpenses,
    otherTaxesPaid = 0 
  } = req.body;
  
  // Net Tax Position Calculation
  const netVatPosition = vatCollected - vatPaid;
  const netWhtPosition = whtDeducted - whtPaid;
  const totalTaxLiability = netVatPosition + netWhtPosition;
  const netTaxPosition = totalTaxLiability - deductibleExpenses - otherTaxesPaid;
  
  res.json({
    vatCollected,
    vatPaid,
    whtDeducted,
    whtPaid,
    deductibleExpenses,
    otherTaxesPaid,
    netVatPosition: Math.round(netVatPosition * 100) / 100,
    netWhtPosition: Math.round(netWhtPosition * 100) / 100,
    totalTaxLiability: Math.round(totalTaxLiability * 100) / 100,
    netTaxPosition: Math.round(netTaxPosition * 100) / 100,
    position: netTaxPosition >= 0 ? 'PAYABLE' : 'REFUNDABLE',
    calculation: `(${vatCollected} - ${vatPaid}) + (${whtDeducted} - ${whtPaid}) - ${deductibleExpenses} - ${otherTaxesPaid} = ${netTaxPosition.toFixed(2)}`,
  });
});

app.get('/api/tax/calculations/rates', (req, res) => {
  res.json({
    vat: NIGERIAN_TAX_RATES.VAT,
    cit: NIGERIAN_TAX_RATES.CIT,
    wht: {
      contracts: NIGERIAN_TAX_RATES.WHT_CONTRACTS,
      rentals: NIGERIAN_TAX_RATES.WHT_RENTALS,
      interest: NIGERIAN_TAX_RATES.WHT_INTEREST,
      dividends: NIGERIAN_TAX_RATES.WHT_DIVIDENDS,
      royalties: NIGERIAN_TAX_RATES.WHT_ROYALTIES,
      commissions: NIGERIAN_TAX_RATES.WHT_COMMISSIONS,
      directors_fees: NIGERIAN_TAX_RATES.WHT_DIRECTORS_FEES,
    },
    paye: NIGERIAN_TAX_RATES.PERSONAL_INCOME_TAX,
    lastUpdated: '2024-01-01',
    source: 'FIRS - Federal Inland Revenue Service',
  });
});

describe('Nigerian Tax Calculations Tests', () => {
  describe('VAT Calculations', () => {
    it('should calculate VAT correctly for standard amounts', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/vat')
        .send({
          grossAmount: 100000,
          exemptAmount: 0
        })
        .expect(200);

      expect(response.body.vatRate).toBe(7.5);
      expect(response.body.vatAmount).toBe(7500);
      expect(response.body.netAmount).toBe(92500);
      expect(response.body.calculation).toBe('(100000 - 0) × 7.5% = 7500.00');
    });

    it('should calculate VAT with exempt amounts', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/vat')
        .send({
          grossAmount: 100000,
          exemptAmount: 20000
        })
        .expect(200);

      expect(response.body.taxableAmount).toBe(80000);
      expect(response.body.vatAmount).toBe(6000);
      expect(response.body.netAmount).toBe(94000);
      expect(response.body.calculation).toBe('(100000 - 20000) × 7.5% = 6000.00');
    });

    it('should handle zero VAT calculation', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/vat')
        .send({
          grossAmount: 0,
          exemptAmount: 0
        })
        .expect(200);

      expect(response.body.vatAmount).toBe(0);
      expect(response.body.netAmount).toBe(0);
    });

    it('should round VAT to 2 decimal places', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/vat')
        .send({
          grossAmount: 100001,
          exemptAmount: 0
        })
        .expect(200);

      expect(response.body.vatAmount).toBe(7500.08); // 100001 × 0.075 = 7500.075 → 7500.08
    });
  });

  describe('WHT Calculations', () => {
    it('should calculate WHT for contracts at 10%', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/wht')
        .send({
          contractAmount: 100000,
          whtType: 'contracts',
          contractorType: 'individual'
        })
        .expect(200);

      expect(response.body.whtRate).toBe(10);
      expect(response.body.whtAmount).toBe(10000);
      expect(response.body.netAmount).toBe(90000);
      expect(response.body.calculation).toBe('100000 × 10% = 10000.00');
    });

    it('should calculate WHT for rentals at 10%', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/wht')
        .send({
          contractAmount: 200000,
          whtType: 'rentals',
          contractorType: 'company'
        })
        .expect(200);

      expect(response.body.whtRate).toBe(10);
      expect(response.body.whtAmount).toBe(20000);
      expect(response.body.netAmount).toBe(180000);
      expect(response.body.calculation).toBe('200000 × 10% = 20000.00');
    });

    it('should calculate WHT for directors fees at 10%', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/wht')
        .send({
          contractAmount: 150000,
          whtType: 'directors_fees',
          contractorType: 'individual'
        })
        .expect(200);

      expect(response.body.whtRate).toBe(10);
      expect(response.body.whtAmount).toBe(15000);
      expect(response.body.netAmount).toBe(135000);
    });

    it('should default to contracts rate for unknown WHT types', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/wht')
        .send({
          contractAmount: 100000,
          whtType: 'unknown',
          contractorType: 'individual'
        })
        .expect(200);

      expect(response.body.whtRate).toBe(10);
      expect(response.body.whtAmount).toBe(10000);
    });
  });

  describe('PAYE Calculations', () => {
    it('should calculate PAYE for income in first bracket', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/paye')
        .send({
          annualIncome: 200000,
          allowances: 0,
          reliefs: 0,
          pension: 0
        })
        .expect(200);

      expect(response.body.annualPaye).toBe(14000); // 200000 × 7%
      expect(response.body.monthlyPaye).toBe(1166.67);
      expect(response.body.effectiveTaxRate).toBe('7.00');
      expect(response.body.taxBreakdown).toHaveLength(1);
      expect(response.body.taxBreakdown[0].rate).toBe(7);
    });

    it('should calculate PAYE for income across multiple brackets', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/paye')
        .send({
          annualIncome: 800000,
          allowances: 50000,
          reliefs: 0,
          pension: 0
        })
        .expect(200);

      expect(response.body.taxableIncome).toBe(750000);
      expect(response.body.annualPaye).toBe(95000); // Complex calculation
      expect(response.body.monthlyPaye).toBe(7916.67);
      expect(response.body.effectiveTaxRate).toBe('11.88');
      expect(response.body.taxBreakdown.length).toBeGreaterThan(1);
    });

    it('should calculate PAYE with allowances and reliefs', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/paye')
        .send({
          annualIncome: 1000000,
          allowances: 100000,
          reliefs: 50000,
          pension: 20000
        })
        .expect(200);

      expect(response.body.taxableIncome).toBe(830000);
      expect(response.body.annualPaye).toBeGreaterThan(0);
      expect(response.body.effectiveTaxRate).toBeGreaterThan(0);
    });

    it('should handle zero income for PAYE', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/paye')
        .send({
          annualIncome: 0,
          allowances: 0,
          reliefs: 0,
          pension: 0
        })
        .expect(200);

      expect(response.body.annualPaye).toBe(0);
      expect(response.body.monthlyPaye).toBe(0);
      expect(response.body.effectiveTaxRate).toBe('0.00');
    });
  });

  describe('CIT Calculations', () => {
    it('should calculate Company Income Tax at standard rate', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/cit')
        .send({
          assessableProfit: 1000000,
          taxRate: 30,
          reliefs: 0
        })
        .expect(200);

      expect(response.body.taxRate).toBe(30);
      expect(response.body.citAmount).toBe(300000);
      expect(response.body.calculation).toBe('(1000000 - 0) × 30% = 300000.00');
    });

    it('should calculate CIT with reliefs', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/cit')
        .send({
          assessableProfit: 1000000,
          taxRate: 30,
          reliefs: 100000
        })
        .expect(200);

      expect(response.body.taxableProfit).toBe(900000);
      expect(response.body.citAmount).toBe(270000);
      expect(response.body.calculation).toBe('(1000000 - 100000) × 30% = 270000.00');
    });

    it('should handle zero profit for CIT', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/cit')
        .send({
          assessableProfit: 0,
          taxRate: 30,
          reliefs: 0
        })
        .expect(200);

      expect(response.body.citAmount).toBe(0);
    });
  });

  describe('Net Tax Position Calculations', () => {
    it('should calculate net tax position correctly', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/net-tax-position')
        .send({
          vatCollected: 75000,
          vatPaid: 60000,
          whtDeducted: 15000,
          whtPaid: 12000,
          deductibleExpenses: 25000,
          otherTaxesPaid: 0
        })
        .expect(200);

      expect(response.body.netVatPosition).toBe(15000);
      expect(response.body.netWhtPosition).toBe(3000);
      expect(response.body.totalTaxLiability).toBe(18000);
      expect(response.body.netTaxPosition).toBe(-7000);
      expect(response.body.position).toBe('REFUNDABLE');
    });

    it('should identify payable tax position', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/net-tax-position')
        .send({
          vatCollected: 75000,
          vatPaid: 60000,
          whtDeducted: 15000,
          whtPaid: 12000,
          deductibleExpenses: 5000,
          otherTaxesPaid: 0
        })
        .expect(200);

      expect(response.body.netTaxPosition).toBe(13000);
      expect(response.body.position).toBe('PAYABLE');
    });

    it('should handle zero tax position', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/net-tax-position')
        .send({
          vatCollected: 75000,
          vatPaid: 75000,
          whtDeducted: 15000,
          whtPaid: 15000,
          deductibleExpenses: 0,
          otherTaxesPaid: 0
        })
        .expect(200);

      expect(response.body.netTaxPosition).toBe(0);
      expect(response.body.position).toBe('REFUNDABLE'); // Zero is considered refundable
    });
  });

  describe('Tax Rates API', () => {
    it('should return current Nigerian tax rates', async () => {
      const response = await request(app)
        .get('/api/tax/calculations/rates')
        .expect(200);

      expect(response.body.vat).toBe(7.5);
      expect(response.body.cit).toBe(30);
      expect(response.body.wht.contracts).toBe(5);
      expect(response.body.wht.rentals).toBe(10);
      expect(response.body.wht.interest).toBe(10);
      expect(response.body.wht.dividends).toBe(10);
      expect(response.body.wht.royalties).toBe(5);
      expect(response.body.wht.commissions).toBe(5);
      expect(response.body.wht.directors_fees).toBe(10);
      expect(response.body.paye.FIRST_300K).toBe(7);
      expect(response.body.paye.NEXT_300K).toBe(11);
      expect(response.body.source).toBe('FIRS - Federal Inland Revenue Service');
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle negative amounts in VAT calculation', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/vat')
        .send({
          grossAmount: -100000,
          exemptAmount: 0
        })
        .expect(200);

      expect(response.body.vatAmount).toBe(-7500);
      expect(response.body.netAmount).toBe(-107500);
    });

    it('should handle large amounts in tax calculations', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/vat')
        .send({
          grossAmount: 1000000000,
          exemptAmount: 0
        })
        .expect(200);

      expect(response.body.vatAmount).toBe(75000000);
      expect(response.body.netAmount).toBe(925000000);
    });

    it('should handle decimal precision correctly', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/vat')
        .send({
          grossAmount: 100.50,
          exemptAmount: 0.25
        })
        .expect(200);

      expect(response.body.vatAmount).toBe(7.51); // (100.50 - 0.25) × 0.075 = 7.5125 → 7.51
      expect(response.body.netAmount).toBe(92.99);
    });

    it('should validate required fields in tax calculations', async () => {
      const response = await request(app)
        .post('/api/tax/calculations/vat')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Integration with Real Business Scenarios', () => {
    it('should calculate complete tax scenario for small business', async () => {
      // VAT Calculation
      const vatResponse = await request(app)
        .post('/api/tax/calculations/vat')
        .send({
          grossAmount: 500000,
          exemptAmount: 50000
        })
        .expect(200);

      // WHT Calculation
      const whtResponse = await request(app)
        .post('/api/tax/calculations/wht')
        .send({
          contractAmount: 100000,
          whtType: 'contracts',
          contractorType: 'company'
        })
        .expect(200);

      // CIT Calculation
      const citResponse = await request(app)
        .post('/api/tax/calculations/cit')
        .send({
          assessableProfit: 200000,
          taxRate: 30,
          reliefs: 0
        })
        .expect(200);

      // Net Tax Position
      const netPositionResponse = await request(app)
        .post('/api/tax/calculations/net-tax-position')
        .send({
          vatCollected: vatResponse.body.vatAmount,
          vatPaid: 0,
          whtDeducted: whtResponse.body.whtAmount,
          whtPaid: 0,
          deductibleExpenses: 50000,
          otherTaxesPaid: citResponse.body.citAmount
        })
        .expect(200);

      expect(vatResponse.body.vatAmount).toBe(33750);
      expect(whtResponse.body.whtAmount).toBe(5000);
      expect(citResponse.body.citAmount).toBe(60000);
      expect(netPositionResponse.body.netTaxPosition).toBeLessThan(0);
    });
  });
});
