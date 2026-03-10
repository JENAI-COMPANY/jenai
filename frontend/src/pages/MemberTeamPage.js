import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getRankImage, getRankName } from '../utils/rankHelpers';
import '../styles/MemberTeamPage.css';

const MemberTeamPage = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [member, setMember] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLevels, setExpandedLevels] = useState({ 1: true, 2: true, 3: true, 4: true, 5: true });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [memberRes, teamRes] = await Promise.all([
        axios.get(`/api/users/${memberId}`, { headers }),
        axios.get(`/api/users/${memberId}`, { headers }) // we'll get subscriberCode from member then fetch team
      ]);

      const memberData = memberRes.data.user;

      // Calculate cumulative points
      const cumulativePoints =
        (memberData.points || 0) +
        (memberData.generation1Points || 0) +
        (memberData.generation2Points || 0) +
        (memberData.generation3Points || 0) +
        (memberData.generation4Points || 0) +
        (memberData.generation5Points || 0);

      setMember({ ...memberData, cumulativePoints });

      // Now fetch their team if they have a subscriberCode
      if (memberData.subscriberCode) {
        const teamResponse = await axios.get(`/api/team/member-team/${memberData.subscriberCode}`, { headers });
        setTeamData(teamResponse.data);
      } else {
        setTeamData({ team: [], stats: { totalMembers: 0, totalPoints: 0, levelCounts: {}, newMembersThisMonth: {} } });
      }
    } catch (err) {
      console.error(err);
      setError(isAr ? 'فشل في تحميل البيانات' : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    return { 1: '#4CAF50', 2: '#2196F3', 3: '#FF9800', 4: '#9C27B0', 5: '#F44336' }[level] || '#757575';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const toggleLevel = (level) => {
    setExpandedLevels(prev => ({ ...prev, [level]: !prev[level] }));
  };

  const handleMemberClick = (m) => {
    navigate(`/team/member/${m._id}`);
  };

  if (loading) {
    return (
      <div className="mtp-loading">
        <div className="spinner"></div>
        <p>{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mtp-error">
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>{isAr ? 'رجوع' : 'Go Back'}</button>
      </div>
    );
  }

  const teamMembers = teamData?.team || [];
  const stats = teamData?.stats;

  const membersByLevel = {};
  for (let i = 1; i <= 5; i++) {
    membersByLevel[i] = teamMembers.filter(m => m.level === i);
  }

  return (
    <div className="mtp-container">
      {/* Back Button */}
      <button className="mtp-back-btn" onClick={() => navigate(-1)}>
        {isAr ? '→ رجوع' : '← Back'}
      </button>

      {/* Member Info Card */}
      {member && (
        <div className="mtp-member-card">
          <div className="mtp-card-header">
            <img
              src={`/${getRankImage(member.memberRank || 'agent')}`}
              alt={getRankName(member.memberRank || 'agent', language)}
              className="mtp-rank-img"
            />
            <div>
              <h2 className="mtp-member-name">{member.name}</h2>
              <span className="mtp-rank-label">{getRankName(member.memberRank || 'agent', language)}</span>
            </div>
          </div>

          <div className="mtp-info-grid">
            <div className="mtp-info-item">
              <span className="mtp-info-label">{isAr ? 'اسم المستخدم' : 'Username'}</span>
              <span className="mtp-info-value">@{member.username || '-'}</span>
            </div>
            <div className="mtp-info-item">
              <span className="mtp-info-label">{isAr ? 'كود العضو' : 'Member Code'}</span>
              <span className="mtp-info-value code-badge">{member.subscriberCode || '-'}</span>
            </div>
            <div className="mtp-info-item">
              <span className="mtp-info-label">{isAr ? 'رقم الهاتف' : 'Phone'}</span>
              <span className="mtp-info-value">{member.phone || '-'}</span>
            </div>
            <div className="mtp-info-item">
              <span className="mtp-info-label">{isAr ? 'المدينة' : 'City'}</span>
              <span className="mtp-info-value">{member.city || '-'}</span>
            </div>
            <div className="mtp-info-item">
              <span className="mtp-info-label">{isAr ? 'اسم الراعي' : 'Sponsor'}</span>
              <span className="mtp-info-value">{member.sponsorId?.name || '-'}</span>
            </div>
            <div className="mtp-info-item">
              <span className="mtp-info-label">{isAr ? 'كود الراعي' : 'Sponsor Code'}</span>
              <span className="mtp-info-value">{member.sponsorCode || '-'}</span>
            </div>
            <div className="mtp-info-item">
              <span className="mtp-info-label">{isAr ? 'تاريخ الانضمام' : 'Join Date'}</span>
              <span className="mtp-info-value">{member.createdAt ? formatDate(member.createdAt) : '-'}</span>
            </div>
            <div className="mtp-info-item">
              <span className="mtp-info-label">{isAr ? 'الحالة' : 'Status'}</span>
              <span className={`mtp-info-value status-badge ${member.isActive !== false ? 'active' : 'suspended'}`}>
                {member.isActive !== false ? (isAr ? 'فعال' : 'Active') : (isAr ? 'موقوف' : 'Suspended')}
              </span>
            </div>
            <div className="mtp-info-item points-item">
              <span className="mtp-info-label">{isAr ? 'النقاط الشهرية' : 'Monthly Points'}</span>
              <span className="mtp-info-value points-val">⭐ {member.monthlyPoints || 0}</span>
            </div>
            <div className="mtp-info-item points-item">
              <span className="mtp-info-label">{isAr ? 'النقاط التراكمية' : 'Cumulative Points'}</span>
              <span className="mtp-info-value points-val">⭐ {member.cumulativePoints || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Team Section */}
      <div className="mtp-team-section">
        <h3 className="mtp-team-title">
          {isAr ? `🌟 فريق ${member?.name || ''}` : `🌟 ${member?.name || ''}'s Team`}
        </h3>

        {/* Stats */}
        {stats && stats.totalMembers > 0 && (
          <div className="mtp-stats-row">
            <div className="mtp-stat-box">
              <strong>{stats.totalMembers}</strong>
              <span>{isAr ? 'إجمالي الأعضاء' : 'Total Members'}</span>
            </div>
            <div className="mtp-stat-box">
              <strong>{(stats.totalPoints || 0).toLocaleString()}</strong>
              <span>{isAr ? 'إجمالي النقاط' : 'Total Points'}</span>
            </div>
            {[1, 2, 3, 4, 5].map(level => (
              <div key={level} className="mtp-stat-box" style={{ borderColor: getLevelColor(level) }}>
                <strong style={{ color: getLevelColor(level) }}>{stats.levelCounts?.[`level${level}`] || 0}</strong>
                <span>{isAr ? `المستوى ${level}` : `Level ${level}`}</span>
              </div>
            ))}
          </div>
        )}

        {teamMembers.length === 0 ? (
          <div className="mtp-empty">
            <span>👥</span>
            <p>{isAr ? 'لا يوجد أعضاء في فريق هذا العضو' : 'This member has no team yet'}</p>
          </div>
        ) : (
          <div className="mtp-levels">
            {[1, 2, 3, 4, 5].map(level => {
              const lvlMembers = membersByLevel[level] || [];
              if (lvlMembers.length === 0) return null;
              return (
                <div key={level} className="mtp-level-section">
                  <div
                    className="mtp-level-header"
                    onClick={() => toggleLevel(level)}
                    style={{ borderLeftColor: getLevelColor(level) }}
                  >
                    <div className="mtp-level-title">
                      <span className="mtp-level-badge" style={{ backgroundColor: getLevelColor(level) }}>
                        {isAr ? `المستوى ${level}` : `Level ${level}`}
                      </span>
                      <span>{lvlMembers.length} {isAr ? 'عضو' : 'members'}</span>
                    </div>
                    <span className={`expand-icon ${expandedLevels[level] ? 'expanded' : ''}`}>▼</span>
                  </div>

                  {expandedLevels[level] && (
                    <div className="mtp-table-wrap">
                      <table className="mtp-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>{isAr ? 'الاسم' : 'Name'}</th>
                            <th>{isAr ? 'اسم المستخدم' : 'Username'}</th>
                            <th>{isAr ? 'كود العضو' : 'Code'}</th>
                            <th>{isAr ? 'رقم الهاتف' : 'Phone'}</th>
                            <th>{isAr ? 'الرتبة' : 'Rank'}</th>
                            <th>{isAr ? 'النقاط' : 'Points'}</th>
                            <th>{isAr ? 'المدينة' : 'City'}</th>
                            <th>{isAr ? 'تاريخ الانضمام' : 'Joined'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lvlMembers.map((m, idx) => (
                            <tr key={m._id} className="mtp-clickable-row" onClick={() => handleMemberClick(m)}>
                              <td>{idx + 1}</td>
                              <td className="mtp-member-name">{m.name}</td>
                              <td>@{m.username}</td>
                              <td><span className="mtp-code-badge">{m.subscriberCode || '-'}</span></td>
                              <td>{m.phone || '-'}</td>
                              <td>
                                <div className="mtp-rank-cell">
                                  <img
                                    src={`/${getRankImage(m.memberRank || 'agent')}`}
                                    alt={getRankName(m.memberRank || 'agent', language)}
                                    style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                                  />
                                  <span>{getRankName(m.memberRank || 'agent', language)}</span>
                                </div>
                              </td>
                              <td><span className="mtp-points-badge">⭐ {m.monthlyPoints || 0}</span></td>
                              <td>{m.city || '-'}</td>
                              <td>{formatDate(m.createdAt)}</td>
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
        )}
      </div>
    </div>
  );
};

export default MemberTeamPage;
