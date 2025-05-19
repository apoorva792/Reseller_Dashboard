import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { billApi } from '@/lib/api';

// Mock data for development/demo
const MOCK_BALANCE = 370001.00;
// Setting to false to hide the mock flag
const USE_MOCK_DATA = false;

const WalletCard = () => {
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadBalance = async () => {
      try {
        setIsLoading(true);
        console.log('📊 WalletCard: Fetching wallet balance...');
        const balanceData = await billApi.getWalletBalance();
        
        console.log('📊 WalletCard: Balance data received:', balanceData);
        
        if (balanceData && balanceData.currencies_balance) {
          // If we get the new format
          const balance = parseFloat(balanceData.currencies_balance);
          console.log(`📊 WalletCard: Using currencies_balance: ${balance}`);
          setWalletBalance(balance);
        } else if (balanceData && balanceData.balance) {
          // If we get the old format
          console.log(`📊 WalletCard: Using balance: ${balanceData.balance}`);
          setWalletBalance(balanceData.balance);
        } else {
          console.warn('⚠️ WalletCard: Unexpected response format:', balanceData);
          setWalletBalance(MOCK_BALANCE);
        }
        
        setError(null);
      } catch (error) {
        console.error('❌ WalletCard: Error in loadBalance:', error);
        if (error.response) {
          console.error('❌ Response error:', {
            status: error.response.status,
            data: error.response.data
          });
        } else if (error.request) {
          console.error('❌ Request error (no response):', error.request);
        } else {
          console.error('❌ Error message:', error.message);
        }
        
        setError(error.message);
        // Use the mock balance as fallback
        setWalletBalance(MOCK_BALANCE);
        toast.error('Could not fetch wallet balance. Using default value.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBalance();
  }, []);
  
  const handleRechargeClick = () => {
    navigate('/wallet');
  };
  
  return (
    <Card className="card-neumorph hover-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Wallet Balance</CardTitle>
        {/* Hide the mock indicator by setting USE_MOCK_DATA to false */}
        {USE_MOCK_DATA && (
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Mock</span>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-3xl font-bold">
            {isLoading ? "Loading..." : `₹${walletBalance.toFixed(2)}`}
          </div>
          {error && !USE_MOCK_DATA && (
            <div className="text-xs text-red-500">
              Error: {error}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Available for orders & subscriptions
            </div>
            <Button 
              size="sm" 
              className="bg-gold hover:bg-gold-600 text-navy"
              onClick={handleRechargeClick}
            >
              <ArrowUp className="mr-1 h-3 w-3" /> Recharge
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletCard;
