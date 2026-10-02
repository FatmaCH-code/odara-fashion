import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import AdminGuard from './components/AdminGuard'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Perfumes from './pages/Perfumes'
import MakePerfume from './pages/MakePerfume'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderSuccess from './pages/OrderSuccess'
import About from './pages/About'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import './styles/globals.css'

// The admin area is a deliberately separate interface — no storefront
// navbar/footer there, so it doesn't get mixed up with the public site.
function StorefrontChrome({ children }) {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')
  return (
    <>
      {!isAdmin && <Navbar />}
      {children}
      {!isAdmin && <Footer />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <StorefrontChrome>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/perfumes" element={<Perfumes />} />
          <Route path="/make-perfume" element={<MakePerfume />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/about" element={<About />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        </Routes>
      </StorefrontChrome>
    </BrowserRouter>
  )
}
