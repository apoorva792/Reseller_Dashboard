import React, { useState, useEffect } from 'react';
import { ArrowUp, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { billApi, userApi } from '@/lib/api';

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

// Transaction type mapping based on backend bill_debitload_type
const BILL_TYPES = {
  0: 'Payment',    // Default/system transaction
  1: 'Recharge',   // Money added to account
  2: 'Withdrawal', // Manual withdrawal
  3: 'Refund'      // Refund for an order
};

const Wallet = () => {
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [autopayEnabled, setAutopayEnabled] = useState<boolean>(true);
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState<boolean>(false);
  const [rechargeAmount, setRechargeAmount] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const pageSize = 10;
  
  // Fetch wallet balance - get the most recent bill's balance_after
  const fetchWalletBalance = async () => {
    try {
      setIsLoading(true);
      const bills = await billApi.getAllBills();
      
      if (bills && Array.isArray(bills) && bills.length > 0) {
        // Get the most recent bill (first in the list since they're ordered by bill_id desc)
        const latestBill = bills[0];
        console.log("Latest bill for balance:", latestBill);
        setWalletBalance(parseFloat(latestBill.bill_balance_after || "0"));
      } else {
        setWalletBalance(0);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      setWalletBalance(0);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch transactions
  const fetchTransactions = async (tab: string = 'all', page: number = 1) => {
    try {
      setIsLoading(true);
      
      // Use the bills endpoint as shown in your backend
      const bills = await billApi.getAllBills();
      
      if (bills && Array.isArray(bills)) {
        console.log('Total bills:', bills.length);
        
        // Filter bills based on tab/bill_debitload_type
        let filteredBills = bills;
        
        if (tab !== 'all') {
          if (tab === 'recharges') {
            // Recharges have bill_debitload_type=1
            filteredBills = bills.filter(bill => bill.bill_debitload_type === 1);
          } else if (tab === 'payments') {
            // Payments have bill_debitload_type=0 or are associated with orders
            filteredBills = bills.filter(bill => 
              bill.bill_debitload_type === 0 ||
              (bill.bill_sum < 0 && bill.order_id)
            );
            
            // Debug payment filtering
            console.log("Payments tab - found bills:", filteredBills.length);
            console.log("Sample payment bills:", filteredBills.slice(0, 3));
          } else if (tab === 'refunds') {
            // Refunds have bill_debitload_type=3
            filteredBills = bills.filter(bill => bill.bill_debitload_type === 3);
          }
        }
        
        console.log(`Filtered bills for tab ${tab}:`, filteredBills.length);
        
        // Calculate total pages
        const total = filteredBills.length;
        const calculatedTotalPages = Math.ceil(total / pageSize);
        setTotalPages(calculatedTotalPages || 1);
        
        // Paginate results
        const startIndex = (page - 1) * pageSize;
        const paginatedBills = filteredBills.slice(startIndex, startIndex + pageSize);
        
        // Transform bill data to frontend transaction format
        const transformedTransactions = paginatedBills.map(bill => {
          // Determine transaction type based on bill_debitload_type
          const type = BILL_TYPES[bill.bill_debitload_type] || 'Transaction';
          
          // Debug: Log raw bill data to understand the structure
          console.log("Processing bill:", {
            id: bill.bill_id,
            debitload_type: bill.bill_debitload_type,
            bill_type: bill.bill_type,
            sum: bill.bill_sum,
            order_id: bill.order_id,
            comments: bill.bill_comments
          });
          
          // Explicitly determine sign based on transaction type and order presence
          let sign = '+';
          
          // Convert bill_sum to number if it's a string
          const billSum = typeof bill.bill_sum === 'string' ? parseFloat(bill.bill_sum) : bill.bill_sum;
          
          if (bill.order_id && bill.bill_debitload_type === 0) {
            // If it's an order payment, it should be negative (money out)
            sign = '-';
          } else if (billSum < 0) {
            // If sum is negative, it's always a deduction
            sign = '-';
          } else if (bill.bill_debitload_type === 1 || bill.bill_debitload_type === 3) {
            // Recharges and refunds are always positive
            sign = '+';
          } else if (bill.bill_debitload_type === 0 || bill.bill_debitload_type === 2) {
            // Regular payments and withdrawals are negative
            sign = '-';
          }
          
          // Add order info to transaction type if present
          let displayType = type;
          if (bill.order_id) {
            displayType = billSum < 0 ? 'Order Payment' : 'Order Refund';
          }
            
          return {
            id: bill.bill_id,
            date: bill.bill_add_date || 'N/A',
            type: displayType,
            amount: billSum ? sign + formatCurrency(Math.abs(billSum)) : 'N/A',
            balance: bill.bill_balance_after ? formatCurrency(parseFloat(bill.bill_balance_after)) : 'N/A',
            details: bill.bill_comments || (bill.order_id ? `Order #${bill.order_id}` : 'N/A'),
            transaction_type: sign === '+' ? 'add' : 'subtract' // For color formatting
          };
        });
        
        setTransactions(transformedTransactions);
      } else {
        setTransactions([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
    setCurrentPage(1); // Reset to first page when changing tabs
    fetchTransactions(tab, 1);
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchTransactions(selectedTab, newPage);
    }
  };
  
  // Handle autopay toggle
  const handleAutopayToggle = async (enabled: boolean) => {
    try {
      setIsLoading(true);
      setAutopayEnabled(enabled);
      
      // Use the appropriate billApi method to update autopay setting
      await billApi.updateAutopay(enabled);
    } catch (error) {
      console.error('Error updating autopay setting:', error);
      // Revert the UI state if the API call fails
      setAutopayEnabled(!enabled);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle recharge wallet
  const handleRechargeWallet = async () => {
    if (!rechargeAmount || isNaN(parseFloat(rechargeAmount)) || parseFloat(rechargeAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    try {
      setIsLoading(true);
      const amount = parseFloat(rechargeAmount);
      
      // Create a new bill directly using the schema from your backend
      const billData = {
        bill_debitload_type: 1, // 1 = Recharge
        bill_type: 0, // Default
        bill_sum: amount,
        currencies_id: 1, // Default currency ID
        bill_comments: 'Wallet recharge',
        bill_balance_before: walletBalance,
        bill_balance_after: walletBalance + amount
      };
      
      // Use the appropriate billApi method to create a new bill
      await billApi.createBill(billData);
      toast.success('Wallet recharged successfully');
      
      setRechargeDialogOpen(false);
      setRechargeAmount('');
      
      // Refresh data
      fetchWalletBalance();
      fetchTransactions(selectedTab, currentPage);
    } catch (error) {
      console.error('Error recharging wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load data on component mount
  useEffect(() => {
    fetchWalletBalance();
    fetchTransactions('all', 1);
  }, []);
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">E-Wallet</h1>
      
      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Wallet Balance</h2>
            <p className="text-muted-foreground">Manage your wallet funds and recharge when needed</p>
            
            <div className="mt-4">
              <div className="text-sm text-muted-foreground">Available Balance</div>
              <div className="text-3xl font-bold mt-1">₹{walletBalance.toFixed(2)}</div>
            </div>
            
            <Button 
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium" 
              onClick={() => setRechargeDialogOpen(true)}
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              Recharge Wallet
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white">
        <CardContent className="pt-6 flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Autopay Settings</h2>
          </div>
          <Switch 
            checked={autopayEnabled} 
            onCheckedChange={handleAutopayToggle} 
          />
        </CardContent>
      </Card>
      
      <div className="flex items-center gap-2 text-sm bg-blue-50 border border-blue-200 p-4 rounded-md">
        <Info size={16} className="text-blue-500" />
        <p>Automatic payments are enabled. Your wallet balance will be used for future orders.</p>
      </div>
      
      <div className="bg-gray-50 border border-gray-100 p-3 rounded-md text-sm">
        Keep your wallet recharged to ensure uninterrupted order processing. A minimum balance of ₹500 is recommended.
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Billing History</h2>
        
        <Tabs value={selectedTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="recharges">Recharges</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="refunds">Refunds</TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedTab} className="mt-4">
            <Card>
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
                      <TableCell colSpan={5} className="text-center py-6">
                        Loading transactions...
                      </TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction, index) => (
                      <TableRow key={transaction.id || index} className="hover:bg-gray-50">
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>{transaction.type}</TableCell>
                        <TableCell className={transaction.amount.startsWith('-') ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                          {transaction.amount}
                        </TableCell>
                        <TableCell>{transaction.balance}</TableCell>
                        <TableCell>
                          <Button 
                            variant="link" 
                            size="sm"
                            className="text-blue-600 p-0 h-auto font-medium"
                          >
                            {transaction.details}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination controls */}
              {transactions.length > 0 && (
                <div className="flex justify-between items-center py-4 px-6 border-t">
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Recharge Dialog */}
      <Dialog open={rechargeDialogOpen} onOpenChange={setRechargeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recharge Wallet</DialogTitle>
            <DialogDescription>
              Enter the amount you want to add to your wallet
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRechargeDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRechargeWallet}
              disabled={isLoading || !rechargeAmount}
            >
              {isLoading ? 'Processing...' : 'Recharge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wallet; 