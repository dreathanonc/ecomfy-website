import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Package, ShoppingCart, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProductSchema, type Product, type Category, type Order } from "@shared/schema";
import { useLocation } from "wouter";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setLocation('/');
    }
  }, [user, setLocation]);

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

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      return response.json();
    },
  });

  const form = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      image: "",
      categoryId: "",
      stock: 0,
    },
  });

  const addProductMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsAddProductOpen(false);
      setEditingProduct(null);
      form.reset();
      toast({
        title: "Product added successfully",
        description: "The new product has been added to your catalog.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => apiRequest("DELETE", `/api/products/${productId}`),
    onSuccess: () => {
      // Close the dialog first
      setIsDeleteDialogOpen(false);
      setDeleteProductId(null);

      // Invalidate all product-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });

      toast({
        title: "Product deleted",
        description: "The product has been removed from your catalog.",
      });
    },
    onError: (error: any) => {
      setIsDeleteDialogOpen(false);
      setDeleteProductId(null);
      toast({
        title: "Error deleting product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      apiRequest("PUT", `/api/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order status updated",
        description: "The order status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: any }) =>
      apiRequest("PUT", `/api/products/${productId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsAddProductOpen(false);
      setEditingProduct(null);
      form.reset();
      toast({
        title: "Product updated successfully",
        description: "The product has been updated in your catalog.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating product",
        description: error.message,
        variant: "destructive",
      });
    },
  });



  const onSubmit = (data: any) => {
    if (editingProduct) {
      updateProductMutation.mutate({ productId: editingProduct.id, data });
    } else {
      addProductMutation.mutate(data);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description || "",
      price: product.price,
      image: product.image || "",
      categoryId: product.categoryId || "",
      stock: product.stock,
    });
    setIsAddProductOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    setDeleteProductId(productId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = () => {
    if (deleteProductId) {
      deleteProductMutation.mutate(deleteProductId);
      // Don't close dialog here - let the mutation success callback handle it
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: string) => {
    updateOrderStatusMutation.mutate({ orderId, status });
  };

  // Calculate stats
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalPrice), 0);
  const activeProducts = products.filter(p => p.isActive).length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="admin-title">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your e-commerce store</p>
          </div>
          {/* Clear & Reset Data button removed as per request */}
          {/* <Button
            variant="outline"
            onClick={() => clearDataMutation.mutate()}
            disabled={clearDataMutation.isPending}
            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            {clearDataMutation.isPending ? "Clearing..." : "Clear & Reset Data"}
          </Button> */}
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Products</p>
                <p className="text-2xl font-bold" data-testid="total-products">{activeProducts}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Package className="text-primary" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Orders</p>
                <p className="text-2xl font-bold" data-testid="total-orders">{orders.length}</p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                <ShoppingCart className="text-accent" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Revenue</p>
                <p className="text-2xl font-bold" data-testid="total-revenue">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Pending Orders</p>
                <p className="text-2xl font-bold" data-testid="pending-orders">{pendingOrders}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Admin Tabs */}
      <Card>
        <Tabs defaultValue="products" className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="products" data-testid="products-tab">Products</TabsTrigger>
              <TabsTrigger value="orders" data-testid="orders-tab">Orders</TabsTrigger>
              <TabsTrigger value="categories" data-testid="categories-tab">Categories</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent>
            <TabsContent value="products" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Product Management</h3>
                <Dialog open={isAddProductOpen} onOpenChange={(open) => {
                  setIsAddProductOpen(open);
                  if (!open) {
                    setEditingProduct(null);
                    form.reset();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button data-testid="add-product-button">
                      <Plus className="mr-2" size={16} />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                      <DialogDescription>
                        {editingProduct ? "Update the product details below." : "Fill in the details to add a new product to your catalog."}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="product-name-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} data-testid="product-description-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} data-testid="product-price-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="image"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Image</FormLabel>
                              <FormControl>
                                <div className="space-y-2">
                                  <Input
                                    {...field}
                                    placeholder="Enter image URL or upload a file"
                                    data-testid="product-image-input"
                                  />
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const formData = new FormData();
                                          formData.append('image', file);

                                          try {
                                            const response = await fetch('/api/upload', {
                                              method: 'POST',
                                              headers: {
                                                'Authorization': token ? `Bearer ${token}` : '',
                                              },
                                              body: formData,
                                            });

                                            console.log('Upload response status:', response.status);
                                            console.log('Upload response headers:', response.headers);

                                            if (response.ok) {
                                              const data = await response.json();
                                              console.log('Upload response data:', data);
                                              field.onChange(data.filePath);
                                              toast({
                                                title: "Image uploaded successfully",
                                                description: "The image has been uploaded and set for the product.",
                                              });
                                              // Reset the file input
                                              e.target.value = '';
                                            } else {
                                              const errorData = await response.text();
                                              console.log('Upload error response:', errorData);
                                              toast({
                                                title: "Upload failed",
                                                description: `Failed to upload the image: ${response.status} ${response.statusText}`,
                                                variant: "destructive",
                                              });
                                            }
                                          } catch (error) {
                                            console.error('Upload error:', error);
                                            toast({
                                              title: "Upload error",
                                              description: "An error occurred while uploading the image.",
                                              variant: "destructive",
                                            });
                                          }
                                        }
                                      }}
                                      className="hidden"
                                      id="image-upload"
                                    />
                                    <Label
                                      htmlFor="image-upload"
                                      className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
                                    >
                                      Upload Image
                                    </Label>
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="product-category-select">
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="stock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stock</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  data-testid="product-stock-input"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={addProductMutation.isPending || updateProductMutation.isPending}
                          data-testid="submit-product"
                        >
                          {addProductMutation.isPending || updateProductMutation.isPending
                            ? (editingProduct ? "Updating..." : "Adding...")
                            : (editingProduct ? "Update Product" : "Add Product")
                          }
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 text-muted-foreground font-medium">Product</th>
                      <th className="text-left py-3 text-muted-foreground font-medium">Category</th>
                      <th className="text-left py-3 text-muted-foreground font-medium">Price</th>
                      <th className="text-left py-3 text-muted-foreground font-medium">Stock</th>
                      <th className="text-left py-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-left py-3 text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const category = categories.find(c => c.id === product.categoryId);
                      return (
                        <tr key={product.id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-4">
                            <div className="flex items-center space-x-3">
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded-lg"
                                data-testid={`admin-product-image-${product.id}`}
                              />
                              <div>
                                <div className="font-medium" data-testid={`admin-product-name-${product.id}`}>
                                  {product.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {product.id.slice(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <Badge variant="secondary" data-testid={`admin-product-category-${product.id}`}>
                              {category?.name || "No category"}
                            </Badge>
                          </td>
                          <td className="py-4 font-medium" data-testid={`admin-product-price-${product.id}`}>
                            ${parseFloat(product.price).toFixed(2)}
                          </td>
                          <td className="py-4" data-testid={`admin-product-stock-${product.id}`}>
                            {product.stock}
                          </td>
                          <td className="py-4">
                            <Badge 
                              variant={product.isActive ? "default" : "destructive"}
                              data-testid={`admin-product-status-${product.id}`}
                            >
                              {product.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="py-4">
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                                data-testid={`edit-product-${product.id}`}
                              >
                                <Edit size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-destructive hover:text-destructive"
                                data-testid={`delete-product-${product.id}`}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="orders" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Order Management</h3>
              </div>
              
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-4 mb-2">
                          <span className="font-semibold" data-testid={`order-id-${order.id}`}>
                            Order #{order.id.slice(0, 8)}
                          </span>
                          <Badge 
                            variant={
                              order.status === 'delivered' ? 'default' :
                              order.status === 'processing' ? 'secondary' :
                              order.status === 'shipped' ? 'outline' : 'destructive'
                            }
                            data-testid={`order-status-${order.id}`}
                          >
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm" data-testid={`order-customer-${order.id}`}>
                          Customer: {order.customerEmail}
                        </p>
                        <p className="text-muted-foreground text-sm" data-testid={`order-date-${order.id}`}>
                          Date: {new Date(order.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold" data-testid={`order-total-${order.id}`}>
                          ${parseFloat(order.totalPrice).toFixed(2)}
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <Select
                            value={order.status}
                            onValueChange={(status) => handleUpdateOrderStatus(order.id, status)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="categories" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Category Management</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <Card key={category.id} className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Package className="text-primary" size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold" data-testid={`category-name-${category.id}`}>
                          {category.name}
                        </h4>
                        <p className="text-sm text-muted-foreground" data-testid={`category-description-${category.id}`}>
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="text-destructive" size={32} />
            </div>
            <AlertDialogTitle className="text-xl font-semibold">
              Hapus Produk?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground mt-2">
              Tindakan ini tidak dapat dibatalkan. Produk akan dihapus secara permanen dari katalog Anda dan tidak dapat dipulihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-row sm:justify-center sm:space-x-4">
            <AlertDialogCancel 
              className="w-full sm:w-auto"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeleteProductId(null);
              }}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction 
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteProduct}
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
