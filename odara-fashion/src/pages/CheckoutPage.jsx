import { Link } from 'react-router-dom'

export default function CheckoutPage() {
  return (
    <div>
      <div className="bg-F5EFE0 py-12">
        <div className="container-premium">
          <h1 className="text-5xl font-playfair text-2C2C2C">Checkout</h1>
        </div>
      </div>

      <div className="section-premium">
        <div className="container-premium">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-8 border border-E8D9C4">
              <h2 className="text-2xl font-playfair text-2C2C2C mb-6">Shipping Address</h2>
              
              <form className="space-y-4">
                <input type="text" placeholder="Full Name" className="w-full p-3 border border-E8D9C4" />
                <input type="email" placeholder="Email" className="w-full p-3 border border-E8D9C4" />
                <input type="text" placeholder="Address" className="w-full p-3 border border-E8D9C4" />
                <input type="text" placeholder="City" className="w-full p-3 border border-E8D9C4" />
                <input type="text" placeholder="Postal Code" className="w-full p-3 border border-E8D9C4" />
                
                <div className="pt-6">
                  <Link to="/order-success" className="btn-gold w-full block text-center">
                    Complete Order
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
