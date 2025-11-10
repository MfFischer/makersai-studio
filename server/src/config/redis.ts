import NodeCache from 'node-cache';
import { config } from './env.js';

// In-memory cache using node-cache (simpler than Redis for standalone app)
export const cache = new NodeCache({
  stdTTL: config.cache.ttl,
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false,
});

export const connectCache = async () => {
  console.log('✅ In-memory cache initialized');
};

export const disconnectCache = async () => {
  cache.close();
  console.log('✅ Cache closed');
};

