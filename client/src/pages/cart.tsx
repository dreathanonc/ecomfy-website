import { useState } from "react";
import { ArrowLeft, Minus, Plus, Trash2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { items, updateQuantity, removeItem, total, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [promoCode, setPromoCode] = useState("");

  const shipping = total > 50 ? 0 : 15;
  const tax = total * 0.08;
  const finalTotal = total + shipping + tax;

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const orderItems = items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      return apiRequest("POST", "/api/orders", {
        items: orderItems,
        totalPrice: finalTotal,
      });
    },
    onSuccess: () => {
      clearCart();
      toast({
        title: "Order placed successfully!",
        description: "Thank you for your purchase. You will receive a confirmation email shortly.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Checkout failed",
        description: error.message || "An error occurred during checkout.",
        variant: "destructive",
      });
    },
  });

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to place an order.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    checkoutMutation.mutate();
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-12 text-center">
          <h1 className="text-3xl font-bold mb-4" data-testid="empty-cart-title">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some products to your cart to get started.</p>
          <Link href="/products">
            <Button data-testid="continue-shopping">
              <ArrowLeft className="mr-2" size={16} />
              Continue Shopping
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8" data-testid="cart-title">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="p-6">
              <div className="flex items-center space-x-4">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-lg"
                  data-testid={`cart-item-image-${item.id}`}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg" data-testid={`cart-item-name-${item.id}`}>
                    {item.name}
                  </h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        data-testid={`decrease-quantity-${item.id}`}
                      >
                        <Minus size={16} />
                      </Button>
                      <span className="w-12 text-center font-medium" data-testid={`item-quantity-${item.id}`}>
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        data-testid={`increase-quantity-${item.id}`}
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      data-testid={`remove-item-${item.id}`}
                    >
                      <Trash2 size={16} className="mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary" data-testid={`item-total-${item.id}`}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground" data-testid={`item-price-${item.id}`}>
                    ${item.price.toFixed(2)} each
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          {/* Continue Shopping */}
          <div className="pt-4">
            <Link href="/products">
              <Button variant="outline" data-testid="continue-shopping-button">
                <ArrowLeft className="mr-2" size={16} />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24">
            <h3 className="font-semibold text-lg mb-4" data-testid="order-summary-title">Order Summary</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span data-testid="subtotal">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span data-testid="shipping">
                  {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span data-testid="tax">${tax.toFixed(2)}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary" data-testid="final-total">
                  ${finalTotal.toFixed(2)}
                </span>
              </div>
            </div>
            
            {/* Promo Code */}
            <div className="mb-6">
              <Label className="block text-sm font-medium mb-2">Promo Code</Label>
              <div className="flex gap-2">
                <Input 
                  type="text" 
                  placeholder="Enter code" 
                  className="bg-muted border-border"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  data-testid="promo-code-input"
                />
                <Button 
                  variant="secondary"
                  className="font-medium"
                  data-testid="apply-promo"
                >
                  Apply
                </Button>
              </div>
            </div>
            
            {/* Checkout Button */}
            <Button 
              className="w-full bg-accent text-accent-foreground py-3 text-lg font-semibold mb-4 hover:bg-accent/90"
              onClick={handleCheckout}
              disabled={checkoutMutation.isPending}
              data-testid="checkout-button"
            >
              <Lock className="mr-2" size={16} />
              {checkoutMutation.isPending ? "Processing..." : "Secure Checkout"}
            </Button>
            
            {/* Security Badge */}
            <div className="text-center text-sm text-muted-foreground">
              <Lock className="inline mr-1" size={14} />
              SSL Secured | 30-Day Returns
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
