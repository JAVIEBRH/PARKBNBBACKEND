import 'dotenv/config';
import express from 'express';
import fileUpload from 'express-fileupload';
import { connectDB } from './libs/mongoose.js';
import { corsMiddleware } from './config/cors.js';
import { helmetConfig } from './config/helmet.js';
import { globalRateLimiter } from './config/rateLimit.js';
import { specs, swaggerUi } from './config/swagger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { createLogger } from './libs/logger.js';
import v1Routes from './routes/v1/index.js';

const logger = createLogger('Server');

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// File upload middleware
app.use(
  fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    abortOnLimit: true,
    createParentPath: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(helmetConfig);
app.use(corsMiddleware);

// Rate limiting
app.use('/api/v1/auth', globalRateLimiter);
app.use('/api', globalRateLimiter);

// Serve static files (uploads)
app.use('/uploads', express.static('public/uploads'));

// API Documentation
app.use('/api/v1/docs', swaggerUi.serve);
app.get('/api/v1/docs', swaggerUi.setup(specs, { explorer: true }));

app.get('/api/v1/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// Health check endpoint (no prefix)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Parkbnb API v1.0.0',
    docs: '/api/v1/docs',
    health: '/api/v1/health',
  });
});

// API v1 routes
app.use('/api/v1', v1Routes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    app.listen(PORT, () => {
      logger.info('='.repeat(50));
      logger.info(`🚀 Servidor Parkbnb iniciado exitosamente`);
      logger.info(`📡 Puerto: ${PORT}`);
      logger.info(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📚 Documentación: http://localhost:${PORT}/api/v1/docs`);
      logger.info(`❤️  Health Check: http://localhost:${PORT}/api/v1/health`);
      logger.info('='.repeat(50));
    });
  } catch (error) {
    logger.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM recibido. Cerrando servidor...');
  process.exit(0);
});

startServer();

