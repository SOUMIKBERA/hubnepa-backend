const express = require('express');
const router = express.Router();
const ctrl = require('./restaurant.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

// Public
router.get('/', ctrl.getAllRestaurants);
router.get('/:id', ctrl.getRestaurantById);
router.get('/:id/menu', ctrl.getMenuByCategory);

// Restaurant owner only
router.use(protect);
router.post('/', authorize('restaurant'), ctrl.createRestaurant);
router.get('/my/restaurant', authorize('restaurant'), ctrl.getMyRestaurant);
router.put('/my/restaurant', authorize('restaurant'), ctrl.updateMyRestaurant);
router.get('/my/dashboard', authorize('restaurant'), ctrl.getDashboard);
router.post('/my/menu', authorize('restaurant'), ctrl.addMenuItem);
router.put('/my/menu/:itemId', authorize('restaurant'), ctrl.updateMenuItem);
router.delete('/my/menu/:itemId', authorize('restaurant'), ctrl.deleteMenuItem);

module.exports = router;