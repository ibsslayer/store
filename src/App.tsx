import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { AiPhoneAdvisorModal } from './components/AiPhoneAdvisorModal';

// Pages
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { GiveawaysPage } from './pages/GiveawaysPage';
import { DealsPage } from './pages/DealsPage';
import { CustomerAccountPage } from './pages/CustomerAccountPage';
import { CustomerAuthPage } from './pages/CustomerAuthPage';
import { WishlistPage } from './pages/WishlistPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { InfoPages } from './pages/InfoPages';

export function AppContent() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [pageParam, setPageParam] = useState<string | undefined>(undefined);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Stored order data for confirmation
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [lastOrderWaUrl, setLastOrderWaUrl] = useState<string | undefined>(undefined);

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, pageParam]);

  const handleNavigate = (page: string, param?: string) => {
    setCurrentPage(page);
    setPageParam(param);
  };

  const handleOrderPlaced = (order: any, waUrl: string) => {
    setLastOrder(order);
    setLastOrderWaUrl(waUrl);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} onOpenAiAdvisor={() => setIsAiModalOpen(true)} />;
      case 'shop':
        return <ShopPage onNavigate={handleNavigate} initialQuery={pageParam} />;
      case 'product':
        return <ProductDetailsPage slug={pageParam || ''} onNavigate={handleNavigate} />;
      case 'cart':
        return <CartPage onNavigate={handleNavigate} />;
      case 'checkout':
        return <CheckoutPage onNavigate={handleNavigate} onOrderPlaced={handleOrderPlaced} />;
      case 'order-confirmation':
        return (
          <OrderConfirmationPage
            orderId={pageParam}
            orderData={lastOrder}
            whatsappUrl={lastOrderWaUrl}
            onNavigate={handleNavigate}
          />
        );
      case 'track':
        return <TrackOrderPage />;
      case 'giveaways':
        return <GiveawaysPage />;
      case 'deals':
        return <DealsPage onNavigate={handleNavigate} />;
      case 'account':
        return <CustomerAccountPage onNavigate={handleNavigate} />;
      case 'login':
        return <CustomerAuthPage onNavigate={handleNavigate} />;
      case 'wishlist':
        return <WishlistPage onNavigate={handleNavigate} />;
      case 'admin-login':
        return <AdminLoginPage onNavigate={handleNavigate} />;
      case 'admin':
        return <AdminDashboardPage onNavigate={handleNavigate} />;
      case 'about':
        return <InfoPages pageType="about" onNavigate={handleNavigate} />;
      case 'delivery-info':
        return <InfoPages pageType="delivery" onNavigate={handleNavigate} />;
      case 'returns-refunds':
        return <InfoPages pageType="returns" onNavigate={handleNavigate} />;
      case 'privacy':
        return <InfoPages pageType="privacy" onNavigate={handleNavigate} />;
      case 'terms':
        return <InfoPages pageType="terms" onNavigate={handleNavigate} />;
      case 'faqs':
        return <InfoPages pageType="faqs" onNavigate={handleNavigate} />;
      case 'contact':
        return <InfoPages pageType="contact" onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} onOpenAiAdvisor={() => setIsAiModalOpen(true)} />;
    }
  };

  const isAdminPage = currentPage === 'admin';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-emerald-500 selection:text-zinc-950 antialiased">
      {/* Customer Header */}
      {!isAdminPage && (
        <Header
          onNavigate={handleNavigate}
          currentPage={currentPage}
          onOpenAiAdvisor={() => setIsAiModalOpen(true)}
        />
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
        {renderPage()}
      </main>

      {/* Customer Footer */}
      {!isAdminPage && <Footer onNavigate={handleNavigate} />}

      {/* Floating WhatsApp Action Widget */}
      {!isAdminPage && <FloatingWhatsApp />}

      {/* AI Phone Advisor Modal */}
      <AiPhoneAdvisorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <CartProvider>
          <WishlistProvider>
            <AppContent />
          </WishlistProvider>
        </CartProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
