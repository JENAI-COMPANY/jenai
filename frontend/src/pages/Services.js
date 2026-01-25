import React, { useRef, useEffect, useState, useContext } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import { getAllServices, submitServiceUsage } from '../services/api';
import gsap from 'gsap';
import '../styles/Services.css';

const Services = () => {
  const { language } = useLanguage();
  const { user } = useContext(AuthContext);
  const headerRef = useRef(null);
  const cardsRef = useRef(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingService, setRequestingService] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    // Animate header
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    }

    // Animate service cards
    if (cardsRef.current && !loading) {
      const cards = cardsRef.current.children;
      gsap.fromTo(
        cards,
        { opacity: 0, y: 40, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.15, ease: 'back.out(1.2)', delay: 0.3 }
      );
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

  const handleRequestUsage = async (service) => {
    try {
      setRequestingService(service._id);
      await submitServiceUsage(service._id, {});
      alert(language === 'ar' ? 'تم إرسال طلب الاستخدام بنجاح!' : 'Usage request submitted successfully!');
    } catch (error) {
      console.error('Error submitting usage:', error);
      alert(language === 'ar' ? 'فشل إرسال الطلب. حاول مرة أخرى.' : 'Failed to submit request. Please try again.');
    } finally {
      setRequestingService(null);
    }
  };

  // Default services if no DB services
  const defaultServices = [
    {
      icon: '🚚',
      name: language === 'ar' ? 'توصيل سريع' : 'Fast Delivery',
      description: language === 'ar' ? 'احصل على منتجاتك مع توصيل سريع وآمن إلى باب منزلك' : 'Get your products delivered quickly and safely to your doorstep'
    },
    {
      icon: '💳',
      name: language === 'ar' ? 'دفع آمن' : 'Secure Payment',
      description: language === 'ar' ? 'خيارات دفع آمنة متعددة لراحتك' : 'Multiple secure payment options for your convenience'
    },
    {
      icon: '🎁',
      name: language === 'ar' ? 'عروض خاصة' : 'Special Offers',
      description: language === 'ar' ? 'صفقات وخصومات حصرية لمشتركينا' : 'Exclusive deals and discounts for our subscribers'
    },
    {
      icon: '🤝',
      name: language === 'ar' ? 'التسويق التعاوني' : 'Cooperative Marketing',
      description: language === 'ar' ? 'قم ببناء شبكتك واكسب عمولة على كل عملية بيع' : 'Build your network and earn commission on every sale'
    },
    {
      icon: '📊',
      name: language === 'ar' ? 'لوحة التحليلات' : 'Analytics Dashboard',
      description: language === 'ar' ? 'تتبع مبيعاتك وأرباحك ونمو شبكتك في الوقت الفعلي' : 'Track your sales, earnings, and network growth in real-time'
    },
    {
      icon: '💬',
      name: language === 'ar' ? 'دعم على مدار الساعة' : '24/7 Support',
      description: language === 'ar' ? 'فريق الدعم لدينا جاهز دائماً لمساعدتك على النجاح' : 'Our support team is always ready to help you succeed'
    }
  ];

  const displayServices = services.length > 0 ? services : defaultServices;

  return (
    <div className="services-page">
      <div className="services-header" ref={headerRef}>
        <h1>{language === 'ar' ? 'خدماتنا' : 'Our Services'}</h1>
        <p>{language === 'ar' ? 'نقدم مجموعة متنوعة من الخدمات لتلبية احتياجاتك' : 'We offer a variety of services to meet your needs'}</p>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="services-grid" ref={cardsRef}>
          {displayServices.map((service, index) => (
            <div key={service._id || index} className="service-card">
              <div className="service-icon">
                {service.logo ? (
                  <img
                    src={`http://localhost:5000${service.logo}`}
                    alt={service.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.textContent = service.icon || '🏢';
                    }}
                  />
                ) : (
                  service.icon || '🏢'
                )}
              </div>
              <h3>{service.name}</h3>
              <p>{service.description}</p>

              {service._id && (
                <div className="service-details">
                  {service.category && (
                    <span className="service-category">{service.category}</span>
                  )}
                  {service.pointsPercentage > 0 && (
                    <span className="service-points">
                      {language === 'ar' ? `${service.pointsPercentage}% نقاط` : `${service.pointsPercentage}% Points`}
                    </span>
                  )}
                  {service.discountPercentage > 0 && (
                    <span className="service-discount">
                      {language === 'ar' ? `${service.discountPercentage}% خصم` : `${service.discountPercentage}% Off`}
                    </span>
                  )}
                </div>
              )}

              {/* Request Usage Button - Available for everyone */}
              {service._id && (
                <button
                  className="request-usage-btn"
                  onClick={() => handleRequestUsage(service)}
                  disabled={requestingService === service._id}
                >
                  {requestingService === service._id
                    ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                    : (language === 'ar' ? 'طلب استخدام' : 'Request Usage')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="services-cta">
        <h2>{language === 'ar' ? 'هل أنت مستعد للبدء؟' : 'Ready to Get Started?'}</h2>
        <p>{language === 'ar' ? 'انضم إلى شبكتنا اليوم وابدأ في كسب العمولات' : 'Join our network today and start earning commissions'}</p>
        <button className="cta-button">
          {language === 'ar' ? 'ابدأ الآن' : 'Get Started Now'}
        </button>
      </div>

    </div>
  );
};

export default Services;
