import { useState } from 'react';
import useApi from './useApi';
import { orderApi } from '@/lib/api';

interface OrderFilters {
  page?: number;
  page_size?: number;
  from_date?: string;
  to_date?: string;
  order_search_item?: string;
  source_option?: string;
  store_by?: string;
}

export function useOrders(initialFilters: OrderFilters = {}) {
  const [filters, setFilters] = useState<OrderFilters>(initialFilters);

  const { 
    data, 
    error, 
    isLoading, 
    refetch 
  } = useApi(() => orderApi.getAllOrders(filters), {
    deps: [filters],
  });

  const setFilter = (key: keyof OrderFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({});
  };

  return {
    orders: data?.orders || [],
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

export function useOrderDetails(orderId: string | undefined) {
  const { 
    data, 
    error, 
    isLoading, 
    refetch 
  } = useApi(
    () => orderApi.getOrderDetails(orderId || ''),
    { 
      skip: !orderId,
      deps: [orderId],
    }
  );

  return {
    order: data?.order,
    isLoading,
    error,
    refetch
  };
}

export default useOrders; 