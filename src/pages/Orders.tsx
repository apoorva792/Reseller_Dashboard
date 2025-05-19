import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Download, Upload, Calendar, ChevronDown, FileInput } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { orderApi } from '@/lib/api';

// Order status badge variants
const statusVariants = {
  // Base order status
  OS: { variant: "outline", label: "Processing" },
  OB: { variant: "secondary", label: "Ordered" },
  OC: { variant: "destructive", label: "Cancelled" },
  
  // Payment status
  PU: { variant: "outline", label: "Unpaid" },
  PD: { variant: "secondary", label: "Paid" },
  
  // Shipping status
  SU: { variant: "outline", label: "Unshipped" },
  SP: { variant: "secondary", label: "Processing" },
  SS: { variant: "default", label: "Shipped" },
  
  // Return status
  RA: { variant: "outline", label: "Awaiting Return" },
  RR: { variant: "default", label: "Return Requested" },
  RC: { variant: "secondary", label: "Return Completed" },
  RS: { variant: "secondary", label: "Return Shipped" },
  RD: { variant: "destructive", label: "Return Denied" },
  
  // Dispute status
  DP: { variant: "outline", label: "Dispute Pending" },
  DD: { variant: "destructive", label: "Dispute Denied" },
  DN: { variant: "default", label: "No Dispute" },
  AD: { variant: "secondary", label: "Dispute Accepted" },
  
  // Legacy/compatibility status values
  shipped: { variant: "default", label: "Shipped" },
  processing: { variant: "secondary", label: "Processing" },
  delivered: { variant: "default", label: "Delivered" },
  pending: { variant: "outline", label: "Pending" },
  paid: { variant: "secondary", label: "Paid" },
  cancelled: { variant: "destructive", label: "Cancelled" },
  'awaiting-payment': { variant: "outline", label: "Awaiting Payment" },
  ticketed: { variant: "secondary", label: "Ticketed" },
  abnormal: { variant: "destructive", label: "Abnormal" },
};

// Convert source option values to match backend expectations
const SOURCE_OPTIONS = [
  { label: "All", value: "ALL" },
  { label: "Amazon", value: "1" },
  { label: "Flipkart", value: "2" },
  { label: "Meesho", value: "3" },
  { label: "Shopify", value: "4" },
  { label: "Others", value: "5" }
];

// Helper function to extract error message from various error objects
const getErrorMessage = (error: any): string => {
  if (!error) return "Unknown error occurred";
  
  // If error has a message property, use that
  if (typeof error.message === 'string') {
    if (error.message === 'Network Error') {
      return "Network error: Cannot connect to server. Please check your internet connection.";
    }
    return error.message;
  }
  
  // If error has a response with data and detail
  if (error.response?.data) {
    // Handle array of error details
    if (Array.isArray(error.response.data.detail)) {
      return error.response.data.detail.map((item: any) => 
        typeof item === 'string' ? item : JSON.stringify(item)
      ).join(', ');
    }
    
    // Handle string detail
    if (typeof error.response.data.detail === 'string') {
      return error.response.data.detail;
    }
    
    // If detail exists but is an object
    if (error.response.data.detail) {
      return "Validation error. Please check your input data.";
    }
    
    // Try to stringify the entire data object
    try {
      return JSON.stringify(error.response.data);
    } catch (e) {
      return "Server returned an error";
    }
  }
  
  // For HTTP errors without detailed response
  if (error.response?.status) {
    switch (error.response.status) {
      case 400: return "Bad request: The server cannot process the request";
      case 401: return "Unauthorized: Please log in again";
      case 403: return "Forbidden: You don't have permission to access this resource";
      case 404: return "Not found: The requested resource does not exist";
      case 422: return "Validation error: Please check your input data";
      case 500: return "Server error: Something went wrong on the server";
      default: return `Server error (${error.response.status})`;
    }
  }
  
  // Fallback
  return "An unexpected error occurred";
};

// Calculate total order amount from products
const calculateOrderAmount = (products: any[]): number => {
  if (!products || !Array.isArray(products)) return 0;
  return products.reduce((sum, product) => sum + (parseFloat(product.final_price) * product.quantity), 0);
};

