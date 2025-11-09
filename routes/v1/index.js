import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import vehiclesRoutes from './vehicles.routes.js';
import listingsRoutes from './listings.routes.js';
import bookingsRoutes from './bookings.routes.js';
import paymentsRoutes from './payments.routes.js';
import searchRoutes from './search.routes.js';
import systemRoutes from './system.routes.js';
import alertsRoutes from './alerts.routes.js';
import reportsRoutes from './reports.routes.js';
import teamRoutes from './team.routes.js';
import automationsRoutes from './automations.routes.js';
import calendarRoutes from './calendar.routes.js';
import documentsRoutes from './documents.routes.js';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/vehicles', vehiclesRoutes);
router.use('/listings', listingsRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/search', searchRoutes);
router.use('/alerts', alertsRoutes);
router.use('/reports', reportsRoutes);
router.use('/team', teamRoutes);
router.use('/automations', automationsRoutes);
router.use('/calendar', calendarRoutes);
router.use('/documents', documentsRoutes);

// System routes (health, version, etc.)
router.use('/health', systemRoutes);
router.use('/version', systemRoutes);
router.use('/time', systemRoutes);
router.use('/config', systemRoutes);

// Mock routes for endpoints specified but not fully implemented
// These return basic success responses

// Payouts
router.get('/payouts', (req, res) => res.json({ success: true, message: 'Payouts endpoint' }));
router.get('/payouts/:id', (req, res) =>
  res.json({ success: true, message: 'Payout detail endpoint' })
);

// Wallet
router.get('/wallet', (req, res) => res.json({ success: true, message: 'Wallet endpoint' }));

// Coupons
router.post('/coupons/validate', (req, res) =>
  res.json({ success: true, message: 'Coupon validate endpoint' })
);

// Reviews
router.post('/reviews/hosts/:hostId', (req, res) =>
  res.json({ success: true, message: 'Host review endpoint' })
);
router.get('/reviews/hosts/:hostId', (req, res) =>
  res.json({ success: true, message: 'Host reviews endpoint' })
);

// Messaging
router.get('/threads', (req, res) => res.json({ success: true, message: 'Threads endpoint' }));
router.post('/threads', (req, res) => res.json({ success: true, message: 'Create thread endpoint' }));

// Notifications
router.get('/notifications', (req, res) =>
  res.json({ success: true, message: 'Notifications endpoint' })
);
router.post('/notifications/read', (req, res) =>
  res.json({ success: true, message: 'Mark notifications read endpoint' })
);

// Incidents
router.get('/incidents', (req, res) => res.json({ success: true, message: 'Incidents endpoint' }));
router.post('/incidents', (req, res) =>
  res.json({ success: true, message: 'Create incident endpoint' })
);

// Uploads
router.post('/uploads/sign', (req, res) =>
  res.json({ success: true, message: 'Sign upload endpoint' })
);

// Geo
router.get('/geo/reverse', (req, res) => res.json({ success: true, message: 'Geo reverse endpoint' }));
router.get('/geo/cities', (req, res) => res.json({ success: true, message: 'Geo cities endpoint' }));

// Content
router.get('/content/faqs', (req, res) => res.json({ success: true, message: 'FAQs endpoint' }));

// Webhooks
router.post('/webhooks/:provider', (req, res) =>
  res.json({ success: true, message: 'Webhook endpoint' })
);

// Admin
router.get('/admin/dashboard', (req, res) =>
  res.json({ success: true, message: 'Admin dashboard endpoint' })
);

export default router;

