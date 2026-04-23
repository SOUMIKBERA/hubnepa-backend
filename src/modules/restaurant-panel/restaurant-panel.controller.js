const svc = require('./restaurant-panel.service');
const { successResponse } = require('../../utils/apiResponse');

// Dashboard
exports.getDashboard = async (req, res, next) => { try { return successResponse(res, 200, 'Dashboard.', await svc.getDashboard(req.user._id)); } catch (e) { next(e); } };

// Orders
exports.getOrders = async (req, res, next) => { try { return successResponse(res, 200, 'Orders.', await svc.getOrders(req.user._id, req.query)); } catch (e) { next(e); } };
exports.getLiveOrders = async (req, res, next) => { try { return successResponse(res, 200, 'Live orders.', { orders: await svc.getLiveOrders(req.user._id) }); } catch (e) { next(e); } };
exports.getOrderById = async (req, res, next) => { try { const Order = require('../order/order.model'); const Restaurant = require('../restaurant/restaurant.model'); const r = await Restaurant.findOne({ owner: req.user._id }); if (!r) return res.status(404).json({ success: false, message: 'Restaurant not found.' }); const o = await Order.findOne({ _id: req.params.id, restaurant: r._id }).populate('customer', 'firstName lastName phone email'); if (!o) return res.status(404).json({ success: false, message: 'Order not found.' }); return successResponse(res, 200, 'Order.', { order: o }); } catch (e) { next(e); } };
exports.updateOrderStatus = async (req, res, next) => { try { const o = await svc.updateOrderStatus(req.user._id, req.params.id, req.body.status, req.body.note); return successResponse(res, 200, 'Status updated.', { order: o }); } catch (e) { next(e); } };
exports.acceptAllPending = async (req, res, next) => { try { await svc.acceptAllPending(req.user._id); return successResponse(res, 200, 'All pending orders accepted.'); } catch (e) { next(e); } };
exports.getOrderHistory = async (req, res, next) => { try { return successResponse(res, 200, 'Order history.', await svc.getOrderHistory(req.user._id, req.query)); } catch (e) { next(e); } };

// Menu
exports.getMenu = async (req, res, next) => { try { return successResponse(res, 200, 'Menu.', await svc.getMenu(req.user._id, req.query)); } catch (e) { next(e); } };
exports.addMenuItem = async (req, res, next) => { try { const item = await svc.addMenuItem(req.user._id, req.body); return successResponse(res, 201, 'Menu item added.', { item }); } catch (e) { next(e); } };
exports.getMenuItemById = async (req, res, next) => { try { const Restaurant = require('../restaurant/restaurant.model'); const r = await Restaurant.findOne({ owner: req.user._id }); if (!r) return res.status(404).json({ success: false, message: 'Restaurant not found.' }); const item = r.menu.id(req.params.itemId); if (!item) return res.status(404).json({ success: false, message: 'Item not found.' }); return successResponse(res, 200, 'Item.', { item }); } catch (e) { next(e); } };
exports.updateMenuItem = async (req, res, next) => { try { const item = await svc.updateMenuItem(req.user._id, req.params.itemId, req.body); return successResponse(res, 200, 'Item updated.', { item }); } catch (e) { next(e); } };
exports.deleteMenuItem = async (req, res, next) => { try { await svc.deleteMenuItem(req.user._id, req.params.itemId); return successResponse(res, 200, 'Item deleted.'); } catch (e) { next(e); } };
exports.toggleAvailability = async (req, res, next) => { try { const item = await svc.toggleAvailability(req.user._id, req.params.itemId, req.body.isAvailable); return successResponse(res, 200, 'Availability updated.', { item }); } catch (e) { next(e); } };

