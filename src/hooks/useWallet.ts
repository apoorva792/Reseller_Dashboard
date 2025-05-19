import { useState } from 'react';
import useApi from './useApi';
import { billApi } from '@/lib/api';

interface BillingFilters {
  page?: number;
  page_size?: number;
  from_date?: string;
  to_date?: string;
}

export function useWalletBalance() {
  const { 
    data, 
    error, 
    isLoading, 
    refetch 
  } = useApi(() => billApi.getWalletBalance());

  const addFunds = async (amount: number, paymentMethod: string) => {
    await billApi.addFunds(amount, paymentMethod);
    refetch();
  };

  return {
    balance: data?.currencies_balance ? parseFloat(data.currencies_balance) : 
            (data?.balance || 0),
    currency: data?.currency || 'INR',
    isLoading,
    error,
    refetch,
    addFunds
  };
}

export function useBillingHistory(initialFilters: BillingFilters = {}) {
  const [filters, setFilters] = useState<BillingFilters>(initialFilters);

  const { 
    data, 
    error, 
    isLoading, 
    refetch 
  } = useApi(() => billApi.getCustomerBills(), {
    deps: [filters],
  });

  const setFilter = (key: keyof BillingFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({});
  };

  return {
    transactions: Array.isArray(data) ? data : [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: Array.isArray(data) ? data.length : 0,
    },
    filters,
    setFilter,
    setFilters,
    resetFilters,
    isLoading,
    error,
    refetch
  };
}

export default { useWalletBalance, useBillingHistory }; 