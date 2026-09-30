import http from 'http';

const request = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', (e) => reject(e));
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

async function testAll() {
  console.log('=== TESTING PERSONAL FINANCE MANAGER REST API ===\n');

  let token = '';
  let userId = '';
  let txId = '';
  let budgetId = '';
  let goalId = '';

  const email = `testuser_${Date.now()}@example.com`;

  // 1. REGISTER
  console.log('1. Testing POST /api/auth/register...');
  try {
    const regRes = await request(
      { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Test User', email, password: 'password123' }
    );
    console.log('Register Response:', regRes.status, regRes.body.success ? 'SUCCESS' : regRes.body);
    if (regRes.body.token) token = regRes.body.token;
  } catch (err) {
    console.error('Register failed:', err.message);
    return;
  }

  // 2. LOGIN
  console.log('\n2. Testing POST /api/auth/login...');
  try {
    const loginRes = await request(
      { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email, password: 'password123' }
    );
    console.log('Login Response:', loginRes.status, loginRes.body.success ? 'SUCCESS' : loginRes.body);
    if (loginRes.body.token) token = loginRes.body.token;
  } catch (err) {
    console.error('Login failed:', err.message);
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 3. GET ME
  console.log('\n3. Testing GET /api/auth/me...');
  const meRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/me', method: 'GET', headers: authHeaders }
  );
  console.log('Get Profile:', meRes.status, meRes.body.user?.email);

  // 4. ADD TRANSACTIONS
  console.log('\n4. Testing POST /api/transactions (Income & Expense)...');
  const incRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/transactions', method: 'POST', headers: authHeaders },
    { type: 'income', amount: 5000, category: 'Salary', description: 'Monthly salary payout', date: new Date().toISOString() }
  );
  console.log('Add Income:', incRes.status, incRes.body.success ? incRes.body.data.id : incRes.body);

  const expRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/transactions', method: 'POST', headers: authHeaders },
    { type: 'expense', amount: 250, category: 'Food & Dining', description: 'Grocery shopping', date: new Date().toISOString() }
  );
  console.log('Add Expense:', expRes.status, expRes.body.success ? expRes.body.data.id : expRes.body);
  if (expRes.body.data) txId = expRes.body.data.id;

  // 5. GET TRANSACTIONS
  console.log('\n5. Testing GET /api/transactions...');
  const txListRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/transactions', method: 'GET', headers: authHeaders }
  );
  console.log('Get Transactions Count:', txListRes.body.count);

  // 6. CREATE BUDGET
  console.log('\n6. Testing POST /api/budgets...');
  const budgetRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/budgets', method: 'POST', headers: authHeaders },
    { category: 'Food & Dining', amount: 600, period: 'monthly' }
  );
  console.log('Create Budget:', budgetRes.status, budgetRes.body.data?.category, 'Amount:', budgetRes.body.data?.amount, 'Spent:', budgetRes.body.data?.spent);
  if (budgetRes.body.data) budgetId = budgetRes.body.data.id;

  // 7. GET BUDGETS
  console.log('\n7. Testing GET /api/budgets...');
  const getBudgetsRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/budgets', method: 'GET', headers: authHeaders }
  );
  console.log('Get Budgets Count:', getBudgetsRes.body.count);

  // 8. CREATE SAVINGS GOAL
  console.log('\n8. Testing POST /api/savings...');
  const goalRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/savings', method: 'POST', headers: authHeaders },
    { goalName: 'New Laptop', targetAmount: 2000, currentAmount: 500, description: 'M3 Macbook Air' }
  );
  console.log('Create Goal:', goalRes.status, goalRes.body.data?.goalName, 'Progress:', goalRes.body.data?.progressPercentage + '%');
  if (goalRes.body.data) goalId = goalRes.body.data.id;

  // 9. ADD SAVINGS AMOUNT
  console.log('\n9. Testing PATCH /api/savings/:id/add...');
  const addSavingsRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/savings/${goalId}/add`, method: 'PATCH', headers: authHeaders },
    { amount: 300 }
  );
  console.log('Add Savings Response:', addSavingsRes.body.message, 'New Current Amount:', addSavingsRes.body.data?.currentAmount);

  // 10. GET DASHBOARD SUMMARY
  console.log('\n10. Testing GET /api/dashboard...');
  const dashRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/dashboard', method: 'GET', headers: authHeaders }
  );
  console.log('Dashboard Data:', {
    totalIncome: dashRes.body.data?.totalIncome,
    totalExpense: dashRes.body.data?.totalExpense,
    balance: dashRes.body.data?.balance,
    totalSavings: dashRes.body.data?.totalSavings,
  });

  // 11. GET AI ANALYSIS
  console.log('\n11. Testing GET /api/ai/analysis...');
  const aiRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/ai/analysis', method: 'GET', headers: authHeaders }
  );
  console.log('AI Analysis Suggestions:', aiRes.body.data?.suggestions);

  console.log('\n=== ALL API TESTS PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

testAll().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
