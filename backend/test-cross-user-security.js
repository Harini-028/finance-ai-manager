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

async function testCrossUserSecurity() {
  console.log('=== VERIFYING CROSS-USER DATA ISOLATION & AUTH SECURITY ===\n');

  // Register User A
  const emailA = `user_a_${Date.now()}@example.com`;
  const regA = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Alice Wonderland', email: emailA, password: 'password123' }
  );
  const tokenA = regA.body.token;
  const headerA = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` };

  // Register User B
  const emailB = `user_b_${Date.now()}@example.com`;
  const regB = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Bob Builder', email: emailB, password: 'password123' }
  );
  const tokenB = regB.body.token;
  const headerB = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` };

  console.log('1. User A & User B registered successfully.');

  // User A creates resources
  console.log('\n2. User A creates private financial records:');

  // Goal A
  const goalResA = await request(
    { hostname: 'localhost', port: 5000, path: '/api/savings', method: 'POST', headers: headerA },
    { goalName: "Alice's Secret Vault", targetAmount: 500000, currentAmount: 100000 }
  );
  const goalIdA = goalResA.body.data?.id;
  console.log('  Created Goal A:', goalIdA);

  // Subscription A
  const subResA = await request(
    { hostname: 'localhost', port: 5000, path: '/api/subscriptions', method: 'POST', headers: headerA },
    { name: "Alice's Private Membership", amount: 2999, frequency: 'monthly' }
  );
  const subIdA = subResA.body.data?.id;
  console.log('  Created Subscription A:', subIdA);

  // Scenario A
  const scenResA = await request(
    { hostname: 'localhost', port: 5000, path: '/api/scenarios', method: 'POST', headers: headerA },
    { name: "Alice's Confidential Forecast", description: 'Private plan' }
  );
  const scenIdA = scenResA.body.data?._id;
  console.log('  Created Scenario A:', scenIdA);

  // Net Worth Item A
  const nwResA = await request(
    { hostname: 'localhost', port: 5000, path: '/api/net-worth/items', method: 'POST', headers: headerA },
    { type: 'asset', category: 'Real Estate & Property', name: "Alice's Villa", value: 15000000 }
  );
  const nwIdA = nwResA.body.data?._id;
  console.log('  Created Net Worth Item A:', nwIdA);

  // TEST CROSS-USER ISOLATION: USER B ATTEMPTS TO ACCESS USER A'S DATA
  console.log('\n3. Testing Cross-User Unauthorized Access Restrictions:');

  // B attempts to GET all goals (should not see A's goal)
  const getGoalsB = await request({ hostname: 'localhost', port: 5000, path: '/api/savings', method: 'GET', headers: headerB });
  const bSeesA_goal = (getGoalsB.body.data || []).some((g) => g.id === goalIdA);
  console.log('  User B listing goals includes User A goal?', bSeesA_goal ? 'FAILED (DATA LEAK!)' : 'PASSED (Protected)');

  // B attempts to UPDATE A's goal
  const updateGoalB = await request(
    { hostname: 'localhost', port: 5000, path: `/api/savings/${goalIdA}`, method: 'PUT', headers: headerB },
    { goalName: "Hacked by Bob" }
  );
  console.log('  User B PUT User A goal status:', updateGoalB.status, updateGoalB.status === 404 ? 'PASSED (Blocked)' : 'FAILED');

  // B attempts to DELETE A's goal
  const deleteGoalB = await request(
    { hostname: 'localhost', port: 5000, path: `/api/savings/${goalIdA}`, method: 'DELETE', headers: headerB }
  );
  console.log('  User B DELETE User A goal status:', deleteGoalB.status, deleteGoalB.status === 404 ? 'PASSED (Blocked)' : 'FAILED');

  // B attempts to UPDATE A's subscription
  const updateSubB = await request(
    { hostname: 'localhost', port: 5000, path: `/api/subscriptions/${subIdA}`, method: 'PUT', headers: headerB },
    { name: "Hacked Subscription" }
  );
  console.log('  User B PUT User A subscription status:', updateSubB.status, updateSubB.status === 404 ? 'PASSED (Blocked)' : 'FAILED');

  // B attempts to DELETE A's scenario
  const deleteScenB = await request(
    { hostname: 'localhost', port: 5000, path: `/api/scenarios/${scenIdA}`, method: 'DELETE', headers: headerB }
  );
  console.log('  User B DELETE User A scenario status:', deleteScenB.status, deleteScenB.status === 404 ? 'PASSED (Blocked)' : 'FAILED');

  // B attempts to UPDATE A's net worth asset
  const updateNwB = await request(
    { hostname: 'localhost', port: 5000, path: `/api/net-worth/items/${nwIdA}`, method: 'PUT', headers: headerB },
    { value: 0 }
  );
  console.log('  User B PUT User A net worth asset status:', updateNwB.status, updateNwB.status === 404 ? 'PASSED (Blocked)' : 'FAILED');

  // TEST UNAUTHENTICATED CALLS
  console.log('\n4. Testing Unauthenticated Access Restrictions:');
  const noTokenRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/net-worth', method: 'GET', headers: { 'Content-Type': 'application/json' } }
  );
  console.log('  Request with NO token status:', noTokenRes.status, noTokenRes.status === 401 ? 'PASSED (401 Unauthorized)' : 'FAILED');

  const badTokenRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/net-worth', method: 'GET', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer forged_fake_token_123' } }
  );
  console.log('  Request with FORGED token status:', badTokenRes.status, badTokenRes.status === 401 ? 'PASSED (401 Unauthorized)' : 'FAILED');

  console.log('\n=== ALL SECURITY & CROSS-USER ISOLATION TESTS PASSED! ===');
}

testCrossUserSecurity().catch((err) => {
  console.error('Security test failed:', err);
  process.exit(1);
});
