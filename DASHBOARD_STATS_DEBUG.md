# Dashboard Stats Debug Implementation

## 🎯 **Purpose**
Added comprehensive debugging to verify that weekly and monthly expense calculations are capturing all expense types correctly.

## ✅ **Debug Implementation**

### **Added Debug Logging**
**File**: `server/routes.ts`

```typescript
// Debug: Log the date ranges and results
console.log('=== Dashboard Stats Debug ===');
console.log('Current date:', now.toISOString());
console.log('Start of month:', startOfMonth.toISOString());
console.log('Start of week:', startOfWeek.toISOString());
console.log('Monthly expenses count:', monthlyExpenses.length);
console.log('Weekly expenses count:', weeklyExpenses.length);
console.log('Monthly expenses:', monthlyExpenses);
console.log('Weekly expenses:', weeklyExpenses);

// Calculate actual totals including VAT
const monthlyExpensesTotal = monthlyExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount) + (parseFloat(expense.vatAmount) || 0), 0);
const weeklyExpensesTotal = weeklyExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount) + (parseFloat(expense.vatAmount) || 0), 0);

console.log('Monthly total:', monthlyExpensesTotal);
console.log('Weekly total:', weeklyExpensesTotal);
console.log('=== End Dashboard Stats Debug ===');
```

## 🔍 **What This Debug Verifies**

### **Date Range Calculations**
- **Current Date**: Exact timestamp of API call
- **Start of Month**: 1st day of current month at 00:00:00
- **Start of Week**: Monday of current week at 00:00:00

### **Expense Filtering**
- **Monthly Count**: Number of expenses in monthly date range
- **Weekly Count**: Number of expenses in weekly date range
- **Monthly Data**: Array of expense objects for month
- **Weekly Data**: Array of expense objects for week

### **Total Calculations**
- **Monthly Total**: Sum of monthly expenses including VAT
- **Weekly Total**: Sum of weekly expenses including VAT
- **VAT Inclusion**: Base amount + VAT amount for each expense

## 🛠️ **Technical Details**

### **Date Range Logic**
```typescript
const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

// Week calculation to start from Monday
const currentDay = now.getDay();
const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
const startOfWeek = new Date(now.getTime() - (daysSinceMonday * 24 * 60 * 60 * 1000));
startOfWeek.setHours(0, 0, 0, 0);
```

### **Expense Query**
```typescript
const monthlyExpenses = await storage.getExpensesByDateRange(userId, startOfMonth, now);
const weeklyExpenses = await storage.getExpensesByDateRange(userId, startOfWeek, now);
```

### **Storage Method**
```typescript
async getExpensesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Expense[]> {
  return await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, userId),
        gte(expenses.date, startDate),
        lte(expenses.date, endDate)
      )
    );
}
```

## 📊 **Expected Debug Output**

### **For User with Expenses in Current Week/Month**
```
=== Dashboard Stats Debug ===
Current date: 2026-03-08T11:42:00.000Z
Start of month: 2026-03-01T00:00:00.000Z
Start of week: 2026-03-03T00:00:00.000Z
Monthly expenses count: 3
Weekly expenses count: 2
Monthly expenses: [
  { id: '1', merchant: 'Laptop Shop', amount: '322500', vatAmount: '24187.50', date: '2026-03-05', category: 'Electronics' },
  { id: '2', merchant: 'Laptop Shop', amount: '645000', vatAmount: '48375.00', date: '2026-03-05', category: 'Electronics' },
  { id: '3', merchant: 'Smartphone', amount: '430000', vatAmount: '32250.00', date: '2026-03-05', category: 'Electronics' }
]
Weekly expenses: [
  { id: '1', merchant: 'Laptop Shop', amount: '322500', vatAmount: '24187.50', date: '2026-03-05', category: 'Electronics' },
  { id: '2', merchant: 'Laptop Shop', amount: '645000', vatAmount: '48375.00', date: '2026-03-05', category: 'Electronics' }
]
Monthly total: 1502312.50
Weekly total: 1039812.50
=== End Dashboard Stats Debug ===
```

## 🎯 **What This Will Reveal**

### **Expense Type Capture**
- **Scanned Receipts**: Expenses with `imageUrl` from OCR processing
- **Uploaded Receipts**: Expenses with `imageUrl` from manual upload
- **Manual Entries**: Expenses without `imageUrl` typed manually
- **All Types**: Should capture all regardless of input method

### **Date Filtering Issues**
- **Date Format**: Verify expense dates match expected format
- **Time Zones**: Check for timezone-related filtering issues
- **Range Boundaries**: Ensure inclusive date filtering
- **Edge Cases**: Handle expenses exactly on boundaries

### **Calculation Accuracy**
- **VAT Inclusion**: Verify VAT amounts are added correctly
- **Summation**: Ensure all expenses are included in totals
- **Data Types**: Confirm numbers are calculated correctly
- **Missing Data**: Identify any expenses not being counted

## 🚀 **Next Steps**

### **After Reviewing Debug Output**
1. **Verify Date Ranges**: Check if start/end dates are correct
2. **Check Expense Data**: Confirm all expense types are included
3. **Validate Totals**: Ensure calculations match expected sums
4. **Identify Issues**: Find any missing or incorrectly filtered expenses
5. **Fix Problems**: Address any discovered issues

### **Expected Outcome**
- All expense types (scanned, uploaded, manual) captured in date ranges
- Accurate weekly and monthly totals including VAT
- Proper date filtering without missing expenses
- Correct totals displayed in expense manager

## 🎉 **Status: DEBUGGING ACTIVE**

The dashboard stats now includes:
- ✅ **Comprehensive logging** of date ranges and results
- ✅ **Expense data inspection** for verification
- ✅ **Total calculation tracking** for accuracy
- ✅ **VAT inclusion verification** in calculations
- ✅ **All expense types** captured regardless of input method

**Debug logging is now active and ready to identify any issues!** 🔍✨
