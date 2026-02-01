import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../styles/ProfitPeriods.css';

const ProfitPeriods = () => {
  const { language } = useLanguage();
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCalculateForm, setShowCalculateForm] = useState(false);
  const [formData, setFormData] = useState({
    periodName: '',
    periodNumber: '',
    startDate: '',
    endDate: '',
    notes: ''
  });
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchProfitPeriods();
  }, []);

  const fetchProfitPeriods = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/profit-periods', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPeriods(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profit periods:', err);
      setError(err.response?.data?.message || 'فشل تحميل فترات الأرباح');
      setLoading(false);
    }
  };

  const fetchPeriodDetails = async (periodId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/profit-periods/${periodId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSelectedPeriod(response.data.data);
    } catch (err) {
      console.error('Error fetching period details:', err);
      setError(err.response?.data?.message || 'فشل تحميل تفاصيل الفترة');
    }
  };

  const handleCalculatePeriod = async (e) => {
    e.preventDefault();
    setCalculating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/profit-periods/calculate', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowCalculateForm(false);
      setFormData({
        periodName: '',
        periodNumber: '',
        startDate: '',
        endDate: '',
        notes: ''
      });
      fetchProfitPeriods();
      alert(language === 'ar' ? 'تم احتساب الأرباح بنجاح' : 'Profits calculated successfully');
    } catch (err) {
      console.error('Error calculating profits:', err);
      setError(err.response?.data?.message || 'فشل احتساب الأرباح');
    } finally {
      setCalculating(false);
    }
  };

  const handleDeletePeriod = async (periodId) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه الفترة؟' : 'Are you sure you want to delete this period?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/profit-periods/${periodId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchProfitPeriods();
      setSelectedPeriod(null);
      alert(language === 'ar' ? 'تم حذف الفترة بنجاح' : 'Period deleted successfully');
    } catch (err) {
      console.error('Error deleting period:', err);
      setError(err.response?.data?.message || 'فشل حذف الفترة');
    }
  };

  const handlePrintPDF = () => {
    if (!selectedPeriod) return;

    const doc = new jsPDF('landscape');

    // Add Arabic font support (using built-in fonts for now)
    const isArabic = language === 'ar';

    // Title
    doc.setFontSize(18);
    doc.setTextColor(31, 41, 55);
    const title = isArabic
      ? `تقرير الأرباح - ${selectedPeriod.periodName}`
      : `Profit Report - ${selectedPeriod.periodName}`;
    doc.text(title, 148, 20, { align: 'center' });

    // Period Info
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128);
    const periodInfo = isArabic
      ? `الفترة: ${new Date(selectedPeriod.startDate).toLocaleDateString('ar-EG')} - ${new Date(selectedPeriod.endDate).toLocaleDateString('ar-EG')}`
      : `Period: ${new Date(selectedPeriod.startDate).toLocaleDateString('en-US')} - ${new Date(selectedPeriod.endDate).toLocaleDateString('en-US')}`;
    doc.text(periodInfo, 148, 28, { align: 'center' });

    // Summary Section
    const summaryY = 40;
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);

    const summaryData = [
      [
        isArabic ? 'عدد الأعضاء' : 'Total Members',
        selectedPeriod.summary.totalMembers.toString()
      ],
      [
        isArabic ? 'أرباح الأداء' : 'Performance Profits',
        `${selectedPeriod.summary.totalPerformanceProfits.toFixed(2)} ILS`
      ],
      [
        isArabic ? 'عمولة القيادة' : 'Leadership Commission',
        `${selectedPeriod.summary.totalLeadershipProfits.toFixed(2)} ILS`
      ],
      [
        isArabic ? 'إجمالي الأرباح' : 'Total Profits',
        `${selectedPeriod.summary.totalProfits.toFixed(2)} ILS`
      ]
    ];

    doc.autoTable({
      startY: summaryY,
      head: [[isArabic ? 'الملخص' : 'Summary', isArabic ? 'القيمة' : 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
        fontSize: 11,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      columnStyles: {
        0: { fontStyle: 'bold' }
      }
    });

    // Members Table
    const membersTableY = doc.lastAutoTable.finalY + 10;

    const tableHeaders = isArabic
      ? ['#', 'الاسم', 'اسم المستخدم', 'الرتبة', 'النقاط الشخصية', 'نقاط الفريق', 'أرباح الأداء', 'عمولة القيادة', 'إجمالي الأرباح']
      : ['#', 'Name', 'Username', 'Rank', 'Personal Points', 'Team Points', 'Performance', 'Leadership', 'Total'];

    const tableBody = selectedPeriod.membersProfits
      .sort((a, b) => b.profit.totalProfit - a.profit.totalProfit)
      .map((mp, index) => {
        const teamPoints = mp.points.generation1 + mp.points.generation2 +
                          mp.points.generation3 + mp.points.generation4 + mp.points.generation5;
        return [
          (index + 1).toString(),
          mp.memberName,
          mp.username,
          isArabic ? mp.rankName : mp.rankNameEn,
          mp.points.personal.toLocaleString(),
          teamPoints.toLocaleString(),
          `${mp.profit.performanceProfit.toFixed(2)} ILS`,
          `${mp.profit.leadershipProfit.toFixed(2)} ILS`,
          `${mp.profit.totalProfit.toFixed(2)} ILS`
        ];
      });

    doc.autoTable({
      startY: membersTableY,
      head: [tableHeaders],
      body: tableBody,
      theme: 'striped',
      headStyles: {
        fillColor: [31, 41, 55],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 28 },
        7: { cellWidth: 28 },
        8: { cellWidth: 30, fontStyle: 'bold', textColor: [16, 185, 129] }
      },
      didDrawPage: function (data) {
        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        const footerText = isArabic
          ? `صفحة ${data.pageNumber} من ${pageCount} - تم الإنشاء في ${new Date().toLocaleDateString('ar-EG')}`
          : `Page ${data.pageNumber} of ${pageCount} - Generated on ${new Date().toLocaleDateString('en-US')}`;
        doc.text(footerText, 148, doc.internal.pageSize.height - 10, { align: 'center' });
      }
    });

    // Add notes if available
    if (selectedPeriod.notes) {
      const notesY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);
      doc.text(isArabic ? 'ملاحظات:' : 'Notes:', 14, notesY);
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      const splitNotes = doc.splitTextToSize(selectedPeriod.notes, 270);
      doc.text(splitNotes, 14, notesY + 6);
    }

    // Save the PDF
    const fileName = `${selectedPeriod.periodName.replace(/\s+/g, '_')}_Profit_Report.pdf`;
    doc.save(fileName);
  };

  if (loading) {
    return (
      <div className="profit-periods loading">
        <div className="spinner"></div>
        <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="profit-periods">
      {/* Header */}
      <div className="pp-header">
        <h2>
          {language === 'ar' ? '📊 فترات الأرباح' : '📊 Profit Periods'}
        </h2>
        <button
          className="btn-calculate"
          onClick={() => setShowCalculateForm(!showCalculateForm)}
        >
          {language === 'ar' ? '+ احتساب دورة جديدة' : '+ Calculate New Period'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Calculate Form */}
      {showCalculateForm && (
        <div className="calculate-form-container">
          <h3>{language === 'ar' ? 'احتساب دورة أرباح جديدة' : 'Calculate New Profit Period'}</h3>
          <form onSubmit={handleCalculatePeriod} className="calculate-form" autoComplete="off">
            <div className="form-row">
              <div className="form-group">
                <label>{language === 'ar' ? 'اسم الدورة' : 'Period Name'}</label>
                <input
                  type="text"
                  required
                  value={formData.periodName}
                  onChange={(e) => setFormData({ ...formData, periodName: e.target.value })}
                  placeholder={language === 'ar' ? 'مثال: دورة يناير 2024' : 'Example: January 2024 Period'}
                />
              </div>
              <div className="form-group">
                <label>{language === 'ar' ? 'رقم الدورة' : 'Period Number'}</label>
                <input
                  type="number"
                  required
                  value={formData.periodNumber}
                  onChange={(e) => setFormData({ ...formData, periodNumber: e.target.value })}
                  placeholder={language === 'ar' ? 'مثال: 1' : 'Example: 1'}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{language === 'ar' ? 'تاريخ البداية' : 'Start Date'}</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>{language === 'ar' ? 'تاريخ النهاية' : 'End Date'}</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={language === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Additional notes (optional)'}
                rows="3"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={calculating}>
                {calculating
                  ? (language === 'ar' ? 'جاري الحساب...' : 'Calculating...')
                  : (language === 'ar' ? 'احتساب الأرباح' : 'Calculate Profits')}
              </button>
              <button type="button" className="btn-cancel" onClick={() => setShowCalculateForm(false)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Periods List */}
      <div className="periods-list">
        <h3>{language === 'ar' ? 'الدورات المحتسبة' : 'Calculated Periods'}</h3>
        {periods.length === 0 ? (
          <div className="no-periods">
            <p>{language === 'ar' ? 'لا توجد دورات محتسبة بعد' : 'No periods calculated yet'}</p>
          </div>
        ) : (
          <table className="periods-table">
            <thead>
              <tr>
                <th>{language === 'ar' ? 'رقم الدورة' : 'Period #'}</th>
                <th>{language === 'ar' ? 'اسم الدورة' : 'Period Name'}</th>
                <th>{language === 'ar' ? 'الفترة' : 'Duration'}</th>
                <th>{language === 'ar' ? 'عدد الأعضاء' : 'Members'}</th>
                <th>{language === 'ar' ? 'إجمالي الأرباح' : 'Total Profits'}</th>
                <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
                <th>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period._id}>
                  <td>#{period.periodNumber}</td>
                  <td>{period.periodName}</td>
                  <td>
                    {new Date(period.startDate).toLocaleDateString('ar-EG')} - {new Date(period.endDate).toLocaleDateString('ar-EG')}
                  </td>
                  <td>{period.summary.totalMembers}</td>
                  <td className="profit-amount">{period.summary.totalProfits.toFixed(2)} ₪</td>
                  <td>
                    <span className={`status-badge status-${period.status}`}>
                      {language === 'ar'
                        ? period.status === 'finalized' ? 'محتسب' : period.status === 'paid' ? 'مدفوع' : 'مسودة'
                        : period.status === 'finalized' ? 'Finalized' : period.status === 'paid' ? 'Paid' : 'Draft'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn-view"
                      onClick={() => fetchPeriodDetails(period._id)}
                    >
                      {language === 'ar' ? 'عرض' : 'View'}
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeletePeriod(period._id)}
                    >
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Period Details */}
      {selectedPeriod && (
        <div className="period-details">
          <div className="details-header">
            <h3>
              {language === 'ar' ? `تفاصيل ${selectedPeriod.periodName}` : `${selectedPeriod.periodName} Details`}
            </h3>
            <div className="header-actions">
              <button className="btn-print" onClick={handlePrintPDF}>
                🖨️ {language === 'ar' ? 'طباعة PDF' : 'Print PDF'}
              </button>
              <button className="btn-close" onClick={() => setSelectedPeriod(null)}>
                ✕
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-icon">👥</div>
              <div className="card-content">
                <h4>{language === 'ar' ? 'عدد الأعضاء' : 'Total Members'}</h4>
                <div className="card-value">{selectedPeriod.summary.totalMembers}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">⚜️</div>
              <div className="card-content">
                <h4>{language === 'ar' ? 'أرباح الأداء' : 'Performance Profits'}</h4>
                <div className="card-value">{selectedPeriod.summary.totalPerformanceProfits.toFixed(2)} ₪</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">🎖️</div>
              <div className="card-content">
                <h4>{language === 'ar' ? 'عمولة القيادة' : 'Leadership Commission'}</h4>
                <div className="card-value">{selectedPeriod.summary.totalLeadershipProfits.toFixed(2)} ₪</div>
              </div>
            </div>
            <div className="summary-card total">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <h4>{language === 'ar' ? 'إجمالي الأرباح' : 'Total Profits'}</h4>
                <div className="card-value">{selectedPeriod.summary.totalProfits.toFixed(2)} ₪</div>
              </div>
            </div>
          </div>

          {/* Members Profits Table */}
          <div className="members-profits">
            <h4>{language === 'ar' ? 'تفاصيل أرباح الأعضاء' : 'Members Profits Details'}</h4>
            <table className="members-table">
              <thead>
                <tr>
                  <th>{language === 'ar' ? '#' : '#'}</th>
                  <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</th>
                  <th>{language === 'ar' ? 'الرتبة' : 'Rank'}</th>
                  <th>{language === 'ar' ? 'النقاط الشخصية' : 'Personal Points'}</th>
                  <th>{language === 'ar' ? 'نقاط الفريق' : 'Team Points'}</th>
                  <th>{language === 'ar' ? 'أرباح الأداء' : 'Performance'}</th>
                  <th>{language === 'ar' ? 'عمولة القيادة' : 'Leadership'}</th>
                  <th>{language === 'ar' ? 'إجمالي الأرباح' : 'Total'}</th>
                </tr>
              </thead>
              <tbody>
                {selectedPeriod.membersProfits
                  .sort((a, b) => b.profit.totalProfit - a.profit.totalProfit)
                  .map((mp, index) => {
                    const teamPoints = mp.points.generation1 + mp.points.generation2 + mp.points.generation3 + mp.points.generation4 + mp.points.generation5;
                    return (
                      <tr key={mp.memberId}>
                        <td>{index + 1}</td>
                        <td>{mp.memberName}</td>
                        <td>{mp.username}</td>
                        <td>
                          <span className="rank-badge">{language === 'ar' ? mp.rankName : mp.rankNameEn}</span>
                        </td>
                        <td>{mp.points.personal.toLocaleString()}</td>
                        <td>{teamPoints.toLocaleString()}</td>
                        <td className="profit-cell">{mp.profit.performanceProfit.toFixed(2)} ₪</td>
                        <td className="profit-cell">{mp.profit.leadershipProfit.toFixed(2)} ₪</td>
                        <td className="total-profit-cell">{mp.profit.totalProfit.toFixed(2)} ₪</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {selectedPeriod.notes && (
            <div className="period-notes">
              <h4>{language === 'ar' ? 'ملاحظات' : 'Notes'}</h4>
              <p>{selectedPeriod.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfitPeriods;
