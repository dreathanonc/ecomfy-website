import { Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  categoryName?: string;
}

export function ProductCard({ product, categoryName }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image: product.image,
    });

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" size={12} className="fill-yellow-400/50 text-yellow-400" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={12} className="text-gray-300" />);
    }

    return stars;
  };

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 product-card border border-border">
      <div className="aspect-square overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
          data-testid={`product-image-${product.id}`}
        />
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          {categoryName && (
            <Badge 
              variant="secondary" 
              className="text-xs bg-accent/10 text-accent"
              data-testid={`product-category-${product.id}`}
            >
              {categoryName}
            </Badge>
          )}
          <div className="flex items-center text-yellow-400">
            {renderStars(parseFloat(product.rating || "0"))}
            <span className="text-muted-foreground text-xs ml-1" data-testid={`product-rating-${product.id}`}>
              ({product.reviewCount})
            </span>
          </div>
        </div>
        <h3 className="font-semibold mb-2" data-testid={`product-name-${product.id}`}>
          {product.name}
        </h3>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2" data-testid={`product-description-${product.id}`}>
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary" data-testid={`product-price-${product.id}`}>
            ${parseFloat(product.price).toFixed(2)}
          </span>
          <Button 
            className="bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-medium text-sm"
            size="sm"
            onClick={handleAddToCart}
            data-testid={`add-to-cart-${product.id}`}
          >
            <ShoppingCart size={16} className="mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
