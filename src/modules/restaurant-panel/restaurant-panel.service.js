const mongoose = require('mongoose');
const Restaurant = require('../restaurant/restaurant.model');
const Order = require('../order/order.model');
const Notification = require('../notification/notification.model');
const {
  RestaurantStaff, RestaurantShift, StaffRequest, Payroll,
  RestaurantExpense, MaintenanceIssue, SalesClosing,
  InventoryItem, BeverageInventory, Recipe, RestaurantLocation,
} = require('./restaurant-panel.model');
const paginate = require('../../utils/paginate');

// ─── Helpers ──────
const getRestaurant = async (ownerId) => {
  const r = await Restaurant.findOne({ owner: ownerId });
  if (!r) { const e = new Error('Restaurant not found. Please complete your profile first.'); e.statusCode = 404; throw e; }
  return r;
};

// ─── Dashboard ──────
const getDashboard = async (ownerId) => {
  const restaurant = await getRestaurant(ownerId);
  const rid = mongoose.Types.ObjectId(restaurant._id);
  const today = new Date(); today.setHours(0,0,0,0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [totalOrders, monthRevenue, pendingOrders, recentOrders, popularItems, staffCount, expenseStats] = await Promise.all([
    Order.countDocuments({ restaurant: rid }),
    Order.aggregate([{ $match: { restaurant: rid, createdAt: { $gte: monthStart }, status: 'delivered' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.countDocuments({ restaurant: rid, status: { $in: ['pending', 'confirmed', 'preparing'] } }),
    Order.find({ restaurant: rid }).sort({ createdAt: -1 }).limit(5).populate('customer', 'firstName lastName'),
    Order.aggregate([{ $match: { restaurant: rid } }, { $unwind: '$items' }, { $group: { _id: '$items.name', orders: { $sum: '$items.quantity' }, revenue: { $sum: '$items.subtotal' } } }, { $sort: { orders: -1 } }, { $limit: 5 }]),
    RestaurantStaff.countDocuments({ restaurant: restaurant._id }),
    RestaurantExpense.aggregate([{ $match: { restaurant: restaurant._id, createdAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount' }, salary: { $sum: { $cond: [{ $eq: ['$category', 'Staff Salary'] }, '$amount', 0] } } } }]),
  ]);

  return {
    totalOrders, monthRevenue: monthRevenue[0]?.total || 0, pendingOrders,
    recentOrders, popularItems, staffCount,
    expenses: expenseStats[0] || { total: 0, salary: 0 },
    rating: restaurant.rating, restaurantStatus: restaurant.status, isOpen: restaurant.isOpen,
  };
};

// ─── Orders ──────
const getOrders = async (ownerId, query) => {
  const restaurant = await getRestaurant(ownerId);
  const filter = { restaurant: restaurant._id };
  if (query.status) filter.status = query.status;
  if (query.type) filter.orderType = query.type;
  if (query.search) filter.orderId = new RegExp(query.search, 'i');
  if (query.dateFrom) filter.createdAt = { $gte: new Date(query.dateFrom) };
  return paginate(Order, filter, { page: query.page, limit: query.limit, sort: { createdAt: -1 }, populate: { path: 'customer', select: 'firstName lastName phone' } });
};

const getLiveOrders = async (ownerId) => {
  const restaurant = await getRestaurant(ownerId);
  return Order.find({ restaurant: restaurant._id, status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] } }).sort({ createdAt: 1 }).populate('customer', 'firstName lastName phone');
};

const updateOrderStatus = async (ownerId, orderId, status, note) => {
  const restaurant = await getRestaurant(ownerId);
  const validStatuses = ['confirmed', 'preparing', 'ready', 'cancelled'];
  if (!validStatuses.includes(status)) { const e = new Error('Invalid status.'); e.statusCode = 400; throw e; }
  const order = await Order.findOneAndUpdate(
    { _id: orderId, restaurant: restaurant._id },
    { status, $push: { statusHistory: { status, note, timestamp: new Date() } } },
    { new: true }
  );
  if (!order) { const e = new Error('Order not found.'); e.statusCode = 404; throw e; }
  await Notification.create({ user: order.customer, title: 'Order Update', message: `Your order #${order.orderId} is now ${status}.`, type: 'order_update' });
  return order;
};

const acceptAllPending = async (ownerId) => {
  const restaurant = await getRestaurant(ownerId);
  await Order.updateMany({ restaurant: restaurant._id, status: 'pending' }, { status: 'confirmed', $push: { statusHistory: { status: 'confirmed' } } });
};

const getOrderHistory = async (ownerId, query) => {
  const restaurant = await getRestaurant(ownerId);
  const filter = { restaurant: restaurant._id, status: { $in: ['delivered', 'cancelled'] } };
  if (query.search) filter.orderId = new RegExp(query.search, 'i');
  return paginate(Order, filter, { page: query.page, limit: query.limit, sort: { createdAt: -1 }, populate: { path: 'customer', select: 'firstName lastName' } });
};

// ─── Menu ──────
const getMenu = async (ownerId, query) => {
  const restaurant = await getRestaurant(ownerId);
  let menu = restaurant.menu;
  if (query.category) menu = menu.filter(i => i.category === query.category);
  if (query.search) menu = menu.filter(i => i.name.toLowerCase().includes(query.search.toLowerCase()));
  if (query.status === 'available') menu = menu.filter(i => i.isAvailable);
  if (query.status === 'sold_out') menu = menu.filter(i => !i.isAvailable);
  const grouped = menu.reduce((acc, item) => { if (!acc[item.category]) acc[item.category] = []; acc[item.category].push(item); return acc; }, {});
  return { menu, grouped, total: menu.length };
};

const addMenuItem = async (ownerId, data) => {
  const restaurant = await getRestaurant(ownerId);
  restaurant.menu.push(data);
  await restaurant.save();
  return restaurant.menu[restaurant.menu.length - 1];
};

const updateMenuItem = async (ownerId, itemId, data) => {
  const restaurant = await getRestaurant(ownerId);
  const item = restaurant.menu.id(itemId);
  if (!item) { const e = new Error('Menu item not found.'); e.statusCode = 404; throw e; }
  Object.assign(item, data);
  await restaurant.save();
  return item;
};

const deleteMenuItem = async (ownerId, itemId) => {
  const restaurant = await getRestaurant(ownerId);
  const item = restaurant.menu.id(itemId);
  if (item) { item.deleteOne(); await restaurant.save(); }
};

const toggleAvailability = async (ownerId, itemId, isAvailable) => {
  const restaurant = await getRestaurant(ownerId);
  const item = restaurant.menu.id(itemId);
  if (!item) { const e = new Error('Menu item not found.'); e.statusCode = 404; throw e; }
  item.isAvailable = isAvailable;
  await restaurant.save();
  return item;
};

// ─── Inventory ─────
const getInventory = async (ownerId, query) => {
  const restaurant = await getRestaurant(ownerId);
  const filter = { restaurant: restaurant._id };
  if (query.type) filter.itemType = query.type;
  if (query.status) filter.status = query.status;
  if (query.search) filter.itemName = new RegExp(query.search, 'i');
  const result = await paginate(InventoryItem, filter, { page: query.page, limit: query.limit });
  const stats = await InventoryItem.aggregate([{ $match: { restaurant: restaurant._id } }, { $group: { _id: null, totalValue: { $sum: { $multiply: ['$currentStock', '$costPerUnit'] } }, lowStock: { $sum: { $cond: [{ $in: ['$status', ['Low', 'Critical', 'Out of Stock']] }, 1, 0] } }, total: { $sum: 1 } } }]);
  return { ...result, stats: stats[0] || {} };
};

const addInventoryItem = async (ownerId, data) => {
  const restaurant = await getRestaurant(ownerId);
  return InventoryItem.create({ ...data, restaurant: restaurant._id });
};

const updateInventoryItem = async (ownerId, itemId, data) => {
  const restaurant = await getRestaurant(ownerId);
  const item = await InventoryItem.findOneAndUpdate({ _id: itemId, restaurant: restaurant._id }, data, { new: true, runValidators: true });
  if (!item) { const e = new Error('Item not found.'); e.statusCode = 404; throw e; }
  return item;
};

const adjustInventoryStock = async (ownerId, itemId, adjustmentType, quantity, reason) => {
  const restaurant = await getRestaurant(ownerId);
  const item = await InventoryItem.findOne({ _id: itemId, restaurant: restaurant._id });
  if (!item) { const e = new Error('Item not found.'); e.statusCode = 404; throw e; }
  if (adjustmentType === 'Add Stock') item.currentStock += Number(quantity);
  else if (adjustmentType === 'Remove Stock') item.currentStock = Math.max(0, item.currentStock - Number(quantity));
  else if (adjustmentType === 'Correction') item.currentStock = Number(quantity);
  if (reason) item.notes = reason;
  await item.save();
  return item;
};

const deleteInventoryItem = async (ownerId, itemId) => {
  const restaurant = await getRestaurant(ownerId);
  await InventoryItem.findOneAndDelete({ _id: itemId, restaurant: restaurant._id });
};

// Beverages
const getBeverages = async (ownerId, query) => {
  const restaurant = await getRestaurant(ownerId);
  return paginate(BeverageInventory, { restaurant: restaurant._id }, { page: query.page, limit: query.limit });
};

const addBeverage = async (ownerId, data) => {
  const restaurant = await getRestaurant(ownerId);
  return BeverageInventory.create({ ...data, restaurant: restaurant._id });
};

const adjustBeverageStock = async (ownerId, bevId, adjustmentType, quantity) => {
  const restaurant = await getRestaurant(ownerId);
  const bev = await BeverageInventory.findOne({ _id: bevId, restaurant: restaurant._id });
  if (!bev) { const e = new Error('Beverage not found.'); e.statusCode = 404; throw e; }
  if (adjustmentType === 'Add Stock') bev.currentStock += Number(quantity);
  else bev.currentStock = Math.max(0, bev.currentStock - Number(quantity));
  bev.status = bev.currentStock === 0 ? 'Out of Stock' : bev.currentStock <= bev.minThreshold ? 'Low' : 'In Stock';
  await bev.save();
  return bev;
};

const deleteBeverage = async (ownerId, bevId) => {
  const restaurant = await getRestaurant(ownerId);
  await BeverageInventory.findOneAndDelete({ _id: bevId, restaurant: restaurant._id });
};

// Recipes
const getRecipes = async (ownerId, query) => {
  const restaurant = await getRestaurant(ownerId);
  return paginate(Recipe, { restaurant: restaurant._id }, { page: query.page, limit: query.limit });
};

const createRecipe = async (ownerId, data) => {
  const restaurant = await getRestaurant(ownerId);
  const recipe = { ...data, restaurant: restaurant._id };
  if (recipe.ingredients?.length) recipe.totalIngredientCost = recipe.ingredients.reduce((s, i) => s + (i.finalCost || 0), 0);
  recipe.totalLaborCost = (recipe.chefHourlyRate || 0) * ((recipe.prepTimeMinutes || 0) / 60);
  recipe.totalCost = (recipe.totalIngredientCost || 0) + recipe.totalLaborCost + (recipe.laborCost || 0);
  recipe.profitMargin = recipe.sellingPrice ? ((recipe.sellingPrice - recipe.totalCost) / recipe.sellingPrice * 100).toFixed(1) : 0;
  recipe.suggestedPrice = +(recipe.totalCost * 3.5).toFixed(2);
  return Recipe.create(recipe);
};

const updateRecipe = async (ownerId, recipeId, data) => {
  const restaurant = await getRestaurant(ownerId);
  return Recipe.findOneAndUpdate({ _id: recipeId, restaurant: restaurant._id }, data, { new: true });
};

const deleteRecipe = async (ownerId, recipeId) => {
  const restaurant = await getRestaurant(ownerId);
  await Recipe.findOneAndDelete({ _id: recipeId, restaurant: restaurant._id });
};

// ─── Expenses ────
const getExpenses = async (ownerId, query) => {
  const restaurant = await getRestaurant(ownerId);
  const filter = { restaurant: restaurant._id };
  if (query.category) filter.category = query.category;
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  const result = await paginate(RestaurantExpense, filter, { page: query.page, limit: query.limit, sort: { date: -1 } });
  const summary = await RestaurantExpense.aggregate([{ $match: { restaurant: restaurant._id } }, { $group: { _id: '$category', total: { $sum: '$amount' } } }, { $sort: { total: -1 } }]);
  const totals = await RestaurantExpense.aggregate([{ $match: { restaurant: restaurant._id } }, { $group: { _id: null, total: { $sum: '$amount' }, salary: { $sum: { $cond: [{ $eq: ['$category', 'Staff Salary'] }, '$amount', 0] } }, maintenance: { $sum: { $cond: [{ $eq: ['$category', 'Maintenance'] }, '$amount', 0] } } } }]);
  return { ...result, summary, totals: totals[0] || {} };
};

const createExpense = async (ownerId, data) => {
  const restaurant = await getRestaurant(ownerId);
  return RestaurantExpense.create({ ...data, restaurant: restaurant._id, createdBy: ownerId });
};

const updateExpense = async (ownerId, expenseId, data) => {
  const restaurant = await getRestaurant(ownerId);
  const e = await RestaurantExpense.findOneAndUpdate({ _id: expenseId, restaurant: restaurant._id }, data, { new: true });
  if (!e) { const err = new Error('Expense not found.'); err.statusCode = 404; throw err; }
  return e;
};

const deleteExpense = async (ownerId, expenseId) => {
  const restaurant = await getRestaurant(ownerId);
  await RestaurantExpense.findOneAndDelete({ _id: expenseId, restaurant: restaurant._id });
};

// Maintenance
const getMaintenanceIssues = async (ownerId, query) => {
  const restaurant = await getRestaurant(ownerId);
  return paginate(MaintenanceIssue, { restaurant: restaurant._id }, { page: query.page, limit: query.limit, sort: { createdAt: -1 } });
};

const createMaintenanceIssue = async (ownerId, data) => {
  const restaurant = await getRestaurant(ownerId);
  return MaintenanceIssue.create({ ...data, restaurant: restaurant._id });
};

const updateMaintenanceIssue = async (ownerId, issueId, data) => {
  const restaurant = await getRestaurant(ownerId);
  return MaintenanceIssue.findOneAndUpdate({ _id: issueId, restaurant: restaurant._id }, data, { new: true });
};

// Payroll
const getPayroll = async (ownerId, query) => {
  const restaurant = await getRestaurant(ownerId);
  const result = await paginate(Payroll, { restaurant: restaurant._id }, { page: query.page, limit: query.limit, populate: { path: 'staff', select: 'fullName role' } });
  const summary = await Payroll.aggregate([{ $match: { restaurant: restaurant._id } }, { $group: { _id: null, total: { $sum: '$totalPay' }, paid: { $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, '$totalPay', 0] } }, pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, '$totalPay', 0] } } } }]);
  return { ...result, summary: summary[0] || {} };
};

const runPayroll = async (ownerId, data) => {
  const restaurant = await getRestaurant(ownerId);
  const staffList = await RestaurantStaff.find({ restaurant: restaurant._id, status: 'Active' });
  const month = data.month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const payrolls = await Promise.all(staffList.map(s =>
    Payroll.create({ restaurant: restaurant._id, staff: s._id, month, hoursWorked: data.hoursWorked || 80, hourlyRate: s.hourlyRate, baseSalary: s.salary, totalPay: s.salary || (s.hourlyRate * (data.hoursWorked || 80)), status: 'Pending' })
  ));
  return payrolls;
};

const updatePayroll = async (ownerId, payrollId, data) => {
  const restaurant = await getRestaurant(ownerId);
  return Payroll.findOneAndUpdate({ _id: payrollId, restaurant: restaurant._id }, data, { new: true });
};

// ─── Staff ──────
const getStaff = async (ownerId, query) => {
  const restaurant = await getRestaurant(ownerId);
  const filter = { restaurant: restaurant._id };
  if (query.status) filter.status = query.status;
  if (query.search) filter.fullName = new RegExp(query.search, 'i');
  return paginate(RestaurantStaff, filter, { page: query.page, limit: query.limit });
};

const createStaff = async (ownerId, data) => {
  const restaurant = await getRestaurant(ownerId);
  const loginCode = Math.floor(1000 + Math.random() * 9000).toString();
  return RestaurantStaff.create({ ...data, restaurant: restaurant._id, loginCode });
};

const getStaffById = async (ownerId, staffId) => {
  const restaurant = await getRestaurant(ownerId);
  const staff = await RestaurantStaff.findOne({ _id: staffId, restaurant: restaurant._id });
  if (!staff) { const e = new Error('Staff not found.'); e.statusCode = 404; throw e; }
  const [shifts, payrollHistory, requests] = await Promise.all([
    RestaurantShift.find({ staff: staff._id }).sort({ date: -1 }).limit(10),
    Payroll.find({ staff: staff._id }).sort({ createdAt: -1 }).limit(5),
    StaffRequest.find({ staff: staff._id }).sort({ createdAt: -1 }).limit(5),
  ]);
  return { staff, shifts, payrollHistory, requests };
};

const updateStaff = async (ownerId, staffId, data) => {
  const restaurant = await getRestaurant(ownerId);
  const s = await RestaurantStaff.findOneAndUpdate({ _id: staffId, restaurant: restaurant._id }, data, { new: true, runValidators: true });
  if (!s) { const e = new Error('Staff not found.'); e.statusCode = 404; throw e; }
  return s;
};

const updateStaffPermissions = async (ownerId, staffId, accessRoles) => {
  const restaurant = await getRestaurant(ownerId);
  return RestaurantStaff.findOneAndUpdate({ _id: staffId, restaurant: restaurant._id }, { accessRoles }, { new: true });
};

const terminateStaff = async (ownerId, staffId, reason) => {
  const restaurant = await getRestaurant(ownerId);
  await RestaurantStaff.findOneAndUpdate({ _id: staffId, restaurant: restaurant._id }, { status: 'Terminated', terminationReason: reason });
};

// Shifts
const getSchedule = async (ownerId, query) => {
  const restaurant = await getRestaurant(ownerId);
  const weekStart = query.weekStart ? new Date(query.weekStart) : new Date();
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
  return RestaurantShift.find({ restaurant: restaurant._id, date: { $gte: weekStart, $lte: weekEnd } }).populate('staff', 'fullName role');
};

const createShift = async (ownerId, data) => {
  const restaurant = await getRestaurant(ownerId);
  return RestaurantShift.create({ ...data, restaurant: restaurant._id });
};

const updateShift = async (shiftId, data) => RestaurantShift.findByIdAndUpdate(shiftId, data, { new: true });
const deleteShift = async (shiftId) => RestaurantShift.findByIdAndDelete(shiftId);

// Staff Requests
const getStaffRequests = async (ownerId, query) => {
  const restaurant = await getRestaurant(ownerId);
  return paginate(StaffRequest, { restaurant: restaurant._id }, { page: query.page, limit: query.limit, populate: { path: 'staff', select: 'fullName role' } });
};

const updateStaffRequest = async (requestId, status) => StaffRequest.findByIdAndUpdate(requestId, { status }, { new: true });

// ─── Sales Closing ───
const getSalesClosing = async (ownerId, query) => {
  const restaurant = await getRestaurant(ownerId);
  const filter = { restaurant: restaurant._id };
  if (query.dateFrom) filter.date = { $gte: new Date(query.dateFrom) };
  if (query.dateTo) filter.date = { ...filter.date, $lte: new Date(query.dateTo) };
  return paginate(SalesClosing, filter, { page: query.page, limit: query.limit, sort: { date: -1 } });
};

const submitSalesEntry = async (ownerId, data) => {
  const restaurant = await getRestaurant(ownerId);
  const dateOnly = new Date(data.date); dateOnly.setHours(0,0,0,0);
  const existing = await SalesClosing.findOne({ restaurant: restaurant._id, date: { $gte: dateOnly, $lt: new Date(dateOnly.getTime() + 86400000) } });
  if (existing) { Object.assign(existing, data); existing.status = 'Verified'; await existing.save(); return existing; }
  return SalesClosing.create({ ...data, restaurant: restaurant._id, submittedBy: ownerId, status: 'Verified' });
};

const getMissingSalesDates = async (ownerId) => {
  const restaurant = await getRestaurant(ownerId);
  const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0); return d; });
  const existing = await SalesClosing.find({ restaurant: restaurant._id, date: { $in: last7 } }).select('date');
  const existingDates = existing.map(e => e.date.toDateString());
  return last7.filter(d => !existingDates.includes(d.toDateString()));
};

