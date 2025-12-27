import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';

export default function HistoryScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price,
            menu_items (name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setOrders(data);
      }
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'processing':
        return '#007AFF';
      case 'completed':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'processing':
        return 'Diproses';
      case 'completed':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Pesanan</Text>
        <TouchableOpacity onPress={fetchOrders}>
          <Ionicons name="refresh" size={24} color="#FF6B4A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchOrders}
            tintColor="#FF6B4A"
          />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={100} color="#ccc" />
            <Text style={styles.emptyStateTitle}>Belum Ada Pesanan</Text>
            <Text style={styles.emptyStateText}>
              Riwayat pesanan Anda akan muncul di sini
            </Text>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderHeaderLeft}>
                  <Text style={styles.orderId}>Order #{order.id}</Text>
                  <Text style={styles.orderDate}>
                    {formatDate(order.created_at)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(order.status) },
                    ]}
                  >
                    {getStatusText(order.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.orderItems}>
                {order.order_items.map((item, index) => (
                  <View key={index} style={styles.orderItem}>
                    <View style={styles.orderItemBullet} />
                    <Text style={styles.orderItemText}>
                      {item.menu_items.name} x{item.quantity}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.divider} />

              <View style={styles.orderFooter}>
                <View style={styles.orderInfo}>
                  <Ionicons name="card-outline" size={16} color="#666" />
                  <Text style={styles.orderInfoText}>
                    {order.payment_method === 'cash'
                      ? 'Cash on Delivery'
                      : order.payment_method === 'transfer'
                      ? 'Transfer Bank'
                      : 'E-Wallet'}
                  </Text>
                </View>
                <View style={styles.orderTotal}>
                  <Text style={styles.orderTotalLabel}>Total:</Text>
                  <Text style={styles.orderTotalAmount}>
                    Rp {parseFloat(order.total_amount).toLocaleString('id-ID')}
                  </Text>
                </View>
              </View>

              {order.delivery_address && (
                <View style={styles.addressContainer}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.addressText} numberOfLines={2}>
                    {order.delivery_address}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  orderItems: {
    gap: 8,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderItemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B4A',
    marginRight: 10,
  },
  orderItemText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderInfoText: {
    fontSize: 12,
    color: '#666',
  },
  orderTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderTotalLabel: {
    fontSize: 12,
    color: '#666',
  },
  orderTotalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B4A',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 6,
  },
  addressText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
});
