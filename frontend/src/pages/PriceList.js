import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const PriceList = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const printRef = useRef();

  const isMember = user?.role === 'member' || user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    if (!isMember) return;
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/products?limit=1000&isActive=true', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(res.data.products || res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [isMember]);

  if (!isMember) return <Navigate to="/" replace />;

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.nameAr?.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8"/>
        <title>قائمة أسعار جيناي</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl; padding: 24px; color: #222; }
          .print-header { text-align: center; margin-bottom: 24px; }
          .print-header h1 { font-size: 22px; color: #1a4731; margin-bottom: 4px; }
          .print-header p { font-size: 13px; color: #888; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { background: #1a4731; color: #fff; padding: 10px 12px; text-align: right; font-size: 13px; }
          td { padding: 9px 12px; border-bottom: 1px solid #e8e8e8; }
          tr:nth-child(even) td { background: #f7faf8; }
          .num { text-align: center; }
          .points-badge { background: #e8f4ee; color: #1a4731; padding: 3px 10px; border-radius: 12px; font-weight: 700; font-size: 12px; }
          @media print { body { padding: 12px; } }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const now = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9', fontFamily: "'Segoe UI', Tahoma, sans-serif" }} dir="rtl">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a4731 0%, #2d7a52 60%, #3a9465 100%)', padding: '50px 24px', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: '2.2rem', fontWeight: 800, margin: '0 0 10px', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
          📋 قائمة أسعار المنتجات
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', margin: 0 }}>
          أسعار خاصة لأعضاء جيناي
        </p>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 16px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 ابحث عن منتج..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 200, padding: '11px 16px',
              border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14,
              fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#2d7a52'}
            onBlur={e => e.target.style.borderColor = '#e0e0e0'}
          />
          <button
            onClick={handlePrint}
            style={{
              background: 'linear-gradient(135deg, #2d7a52, #1a4731)',
              color: '#fff', border: 'none', padding: '11px 28px',
              borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 7,
              boxShadow: '0 4px 14px rgba(26,71,49,0.3)', fontFamily: 'inherit'
            }}
          >
            🖨️ طباعة
          </button>
        </div>

        {/* Count */}
        <div style={{ marginBottom: 12, color: '#666', fontSize: 13, fontWeight: 600 }}>
          إجمالي المنتجات: <span style={{ color: '#1a4731' }}>{filtered.length}</span>
        </div>

        {/* Printable content */}
        <div ref={printRef}>
          <div className="print-header" style={{ display: 'none' }}>
            <h1>قائمة أسعار منتجات جيناي</h1>
            <p>تاريخ الطباعة: {now} — خاص بأعضاء جيناي</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
              <div style={{
                width: 44, height: 44, border: '4px solid #e0e0e0', borderTopColor: '#2d7a52',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px'
              }} />
              جاري التحميل...
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden', border: '1px solid #eee' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #1a4731, #2d7a52)' }}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>اسم المنتج</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>نقاط العضو</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>سعر العضو</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>سعر الزبون</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa', fontSize: 15 }}>
                        لا توجد منتجات مطابقة
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p, i) => (
                      <tr key={p._id} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f7faf8'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ ...tdStyle, color: '#aaa', fontSize: 12, width: 44, textAlign: 'center' }}>{i + 1}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {p.image && (
                              <img src={p.image} alt={p.nameAr || p.name}
                                style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', border: '1px solid #eee', flexShrink: 0 }}
                              />
                            )}
                            <div>
                              <div style={{ fontWeight: 700, color: '#1a2b1f', fontSize: 14 }}>{p.nameAr || p.name}</div>
                              {p.category && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{p.category}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <span style={{
                            background: '#e8f4ee', color: '#1a4731',
                            padding: '4px 12px', borderRadius: 14,
                            fontWeight: 700, fontSize: 13
                          }}>
                            {p.points ?? 0} نقطة
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#2d7a52', fontSize: 15 }}>
                          ₪{(p.memberPrice ?? p.price ?? 0).toFixed(2)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center', color: '#888', fontSize: 14, textDecoration: 'line-through' }}>
                          ₪{(p.customerPrice ?? p.price ?? 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const thStyle = {
  padding: '13px 14px', color: '#fff', textAlign: 'right',
  fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap'
};
const tdStyle = {
  padding: '11px 14px', verticalAlign: 'middle'
};

export default PriceList;
