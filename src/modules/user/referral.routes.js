const express = require('express');
const router = express.Router();
const User = require('../auth/auth.model');
const { successResponse } = require('../../utils/apiResponse');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

router.use(protect, authorize('customer'));

// Get my referral info
router.get('/', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('referralCode rewardPoints walletBalance');
    const referredUsers = await User.find({ referredBy: req.user._id }).select('firstName lastName createdAt').countDocuments();
    return successResponse(res, 200, 'Referral info fetched.', {
      referralCode: user.referralCode,
      referralLink: `${process.env.CLIENT_URL}/signup?ref=${user.referralCode}`,
      totalReferrals: referredUsers,
      rewardPoints: user.rewardPoints,
      walletBalance: user.walletBalance,
      earning: '$20 per successful referral',
    });
  } catch (error) { next(error); }
});

// Get referred users
router.get('/referred-users', async (req, res, next) => {
  try {
    const users = await User.find({ referredBy: req.user._id })
      .select('firstName lastName createdAt')
      .sort({ createdAt: -1 });
    return successResponse(res, 200, 'Referred users fetched.', { users });
  } catch (error) { next(error); }
});

module.exports = router;