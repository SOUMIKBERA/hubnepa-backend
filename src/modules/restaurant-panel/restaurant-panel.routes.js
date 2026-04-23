const express = require('express');
const router = express.Router();
const ctrl = require('./restaurant-panel.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

router.use(protect, authorize('restaurant'));

// Dashboard
router.get('/dashboard', ctrl.getDashboard);

// Orders
router.get('/orders', ctrl.getOrders);
router.get('/orders/live', ctrl.getLiveOrders);
router.get('/orders/history', ctrl.getOrderHistory);
router.put('/orders/accept-all', ctrl.acceptAllPending);
router.get('/orders/:id', ctrl.getOrderById);
router.put('/orders/:id/status', ctrl.updateOrderStatus);

// Menu
router.get('/menu', ctrl.getMenu);
router.post('/menu', ctrl.addMenuItem);
router.get('/menu/:itemId', ctrl.getMenuItemById);
router.put('/menu/:itemId', ctrl.updateMenuItem);
router.delete('/menu/:itemId', ctrl.deleteMenuItem);
router.put('/menu/:itemId/availability', ctrl.toggleAvailability);

// Inventory
router.get('/inventory', ctrl.getInventory);
router.post('/inventory', ctrl.addInventoryItem);
router.put('/inventory/:id', ctrl.updateInventoryItem);
router.put('/inventory/:id/adjust', ctrl.adjustInventoryStock);
router.delete('/inventory/:id', ctrl.deleteInventoryItem);

// Beverages
router.get('/inventory/beverages', ctrl.getBeverages);
router.post('/inventory/beverages', ctrl.addBeverage);
router.put('/inventory/beverages/:id/adjust', ctrl.adjustBeverageStock);
router.delete('/inventory/beverages/:id', ctrl.deleteBeverage);

// Recipes
router.get('/recipes', ctrl.getRecipes);
router.post('/recipes', ctrl.createRecipe);
router.put('/recipes/:id', ctrl.updateRecipe);
router.delete('/recipes/:id', ctrl.deleteRecipe);

// Expenses
router.get('/expenses', ctrl.getExpenses);
router.post('/expenses', ctrl.createExpense);
router.put('/expenses/:id', ctrl.updateExpense);
router.delete('/expenses/:id', ctrl.deleteExpense);

// Maintenance
router.get('/expenses/maintenance', ctrl.getMaintenance);
router.post('/expenses/maintenance', ctrl.createMaintenance);
router.put('/expenses/maintenance/:id', ctrl.updateMaintenance);

// Payroll
router.get('/expenses/payroll', ctrl.getPayroll);
router.post('/expenses/payroll/run', ctrl.runPayroll);
router.put('/expenses/payroll/:id', ctrl.updatePayroll);
router.put('/expenses/payroll/:id/pay', ctrl.payPayroll);

// Staff
router.get('/staff', ctrl.getStaff);
router.post('/staff', ctrl.createStaff);
router.get('/staff/schedule', ctrl.getSchedule);
router.post('/staff/schedule', ctrl.createShift);
router.put('/staff/schedule/:id', ctrl.updateShift);
router.delete('/staff/schedule/:id', ctrl.deleteShift);
router.get('/staff/requests', ctrl.getStaffRequests);
router.put('/staff/requests/:id', ctrl.updateStaffRequest);
router.get('/staff/:id', ctrl.getStaffById);
router.put('/staff/:id', ctrl.updateStaff);
router.put('/staff/:id/permissions', ctrl.updateStaffPermissions);
router.delete('/staff/:id', ctrl.terminateStaff);

// Sales Closing
router.get('/sales-closing', ctrl.getSalesClosing);
router.post('/sales-closing', ctrl.submitSalesEntry);
router.get('/sales-closing/missing', ctrl.getMissingSalesDates);

// Reports
router.get('/reports', ctrl.getReports);

// Settings
router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSettings);
router.get('/settings/locations', ctrl.getLocations);
router.post('/settings/locations', ctrl.addLocation);
router.put('/settings/locations/:id', ctrl.updateLocation);
router.delete('/settings/locations/:id', ctrl.deleteLocation);
router.put('/settings/notifications', ctrl.updateNotificationPrefs);

module.exports = router;