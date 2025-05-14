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
    balance: data?.balance || 0,
    currency: data?.currency || 'USD',
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
  } = useApi(() => billApi.getBillingHistory(filters), {
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
    transactions: data?.transactions || [],
    pagination: {
      currentPage: data?.page || 1,
      totalPages: data?.total_pages || 1,
      totalItems: data?.total_items || 0,
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