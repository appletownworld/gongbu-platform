// Load Testing Suite for Gongbu Platform
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    error_rate: ['rate<0.05'],        // Custom error rate must be below 5%
  },
};

// Base URL
const BASE_URL = __ENV.BASE_URL || 'https://gongbu-platform.com';

// Test data
const testUsers = [
  { email: 'user1@test.com', password: 'password123' },
  { email: 'user2@test.com', password: 'password123' },
  { email: 'user3@test.com', password: 'password123' },
];

// Authentication token
let authToken = null;

// Setup function
export function setup() {
  // Login to get authentication token
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
    email: testUsers[0].email,
    password: testUsers[0].password,
  });
  
  if (loginResponse.status === 200) {
    const loginData = JSON.parse(loginResponse.body);
    return { token: loginData.token };
  }
  
  return { token: null };
}

// Main test function
export default function(data) {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  
  // Test 1: Health Check
  testHealthCheck();
  
  // Test 2: User Registration
  testUserRegistration(user);
  
  // Test 3: User Login
  testUserLogin(user);
  
  // Test 4: Get User Profile
  testGetUserProfile(data.token);
  
  // Test 5: Get Courses
  testGetCourses();
  
  // Test 6: Create Course
  testCreateCourse(data.token);
  
  // Test 7: Get Course Details
  testGetCourseDetails();
  
  // Test 8: Bot Interaction
  testBotInteraction(data.token);
  
  // Test 9: Payment Processing
  testPaymentProcessing(data.token);
  
  // Test 10: Analytics
  testAnalytics(data.token);
  
  sleep(1);
}

// Health check test
function testHealthCheck() {
  const response = http.get(`${BASE_URL}/health`);
  
  const success = check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

// User registration test
function testUserRegistration(user) {
  const payload = {
    email: `${Date.now()}@test.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
  };
  
  const response = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const success = check(response, {
    'registration status is 201': (r) => r.status === 201,
    'registration response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

// User login test
function testUserLogin(user) {
  const payload = {
    email: user.email,
    password: user.password,
  };
  
  const response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const success = check(response, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 500ms': (r) => r.timings.duration < 500,
    'login returns token': (r) => {
      const data = JSON.parse(r.body);
      return data.token !== undefined;
    },
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

// Get user profile test
function testGetUserProfile(token) {
  if (!token) return;
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  const response = http.get(`${BASE_URL}/api/auth/profile`, { headers });
  
  const success = check(response, {
    'profile status is 200': (r) => r.status === 200,
    'profile response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

// Get courses test
function testGetCourses() {
  const response = http.get(`${BASE_URL}/api/courses`);
  
  const success = check(response, {
    'courses status is 200': (r) => r.status === 200,
    'courses response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

// Create course test
function testCreateCourse(token) {
  if (!token) return;
  
  const payload = {
    title: `Test Course ${Date.now()}`,
    description: 'This is a test course created during load testing',
    price: 99.99,
    category: 'test',
  };
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  const response = http.post(`${BASE_URL}/api/courses`, JSON.stringify(payload), { headers });
  
  const success = check(response, {
    'create course status is 201': (r) => r.status === 201,
    'create course response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

// Get course details test
function testGetCourseDetails() {
  const courseId = Math.floor(Math.random() * 1000) + 1;
  const response = http.get(`${BASE_URL}/api/courses/${courseId}`);
  
  const success = check(response, {
    'course details status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'course details response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

// Bot interaction test
function testBotInteraction(token) {
  if (!token) return;
  
  const payload = {
    message: 'Hello, this is a test message',
    chatId: Math.floor(Math.random() * 1000000),
  };
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  const response = http.post(`${BASE_URL}/api/bot/message`, JSON.stringify(payload), { headers });
  
  const success = check(response, {
    'bot interaction status is 200': (r) => r.status === 200,
    'bot interaction response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

// Payment processing test
function testPaymentProcessing(token) {
  if (!token) return;
  
  const payload = {
    amount: 99.99,
    currency: 'USD',
    courseId: Math.floor(Math.random() * 1000) + 1,
  };
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  const response = http.post(`${BASE_URL}/api/payments/create`, JSON.stringify(payload), { headers });
  
  const success = check(response, {
    'payment status is 200 or 400': (r) => r.status === 200 || r.status === 400,
    'payment response time < 3000ms': (r) => r.timings.duration < 3000,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

// Analytics test
function testAnalytics(token) {
  if (!token) return;
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  const response = http.get(`${BASE_URL}/api/analytics/dashboard`, { headers });
  
  const success = check(response, {
    'analytics status is 200': (r) => r.status === 200,
    'analytics response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

// Teardown function
export function teardown(data) {
  console.log('Load test completed');
}
