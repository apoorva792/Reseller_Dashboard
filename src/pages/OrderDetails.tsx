import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { orderApi } from '@/lib/api';
import { toast } from 'sonner';
import TicketDialog from '@/components/TicketDialog';

// Status badge variant mapping
const statusVariants: Record<string, { variant: "default" | "outline" | "secondary" | "destructive", label: string }> = {
  pending: { variant: "outline", label: "Pending" },
  paid: { variant: "secondary", label: "Paid" },
  shipped: { variant: "default", label: "Shipped" },
  delivered: { variant: "default", label: "Delivered" },
  cancelled: { variant: "destructive", label: "Cancelled" }
};

const OrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculatedTotals, setCalculatedTotals] = useState({
    subtotal: 0,
    shippingFee: 0,
    total: 0
  });
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;
      setIsLoading(true);

      try {
        console.log(`Fetching details for order: ${orderId}`);
        const data = await orderApi.getOrderById(orderId.toString());
        
        // Debug the received data structure
        console.log('Order data received:', JSON.stringify(data, null, 2));
        
        // Map the expected fields to ensure correct rendering
        const processedOrder = {
          ...data,
          order_id: data.order_id,
          order_serial: data.order_serial || data.amazon_order_id || orderId,
          date_purchased: data.date_purchased,
          status: data.status,
          order_status: data.status, // Map status to expected format for Badge
          delivery_name: data.recipient_name || data.delivery_name,
          delivery_address: data.recipient_address || data.delivery_address,
          delivery_telephone: data.recipient_phone_no || data.delivery_telephone || data.delivery_phone,
          // Ensure products array exists
          products: Array.isArray(data.products) 
            ? data.products.map(product => ({
                ...product,
                product_id: product.product_id,
                quantity: product.quantity,
                price: product.price,
                final_price: product.final_price,
                name: product.name || product.pd_name || product.product_name
              }))
            : [],
        };
        
        console.log('Processed order data:', processedOrder);
        setOrder(processedOrder);
        
        // Calculate totals based on products if the API returns 0
        if (!data.total || !data.subtotal) {
          calculateOrderTotals(processedOrder);
        }
      } catch (err: any) {
        console.error('Error details:', err);
        let errorMsg = "Failed to fetch order details";
        
        if (err.response) {
          console.error('API response error:', err.response.status, err.response.data);
          errorMsg = `API Error (${err.response.status}): ${err.response.data?.detail || errorMsg}`;
        } else if (err.request) {
          console.error('No response received:', err.request);
          errorMsg = "No response received from server";
        } else {
          console.error('Request setup error:', err.message);
          errorMsg = err.message || errorMsg;
        }
        
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);
  
  const calculateOrderTotals = (orderData: any) => {
    // If there's no products array or it's empty, show zero totals
    if (!orderData.products || orderData.products.length === 0) {
      setCalculatedTotals({
        subtotal: 0,
        shippingFee: 0,
        total: 0
      });
      
      // Just ensure products is at least an empty array
      if (!orderData.products) {
        orderData.products = [];
        setOrder({...orderData});
      }
      
      return;
    }
    
    // Calculate based on actual products
    const subtotal = orderData.products.reduce(
      (sum: number, item: any) => sum + (item.quantity * item.price), 
      0
    );
    
    const shippingFee = orderData.shipping_cost || 0;
    const total = subtotal + shippingFee;
    
    setCalculatedTotals({
      subtotal,
      shippingFee,
      total
    });
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Link to="/orders">
            <Button variant="outline" size="sm" className="mr-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
            </Button>
          </Link>
        </div>
        <Card className="card-neumorph">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p>Loading order details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error || !order) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Link to="/orders">
            <Button variant="outline" size="sm" className="mr-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
            </Button>
          </Link>
        </div>
        
        <Card className="card-neumorph">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error || `The order ID "${orderId}" doesn't exist or you don't have permission to view it.`}
            </p>
            <Link to="/orders">
              <Button>View All Orders</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Determine which values to display (calculated or from API)
  const displayTotals = {
    subtotal: order.subtotal > 0 ? order.subtotal : calculatedTotals.subtotal,
    shippingFee: order.shipping_cost > 0 ? order.shipping_cost : calculatedTotals.shippingFee,
    total: order.total > 0 ? order.total : calculatedTotals.total
  };
  
  // Format dates with proper fallback
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Invalid Date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };
  
  const handleOpenTicket = () => {
    setTicketDialogOpen(true);
  };
  
  const handleTicketSuccess = () => {
    toast.success("Ticket created successfully. Our team will review your issue soon.");
    // Optionally, refresh the order details to reflect the dispute status change
    if (orderId) {
      setIsLoading(true);
      orderApi.getOrderById(orderId.toString())
        .then(data => {
          setOrder(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error refreshing order details:', err);
          setIsLoading(false);
        });
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Ticket Dialog */}
      <TicketDialog 
        open={ticketDialogOpen} 
        onOpenChange={setTicketDialogOpen}
        orderId={orderId || ''}
        orderSerial={order?.order_serial || order?.amazon_order_id || ''}
        onSuccess={handleTicketSuccess}
      />
      
      <div className="flex items-center mb-6">
        <Link to="/orders">
          <Button variant="outline" size="sm" className="mr-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Order {order.order_id || order.order_serial || orderId}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Summary Panel */}
        <div className="lg:col-span-1">
          <Card className="card-neumorph h-full">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status and Shipping */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={statusVariants[order.order_status]?.variant || "default"}>
                    {statusVariants[order.order_status]?.label || order.order_status || 'Pending'}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Order Date</span>
                  <span className="font-medium">
                    {formatDate(order.date_purchased)}
                  </span>
                </div>
                
                {order.tracking_number && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tracking Number</span>
                    <span className="font-medium">{order.tracking_number}</span>
                  </div>
                )}
                
                {order.source && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Source</span>
                    <span className="font-medium">{order.source}</span>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{displayTotals.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Shipping Fee</span>
                  <span className="font-medium">₹{displayTotals.shippingFee.toFixed(2)}</span>
                </div>
                
                {order.tax_amount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">₹{order.tax_amount.toFixed(2)}</span>
                  </div>
                )}
                
                {order.discount_amount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium">-₹{order.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">₹{displayTotals.total.toFixed(2)}</span>
                </div>
              </div>
              
              <Button 
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={handleOpenTicket}
              >
                <MessageSquare className="mr-2 h-4 w-4" /> Open a Ticket
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Information */}
          <Card className="card-neumorph-sm">
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-1">Order ID</h3>
                <p className="text-muted-foreground">{order.order_id || order.order_serial || orderId || 'Not available'}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-1">Recipient</h3>
                <p className="text-muted-foreground">
                  {order.delivery_name || order.customer_name || 'Not available'}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-1">Shipping Address</h3>
                <p className="text-muted-foreground">
                  {order.delivery_address || order.shipping_address || 'Not available'}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-1">Contact</h3>
                <p className="text-muted-foreground">
                  {order.delivery_telephone || order.customer_telephone || 'Not available'}
                </p>
              </div>
              
              {order.payment_method && (
                <div>
                  <h3 className="font-semibold mb-1">Payment Method</h3>
                  <p className="text-muted-foreground">{order.payment_method}</p>
                </div>
              )}
              
              {order.customer_email_address && (
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <p className="text-muted-foreground">{order.customer_email_address}</p>
                </div>
              )}
              
              {order.order_notes && (
                <div className="md:col-span-2">
                  <h3 className="font-semibold mb-1">Order Notes</h3>
                  <p className="text-muted-foreground">{order.order_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Order Items */}
          <Card className="card-neumorph-sm">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              {order.products && order.products.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.products.map((item: any, index: number) => (
                      <TableRow key={item.product_id || index}>
                        <TableCell>{item.name || item.product_name || `Product #${index + 1}`}</TableCell>
                        <TableCell className="text-right">{item.quantity || 1}</TableCell>
                        <TableCell className="text-right">₹{(item.price || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{((item.quantity || 1) * (item.price || 0)).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No products found for this order.
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Shipping Information (if available) */}
          {(order.tracking_number || order.shipping_method || order.carrier) && (
            <Card className="card-neumorph-sm">
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {order.tracking_number && (
                  <div>
                    <h3 className="font-semibold mb-1">Tracking Number</h3>
                    <p className="text-muted-foreground">{order.tracking_number}</p>
                  </div>
                )}
                
                {order.shipping_method && (
                  <div>
                    <h3 className="font-semibold mb-1">Shipping Method</h3>
                    <p className="text-muted-foreground">{order.shipping_method}</p>
                  </div>
                )}
                
                {order.carrier && (
                  <div>
                    <h3 className="font-semibold mb-1">Carrier</h3>
                    <p className="text-muted-foreground">{order.carrier}</p>
                  </div>
                )}
                
                {order.estimated_delivery_date && (
                  <div>
                    <h3 className="font-semibold mb-1">Estimated Delivery</h3>
                    <p className="text-muted-foreground">{formatDate(order.estimated_delivery_date)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
