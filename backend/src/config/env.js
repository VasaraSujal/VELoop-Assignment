import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/veloop_giveaway',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-do-not-use-in-prod',
  refreshSecret: process.env.REFRESH_SECRET || 'dev-refresh-secret-key-do-not-use-in-prod',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

export default config;
