import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl || '*',
    credentials: true,
  })
);

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Baseline rate limiter
app.use('/api', rateLimiter({ windowMs: 60 * 1000, max: 200 }));

// Mount central API router
app.use('/api', routes);

// 404 Fallback for unknown API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`,
  });
});

// Central Error Handler
app.use(errorHandler);

export default app;
