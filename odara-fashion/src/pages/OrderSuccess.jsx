import { Link, useLocation } from 'react-router-dom'

export default function OrderSuccess() {
  const location = useLocation()
  const orderNumber = location.state?.orderNumber

  return (
    <div>
      <div className="section-premium">
        <div className="container-premium">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="text-6xl mb-4">✓</div>
              <h1 className="text-5xl font-playfair text-2C2C2C mb-4">Order Confirmed</h1>
              <p className="text-xl text-2C2C2C/70 mb-6">Thank you for your purchase!</p>

              <div className="bg-F5EFE0 p-8 mb-8">
                {orderNumber && <p className="text-2C2C2C/70 mb-4">Order ID: #{orderNumber}</p>}
                <p className="text-2C2C2C/70">You will receive a confirmation email shortly with tracking information.</p>
              </div>

              <Link to="/" className="btn-gold">Return to Home</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
