const Wishlist = require('./wishlist.model');

const getWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId })
    .populate({ path: 'items.product', select: 'name price images stockStatus rating slug' })
    .populate({ path: 'items.restaurant', select: 'name cuisine logo rating deliveryTime' });
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, items: [] });
  return wishlist;
};

const addItem = async (userId, itemType, itemId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, items: [] });

  const field = itemType === 'product' ? 'product' : 'restaurant';
  const alreadyExists = wishlist.items.some(
    (i) => i.itemType === itemType && i[field]?.toString() === itemId
  );
  if (alreadyExists) { const e = new Error('Item already in wishlist.'); e.statusCode = 409; throw e; }

  wishlist.items.push({ itemType, [field]: itemId, addedAt: new Date() });
  await wishlist.save();
  return getWishlist(userId);
};

const removeItem = async (userId, itemId) => {
  const wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) { const e = new Error('Wishlist not found.'); e.statusCode = 404; throw e; }
  wishlist.items = wishlist.items.filter((i) => i._id.toString() !== itemId);
  await wishlist.save();
  return wishlist;
};

const clearWishlist = async (userId) => {
  await Wishlist.findOneAndUpdate({ user: userId }, { items: [] });
};

module.exports = { getWishlist, addItem, removeItem, clearWishlist };