import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ProductCard } from "@/components/product-card";
import type { Product, Category } from "@shared/schema";

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", searchTerm, selectedCategory, minPrice, maxPrice],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
  });

  // Invalidate products query on mount to ensure fresh data
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
  }, [queryClient]);

  // Also invalidate on window focus to catch any changes from admin panel
  useEffect(() => {
    const handleFocus = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [queryClient]);

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return parseFloat(a.price) - parseFloat(b.price);
      case "price-high":
        return parseFloat(b.price) - parseFloat(a.price);
      case "rating":
        return parseFloat(b.rating || "0") - parseFloat(a.rating || "0");
      case "newest":
        return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
      default:
        return 0;
    }
  });

  const categoryProductCounts = categories.reduce((acc, cat) => {
    acc[cat.id] = products.filter(p => p.categoryId === cat.id).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4" data-testid="products-title">All Products</h1>
        <nav className="text-sm text-muted-foreground">
          <span>Home</span> <span className="mx-2">›</span> <span>Products</span>
        </nav>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-1/4">
          <Card className="p-6 sticky top-24">
            <h3 className="font-semibold text-lg mb-4" data-testid="filters-title">Filters</h3>
            
            {/* Search */}
            <div className="mb-6">
              <Label className="block text-sm font-medium mb-2">Search Products</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-muted border-border pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="product-search"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="mb-6">
              <Label className="block text-sm font-medium mb-2">Category</Label>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={category.id}
                      checked={selectedCategory === category.id}
                      onCheckedChange={(checked) => {
                        setSelectedCategory(checked ? category.id : "");
                      }}
                      data-testid={`category-filter-${category.id}`}
                    />
                    <Label htmlFor={category.id} className="text-sm cursor-pointer">
                      {category.name} ({categoryProductCounts[category.id] || 0})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Price Range */}
            <div className="mb-6">
              <Label className="block text-sm font-medium mb-2">Price Range</Label>
              <div className="flex gap-2 mb-3">
                <Input 
                  type="number" 
                  placeholder="Min" 
                  className="bg-muted border-border text-sm"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  data-testid="min-price-input"
                />
                <Input 
                  type="number" 
                  placeholder="Max" 
                  className="bg-muted border-border text-sm"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  data-testid="max-price-input"
                />
              </div>
            </div>
            
            <Button 
              className="w-full"
              onClick={() => {
                // Trigger refetch by updating query keys
                setSearchTerm(searchTerm);
              }}
              data-testid="apply-filters"
            >
              Apply Filters
            </Button>
          </Card>
        </div>
        
        {/* Products Grid */}
        <div className="lg:w-3/4">
          {/* Sort and View Options */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-muted-foreground" data-testid="product-count">
              Showing {sortedProducts.length} products
            </span>
            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 bg-muted border-border">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Sort by: Featured</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  data-testid="grid-view"
                >
                  <Grid size={16} />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  data-testid="list-view"
                >
                  <List size={16} />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded mb-3"></div>
                    <div className="h-6 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedProducts.length > 0 ? (
            <div 
              className={
                viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "space-y-4"
              }
            >
              {sortedProducts.map((product) => {
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
          ) : (
            <Card className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
