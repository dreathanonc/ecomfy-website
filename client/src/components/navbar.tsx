import { Link, useLocation } from "wouter";
import { ShoppingCart, Search, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

export function Navbar() {
  const [location] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/">
              <div className="text-2xl font-bold text-primary cursor-pointer">
                <ShoppingCart className="inline mr-2" size={24} />
                EComfy
              </div>
            </Link>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/">
              <button 
                className={`font-medium transition-colors ${
                  location === '/' 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="nav-home"
              >
                Home
              </button>
            </Link>
            <Link href="/products">
              <button 
                className={`font-medium transition-colors ${
                  location === '/products' 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="nav-products"
              >
                Products
              </button>
            </Link>
            <Link href="/cart">
              <button 
                className={`font-medium transition-colors ${
                  location === '/cart' 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="nav-cart"
              >
                Cart
              </button>
            </Link>
            {isAuthenticated && user?.role === 'admin' && (
              <Link href="/admin">
                <button 
                  className={`font-medium transition-colors ${
                    location === '/admin' 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid="nav-admin"
                >
                  Admin
                </button>
              </Link>
            )}
          </div>
          
          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Search - hidden on mobile */}
            <div className="hidden md:block relative">
              <Input 
                type="text" 
                placeholder="Search products..." 
                className="w-64 bg-muted border-border"
                data-testid="search-input"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            </div>
            
            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="sm" className="relative" data-testid="cart-button">
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-accent text-accent-foreground"
                    data-testid="cart-badge"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>
            
            {/* User Account */}
            <div className="flex items-center space-x-2">
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Hello, {user?.username}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={logout}
                    data-testid="logout-button"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" data-testid="login-button">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" data-testid="register-button">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
            
            {/* Mobile Menu Toggle */}
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu size={20} />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
