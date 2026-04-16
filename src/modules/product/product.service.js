const Product = require('./product.model');
const paginate = require('../../utils/paginate');

const createProduct = async (retailerId, data) => {
  const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
  const product = await Product.create({ ...data, retailer: retailerId, slug });
  return product;
};

const getProducts = async (query) => {
  const filter = { status: 'approved' };
  if (query.category) filter.category = query.category;
  if (query.isNewArrival) filter.isNewArrival = true;
  if (query.isFeatured) filter.isFeatured = true;
  if (query.stockStatus) filter.stockStatus = query.stockStatus;
  if (query.search) filter.$text = { $search: query.search };
  if (query.minPrice || query.maxPrice) {
    filter.basePrice = {};
    if (query.minPrice) filter.basePrice.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.basePrice.$lte = Number(query.maxPrice);
  }

  let sort = { createdAt: -1 };
  if (query.sort === 'price_asc') sort = { basePrice: 1 };
  if (query.sort === 'price_desc') sort = { basePrice: -1 };
  if (query.sort === 'recommended') sort = { 'rating.average': -1, totalSold: -1 };
  if (query.sort === 'new') sort = { createdAt: -1 };

  return await paginate(Product, filter, {
    page: query.page, limit: query.limit, sort,
    populate: { path: 'retailer', select: 'firstName lastName' },
  });
};

const getProductById = async (id) => {
  const product = await Product.findOne({ _id: id, status: 'approved' })
    .populate('retailer', 'firstName lastName');
  if (!product) { const err = new Error('Product not found.'); err.statusCode = 404; throw err; }
  return product;
};

const getRetailerProducts = async (retailerId, query) => {
  const filter = { retailer: retailerId };
  if (query.category) filter.category = query.category;
  if (query.stockStatus) filter.stockStatus = query.stockStatus;
  if (query.search) filter.$text = { $search: query.search };
  return await paginate(Product, filter, { page: query.page, limit: query.limit, sort: { createdAt: -1 } });
};

const updateProduct = async (retailerId, productId, data) => {
  const product = await Product.findOneAndUpdate(
    { _id: productId, retailer: retailerId }, data,
    { new: true, runValidators: true }
  );
  if (!product) { const err = new Error('Product not found.'); err.statusCode = 404; throw err; }
  return product;
};

const deleteProduct = async (retailerId, productId) => {
  const product = await Product.findOneAndDelete({ _id: productId, retailer: retailerId });
  if (!product) { const err = new Error('Product not found.'); err.statusCode = 404; throw err; }
  return true;
};

const getRetailerDashboardStats = async (retailerId) => {
  const Order = require('../order/order.model');
  const [productStats, orderStats, revenueStats] = await Promise.all([
    Product.aggregate([
      { $match: { retailer: require('mongoose').Types.ObjectId(retailerId) } },
      { $group: { _id: null, total: { $sum: 1 }, lowStock: { $sum: { $cond: [{ $eq: ['$stockStatus', 'Low Stock'] }, 1, 0] } } } },
    ]),
    Order.aggregate([
      { $match: { retailer: require('mongoose').Types.ObjectId(retailerId) } },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
    ]),
    Order.aggregate([
      { $match: { retailer: require('mongoose').Types.ObjectId(retailerId), status: 'delivered' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
    ]),
  ]);
  return {
    totalProducts: productStats[0]?.total || 0,
    lowStockProducts: productStats[0]?.lowStock || 0,
    ordersByStatus: orderStats,
    totalRevenue: revenueStats[0]?.totalRevenue || 0,
  };
};

module.exports = {
  createProduct, getProducts, getProductById,
  getRetailerProducts, updateProduct, deleteProduct,
  getRetailerDashboardStats,
};