// ─── Reports ─────
const getReports = async (ownerId, query) => {
  const restaurant = await getRestaurant(ownerId);
  const rid = mongoose.Types.ObjectId(restaurant._id);
  const days = parseInt(query.days) || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [dailyRevenue, popularItems, salesMix, peakHours, expenseBreakdown, salesTrend] = await Promise.all([
    Order.aggregate([{ $match: { restaurant: rid, createdAt: { $gte: since }, status: 'delivered' } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }, { $sort: { '_id': 1 } }]),
    Order.aggregate([{ $match: { restaurant: rid } }, { $unwind: '$items' }, { $group: { _id: '$items.name', units: { $sum: '$items.quantity' }, revenue: { $sum: '$items.subtotal' } } }, { $sort: { revenue: -1 } }, { $limit: 5 }]),
    Order.aggregate([{ $match: { restaurant: rid } }, { $unwind: '$items' }, { $group: { _id: '$items.category', revenue: { $sum: '$items.subtotal' } } }]),
    Order.aggregate([{ $match: { restaurant: rid, createdAt: { $gte: since } } }, { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]),
    RestaurantExpense.aggregate([{ $match: { restaurant: restaurant._id } }, { $group: { _id: '$category', total: { $sum: '$amount' }, entries: { $sum: 1 } } }, { $sort: { total: -1 } }]),
    SalesClosing.find({ restaurant: restaurant._id }).sort({ date: -1 }).limit(7),
  ]);
  return { dailyRevenue, popularItems, salesMix, peakHours, expenseBreakdown, salesTrend };
};

// ─── Settings ──────
const getSettings = async (ownerId) => {
  const [restaurant, locations] = await Promise.all([getRestaurant(ownerId), RestaurantLocation.find({ restaurant: (await getRestaurant(ownerId))._id })]);
  return { restaurant, locations };
};

const updateSettings = async (ownerId, data) => {
  const allowed = ['name', 'description', 'logo', 'banner', 'phone', 'email', 'cuisine', 'openingHours', 'deliveryFee', 'minimumOrder', 'deliveryTime', 'isOpen', 'notificationPreferences'];
  const update = {};
  allowed.forEach(k => { if (data[k] !== undefined) update[k] = data[k]; });
  return Restaurant.findOneAndUpdate({ owner: ownerId }, update, { new: true });
};

const getLocations = async (ownerId) => {
  const restaurant = await getRestaurant(ownerId);
  return RestaurantLocation.find({ restaurant: restaurant._id });
};

const addLocation = async (ownerId, data) => {
  const restaurant = await getRestaurant(ownerId);
  return RestaurantLocation.create({ ...data, restaurant: restaurant._id });
};

const updateLocation = async (ownerId, locId, data) => {
  const restaurant = await getRestaurant(ownerId);
  return RestaurantLocation.findOneAndUpdate({ _id: locId, restaurant: restaurant._id }, data, { new: true });
};

const deleteLocation = async (ownerId, locId) => {
  const restaurant = await getRestaurant(ownerId);
  await RestaurantLocation.findOneAndDelete({ _id: locId, restaurant: restaurant._id });
};

module.exports = { getDashboard, getOrders, getLiveOrders, updateOrderStatus, acceptAllPending, getOrderHistory, getMenu, addMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability, getInventory, addInventoryItem, updateInventoryItem, adjustInventoryStock, deleteInventoryItem, getBeverages, addBeverage, adjustBeverageStock, deleteBeverage, getRecipes, createRecipe, updateRecipe, deleteRecipe, getExpenses, createExpense, updateExpense, deleteExpense, getMaintenanceIssues, createMaintenanceIssue, updateMaintenanceIssue, getPayroll, runPayroll, updatePayroll, getStaff, createStaff, getStaffById, updateStaff, updateStaffPermissions, terminateStaff, getSchedule, createShift, updateShift, deleteShift, getStaffRequests, updateStaffRequest, getSalesClosing, submitSalesEntry, getMissingSalesDates, getReports, getSettings, updateSettings, getLocations, addLocation, updateLocation, deleteLocation };