// Inventory
exports.getInventory = async (req, res, next) => { try { return successResponse(res, 200, 'Inventory.', await svc.getInventory(req.user._id, req.query)); } catch (e) { next(e); } };
exports.addInventoryItem = async (req, res, next) => { try { const item = await svc.addInventoryItem(req.user._id, req.body); return successResponse(res, 201, 'Item added.', { item }); } catch (e) { next(e); } };
exports.updateInventoryItem = async (req, res, next) => { try { const item = await svc.updateInventoryItem(req.user._id, req.params.id, req.body); return successResponse(res, 200, 'Item updated.', { item }); } catch (e) { next(e); } };
exports.adjustInventoryStock = async (req, res, next) => { try { const { adjustmentType, quantity, reason } = req.body; const item = await svc.adjustInventoryStock(req.user._id, req.params.id, adjustmentType, quantity, reason); return successResponse(res, 200, 'Stock adjusted.', { item }); } catch (e) { next(e); } };
exports.deleteInventoryItem = async (req, res, next) => { try { await svc.deleteInventoryItem(req.user._id, req.params.id); return successResponse(res, 200, 'Item deleted.'); } catch (e) { next(e); } };
exports.getBeverages = async (req, res, next) => { try { return successResponse(res, 200, 'Beverages.', await svc.getBeverages(req.user._id, req.query)); } catch (e) { next(e); } };
exports.addBeverage = async (req, res, next) => { try { const bev = await svc.addBeverage(req.user._id, req.body); return successResponse(res, 201, 'Beverage added.', { bev }); } catch (e) { next(e); } };
exports.adjustBeverageStock = async (req, res, next) => { try { const bev = await svc.adjustBeverageStock(req.user._id, req.params.id, req.body.adjustmentType, req.body.quantity); return successResponse(res, 200, 'Adjusted.', { bev }); } catch (e) { next(e); } };
exports.deleteBeverage = async (req, res, next) => { try { await svc.deleteBeverage(req.user._id, req.params.id); return successResponse(res, 200, 'Deleted.'); } catch (e) { next(e); } };
exports.getRecipes = async (req, res, next) => { try { return successResponse(res, 200, 'Recipes.', await svc.getRecipes(req.user._id, req.query)); } catch (e) { next(e); } };
exports.createRecipe = async (req, res, next) => { try { const recipe = await svc.createRecipe(req.user._id, req.body); return successResponse(res, 201, 'Recipe created.', { recipe }); } catch (e) { next(e); } };
exports.updateRecipe = async (req, res, next) => { try { const recipe = await svc.updateRecipe(req.user._id, req.params.id, req.body); return successResponse(res, 200, 'Recipe updated.', { recipe }); } catch (e) { next(e); } };
exports.deleteRecipe = async (req, res, next) => { try { await svc.deleteRecipe(req.user._id, req.params.id); return successResponse(res, 200, 'Recipe deleted.'); } catch (e) { next(e); } };

// Expenses
exports.getExpenses = async (req, res, next) => { try { return successResponse(res, 200, 'Expenses.', await svc.getExpenses(req.user._id, req.query)); } catch (e) { next(e); } };
exports.createExpense = async (req, res, next) => { try { const expense = await svc.createExpense(req.user._id, req.body); return successResponse(res, 201, 'Expense recorded.', { expense }); } catch (e) { next(e); } };
exports.updateExpense = async (req, res, next) => { try { const expense = await svc.updateExpense(req.user._id, req.params.id, req.body); return successResponse(res, 200, 'Expense updated.', { expense }); } catch (e) { next(e); } };
exports.deleteExpense = async (req, res, next) => { try { await svc.deleteExpense(req.user._id, req.params.id); return successResponse(res, 200, 'Expense deleted.'); } catch (e) { next(e); } };
exports.getMaintenance = async (req, res, next) => { try { return successResponse(res, 200, 'Maintenance.', await svc.getMaintenanceIssues(req.user._id, req.query)); } catch (e) { next(e); } };
exports.createMaintenance = async (req, res, next) => { try { const issue = await svc.createMaintenanceIssue(req.user._id, req.body); return successResponse(res, 201, 'Issue reported.', { issue }); } catch (e) { next(e); } };
exports.updateMaintenance = async (req, res, next) => { try { const issue = await svc.updateMaintenanceIssue(req.user._id, req.params.id, req.body); return successResponse(res, 200, 'Issue updated.', { issue }); } catch (e) { next(e); } };
exports.getPayroll = async (req, res, next) => { try { return successResponse(res, 200, 'Payroll.', await svc.getPayroll(req.user._id, req.query)); } catch (e) { next(e); } };
exports.runPayroll = async (req, res, next) => { try { const payrolls = await svc.runPayroll(req.user._id, req.body); return successResponse(res, 201, `Payroll generated for ${payrolls.length} staff.`, { count: payrolls.length }); } catch (e) { next(e); } };
exports.updatePayroll = async (req, res, next) => { try { const payroll = await svc.updatePayroll(req.user._id, req.params.id, req.body); return successResponse(res, 200, 'Payroll updated.', { payroll }); } catch (e) { next(e); } };
exports.payPayroll = async (req, res, next) => { try { const payroll = await svc.updatePayroll(req.user._id, req.params.id, { status: 'Paid', paymentDate: new Date() }); return successResponse(res, 200, 'Payroll paid.', { payroll }); } catch (e) { next(e); } };

