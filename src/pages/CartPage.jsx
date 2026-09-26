import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useCartStore } from '../store/cartStore'

export default function CartPage() {
  const { items, removeItem } = useCartStore()

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div>
      <div className="bg-F5EFE0 py-12">
        <div className="container-premium">
          <h1 className="text-5xl font-playfair text-2C2C2C mb-4">Shopping Cart</h1>
        </div>
      </div>

      <div className="section-premium">
        <div className="container-premium">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2C2C2C/70 text-lg mb-6">Your cart is empty</p>
              <Link to="/shop" className="btn-gold">Continue Shopping</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-6 border border-E8D9C4">
                      <div>
                        <h3 className="font-playfair text-xl text-2C2C2C">{item.name}</h3>
                        <p className="text-2C2C2C/60">Qty: {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <p className="font-semibold text-2C2C2C">${(item.price * item.quantity).toFixed(2)}</p>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 hover:bg-F5EFE0 transition"
                        >
                          <Trash2 className="w-5 h-5 text-C9A876" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-F5EFE0 p-8 h-fit">
                <h3 className="text-2xl font-playfair text-2C2C2C mb-6">Order Summary</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>$10.00</span>
                  </div>
                  <div className="border-t border-D4C4B0 pt-4 flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-C9A876">${(total + 10).toFixed(2)}</span>
                  </div>
                </div>
                <Link to="/checkout" className="btn-gold w-full mb-3 block text-center">Proceed to Checkout</Link>
                <Link to="/shop" className="block text-center text-C9A876 text-sm hover:text-D4C4B0">
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
