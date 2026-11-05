/**
 * Medicamaru — adapter resolution.
 *
 * One switch decides where catalogue data comes from. Nothing outside
 * services/ should ever import an adapter directly.
 *
 *   DATA_SOURCE=mock   fixtures (default while the backend replica is pending)
 *   DATA_SOURCE=api    the real backend
 */

import { mockAdapter } from './mock';
import { httpAdapter } from './http';
import { mockAuthAdapter } from './mock/auth';
import { httpAuthAdapter } from './http/auth';
import { mockCartAdapter } from './mock/cart';
import { httpCartAdapter } from './http/cart';

const source = process.env.DATA_SOURCE || 'mock';

export const adapter = source === 'api' ? httpAdapter : mockAdapter;

/** Authentication is switched by the same flag, so the two never diverge. */
export const authAdapter = source === 'api' ? httpAuthAdapter : mockAuthAdapter;

export const cartAdapter = source === 'api' ? httpCartAdapter : mockCartAdapter;

export const isMockData = source !== 'api';
