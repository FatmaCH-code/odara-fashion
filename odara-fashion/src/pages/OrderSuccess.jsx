import { useEffect } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'

export default function OrderSuccess() {
  const location = useLocation()
  const [params] = useSearchParams()
  const clearCart = useCartStore(state => state.clearCart)
  // Manual orders pass it via router state; Stripe redirects back with ?order=
  const orderNumber = location.state?.orderNumber || params.get('order')
  const paid = Boolean(params.get('order')) // came back from Stripe

  // After Stripe payment the cart is cleared here (not at checkout), so a
  // customer who cancels on Stripe's page still has their cart.
  useEffect(() => { if (paid) clearCart() }, [paid, clearCart])

  return (
    <div>
      <div className="section-premium">
        <div className="container-premium">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="text-6xl mb-4">✓</div>
              <h1 className="text-5xl font-playfair text-2C2C2C mb-4">{paid ? 'Payment Received' : 'Order Received'}</h1>
              <p className="text-xl text-2C2C2C/70 mb-6">Thank you for your order!</p>

              <div className="bg-F5EFE0 p-8 mb-8">
                {orderNumber && <p className="text-2C2C2C/70 mb-4">Order ID: #{orderNumber}</p>}
                <p className="text-2C2C2C/70">
                  {paid
                    ? 'A confirmation email is on its way to you. We will contact you when your order ships.'
                    : "We'll contact you by email or phone shortly to confirm your order and arrange payment."}
                </p>
              </div>

              <Link to="/" className="btn-gold">Return to Home</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
