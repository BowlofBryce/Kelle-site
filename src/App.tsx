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

function App() {
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
        <Route path="admin" element={<AdminLogin />} />
        <Route path="admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
