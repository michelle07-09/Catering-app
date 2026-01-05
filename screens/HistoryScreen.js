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

export default function HistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);

    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const user = userRes?.user;

      if (!user?.id) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          total_amount,
          status,
          created_at,
          scheduled_date,
          payment_method,
          order_items (
            quantity,
            price,
            menu_items ( name )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('fetchOrders error:', error);
        setOrders([]);
      } else {
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.log('fetchOrders fatal:', e?.message || e);
      setOrders([]);
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
        return status || '-';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatOnlyDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(`${dateString}T00:00:00`);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getPaymentMeta = (method) => {
    if (!method) return { text: 'Belum dipilih', icon: 'help-circle-outline' };

    const m = String(method).toLowerCase();

    if (m === 'cash' || m.includes('cod')) {
      return { text: 'Cash on Delivery', icon: 'cash-outline' };
    }
    if (m === 'transfer') {
      return { text: 'Transfer Bank', icon: 'card-outline' };
    }
    if (m === 'ewallet' || m === 'e-wallet') {
      return { text: 'E-Wallet', icon: 'phone-portrait-outline' };
    }

    return { text: method, icon: 'card-outline' };
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

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
          <RefreshControl refreshing={loading} onRefresh={fetchOrders} tintColor="#FF6B4A" />
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
          orders.map((order) => {
            const paymentMeta = getPaymentMeta(order.payment_method);

            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                activeOpacity={0.9}
                onPress={() => navigation?.navigate?.('OrderDetail', { orderId: order.id })}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderHeaderLeft}>
                    <Text style={styles.orderId}>Order #{order.id}</Text>
                    <Text style={styles.orderDate}>{formatDateTime(order.created_at)}</Text>
                    <Text style={styles.scheduleDate}>
                      Dipesan untuk: {formatOnlyDate(order.scheduled_date)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(order.status) + '20' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.orderItems}>
                  {(order.order_items || []).map((item, index) => (
                    <View key={index} style={styles.orderItem}>
                      <View style={styles.orderItemBullet} />
                      <Text style={styles.orderItemText}>
                        {item?.menu_items?.name || 'Menu'} x{item.quantity}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.divider} />

                <View style={styles.orderFooter}>
                  <View style={styles.orderInfo}>
                    <Ionicons name={paymentMeta.icon} size={16} color="#666" />
                    <Text style={styles.orderInfoText}>{paymentMeta.text}</Text>
                  </View>

                  <View style={styles.orderTotal}>
                    <Text style={styles.orderTotalLabel}>Total:</Text>
                    <Text style={styles.orderTotalAmount}>
                      Rp {Number(order.total_amount || 0).toLocaleString('id-ID')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
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
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  content: { flex: 1 },
  contentContainer: { padding: 20 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyStateTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 20 },
  emptyStateText: { fontSize: 14, color: '#666', marginTop: 10, textAlign: 'center' },

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
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderHeaderLeft: { flex: 1 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  orderDate: { fontSize: 12, color: '#666', marginTop: 4 },
  scheduleDate: { fontSize: 12, color: '#FF6B4A', marginTop: 4, fontWeight: '500' },

  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },

  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },

  orderItems: { gap: 8 },
  orderItem: { flexDirection: 'row', alignItems: 'center' },
  orderItemBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF6B4A', marginRight: 10 },
  orderItemText: { fontSize: 14, color: '#666', flex: 1 },

  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderInfoText: { fontSize: 12, color: '#666' },
  orderTotal: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderTotalLabel: { fontSize: 12, color: '#666' },
  orderTotalAmount: { fontSize: 16, fontWeight: 'bold', color: '#FF6B4A' },
});
