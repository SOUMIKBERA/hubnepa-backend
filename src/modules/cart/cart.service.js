const Cart = require('./cart.model');
const Product = require('../product/product.model');
const Restaurant = require('../restaurant/restaurant.model');

const getCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId })
    .populate('items.product', 'name images basePrice stockStatus')
    .populate('restaurantId', 'name logo deliveryFee minimumOrder freeDeliveryAbove');
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

const addToCart = async (userId, itemData) => {
  // Accept both legacy field names (productId/restaurantId/menuItemId) AND
  // the generic "itemId" field that clients send.
  // itemType accepted values:
  //   "product"    → itemId is a Product _id
  //   "menuItem" or "restaurant" → itemId is a Restaurant _id; menuItemId is the menu sub-doc id
  const {
    itemType: rawItemType,
    itemId,          // generic field — used when productId/restaurantId not provided
    productId:   _productId,
    restaurantId: _restaurantId,
    menuItemId:  _menuItemId,
    quantity = 1,
  } = itemData;

  // Normalise itemType: treat "restaurant" as "menuItem" for backwards compat
  const itemType = (rawItemType === 'restaurant') ? 'menuItem' : rawItemType;

  // Resolve actual IDs — prefer explicit fields, fall back to generic itemId
  const productId    = _productId    || (itemType === 'product'  ? itemId : null);
  const restaurantId = _restaurantId || (itemType === 'menuItem' ? itemId : null);
  const menuItemId   = _menuItemId   || null;

  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });

  let name, image, price;

  if (itemType === 'product') {
    if (!productId) { const err = new Error('productId is required for product items.'); err.statusCode = 400; throw err; }
    const product = await Product.findOne({ _id: productId, status: 'approved', stockStatus: { $ne: 'Out of Stock' } });
    if (!product) { const err = new Error('Product not available.'); err.statusCode = 404; throw err; }
    name  = product.name;
    image = product.images?.[0] || null;
    price = product.discountPrice || product.basePrice;
  } else {
    // itemType === 'menuItem'
    if (!restaurantId) { const err = new Error('restaurantId (or itemId) is required for restaurant items.'); err.statusCode = 400; throw err; }
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) { const err = new Error('Restaurant not found.'); err.statusCode = 404; throw err; }

    // Prevent mixing restaurants in cart
    if (cart.restaurantId && cart.restaurantId.toString() !== restaurantId.toString()) {
      const err = new Error('Cannot add items from different restaurants. Clear your cart first.');
      err.statusCode = 400; throw err;
    }

    // If menuItemId supplied, find that specific menu item; otherwise add first available
    let menuItem;
    if (menuItemId) {
      menuItem = restaurant.menu.id(menuItemId);
    } else {
      menuItem = restaurant.menu.find(i => i.isAvailable);
    }
    if (!menuItem || !menuItem.isAvailable) { const err = new Error('Menu item not available.'); err.statusCode = 404; throw err; }

    name  = menuItem.name;
    image = menuItem.image;
    price = menuItem.discountPrice || menuItem.price;
    cart.restaurantId = restaurantId;
  }

  const existingIdx = cart.items.findIndex(i =>
    itemType === 'product'
      ? i.product?.toString() === productId?.toString()
      : i.menuItemId?.toString() === (menuItemId?.toString() ?? '') ||
        (i.restaurant?.toString() === restaurantId?.toString() && i.name === name)
  );

  if (existingIdx > -1) {
    cart.items[existingIdx].quantity += quantity;
    cart.items[existingIdx].subtotal  = cart.items[existingIdx].quantity * price;
  } else {
    cart.items.push({
      itemType: itemType === 'menuItem' ? 'menuItem' : 'product',
      product:    productId    || null,
      restaurant: restaurantId || null,
      menuItemId: menuItemId   || null,
      name, image, price, quantity,
      subtotal: quantity * price,
    });
  }

  await cart.save();
  return cart;
};

const updateCartItem = async (userId, itemId, quantity) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) { const err = new Error('Cart not found.'); err.statusCode = 404; throw err; }
  const item = cart.items.id(itemId);
  if (!item) { const err = new Error('Item not found in cart.'); err.statusCode = 404; throw err; }
  if (quantity <= 0) {
    item.deleteOne();
  } else {
    item.quantity = quantity;
    item.subtotal = quantity * item.price;
  }
  await cart.save();
  return cart;
};

const removeFromCart = async (userId, itemId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) { const err = new Error('Cart not found.'); err.statusCode = 404; throw err; }
  const item = cart.items.id(itemId);
  if (!item) { const err = new Error('Item not in cart.'); err.statusCode = 404; throw err; }
  item.deleteOne();
  if (cart.items.length === 0) cart.restaurantId = null;
  await cart.save();
  return cart;
};

const clearCart = async (userId) => {
  await Cart.findOneAndUpdate({ user: userId }, { items: [], restaurantId: null, subtotal: 0, itemCount: 0 });
  return true;
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };