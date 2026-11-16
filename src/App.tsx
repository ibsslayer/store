import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { MobileBottomNav } from './components/MobileBottomNav';
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

const VALID_PAGES = new Set([
  'home',
  'shop',
  'product',
  'cart',
  'checkout',
  'order-confirmation',
  'track',
  'giveaways',
  'deals',
  'account',
  'login',
  'wishlist',
  'admin-login',
  'admin',
  'about',
  'delivery-info',
  'returns-refunds',
  'privacy',
  'terms',
  'faqs',
  'contact'
]);

function parseRouteFromLocation(): { page: string; param?: string } {
  if (typeof window === 'undefined') return { page: 'home' };

  const hash = window.location.hash;
  if (hash && hash.startsWith('#/')) {
    const raw = hash.slice(2);
    const [rawPath, rawQuery] = raw.split('?');
    const segments = rawPath.split('/').filter(Boolean);
    const candidate = segments[0] || 'home';
    const page = VALID_PAGES.has(candidate) ? candidate : 'home';

    if (page === 'shop' && rawQuery) {
      return { page: 'shop', param: rawQuery };
    }
    if (segments[1]) {
      return { page, param: decodeURIComponent(segments.slice(1).join('/')) };
    }
    return { page };
  }

  // Fallback to pathname relative to Vite BASE_URL (supports direct URLs & GitHub Pages 404.html)
  const baseUrl = ((import.meta as any).env?.BASE_URL || '/').replace(/\/+$/, '');
  let pathname = window.location.pathname || '/';
  if (baseUrl && baseUrl !== '/' && pathname.startsWith(baseUrl)) {
    pathname = pathname.slice(baseUrl.length) || '/';
  }
  const segments = pathname.split('/').filter(Boolean);
  const candidate = segments[0] || 'home';
  const page = VALID_PAGES.has(candidate) ? candidate : 'home';
  const search = window.location.search?.replace(/^\?/, '');

  if (page === 'shop' && search) {
    return { page: 'shop', param: search };
  }
  if (segments[1]) {
    return { page, param: decodeURIComponent(segments.slice(1).join('/')) };
  }
  return { page };
}

function buildHashRoute(page: string, param?: string): string {
  if (page === 'home') return '#/';
  if (page === 'shop' && param) return `#/shop?${param}`;
  if (param) return `#/${page}/${encodeURIComponent(param)}`;
  return `#/${page}`;
}

export function AppContent() {
  const { isAdmin } = useAuth();
  const initial = parseRouteFromLocation();
  const [currentPage, setCurrentPage] = useState<string>(initial.page);
  const [pageParam, setPageParam] = useState<string | undefined>(initial.param);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Stored order data for confirmation
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [lastOrderWaUrl, setLastOrderWaUrl] = useState<string | undefined>(undefined);

  // Keep React route synchronized with browser Back/Forward & hash edits
  useEffect(() => {
    const syncFromLocation = () => {
      const next = parseRouteFromLocation();
      setCurrentPage(next.page);
      setPageParam(next.param);
    };
    window.addEventListener('popstate', syncFromLocation);
    window.addEventListener('hashchange', syncFromLocation);
    return () => {
      window.removeEventListener('popstate', syncFromLocation);
      window.removeEventListener('hashchange', syncFromLocation);
    };
  }, []);

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, pageParam]);

  const handleNavigate = useCallback((page: string, param?: string) => {
    const targetPage = VALID_PAGES.has(page) ? page : 'home';
    setCurrentPage(targetPage);
    setPageParam(param);

    const nextHash = buildHashRoute(targetPage, param);
    if (window.location.hash !== nextHash) {
      try {
        window.history.pushState(null, '', nextHash);
      } catch {
        window.location.hash = nextHash;
      }
    }
  }, []);

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
        return isAdmin ? (
          <AdminDashboardPage onNavigate={handleNavigate} />
        ) : (
          <AdminLoginPage onNavigate={handleNavigate} />
        );
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

  const isAdminPage = currentPage === 'admin' && isAdmin;
  const showMobileBottomNav =
    !isAdminPage &&
    currentPage !== 'admin-login' &&
    currentPage !== 'admin' &&
    currentPage !== 'product' &&
    currentPage !== 'checkout';

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
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 pt-2 sm:pt-4">
        <ErrorBoundary>{renderPage()}</ErrorBoundary>
      </main>

      {/* Customer Footer */}
      {!isAdminPage && <Footer onNavigate={handleNavigate} hasBottomBar={showMobileBottomNav} />}

      {/* Mobile App Bottom Navigation */}
      {showMobileBottomNav && (
        <MobileBottomNav currentPage={currentPage} onNavigate={handleNavigate} />
      )}

      {/* Floating WhatsApp Action Widget */}
      {!isAdminPage && (
        <FloatingWhatsApp
          hasBottomBar={showMobileBottomNav || currentPage === 'product' || currentPage === 'checkout'}
        />
      )}

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
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <CartProvider>
            <WishlistProvider>
              <AppContent />
            </WishlistProvider>
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
