const express = require('express');
const router = express.Router();
const ctrl = require('./supplier-panel.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

router.use(protect, authorize('supplier'));

// Dashboard
router.get('/dashboard', ctrl.getDashboard);

// Product Catalog
router.get('/products', ctrl.getProducts);
router.post('/products', ctrl.createProduct);
router.get('/products/:id', ctrl.getProduct);
router.put('/products/:id', ctrl.updateProduct);
router.delete('/products/:id', ctrl.deleteProduct);

// Bulk Orders
router.get('/orders', ctrl.getOrders);
router.get('/orders/:id', ctrl.getOrder);
router.put('/orders/:id/status', ctrl.updateOrderStatus);
router.post('/orders/manifest', ctrl.createManifest);

// Warehouse
router.get('/warehouse/zones', ctrl.getWarehouseZones);
router.post('/warehouse/zones', ctrl.createZone);
router.put('/warehouse/zones/:id', ctrl.updateZone);
router.get('/warehouse/items', ctrl.getWarehouseItems);
router.post('/warehouse/adjust', ctrl.adjustStock);

// Clients
router.get('/clients', ctrl.getClients);
router.post('/clients', ctrl.createClient);
router.put('/clients/:id', ctrl.updateClient);
router.post('/clients/broadcast', ctrl.broadcastToClients);

// Logistics
router.get('/logistics', ctrl.getShipments);
router.post('/logistics', ctrl.createShipment);
router.put('/logistics/:id', ctrl.updateShipment);
router.put('/logistics/:id/assign-driver', ctrl.assignDriver);

// Finance
router.get('/finance', ctrl.getFinance);
router.get('/finance/invoices', ctrl.getInvoices);
router.post('/finance/invoices', ctrl.createInvoice);
router.put('/finance/invoices/:id', ctrl.updateInvoice);
router.post('/finance/payout', ctrl.requestPayout);

// Reports
router.get('/reports', ctrl.getReports);

// Settings
router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSettings);

module.exports = router;