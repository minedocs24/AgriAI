/**
 * Test per il server Express
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import * as request from 'supertest';
import * as express from 'express';

// Create a simple test app
const app = express();

// Add basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add a test route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.post('/test', (req, res) => {
  res.status(200).json({ 
    success: true, 
    data: req.body,
    message: 'Test endpoint working' 
  });
});

describe('Express Server Tests', () => {
  let server: any;

  beforeAll(() => {
    server = app.listen(0); // Use port 0 for random available port
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.message).toBe('Server is running');
    });
  });

  describe('Test Endpoint', () => {
    it('should handle POST requests', async () => {
      const testData = { test: 'data', number: 123 };
      
      const response = await request(app)
        .post('/test')
        .send(testData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(testData);
      expect(response.body.message).toBe('Test endpoint working');
    });

    it('should handle JSON parsing', async () => {
      const response = await request(app)
        .post('/test')
        .send({ key: 'value' })
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(response.body.data.key).toBe('value');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      await request(app)
        .get('/non-existent')
        .expect(404);
    });
  });
}); 