import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Shield, Database, Upload, BarChart3, Users, Key, AlertCircle, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import './api-docs.css';

const ApiDocumentation = () => {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // Debug: Component initialization
  console.log('🔧 ApiDocumentation component mounted');
  console.log('🔧 Initial expandedSections:', expandedSections);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
      duration: 2000,
    });
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const toggleSection = (section: string) => {
    console.log('🔧 toggleSection called:', section);
    console.log('🔧 Current expandedSections:', expandedSections);
    
    const newExpanded = expandedSections.includes(section) 
      ? expandedSections.filter(s => s !== section)
      : [...expandedSections, section];
    
    console.log('🔧 New expandedSections:', newExpanded);
    setExpandedSections(newExpanded);
    
    // Debug: Check if CSS classes are being applied
    setTimeout(() => {
      const sectionElement = document.querySelector(`[data-section="${section}"]`);
      if (sectionElement) {
        console.log('🔧 Section element found:', sectionElement);
        console.log('🔧 Element classes:', sectionElement.className);
        
        // Check for content element
        const contentElement = sectionElement.querySelector('.api-section-content');
        if (contentElement) {
          console.log('🔧 Content element found:', contentElement);
          console.log('🔧 Content classes:', contentElement.className);
          console.log('🔧 Content styles:', contentElement.getAttribute('style'));
          console.log('🔧 Computed styles:', window.getComputedStyle(contentElement));
        } else {
          console.log('🔧 Content element NOT found in section:', section);
        }
      } else {
        console.log('🔧 Section element NOT found for:', section);
      }
    }, 100);
  };

  const CodeBlock = ({ code, language = 'bash' }: { code: string; language?: string }) => (
    <div className="relative">
      <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 dark:text-gray-200 p-4 rounded-lg overflow-x-auto text-sm border border-gray-700 dark:border-gray-800">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 bg-gray-800 dark:bg-gray-900 hover:bg-gray-700 dark:hover:bg-gray-800 text-gray-200 dark:text-gray-300"
        onClick={() => copyToClipboard(code)}
      >
        <Copy className="w-4 h-4" />
      </Button>
    </div>
  );

  const EndpointCard = ({ method, path, description, request, response, status = 200 }: {
    method: string;
    path: string;
    description: string;
    request?: string;
    response?: string;
    status?: number;
  }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={method === 'GET' ? 'secondary' : method === 'POST' ? 'default' : method === 'PUT' ? 'outline' : 'destructive'}>
              {method}
            </Badge>
            <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-gray-100">{path}</code>
          </div>
          <Badge variant={status === 200 ? 'default' : status === 201 ? 'secondary' : 'destructive'}>
            {status}
          </Badge>
        </div>
        <CardTitle className="text-lg">{description}</CardTitle>
      </CardHeader>
      {request && (
        <CardContent className="pb-3">
          <h4 className="font-semibold mb-2 text-sm">Request:</h4>
          <CodeBlock code={request} />
        </CardContent>
      )}
      {response && (
        <CardContent>
          <h4 className="font-semibold mb-2 text-sm">Response:</h4>
          <CodeBlock code={response} language="json" />
        </CardContent>
      )}
    </Card>
  );

  const Section = ({ id, title, icon: Icon, children }: { id: string; title: string; icon: any; children: React.ReactNode }) => {
    const isExpanded = expandedSections.includes(id);
    
    console.log(`🔧 Rendering Section ${id}: expanded=${isExpanded}`);
    console.log(`🔧 CSS classes: api-section-content ${isExpanded ? 'expanded' : 'collapsed'}`);
    
    return (
      <Card className="api-section mb-6" data-section={id}>
        <CardHeader 
          className="api-section-header" 
          onClick={() => {
            console.log(`🔧 Clicked section header: ${id}`);
            toggleSection(id);
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5" />
              <CardTitle className="text-xl">{title}</CardTitle>
            </div>
            <ChevronDown 
              className={`api-chevron w-5 h-5 ${isExpanded ? 'rotated' : ''}`}
              style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </div>
        </CardHeader>
        <div 
          className={`api-section-content ${isExpanded ? 'expanded' : 'collapsed'}`}
          data-expanded={isExpanded}
        >
          {children}
        </div>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl bg-background">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Grwo Finance API Documentation</h1>
        <p className="text-muted-foreground mb-4">
          Comprehensive REST API documentation for managing personal finances, expenses, income, and more.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">REST API</Badge>
          <Badge variant="secondary">Express.js</Badge>
          <Badge variant="secondary">PostgreSQL</Badge>
          <Badge variant="secondary">Session Auth</Badge>
        </div>
      </div>

      <Section id="overview" title="API Overview" icon={Database}>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold">Base URL</h4>
            <CodeBlock code="http://localhost:5000/api" />
          </div>
          <div>
            <h4 className="font-semibold">Authentication</h4>
            <p className="text-sm text-muted-foreground mb-2">
              The API uses session-based authentication. Users must be logged in to access protected endpoints.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Rate Limiting</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>100 requests per minute per IP address</li>
              <li>1000 requests per hour per authenticated user</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Security</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Session-based authentication with secure cookies</li>
              <li>Input validation and sanitization</li>
              <li>SQL injection protection</li>
              <li>CORS enabled for cross-origin requests</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Request Body Validation</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-gray-900 dark:text-gray-100">merchant</code>: Required, string, max 255 characters</li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-gray-900 dark:text-gray-100">amount</code>: Required, number, must be positive</li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-gray-900 dark:text-gray-100">category</code>: Required, string, must be a valid category</li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-gray-900 dark:text-gray-100">date</code>: Required, string, must be a valid date format</li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-gray-900 dark:text-gray-100">notes</code>: Optional, string, max 1000 characters</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section id="auth" title="Authentication Endpoints" icon={Key}>
        <div className="space-y-4">
          <EndpointCard
            method="POST"
            path="/api/auth/register"
            description="Register a new user account"
            request={`{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}`}
            response={`{
  "message": "User registered successfully"
}`}
            status={201}
          />
          <EndpointCard
            method="POST"
            path="/api/auth/login"
            description="Login with existing credentials"
            request={`{
  "email": "user@example.com",
  "password": "password123"
}`}
            response={`{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2024-01-15T00:00:00.000Z"
  }
}`}
            status={200}
          />
          <EndpointCard
            method="POST"
            path="/api/auth/logout"
            description="Logout current user"
            response={`{
  "message": "Logged out successfully"
}`}
            status={200}
          />
          <EndpointCard
            method="GET"
            path="/api/auth/user"
            description="Get current user information"
            response={`{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2024-01-15T00:00:00.000Z"
  }
}`}
            status={200}
          />
        </div>
      </Section>

      <Section id="expenses" title="Expense Management" icon={BarChart3}>
        <div className="space-y-4">
          <EndpointCard
            method="POST"
            path="/api/expenses"
            description="Create a new expense entry"
            request={`{
  "merchant": "Shoprite",
  "amount": 1500.50,
  "category": "Groceries",
  "date": "2024-01-15",
  "notes": "Weekly grocery shopping"
}`}
            response={`{
  "id": "expense_id",
  "merchant": "Shoprite",
  "amount": 1500.50,
  "category": "Groceries",
  "date": "2024-01-15",
  "notes": "Weekly grocery shopping",
  "userId": "user_id",
  "createdAt": "2024-01-15T00:00:00.000Z"
}`}
            status={201}
          />
          <EndpointCard
            method="GET"
            path="/api/expenses"
            description="Get all expenses for the authenticated user"
            response={`[
  {
    "id": "expense_id",
    "merchant": "Shoprite",
    "amount": 1500.50,
    "category": "Groceries",
    "date": "2024-01-15",
    "notes": "Weekly grocery shopping",
    "userId": "user_id",
    "createdAt": "2024-01-15T00:00:00.000Z"
  }
]`}
            status={200}
          />
          <EndpointCard
            method="PUT"
            path="/api/expenses/{id}"
            description="Update an existing expense"
            request={`{
  "merchant": "Shoprite",
  "amount": 1800.75,
  "category": "Groceries",
  "date": "2024-01-15",
  "notes": "Updated grocery shopping"
}`}
            response={`{
  "id": "expense_id",
  "merchant": "Shoprite",
  "amount": 1800.75,
  "category": "Groceries",
  "date": "2024-01-15",
  "notes": "Updated grocery shopping",
  "userId": "user_id",
  "createdAt": "2024-01-15T00:00:00.000Z"
}`}
            status={200}
          />
          <EndpointCard
            method="DELETE"
            path="/api/expenses/{id}"
            description="Delete an expense"
            response={`{
  "message": "Expense deleted successfully"
}`}
            status={200}
          />
        </div>
      </Section>

      <Section id="income" title="Income Management" icon={BarChart3}>
        <div className="space-y-4">
          <EndpointCard
            method="POST"
            path="/api/income"
            description="Create a new income entry"
            request={`{
  "description": "Monthly Salary",
  "amount": 5000.00,
  "category": "Salary",
  "date": "2024-01-15",
  "client": "ABC Company",
  "reference": "SAL-001",
  "notes": "Regular monthly salary payment"
}`}
            response={`{
  "id": "income_id",
  "description": "Monthly Salary",
  "amount": 5000.00,
  "category": "Salary",
  "date": "2024-01-15",
  "client": "ABC Company",
  "reference": "SAL-001",
  "notes": "Regular monthly salary payment",
  "userId": "user_id",
  "createdAt": "2024-01-15T00:00:00.000Z"
}`}
            status={201}
          />
          <EndpointCard
            method="GET"
            path="/api/income"
            description="Get all income entries for the authenticated user"
            response={`[
  {
    "id": "income_id",
    "description": "Monthly Salary",
    "amount": 5000.00,
    "category": "Salary",
    "date": "2024-01-15",
    "client": "ABC Company",
    "reference": "SAL-001",
    "notes": "Regular monthly salary payment",
    "userId": "user_id",
    "createdAt": "2024-01-15T00:00:00.000Z"
  }
]`}
            status={200}
          />
          <EndpointCard
            method="PUT"
            path="/api/income/{id}"
            description="Update an existing income entry"
            request={`{
  "description": "Updated Salary",
  "amount": 5500.00,
  "category": "Salary",
  "date": "2024-01-15",
  "client": "ABC Company",
  "reference": "SAL-002",
  "notes": "Updated salary payment"
}`}
            response={`{
  "id": "income_id",
  "description": "Updated Salary",
  "amount": 5500.00,
  "category": "Salary",
  "date": "2024-01-15",
  "client": "ABC Company",
  "reference": "SAL-002",
  "notes": "Updated salary payment",
  "userId": "user_id",
  "createdAt": "2024-01-15T00:00:00.000Z"
}`}
            status={200}
          />
          <EndpointCard
            method="DELETE"
            path="/api/income/{id}"
            description="Delete an income entry"
            response={`{
  "message": "Income entry deleted successfully"
}`}
            status={200}
          />
        </div>
      </Section>

      <Section id="categories" title="Category Management" icon={Users}>
        <div className="space-y-4">
          <EndpointCard
            method="POST"
            path="/api/categories"
            description="Create a new category"
            request={`{
  "name": "Entertainment",
  "type": "expense"
}`}
            response={`{
  "id": "category_id",
  "name": "Entertainment",
  "type": "expense",
  "userId": "user_id",
  "createdAt": "2024-01-15T00:00:00.000Z"
}`}
            status={201}
          />
          <EndpointCard
            method="GET"
            path="/api/categories"
            description="Get all categories for the authenticated user"
            response={`[
  {
    "id": "category_id",
    "name": "Entertainment",
    "type": "expense",
    "userId": "user_id",
    "createdAt": "2024-01-15T00:00:00.000Z"
  }
]`}
            status={200}
          />
          <EndpointCard
            method="PUT"
            path="/api/categories/{id}"
            description="Update an existing category"
            request={`{
  "name": "Movies & Entertainment",
  "type": "expense"
}`}
            response={`{
  "id": "category_id",
  "name": "Movies & Entertainment",
  "type": "expense",
  "userId": "user_id",
  "createdAt": "2024-01-15T00:00:00.000Z"
}`}
            status={200}
          />
          <EndpointCard
            method="DELETE"
            path="/api/categories/{id}"
            description="Delete a category"
            response={`{
  "message": "Category deleted successfully"
}`}
            status={200}
          />
        </div>
      </Section>

      <Section id="dashboard" title="Dashboard Statistics" icon={BarChart3}>
        <div className="space-y-4">
          <EndpointCard
            method="GET"
            path="/api/dashboard/stats"
            description="Get dashboard statistics"
            response={`{
  "totalExpenses": 15000.50,
  "totalIncome": 25000.00,
  "monthlyTotal": 8000.25,
  "weeklyTotal": 2000.10
}`}
            status={200}
          />
          <EndpointCard
            method="GET"
            path="/api/income/stats"
            description="Get income-specific statistics"
            response={`{
  "totalIncome": 25000.00,
  "monthlyTotal": 8000.25,
  "weeklyTotal": 2000.10,
  "invoicesCreated": 5
}`}
            status={200}
          />
        </div>
      </Section>

      <Section id="file-upload" title="File Upload" icon={Upload}>
        <div className="space-y-4">
          <EndpointCard
            method="POST"
            path="/api/upload-receipt"
            description="Upload receipt image"
            request={`multipart/form-data with file field named "receipt"`}
            response={`{
  "url": "https://storage.example.com/receipts/image.jpg",
  "filename": "image.jpg",
  "size": 1024000,
  "mimeType": "image/jpeg"
}`}
            status={200}
          />
        </div>
      </Section>

      <Section id="system-health" title="System Health" icon={Database}>
        <div className="space-y-4">
          <EndpointCard
            method="GET"
            path="/api/test-db"
            description="Test database connection"
            response={`{
  "message": "Database connection successful"
}`}
            status={200}
          />
        </div>
      </Section>

      <Section id="error-handling" title="Error Handling" icon={AlertCircle}>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold">Standard Error Response Format</h4>
            <div className="space-y-3">
              <div>
                <Badge variant="destructive">400 Bad Request</Badge>
                <CodeBlock code={`{
  "message": "Validation error details"
}`} language="json" />
              </div>
              <div>
                <Badge variant="destructive">401 Unauthorized</Badge>
                <CodeBlock code={`{
  "message": "Invalid email or password"
}`} language="json" />
              </div>
              <div>
                <Badge variant="destructive">404 Not Found</Badge>
                <CodeBlock code={`{
  "message": "Resource not found"
}`} language="json" />
              </div>
              <div>
                <Badge variant="destructive">500 Internal Server Error</Badge>
                <CodeBlock code={`{
  "message": "Internal server error"
}`} language="json" />
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section id="quick-start" title="Quick Start Examples" icon={CheckCircle}>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold">1. Register User</h4>
            <CodeBlock code={`curl -X POST http://localhost:5000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"password123","firstName":"John","lastName":"Doe"}'`} />
          </div>
          <div>
            <h4 className="font-semibold">2. Login</h4>
            <CodeBlock code={`curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"password123"}'`} />
          </div>
          <div>
            <h4 className="font-semibold">3. Create Expense</h4>
            <CodeBlock code={`curl -X POST http://localhost:5000/api/expenses \\
  -H "Content-Type: application/json" \\
  -H "Cookie: session_id=your_session_id" \\
  -d '{"merchant":"Shoprite","amount":1500.50,"category":"Groceries","date":"2024-01-15"}'`} />
          </div>
        </div>
      </Section>
    </div>
  );
};

export default ApiDocumentation;
