import React, { useEffect, useState, useContext, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import { getAllServices } from '../services/api';
import gsap from 'gsap';
import '../styles/Services.css';

const svgIcons = {
  facebook: (
    <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/>
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z"/>
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.528 5.845L.057 23.428a.5.5 0 0 0 .611.611l5.583-1.471A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.667-.523-5.184-1.432l-.372-.22-3.862 1.018 1.018-3.862-.22-.372A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
    </svg>
  )
};

const socialColors = {
  facebook: '#1877f2',
  instagram: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
  tiktok: '#010101',
  whatsapp: '#25d366',
  phone: '#0ea5e9'
};

const SocialIcon = ({ type, url }) => {
  if (!url) return null;
  const href = type === 'whatsapp' ? `https://wa.me/${url.replace(/\D/g, '')}` : type === 'phone' ? `tel:${url}` : url;
  const bg = socialColors[type] || '#666';
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 48, height: 48, borderRadius: 12,
        background: bg, textDecoration: 'none', margin: '0 5px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)', transition: 'transform 0.2s',
        flexShrink: 0
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {svgIcons[type] || '🔗'}
    </a>
  );
};

const Services = () => {
  const { language } = useLanguage();
  const { user } = useContext(AuthContext);
  const headerRef = useRef(null);
  const cardsRef = useRef(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailService, setDetailService] = useState(null);

  useEffect(() => { fetchServices(); }, []);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current, { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
    }
    if (cardsRef.current && !loading) {
      gsap.fromTo(cardsRef.current.children, { opacity: 0, y: 40, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.15, ease: 'back.out(1.2)', delay: 0.3 });
    }
  }, [loading]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await getAllServices();
      setServices(data.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const defaultServices = [
    { icon: '🚚', name: language === 'ar' ? 'توصيل سريع' : 'Fast Delivery', description: language === 'ar' ? 'احصل على منتجاتك مع توصيل سريع وآمن إلى باب منزلك' : 'Get your products delivered quickly and safely' },
    { icon: '💳', name: language === 'ar' ? 'دفع آمن' : 'Secure Payment', description: language === 'ar' ? 'خيارات دفع آمنة متعددة لراحتك' : 'Multiple secure payment options' },
    { icon: '🎁', name: language === 'ar' ? 'عروض خاصة' : 'Special Offers', description: language === 'ar' ? 'صفقات وخصومات حصرية لمشتركينا' : 'Exclusive deals for subscribers' },
    { icon: '🤝', name: language === 'ar' ? 'التسويق التعاوني' : 'Cooperative Marketing', description: language === 'ar' ? 'قم ببناء شبكتك واكسب عمولة على كل عملية بيع' : 'Build your network and earn commission' }
  ];

  const displayServices = services.length > 0 ? services : defaultServices;

  return (
    <div className="services-page">
      <div className="services-header" ref={headerRef}>
        <h1>{language === 'ar' ? 'خدماتنا' : 'Our Services'}</h1>
        <p>{language === 'ar' ? 'نقدم مجموعة متنوعة من الخدمات لتلبية احتياجاتك' : 'We offer a variety of services to meet your needs'}</p>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <div className="services-grid" ref={cardsRef}>
          {displayServices.map((service, index) => (
            <div key={service._id || index} className="service-card">
              <div className="service-icon">
                {service.logo ? (
                  <img src={service.logo} alt={service.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.textContent = service.icon || '🏢'; }}
                  />
                ) : (service.icon || '🏢')}
              </div>
              <h3>{service.name}</h3>
              <p>{service.description}</p>

              {service._id && (
                <div className="service-details">
                  {service.category && <span className="service-category">{service.category}</span>}
                  {service.pointsPercentage > 0 && (
                    <span className="service-points">{service.pointsPercentage}% {language === 'ar' ? 'نقاط' : 'Points'}</span>
                  )}
                  {service.discountPercentage > 0 && (
                    <span className="service-discount">{service.discountPercentage}% {language === 'ar' ? 'خصم' : 'Off'}</span>
                  )}
                </div>
              )}

              {service._id && (
                <button className="request-usage-btn" onClick={() => setDetailService(service)}>
                  {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="services-cta">
        <h2>{language === 'ar' ? 'هل أنت مستعد للبدء؟' : 'Ready to Get Started?'}</h2>
        <p>{language === 'ar' ? 'انضم إلى شبكتنا اليوم وابدأ في كسب العمولات' : 'Join our network today and start earning commissions'}</p>
        <button className="cta-button">{language === 'ar' ? 'ابدأ الآن' : 'Get Started Now'}</button>
      </div>

      {/* Service Detail Modal */}
      {detailService && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setDetailService(null)}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ position: 'relative', padding: '20px 20px 16px' }}>
              <button onClick={() => setDetailService(null)}
                style={{ position: 'absolute', top: 12, left: 12, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#666' }}>×</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                  {detailService.logo
                    ? <img src={detailService.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (detailService.icon || '🏢')}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, color: '#1a1a2e' }}>{detailService.name}</h2>
                  {detailService.category && <span style={{ fontSize: 13, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 20 }}>{detailService.category}</span>}
                </div>
              </div>
            </div>

            <div style={{ padding: '0 20px 20px' }}>
              {/* Description */}
              <p style={{ color: '#374151', lineHeight: 1.7, marginBottom: 16 }}>{detailService.description}</p>

              {/* Badges */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {detailService.pointsPercentage > 0 && (
                  <span style={{ background: '#ecfdf5', color: '#059669', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                    ⭐ {detailService.pointsPercentage}% {language === 'ar' ? 'نقاط' : 'Points'}
                  </span>
                )}
                {detailService.discountPercentage > 0 && (
                  <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                    🏷️ {detailService.discountPercentage}% {language === 'ar' ? 'خصم' : 'Off'}
                  </span>
                )}
              </div>

              {/* Address */}
              {detailService.address && (
                <div style={{ marginBottom: 14 }}>
                  <strong style={{ fontSize: 14, color: '#374151' }}>📍 {language === 'ar' ? 'العنوان' : 'Address'}:</strong>
                  <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>{detailService.address}</p>
                </div>
              )}

              {/* Images */}
              {detailService.images?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <strong style={{ fontSize: 14, color: '#374151', display: 'block', marginBottom: 8 }}>
                    🖼️ {language === 'ar' ? 'الصور' : 'Images'}
                  </strong>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {detailService.images.map((img, i) => (
                      <img key={i} src={img} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' }}
                        onClick={() => window.open(img, '_blank')} />
                    ))}
                  </div>
                </div>
              )}

              {/* Social Media Icons */}
              {(detailService.socialMedia?.facebook || detailService.socialMedia?.instagram || detailService.socialMedia?.tiktok || detailService.socialMedia?.whatsapp || detailService.socialMedia?.phone) && (
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ fontSize: 14, color: '#374151', display: 'block', marginBottom: 10 }}>
                    🔗 {language === 'ar' ? 'صفحات التواصل الاجتماعي' : 'Social Media'}
                  </strong>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <SocialIcon type="facebook" url={detailService.socialMedia?.facebook} />
                    <SocialIcon type="instagram" url={detailService.socialMedia?.instagram} />
                    <SocialIcon type="tiktok" url={detailService.socialMedia?.tiktok} />
                    <SocialIcon type="whatsapp" url={detailService.socialMedia?.whatsapp} />
                    <SocialIcon type="phone" url={detailService.socialMedia?.phone} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
