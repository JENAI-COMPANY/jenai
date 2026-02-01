const Service = require('../models/Service');
const ServiceUsage = require('../models/ServiceUsage');
const User = require('../models/User');

// @desc    Get all services
// @route   GET /api/services
// @access  Public
exports.getAllServices = async (req, res) => {
  try {
    const { category, search, isActive } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const services = await Service.find(query)
      .populate('addedBy', 'name username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
exports.getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('addedBy', 'name username')
      .populate({
        path: 'reviews.user',
        select: 'name username'
      });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new service
// @route   POST /api/services
// @access  Private/Admin
exports.createService = async (req, res) => {
  try {
    console.log('Creating service with data:', req.body);
    console.log('Request files:', req.files);

    const serviceData = {
      ...req.body,
      addedBy: req.user.id
    };

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      serviceData.images = req.files.map(file => `/uploads/services/${file.filename}`);
      // Set first image as logo if no logo specified
      if (!serviceData.logo && serviceData.images.length > 0) {
        serviceData.logo = serviceData.images[0];
      }
    }

    // Parse socialMedia if it's a string (from FormData)
    if (typeof serviceData.socialMedia === 'string') {
      try {
        serviceData.socialMedia = JSON.parse(serviceData.socialMedia);
      } catch (e) {
        console.error('Error parsing socialMedia:', e);
      }
    }

    const service = await Service.create(serviceData);

    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private/Admin
exports.updateService = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private/Admin
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    await service.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add review to service
// @route   POST /api/services/:id/reviews
// @access  Private
exports.addServiceReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if user already reviewed
    const alreadyReviewed = service.reviews.find(
      review => review.user.toString() === req.user.id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this service'
      });
    }

    const review = {
      user: req.user.id,
      rating: Number(rating),
      comment
    };

    service.reviews.push(review);
    service.totalReviews = service.reviews.length;
    service.averageRating =
      service.reviews.reduce((acc, item) => item.rating + acc, 0) /
      service.reviews.length;

    await service.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Submit service usage request (simple - just records who requested)
// @route   POST /api/services/:id/usage
// @access  Public (anyone can request)
exports.submitServiceUsage = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const usageData = {
      service: service._id
    };

    // If user is logged in, save their info
    if (req.user) {
      usageData.user = req.user.id;
    }

    const serviceUsage = await ServiceUsage.create(usageData);

    res.status(201).json({
      success: true,
      message: 'Service usage request submitted successfully.',
      data: serviceUsage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's service usage history
// @route   GET /api/services/usage/my-usage
// @access  Private
exports.getMyServiceUsage = async (req, res) => {
  try {
    const usageHistory = await ServiceUsage.find({ user: req.user.id })
      .populate('service', 'name category logo')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: usageHistory.length,
      data: usageHistory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all service usage (admin)
// @route   GET /api/services/usage/all
// @access  Private/Admin
exports.getAllServiceUsage = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    const usageHistory = await ServiceUsage.find(query)
      .populate('service', 'name category logo')
      .populate('user', 'name username phone')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: usageHistory.length,
      data: usageHistory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve/Reject service usage
// @route   PUT /api/services/usage/:id/review
// @access  Private/Admin
exports.reviewServiceUsage = async (req, res) => {
  try {
    console.log('Reviewing service usage with data:', req.body);
    console.log('Request files:', req.files);

    const { status, reviewNotes } = req.body;
    const usage = await ServiceUsage.findById(req.params.id);

    if (!usage) {
      return res.status(404).json({
        success: false,
        message: 'Service usage not found'
      });
    }

    usage.status = status;
    usage.reviewNotes = reviewNotes;
    usage.reviewedBy = req.user.id;
    usage.reviewedAt = Date.now();

    // Handle invoice image uploads
    if (req.files && req.files.length > 0) {
      const invoiceImages = req.files.map(file => `/uploads/services/${file.filename}`);
      usage.invoiceImages = [...(usage.invoiceImages || []), ...invoiceImages];
    }

    await usage.save();

    // If approved, add points to user and update service usage count
    if (status === 'approved') {
      // Only add points if user is logged in (not a guest)
      if (usage.user) {
        const user = await User.findById(usage.user);
        if (user) {
          user.points = (user.points || 0) + usage.pointsEarned;
          await user.save();
        }
      }

      const service = await Service.findById(usage.service);
      if (service) {
        service.totalUsage = (service.totalUsage || 0) + 1;
        await service.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Service usage ${status} successfully`,
      data: usage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get service categories
// @route   GET /api/services/categories
// @access  Public
exports.getServiceCategories = async (req, res) => {
  try {
    const categories = await Service.distinct('category');

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
