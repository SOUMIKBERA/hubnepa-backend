const walletService = require('./wallet.service');
const { successResponse } = require('../../utils/apiResponse');

const getWallet = async (req, res, next) => {
  try {
    const wallet = await walletService.getWallet(req.user._id);
    return successResponse(res, 200, 'Wallet fetched.', wallet);
  } catch (error) { next(error); }
};

const topUp = async (req, res, next) => {
  try {
    const result = await walletService.topUpWallet(req.user._id, req.body.amount, req.body.paymentMethod);
    return successResponse(res, 200, 'Wallet topped up.', result);
  } catch (error) { next(error); }
};

const withdraw = async (req, res, next) => {
  try {
    const result = await walletService.withdrawFromWallet(req.user._id, req.body.amount);
    return successResponse(res, 200, 'Withdrawal successful.', result);
  } catch (error) { next(error); }
};

const getHistory = async (req, res, next) => {
  try {
    const result = await walletService.getTransactionHistory(req.user._id, req.query);
    return successResponse(res, 200, 'Transactions fetched.', result);
  } catch (error) { next(error); }
};

const applyVoucher = async (req, res, next) => {
  try {
    const result = await walletService.applyVoucher(req.body.code, req.body.orderTotal, req.body.orderType);
    return successResponse(res, 200, 'Voucher applied.', result);
  } catch (error) { next(error); }
};

module.exports = { getWallet, topUp, withdraw, getHistory, applyVoucher };