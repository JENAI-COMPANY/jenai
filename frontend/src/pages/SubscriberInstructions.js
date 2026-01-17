import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import '../styles/Instructions.css';

const SubscriberInstructions = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    // Animate container entrance
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
    );

    // Animate instruction cards
    if (cardsRef.current) {
      gsap.fromTo(
        cardsRef.current.children,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, delay: 0.3, ease: 'power2.out' }
      );
    }
  }, []);

  const handleGetStarted = () => {
    navigate('/');
  };

  return (
    <div className="instructions-page">
      <div className="instructions-container" ref={containerRef}>
        <div className="instructions-header">
          <h1>Welcome to Cooperative Marketing! 🎉</h1>
          <p className="subtitle">Learn how to earn commissions and grow your network</p>
        </div>

        <div className="instructions-content" ref={cardsRef}>
          <div className="instruction-card">
            <div className="card-icon">🛍️</div>
            <h3>1. Shop at Special Prices</h3>
            <p>
              As a subscriber, you get access to exclusive pricing on all products.
              Enjoy discounts that regular customers don't have access to!
            </p>
          </div>

          <div className="instruction-card highlight">
            <div className="card-icon">🔗</div>
            <h3>2. Share Your Referral Code</h3>
            <p>
              Your unique referral code can be found in your dashboard. Share it with
              friends and family to earn commissions when they join as subscribers.
            </p>
          </div>

          <div className="instruction-card">
            <div className="card-icon">💰</div>
            <h3>3. Earn Commissions</h3>
            <p>
              Earn money through our 3-level commission system:
            </p>
            <ul className="commission-list">
              <li><strong>Level 1:</strong> 10% commission from direct referrals</li>
              <li><strong>Level 2:</strong> 5% commission from second-level referrals</li>
              <li><strong>Level 3:</strong> 3% commission from third-level referrals</li>
            </ul>
          </div>

          <div className="instruction-card">
            <div className="card-icon">👥</div>
            <h3>4. Build Your Network</h3>
            <p>
              The more people you refer, the more you earn! Track your downline
              and commissions from your dashboard.
            </p>
          </div>

          <div className="instruction-card">
            <div className="card-icon">📊</div>
            <h3>5. Track Your Progress</h3>
            <p>
              Visit your dashboard to see your network statistics, commission history,
              and downline members. Monitor your earnings in real-time!
            </p>
          </div>

          <div className="instruction-card highlight">
            <div className="card-icon">🎯</div>
            <h3>Pro Tips</h3>
            <ul className="tips-list">
              <li>Share your referral code on social media</li>
              <li>Help your referrals understand the system</li>
              <li>Stay active and make regular purchases</li>
              <li>Build relationships with your downline</li>
            </ul>
          </div>
        </div>

        <div className="instructions-footer">
          <button onClick={handleGetStarted} className="get-started-btn">
            Get Started - Go to Dashboard
          </button>
          <p className="footer-note">
            You can always access these instructions from your dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriberInstructions;
