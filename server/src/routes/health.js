const express = require('express');
const { runQuery } = require('../utils/database');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/health - Basic health check
router.get('/', async (req, res) => {
  try {
    // Check database connectivity
    await runQuery('SELECT 1 as health_check');
    
    res.json({
      success: true,
      message: 'MedGPT API is healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Service unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/health/detailed - Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const healthStatus = {
      success: true,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {}
    };

    // Database health check
    try {
      const startTime = Date.now();
      await runQuery('SELECT 1 as health_check');
      const dbResponseTime = Date.now() - startTime;
      
      healthStatus.services.database = {
        status: 'healthy',
        responseTime: `${dbResponseTime}ms`
      };
    } catch (error) {
      healthStatus.services.database = {
        status: 'unhealthy',
        error: error.message
      };
      healthStatus.success = false;
    }

    // AI service health check (basic)
    try {
      healthStatus.services.ai = {
        status: 'healthy',
        model: process.env.AI_MODEL || 'gpt-4',
        apiKeyConfigured: !!process.env.OPENAI_API_KEY
      };
    } catch (error) {
      healthStatus.services.ai = {
        status: 'unhealthy',
        error: error.message
      };
      healthStatus.success = false;
    }

    // System information
    healthStatus.system = {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };

    const statusCode = healthStatus.success ? 200 : 503;
    res.status(statusCode).json(healthStatus);

  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/health/ready - Readiness check
router.get('/ready', async (req, res) => {
  try {
    // Check if all critical services are ready
    const checks = [];

    // Database check
    try {
      await runQuery('SELECT 1 as health_check');
      checks.push({ service: 'database', status: 'ready' });
    } catch (error) {
      checks.push({ service: 'database', status: 'not_ready', error: error.message });
    }

    // AI service check
    if (process.env.OPENAI_API_KEY) {
      checks.push({ service: 'ai', status: 'ready' });
    } else {
      checks.push({ service: 'ai', status: 'not_ready', error: 'API key not configured' });
    }

    const allReady = checks.every(check => check.status === 'ready');
    const statusCode = allReady ? 200 : 503;

    res.status(statusCode).json({
      success: allReady,
      message: allReady ? 'Service is ready' : 'Service is not ready',
      checks,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Readiness check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 