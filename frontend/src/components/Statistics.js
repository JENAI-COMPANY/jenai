import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MembersByRankChart, MembersByRegionChart, GrowthChart, RevenueGrowthChart } from './StatisticsCharts';
import '../styles/Statistics.css';

const Statistics = () => {
  const { language } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.response?.data?.message || 'Failed to load statistics');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="stats-container loading">
        <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-container error">
        <p>{error}</p>
      </div>
    );
  }

  if (!stats || !stats.users || !stats.products || !stats.orders || !stats.revenue || !stats.commissions || !stats.points) {
    return (
      <div className="stats-container loading">
        <p>{language === 'ar' ? 'لا توجد بيانات' : 'No data available'}</p>
      </div>
    );
  }

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h2>{language === 'ar' ? 'لوحة الإحصائيات' : 'Statistics Dashboard'}</h2>
        <div className="stats-header-controls">
          <button className="stats-refresh-btn" onClick={() => fetchStats()}>
            🔄 {language === 'ar' ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="stats-grid">
        {/* Users Stats */}
        <div className="stat-card users-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{language === 'ar' ? 'المستخدمين' : 'Users'}</h3>
            <div className="stat-number">{stats.users.total}</div>
            <div className="stat-details">
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'أعضاء' : 'Members'}:</span>
                <span className="detail-value">{stats.users.members}</span>
              </div>
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'عملاء' : 'Customers'}:</span>
                <span className="detail-value">{stats.users.customers}</span>
              </div>
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'موردين' : 'Suppliers'}:</span>
                <span className="detail-value">{stats.users.suppliers}</span>
              </div>
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'مدراء' : 'Admins'}:</span>
                <span className="detail-value">{stats.users.admins}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Products Stats */}
        <div className="stat-card products-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{language === 'ar' ? 'المنتجات' : 'Products'}</h3>
            <div className="stat-number">{stats.products.total}</div>
            <div className="stat-details">
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'متوفر' : 'In Stock'}:</span>
                <span className="detail-value green">{stats.products.inStock}</span>
              </div>
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'مخزون منخفض' : 'Low Stock'}:</span>
                <span className="detail-value orange">{stats.products.lowStock}</span>
              </div>
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'نفذ' : 'Out of Stock'}:</span>
                <span className="detail-value red">{stats.products.outOfStock}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Stats */}
        <div className="stat-card orders-card">
          <div className="stat-icon">🛒</div>
          <div className="stat-content">
            <h3>{language === 'ar' ? 'الطلبات' : 'Orders'}</h3>
            <div className="stat-number">{stats.orders.total}</div>
            <div className="stat-details">
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'معلقة' : 'Pending'}:</span>
                <span className="detail-value orange">{stats.orders.pending}</span>
              </div>
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'جاهزة' : 'Prepared'}:</span>
                <span className="detail-value blue">{stats.orders.prepared}</span>
              </div>
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'في الطريق' : 'On The Way'}:</span>
                <span className="detail-value purple">{stats.orders.onTheWay}</span>
              </div>
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'تم الاستلام' : 'Received'}:</span>
                <span className="detail-value green">{stats.orders.received}</span>
              </div>
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'ملغاة' : 'Cancelled'}:</span>
                <span className="detail-value red">{stats.orders.cancelled}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="stat-card revenue-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{language === 'ar' ? 'الإيرادات' : 'Revenue'}</h3>
            <div className="stat-number">₪{(stats.revenue.total || 0).toFixed(2)}</div>
            <div className="stat-details">
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'مكتملة' : 'Completed'}:</span>
                <span className="detail-value green">₪{(stats.revenue.completed || 0).toFixed(2)}</span>
              </div>
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'معلقة' : 'Pending'}:</span>
                <span className="detail-value orange">₪{(stats.revenue.pending || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Commission Stats */}
        <div className="stat-card commission-card">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <h3>{language === 'ar' ? 'العمولات' : 'Commissions'}</h3>
            <div className="stat-number">₪{(stats.commissions.total || 0).toFixed(2)}</div>
            <div className="stat-details">
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'مدفوعة' : 'Paid'}:</span>
                <span className="detail-value green">₪{(stats.commissions.paid || 0).toFixed(2)}</span>
              </div>
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'معلقة' : 'Pending'}:</span>
                <span className="detail-value orange">₪{(stats.commissions.pending || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Points Stats */}
        <div className="stat-card points-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{language === 'ar' ? 'النقاط' : 'Points'}</h3>
            <div className="stat-number">{stats.points.total || 0}</div>
            <div className="stat-details">
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'غير محتسبة بالأرباح' : 'Uncalculated'}:</span>
                <span className="detail-value orange">{stats.points.uncalculated || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profit Stats */}
        {stats.profit && (
        <div className="stat-card profit-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{language === 'ar' ? 'أرباح الشركة' : 'Company Profit'}</h3>
            <div className="stat-number">₪{(stats.profit.total || 0).toFixed(2)}</div>
            <div className="stat-details">
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'الإيرادات المكتملة' : 'Completed Revenue'}:</span>
                <span className="detail-value blue">₪{(stats.profit.completedRevenue || 0).toFixed(2)}</span>
              </div>
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'هامش الربح' : 'Profit Margin'}:</span>
                <span className="detail-value green">{stats.profit.profitMargin || 0}%</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Member Classification Stats */}
        {stats.memberClassification && (
        <div className="stat-card classification-card">
          <div className="stat-icon">👤</div>
          <div className="stat-content">
            <h3>{language === 'ar' ? 'تصنيف الأعضاء' : 'Member Classification'}</h3>
            <div className="stat-number">{stats.users.members || 0}</div>
            <div className="stat-details">
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'نشط (اشترى آخر شهر)' : 'Active (Purchased Last Month)'}:</span>
                <span className="detail-value green">{stats.memberClassification.active || 0}</span>
              </div>
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'غير فعال' : 'Inactive'}:</span>
                <span className="detail-value orange">{stats.memberClassification.inactive || 0}</span>
              </div>
              <div className="stat-detail-item">
                <span className="detail-label">{language === 'ar' ? 'متوقف (معلق)' : 'Stopped (Suspended)'}:</span>
                <span className="detail-value red">{stats.memberClassification.stopped || 0}</span>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Top Members Table */}
      <div className="stats-section">
        <h3 className="section-title">
          {language === 'ar' ? 'أفضل الأعضاء حسب النقاط' : 'Top Members by Points'}
        </h3>
        <div className="table-wrapper">
          <table className="stats-table">
            <thead>
              <tr>
                <th>{language === 'ar' ? 'الترتيب' : 'Rank'}</th>
                <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                <th>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</th>
                <th>{language === 'ar' ? 'النقاط' : 'Points'}</th>
                <th>{language === 'ar' ? 'النقاط الشهرية' : 'Monthly Points'}</th>
                <th>{language === 'ar' ? 'إجمالي العمولات' : 'Total Commission'}</th>
              </tr>
            </thead>
            <tbody>
              {(stats.topMembers || []).map((member, index) => (
                <tr key={member._id}>
                  <td>
                    <span className={`rank-badge rank-${index + 1}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td>{member.name}</td>
                  <td className="username-cell">{member.username}</td>
                  <td className="points-cell">{member.points || 0}</td>
                  <td className="monthly-points-cell">{member.monthlyPoints || 0}</td>
                  <td className="commission-cell">₪{(member.totalCommission || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="stats-section-grid">
        {/* Recent Users */}
        <div className="stats-section">
          <h3 className="section-title">
            {language === 'ar' ? 'أحدث المستخدمين' : 'Recent Users'}
          </h3>
          <div className="recent-list">
            {(stats.recent?.users || []).map((user) => (
              <div key={user._id} className="recent-item">
                <div className="recent-item-info">
                  <div className="recent-item-name">{user.name}</div>
                  <div className="recent-item-detail">@{user.username}</div>
                </div>
                <div className="recent-item-meta">
                  <span className={`role-badge ${user.role}`}>
                    {user.role === 'member' ? (language === 'ar' ? 'عضو' : 'Member') :
                     user.role === 'customer' ? (language === 'ar' ? 'عميل' : 'Customer') :
                     user.role === 'supplier' ? (language === 'ar' ? 'مورد' : 'Supplier') :
                     user.role}
                  </span>
                  <span className="recent-item-date">
                    {new Date(user.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="stats-section">
          <h3 className="section-title">
            {language === 'ar' ? 'أحدث الطلبات' : 'Recent Orders'}
          </h3>
          <div className="recent-list">
            {(stats.recent?.orders || []).map((order) => (
              <div key={order._id} className="recent-item">
                <div className="recent-item-info">
                  <div className="recent-item-name">
                    {language === 'ar' ? 'طلب' : 'Order'} #{order.orderNumber}
                  </div>
                  <div className="recent-item-detail">{order.user?.name}</div>
                </div>
                <div className="recent-item-meta">
                  <span className="order-amount">₪{(order.totalAmount || 0).toFixed(2)}</span>
                  <span className={`status-badge ${order.status}`}>
                    {order.status === 'pending' ? (language === 'ar' ? 'معلق' : 'Pending') :
                     order.status === 'processing' ? (language === 'ar' ? 'قيد المعالجة' : 'Processing') :
                     order.status === 'delivered' ? (language === 'ar' ? 'تم التوصيل' : 'Delivered') :
                     order.status}
                  </span>
                  <span className="recent-item-date">
                    {new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {stats.membersByRank && stats.membersByRank.length > 0 && (
        <div className="stats-section">
          <h3 className="section-title">
            {language === 'ar' ? 'التوزيعات والنمو' : 'Distributions & Growth'}
          </h3>

          <div className="charts-grid">
            {/* Members by Rank Chart */}
            <div className="chart-container">
              <MembersByRankChart data={stats.membersByRank} />
            </div>

            {/* Members by Region Chart */}
            {stats.membersByRegion && stats.membersByRegion.length > 0 && (
              <div className="chart-container">
                <MembersByRegionChart data={stats.membersByRegion} />
              </div>
            )}
          </div>

          {/* Growth Charts */}
          {stats.growth && stats.growth.members && stats.growth.members.length > 0 && (
            <div className="charts-grid-wide">
              <div className="chart-container-wide">
                <GrowthChart
                  memberGrowth={stats.growth.members}
                  orderGrowth={stats.growth.orders || []}
                />
              </div>

              {stats.growth.orders && stats.growth.orders.length > 0 && (
                <div className="chart-container-wide">
                  <RevenueGrowthChart orderGrowth={stats.growth.orders} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Statistics;
