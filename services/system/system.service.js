import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getHealth = async () => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  return {
    status: 'ok',
    timestamp: new Date(),
    services: {
      database: dbStatus,
      api: 'running',
    },
    uptime: process.uptime(),
  };
};

export const getVersion = async () => {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '../../package.json'), 'utf-8')
    );

    return {
      version: packageJson.version || '1.0.0',
      name: packageJson.name,
      node: process.version,
      environment: process.env.NODE_ENV,
    };
  } catch (error) {
    return {
      version: '1.0.0',
      name: 'parkbnb-backend',
      node: process.version,
      environment: process.env.NODE_ENV,
    };
  }
};

export const getServerTime = async () => {
  return {
    timestamp: new Date(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    unixTimestamp: Math.floor(Date.now() / 1000),
  };
};

export const getConfig = async () => {
  return {
    features: {
      twoFactorAuth: process.env.ENABLE_2FA === 'true',
      kyc: process.env.ENABLE_KYC === 'true',
      socialLogin: process.env.ENABLE_SOCIAL_LOGIN === 'true',
    },
    business: {
      serviceFeePercentage: parseFloat(process.env.SERVICE_FEE_PERCENTAGE || '15'),
      hostPayoutDelayDays: parseInt(process.env.HOST_PAYOUT_DELAY_DAYS || '2', 10),
      bookingAutoCancelHours: parseInt(process.env.BOOKING_AUTO_CANCEL_HOURS || '24', 10),
      overstayRateMultiplier: parseFloat(process.env.OVERSTAY_RATE_MULTIPLIER || '1.5'),
    },
  };
};

