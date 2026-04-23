const wishlistService = require('./wishlist.service');
const { successResponse } = require('../../utils/apiResponse');

exports.getWishlist = async (req, res, next) => {
  try {
    const wishlist = await wishlistService.getWishlist(req.user._id);
    return successResponse(res, 200, 'Wishlist fetched.', { wishlist });
  } catch (e) { next(e); }
};

exports.addItem = async (req, res, next) => {
  try {
    const { itemType, itemId } = req.body;
    if (!itemType || !itemId) return res.status(422).json({ success: false, message: 'itemType and itemId are required.' });
    if (!['product', 'restaurant'].includes(itemType)) return res.status(422).json({ success: false, message: 'itemType must be product or restaurant.' });
    const wishlist = await wishlistService.addItem(req.user._id, itemType, itemId);
    return successResponse(res, 200, 'Added to wishlist.', { wishlist });
  } catch (e) { next(e); }
};

exports.removeItem = async (req, res, next) => {
  try {
    const wishlist = await wishlistService.removeItem(req.user._id, req.params.itemId);
    return successResponse(res, 200, 'Removed from wishlist.', { wishlist });
  } catch (e) { next(e); }
};

exports.clearWishlist = async (req, res, next) => {
  try {
    await wishlistService.clearWishlist(req.user._id);
    return successResponse(res, 200, 'Wishlist cleared.');
  } catch (e) { next(e); }
};