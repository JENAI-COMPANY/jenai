import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/MemberDashboard.css';

const MemberDashboard = () => {
  const { user } = useContext(AuthContext);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [teamData, setTeamData] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [sortBy, setSortBy] = useState('auto'); // 'auto', 'asc', 'desc', 'activity', 'rank'

  useEffect(() => {
    // TODO: Fetch team data from API
    // Mock data for now
    setTeamData([
      {
        _id: '1',
        name: 'John Doe',
        username: 'johndoe',
        rank: 'Silver',
        points: 1250,
        status: 'active',
        joinedDate: '2025-01-01',
        teamSize: 15,
        monthlyPoints: 450
      },
      {
        _id: '2',
        name: 'Jane Smith',
        username: 'janesmith',
        rank: 'Gold',
        points: 2500,
        status: 'active',
        joinedDate: '2024-12-15',
        teamSize: 25,
        monthlyPoints: 780
      }
    ]);
  }, []);

  const stats = {
    totalTeam: teamData.length || 0,
    newThisMonth: 5,
    monthlyPoints: 2500,
    totalCommission: user?.totalCommission || 0,
    availableCommission: user?.availableCommission || 0,
    withdrawnCommission: user?.withdrawnCommission || 0,
    activeMembers: teamData.filter(m => m.status === 'active').length,
    inactiveMembers: teamData.filter(m => m.status === 'inactive').length,
    leaders: teamData.filter(m => ['Gold', 'Platinum', 'Diamond'].includes(m.rank)).length
  };

  const renderStatsCard = (icon, title, value, color) => (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-icon" style={{ color }}>{icon}</div>
      <div className="stat-info">
        <h4>{title}</h4>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );

  const renderTeamGrid = () => (
    <div className="team-grid">
      {teamData.map(member => (
        <div key={member._id} className="team-member-card">
          <div className="member-avatar">
            {member.name.charAt(0).toUpperCase()}
          </div>
          <h3 className="member-name">{member.name}</h3>
          <p className="member-username">@{member.username}</p>
          <div className="member-rank-badge" data-rank={member.rank.toLowerCase()}>
            {member.rank}
          </div>
          <div className="member-stats-mini">
            <div className="stat-mini">
              <span className="stat-label">
                {language === 'ar' ? 'النقاط' : 'Points'}
              </span>
              <span className="stat-value-mini">{member.points}</span>
            </div>
            <div className="stat-mini">
              <span className="stat-label">
                {language === 'ar' ? 'الفريق' : 'Team'}
              </span>
              <span className="stat-value-mini">{member.teamSize}</span>
            </div>
          </div>
          <div className={`member-status ${member.status}`}>
            {member.status === 'active'
              ? (language === 'ar' ? 'نشط' : 'Active')
              : (language === 'ar' ? 'غير نشط' : 'Inactive')}
          </div>
        </div>
      ))}
    </div>
  );

  const renderTeamTable = () => (
    <div className="team-table-container">
      <table className="team-table">
        <thead>
          <tr>
            <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
            <th>{language === 'ar' ? 'الرتبة' : 'Rank'}</th>
            <th>{language === 'ar' ? 'النقاط' : 'Points'}</th>
            <th>{language === 'ar' ? 'الفريق' : 'Team Size'}</th>
            <th>{language === 'ar' ? 'هذا الشهر' : 'This Month'}</th>
            <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
            <th>{language === 'ar' ? 'تاريخ الانضمام' : 'Joined'}</th>
          </tr>
        </thead>
        <tbody>
          {teamData.map(member => (
            <tr key={member._id}>
              <td>
                <div className="table-member-info">
                  <div className="table-avatar">{member.name.charAt(0)}</div>
                  <div>
                    <div className="table-name">{member.name}</div>
                    <div className="table-username">@{member.username}</div>
                  </div>
                </div>
              </td>
              <td>
                <span className="table-rank-badge" data-rank={member.rank.toLowerCase()}>
                  {member.rank}
                </span>
              </td>
              <td><strong>{member.points}</strong></td>
              <td>{member.teamSize}</td>
              <td>{member.monthlyPoints}</td>
              <td>
                <span className={`table-status ${member.status}`}>
                  {member.status === 'active' ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                </span>
              </td>
              <td>{new Date(member.joinedDate).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="member-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>{language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</h1>
          <div className="user-info-header">
            <div className="user-avatar-large">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2>{user?.name}</h2>
              <p className="user-id">ID: {user?.subscriberId || 'N/A'}</p>
              <div className="user-rank-badge" data-rank={user?.rank?.toLowerCase()}>
                {user?.rank || 'Bronze'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          {language === 'ar' ? 'نظرة عامة' : 'Overview'}
        </button>
        <button
          className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          {language === 'ar' ? 'الفريق' : 'My Team'}
        </button>
        <button
          className={`tab-btn ${activeTab === 'commissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('commissions')}
        >
          {language === 'ar' ? 'العمولات' : 'Commissions'}
        </button>
        <button
          className={`tab-btn ${activeTab === 'referral' ? 'active' : ''}`}
          onClick={() => setActiveTab('referral')}
        >
          {language === 'ar' ? 'رابط الإحالة' : 'Referral Link'}
        </button>
        <button
          className={`tab-btn ${activeTab === 'profits' ? 'active' : ''}`}
          onClick={() => navigate('/profits')}
        >
          {language === 'ar' ? 'حاسبة الأرباح' : 'Profits'}
        </button>
      </div>

      <div className="dashboard-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              {renderStatsCard('👥', language === 'ar' ? 'إجمالي الفريق' : 'Total Team', stats.totalTeam, '#3498db')}
              {renderStatsCard('⭐', language === 'ar' ? 'جدد هذا الشهر' : 'New This Month', stats.newThisMonth, '#2ecc71')}
              {renderStatsCard('🎯', language === 'ar' ? 'نقاط الشهر' : 'Monthly Points', stats.monthlyPoints, '#f39c12')}
              {renderStatsCard('✓', language === 'ar' ? 'نشطون' : 'Active Members', stats.activeMembers, '#27ae60')}
              {renderStatsCard('⏸️', language === 'ar' ? 'غير نشطين' : 'Inactive', stats.inactiveMembers, '#95a5a6')}
              {renderStatsCard('🏆', language === 'ar' ? 'قادة' : 'Leaders', stats.leaders, '#9b59b6')}
            </div>

            <div className="quick-actions">
              <h3>{language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}</h3>
              <div className="action-buttons">
                <button className="action-btn" onClick={() => setActiveTab('referral')}>
                  <span className="action-icon">🔗</span>
                  {language === 'ar' ? 'مشاركة الرابط' : 'Share Link'}
                </button>
                <button className="action-btn" onClick={() => navigate('/profits')}>
                  <span className="action-icon">📊</span>
                  {language === 'ar' ? 'حاسبة الأرباح' : 'Profits Calculator'}
                </button>
                <button className="action-btn" onClick={() => navigate('/academy')}>
                  <span className="action-icon">🎓</span>
                  {language === 'ar' ? 'التدريب' : 'Training'}
                </button>
                <button className="action-btn" onClick={() => setActiveTab('commissions')}>
                  <span className="action-icon">💰</span>
                  {language === 'ar' ? 'سحب العمولات' : 'Withdraw'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="team-tab">
            <div className="team-controls">
              <div className="view-toggles">
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <span>🔲</span> {language === 'ar' ? 'شبكة' : 'Grid'}
                </button>
                <button
                  className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                >
                  <span>📋</span> {language === 'ar' ? 'جدول' : 'Table'}
                </button>
              </div>

              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="auto">{language === 'ar' ? 'تلقائي' : 'Automatic'}</option>
                <option value="asc">{language === 'ar' ? 'تصاعدي' : 'Ascending'}</option>
                <option value="desc">{language === 'ar' ? 'تنازلي' : 'Descending'}</option>
                <option value="activity">{language === 'ar' ? 'النشاط' : 'Activity'}</option>
                <option value="rank">{language === 'ar' ? 'الرتبة' : 'Rank'}</option>
              </select>

              <button className="print-btn">
                🖨️ {language === 'ar' ? 'طباعة' : 'Print'}
              </button>
            </div>

            {viewMode === 'grid' ? renderTeamGrid() : renderTeamTable()}
          </div>
        )}

        {/* Commissions Tab */}
        {activeTab === 'commissions' && (
          <div className="commissions-tab">
            <div className="commission-summary">
              <div className="commission-card total">
                <h3>{language === 'ar' ? 'إجمالي العمولات' : 'Total Commissions'}</h3>
                <p className="commission-amount">${(stats.totalCommission || 0).toFixed(2)}</p>
              </div>
              <div className="commission-card available">
                <h3>{language === 'ar' ? 'المتاح للسحب' : 'Available'}</h3>
                <p className="commission-amount">${(stats.availableCommission || 0).toFixed(2)}</p>
                <button className="withdraw-btn">
                  {language === 'ar' ? 'سحب' : 'Withdraw'}
                </button>
              </div>
              <div className="commission-card withdrawn">
                <h3>{language === 'ar' ? 'المسحوب' : 'Withdrawn'}</h3>
                <p className="commission-amount">${(stats.withdrawnCommission || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="commission-details">
              <h3>{language === 'ar' ? 'تفاصيل العمولات' : 'Commission Details'}</h3>
              <p className="no-data">{language === 'ar' ? 'لا توجد بيانات حالياً' : 'No data available'}</p>
            </div>
          </div>
        )}

        {/* Referral Link Tab */}
        {activeTab === 'referral' && (
          <div className="referral-tab">
            {/* Shopping Referral Link */}
            <div className="referral-box" style={{ marginBottom: '16px' }}>
              <h3>{language === 'ar' ? '🛒 رابط إحالة للتسوق' : '🛒 Shopping Referral Link'}</h3>
              <div className="referral-link-container">
                <input
                  type="text"
                  value={`https://jenai-4u.com/register?ref=${user?.subscriberCode || 'YOURCODE'}&type=customer`}
                  readOnly
                  className="referral-input"
                />
                <button
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://jenai-4u.com/register?ref=${user?.subscriberCode}&type=customer`);
                    alert(language === 'ar' ? 'تم النسخ!' : 'Copied!');
                  }}
                >
                  📋 {language === 'ar' ? 'نسخ' : 'Copy'}
                </button>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '8px' }}>
                {language === 'ar' ? 'للزبائن - التسوق فقط' : 'For Customers - Shopping Only'}
              </p>
            </div>

            {/* Member Referral Link */}
            <div className="referral-box">
              <h3>{language === 'ar' ? '👥 رابط إحالة عضو' : '👥 Member Referral Link'}</h3>
              <div className="referral-link-container">
                <input
                  type="text"
                  value={`https://jenai-4u.com/register?ref=${user?.subscriberCode || 'YOURCODE'}&type=member`}
                  readOnly
                  className="referral-input"
                />
                <button
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://jenai-4u.com/register?ref=${user?.subscriberCode}&type=member`);
                    alert(language === 'ar' ? 'تم النسخ!' : 'Copied!');
                  }}
                >
                  📋 {language === 'ar' ? 'نسخ' : 'Copy'}
                </button>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '8px' }}>
                {language === 'ar' ? 'للأعضاء - الانضمام إلى الشبكة' : 'For Members - Join Network'}
              </p>
            </div>

            <p className="referral-stats" style={{ marginTop: '16px' }}>
              {language === 'ar' ? 'عدد الإحالات:' : 'Total Referrals:'} <strong>{user?.referralCount || 0}</strong>
            </p>

            <div className="share-options">
              <h3>{language === 'ar' ? 'مشاركة عبر' : 'Share via'}</h3>
              <div className="share-buttons">
                <button className="share-btn whatsapp">WhatsApp</button>
                <button className="share-btn facebook">Facebook</button>
                <button className="share-btn twitter">Twitter</button>
                <button className="share-btn email">Email</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDashboard;
