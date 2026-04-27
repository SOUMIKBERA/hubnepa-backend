const Restaurant = require('./restaurant.model');
const paginate = require('../../utils/paginate');

const createRestaurant = async (ownerId, data) => {
  const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
  // Auto-approve on creation so owner can use dashboard immediately
  const restaurant = await Restaurant.create({ ...data, owner: ownerId, slug, status: 'approved' });
  return restaurant;
};

const getAllRestaurants = async (query) => {
  const filter = { status: 'approved' };
  if (query.cuisine) filter.cuisine = { $in: query.cuisine.split(',') };
  if (query.isOpen !== undefined) filter.isOpen = query.isOpen === 'true';
  if (query.isExclusivePartner) filter.isExclusivePartner = true;
  if (query.tag) filter.tags = query.tag;
  if (query.search) filter.$text = { $search: query.search };

  let sort = { createdAt: -1 };
  if (query.sort === 'rating') sort = { 'rating.average': -1 };
  if (query.sort === 'deliveryTime') sort = { 'deliveryTime.min': 1 };
  if (query.sort === 'deliveryFee') sort = { deliveryFee: 1 };

  return await paginate(Restaurant, filter, {
    page: query.page, limit: query.limit, sort,
    select: '-menu -totalRevenue',
    populate: '',
  });
};

const getRestaurantById = async (id) => {
  const restaurant = await Restaurant.findOne({ _id: id, status: 'approved' });
  if (!restaurant) {
    const err = new Error('Restaurant not found.');
    err.statusCode = 404; throw err;
  }
  return restaurant;
};

const getRestaurantByOwner = async (ownerId) => {
  const restaurant = await Restaurant.findOne({ owner: ownerId });
  if (!restaurant) {
    const err = new Error('No restaurant found for this account.');
    err.statusCode = 404; throw err;
  }
  return restaurant;
};

const updateRestaurant = async (ownerId, data) => {
  const restaurant = await Restaurant.findOneAndUpdate(
    { owner: ownerId }, data, { new: true, runValidators: true }
  );
  if (!restaurant) { const err = new Error('Restaurant not found.'); err.statusCode = 404; throw err; }
  return restaurant;
};

// Menu Management
const addMenuItem = async (ownerId, itemData) => {
  const restaurant = await Restaurant.findOne({ owner: ownerId });
  if (!restaurant) { const err = new Error('Restaurant not found.'); err.statusCode = 404; throw err; }
  restaurant.menu.push(itemData);
  await restaurant.save();
  return restaurant.menu[restaurant.menu.length - 1];
};

const updateMenuItem = async (ownerId, itemId, itemData) => {
  const restaurant = await Restaurant.findOne({ owner: ownerId });
  if (!restaurant) { const err = new Error('Restaurant not found.'); err.statusCode = 404; throw err; }
  const item = restaurant.menu.id(itemId);
  if (!item) { const err = new Error('Menu item not found.'); err.statusCode = 404; throw err; }
  Object.assign(item, itemData);
  await restaurant.save();
  return item;
};

const deleteMenuItem = async (ownerId, itemId) => {
  const restaurant = await Restaurant.findOne({ owner: ownerId });
  if (!restaurant) { const err = new Error('Restaurant not found.'); err.statusCode = 404; throw err; }
  const item = restaurant.menu.id(itemId);
  if (!item) { const err = new Error('Menu item not found.'); err.statusCode = 404; throw err; }
  item.deleteOne();
  await restaurant.save();
  return true;
};

const getMenuByCategory = async (restaurantId) => {
  const restaurant = await Restaurant.findOne({ _id: restaurantId, status: 'approved' })
    .select('menu name logo rating deliveryTime deliveryFee minimumOrder isOpen');
  if (!restaurant) { const err = new Error('Restaurant not found.'); err.statusCode = 404; throw err; }
  const grouped = restaurant.menu.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
  return { restaurant, menu: grouped };
};

const getRestaurantDashboard = async (ownerId) => {
  const Restaurant = require('./restaurant.model');
  const Order = require('../order/order.model');
  const restaurant = await Restaurant.findOne({ owner: ownerId }).select('name totalRevenue totalOrders rating');
  if (!restaurant) { const err = new Error('Restaurant not found.'); err.statusCode = 404; throw err; }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [pendingOrders, todayRevenue] = await Promise.all([
    Order.countDocuments({ restaurant: restaurant._id, status: { $in: ['pending', 'confirmed', 'preparing'] } }),
    Order.aggregate([
      { $match: { restaurant: restaurant._id, createdAt: { $gte: today }, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);
  return {
    restaurant,
    stats: {
      pendingOrders,
      todayRevenue: todayRevenue[0]?.total || 0,
      totalRevenue: restaurant.totalRevenue,
      totalOrders: restaurant.totalOrders,
      rating: restaurant.rating,
    },
  };
};

module.exports = {
  createRestaurant, getAllRestaurants, getRestaurantById,
  getRestaurantByOwner, updateRestaurant,
  addMenuItem, updateMenuItem, deleteMenuItem,
  getMenuByCategory, getRestaurantDashboard,
};
