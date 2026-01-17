import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/ProfitCalculation.css';

const ProfitCalculation = () => {
  const { language } = useLanguage();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [profitData, setProfitData] = useState(null);
  const [profitPeriods, setProfitPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfitPeriods();
  }, []);

  const fetchProfitPeriods = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/profits', {
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

    setCalculating(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('token');

      // Check if period is available
      await axios.post(
        'http://localhost:5000/api/admin/profits/check-period',
        { startDate, endDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Calculate profits
      const response = await axios.post(
        'http://localhost:5000/api/admin/profits/calculate',
        { startDate, endDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProfitData(response.data.data);
      setMessage(language === 'ar' ? 'تم احتساب الأرباح بنجاح!' : 'Profits calculated successfully!');
      fetchProfitPeriods();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل في احتساب الأرباح' : 'Failed to calculate profits'));
      setTimeout(() => setError(''), 5000);
    } finally {
      setCalculating(false);
    }
  };

  const handleClosePeriod = async (periodId) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من إغلاق هذه الفترة؟ لن يمكن احتسابها مرة أخرى.' : 'Are you sure you want to close this period? It cannot be recalculated.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/admin/profits/${periodId}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(language === 'ar' ? 'تم إغلاق الفترة بنجاح!' : 'Period closed successfully!');
      fetchProfitPeriods();
      if (profitData && profitData._id === periodId) {
        setProfitData({ ...profitData, status: 'closed' });
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
        `http://localhost:5000/api/admin/profits/${periodId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedPeriod(response.data.data);
      setProfitData(null);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل في تحميل البيانات' : 'Failed to load data'));
      setTimeout(() => setError(''), 3000);
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
    doc.text(`Total Members: ${periodData.totalMembers}`, 14, 40);
    doc.text(`Total Profits: $${periodData.totalProfits.toFixed(2)}`, 14, 48);
    doc.text(`Status: ${periodData.status.toUpperCase()}`, 14, 56);

    // Prepare table data
    const tableColumn = [
      'Rank',
      'Name',
      'Username',
      'Code',
      'Orders',
      'Sales',
      'Points',
      'Commission',
      'Profit'
    ];

    const tableRows = periodData.membersProfits
      .sort((a, b) => b.profitAmount - a.profitAmount)
      .map((member, index) => [
        index + 1,
        member.name,
        member.username,
        member.subscriberCode,
        member.totalOrders,
        `$${member.totalSales.toFixed(2)}`,
        member.totalPoints,
        `$${member.totalCommission.toFixed(2)}`,
        `$${member.profitAmount.toFixed(2)}`
      ]);

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
            <label>{language === 'ar' ? 'من تاريخ' : 'Start Date'}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="date-input-group">
            <label>{language === 'ar' ? 'إلى تاريخ' : 'End Date'}</label>
            <input
              type="date"
              value={endDate}
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
          <h3>{language === 'ar' ? 'الفترات السابقة' : 'Previous Periods'}</h3>
          <div className="periods-list">
            {profitPeriods.map((period) => (
              <div key={period._id} className="period-card">
                <div className="period-info">
                  <div className="period-dates">
                    {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                  </div>
                  <div className="period-stats">
                    <span>{language === 'ar' ? 'الأعضاء' : 'Members'}: {period.totalMembers}</span>
                    <span>{language === 'ar' ? 'الأرباح' : 'Profits'}: ${period.totalProfits.toFixed(2)}</span>
                    <span className={`status-badge ${period.status}`}>
                      {period.status === 'closed' ? (language === 'ar' ? 'مغلقة' : 'Closed') : (language === 'ar' ? 'محتسبة' : 'Calculated')}
                    </span>
                  </div>
                </div>
                <div className="period-actions">
                  <button onClick={() => handleViewPeriod(period._id)} className="view-btn">
                    👁️ {language === 'ar' ? 'عرض' : 'View'}
                  </button>
                  {period.status !== 'closed' && (
                    <button onClick={() => handleClosePeriod(period._id)} className="close-btn">
                      🔒 {language === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Table */}
      {displayData && (
        <div className="profit-results">
          <div className="results-header">
            <div>
              <h3>{language === 'ar' ? 'نتائج الاحتساب' : 'Calculation Results'}</h3>
              <p className="period-info-text">
                {language === 'ar' ? 'الفترة' : 'Period'}: {new Date(displayData.startDate).toLocaleDateString()} - {new Date(displayData.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="results-actions">
              <button onClick={() => exportToPDF(displayData)} className="export-btn">
                📄 {language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
              </button>
              {displayData.status !== 'closed' && (
                <button onClick={() => handleClosePeriod(displayData._id)} className="close-period-btn">
                  🔒 {language === 'ar' ? 'إغلاق الفترة' : 'Close Period'}
                </button>
              )}
            </div>
          </div>

          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-icon">👥</div>
              <div className="summary-content">
                <div className="summary-label">{language === 'ar' ? 'إجمالي الأعضاء' : 'Total Members'}</div>
                <div className="summary-value">{displayData.totalMembers}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">💰</div>
              <div className="summary-content">
                <div className="summary-label">{language === 'ar' ? 'إجمالي الأرباح' : 'Total Profits'}</div>
                <div className="summary-value">${displayData.totalProfits.toFixed(2)}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">{displayData.status === 'closed' ? '🔒' : '📊'}</div>
              <div className="summary-content">
                <div className="summary-label">{language === 'ar' ? 'الحالة' : 'Status'}</div>
                <div className="summary-value status-text">
                  {displayData.status === 'closed' ? (language === 'ar' ? 'مغلقة' : 'Closed') : (language === 'ar' ? 'محتسبة' : 'Calculated')}
                </div>
              </div>
            </div>
          </div>

          <div className="profit-table-wrapper">
            <table className="profit-table">
              <thead>
                <tr>
                  <th>{language === 'ar' ? 'الترتيب' : 'Rank'}</th>
                  <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</th>
                  <th>{language === 'ar' ? 'كود الإحالة' : 'Code'}</th>
                  <th>{language === 'ar' ? 'عدد الطلبات' : 'Orders'}</th>
                  <th>{language === 'ar' ? 'المبيعات' : 'Sales'}</th>
                  <th>{language === 'ar' ? 'النقاط' : 'Points'}</th>
                  <th>{language === 'ar' ? 'العمولة' : 'Commission'}</th>
                  <th>{language === 'ar' ? 'الربح' : 'Profit'}</th>
                </tr>
              </thead>
              <tbody>
                {displayData.membersProfits
                  .sort((a, b) => b.profitAmount - a.profitAmount)
                  .map((member, index) => (
                    <tr key={member._id || index}>
                      <td>
                        <span className={`rank-number rank-${index + 1}`}>{index + 1}</span>
                      </td>
                      <td className="member-name">{member.name}</td>
                      <td className="member-username">@{member.username}</td>
                      <td className="member-code">{member.subscriberCode}</td>
                      <td className="text-center">{member.totalOrders}</td>
                      <td className="text-right">${member.totalSales.toFixed(2)}</td>
                      <td className="text-center points-cell">{member.totalPoints}</td>
                      <td className="text-right commission-cell">${member.totalCommission.toFixed(2)}</td>
                      <td className="text-right profit-cell">${member.profitAmount.toFixed(2)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitCalculation;
