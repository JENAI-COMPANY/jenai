import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { getRankImageFromNumber, getRankNameFromNumber, getRankNumber, getRankImage, getRankName } from '../utils/rankHelpers';
import '../styles/MemberRanks.css';
import MobileDrawer from './MobileDrawer';

const MemberRanks = () => {
  const { language } = useLanguage();
  const [ranks, setRanks] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [downlineData, setDownlineData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [ranksRes, membersRes] = await Promise.all([
        axios.get('/api/admin/ranks', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setRanks(ranksRes.data.data);
      setMembers(membersRes.data.users.filter(u => u.role === 'member'));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'فشل تحميل البيانات');
      setLoading(false);
    }
  };

  const handleUpdateRanks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/admin/users/update-ranks',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(response.data.message);
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحديث الدرجات');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleViewDownline = async (memberId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/admin/users/${memberId}/downline`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDownlineData(response.data.data);
      setSelectedMember(members.find(m => m._id === memberId));
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحميل بيانات الشبكة');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getRankName = (rank) => {
    if (!ranks || !ranks[rank]) return `المرتبة ${rank}`;
    return language === 'ar' ? ranks[rank].name : ranks[rank].nameEn;
  };

  const getRankBadgeClass = (rank) => {
    // وكيل (1) - رمادي
    if (rank === 1) return 'rank-badge-agent';
    // برونزي (2) - برونزي
    if (rank === 2) return 'rank-badge-bronze';
    // فضي (3) - فضي
    if (rank === 3) return 'rank-badge-silver';
    // ذهبي (4) - ذهبي
    if (rank === 4) return 'rank-badge-gold';
    // ياقوتي (5) - أحمر/ياقوتي
    if (rank === 5) return 'rank-badge-ruby';
    // ماسي (6) - ماسي/أزرق فاتح
    if (rank === 6) return 'rank-badge-diamond';
    // ماسي ثنائي (7) - أزرق غامق
    if (rank === 7) return 'rank-badge-double-diamond';
    // سفير إقليمي (8) - بنفسجي
    if (rank === 8) return 'rank-badge-regional';
    // سفير عالمي (9) - ذهبي مع تدرج
    if (rank === 9) return 'rank-badge-global';

    return 'rank-badge-agent';
  };

  if (loading) {
    return (
      <div className="member-ranks loading">
        <div className="mr-spinner"></div>
        <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="member-ranks">
      <div className="mr-header">
        <h2>{language === 'ar' ? 'رتب جيناي' : 'Jenai Ranks'}</h2>
        <button className="mr-update-btn" onClick={handleUpdateRanks}>
          🔄 {language === 'ar' ? 'تحديث الدرجات تلقائياً' : 'Auto Update Ranks'}
        </button>
      </div>

      {error && <div className="mr-alert mr-alert-error">{error}</div>}
      {message && <div className="mr-alert mr-alert-success">{message}</div>}

      {/* Ranks Overview */}
      <div className="mr-ranks-grid">
        {ranks && Object.keys(ranks).map(rankNum => {
          const rank = ranks[rankNum];
          const membersInRank = members.filter(m => getRankNumber(m.memberRank) === parseInt(rankNum));

          return (
            <div key={rankNum} className={`mr-rank-card ${getRankBadgeClass(parseInt(rankNum))}`}>
              <div className="mr-rank-header">
                <img
                  src={`/${getRankImageFromNumber(parseInt(rankNum))}`}
                  alt={language === 'ar' ? rank.name : rank.nameEn}
                  style={{ width: '220px', height: '220px', objectFit: 'contain', marginBottom: '10px' }}
                />
                <h3>{language === 'ar' ? rank.name : rank.nameEn}</h3>
                <span className="mr-rank-number">{rankNum}</span>
              </div>
              <div className="mr-rank-details">
                <p>
                  <strong>{language === 'ar' ? 'النقاط التراكمية المطلوبة:' : 'Required Cumulative Points:'}</strong>{' '}
                  {rank.minCumulativePoints?.toLocaleString() || 0}
                </p>
                <p>
                  <strong>{language === 'ar' ? 'الخطوط البرونزية المطلوبة:' : 'Required Bronze Lines:'}</strong> {rank.minBronzeLines || 0}
                </p>
                <p>
                  <strong>{language === 'ar' ? 'عدد الأعضاء:' : 'Members:'}</strong> {membersInRank.length}
                </p>
                <div className="mr-commission-rates">
                  <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '8px' }}>
                    {language === 'ar' ? rank.description : rank.descriptionEn}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Members List */}
      <div className="mr-members-section">
        <h3>{language === 'ar' ? 'جميع الأعضاء' : 'All Members'}</h3>

        {/* Search Field */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder={language === 'ar' ? 'بحث بالاسم، اسم المستخدم أو كود الإحالة...' : 'Search by name, username or code...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e1e8ed',
              borderRadius: '8px',
              fontSize: '15px',
              outline: 'none'
            }}
          />
        </div>

        <div className="mr-table-wrapper">
          <table className="mr-table">
            <thead>
              <tr>
                <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                <th>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</th>
                <th>{language === 'ar' ? 'كود الإحالة' : 'Code'}</th>
                <th>{language === 'ar' ? 'الدرجة' : 'Rank'}</th>
                <th>{language === 'ar' ? 'النقاط' : 'Points'}</th>
                <th>{language === 'ar' ? 'الشبكة' : 'Downline'}</th>
                <th>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {members
                .filter(member => {
                  const searchLower = searchTerm.toLowerCase();
                  return member.name.toLowerCase().includes(searchLower) ||
                         member.username.toLowerCase().includes(searchLower) ||
                         (member.subscriberCode || '').toLowerCase().includes(searchLower);
                })
                .map(member => (
                <tr key={member._id}>
                  <td>{member.name}</td>
                  <td>{member.username}</td>
                  <td className="mr-code">{member.subscriberCode}</td>
                  <td>
                    <span className={`mr-rank-badge ${getRankBadgeClass(member.memberRank)}`}>
                      <img
                        src={`/${getRankImage(member.memberRank)}`}
                        alt={getRankName(member.memberRank)}
                        style={{ width: '25px', height: '25px', objectFit: 'contain', marginLeft: '5px', verticalAlign: 'middle' }}
                      />
                      {getRankName(member.memberRank)}
                    </span>
                  </td>
                  <td className="mr-points">{member.points?.toLocaleString() || 0}</td>
                  <td>{member.downline?.length || 0}</td>
                  <td>
                    <button
                      className="mr-view-downline-btn"
                      onClick={() => handleViewDownline(member._id)}
                    >
                      {language === 'ar' ? 'عرض الشبكة' : 'View Network'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Downline Modal - Mobile Version */}
      <MobileDrawer
        isOpen={!!(downlineData && selectedMember)}
        onClose={() => setDownlineData(null)}
        title={selectedMember ? `🌐 ${language === 'ar' ? 'شبكة العضو:' : 'Member Network:'} ${selectedMember.name}` : ''}
      >
        {downlineData && (
          <div>
            <div className="mr-member-summary">
              <div className="mr-summary-item">
                <label>{language === 'ar' ? 'الدرجة:' : 'Rank:'}</label>
                <span className={`mr-rank-badge ${getRankBadgeClass(downlineData.member.memberRank)}`}>
                  <img
                    src={`/${getRankImage(downlineData.member.memberRank)}`}
                    alt={getRankName(downlineData.member.memberRank)}
                    style={{ width: '30px', height: '30px', objectFit: 'contain', marginLeft: '8px', verticalAlign: 'middle' }}
                  />
                  {getRankName(downlineData.member.memberRank)}
                </span>
              </div>
              <div className="mr-summary-item">
                <label>{language === 'ar' ? 'إجمالي الشبكة:' : 'Total Network:'}</label>
                <span>{downlineData.statistics.totalDownline}</span>
              </div>
            </div>
            <div className="mr-downline-levels">
              {[1, 2, 3, 4, 5].map(level => {
                const levelKey = `level${level}`;
                const levelMembers = downlineData.downlineStructure?.[levelKey] || [];
                return (
                  <div key={level} className="mr-level-section">
                    <h4>
                      {language === 'ar' ? `المستوى ${level}` : `Level ${level}`}
                      <span className="mr-level-badge">
                        {levelMembers.length} {language === 'ar' ? 'عضو' : 'members'}
                      </span>
                    </h4>
                    {levelMembers.length > 0 ? (
                      <div className="mr-level-members">
                        {levelMembers.map(member => (
                          <div key={member._id} className="mr-level-member-card">
                            <div className="mr-member-info">
                              <strong>{member.name}</strong>
                              <small>@{member.username}</small>
                            </div>
                            <div className="mr-member-stats">
                              <span className={`mr-rank-badge ${getRankBadgeClass(member.memberRank)}`}>
                                <img
                                  src={`/${getRankImage(member.memberRank)}`}
                                  alt={`Rank ${member.memberRank}`}
                                  style={{ width: '25px', height: '25px', objectFit: 'contain' }}
                                />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mr-no-members">{language === 'ar' ? 'لا يوجد أعضاء في هذا المستوى' : 'No members in this level'}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </MobileDrawer>

      {/* Downline Modal - Desktop Version */}
      {downlineData && selectedMember && (
        <div className="mr-modal-overlay" onClick={() => setDownlineData(null)}>
          <div className="mr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mr-modal-header">
              <h3>
                {language === 'ar' ? 'شبكة العضو:' : 'Member Network:'} {selectedMember.name}
              </h3>
              <button className="mr-modal-close" onClick={() => setDownlineData(null)}>✕</button>
            </div>
            <div className="mr-modal-body">
              <div className="mr-member-summary">
                <div className="mr-summary-item">
                  <label>{language === 'ar' ? 'الدرجة:' : 'Rank:'}</label>
                  <span className={`mr-rank-badge ${getRankBadgeClass(downlineData.member.memberRank)}`}>
                    <img
                      src={`/${getRankImage(downlineData.member.memberRank)}`}
                      alt={getRankName(downlineData.member.memberRank)}
                      style={{ width: '30px', height: '30px', objectFit: 'contain', marginLeft: '8px', verticalAlign: 'middle' }}
                    />
                    {getRankName(downlineData.member.memberRank)}
                  </span>
                </div>
                <div className="mr-summary-item">
                  <label>{language === 'ar' ? 'إجمالي الشبكة:' : 'Total Network:'}</label>
                  <span>{downlineData.statistics.totalDownline}</span>
                </div>
              </div>
              <div className="mr-downline-levels">
                {[1, 2, 3, 4, 5].map(level => {
                  const levelKey = `level${level}`;
                  const levelMembers = downlineData.downlineStructure?.[levelKey] || [];
                  return (
                    <div key={level} className="mr-level-section">
                      <h4>
                        {language === 'ar' ? `المستوى ${level}` : `Level ${level}`}
                        <span className="mr-level-badge">
                          {levelMembers.length} {language === 'ar' ? 'عضو' : 'members'}
                        </span>
                      </h4>
                      {levelMembers.length > 0 ? (
                        <div className="mr-level-members">
                          {levelMembers.map(member => (
                            <div key={member._id} className="mr-level-member-card">
                              <div className="mr-member-info">
                                <strong>{member.name}</strong>
                                <small>@{member.username}</small>
                              </div>
                              <div className="mr-member-stats">
                                <span className={`mr-rank-badge ${getRankBadgeClass(member.memberRank)}`}>
                                  <img
                                    src={`/${getRankImage(member.memberRank)}`}
                                    alt={`Rank ${member.memberRank}`}
                                    style={{ width: '25px', height: '25px', objectFit: 'contain' }}
                                  />
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mr-no-members">{language === 'ar' ? 'لا يوجد أعضاء في هذا المستوى' : 'No members in this level'}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberRanks;
