import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

const PORT = config.port;

const startServer = () => {
  // Start HTTP Server immediately
  const server = app.listen(PORT, () => {
    console.log(`[Server] VELOOP Giveaway backend running in ${config.nodeEnv} mode on port ${PORT}`);
    console.log(`[Server] Health check available at: http://localhost:${PORT}/api/health`);
  });

  // Attempt database connection in background
  connectDB();

  // Graceful shutdown
  const handleShutdown = (signal) => {
    console.log(`[Server] Received ${signal}. Gracefully closing server...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
};

startServer();
