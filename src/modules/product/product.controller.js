const productService = require('./product.service');
const { successResponse } = require('../../utils/apiResponse');

const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.user._id, req.body);
    return successResponse(res, 201, 'Product created. Awaiting admin approval.', { product });
  } catch (error) { next(error); }
};

const getProducts = async (req, res, next) => {
  try {
    const result = await productService.getProducts(req.query);
    return successResponse(res, 200, 'Products fetched.', result);
  } catch (error) { next(error); }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    return successResponse(res, 200, 'Product fetched.', { product });
  } catch (error) { next(error); }
};

const getMyProducts = async (req, res, next) => {
  try {
    const result = await productService.getRetailerProducts(req.user._id, req.query);
    return successResponse(res, 200, 'Products fetched.', result);
  } catch (error) { next(error); }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.user._id, req.params.id, req.body);
    return successResponse(res, 200, 'Product updated.', { product });
  } catch (error) { next(error); }
};

const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.user._id, req.params.id);
    return successResponse(res, 200, 'Product deleted.');
  } catch (error) { next(error); }
};

const getRetailerDashboard = async (req, res, next) => {
  try {
    const stats = await productService.getRetailerDashboardStats(req.user._id);
    return successResponse(res, 200, 'Dashboard stats fetched.', stats);
  } catch (error) { next(error); }
};

module.exports = { createProduct, getProducts, getProductById, getMyProducts, updateProduct, deleteProduct, getRetailerDashboard };