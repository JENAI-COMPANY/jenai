import React, { useEffect, useState, useContext, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import { getAllServices } from '../services/api';
import gsap from 'gsap';
import '../styles/Services.css';

const SocialIcon = ({ type, url }) => {
  const icons = {
    facebook: { emoji: '📘', label: 'Facebook', color: '#1877f2' },
    instagram: { emoji: '📸', label: 'Instagram', color: '#e1306c' },
    tiktok: { emoji: '🎵', label: 'TikTok', color: '#000' },
    whatsapp: { emoji: '💬', label: 'WhatsApp', color: '#25d366' }
  };
  if (!url) return null;
  const icon = icons[type] || { emoji: '🔗', label: type, color: '#666' };
  const href = type === 'whatsapp'
    ? `https://wa.me/${url.replace(/\D/g, '')}`
    : url;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      title={icon.label}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 40, height: 40, borderRadius: '50%', background: icon.color,
        color: '#fff', fontSize: 18, textDecoration: 'none', margin: '0 4px'
      }}>
      {icon.emoji}
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
              {(detailService.socialMedia?.facebook || detailService.socialMedia?.instagram || detailService.socialMedia?.tiktok || detailService.socialMedia?.whatsapp) && (
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ fontSize: 14, color: '#374151', display: 'block', marginBottom: 10 }}>
                    🔗 {language === 'ar' ? 'صفحات التواصل الاجتماعي' : 'Social Media'}
                  </strong>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <SocialIcon type="facebook" url={detailService.socialMedia?.facebook} />
                    <SocialIcon type="instagram" url={detailService.socialMedia?.instagram} />
                    <SocialIcon type="tiktok" url={detailService.socialMedia?.tiktok} />
                    <SocialIcon type="whatsapp" url={detailService.socialMedia?.whatsapp} />
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
