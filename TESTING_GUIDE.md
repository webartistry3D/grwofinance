# Comprehensive Testing Guide - GrwoFinance Platform

## Table of Contents
1. [Overview](#overview)
2. [Testing Setup](#testing-setup)
3. [Authentication Testing](#authentication-testing)
4. [Dashboard Testing](#dashboard-testing)
5. [Income Management Testing](#income-management-testing)
6. [Expense Management Testing](#expense-management-testing)
7. [Reports Testing](#reports-testing)
8. [Invoice Management Testing](#invoice-management-testing)
9. [Receipt Processing Testing](#receipt-processing-testing)
10. [Settings & Profile Testing](#settings--profile-testing)
11. [Admin Dashboard Testing](#admin-dashboard-testing)
12. [Navigation Testing](#navigation-testing)
13. [Cross-Browser Testing](#cross-browser-testing)
14. [Performance Testing](#performance-testing)
15. [Security Testing](#security-testing)
16. [Test Data Management](#test-data-management)
17. [Continuous Integration](#continuous-integration)

---

## Overview

GrwoFinance is a comprehensive financial management platform with the following key modules:
- **Authentication System**: Login, registration, admin registration
- **Dashboard**: Global dashboard for users, admin dashboard for administrators
- **Income Management**: Add, track, and manage income sources
- **Expense Management**: Create, categorize, and track expenses
- **Reports**: Generate and export financial reports
- **Invoice Management**: Create, edit, and manage invoices
- **Receipt Processing**: Scan and upload receipts for expense tracking
- **Settings**: Profile, budget, privacy, and subscription management

### Testing Stack
- **E2E Testing**: Playwright
- **Unit Testing**: Vitest
- **Browsers**: Chromium, Firefox, WebKit (Safari)
- **Test Environment**: http://localhost:5173

---

## Testing Setup

### Prerequisites
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Configure DATABASE_URL, SESSION_SECRET, etc.
```

### Running Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e tests/e2e/auth/
npm run test:e2e tests/e2e/dashboard/

# Run tests in headed mode (for debugging)
npm run test:e2e -- --headed

# Run tests with trace
npm run test:e2e -- --trace on

# Run specific test file
npm run test:e2e tests/e2e/auth/login.spec.ts
```

### Test Configuration
- **Base URL**: http://localhost:5173
- **Timeout**: Default Playwright timeouts
- **Retries**: 2 retries in CI, 0 locally
- **Parallel**: Fully parallel execution
- **Reporter**: HTML reporter with traces

---

## Authentication Testing

### Test Files
- `tests/e2e/auth/login.spec.ts`
- `tests/e2e/auth/register.spec.ts`
- `tests/e2e/auth/logout.spec.ts`

### Test Cases

#### Login Tests
```typescript
// Should display login form elements
- Email input field (data-testid="input-email")
- Password input field (data-testid="input-password")
- Login button (data-testid="button-login")
- Registration link
- Forgot password link

// Should handle successful login
- Valid credentials: admin@grwofinance.com / Password1706#
- Redirect to appropriate dashboard based on user role
- Session persistence

// Should handle login errors
- Invalid email format
- Incorrect password
- Non-existent user
- Empty form validation
```

#### Registration Tests
```typescript
// Should display registration form
- First name input (data-testid="input-firstname")
- Last name input (data-testid="input-lastname")
- Email input (data-testid="input-email")
- Password input (data-testid="input-password")
- Confirm password input (data-testid="input-confirm-password")
- Register button (data-testid="button-register")

// Should handle successful registration
- Valid form data
- Password confirmation match
- Redirect to login/dashboard after registration

// Should handle registration errors
- Invalid email format
- Password too short (<6 characters)
- Password mismatch
- Duplicate email
```

#### Logout Tests
```typescript
// Should handle logout flow
- Navigate to settings page
- Click logout button (data-testid="button-sign-out")
- Handle confirmation modal
- Redirect to login/landing page
- Clear session data
```

### Test Data
```typescript
// Admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@grwofinance.com',
  password: 'Password1706#'
};

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123',
  firstName: 'Test',
  lastName: 'User'
};
```

---

## Dashboard Testing

### Test Files
- `tests/e2e/dashboard/overview.spec.ts`
- `tests/e2e/dashboard/admin-dashboard.spec.ts`
- `tests/e2e/dashboard/navigation.spec.ts`

### Global Dashboard Tests

#### Overview Tests
```typescript
// Should display dashboard elements
- Welcome message (regex: /Welcome back/)
- Financial summary cards:
  - Monthly Income (data-testid="text-monthly-income")
  - Monthly Expenses (data-testid="text-monthly-expenses")
  - Net Position (data-testid="text-net-position")
  - Total Savings (data-testid="text-total-savings")
  - Net Worth (data-testid="text-net-worth")

// Should show navigation options
- Income manager link
- Expense manager link
- Bottom navigation items
```

#### Navigation Tests
```typescript
// Should navigate between sections
- Bottom navigation:
  - Home (data-testid="nav-home")
  - Income (data-testid="nav-income")
  - Expense (data-testid="nav-expense")
  - Reports (data-testid="nav-reports")
  - Settings (data-testid="nav-settings")

// Should handle manual entry navigation
- Navigate via expense manager
- Check for manual entry options
```

### Admin Dashboard Tests

#### Overview Tests
```typescript
// Should display admin metrics
- Total Users (data-testid="text-total-users")
- Active Users (data-testid="text-active-users")
- Paid Users (data-testid="text-paid-users")
- Total Platform Expenses (data-testid="text-total-platform-expenses")
- Average Spending (data-testid="text-average-spending")

// Should show recent activity
- New users this month
- System status (Healthy)
```

#### Tab Navigation Tests
```typescript
// Should navigate between admin tabs
- Overview tab (data-testid="tab-overview")
- Users tab (data-testid="tab-users")
- Reports tab (data-testid="tab-reports")
```

#### User Management Tests
```typescript
// Should handle user search
- Search input (data-testid="input-user-search")
- Filter by status dropdown (data-testid="user-filter-select")
- User cards display
- User status toggles (data-testid="button-toggle-user-status-{id}")
- Admin status toggles (data-testid="button-toggle-admin-status-{id}")
```

#### Reports Tests
```typescript
// Should display reports section
- System Health Report button
- Generate User Analytics Report button
- Generate Financial Report button
- System health report display (data-testid="system-health-report")
```

---

## Income Management Testing

### Test Files
- `tests/e2e/income/add.spec.ts`
- `tests/e2e/income/manage.spec.ts`

### Test Cases

#### Add Income Tests
```typescript
// Should display income form
- Amount input
- Source selection
- Date picker
- Category selection
- Description field
- Submit button

// Should handle income creation
- Valid income data
- Different income sources
- Various amounts
- Date validation

// Should handle income errors
- Invalid amount
- Missing required fields
- Future dates
```

#### Income Management Tests
```typescript
// Should display income list
- Income entries
- Sort options
- Filter options
- Search functionality

// Should handle income operations
- Edit income entry
- Delete income entry
- View income details
- Export income data
```

### Test Data
```typescript
const INCOME_SOURCES = [
  'Salary',
  'Business',
  'Investment',
  'Freelance',
  'Other'
];

const INCOME_CATEGORIES = [
  'Primary Income',
  'Secondary Income',
  'Passive Income',
  'One-time Income'
];
```

---

## Expense Management Testing

### Test Files
- `tests/e2e/expenses/create.spec.ts`
- `tests/e2e/expenses/edit.spec.ts`
- `tests/e2e/expenses/delete.spec.ts`

### Test Cases

#### Create Expense Tests
```typescript
// Should display expense form
- Amount input
- Category selection
- Date picker
- Description field
- Receipt upload option
- Submit button

// Should handle expense creation
- Valid expense data
- Different categories
- Various amounts
- Receipt attachment
- Manual entry option

// Should handle expense errors
- Invalid amount
- Missing required fields
- Future dates
- Large file uploads
```

#### Edit Expense Tests
```typescript
// Should display edit form
- Pre-filled data
- Category change
- Amount modification
- Description update
- Receipt replacement
```

#### Delete Expense Tests
```typescript
// Should handle expense deletion
- Confirmation modal
- Single expense deletion
- Bulk deletion
- Undo functionality
```

### Test Data
```typescript
const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Other'
];
```

---

## Reports Testing

### Test Files
- `tests/e2e/reports/generation.spec.ts`
- `tests/e2e/reports/export.spec.ts`

### Test Cases

#### Report Generation Tests
```typescript
// Should generate income reports
- Monthly income summary
- Income by source
- Income trends
- Yearly comparisons

// Should generate expense reports
- Monthly expense summary
- Expenses by category
- Expense trends
- Budget vs actual

// Should generate combined reports
- Profit & loss statements
- Cash flow reports
- Net worth reports
- Financial summaries
```

#### Export Tests
```typescript
// Should export reports
- PDF export
- Excel export
- CSV export
- Email reports
- Print functionality
```

### Report Types
```typescript
const REPORT_TYPES = [
  'Income Report',
  'Expense Report',
  'Profit & Loss',
  'Cash Flow',
  'Net Worth',
  'Budget Analysis',
  'Tax Summary'
];
```

---

## Invoice Management Testing

### Test Cases

#### Create Invoice Tests
```typescript
// Should display invoice form
- Client information
- Invoice number
- Date fields
- Line items
- Tax calculation
- Total calculation
- Terms and conditions

// Should handle invoice creation
- Valid invoice data
- Multiple line items
- Tax calculations
- Discount application
- Save as draft
- Send to client
```

#### Invoice List Tests
```typescript
// Should display invoice list
- Invoice status (Draft, Sent, Paid, Overdue)
- Sort options
- Filter options
- Search functionality
- Bulk actions
```

#### Invoice Document Tests
```typescript
// Should display invoice details
- Invoice preview
- Edit functionality
- Payment status
- Download PDF
- Send reminder
- Mark as paid
```

---

## Receipt Processing Testing

### Test Cases

#### Scan Receipt Tests
```typescript
// Should handle receipt scanning
- Camera access
- Image capture
- OCR processing
- Data extraction
- Manual correction
- Save receipt
```

#### Upload Receipt Tests
```typescript
// Should handle receipt upload
- File selection
- Image validation
- Size limits
- Format support
- Processing status
- Error handling
```

### Supported Formats
```typescript
const SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'application/pdf'
];

const MAX_FILE_SIZE = '10MB';
```

---

## Settings & Profile Testing

### Test Cases

#### Profile Settings Tests
```typescript
// Should display profile form
- Personal information
- Contact details
- Profile picture
- Password change
- Email verification
```

#### Budget Settings Tests
```typescript
// Should display budget configuration
- Monthly budget limits
- Category budgets
- Budget alerts
- Savings goals
- Progress tracking
```

#### Privacy Settings Tests
```typescript
// Should handle privacy options
- Data sharing preferences
- Analytics consent
- Marketing preferences
- Account deletion
- Data export
```

#### Subscription Tests
```typescript
// Should display subscription options
- Free tier features
- Premium features
- Pricing plans
- Payment processing
- Subscription management
- Cancellation flow
```

---

## Admin Dashboard Testing

### Test Files
- `tests/e2e/dashboard/admin-dashboard.spec.ts`

### Test Cases

#### Overview Tests
```typescript
// Should display platform metrics
- User statistics
- Financial summaries
- System health
- Recent activity
- Performance metrics
```

#### User Management Tests
```typescript
// Should handle user operations
- User search and filtering
- User status management
- Admin role assignment
- User data export
- Bulk user operations
```

#### System Reports Tests
```typescript
// Should generate system reports
- User analytics
- Financial summaries
- System performance
- Error reports
- Usage statistics
```

---

## Navigation Testing

### Test Cases

#### Main Navigation Tests
```typescript
// Should handle primary navigation
- Dashboard access
- Module navigation
- Breadcrumb functionality
- Back navigation
- Deep linking
```

#### Bottom Navigation Tests
```typescript
// Should handle mobile navigation
- Tab switching
- Active state indicators
- Badge notifications
- Gesture support
- Responsive behavior
```

#### Quick Actions Tests
```typescript
// Should handle quick actions
- Floating action buttons
- Context menus
- Keyboard shortcuts
- Voice commands
- Gesture shortcuts
```

---

## Cross-Browser Testing

### Browser Coverage
- **Chromium**: Latest version
- **Firefox**: Latest version
- **WebKit**: Safari equivalent

### Test Cases
```typescript
// Should work across browsers
- Layout consistency
- Functionality parity
- Performance differences
- Browser-specific features
- Responsive design
```

### Device Coverage
- **Desktop**: 1920x1080, 1366x768
- **Tablet**: 768x1024, 1024x768
- **Mobile**: 375x667, 414x896

---

## Performance Testing

### Test Cases

#### Load Performance
```typescript
// Should handle page load times
- Initial load < 3 seconds
- Navigation transitions < 1 second
- Data loading < 2 seconds
- Image optimization
- Caching effectiveness
```

#### Memory Usage
```typescript
// Should manage memory efficiently
- No memory leaks
- Reasonable memory footprint
- Garbage collection
- Large dataset handling
- Background processes
```

#### Network Performance
```typescript
// Should optimize network usage
- API response times
- Data compression
- Offline functionality
- Sync performance
- Error recovery
```

---

## Security Testing

### Test Cases

#### Authentication Security
```typescript
// Should secure authentication
- Password strength requirements
- Session management
- Token expiration
- CSRF protection
- Rate limiting
```

#### Data Protection
```typescript
// Should protect user data
- Input validation
- XSS prevention
- SQL injection protection
- Data encryption
- Privacy compliance
```

#### Access Control
```typescript
// Should enforce access rules
- Role-based access
- Route protection
- API authorization
- Data visibility
- Admin restrictions
```

---

## Test Data Management

### Test Users
```typescript
const TEST_USERS = {
  admin: {
    email: 'admin@grwofinance.com',
    password: 'Password1706#',
    role: 'admin'
  },
  regular: {
    email: 'user@example.com',
    password: 'UserPassword123',
    role: 'user'
  },
  premium: {
    email: 'premium@example.com',
    password: 'PremiumPassword123',
    role: 'premium'
  }
};
```

### Test Data Cleanup
```typescript
// Clean up test data after each run
- Delete test users
- Remove test transactions
- Clear test invoices
- Reset test settings
- Clean up temporary files
```

### Data Seeding
```typescript
// Seed test data for consistent testing
- Create test users
- Add sample transactions
- Generate test invoices
- Set up test categories
- Configure test settings
```

---

## Continuous Integration

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### Test Reporting
- **HTML Reports**: Detailed test results
- **Screenshots**: Failure evidence
- **Videos**: Test execution recordings
- **Traces**: Detailed execution logs
- **Coverage**: Code coverage metrics

### Environment Setup
```bash
# Production-like test environment
- Staging database
- Mock external services
- Test data fixtures
- Environment variables
- Network simulation
```

---

## Best Practices

### Test Organization
- **Descriptive test names**: Clear purpose
- **Logical grouping**: Related tests together
- **Reusable fixtures**: Common setup code
- **Page object pattern**: UI abstraction
- **Custom commands**: Domain-specific actions

### Test Maintenance
- **Regular updates**: Keep tests current
- **Refactoring**: Improve test quality
- **Documentation**: Maintain test guides
- **Review process**: Peer test reviews
- **Monitoring**: Track test health

### Debugging Tips
```bash
# Debug failing tests
npm run test:e2e -- --headed
npm run test:e2e -- --debug
npm run test:e2e -- --trace on
npm run test:e2e -- --workers=1
```

### Performance Optimization
- **Parallel execution**: Run tests concurrently
- **Smart waits**: Use explicit waits
- **Efficient selectors**: Optimize element targeting
- **Test isolation**: Avoid test dependencies
- **Resource cleanup**: Prevent memory leaks

---

## Troubleshooting

### Common Issues

#### Test Failures
```typescript
// Timeout errors
- Increase wait timeouts
- Check element visibility
- Verify network conditions
- Debug selector issues

// Element not found
- Verify test IDs
- Check dynamic content
- Handle loading states
- Update selectors

// Navigation issues
- Verify route configuration
- Check authentication state
- Handle redirects
- Debug routing logic
```

#### Environment Issues
```bash
# Port conflicts
- Kill existing processes
- Change port configuration
- Check firewall settings

# Database issues
- Verify connection string
- Check database schema
- Reset test data
- Verify permissions

# Dependency issues
- Clear node_modules
- Update dependencies
- Check version compatibility
- Verify installation
```

### Debug Commands
```bash
# Check test environment
npm run dev:frontend  # Start frontend
npm run dev:backend   # Start backend
npm run db:push       # Update database

# Debug specific tests
npm run test:e2e tests/e2e/auth/login.spec.ts -- --headed
npm run test:e2e tests/e2e/dashboard/ -- --debug
```

---

## Conclusion

This comprehensive testing guide covers all aspects of the GrwoFinance platform testing strategy. Regular execution of these tests ensures:

- **Feature reliability**: All features work as expected
- **User experience**: Consistent behavior across devices
- **Platform stability**: Robust performance under load
- **Security compliance**: Proper data protection
- **Code quality**: Maintainable and scalable codebase

### Next Steps
1. Implement missing test cases
2. Enhance test coverage metrics
3. Add performance benchmarks
4. Integrate with CI/CD pipeline
5. Monitor test execution health

For questions or contributions to this testing guide, please contact the GrwoFinance development team or create an issue in the project repository.
