import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getRankImage, getRankName, getRankNumber } from '../utils/rankHelpers';
import '../styles/MyTeam.css';

const MyTeam = () => {
  const { language } = useLanguage();
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'direct'
  const [expandedLevels, setExpandedLevels] = useState({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true
  });
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState('all');
  const [filterActivity, setFilterActivity] = useState('all'); // 'all', 'active', 'inactive'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'suspended'

  useEffect(() => {
    fetchTeamData();
    fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const endpoint = viewMode === 'all' ? '/api/team/my-team' : '/api/team/direct-referrals';

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTeamData(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching team data:', err);
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل في تحميل بيانات الفريق' : 'Failed to load team data'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data.user);
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const toggleLevel = (level) => {
    setExpandedLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  const getLevelColor = (level) => {
    const colors = {
      1: '#4CAF50',
      2: '#2196F3',
      3: '#FF9800',
      4: '#9C27B0',
      5: '#F44336'
    };
    return colors[level] || '#757575';
  };

  const getLevelName = (level) => {
    if (language === 'ar') {
      return `المستوى ${level}`;
    }
    return `Level ${level}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleMemberClick = async (member) => {
    try {
      const token = localStorage.getItem('token');

      // Fetch full member details including referrer info
      const response = await axios.get(`/api/users/${member._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const memberDetails = response.data.user;

      // Calculate cumulative points
      const cumulativePoints = (memberDetails.points || 0) +
        (memberDetails.generation1Points || 0) +
        (memberDetails.generation2Points || 0) +
        (memberDetails.generation3Points || 0) +
        (memberDetails.generation4Points || 0) +
        (memberDetails.generation5Points || 0);

      setSelectedMember({
        ...memberDetails,
        cumulativePoints
      });
      setShowMemberModal(true);
    } catch (err) {
      console.error('Error fetching member details:', err);
    }
  };

  const closeMemberModal = () => {
    setShowMemberModal(false);
    setSelectedMember(null);
  };

  const exportTeamToPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text('My Team Report', 14, 20);

    // Add user code
    doc.setFontSize(12);
    doc.text(
      `Referral Code: ${teamData?.userCode || '-'}`,
      14,
      30
    );

    // Add statistics
    doc.setFontSize(10);
    const statsText = [
      `Total Members: ${stats?.totalMembers || 0}`,
      `Total Points: ${(stats?.totalPoints || 0).toLocaleString()}`,
      `Level 1: ${stats?.levelCounts.level1 || 0}`,
      `Level 2: ${stats?.levelCounts.level2 || 0}`,
      `Level 3: ${stats?.levelCounts.level3 || 0}`,
      `Level 4: ${stats?.levelCounts.level4 || 0}`,
      `Level 5: ${stats?.levelCounts.level5 || 0}`
    ];

    doc.text(statsText, 14, 40);

    let currentY = 90;

    // Group members by level
    const membersByLevel = {
      1: teamMembers.filter(m => m.level === 1),
      2: teamMembers.filter(m => m.level === 2),
      3: teamMembers.filter(m => m.level === 3),
      4: teamMembers.filter(m => m.level === 4),
      5: teamMembers.filter(m => m.level === 5)
    };

    // Create a separate table for each level
    [1, 2, 3, 4, 5].forEach(level => {
      const levelMembers = membersByLevel[level];

      if (levelMembers.length > 0) {
        // Add level heading
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`Level ${level}`, 14, currentY);
        currentY += 10;

        // Prepare table data (use username instead of name to avoid Arabic)
        const tableData = levelMembers.map((member, index) => [
          index + 1,
          member.username || '-', // Use username instead of name
          member.subscriberCode || '-',
          member.monthlyPoints || 0,
          member.city || '-',
          formatDate(member.createdAt)
        ]);

        // Add table
        autoTable(doc, {
          startY: currentY,
          head: [[
            '#',
            'Username',
            'Member Code',
            'Points',
            'City',
            'Join Date'
          ]],
          body: tableData,
          headStyles: {
            fillColor: [102, 126, 234],
            textColor: [255, 255, 255],
            fontSize: 10,
            halign: 'center'
          },
          bodyStyles: {
            fontSize: 9,
            halign: 'center'
          },
          alternateRowStyles: {
            fillColor: [245, 247, 250]
          },
          margin: { top: 10 }
        });

        // Update Y position for next table
        currentY = doc.lastAutoTable.finalY + 15;

        // Add new page if needed
        if (currentY > 250 && level < 5) {
          doc.addPage();
          currentY = 20;
        }
      }
    });

    // Save the PDF with English filename
    const fileName = `my_team_${teamData?.userCode || 'report'}_${new Date().toLocaleDateString('en-US').replace(/\//g, '-')}.pdf`;

    doc.save(fileName);
  };

  if (loading) {
    return (
      <div className="my-team-loading">
        <div className="spinner"></div>
        <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-team-error">
        <p>{error}</p>
        <button onClick={fetchTeamData}>
          {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    );
  }

  const teamMembers = viewMode === 'all' ? teamData?.team || [] : teamData?.referrals || [];
  const stats = viewMode === 'all' ? teamData?.stats : null;

  // Filter function
  const filterMembers = (members) => {
    return members.filter(member => {
      // Search filter (name, username, subscriberCode)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        member.name?.toLowerCase().includes(searchLower) ||
        member.username?.toLowerCase().includes(searchLower) ||
        member.subscriberCode?.toLowerCase().includes(searchLower);

      // Rank filter - convert memberRank enum string to number for comparison
      const matchesRank = filterRank === 'all' || getRankNumber(member.memberRank) === parseInt(filterRank);

      // Activity filter (has order in last month)
      let matchesActivity = true;
      if (filterActivity === 'active') {
        matchesActivity = member.isActiveLastMonth === true;
      } else if (filterActivity === 'inactive') {
        matchesActivity = member.isActiveLastMonth === false;
      }

      // Status filter (isActive field)
      let matchesStatus = true;
      if (filterStatus === 'active') {
        matchesStatus = member.isActive !== false;
      } else if (filterStatus === 'suspended') {
        matchesStatus = member.isActive === false;
      }

      return matchesSearch && matchesRank && matchesActivity && matchesStatus;
    });
  };

  // Apply filters
  const filteredTeamMembers = filterMembers(teamMembers);

  // Group members by level (after filtering)
  const membersByLevel = {};
  if (viewMode === 'all') {
    for (let i = 1; i <= 5; i++) {
      membersByLevel[i] = filteredTeamMembers.filter(m => m.level === i);
    }
  }

  return (
    <div className="my-team-container">
      <div className="my-team-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '10px' }}>
          <h2 style={{ margin: 0 }}>{language === 'ar' ? '🌟 فريقي' : '🌟 My Team'}</h2>
          {currentUser && (
            <img
              src={`/${getRankImage(currentUser.memberRank || 'agent')}`}
              alt={getRankName(currentUser.memberRank || 'agent', language)}
              style={{ width: '70px', height: '70px', objectFit: 'contain' }}
              title={getRankName(currentUser.memberRank || 'agent', language)}
            />
          )}
        </div>
        <p className="my-team-subtitle">
          {language === 'ar'
            ? 'جميع الأعضاء الذين انضموا من خلالك'
            : 'All members who joined through you'}
        </p>
        <div className="my-code-badge">
          <span>{language === 'ar' ? 'كود الإحالة الخاص بي:' : 'My Referral Code:'}</span>
          <strong>{teamData?.userCode || '-'}</strong>
        </div>
      </div>

      {/* View Mode Toggle and Export Button */}
      <div className="team-actions-bar">
        <div className="view-mode-toggle">
          <button
            className={viewMode === 'all' ? 'active' : ''}
            onClick={() => setViewMode('all')}
          >
            {language === 'ar' ? '📊 جميع المستويات (5)' : '📊 All Levels (5)'}
          </button>
          <button
            className={viewMode === 'direct' ? 'active' : ''}
            onClick={() => setViewMode('direct')}
          >
            {language === 'ar' ? '👥 الإحالات المباشرة' : '👥 Direct Referrals'}
          </button>
        </div>

        {teamMembers.length > 0 && (
          <button className="export-pdf-btn" onClick={exportTeamToPDF}>
            📄 {language === 'ar' ? 'طباعة PDF' : 'Export PDF'}
          </button>
        )}
      </div>

      {/* Filters Section */}
      {teamMembers.length > 0 && (
        <div className="team-filters">
          {/* Search Bar */}
          <div className="filter-search">
            <input
              type="text"
              placeholder={language === 'ar' ? '🔍 البحث بالاسم، اليوزر أو الكود...' : '🔍 Search by name, username or code...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="filter-row">
            {/* Rank Filter */}
            <div className="filter-group">
              <label>{language === 'ar' ? 'الرتبة:' : 'Rank:'}</label>
              <select value={filterRank} onChange={(e) => setFilterRank(e.target.value)}>
                <option value="all">{language === 'ar' ? 'جميع الرتب' : 'All Ranks'}</option>
                <option value="1">1 - {language === 'ar' ? 'وكيل' : 'Agent'}</option>
                <option value="2">2 - {language === 'ar' ? 'برونزي' : 'Bronze'}</option>
                <option value="3">3 - {language === 'ar' ? 'فضي' : 'Silver'}</option>
                <option value="4">4 - {language === 'ar' ? 'ذهبي' : 'Gold'}</option>
                <option value="5">5 - {language === 'ar' ? 'روبي' : 'Ruby'}</option>
                <option value="6">6 - {language === 'ar' ? 'ماسي' : 'Diamond'}</option>
                <option value="7">7 - {language === 'ar' ? 'ماسي مزدوج' : 'Double Diamond'}</option>
                <option value="8">8 - {language === 'ar' ? 'سفير إقليمي' : 'Regional Ambassador'}</option>
                <option value="9">9 - {language === 'ar' ? 'سفير عالمي' : 'Global Ambassador'}</option>
              </select>
            </div>

            {/* Activity Filter */}
            <div className="filter-group">
              <label>{language === 'ar' ? 'النشاط:' : 'Activity:'}</label>
              <select value={filterActivity} onChange={(e) => setFilterActivity(e.target.value)}>
                <option value="all">{language === 'ar' ? 'الكل' : 'All'}</option>
                <option value="active">{language === 'ar' ? '🟢 نشيط (له طلب آخر شهر)' : '🟢 Active (ordered last month)'}</option>
                <option value="inactive">{language === 'ar' ? '🔴 غير نشيط' : '🔴 Inactive'}</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="filter-group">
              <label>{language === 'ar' ? 'الحالة:' : 'Status:'}</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">{language === 'ar' ? 'الكل' : 'All'}</option>
                <option value="active">{language === 'ar' ? '✅ فعال' : '✅ Active'}</option>
                <option value="suspended">{language === 'ar' ? '⛔ متوقف' : '⛔ Suspended'}</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || filterRank !== 'all' || filterActivity !== 'all' || filterStatus !== 'all') && (
              <button
                className="clear-filters-btn"
                onClick={() => {
                  setSearchTerm('');
                  setFilterRank('all');
                  setFilterActivity('all');
                  setFilterStatus('all');
                }}
              >
                {language === 'ar' ? '🔄 مسح الفلاتر' : '🔄 Clear Filters'}
              </button>
            )}
          </div>

          {/* Results Count */}
          <div className="filter-results">
            <span>
              {language === 'ar'
                ? `النتائج: ${filteredTeamMembers.length} من ${teamMembers.length}`
                : `Results: ${filteredTeamMembers.length} of ${teamMembers.length}`}
            </span>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {viewMode === 'all' && stats && (
        <>
          <div className="team-stats-cards">
            <div className="stat-card total">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{stats.totalMembers}</h3>
                <p>{language === 'ar' ? 'إجمالي الأعضاء' : 'Total Members'}</p>
              </div>
            </div>
            <div className="stat-card points">
              <div className="stat-icon">⭐</div>
              <div className="stat-info">
                <h3>{stats.totalPoints.toLocaleString()}</h3>
                <p>{language === 'ar' ? 'إجمالي النقاط' : 'Total Points'}</p>
              </div>
            </div>
            {[1, 2, 3, 4, 5].map(level => (
              <div key={level} className="stat-card level" style={{ borderColor: getLevelColor(level) }}>
                <div className="stat-icon" style={{ color: getLevelColor(level) }}>
                  {level}
                </div>
                <div className="stat-info">
                  <h3>{stats.levelCounts[`level${level}`]}</h3>
                  <p>{getLevelName(level)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* New Members This Month Cards */}
          {stats.newMembersThisMonth && (
            <div className="new-members-section">
              <h3 className="section-title">
                {language === 'ar' ? '🆕 الأعضاء الجدد هذا الشهر' : '🆕 New Members This Month'}
              </h3>
              <div className="team-stats-cards">
                {[1, 2, 3, 4, 5].map(level => (
                  <div key={`new-${level}`} className="stat-card level new-member" style={{ borderColor: getLevelColor(level) }}>
                    <div className="stat-icon" style={{ color: getLevelColor(level) }}>
                      {level}
                    </div>
                    <div className="stat-info">
                      <h3>{stats.newMembersThisMonth[`level${level}`]}</h3>
                      <p>{language === 'ar' ? `جديد - ${getLevelName(level)}` : `New - ${getLevelName(level)}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Direct Referrals Count */}
      {viewMode === 'direct' && (
        <div className="team-stats-cards">
          <div className="stat-card total">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{teamData?.count || 0}</h3>
              <p>{language === 'ar' ? 'إحالات مباشرة' : 'Direct Referrals'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Team Members Table */}
      {teamMembers.length === 0 ? (
        <div className="no-team-members">
          <div className="empty-icon">👥</div>
          <h3>{language === 'ar' ? 'لا يوجد أعضاء في فريقك بعد' : 'No team members yet'}</h3>
          <p>
            {language === 'ar'
              ? 'شارك كود الإحالة الخاص بك لبناء فريقك'
              : 'Share your referral code to build your team'}
          </p>
        </div>
      ) : (
        <div className="team-table-container">
          {viewMode === 'all' ? (
            // Grouped by level view
            <div className="team-levels">
              {[1, 2, 3, 4, 5].map(level => {
                const levelMembers = membersByLevel[level] || [];
                if (levelMembers.length === 0) return null;

                return (
                  <div key={level} className="level-section">
                    <div
                      className="level-header"
                      onClick={() => toggleLevel(level)}
                      style={{ borderLeftColor: getLevelColor(level) }}
                    >
                      <div className="level-title">
                        <span className="level-badge" style={{ backgroundColor: getLevelColor(level) }}>
                          {getLevelName(level)}
                        </span>
                        <span className="level-count">
                          {levelMembers.length} {language === 'ar' ? 'عضو' : 'members'}
                        </span>
                      </div>
                      <span className={`expand-icon ${expandedLevels[level] ? 'expanded' : ''}`}>
                        ▼
                      </span>
                    </div>

                    {expandedLevels[level] && (
                      <div className="level-members">
                        <table className="team-table">
                          <thead>
                            <tr>
                              <th>{language === 'ar' ? '#' : '#'}</th>
                              <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                              <th>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</th>
                              <th>{language === 'ar' ? 'كود العضو' : 'Member Code'}</th>
                              <th>{language === 'ar' ? 'النقاط' : 'Points'}</th>
                              <th>{language === 'ar' ? 'المدينة' : 'City'}</th>
                              <th>{language === 'ar' ? 'تاريخ الانضمام' : 'Joined Date'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {levelMembers.map((member, index) => (
                              <tr
                                key={member._id}
                                onClick={() => handleMemberClick(member)}
                                className="clickable-row"
                              >
                                <td>{index + 1}</td>
                                <td className="member-name">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <img
                                      src={`/${getRankImage(member.memberRank || 'agent')}`}
                                      alt={getRankName(member.memberRank || 'agent', language)}
                                      style={{ width: '55px', height: '55px', objectFit: 'contain' }}
                                      title={getRankName(member.memberRank || 'agent', language)}
                                    />
                                    <span>{member.name}</span>
                                  </div>
                                </td>
                                <td className="member-username">@{member.username}</td>
                                <td className="member-code">{member.subscriberCode || '-'}</td>
                                <td className="member-points">
                                  <span className="points-badge">⭐ {member.monthlyPoints || 0}</span>
                                </td>
                                <td>{member.city || '-'}</td>
                                <td className="member-date">{formatDate(member.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Direct referrals table view
            <table className="team-table">
              <thead>
                <tr>
                  <th>{language === 'ar' ? '#' : '#'}</th>
                  <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</th>
                  <th>{language === 'ar' ? 'كود العضو' : 'Member Code'}</th>
                  <th>{language === 'ar' ? 'النقاط' : 'Points'}</th>
                  <th>{language === 'ar' ? 'المدينة' : 'City'}</th>
                  <th>{language === 'ar' ? 'تاريخ الانضمام' : 'Joined Date'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeamMembers.map((member, index) => (
                  <tr
                    key={member._id}
                    onClick={() => handleMemberClick(member)}
                    className="clickable-row"
                  >
                    <td>{index + 1}</td>
                    <td className="member-name">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img
                          src={`/${getRankImage(member.memberRank || 'agent')}`}
                          alt={getRankName(member.memberRank || 'agent', language)}
                          style={{ width: '55px', height: '55px', objectFit: 'contain' }}
                          title={getRankName(member.memberRank || 'agent', language)}
                        />
                        <span>{member.name}</span>
                      </div>
                    </td>
                    <td className="member-username">@{member.username}</td>
                    <td className="member-code">{member.subscriberCode || '-'}</td>
                    <td className="member-points">
                      <span className="points-badge">⭐ {member.points || 0}</span>
                    </td>
                    <td>{member.city || '-'}</td>
                    <td className="member-date">{formatDate(member.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Member Details Modal */}
      {showMemberModal && selectedMember && (
        <div className="member-modal-overlay" onClick={closeMemberModal}>
          <div className="member-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeMemberModal}>
              ✕
            </button>

            <div className="modal-header">
              <h2>{language === 'ar' ? 'معلومات العضو' : 'Member Information'}</h2>
            </div>

            <div className="modal-body">
              <div className="member-info-grid">
                <div className="info-item">
                  <span className="info-label">
                    {language === 'ar' ? 'الاسم:' : 'Name:'}
                  </span>
                  <span className="info-value">{selectedMember.name}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    {language === 'ar' ? 'كود العضو:' : 'Member Code:'}
                  </span>
                  <span className="info-value">{selectedMember.subscriberCode || '-'}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    {language === 'ar' ? 'من أحاله:' : 'Referred By:'}
                  </span>
                  <span className="info-value">
                    {selectedMember.sponsorId?.name || (language === 'ar' ? 'غير محدد' : 'Not specified')}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    {language === 'ar' ? 'كود من أحاله:' : "Referrer's Code:"}
                  </span>
                  <span className="info-value">
                    {selectedMember.sponsorCode || (language === 'ar' ? 'غير محدد' : 'Not specified')}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    {language === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}
                  </span>
                  <span className="info-value">
                    {selectedMember.phone || (language === 'ar' ? 'غير محدد' : 'Not specified')}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    {language === 'ar' ? 'المدينة:' : 'City:'}
                  </span>
                  <span className="info-value">
                    {selectedMember.city || (language === 'ar' ? 'غير محدد' : 'Not specified')}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    {language === 'ar' ? 'الرتبة:' : 'Rank:'}
                  </span>
                  <span className="info-value rank-badge">
                    <img
                      src={`/${getRankImage(selectedMember.memberRank || 'agent')}`}
                      alt={getRankName(selectedMember.memberRank || 'agent', language)}
                      style={{ width: '30px', height: '30px', objectFit: 'contain', marginLeft: '8px', verticalAlign: 'middle' }}
                    />
                    {getRankName(selectedMember.memberRank || 'agent', language)}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    {language === 'ar' ? 'المدينة:' : 'City:'}
                  </span>
                  <span className="info-value">{selectedMember.city || '-'}</span>
                </div>

                <div className="info-item points-item">
                  <span className="info-label">
                    {language === 'ar' ? 'النقاط الشهرية:' : 'Monthly Points:'}
                  </span>
                  <span className="info-value points-value">⭐ {selectedMember.monthlyPoints || 0}</span>
                </div>

                <div className="info-item points-item">
                  <span className="info-label">
                    {language === 'ar' ? 'النقاط التراكمية:' : 'Cumulative Points:'}
                  </span>
                  <span className="info-value points-value">⭐ {selectedMember.cumulativePoints || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTeam;
