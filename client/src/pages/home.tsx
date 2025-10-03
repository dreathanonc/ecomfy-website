import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowRight, Laptop, Shirt, Home as HomeIcon, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard } from "@/components/product-card";
import { Link } from "wouter";
import type { Product, Category } from "@shared/schema";

export default function Home() {
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
  });

  // Invalidate queries on mount and window focus to ensure fresh data
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
  }, [queryClient]);

  useEffect(() => {
    const handleFocus = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [queryClient]);

  const featuredProducts = products.slice(0, 4);

  const categoryIcons = {
    "Electronics": Laptop,
    "Fashion": Shirt,
    "Home & Garden": HomeIcon,
    "Sports": Dumbbell,
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="hero-gradient text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6" data-testid="hero-title">
            Discover Amazing Products
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90" data-testid="hero-subtitle">
            Shop the latest trends with fast delivery and secure checkout
          </p>
          <Link href="/products">
            <Button 
              className="bg-white text-primary px-8 py-4 text-lg font-semibold hover:bg-white/90 transition-colors shadow-lg"
              data-testid="hero-cta"
            >
              Shop Now <ArrowRight className="ml-2" size={20} />
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Featured Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12" data-testid="categories-title">
          Shop by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category) => {
            const IconComponent = categoryIcons[category.name as keyof typeof categoryIcons] || Laptop;
            
            return (
              <Link key={category.id} href={`/products?category=${category.id}`}>
                <Card className="p-6 text-center hover:shadow-lg transition-shadow border border-border cursor-pointer">
                  <CardContent className="p-0">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                      <IconComponent size={32} className="text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1" data-testid={`category-name-${category.id}`}>
                      {category.name}
                    </h3>
                    <p className="text-muted-foreground text-sm" data-testid={`category-count-${category.id}`}>
                      {products.filter(p => p.categoryId === category.id).length} products
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Featured Products */}
      <div className="bg-muted py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12" data-testid="featured-title">
            Featured Products
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => {
              const category = categories.find(c => c.id === product.categoryId);
              return (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  categoryName={category?.name} 
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-xl font-bold text-primary mb-4">
                <Laptop className="inline mr-2" size={20} />
                EComfy
              </div>
              <p className="text-muted-foreground text-sm">
                Your trusted online marketplace for quality products and exceptional service.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/products?category=electronics" className="hover:text-foreground transition-colors">Electronics</Link></li>
                <li><Link href="/products?category=fashion" className="hover:text-foreground transition-colors">Fashion</Link></li>
                <li><Link href="/products?category=home" className="hover:text-foreground transition-colors">Home & Garden</Link></li>
                <li><Link href="/products?category=sports" className="hover:text-foreground transition-colors">Sports</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Shipping Info</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Returns</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <p className="text-muted-foreground text-sm">
                Follow us on social media for the latest updates and offers.
              </p>
            </div>
          </div>
          <hr className="border-border my-8" />
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; 2024 EComfy. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
