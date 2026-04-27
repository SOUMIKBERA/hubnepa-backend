const restaurantService = require('./restaurant.service');
const { successResponse } = require('../../utils/apiResponse');

const createRestaurant = async (req, res, next) => {
  try {
    const restaurant = await restaurantService.createRestaurant(req.user._id, req.body);
    return successResponse(res, 201, 'Restaurant created successfully.', { restaurant });
  } catch (error) { next(error); }
};

const getAllRestaurants = async (req, res, next) => {
  try {
    const result = await restaurantService.getAllRestaurants(req.query);
    return successResponse(res, 200, 'Restaurants fetched.', result);
  } catch (error) { next(error); }
};

const getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await restaurantService.getRestaurantById(req.params.id);
    return successResponse(res, 200, 'Restaurant fetched.', { restaurant });
  } catch (error) { next(error); }
};

const getMyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await restaurantService.getRestaurantByOwner(req.user._id);
    return successResponse(res, 200, 'Restaurant fetched.', { restaurant });
  } catch (error) { next(error); }
};

const updateMyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await restaurantService.updateRestaurant(req.user._id, req.body);
    return successResponse(res, 200, 'Restaurant updated.', { restaurant });
  } catch (error) { next(error); }
};

const getMenuByCategory = async (req, res, next) => {
  try {
    const result = await restaurantService.getMenuByCategory(req.params.id);
    return successResponse(res, 200, 'Menu fetched.', result);
  } catch (error) { next(error); }
};

const addMenuItem = async (req, res, next) => {
  try {
    const item = await restaurantService.addMenuItem(req.user._id, req.body);
    return successResponse(res, 201, 'Menu item added.', { item });
  } catch (error) { next(error); }
};

const updateMenuItem = async (req, res, next) => {
  try {
    const item = await restaurantService.updateMenuItem(req.user._id, req.params.itemId, req.body);
    return successResponse(res, 200, 'Menu item updated.', { item });
  } catch (error) { next(error); }
};

const deleteMenuItem = async (req, res, next) => {
  try {
    await restaurantService.deleteMenuItem(req.user._id, req.params.itemId);
    return successResponse(res, 200, 'Menu item deleted.');
  } catch (error) { next(error); }
};

const getDashboard = async (req, res, next) => {
  try {
    const result = await restaurantService.getRestaurantDashboard(req.user._id);
    return successResponse(res, 200, 'Dashboard fetched.', result);
  } catch (error) { next(error); }
};

module.exports = {
  createRestaurant, getAllRestaurants, getRestaurantById,
  getMyRestaurant, updateMyRestaurant, getMenuByCategory,
  addMenuItem, updateMenuItem, deleteMenuItem, getDashboard,
};
