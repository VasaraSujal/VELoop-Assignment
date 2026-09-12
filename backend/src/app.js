import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import './models/index.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

const app = express();

// Security and utility middleware
app.use(helmet());

// Restricted CORS configuration
const allowedOrigins = [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(new Error('CORS blocked origin not allowed by configuration'), false);
    },
    credentials: true,
  })
);

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Strict payload limits to prevent DOS
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Baseline rate limiter
app.use('/api', rateLimiter({ windowMs: 60 * 1000, max: 200 }));

// Mount central API router
app.use('/api', routes);

// 404 Fallback for unknown API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `API endpoint '${req.originalUrl}' not found.`,
  });
});

// Central Error Handler
app.use(errorHandler);

export default app;
