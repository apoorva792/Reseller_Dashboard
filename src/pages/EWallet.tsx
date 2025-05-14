import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp, Info, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { billApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import axios from 'axios';

// Type for Bill objects
interface Bill {
  bill_id: number;
  customer_id?: number;
  bill_parent_id?: number | null;
  order_id?: number | null;
  bill_debitload_type: number;
  bill_type: number;
  bill_sum: number;
  currencies_id: number;
  bill_balance_before?: number | null;
  bill_balance_after?: number | null;
  bill_add_date?: string | null;
  bill_modify_date?: string | null;
  bill_comments?: string | null;
  bill_bill_serial?: string | null;
}

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jh6x5iq1s9.execute-api.ap-southeast-2.amazonaws.com/dev';

const EWallet = () => {
  const [autopayEnabled, setAutopayEnabled] = useState(true);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [billDetailsOpen, setBillDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch data on component mount
  useEffect(() => {
    console.log('E-Wallet component mounted');
    const token = localStorage.getItem('accessToken');
    console.log('Authorization token exists:', !!token);
    console.log('API Base URL:', API_BASE_URL);
    
    // Make a direct API fetch on component mount
    const fetchData = async () => {
      console.log('🔄 Starting direct API fetch for bills...');
      
      try {
        setIsLoading(true);
        // Try different API endpoints for bills
        const possibleEndpoints = [
          '/bills',             // Try direct bills endpoint
          '/user/bills',        // Try user-specific bills endpoint  
          '/user/bills/',       // Try with trailing slash
          '/billing/history'    // Try billing history endpoint
        ];
        
        let successfulEndpoint = null;
        let responseData = null;
        
        if (!token) {
          console.error('❌ No auth token found!');
          toast.error('Authentication required. Please log in again.');
          return;
        }
        
        console.log('🔑 Using auth token (first few chars):', token.substring(0, 10) + '...');
        
        // Try each endpoint until one works
        for (const endpoint of possibleEndpoints) {
          try {
            const url = `${API_BASE_URL}${endpoint}`;
            console.log(`⏳ Trying endpoint: ${url}`);
            
            const response = await axios.get(url, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 30000
            });
            
            if (response.status >= 200 && response.status < 300) {
              console.log(`✅ Successful response from ${endpoint}:`, response.status);
              successfulEndpoint = endpoint;
              responseData = response.data;
              break;
            }
          } catch (err) {
            console.log(`❌ Endpoint ${endpoint} failed:`, err.message);
          }
        }
        
        if (successfulEndpoint && responseData) {
          console.log(`✅ Successfully fetched data from ${successfulEndpoint}`);
          console.log('📊 Response data:', responseData);
          
          if (Array.isArray(responseData)) {
            console.log('✅ Valid array response with', responseData.length, 'bills');
            setBills(responseData);
          } else if (responseData.bills && Array.isArray(responseData.bills)) {
            // Handle case where bills are in a nested property
            console.log('✅ Valid nested array response with', responseData.bills.length, 'bills');
            setBills(responseData.bills);
          } else {
            console.warn('⚠️ Response is not in expected format:', responseData);
            toast.error('Invalid response format from bills API');
            // Fall back to mock data
            loadMockData();
          }
        } else {
          console.error('❌ All API endpoints failed');
          toast.error('Could not connect to billing service');
          // Fall back to mock data
          loadMockData();
        }
      } catch (error) {
        console.error('❌ API request failed:', error);
        
        if (error.response) {
          console.error('❌ Error details:', error.response.status, error.response.data);
        } else if (error.request) {
          console.error('❌ No response received. Possible CORS or network issue.');
        }
        
        toast.error('Failed to load bills. Check console for details.');
        loadMockData();
      } finally {
        setIsLoading(false);
      }
    };
    
    const loadMockData = () => {
      // Load mock data as fallback
      console.log('⚠️ Loading mock data as fallback');
      const mockBills: Bill[] = [
        {
          bill_id: 1001,
          bill_debitload_type: 2, // payment
          bill_type: 1,
          bill_sum: 1189.72,
          currencies_id: 1,
          bill_balance_before: 744152.00,
          bill_balance_after: 742962.19,
          bill_add_date: '2025-05-01T22:14:41',
          bill_comments: 'Payment for order #12345'
        },
        {
          bill_id: 1002,
          bill_debitload_type: 2, // payment
          bill_type: 1,
          bill_sum: 2322.49,
          currencies_id: 1,
          bill_balance_before: 742962.19,
          bill_balance_after: 740639.70,
          bill_add_date: '2025-05-01T22:14:41',
          bill_comments: 'Payment for order #12346'
        }
      ];
      setBills(mockBills);
    };
    
    fetchWalletBalance();
    fetchData(); // Use the direct fetch instead of fetchBills()
  }, []);

  const fetchWalletBalance = async () => {
    try {
      console.log('Fetching wallet balance...');
      const response = await billApi.getWalletBalance();
      console.log('Wallet balance response:', response);
      if (response && response.balance) {
        setWalletBalance(response.balance);
      } else {
        console.log('No valid wallet balance response, using default');
        setWalletBalance(370001.00);
      }
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      toast.error('Could not load wallet balance. Using default value.');
      setWalletBalance(370001.00);
    }
  };

  const fetchBills = async (filterType?: string) => {
    try {
      setIsLoading(true);
      console.log('🔄 Fetching bills with filter:', filterType);
      
      // Try the endpoint that worked during initial load
      const url = `${API_BASE_URL}/bills`;
      console.log('📡 API URL:', url);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('❌ No auth token found');
        toast.error('Authentication required. Please log in again.');
        setBills([]);
        setIsLoading(false);
        return;
      }
      
      console.log('🔑 Using token (first 10 chars):', token.substring(0, 10) + '...');
      
      // Add a log right before making the request
      console.log('⏳ About to make GET request to bills endpoint...');
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      });
      
      console.log('✅ Bills API response received!');
      console.log('📊 Status:', response.status);
      console.log('📊 Full response data:', JSON.stringify(response.data, null, 2));
      
      let billsData = response.data;
      
      // Check if response is in expected format
      if (!Array.isArray(billsData) && billsData.bills && Array.isArray(billsData.bills)) {
        billsData = billsData.bills;
      }
      
      if (Array.isArray(billsData)) {
        let filteredBills = billsData;
        
        // Apply filter if needed
        if (filterType && filterType !== 'all') {
          // Map the UI filter names to the API's bill_debitload_type values
          const filterMap: Record<string, number> = {
            'recharges': 1, // Adding funds
            'payments': 2,  // Payment for order
            'refunds': 3    // Refund
          };
          
          if (filterMap[filterType]) {
            filteredBills = billsData.filter(bill => 
              bill.bill_debitload_type === filterMap[filterType]
            );
          }
        }
        
        console.log('🔍 Filtered bills:', filteredBills);
        setBills(filteredBills);
      } else {
        console.warn('⚠️ Invalid bills response format. Response is not an array:', response.data);
        toast.error('Could not load bills. Invalid response from server.');
      }
    } catch (error) {
      console.error('❌ Failed to fetch bills:', error);
      if (error.response) {
        console.error('❌ Error response:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('❌ No response received from server. Possible CORS issue?');
        console.error('❌ Request details:', error.request);
      } else {
        console.error('❌ Error setting up request:', error.message);
      }
      
      setBills([]);
      toast.error('Failed to load billing data. Please check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewBillDetails = async (billId: number) => {
    try {
      console.log('Viewing bill details for ID:', billId);
      // First check if we already have this bill in our list
      const bill = bills.find(b => b.bill_id === billId);
      
      if (bill) {
        setSelectedBill(bill);
        setBillDetailsOpen(true);
        return;
      }
      
      // If not found in current list, fetch from API directly
      setSelectedBill(null); // Clear previous bill
      
      const baseUrl = 'https://jh6x5iq1s9.execute-api.ap-southeast-2.amazonaws.com/dev';
      const url = `${baseUrl}/bills/${billId}`;
      console.log('Fetching bill details from:', url);
      
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log('Bill details API response:', response.data);
      
      if (response.data) {
        setSelectedBill(response.data);
        setBillDetailsOpen(true);
      } else {
        toast.error('Could not fetch bill details');
      }
    } catch (error) {
      console.error('Error fetching bill details:', error);
      toast.error('Could not fetch bill details');
    }
  };

  const handleTabChange = (value: string) => {
    console.log('Tab changed to:', value);
    setActiveTab(value);
    fetchBills(value);
  };

  const handleRecharge = () => {
    toast.success('Recharge initiated. You will be redirected to the payment gateway.');
    // Add your redirect logic here
  };

  const handleAutopayChange = (checked: boolean) => {
    setAutopayEnabled(checked);
    toast.success(`Autopay ${checked ? 'enabled' : 'disabled'}`);
  };

  // Format currency display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Helper to determine transaction type label
  const getBillTypeLabel = (bill: Bill) => {
    // Mapping based on bill_debitload_type
    const typeMap: Record<number, string> = {
      0: 'Unknown',
      1: 'Recharge',  // Credit/adding funds
      2: 'Payment',   // Debit/payment for order
      3: 'Refund',    // Credit/refund
      4: 'Adjustment' // Adjustment
    };
    
    return typeMap[bill.bill_debitload_type] || 'Transaction';
  };

  // Helper to determine if amount should be displayed as positive or negative
  const getAmountClass = (bill: Bill) => {
    // Debitload types 1 (recharge) and 3 (refund) add to balance (positive)
    // Debitload type 2 (payment) subtracts from balance (negative)
    if (bill.bill_debitload_type === 1 || bill.bill_debitload_type === 3) {
      return 'text-green-600 font-medium';
    }
    return 'text-red-600 font-medium';
  };

  // Format display amount with + or - prefix
  const getDisplayAmount = (bill: Bill) => {
    if (bill.bill_debitload_type === 1 || bill.bill_debitload_type === 3) {
      return `+${formatCurrency(bill.bill_sum)}`;
    }
    return `-${formatCurrency(bill.bill_sum)}`;
  };

  // Format date string
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // Helper function to render bill detail items
  const renderBillDetailItem = (label: string, value: any) => {
    return (
      <div className="flex justify-between border-b pb-2 mb-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
    );
  };

  // Render a table showing bills
  const renderBillsTable = () => {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">Loading billing data...</TableCell>
              </TableRow>
            ) : bills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">No billing records found</TableCell>
              </TableRow>
            ) : (
              bills.map(bill => (
                <TableRow key={bill.bill_id} className="hover:bg-gray-50">
                  <TableCell>{formatDate(bill.bill_add_date)}</TableCell>
                  <TableCell>{getBillTypeLabel(bill)}</TableCell>
                  <TableCell className={getAmountClass(bill)}>
                    {getDisplayAmount(bill)}
                  </TableCell>
                  <TableCell>{bill.bill_balance_after ? formatCurrency(bill.bill_balance_after) : 'N/A'}</TableCell>
                  <TableCell>
                    <Button 
                      variant="link" 
                      size="sm"
                      className="text-blue-600 p-0 h-auto font-medium"
                      onClick={() => handleViewBillDetails(bill.bill_id)}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-semibold">E-Wallet</h1>
      
      {/* Wallet Balance Card */}
      <Card className="card-neumorph">
        <CardHeader>
          <CardTitle className="text-xl">Wallet Balance</CardTitle>
          <CardDescription>
            Manage your wallet funds and recharge when needed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(walletBalance)}</p>
            </div>
            <Button 
              onClick={handleRecharge}
              className="bg-gold hover:bg-gold-600 text-navy"
            >
              <ArrowUp className="mr-1 h-4 w-4" /> Recharge Wallet
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Autopay Section */}
      <Card className="card-neumorph">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Autopay Settings</CardTitle>
            <Switch 
              checked={autopayEnabled}
              onCheckedChange={handleAutopayChange}
              id="autopay-mode"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {autopayEnabled 
                ? "Automatic payments are enabled. Your wallet balance will be used for future orders."
                : "Automatic payments are disabled. You'll need to manually pay for future orders."}
            </p>
          </div>
          <div className="p-3 bg-muted rounded-md mt-3">
            <p className="text-sm">
              Keep your wallet recharged to ensure uninterrupted order processing. A minimum balance of ₹500 is recommended.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Billing History */}
      <Card className="card-neumorph">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="recharges">Recharges</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="refunds">Refunds</TabsTrigger>
            </TabsList>
            
            {/* Single tab content section for all tabs */}
            <TabsContent value={activeTab} className="mt-0">
              {renderBillsTable()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Bill Details Dialog */}
      <Dialog open={billDetailsOpen} onOpenChange={setBillDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
            <DialogDescription>
              Detailed information about this transaction
            </DialogDescription>
          </DialogHeader>
          
          {selectedBill ? (
            <div className="py-4">
              {renderBillDetailItem("Bill ID", selectedBill.bill_id)}
              {renderBillDetailItem("Type", getBillTypeLabel(selectedBill))}
              {renderBillDetailItem("Amount", getDisplayAmount(selectedBill))}
              {renderBillDetailItem("Date", formatDate(selectedBill.bill_add_date))}
              {selectedBill.order_id && renderBillDetailItem("Order ID", selectedBill.order_id)}
              {renderBillDetailItem("Previous Balance", selectedBill.bill_balance_before ? formatCurrency(selectedBill.bill_balance_before) : 'N/A')}
              {renderBillDetailItem("New Balance", selectedBill.bill_balance_after ? formatCurrency(selectedBill.bill_balance_after) : 'N/A')}
              {selectedBill.bill_comments && renderBillDetailItem("Comments", selectedBill.bill_comments)}
            </div>
          ) : (
            <div className="py-4 text-center">Loading bill details...</div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setBillDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EWallet;
