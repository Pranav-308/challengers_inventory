const { getAllComponents } = require('../models/Component');
const { findUserById } = require('../models/User');
const { getAllHistory } = require('../models/CheckoutHistory');
const { getPendingRequestsCount } = require('../models/ComponentRequest');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const allComponents = await getAllComponents({});
    
    const totalComponents = allComponents.length;
    const availableComponents = allComponents.filter(c => c.status === 'available').length;
    const takenComponents = allComponents.filter(c => c.status === 'taken').length;
    const overdueComponents = allComponents.filter(c => c.status === 'overdue').length;

    // Recent activity
    const allHistory = await getAllHistory();
    const recentActivity = allHistory.slice(0, 10);

    // Populate user and component details for recent activity
    const recentActivityWithDetails = await Promise.all(recentActivity.map(async (record) => {
      const user = await findUserById(record.userId);
      const component = allComponents.find(c => c.id === record.componentId);
      
      return {
        ...record,
        userDetails: user ? { id: user.id, name: user.name, username: user.username } : null,
        componentDetails: component ? { id: component.id, name: component.name, componentId: component.componentId } : null,
      };
    }));

    // Components due soon (within 2 days)
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const now = new Date();

    const dueSoonComponents = allComponents.filter(comp => 
      comp.status === 'taken' && 
      comp.dueDate && 
      new Date(comp.dueDate) <= twoDaysFromNow && 
      new Date(comp.dueDate) >= now
    ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // Populate borrower for due soon components
    const dueSoonWithBorrowers = await Promise.all(dueSoonComponents.map(async (comp) => {
      if (comp.currentBorrower) {
        const borrower = await findUserById(comp.currentBorrower);
        if (borrower) {
          comp.currentBorrowerDetails = {
            id: borrower.id,
            name: borrower.name,
            username: borrower.username,
          };
        }
      }
      return comp;
    }));

    // Top borrowers (for admin)
    let topBorrowers = [];
    if (req.user.role === 'admin') {
      const checkoutHistory = allHistory.filter(h => h.action === 'checkout');
      const borrowerCounts = {};
      
      checkoutHistory.forEach(record => {
        borrowerCounts[record.userId] = (borrowerCounts[record.userId] || 0) + 1;
      });

      const topBorrowerIds = Object.entries(borrowerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      topBorrowers = await Promise.all(topBorrowerIds.map(async ([userId, count]) => {
        const user = await findUserById(userId);
        return {
          user: user ? { id: user.id, name: user.name, username: user.username } : null,
          checkoutCount: count,
        };
      }));
    }

    // Pending requests count (for admin)
    const pendingRequests = req.user.role === 'admin' ? await getPendingRequestsCount() : 0;

    res.json({
      stats: {
        total: totalComponents,
        available: availableComponents,
        taken: takenComponents,
        overdue: overdueComponents,
        pendingRequests,
      },
      recentActivity: recentActivityWithDetails,
      dueSoonComponents: dueSoonWithBorrowers,
      topBorrowers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
};
