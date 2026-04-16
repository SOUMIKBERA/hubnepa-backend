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
  const { itemType, productId, restaurantId, menuItemId, quantity = 1 } = itemData;
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });

  let name, image, price;

  if (itemType === 'product') {
    const product = await Product.findOne({ _id: productId, status: 'approved', stockStatus: { $ne: 'Out of Stock' } });
    if (!product) { const err = new Error('Product not available.'); err.statusCode = 404; throw err; }
    name = product.name;
    image = product.images?.[0] || null;
    price = product.discountPrice || product.basePrice;
  } else {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) { const err = new Error('Restaurant not found.'); err.statusCode = 404; throw err; }
    // Prevent mixing restaurants in cart
    if (cart.restaurantId && cart.restaurantId.toString() !== restaurantId) {
      const err = new Error('Cannot add items from different restaurants. Clear your cart first.');
      err.statusCode = 400; throw err;
    }
    const menuItem = restaurant.menu.id(menuItemId);
    if (!menuItem || !menuItem.isAvailable) { const err = new Error('Menu item not available.'); err.statusCode = 404; throw err; }
    name = menuItem.name;
    image = menuItem.image;
    price = menuItem.discountPrice || menuItem.price;
    cart.restaurantId = restaurantId;
  }

  const existingIdx = cart.items.findIndex(i =>
    itemType === 'product' ? i.product?.toString() === productId : i.menuItemId?.toString() === menuItemId
  );

  if (existingIdx > -1) {
    cart.items[existingIdx].quantity += quantity;
    cart.items[existingIdx].subtotal = cart.items[existingIdx].quantity * price;
  } else {
    cart.items.push({ itemType, product: productId || null, restaurant: restaurantId || null, menuItemId: menuItemId || null, name, image, price, quantity, subtotal: quantity * price });
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