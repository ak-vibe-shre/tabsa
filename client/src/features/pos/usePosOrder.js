import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.js';

export function usePosOrder(orderId, { onChanged } = {}) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const data = await api.get(`/orders/${orderId}`);
      setOrder(data);
      onChanged?.(data);
    } finally {
      setLoading(false);
    }
  }, [orderId, onChanged]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (productId) => {
      const data = await api.post(`/orders/${orderId}/items`, { product_id: productId, quantity: 1 });
      setOrder(data);
      onChanged?.(data);
    },
    [orderId, onChanged]
  );

  const setItemQuantity = useCallback(
    async (itemId, quantity) => {
      const data = await api.patch(`/orders/${orderId}/items/${itemId}`, { quantity });
      setOrder(data);
      onChanged?.(data);
    },
    [orderId, onChanged]
  );

  const removeItem = useCallback(
    async (itemId) => {
      const data = await api.del(`/orders/${orderId}/items/${itemId}`);
      setOrder(data);
      onChanged?.(data);
    },
    [orderId, onChanged]
  );

  const bill = useCallback(async () => {
    const data = await api.post(`/orders/${orderId}/bill`);
    setOrder(data);
    onChanged?.(data);
    return data;
  }, [orderId, onChanged]);

  const pay = useCallback(
    async (paymentMethod, { name, phone } = {}, force = false) => {
      const data = await api.post(`/orders/${orderId}/pay`, {
        payment_method: paymentMethod,
        customer_name: name,
        customer_phone: phone,
        force,
      });
      setOrder(data);
      onChanged?.(data);
      return data;
    },
    [orderId, onChanged]
  );

  const cancel = useCallback(async () => {
    const data = await api.post(`/orders/${orderId}/cancel`);
    setOrder(data);
    onChanged?.(data);
    return data;
  }, [orderId, onChanged]);

  return { order, loading, refresh, addItem, setItemQuantity, removeItem, bill, pay, cancel };
}
