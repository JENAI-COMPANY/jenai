import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { FavoritesProvider } from './context/FavoritesContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Services from './pages/Services';
import ContactUs from './pages/ContactUs';
import About from './pages/About';
import Academy from './pages/Academy';
import Complaints from './pages/Complaints';
import MemberDashboard from './pages/MemberDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import SubscriberInstructions from './pages/SubscriberInstructions';
import MemberWelcome from './pages/MemberWelcome';
import Profile from './pages/Profile';
import ServicesManagement from './pages/ServicesManagement';
import Library from './pages/Library';
import SupplierDashboard from './pages/SupplierDashboard';
import SupplierManagement from './components/SupplierManagement';
import ReturnPolicy from './pages/ReturnPolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import FAQ from './pages/FAQ';
import ProfitsCalculator from './components/ProfitsCalculator';
import ProfitPeriods from './components/ProfitPeriods';
import Favorites from './pages/Favorites';
import WelcomeMember from './pages/WelcomeMember';
import './styles/App.css';
import './styles/AdminResponsive.css';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <LanguageProvider>
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>
              <div className="App">
                <Navbar />
                <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products-page" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/services" element={<Services />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/about" element={<About />} />
                <Route path="/returns" element={<ReturnPolicy />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsConditions />} />
                <Route path="/faq" element={<FAQ />} />
                <Route
                  path="/academy"
                  element={
                    <PrivateRoute roles={['member', 'subscriber', 'regional_admin', 'super_admin']}>
                      <Academy />
                    </PrivateRoute>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/subscriber-instructions" element={<SubscriberInstructions />} />
                <Route path="/member-welcome" element={<MemberWelcome />} />
                <Route path="/welcome-member" element={<WelcomeMember />} />
                <Route path="/cart" element={<Cart />} />
                <Route
                  path="/favorites"
                  element={
                    <PrivateRoute>
                      <Favorites />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <PrivateRoute>
                      <Checkout />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/member-dashboard"
                  element={
                    <PrivateRoute roles={['member']}>
                      <MemberDashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profits"
                  element={
                    <PrivateRoute roles={['member']}>
                      <ProfitsCalculator />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/complaints"
                  element={
                    <PrivateRoute>
                      <Complaints />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute roles={['regional_admin', 'super_admin']}>
                      <Admin />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/services-management"
                  element={
                    <PrivateRoute roles={['regional_admin', 'super_admin']}>
                      <ServicesManagement />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/library"
                  element={
                    <PrivateRoute roles={['member', 'subscriber', 'regional_admin', 'super_admin']}>
                      <Library />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/supplier-dashboard"
                  element={
                    <PrivateRoute roles={['supplier']}>
                      <SupplierDashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/suppliers"
                  element={
                    <PrivateRoute roles={['super_admin']}>
                      <SupplierManagement />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profit-periods"
                  element={
                    <PrivateRoute roles={['super_admin']}>
                      <ProfitPeriods />
                    </PrivateRoute>
                  }
                />
              </Routes>
                </main>
                <Footer />
              </div>
            </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
