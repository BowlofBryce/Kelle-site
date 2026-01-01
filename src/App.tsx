import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TattooSpaceLayout } from './components/layout/TattooSpaceLayout';
import { Home } from './routes/Home';
import { Shop } from './routes/Shop';
import { ProductDetail } from './routes/ProductDetail';
import { Cart } from './routes/Cart';
import { Checkout } from './routes/Checkout';
import { CheckoutSuccess } from './routes/CheckoutSuccess';
import { CheckoutCancel } from './routes/CheckoutCancel';
import { About } from './routes/About';
import { AdminLogin } from './routes/AdminLogin';
import { AdminDashboard } from './routes/AdminDashboard';
import { isSupabaseConfigured } from './lib/supabase';

function App() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border-2 border-red-500 rounded-lg p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-500 mb-4">Database Connection Error</h1>
          <p className="text-zinc-300 mb-4">
            Supabase environment variables are not configured.
          </p>
          <div className="bg-zinc-800 p-4 rounded text-left text-sm mb-4">
            <p className="text-zinc-400 mb-2">Expected variables in .env:</p>
            <code className="text-green-400 block">VITE_SUPABASE_URL</code>
            <code className="text-green-400 block">VITE_SUPABASE_ANON_KEY</code>
          </div>
          <p className="text-zinc-400 text-sm">
            Please configure your Supabase connection in the Bolt IDE settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TattooSpaceLayout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:slug" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="checkout/success" element={<CheckoutSuccess />} />
          <Route path="checkout/cancel" element={<CheckoutCancel />} />
          <Route path="about" element={<About />} />
        </Route>
        <Route path="/backstage" element={<AdminLogin />} />
        <Route path="/backstage/dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;