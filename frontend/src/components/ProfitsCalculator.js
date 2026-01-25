import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import '../styles/ProfitsCalculator.css';

const ProfitsCalculator = () => {
  const { language } = useLanguage();
  const [profitsData, setProfitsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfits();
  }, []);

  const fetchProfits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/profits/my-profits', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProfitsData(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profits:', err);
      setError(err.response?.data?.message || 'فشل تحميل بيانات الأرباح');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profits-calculator loading">
        <div className="spinner"></div>
        <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profits-calculator error">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!profitsData) return null;

  const { member, points, commissions, profit, breakdown } = profitsData;

  return (
    <div className="profits-calculator">
      {/* Header */}
      <div className="profits-header">
        <h2>
          {language === 'ar' ? '💰 حاسبة الأرباح' : '💰 Profits Calculator'}
        </h2>
        <p className="subtitle">
          {language === 'ar'
            ? `نظام احتساب النقاط والأرباح - ${member.rankName} (${member.rankNameEn})`
            : `Points and Profits Calculation - ${member.rankNameEn} (${member.rankName})`}
        </p>
      </div>

      {/* Final Profit Card */}
      <div className="final-profit-card">
        <div className="profit-icon">💵</div>
        <div className="profit-details">
          <h3>{language === 'ar' ? 'إجمالي الأرباح المستحقة' : 'Total Earned Profits'}</h3>
          <div className="profit-amount">{profit.formattedAmount}</div>
          <p className="profit-note">
            {language === 'ar'
              ? `أرباح الأداء: ${profit.performanceProfit.toFixed(2)} ₪ + عمولة القيادة: ${profit.leadershipProfit.toFixed(2)} ₪`
              : `Performance: ${profit.performanceProfit.toFixed(2)} ₪ + Leadership: ${profit.leadershipProfit.toFixed(2)} ₪`}
          </p>
        </div>
      </div>

      {/* Points Summary */}
      <div className="section">
        <h3 className="section-title">
          {language === 'ar' ? '📊 ملخص النقاط' : '📊 Points Summary'}
        </h3>
        <div className="points-grid">
          <div className="point-card personal">
            <div className="card-icon">👤</div>
            <div className="card-content">
              <h4>{language === 'ar' ? 'الأداء الشخصي' : 'Personal Performance'}</h4>
              <div className="point-value">{points.personal.toLocaleString()}</div>
              <p className="point-label">{language === 'ar' ? 'نقطة' : 'Points'}</p>
            </div>
          </div>

          {[1, 2, 3, 4, 5].map(gen => (
            <div key={gen} className={`point-card generation gen-${gen}`}>
              <div className="card-icon">🌳</div>
              <div className="card-content">
                <h4>{language === 'ar' ? `الجيل ${gen}` : `Generation ${gen}`}</h4>
                <div className="point-value">{points[`generation${gen}`].toLocaleString()}</div>
                <p className="point-label">{language === 'ar' ? 'نقطة' : 'Points'}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="total-points">
          <span>{language === 'ar' ? 'إجمالي النقاط:' : 'Total Points:'}</span>
          <strong>{points.total.toLocaleString()}</strong>
        </div>
      </div>

      {/* Performance Commissions Breakdown */}
      <div className="section">
        <h3 className="section-title">
          {language === 'ar' ? '⚜️ عمولات الأداء' : '⚜️ Performance Commissions'}
        </h3>
        <div className="commissions-table">
          <table>
            <thead>
              <tr>
                <th>{language === 'ar' ? 'المصدر' : 'Source'}</th>
                <th>{language === 'ar' ? 'النقاط' : 'Points'}</th>
                <th>{language === 'ar' ? 'النسبة' : 'Rate'}</th>
                <th>{language === 'ar' ? 'نقاط العمولة' : 'Commission Points'}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="personal-row">
                <td>
                  <span className="source-icon">👤</span>
                  {language === 'ar' ? 'الأداء الشخصي' : 'Personal Performance'}
                </td>
                <td>{breakdown.personal.points.toLocaleString()}</td>
                <td className="percentage">{(breakdown.personal.rate * 100).toFixed(0)}%</td>
                <td className="commission-value">{breakdown.personal.commission.toFixed(2)}</td>
              </tr>
              {[1, 2, 3, 4, 5].map(gen => (
                <tr key={gen} className={`gen-${gen}-row`}>
                  <td>
                    <span className="source-icon">🌳</span>
                    {language === 'ar' ? `الجيل ${gen}` : `Generation ${gen}`}
                  </td>
                  <td>{breakdown[`generation${gen}`].points.toLocaleString()}</td>
                  <td className="percentage">{(breakdown[`generation${gen}`].rate * 100).toFixed(0)}%</td>
                  <td className="commission-value">{breakdown[`generation${gen}`].commission.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan="3">{language === 'ar' ? 'إجمالي أرباح الأداء' : 'Total Performance Profit'}</td>
                <td className="total-value">{profit.performanceProfit.toFixed(2)} ₪</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Leadership Commission (for Bronze and above) */}
      {commissions.leadership && commissions.leadership.hasLeadershipCommission && (
        <div className="section">
          <h3 className="section-title">
            {language === 'ar' ? '🎖️ عمولة القيادة (الرتب)' : '🎖️ Leadership Commission (Ranks)'}
          </h3>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            {language === 'ar'
              ? `متاحة لرتبة ${member.rankName} وما فوق - المعادلة: عدد نقاط الجيل × نسبة العمولة × 0.55`
              : `Available for ${member.rankNameEn} and above - Formula: Generation Points × Commission Rate × 0.55`}
          </p>
          <div className="commissions-table">
            <table>
              <thead>
                <tr>
                  <th>{language === 'ar' ? 'الجيل' : 'Generation'}</th>
                  <th>{language === 'ar' ? 'النقاط' : 'Points'}</th>
                  <th>{language === 'ar' ? 'نسبة العمولة' : 'Commission Rate'}</th>
                  <th>{language === 'ar' ? 'نقاط العمولة' : 'Commission Points'}</th>
                  <th>{language === 'ar' ? 'المبلغ (₪)' : 'Amount (₪)'}</th>
                </tr>
              </thead>
              <tbody>
                {commissions.leadership.breakdown && commissions.leadership.breakdown.map((item) => (
                  <tr key={item.generation} className={`gen-${item.generation}-row`}>
                    <td>
                      <span className="source-icon">🎖️</span>
                      {language === 'ar' ? `الجيل ${item.generation}` : `Generation ${item.generation}`}
                    </td>
                    <td>{item.generationPoints.toLocaleString()}</td>
                    <td className="percentage">{item.commissionRatePercent}</td>
                    <td className="commission-value">{item.commissionPoints.toFixed(2)}</td>
                    <td className="commission-value">{item.commissionInShekel.toFixed(2)} ₪</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td colSpan="4">{language === 'ar' ? 'إجمالي عمولة القيادة' : 'Total Leadership Commission'}</td>
                  <td className="total-value">{commissions.leadership.commissionInShekel.toFixed(2)} ₪</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* No Leadership Commission Message */}
      {commissions.leadership && !commissions.leadership.hasLeadershipCommission && (
        <div className="section">
          <h3 className="section-title">
            {language === 'ar' ? '🎖️ عمولة القيادة (الرتب)' : '🎖️ Leadership Commission (Ranks)'}
          </h3>
          <div style={{ padding: '2rem', textAlign: 'center', background: '#f3f4f6', borderRadius: '12px' }}>
            <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '0.5rem' }}>
              {language === 'ar'
                ? 'عمولة القيادة متاحة للأعضاء من رتبة برونزي وما فوق'
                : 'Leadership commission is available for Bronze rank and above'}
            </p>
            <p style={{ fontSize: '0.95rem', color: '#999' }}>
              {language === 'ar'
                ? 'احصل على 4000 نقطة تراكمية للترقية إلى رتبة برونزي'
                : 'Earn 4000 cumulative points to upgrade to Bronze rank'}
            </p>
          </div>
        </div>
      )}

      {/* Calculation Formula */}
      <div className="section formula-section">
        <h3 className="section-title">
          {language === 'ar' ? '🧮 طريقة الحساب' : '🧮 Calculation Method'}
        </h3>
        <div className="formula-box">
          <div className="formula-step">
            <span className="step-number">1</span>
            <div className="step-content">
              <h4>{language === 'ar' ? 'حساب نقاط الأداء الشخصي' : 'Calculate Personal Performance Points'}</h4>
              <p className="formula">
                {language === 'ar'
                  ? 'النقاط = (سعر الجملة - سعر العضو) × الكمية × 1.5'
                  : 'Points = (Wholesale Price - Member Price) × Quantity × 1.5'}
              </p>
            </div>
          </div>

          <div className="formula-step">
            <span className="step-number">2</span>
            <div className="step-content">
              <h4>{language === 'ar' ? 'حساب عمولات الأجيال' : 'Calculate Generations Commissions'}</h4>
              <ul className="rates-list">
                <li>⚜️ {language === 'ar' ? 'عمولة الأداء الشخصي' : 'Personal Performance'}: 20%</li>
                <li>⚜️ {language === 'ar' ? 'عمولة الجيل الأول' : 'Generation 1'}: 11%</li>
                <li>⚜️ {language === 'ar' ? 'عمولة الجيل الثاني' : 'Generation 2'}: 8%</li>
                <li>⚜️ {language === 'ar' ? 'عمولة الجيل الثالث' : 'Generation 3'}: 6%</li>
                <li>⚜️ {language === 'ar' ? 'عمولة الجيل الرابع' : 'Generation 4'}: 3%</li>
                <li>⚜️ {language === 'ar' ? 'عمولة الجيل الخامس' : 'Generation 5'}: 2%</li>
              </ul>
            </div>
          </div>

          <div className="formula-step">
            <span className="step-number">3</span>
            <div className="step-content">
              <h4>{language === 'ar' ? 'تحويل النقاط إلى شيكل' : 'Convert Points to Shekel'}</h4>
              <p className="formula">
                {language === 'ar'
                  ? `المبلغ بالشيكل = مجموع نقاط العمولة × ${profit.conversionRate}`
                  : `Amount in Shekel = Total Commission Points × ${profit.conversionRate}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="actions">
        <button className="refresh-button" onClick={fetchProfits}>
          🔄 {language === 'ar' ? 'تحديث البيانات' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
};

export default ProfitsCalculator;