// Staff
exports.getStaff = async (req, res, next) => { try { return successResponse(res, 200, 'Staff.', await svc.getStaff(req.user._id, req.query)); } catch (e) { next(e); } };
exports.createStaff = async (req, res, next) => { try { const staff = await svc.createStaff(req.user._id, req.body); return successResponse(res, 201, 'Staff added.', { staff }); } catch (e) { next(e); } };
exports.getStaffById = async (req, res, next) => { try { return successResponse(res, 200, 'Staff.', await svc.getStaffById(req.user._id, req.params.id)); } catch (e) { next(e); } };
exports.updateStaff = async (req, res, next) => { try { const staff = await svc.updateStaff(req.user._id, req.params.id, req.body); return successResponse(res, 200, 'Staff updated.', { staff }); } catch (e) { next(e); } };
exports.updateStaffPermissions = async (req, res, next) => { try { const staff = await svc.updateStaffPermissions(req.user._id, req.params.id, req.body.accessRoles); return successResponse(res, 200, 'Permissions updated.', { staff }); } catch (e) { next(e); } };
exports.terminateStaff = async (req, res, next) => { try { await svc.terminateStaff(req.user._id, req.params.id, req.body.reason); return successResponse(res, 200, 'Staff terminated.'); } catch (e) { next(e); } };
exports.getSchedule = async (req, res, next) => { try { return successResponse(res, 200, 'Schedule.', { shifts: await svc.getSchedule(req.user._id, req.query) }); } catch (e) { next(e); } };
exports.createShift = async (req, res, next) => { try { const shift = await svc.createShift(req.user._id, req.body); return successResponse(res, 201, 'Shift added.', { shift }); } catch (e) { next(e); } };
exports.updateShift = async (req, res, next) => { try { const shift = await svc.updateShift(req.params.id, req.body); return successResponse(res, 200, 'Shift updated.', { shift }); } catch (e) { next(e); } };
exports.deleteShift = async (req, res, next) => { try { await svc.deleteShift(req.params.id); return successResponse(res, 200, 'Shift deleted.'); } catch (e) { next(e); } };
exports.getStaffRequests = async (req, res, next) => { try { return successResponse(res, 200, 'Requests.', await svc.getStaffRequests(req.user._id, req.query)); } catch (e) { next(e); } };
exports.updateStaffRequest = async (req, res, next) => { try { const request = await svc.updateStaffRequest(req.params.id, req.body.status); return successResponse(res, 200, 'Request updated.', { request }); } catch (e) { next(e); } };

// Sales Closing
exports.getSalesClosing = async (req, res, next) => { try { return successResponse(res, 200, 'Sales entries.', await svc.getSalesClosing(req.user._id, req.query)); } catch (e) { next(e); } };
exports.submitSalesEntry = async (req, res, next) => { try { const entry = await svc.submitSalesEntry(req.user._id, req.body); return successResponse(res, 200, 'Sales entry saved.', { entry }); } catch (e) { next(e); } };
exports.getMissingSalesDates = async (req, res, next) => { try { const missing = await svc.getMissingSalesDates(req.user._id); return successResponse(res, 200, 'Missing dates.', { missing }); } catch (e) { next(e); } };

// Reports
exports.getReports = async (req, res, next) => { try { return successResponse(res, 200, 'Reports.', await svc.getReports(req.user._id, req.query)); } catch (e) { next(e); } };

// Settings
exports.getSettings = async (req, res, next) => { try { return successResponse(res, 200, 'Settings.', await svc.getSettings(req.user._id)); } catch (e) { next(e); } };
exports.updateSettings = async (req, res, next) => { try { const restaurant = await svc.updateSettings(req.user._id, req.body); return successResponse(res, 200, 'Settings saved.', { restaurant }); } catch (e) { next(e); } };
exports.getLocations = async (req, res, next) => { try { return successResponse(res, 200, 'Locations.', { locations: await svc.getLocations(req.user._id) }); } catch (e) { next(e); } };
exports.addLocation = async (req, res, next) => { try { const loc = await svc.addLocation(req.user._id, req.body); return successResponse(res, 201, 'Location added.', { loc }); } catch (e) { next(e); } };
exports.updateLocation = async (req, res, next) => { try { const loc = await svc.updateLocation(req.user._id, req.params.id, req.body); return successResponse(res, 200, 'Location updated.', { loc }); } catch (e) { next(e); } };
exports.deleteLocation = async (req, res, next) => { try { await svc.deleteLocation(req.user._id, req.params.id); return successResponse(res, 200, 'Location deleted.'); } catch (e) { next(e); } };
exports.updateNotificationPrefs = async (req, res, next) => { try { const Restaurant = require('../restaurant/restaurant.model'); await Restaurant.findOneAndUpdate({ owner: req.user._id }, { notificationPreferences: req.body }); return successResponse(res, 200, 'Notification preferences saved.'); } catch (e) { next(e); } };