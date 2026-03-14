import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/ProfitCalculation.css';

const ProfitCalculation = () => {
  const { language } = useLanguage();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [periodName, setPeriodName] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [profitData, setProfitData] = useState(null);
  const [profitPeriods, setProfitPeriods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // أقدم تاريخ مسموح به = تاريخ نهاية آخر فترة مغلقة (مسموح البداية من نفس اليوم)
  const minAllowedDate = profitPeriods
    .filter(p => p.status === 'closed' || p.status === 'paid')
    .reduce((latest, p) => {
      const end = new Date(p.endDate);
      return end > latest ? end : latest;
    }, new Date(0));
  const minDateStr = minAllowedDate.getTime() === new Date(0).getTime()
    ? ''
    : minAllowedDate.toISOString().split('T')[0];
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPreviousPeriods, setShowPreviousPeriods] = useState(true);
  const resultsRef = useRef(null);

  useEffect(() => {
    fetchProfitPeriods();
  }, []);

  const fetchProfitPeriods = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/profit-periods', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfitPeriods(response.data.data || []);
    } catch (err) {
      console.error('Error fetching profit periods:', err);
    }
  };

  const handleCalculate = async () => {
    if (!startDate || !endDate) {
      setError(language === 'ar' ? 'يرجى تحديد تاريخ البداية والنهاية' : 'Please select start and end dates');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!periodName) {
      setError(language === 'ar' ? 'يرجى إدخال اسم الدورة' : 'Please enter period name');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setCalculating(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('token');

      // Calculate profits with period name
      const response = await axios.post(
        '/api/profit-periods/calculate',
        {
          startDate,
          endDate,
          periodName
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(language === 'ar' ? 'تم احتساب الأرباح بنجاح!' : 'Profits calculated successfully!');
      fetchProfitPeriods();
      // Clear form
      setStartDate('');
      setEndDate('');
      setPeriodName('');
      setTimeout(() => setMessage(''), 3000);

      // Fetch full period data to display the results table
      const periodId = response.data.data.periodId;
      if (periodId) {
        const fullPeriod = await axios.get(
          `/api/profit-periods/${periodId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSelectedPeriod(fullPeriod.data.data);
        setProfitData(null);
        setTimeout(() => {
          if (resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل في احتساب الأرباح' : 'Failed to calculate profits'));
      setTimeout(() => setError(''), 5000);
    } finally {
      setCalculating(false);
    }
  };

  const handleDeletePeriod = async (periodId) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من إلغاء هذه الفترة؟ سيتم حذفها نهائياً.' : 'Are you sure you want to cancel this period? It will be permanently deleted.')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/profit-periods/${periodId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(language === 'ar' ? 'تم إلغاء الفترة بنجاح' : 'Period cancelled successfully');
      if (selectedPeriod?._id === periodId) setSelectedPeriod(null);
      if (profitData?._id === periodId) setProfitData(null);
      fetchProfitPeriods();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل في إلغاء الفترة' : 'Failed to cancel period'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleClosePeriod = async (periodId) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من إغلاق هذه الفترة؟ لن يمكن احتسابها مرة أخرى.' : 'Are you sure you want to close this period? It cannot be recalculated.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/profit-periods/${periodId}/status`,
        { status: 'paid' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(language === 'ar' ? 'تم إغلاق الفترة بنجاح!' : 'Period closed successfully!');
      fetchProfitPeriods();
      if (profitData && profitData._id === periodId) {
        setProfitData({ ...profitData, status: 'paid' });
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل في إغلاق الفترة' : 'Failed to close period'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleViewPeriod = async (periodId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/profit-periods/${periodId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedPeriod(response.data.data);
      setProfitData(null);
      // Auto-scroll to results after state update
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err) {
      console.error('Error viewing period:', err);
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل في تحميل البيانات' : 'Failed to load data'));
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();
    const periodData = data || profitData;

    if (!periodData) return;

    // Add title
    doc.setFontSize(18);
    doc.text('Profit Calculation Report', 14, 22);

    // Add period info
    doc.setFontSize(12);
    doc.text(`Period: ${new Date(periodData.startDate).toLocaleDateString()} - ${new Date(periodData.endDate).toLocaleDateString()}`, 14, 32);
    doc.text(`Total Members: ${periodData.totalMembers || periodData.summary?.totalMembers || 0}`, 14, 40);
    doc.text(`Total Profits: ₪${(periodData.totalProfits || periodData.summary?.totalProfits || 0).toFixed(2)}`, 14, 48);
    doc.text(`Status: ${periodData.status.toUpperCase()}`, 14, 56);

    // Prepare table data
    const tableColumn = [
      '#',
      language === 'ar' ? 'الاسم' : 'Name',
      language === 'ar' ? 'المستخدم' : 'Username',
      language === 'ar' ? 'الرتبة' : 'Rank',
      language === 'ar' ? 'نقاط شخصية' : 'Personal Pts',
      language === 'ar' ? 'نقاط أجيال' : 'Generation Pts',
      language === 'ar' ? 'عمولة شخصية' : 'Personal Comm',
      language === 'ar' ? 'عمولة أجيال' : 'Generation Comm',
      language === 'ar' ? 'قيادة' : 'Leadership',
      language === 'ar' ? 'عمولة زبون' : 'Cust. Comm',
      language === 'ar' ? 'قبل الخصم' : 'Before Ded.',
      language === 'ar' ? 'خصم 3%' : '3% Ded.',
      language === 'ar' ? 'النهائي' : 'Final'
    ];

    const tableRows = periodData.membersProfits
      .sort((a, b) => (b.profit?.totalProfit || b.profitAmount || 0) - (a.profit?.totalProfit || a.profitAmount || 0))
      .map((member, index) => {
        // 1. النقاط الشخصية
        const personalPts = member.points?.personal || member.totalPoints || 0;

        // 2. نقاط الأجيال (مجموع نقاط الأجيال الخام)
        const gen1Pts = member.points?.generation1 || 0;
        const gen2Pts = member.points?.generation2 || 0;
        const gen3Pts = member.points?.generation3 || 0;
        const gen4Pts = member.points?.generation4 || 0;
        const gen5Pts = member.points?.generation5 || 0;
        const teamPts = gen1Pts + gen2Pts + gen3Pts + gen4Pts + gen5Pts;

        // 3. حساب أرباح الأداء الشخصي: (نقاط × 20% × 0.55)
        const personalComm = Math.floor(personalPts * 0.20 * 0.55);

        // 4. حساب أرباح الأجيال: تأتي محسوبة من الباك اند (بعد تطبيق النسب × 0.55)
        const teamComm = Math.floor(member.profit?.teamProfit || 0);

        // 5. أرباح القيادة (تأتي محسوبة من الباك اند)
        const leadProfit = Math.floor(member.profit?.leadershipProfit || 0);

        // 6. عمولة شراء الزبون (تأتي محسوبة من الباك اند)
        const customerCommission = member.profit?.customerPurchaseCommission || 0;

        // 7. قبل الخصم
        const totalBeforeDeduction = member.profit?.totalProfitBeforeDeduction || (personalComm + teamComm + leadProfit + customerCommission);

        // 8. خصم تطوير الموقع 3%
        const websiteCommission = member.profit?.websiteDevelopmentCommission || 0;

        // 9. الناتج النهائي بعد الخصم
        const finalProfit = member.profit?.totalProfit || 0;

        return [
          index + 1,
          member.memberName || member.name,
          member.username,
          language === 'ar' ? (member.rankName || '-') : (member.rankNameEn || '-'),
          personalPts.toLocaleString(),
          teamPts.toLocaleString(),
          `₪${personalComm}`,
          `₪${teamComm}`,
          `₪${leadProfit}`,
          `₪${customerCommission.toFixed(2)}`,
          `₪${totalBeforeDeduction.toFixed(2)}`,
          `-₪${websiteCommission.toFixed(2)}`,
          `₪${finalProfit}`
        ];
      });

    // Generate table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 65,
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    // Save PDF
    doc.save(`profit-report-${new Date(periodData.startDate).toISOString().split('T')[0]}.pdf`);
    setMessage(language === 'ar' ? 'تم تصدير التقرير بنجاح!' : 'Report exported successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const displayData = selectedPeriod || profitData;

  return (
    <div className="profit-calc-container">
      <div className="profit-calc-header">
        <h2>{language === 'ar' ? 'احتساب الأرباح' : 'Profit Calculation'}</h2>
      </div>

      {message && <div className="profit-success">{message}</div>}
      {error && <div className="profit-error">{error}</div>}

      {/* Calculation Form */}
      <div className="profit-calc-form">
        <h3>{language === 'ar' ? 'احتساب فترة جديدة' : 'Calculate New Period'}</h3>
        <div className="date-inputs">
          <div className="date-input-group">
            <label>{language === 'ar' ? 'اسم الدورة' : 'Period Name'} *</label>
            <input
              type="text"
              value={periodName}
              onChange={(e) => setPeriodName(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: دورة يناير 2024' : 'Example: January 2024 Period'}
            />
          </div>
          <div className="date-input-group">
            <label>{language === 'ar' ? 'من تاريخ' : 'Start Date'} *</label>
            <input
              type="date"
              value={startDate}
              min={minDateStr}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="date-input-group">
            <label>{language === 'ar' ? 'إلى تاريخ' : 'End Date'} *</label>
            <input
              type="date"
              value={endDate}
              min={startDate || minDateStr}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            className="calculate-btn"
            onClick={handleCalculate}
            disabled={calculating}
          >
            {calculating ? (language === 'ar' ? 'جاري الاحتساب...' : 'Calculating...') : (language === 'ar' ? 'احتساب الأرباح' : 'Calculate Profits')}
          </button>
        </div>
      </div>

      {/* Previous Periods */}
      {profitPeriods.length > 0 && (
        <div className="profit-periods-section">
          <div className="periods-header">
            <h3>{language === 'ar' ? 'الفترات السابقة' : 'Previous Periods'}</h3>
            <button
              className="toggle-periods-btn"
              onClick={() => setShowPreviousPeriods(!showPreviousPeriods)}
            >
              {showPreviousPeriods ? (
                <>👁️‍🗨️ {language === 'ar' ? 'إخفاء' : 'Hide'}</>
              ) : (
                <>👁️ {language === 'ar' ? 'إظهار' : 'Show'}</>
              )}
            </button>
          </div>
          {showPreviousPeriods && <div className="periods-list">
            {profitPeriods.map((period) => (
              <div key={period._id} className="period-card">
                <div className="period-info">
                  <div className="period-name-header">
                    <strong>{period.periodName || `${language === 'ar' ? 'الدورة' : 'Period'} #${period.periodNumber || ''}`}</strong>
                  </div>
                  <div className="period-dates">
                    {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                  </div>
                  <div className="period-stats">
                    <span>{language === 'ar' ? 'الأعضاء' : 'Members'}: {period.totalMembers || period.summary?.totalMembers || 0}</span>
                    <span>{language === 'ar' ? 'الأرباح' : 'Profits'}: ₪{(period.totalProfits || period.summary?.totalProfits || 0).toFixed(2)}</span>
                    <span className={`status-badge ${period.status}`}>
                      {period.status === 'paid' ? (language === 'ar' ? 'مغلقة' : 'Closed') : (language === 'ar' ? 'محتسبة' : 'Calculated')}
                    </span>
                  </div>
                </div>
                <div className="period-actions">
                  <button
                    onClick={() => handleViewPeriod(period._id)}
                    className={`view-btn ${selectedPeriod?._id === period._id ? 'active' : ''}`}
                    disabled={loading}
                  >
                    👁️ {loading && selectedPeriod?._id === period._id ? (language === 'ar' ? 'جاري التحميل...' : 'Loading...') : (language === 'ar' ? 'عرض' : 'View')}
                  </button>
                  {period.status !== 'paid' && (
                    <>
                      <button onClick={() => handleClosePeriod(period._id)} className="close-btn">
                        🔒 {language === 'ar' ? 'إغلاق' : 'Close'}
                      </button>
                      <button onClick={() => handleDeletePeriod(period._id)} className="delete-btn" style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                        🗑️ {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="profit-loading" style={{ textAlign: 'center', padding: '20px' }}>
          <p>{language === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...'}</p>
        </div>
      )}

      {/* Results Table */}
      {displayData && (
        <div className="profit-results" ref={resultsRef}>
          <div className="results-header">
            <div>
              <h3>{language === 'ar' ? 'نتائج الاحتساب' : 'Calculation Results'}</h3>
              <p className="period-name-display">
                {displayData.periodName || `${language === 'ar' ? 'الدورة' : 'Period'} #${displayData.periodNumber || ''}`}
              </p>
              <p className="period-info-text">
                {language === 'ar' ? 'الفترة' : 'Period'}: {new Date(displayData.startDate).toLocaleDateString()} - {new Date(displayData.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="results-actions">
              <button onClick={() => exportToPDF(displayData)} className="export-btn">
                📄 {language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
              </button>
              {displayData.status !== 'paid' && (
                <>
                  <button onClick={() => handleClosePeriod(displayData._id)} className="close-period-btn">
                    🔒 {language === 'ar' ? 'إغلاق الفترة' : 'Close Period'}
                  </button>
                  <button onClick={() => handleDeletePeriod(displayData._id)} className="close-period-btn" style={{ background: '#ef4444', borderColor: '#ef4444' }}>
                    🗑️ {language === 'ar' ? 'إلغاء الفترة' : 'Cancel Period'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-icon">👥</div>
              <div className="summary-content">
                <div className="summary-label">{language === 'ar' ? 'إجمالي الأعضاء' : 'Total Members'}</div>
                <div className="summary-value">{displayData.totalMembers || displayData.summary?.totalMembers || 0}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">💰</div>
              <div className="summary-content">
                <div className="summary-label">{language === 'ar' ? 'إجمالي الأرباح' : 'Total Profits'}</div>
                <div className="summary-value">₪{(displayData.totalProfits || displayData.summary?.totalProfits || 0).toFixed(2)}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">✂️</div>
              <div className="summary-content">
                <div className="summary-label">{language === 'ar' ? 'إجمالي خصم الموقع 3%' : 'Total Site Deduction 3%'}</div>
                <div className="summary-value" style={{color:'#e74c3c'}}>
                  -₪{((displayData.membersProfits || []).reduce((sum, m) => sum + (m.profit?.websiteDevelopmentCommission || 0), 0)).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">{displayData.status === 'paid' ? '🔒' : '📊'}</div>
              <div className="summary-content">
                <div className="summary-label">{language === 'ar' ? 'الحالة' : 'Status'}</div>
                <div className="summary-value status-text">
                  {displayData.status === 'paid' ? (language === 'ar' ? 'مغلقة' : 'Closed') : (language === 'ar' ? 'محتسبة' : 'Calculated')}
                </div>
              </div>
            </div>
          </div>

          <div style={{ margin: '16px 0' }}>
            <input
              type="text"
              placeholder={language === 'ar' ? 'بحث بالاسم أو اليوزر أو الكود...' : 'Search by name, username or code...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, outline: 'none' }}
            />
          </div>

          <div className="profit-table-wrapper">
            <table className="profit-table">
              <thead>
                <tr>
                  <th>{language === 'ar' ? 'الترتيب' : 'Rank'}</th>
                  <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</th>
                  <th>{language === 'ar' ? 'كود العضو' : 'Member Code'}</th>
                  <th>{language === 'ar' ? 'الرتبة' : 'Member Rank'}</th>
                  <th>{language === 'ar' ? 'النقاط الشخصية' : 'Personal Pts'}</th>
                  <th>{language === 'ar' ? 'نقاط الأجيال' : 'Generation Pts'}</th>
                  <th>{language === 'ar' ? 'عمولة شخصية' : 'Personal Comm'}</th>
                  <th>{language === 'ar' ? 'عمولة الأجيال' : 'Generation Comm'}</th>
                  <th>{language === 'ar' ? 'عمولة القيادة' : 'Leadership'}</th>
                  <th>{language === 'ar' ? 'عمولة شراء زبون' : 'Customer Comm'}</th>
                  <th>{language === 'ar' ? 'قبل الخصم' : 'Before Deduction'}</th>
                  <th>{language === 'ar' ? 'خصم الموقع 3%' : 'Site Deduction 3%'}</th>
                  <th>{language === 'ar' ? 'الناتج النهائي' : 'Final Total'}</th>
                </tr>
              </thead>
              <tbody>
                {(displayData.membersProfits || [])
                  .filter(m => {
                    if (!searchTerm) return true;
                    const s = searchTerm.toLowerCase();
                    return (m.memberName || '').toLowerCase().includes(s) ||
                           (m.username || '').toLowerCase().includes(s) ||
                           (m.subscriberCode || '').toLowerCase().includes(s);
                  })
                  .sort((a, b) => (b.profit?.totalProfit || b.profitAmount || 0) - (a.profit?.totalProfit || a.profitAmount || 0))
                  .map((member, index) => {
                    // 1. النقاط الشخصية
                    const personalPts = member.points?.personal || member.totalPoints || 0;

                    // 2. نقاط الأجيال (مجموع نقاط الأجيال الخام)
                    const gen1Pts = member.points?.generation1 || 0;
                    const gen2Pts = member.points?.generation2 || 0;
                    const gen3Pts = member.points?.generation3 || 0;
                    const gen4Pts = member.points?.generation4 || 0;
                    const gen5Pts = member.points?.generation5 || 0;
                    const teamPts = gen1Pts + gen2Pts + gen3Pts + gen4Pts + gen5Pts;

                    // 3. حساب أرباح الأداء الشخصي: (نقاط × 20% × 0.55)
                    const personalComm = Math.floor(personalPts * 0.20 * 0.55);

                    // 4. حساب أرباح الأجيال: تأتي محسوبة من الباك اند (بعد تطبيق النسب × 0.55)
                    const teamComm = Math.floor(member.profit?.teamProfit || 0);

                    // 5. أرباح القيادة (تأتي محسوبة من الباك اند)
                    const leadProfit = Math.floor(member.profit?.leadershipProfit || 0);

                    // 6. عمولة شراء الزبون (تأتي محسوبة من الباك اند)
                    const customerCommission = member.profit?.customerPurchaseCommission || 0;

                    // 7. قبل الخصم
                    const totalBeforeDeduction = member.profit?.totalProfitBeforeDeduction || (personalComm + teamComm + leadProfit + customerCommission);

                    // 8. خصم تطوير الموقع 3%
                    const websiteCommission = member.profit?.websiteDevelopmentCommission || 0;

                    // 9. الناتج النهائي بعد الخصم
                    const finalProfit = member.profit?.totalProfit || 0;

                    // Debug: طباعة البيانات للتحقق
                    if (index === 0) {
                      console.log('🔍 بيانات العضو الأول:', {
                        memberName: member.memberName,
                        profitObject: member.profit,
                        totalBeforeDeduction,
                        websiteCommission,
                        finalProfit
                      });
                    }

                    return (
                      <tr key={member._id || index}>
                        <td>
                          <span className={`rank-number rank-${index + 1}`}>{index + 1}</span>
                        </td>
                        <td className="member-name">{member.memberName || member.name}</td>
                        <td className="member-username">@{member.username}</td>
                        <td style={{fontSize:13,color:'#666'}}>{member.subscriberCode || '-'}</td>
                        <td>{language === 'ar' ? (member.rankName || '-') : (member.rankNameEn || '-')}</td>
                        <td className="text-center points-cell">{personalPts.toLocaleString()}</td>
                        <td className="text-center points-cell">{teamPts.toLocaleString()}</td>
                        <td className="text-right commission-cell">₪{personalComm}</td>
                        <td className="text-right commission-cell">₪{teamComm}</td>
                        <td className="text-right commission-cell">₪{leadProfit}</td>
                        <td className="text-right commission-cell" style={{color: '#27ae60'}}>₪{customerCommission.toFixed(2)}</td>
                        <td className="text-right commission-cell">₪{totalBeforeDeduction.toFixed(2)}</td>
                        <td className="text-right deduction-cell" style={{color: '#e74c3c'}}>-₪{websiteCommission.toFixed(2)}</td>
                        <td className="text-right profit-cell" style={{fontWeight: 'bold'}}>₪{finalProfit}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitCalculation;
