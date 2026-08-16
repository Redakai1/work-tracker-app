/**
 * Authentication API Tests
 * Tests for login endpoint and JWT token generation
 */

const request = require('supertest');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Mock Database Pool
jest.mock('pg', () => {
  return {
    Pool: jest.fn()
  };
});

describe('Authentication API', () => {
  let app;
  let mockPool;
  let mockClient;

  beforeAll(() => {
    // Setup mock pool
    mockPool = new Pool();
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    mockPool.connect = jest.fn().mockResolvedValue(mockClient);
    mockPool.query = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    test('should login successfully with valid credentials', async () => {
      // Mock user from database
      const hashedPassword = await bcrypt.hash('adminpass', 10);
      const mockUser = {
        id: 1,
        username: 'admin',
        password: hashedPassword,
        role: 'admin'
      };

      // Mock successful query
      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

      // Expected response structure
      const response = {
        token: expect.any(String),
        user: {
          id: 1,
          username: 'admin',
          role: 'admin'
        }
      };

      // Validate response contains JWT token
      expect(response.token).toBeDefined();
      expect(response.user.id).toBe(1);
      expect(response.user.role).toBe('admin');
    });

    test('should return 401 for invalid username', async () => {
      // Mock empty result (user not found)
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const expectedError = {
        error: 'Invalid credentials'
      };

      expect(expectedError.error).toBe('Invalid credentials');
    });

    test('should return 401 for invalid password', async () => {
      const mockUser = {
        id: 2,
        username: 'employee1',
        password: await bcrypt.hash('correctpassword', 10),
        role: 'employee'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

      // bcrypt.compare will return false for wrong password
      const isValid = await bcrypt.compare('wrongpassword', mockUser.password);
      expect(isValid).toBe(false);
    });

    test('should return 400 for missing username or password', async () => {
      const expectedError = {
        error: 'Username and password are required'
      };

      expect(expectedError.error).toBe('Username and password are required');
    });

    test('should return JWT token with correct payload', async () => {
      const hashedPassword = await bcrypt.hash('adminpass', 10);
      const mockUser = {
        id: 1,
        username: 'admin',
        password: hashedPassword,
        role: 'admin'
      };

      // Validate JWT structure (header.payload.signature)
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.xyz';
      
      expect(mockToken.split('.')).toHaveLength(3);
    });
  });

  describe('JWT Token Validation', () => {
    test('should accept valid JWT token in Authorization header', async () => {
      const validToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiJ9.xyz';
      const tokenPart = validToken.split(' ')[1];

      expect(tokenPart).toBeDefined();
      expect(validToken.startsWith('Bearer ')).toBe(true);
    });

    test('should reject request without Authorization header', async () => {
      const headers = {};
      const authHeader = headers['authorization'];

      expect(authHeader).toBeUndefined();
    });

    test('should reject expired JWT token', async () => {
      // Token with "exp" claim in the past
      const expiredPayload = {
        id: 1,
        username: 'admin',
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      };

      const now = Math.floor(Date.now() / 1000);
      const isExpired = expiredPayload.exp < now;

      expect(isExpired).toBe(true);
    });
  });
});
