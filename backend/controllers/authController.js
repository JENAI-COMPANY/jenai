const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Register user
exports.register = async (req, res) => {
  try {
    const { username, name, phone, password, role, sponsorId, country, city } = req.body;

    const userExists = await User.findOne({ username });

    if (userExists) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const userData = {
      username,
      name,
      phone,
      password,
      role: role || 'customer'
    };

    // Add country and city if provided (required for subscribers)
    if (country) {
      userData.country = country;
    }
    if (city) {
      userData.city = city;
    }

    // Validate that all users must provide country and city
    if (!country || !city) {
      return res.status(400).json({
        success: false,
        message: 'Country and city are required for registration'
      });
    }

    // Validate that members must have a referral code
    if (role === 'member' && !sponsorId) {
      return res.status(400).json({
        success: false,
        message: 'Referral code is required for member registration'
      });
    }

    // Handle referral/sponsor code for both customers and members
    if (sponsorId) {
      // Try to find sponsor by subscriberCode first (preferred), then subscriberId, then _id
      let sponsor = await User.findOne({ subscriberCode: sponsorId });
      if (!sponsor) {
        sponsor = await User.findOne({ subscriberId: sponsorId });
      }
      if (!sponsor) {
        sponsor = await User.findById(sponsorId).catch(() => null);
      }

      // Validate sponsor exists and is a member
      if (!sponsor) {
        return res.status(400).json({
          success: false,
          message: 'Invalid referral code. Please check and try again.'
        });
      }

      if (sponsor.role !== 'member' && sponsor.role !== 'super_admin' && sponsor.role !== 'regional_admin') {
        return res.status(400).json({
          success: false,
          message: 'Invalid referral code. The referral must be from a member or admin.'
        });
      }

      userData.sponsorId = sponsor._id;

      // Additional setup for members
      if (role === 'member') {
        userData.commissionRate = 10;
        userData.subscriberId = `MEM${Date.now()}`;

        // Generate unique member code
        try {
          userData.subscriberCode = await User.generateSubscriberCode(country, city);
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: 'Failed to generate member code. Please try again.'
          });
        }
      }
    }

    // Additional setup for suppliers
    if (role === 'supplier') {
      const { companyName, taxNumber, supplierCategory } = req.body;

      if (companyName) userData.companyName = companyName;
      if (taxNumber) userData.taxNumber = taxNumber;
      if (supplierCategory) userData.supplierCategory = supplierCategory;

      // Generate unique supplier code
      try {
        userData.supplierCode = await User.generateSupplierCode();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to generate supplier code. Please try again.'
        });
      }
    }

    const user = await User.create(userData);

    // Add user to sponsor's downline
    if (userData.sponsorId) {
      await User.findByIdAndUpdate(userData.sponsorId, {
        $push: { downline: user._id }
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        subscriberId: user.subscriberId,
        subscriberCode: user.subscriberCode,
        supplierCode: user.supplierCode,
        companyName: user.companyName,
        country: user.country,
        city: user.city
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    const user = await User.findOne({ username }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        subscriberId: user.subscriberId,
        subscriberCode: user.subscriberCode,
        supplierCode: user.supplierCode,
        companyName: user.companyName
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current logged in user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('sponsorId', 'name subscriberId subscriberCode');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password'
      });
    }

    // Get user with password field
    const user = await User.findById(req.user.id).select('+password');

    // Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