// Get display status based on backend status codes
const getDisplayStatus = (order: any): { status: string, variant: string } => {
  // Order cancelled takes priority
  if (order.status === 'OC') {
    return { status: "Cancelled", variant: "destructive" };
  }
  
  // Check payment status
  if (order.status_payment === 'PU') {
    return { status: "Awaiting Payment", variant: "outline" };
  }
  
  // Return/dispute status
  if (order.status_return && order.status_return !== 'RN') {
    const returnStatus = statusVariants[order.status_return];
    if (returnStatus) {
      return { status: returnStatus.label, variant: returnStatus.variant as string };
    }
  }
  
  if (order.status_dispute && order.status_dispute !== 'DN') {
    const disputeStatus = statusVariants[order.status_dispute];
    if (disputeStatus) {
      return { status: disputeStatus.label, variant: disputeStatus.variant as string };
    }
  }
  
  // Shipping status
  if (order.status_shipping) {
    const shippingStatus = statusVariants[order.status_shipping];
    if (shippingStatus) {
      return { status: shippingStatus.label, variant: shippingStatus.variant as string };
    }
  }
  
  // Fall back to main status
  const mainStatus = statusVariants[order.status];
  if (mainStatus) {
    return { status: mainStatus.label, variant: mainStatus.variant as string };
  }
  
  // Default
  return { status: "Processing", variant: "secondary" };
};

