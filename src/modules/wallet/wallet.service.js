const User = require('../auth/auth.model');
const WalletTransaction = require('./wallet.model');
const Voucher = require('../payment/voucher.model');
const paginate = require('../../utils/paginate');
const crypto = require('crypto');

const getWallet = async (userId) => {
  const user = await User.findById(userId).select('walletBalance rewardPoints membershipTier firstName');
  if (!user) { const err = new Error('User not found.'); err.statusCode = 404; throw err; }
  return { balance: user.walletBalance, rewardPoints: user.rewardPoints, membershipTier: user.membershipTier };
};

const topUpWallet = async (userId, amount, paymentMethod) => {
  if (amount <= 0) { const err = new Error('Amount must be greater than 0.'); err.statusCode = 400; throw err; }
  const user = await User.findById(userId);
  const balanceBefore = user.walletBalance;
  const balanceAfter = balanceBefore + amount;
  await User.findByIdAndUpdate(userId, { walletBalance: balanceAfter });
  const txn = await WalletTransaction.create({
    user: userId, type: 'top_up', amount, balanceBefore, balanceAfter,
    description: `Wallet top up via ${paymentMethod}`,
    transactionId: 'TXN-' + crypto.randomBytes(6).toString('hex').toUpperCase(),
    status: 'completed',
  });
  return { balance: balanceAfter, transaction: txn };
};

const withdrawFromWallet = async (userId, amount) => {
  const user = await User.findById(userId);
  if (user.walletBalance < amount) {
    const err = new Error('Insufficient wallet balance.'); err.statusCode = 400; throw err;
  }
  const balanceBefore = user.walletBalance;
  const balanceAfter = balanceBefore - amount;
  await User.findByIdAndUpdate(userId, { walletBalance: balanceAfter });
  const txn = await WalletTransaction.create({
    user: userId, type: 'withdrawal', amount: -amount, balanceBefore, balanceAfter,
    description: 'Wallet withdrawal',
    transactionId: 'TXN-' + crypto.randomBytes(6).toString('hex').toUpperCase(),
    status: 'completed',
  });
  return { balance: balanceAfter, transaction: txn };
};

const getTransactionHistory = async (userId, query) => {
  return await paginate(WalletTransaction, { user: userId }, {
    page: query.page, limit: query.limit, sort: { createdAt: -1 },
  });
};

const getSavedCards = async (userId) => {
  // In production: fetch from Stripe customer's payment methods
  // Returning mock structure aligned with design
  const user = await User.findById(userId).select('savedCards');
  return user.savedCards || [];
};

const applyVoucher = async (code, orderTotal, orderType) => {
  const voucher = await Voucher.findOne({ code: code.toUpperCase(), isActive: true, expiresAt: { $gt: new Date() } });
  if (!voucher) { const err = new Error('Invalid or expired voucher code.'); err.statusCode = 400; throw err; }
  if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
    const err = new Error('Voucher usage limit reached.'); err.statusCode = 400; throw err;
  }
  if (orderTotal < voucher.minimumPurchase) {
    const err = new Error(`Minimum purchase of $${voucher.minimumPurchase} required.`); err.statusCode = 400; throw err;
  }
  if (voucher.applicableTo !== 'all' && voucher.applicableTo !== orderType) {
    const err = new Error(`This voucher is only valid for ${voucher.applicableTo} orders.`); err.statusCode = 400; throw err;
  }
  let discount = 0;
  if (voucher.discountType === 'percentage') discount = (orderTotal * voucher.discountValue) / 100;
  else if (voucher.discountType === 'fixed') discount = voucher.discountValue;
  else if (voucher.discountType === 'free_shipping') discount = 5.99;
  if (voucher.maximumDiscount) discount = Math.min(discount, voucher.maximumDiscount);
  return { voucher, discount: parseFloat(discount.toFixed(2)) };
};

module.exports = { getWallet, topUpWallet, withdrawFromWallet, getTransactionHistory, getSavedCards, applyVoucher };