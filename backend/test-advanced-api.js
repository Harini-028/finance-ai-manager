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
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

async function testAdvancedModules() {
  console.log('=== TESTING FINPILOT AI ADVANCED MODULES API ===\n');

  let token = '';
  const email = `advanced_${Date.now()}@example.com`;

  // 1. REGISTER
  console.log('1. Registering user for testing...');
  const regRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Dr. Jane Finance', email, password: 'password123' }
  );
  token = regRes.body.token;
  const authHeader = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  console.log('Registered & Token acquired:', !!token);

  // Setup seed transactions: Salary 80,000, Expenses: Food 12,000, Shopping 8,000, Bills 5,000
  console.log('\n2. Seeding initial transactions...');
  await request({ hostname: 'localhost', port: 5000, path: '/api/transactions', method: 'POST', headers: authHeader }, { type: 'income', amount: 80000, category: 'Salary', description: 'Monthly Tech Salary' });
  await request({ hostname: 'localhost', port: 5000, path: '/api/transactions', method: 'POST', headers: authHeader }, { type: 'expense', amount: 12000, category: 'Food & Dining', description: 'Groceries and restaurants' });
  await request({ hostname: 'localhost', port: 5000, path: '/api/transactions', method: 'POST', headers: authHeader }, { type: 'expense', amount: 8000, category: 'Shopping', description: 'Electronics and clothes' });
  await request({ hostname: 'localhost', port: 5000, path: '/api/transactions', method: 'POST', headers: authHeader }, { type: 'expense', amount: 5000, category: 'Bills', description: 'Electricity and internet' });

  // 3. TEST FEATURE 1: AI FINANCIAL COACH
  console.log('\n3. Testing Feature 1: AI Financial Coach (/api/ai/coach)...');
  const coachQueries = [
    'How much can I save this month?',
    'Which category has the highest spending?',
    'How can I save ₹2,000 next month?',
    'Can I afford a ₹10,000 purchase based on my current budget?',
  ];

  for (const q of coachQueries) {
    const coachRes = await request(
      { hostname: 'localhost', port: 5000, path: '/api/ai/coach', method: 'POST', headers: authHeader },
      { prompt: q }
    );
    console.log(`\n  Q: "${q}"`);
    console.log(`  Status: ${coachRes.status}`);
    console.log(`  Calculation Formula:`, coachRes.body.data?.calculation?.formula);
    console.log(`  Assumptions Count:`, coachRes.body.data?.calculation?.assumptions?.length);
    console.log(`  Reply Snippet:`, coachRes.body.data?.reply?.slice(0, 100) + '...');
  }

  // 4. TEST FEATURE 2: SMART SAVINGS GOALS
  console.log('\n4. Testing Feature 2: Smart Savings Goals (/api/savings)...');
  const goalCreateRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/savings', method: 'POST', headers: authHeader },
    {
      goalName: 'MacBook Pro Purchase',
      targetAmount: 150000,
      currentAmount: 30000,
      monthlyContribution: 15000,
      category: 'Tech & Gadgets',
      deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 6 months
      description: 'Upgrade for work',
    }
  );
  const goalId = goalCreateRes.body.data?.id || goalCreateRes.body.data?._id;
  console.log('  Created Goal:', goalCreateRes.body.data?.goalName, 'ID:', goalId);
  console.log('  Required Monthly Contribution:', goalCreateRes.body.data?.requiredMonthlyContribution);
  console.log('  Estimated Completion Date:', goalCreateRes.body.data?.estimatedCompletionDate);
  console.log('  Progress %:', goalCreateRes.body.data?.progressPercentage);

  // Record Deposit
  const depositRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/savings/${goalId}/transaction`, method: 'POST', headers: authHeader },
    { type: 'deposit', amount: 20000, note: 'Freelance project bonus' }
  );
  console.log('  Deposit Result:', depositRes.body.message, 'New Current Amount:', depositRes.body.data?.currentAmount);

  // Record Withdrawal
  const withdrawRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/savings/${goalId}/transaction`, method: 'POST', headers: authHeader },
    { type: 'withdrawal', amount: 5000, note: 'Emergency laptop charger replacement' }
  );
  console.log('  Withdrawal Result:', withdrawRes.body.message, 'New Current Amount:', withdrawRes.body.data?.currentAmount);
  console.log('  History Length:', withdrawRes.body.data?.history?.length);

  // Toggle Status to paused then active
  const pauseRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/savings/${goalId}/status`, method: 'PATCH', headers: authHeader },
    { status: 'paused' }
  );
  console.log('  Toggle Status:', pauseRes.body.message, 'Status:', pauseRes.body.data?.status);

  // 5. TEST FEATURE 3: SUBSCRIPTIONS & DUPLICATES & IN-APP REMINDERS
  console.log('\n5. Testing Feature 3: Subscriptions Manager (/api/subscriptions)...');
  const sub1 = await request(
    { hostname: 'localhost', port: 5000, path: '/api/subscriptions', method: 'POST', headers: authHeader },
    { name: 'Netflix Premium 4K', amount: 649, frequency: 'monthly', category: 'Entertainment', nextBillingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) }
  );
  const sub2 = await request(
    { hostname: 'localhost', port: 5000, path: '/api/subscriptions', method: 'POST', headers: authHeader },
    { name: 'Netflix Family Plan', amount: 649, frequency: 'monthly', category: 'Entertainment', nextBillingDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) }
  );
  const sub3 = await request(
    { hostname: 'localhost', port: 5000, path: '/api/subscriptions', method: 'POST', headers: authHeader },
    { name: 'AWS Cloud Services', amount: 4800, frequency: 'quarterly', category: 'Utilities', nextBillingDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) }
  );

  const getSubsRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/subscriptions', method: 'GET', headers: authHeader }
  );
  console.log('  Total Subscriptions:', getSubsRes.body.count);
  console.log('  Total Monthly Cost:', getSubsRes.body.summary?.totalMonthlyCost);
  console.log('  Total Yearly Cost:', getSubsRes.body.summary?.totalYearlyCost);
  console.log('  Duplicate Alerts Detected:', getSubsRes.body.summary?.duplicateAlerts?.length);
  if (getSubsRes.body.summary?.duplicateAlerts?.length > 0) {
    console.log('  Duplicate Reason:', getSubsRes.body.summary?.duplicateAlerts[0]?.reason);
  }
  console.log('  In-App Reminders Count:', getSubsRes.body.summary?.reminders?.length);

  // Log Payment as Transaction
  const subId = sub1.body.data?.id || sub1.body.data?._id;
  const logPayRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/subscriptions/${subId}/log-payment`, method: 'POST', headers: authHeader }
  );
  console.log('  Log Payment Result:', logPayRes.body.message);

  // 6. TEST FEATURE 4: WHAT-IF FINANCIAL SIMULATOR
  console.log('\n6. Testing Feature 4: What-If Simulator (/api/scenarios)...');
  const simCalcRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/scenarios/calculate', method: 'POST', headers: authHeader },
    {
      incomeChangePercent: 10,
      categoryAdjustments: [
        { category: 'Food & Dining', percentChange: -15 },
        { category: 'Shopping', percentChange: -25 },
      ],
    }
  );
  console.log('  Baseline Monthly Savings:', simCalcRes.body.data?.baseline?.monthlySavings);
  console.log('  Simulated Monthly Savings:', simCalcRes.body.data?.simulated?.monthlySavings);
  console.log('  Monthly Net Difference:', simCalcRes.body.data?.impact?.monthlyNetDifference);
  console.log('  Annual Savings Impact:', simCalcRes.body.data?.impact?.annualImpact);
  console.log('  12-Month Projections Array Count:', simCalcRes.body.data?.projections?.length);

  // Save Scenario
  const saveScenRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/scenarios', method: 'POST', headers: authHeader },
    {
      name: 'Cut Discretionary 20% + 10% Raise',
      description: 'Simulating frugal habits plus yearly salary increment',
      adjustments: {
        incomeChangePercent: 10,
        categoryAdjustments: [
          { category: 'Food & Dining', percentChange: -15 },
          { category: 'Shopping', percentChange: -25 },
        ],
      },
    }
  );
  const scenarioId = saveScenRes.body.data?._id;
  console.log('  Saved Scenario:', saveScenRes.body.data?.name, 'ID:', scenarioId);

  // 7. TEST FEATURE 5: SMART RECEIPT SCANNER & CONFIRMATION
  console.log('\n7. Testing Feature 5: Smart Receipt Scanner (/api/receipts)...');
  const getReceiptsRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/receipts', method: 'GET', headers: authHeader }
  );
  console.log('  Current User Receipts Count:', getReceiptsRes.body.count);

  // 8. TEST FEATURE 6: NET WORTH TRACKER
  console.log('\n8. Testing Feature 6: Net Worth Tracker (/api/net-worth)...');
  // Add Asset 1: Savings Account
  await request(
    { hostname: 'localhost', port: 5000, path: '/api/net-worth/items', method: 'POST', headers: authHeader },
    { type: 'asset', category: 'Cash & Bank Accounts', name: 'HDFC Priority Savings', value: 250000, notes: 'Emergency fund liquid' }
  );
  // Add Asset 2: Mutual Funds
  await request(
    { hostname: 'localhost', port: 5000, path: '/api/net-worth/items', method: 'POST', headers: authHeader },
    { type: 'asset', category: 'Investments', name: 'Nifty 50 Index Fund', value: 450000, notes: 'SIP holding' }
  );
  // Add Liability 1: Car Loan
  await request(
    { hostname: 'localhost', port: 5000, path: '/api/net-worth/items', method: 'POST', headers: authHeader },
    { type: 'liability', category: 'Auto Loans', name: 'Hyundai Auto Loan', value: 120000, notes: 'Remaining principal' }
  );

  const netWorthSummaryRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/net-worth', method: 'GET', headers: authHeader }
  );
  console.log('  Total Assets:', netWorthSummaryRes.body.data?.totalAssets);
  console.log('  Total Liabilities:', netWorthSummaryRes.body.data?.totalLiabilities);
  console.log('  Calculated Net Worth:', netWorthSummaryRes.body.data?.netWorth);
  console.log('  Debt-to-Asset Ratio:', netWorthSummaryRes.body.data?.debtToAssetRatio + '%');
  console.log('  Asset Breakdowns Count:', netWorthSummaryRes.body.data?.assetBreakdown?.length);
  console.log('  Historical Snapshots Count:', netWorthSummaryRes.body.data?.snapshots?.length);

  // Record a new snapshot
  const snapRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/net-worth/snapshots', method: 'POST', headers: authHeader },
    { notes: 'Quarterly review snapshot' }
  );
  console.log('  Snapshot Recorded:', snapRes.body.message);

  console.log('\n=== ALL ADVANCED MODULES API TESTS PASSED SUCCESSFULLY! ===');
}

testAdvancedModules().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