const Orders = () => {
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMarketplace, setSelectedMarketplace] = useState("ALL");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showRecentOnly, setShowRecentOnly] = useState(false);
  const [sortBy, setSortBy] = useState("last_modified");
  
  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch orders based on selected tab
  const fetchTabOrders = async (tab: string) => {
    setIsLoading(true);
    try {
      const filters = {
        from_date: dateRange.from,
        to_date: dateRange.to,
        order_search_item: searchTerm,
        source_option: selectedMarketplace,
        page,
        page_size: pageSize,
        store_by: sortBy // Use the sortBy state
      };

      let response;
      switch(tab) {
        case 'awaiting-payment':
          response = await orderApi.getUnpaidOrders(filters);
          break;
        case 'processing':
          response = await orderApi.getWaitForShippingOrders(filters);
          break;
        case 'shipped':
          response = await orderApi.getConfirmedOrders(filters);
          break;
        case 'abnormal':
          response = await orderApi.getAbnormalOrders(filters);
          break;
        case 'ticketed':
          response = await orderApi.getTicketedOrders(filters);
          break;
        case 'cancelled':
          response = await orderApi.getCancelledOrders(filters);
          break;
        case 'all':
        default:
          response = await orderApi.getAllOrders(filters);
          break;
      }

      setOrders(response.orders || []);
      setTotalCount(response.total_count || 0);
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(`Failed to fetch orders: ${errorMessage}`);
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update useEffect to use the new fetchTabOrders function
  useEffect(() => {
    fetchTabOrders(selectedTab);
  }, [selectedTab, searchTerm, selectedMarketplace, dateRange, page, sortBy]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    // Check if file is CSV
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error("Only CSV files are allowed");
      return;
    }

    // Check file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Maximum size is 10MB`);
      return;
    }

    // Validate CSV content by reading first few lines
    try {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        const content = e.target?.result as string;
        const lines = content.split('\n');
        
        if (lines.length < 2) {
          toast.error("CSV file must contain header row and at least one data row");
          return;
        }
        
        const header = lines[0].trim();
        console.log("CSV Header:", header);
        
        // Ensure required fields are present for the order creation service
        const requiredFields = [
          'order-id', 'sku', 'quantity-purchased', 
          'recipient-name', 'ship-address-1', 'ship-city', 
          'ship-state', 'ship-postal-code', 'order-item-id'
        ];
        
        // Expected header structure
        const expectedHeader = [
          'order-id', 'ship-phone', 'sku', 'quantity-purchased', 
          'recipient-name', 'ship-address-1', 'ship-address-2', 
          'ship-address-3', 'ship-city', 'ship-state', 'ship-postal-code',
          'consumer_price', 'order-item-id', 'product-name', 'shipping-price'
        ];
        
        const headerFields = header.split(',').map(field => field.trim().toLowerCase());
        
        // Allow for variations in column names
        const normalizeFieldName = (field) => {
          // Handle variations like ship-phone-number or ship_phone, etc.
          if (field.includes('ship') && field.includes('phone')) return 'ship-phone';
          return field;
        };

        const normalizedHeaderFields = headerFields.map(normalizeFieldName);
        
        const missingFields = requiredFields.filter(field => 
          !normalizedHeaderFields.includes(field.toLowerCase())
        );
        
        if (missingFields.length > 0) {
          toast.error(`CSV missing required fields: ${missingFields.join(', ')}`);
          return;
        }
        
        // Warn the user about the column count
        if (headerFields.length !== expectedHeader.length) {
          toast.warning(`Your CSV header has ${headerFields.length} columns, but we recommend ${expectedHeader.length} columns for best results. Download our template for reference.`);
        }
        
        // Check the first data row to ensure it has the right format
        if (lines.length >= 2) {
          const firstDataRow = lines[1].trim();
          const values = firstDataRow.split(',');
          
          // Instead of erroring on mismatch, provide a warning and continue with upload
          if (values.length !== headerFields.length) {
            console.warn(`Warning: Data row has ${values.length} columns but header has ${headerFields.length} columns. Attempting to proceed with upload.`);
            
            // Check if we can still map the essential fields
            const essentialFields = ['order-id', 'sku', 'quantity-purchased', 'recipient-name'];
            const canProceed = essentialFields.every(field => {
              const index = headerFields.indexOf(field);
              return index >= 0 && index < values.length;
            });
            
            if (!canProceed) {
              toast.error("Essential fields (order-id, sku, quantity) can't be mapped correctly. Please check your CSV format.");
              return;
            }
            
            toast.warning(`Warning: Column count mismatch between header (${headerFields.length}) and data (${values.length}). The system will attempt to map fields based on header positions.`);
          }
          
          // Check order-id format (should look like Amazon order IDs)
          const orderIdIndex = headerFields.indexOf('order-id');
          if (orderIdIndex >= 0 && orderIdIndex < values.length) {
            const orderId = values[orderIdIndex];
            if (!orderId.match(/\d+-\d+-\d+/) && !orderId.match(/\w+-\d+/)) {
              toast.warning("Order ID format may not be recognized. Expected format: XXX-XXXXXXX-XXXXXXX");
            }
          }
          
          // Validate SKU is a number
          const skuIndex = headerFields.indexOf('sku');
          if (skuIndex >= 0 && skuIndex < values.length) {
            const sku = values[skuIndex];
            if (!sku.match(/^\d+$/)) {
              toast.warning("SKU should be a numeric value");
            }
          }
        }
        
        console.log('CSV validation passed, proceeding with upload');
        await uploadFile();
      };
      
      fileReader.readAsText(selectedFile);
    } catch (error) {
      console.error("CSV validation error:", error);
      toast.error("Failed to validate CSV file");
    }
  };
  
  const uploadFile = async () => {
    setIsUploading(true);
    try {
      toast.info("Uploading file...");
      console.log('Starting upload of file:', selectedFile.name);
      
      const response = await orderApi.uploadOrders(selectedFile);
      
      console.log('Upload successful:', response);
      toast.success(`Successfully processed orders from ${selectedFile.name}`);
      setUploadDialogOpen(false);
      fetchTabOrders(selectedTab); // Refresh orders list
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Enhanced error handling with more details
      let errorMessage = "Failed to upload orders";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response) {
        console.error('Server response:', error.response);
        
        // Handle various status codes
        if (error.response.status === 500) {
          errorMessage = "Server error processing your file. Please check the server logs.";
        } else if (error.response.status === 422) {
          if (error.response.data?.detail) {
            errorMessage = typeof error.response.data.detail === 'string' 
              ? error.response.data.detail 
              : Array.isArray(error.response.data.detail)
                ? error.response.data.detail[0]
                : "Invalid data in CSV file";
          } else {
            errorMessage = "File validation failed. Please check the format.";
          }
        } else if (error.response.status === 401) {
          errorMessage = "Authentication failed. Please log in again.";
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  const OrderActions = ({ orderId }: { orderId: string | number }) => (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Download className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Download Invoice</TooltipContent>
      </Tooltip>
      <Link to={`/orders/${orderId}`}>
        <Button variant="ghost" size="sm">View Details</Button>
      </Link>
    </div>
  );

  // Render a table row for an order
  const renderOrderRow = (order: any) => {
    const amount = calculateOrderAmount(order.products);
    const { status, variant } = getDisplayStatus(order);
    
    return (
      <TableRow key={order.order_id}>
        <TableCell>{order.order_serial || order.order_id}</TableCell>
        <TableCell>
          {/* Always display Amazon regardless of the source value */}
          Amazon
        </TableCell>
        <TableCell>
          <Badge variant={variant as any}>
            {status}
          </Badge>
        </TableCell>
        <TableCell>₹{amount.toFixed(2)}</TableCell>
        <TableCell>{new Date(order.date_purchased).toLocaleDateString()}</TableCell>
        <TableCell>{order.delivery_name}</TableCell>
        <TableCell>
          <OrderActions orderId={order.order_id} />
        </TableCell>
      </TableRow>
    );
  };

  // Filter orders to show only recent uploads if the filter is active
  const filteredOrders = showRecentOnly 
    ? orders.filter(order => {
        // Check if the order was created within the last 24 hours
        const orderDate = new Date(order.date_purchased);
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        return orderDate >= twentyFourHoursAgo;
      })
    : orders;

  const downloadTemplate = () => {
    // Create a CSV template with the correct header formatting
    const header = "order-id,ship-phone,sku,quantity-purchased,recipient-name,ship-address-1,ship-address-2,ship-address-3,ship-city,ship-state,ship-postal-code,consumer_price,order-item-id,product-name,shipping-price";
    const sampleRow = "123-4567890-1234567,9876543210,12345678,1,John Doe,123 Main St,Apt 456,Near Landmark,New York,NY,10001,29.99,01234567891234,Sample Product,4.99";
    
    const csvContent = [header, sampleRow].join('\n');
    
    // Create a blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'order_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("CSV template downloaded. Please follow this format for your order data.");
  };

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Orders
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9"
            />
          </div>
        </div>
        <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Marketplace" />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-4 space-y-2">
            <div className="space-y-1">
              <label className="text-sm">From</label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm">To</label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
          </PopoverContent>
        </Popover>
        <Button 
          variant={showRecentOnly ? "default" : "outline"} 
          onClick={() => setShowRecentOnly(!showRecentOnly)}
          className="whitespace-nowrap"
        >
          {showRecentOnly ? "Showing Recent" : "Show Recent Only"}
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="awaiting-payment">Awaiting Payment</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="shipped">Shipped</TabsTrigger>
          <TabsTrigger value="abnormal">Abnormal</TabsTrigger>
          <TabsTrigger value="ticketed">Ticketed orders</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        
        {/* Create a common tab content structure that will be used for all tabs */}
        {['all', 'awaiting-payment', 'processing', 'shipped', 'abnormal', 'ticketed', 'cancelled'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      onClick={() => setSortBy(sortBy === "orderid" ? "orderiddesc" : "orderid")} 
                      className="cursor-pointer hover:bg-gray-100"
                    >
                      Order ID {sortBy === "orderid" && "↑"}{sortBy === "orderiddesc" && "↓"}
                    </TableHead>
                    <TableHead>Marketplace</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead 
                      onClick={() => setSortBy(sortBy === "price" ? "pricedesc" : "price")} 
                      className="cursor-pointer hover:bg-gray-100"
                    >
                      Amount {sortBy === "price" && "↑"}{sortBy === "pricedesc" && "↓"}
                    </TableHead>
                    <TableHead 
                      onClick={() => setSortBy(sortBy === "date" ? "datedesc" : "date")} 
                      className="cursor-pointer hover:bg-gray-100"
                    >
                      Order Date {sortBy === "date" && "↑"}{sortBy === "datedesc" && "↓"}
                    </TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        Loading orders...
                      </TableCell>
                    </TableRow>
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        {showRecentOnly ? "No recent orders found" : "No orders found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map(renderOrderRow)
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Orders</DialogTitle>
            <DialogDescription>
              Upload a CSV file containing order data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1"
              />
            </div>
            {selectedFile && (
              <div className="text-sm">
                Selected file: <span className="font-semibold">{selectedFile.name}</span>
              </div>
            )}
            <div className="bg-muted p-3 rounded-md text-sm">
              <h4 className="font-medium mb-2">CSV Format:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>15 columns including header row</li>
                <li>Maximum file size: 10MB</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
              <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
