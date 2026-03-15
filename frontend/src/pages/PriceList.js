import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const isMobileDevice = () => window.innerWidth <= 768;
const getFirstImage = (p) => (p.images && p.images.length > 0 ? p.images[0] : p.image) || null;

const PriceList = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isMobile, setIsMobile] = useState(isMobileDevice);
  const printRef = useRef();

  const isMember = user?.role === 'member' || user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    const onResize = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  const now = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  const handlePrint = () => {
    const rows = filtered.map((p, i) => {
      const img = getFirstImage(p);
      return `
      <tr>
        <td class="num">${i + 1}</td>
        <td class="img-cell">${img ? `<img src="${img}" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:6px;border:1px solid #eee;vertical-align:middle;margin-left:8px"/>` : '<div style="width:44px;height:44px;background:#f0f0f0;border-radius:6px;display:inline-block;vertical-align:middle;margin-left:8px"></div>'}<span><strong>${p.nameAr || p.name}</strong><br/><small style="color:#999">${p.category || ''}</small></span></td>
        <td class="num"><span class="pts">${p.points ?? 0} نقطة</span></td>
        <td class="num" style="color:#2d7a52;font-weight:700">₪${(p.subscriberPrice ?? p.memberPrice ?? p.price ?? 0).toFixed(2)}</td>
        <td class="num" style="text-decoration:line-through;color:#aaa">₪${(p.customerPrice ?? p.price ?? 0).toFixed(2)}</td>
      </tr>`;
    }).join('');
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/>
      <title>قائمة أسعار جيناي</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;direction:rtl;padding:20px;color:#222}
      h1{text-align:center;color:#1a4731;font-size:20px;margin-bottom:4px}
      .sub{text-align:center;color:#888;font-size:12px;margin-bottom:18px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{background:#1a4731;color:#fff;padding:9px 10px;text-align:right}
      td{padding:8px 10px;border-bottom:1px solid #eee;vertical-align:middle}
      tr:nth-child(even) td{background:#f7faf8}
      .num{text-align:center}.pts{background:#e8f4ee;color:#1a4731;padding:2px 8px;border-radius:10px;font-weight:700;font-size:11px}
      .img-cell{display:flex;align-items:center}
      @media print{body{padding:10px}img{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head>
      <body><h1>قائمة أسعار منتجات جيناي</h1>
      <p class="sub">تاريخ الطباعة: ${now} — خاص بأعضاء جيناي</p>
      <table><thead><tr><th>#</th><th>اسم المنتج</th><th>النقاط</th><th>سعر العضو</th><th>سعر الزبون</th></tr></thead>
      <tbody>${rows}</tbody></table></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9', fontFamily: "'Segoe UI', Tahoma, sans-serif" }} dir="rtl">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a4731 0%, #2d7a52 60%, #3a9465 100%)',
        padding: isMobile ? '32px 16px' : '50px 24px', textAlign: 'center'
      }}>
        <h1 style={{ color: '#fff', fontSize: isMobile ? '1.6rem' : '2.2rem', fontWeight: 800, margin: '0 0 8px', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
          📋 قائمة أسعار المنتجات
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: isMobile ? '0.9rem' : '1rem', margin: 0 }}>
          أسعار خاصة لأعضاء جيناي
        </p>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '16px 12px' : '28px 16px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 ابحث عن منتج..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, padding: isMobile ? '10px 14px' : '11px 16px',
              border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14,
              fontFamily: 'inherit', outline: 'none'
            }}
          />
          <button onClick={handlePrint} style={{
            background: 'linear-gradient(135deg, #2d7a52, #1a4731)',
            color: '#fff', border: 'none', padding: isMobile ? '10px 16px' : '11px 24px',
            borderRadius: 10, fontSize: isMobile ? 13 : 14, fontWeight: 700,
            cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
            boxShadow: '0 4px 14px rgba(26,71,49,0.3)'
          }}>
            🖨️ طباعة
          </button>
        </div>

        <div style={{ marginBottom: 12, color: '#666', fontSize: 13, fontWeight: 600 }}>
          إجمالي المنتجات: <span style={{ color: '#1a4731' }}>{filtered.length}</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
            <div style={{ width: 44, height: 44, border: '4px solid #e0e0e0', borderTopColor: '#2d7a52', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
            جاري التحميل...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa', fontSize: 15 }}>لا توجد منتجات مطابقة</div>
        ) : isMobile ? (
          /* ===== واجهة الموبايل: بطاقات ===== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((p, i) => (
              <div key={p._id} style={{
                background: '#fff', borderRadius: 14, padding: '14px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #eee',
                display: 'flex', alignItems: 'center', gap: 12
              }}>
                {/* رقم */}
                <div style={{ color: '#ccc', fontSize: 12, fontWeight: 700, minWidth: 22, textAlign: 'center' }}>{i + 1}</div>

                {/* صورة */}
                {getFirstImage(p) ? (
                  <img src={getFirstImage(p)} alt={p.nameAr || p.name} style={{
                    width: 56, height: 56, borderRadius: 10, objectFit: 'cover',
                    border: '1px solid #eee', flexShrink: 0
                  }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 10, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📦</div>
                )}

                {/* معلومات المنتج */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#1a2b1f', fontSize: 14, lineHeight: 1.3, marginBottom: 4 }}>
                    {p.nameAr || p.name}
                  </div>
                  {p.category && <div style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>{p.category}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ background: '#e8f4ee', color: '#1a4731', padding: '3px 10px', borderRadius: 12, fontWeight: 700, fontSize: 12 }}>
                      {p.points ?? 0} نقطة
                    </span>
                  </div>
                </div>

                {/* الأسعار */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, color: '#2d7a52', fontSize: 16, lineHeight: 1.2 }}>
                    ₪{(p.subscriberPrice ?? p.memberPrice ?? p.price ?? 0).toFixed(2)}
                  </div>
                  <div style={{ fontSize: 12, color: '#bbb', textDecoration: 'line-through', marginTop: 2 }}>
                    ₪{(p.customerPrice ?? p.price ?? 0).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ===== واجهة الديسكتوب: جدول ===== */
          <div ref={printRef}>
            <div className="print-header" style={{ display: 'none' }}>
              <h1>قائمة أسعار منتجات جيناي</h1>
              <p>تاريخ الطباعة: {now} — خاص بأعضاء جيناي</p>
            </div>
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
                  {filtered.map((p, i) => (
                    <tr key={p._id} style={{ borderBottom: '1px solid #f0f0f0' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f7faf8'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ ...tdStyle, color: '#aaa', fontSize: 12, width: 44, textAlign: 'center' }}>{i + 1}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {getFirstImage(p) && <img src={getFirstImage(p)} alt={p.nameAr || p.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid #eee', flexShrink: 0 }} />}
                          <div>
                            <div style={{ fontWeight: 700, color: '#1a2b1f', fontSize: 14 }}>{p.nameAr || p.name}</div>
                            {p.category && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{p.category}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{ background: '#e8f4ee', color: '#1a4731', padding: '4px 12px', borderRadius: 14, fontWeight: 700, fontSize: 13 }}>
                          {p.points ?? 0} نقطة
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#2d7a52', fontSize: 15 }}>
                        ₪{(p.subscriberPrice ?? p.memberPrice ?? p.price ?? 0).toFixed(2)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', color: '#888', fontSize: 14, textDecoration: 'line-through' }}>
                        ₪{(p.customerPrice ?? p.price ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const thStyle = { padding: '13px 14px', color: '#fff', textAlign: 'right', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' };
const tdStyle = { padding: '11px 14px', verticalAlign: 'middle' };

export default PriceList;
