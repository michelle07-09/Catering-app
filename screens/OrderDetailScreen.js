import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';

const formatDate = (isoDate) => {
  if (!isoDate) return '-';
  const d = new Date(isoDate);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatDateTime = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) +
    ' pukul ' +
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

export default function OrderDetailScreen({ navigation, route }) {
  const { orderId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  const CATERING_PHONE = '6285256596234';
  
  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total_amount,
          scheduled_date,
          created_at,
          order_items (
            id,
            quantity,
            price,
            menu_items ( id, name, image_url )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (e) {
      console.log('Load order detail error:', e?.message || e);
    } finally {
      setLoading(false);
    }
  };

  const badgeColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('pending') || s.includes('menunggu')) return '#FFF3D6';
    if (s.includes('confirm') || s.includes('dikonfirmasi')) return '#E8F5E9';
    if (s.includes('cancel') || s.includes('batal')) return '#FFEBEE';
    return '#F2F2F2';
  };

  const badgeTextColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('pending') || s.includes('menunggu')) return '#C27C00';
    if (s.includes('confirm') || s.includes('dikonfirmasi')) return '#2E7D32';
    if (s.includes('cancel') || s.includes('batal')) return '#C62828';
    return '#555';
  };

  const isCancelled = useMemo(() => {
    const s = (order?.status || '').toLowerCase();
    return s.includes('cancel') || s.includes('batal');
  }, [order?.status]);

  const contactViaWhatsApp = async () => {
    if (!order) return;

    const itemsText = (order.order_items || [])
      .map((it) => `- ${it.menu_items?.name || '-'} x${it.quantity || 1}`)
      .join('\n');

    const message =
      `Halo Admin Catering 👋\n` +
      `Saya ingin menanyakan pesanan berikut:\n\n` +
      `Order ID: ${order.id}\n` +
      `Tanggal Catering: ${formatDate(order.scheduled_date)}\n` +
      `Total: Rp ${Number(order.total_amount || 0).toLocaleString('id-ID')}\n\n` +
      `Item:\n${itemsText || '-'}\n\n` +
      `Terima kasih 🙏`;

    // wa.me
    const url = `https://wa.me/${CATERING_PHONE}?text=${encodeURIComponent(message)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(
          'WhatsApp tidak tersedia',
          'WhatsApp tidak terdeteksi. Coba gunakan tombol Telepon.'
        );
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Gagal membuka WhatsApp', e?.message || 'Terjadi kesalahan');
    }
  };

  const callCatering = async () => {
    const telUrl = `tel:${CATERING_PHONE}`;
    try {
      const supported = await Linking.canOpenURL(telUrl);
      if (!supported) {
        Alert.alert('Tidak bisa melakukan panggilan', 'Perangkat tidak mendukung fitur telepon.');
        return;
      }
      await Linking.openURL(telUrl);
    } catch (e) {
      Alert.alert('Gagal membuka Telepon', e?.message || 'Terjadi kesalahan');
    }
  };



  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text>Order tidak ditemukan</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Detail Pesanan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Card info */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.orderId}>Order #{order.id}</Text>
            <View style={[styles.badge, { backgroundColor: badgeColor(order.status) }]}>
              <Text style={[styles.badgeText, { color: badgeTextColor(order.status) }]}>
                {order.status || 'Menunggu'}
              </Text>
            </View>
          </View>

          <Text style={styles.muted}>Dibuat: {formatDateTime(order.created_at)}</Text>

          <View style={styles.divider} />

          <Text style={styles.label}>Tanggal Catering</Text>
          <Text style={styles.value}>{formatDate(order.scheduled_date)}</Text>

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Total</Text>
            <Text style={styles.total}>Rp {Number(order.total_amount || 0).toLocaleString('id-ID')}</Text>
          </View>
        </View>

        {/* Items */}
        <Text style={styles.sectionTitle}>Item Pesanan</Text>

        {(order.order_items || []).map((it) => (
          <View key={it.id} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{it.menu_items?.name || '-'}</Text>
              <Text style={styles.muted}>
                {it.quantity} x Rp {Number(it.price || 0).toLocaleString('id-ID')}
              </Text>
            </View>
            <Text style={styles.itemSubtotal}>
              Rp {Number((it.price || 0) * (it.quantity || 1)).toLocaleString('id-ID')}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* ✅ Sticky Contact Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.whatsappButton, isCancelled && styles.disabledBtn]}
          onPress={contactViaWhatsApp}
          activeOpacity={0.85}
          disabled={isCancelled}
        >
          <Ionicons name="logo-whatsapp" size={20} color="white" />
          <Text style={styles.whatsappText}>WhatsApp Catering</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.callButton, isCancelled && styles.disabledBtnOutline]}
          onPress={callCatering}
          activeOpacity={0.85}
          disabled={isCancelled}
        >
          <Ionicons name="call-outline" size={20} color="#FF6B4A" />
          <Text style={styles.callText}>Telepon</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#333' },

  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 16, fontWeight: '800', color: '#333', flex: 1, paddingRight: 10 },

  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '800' },

  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },

  label: { fontSize: 13, color: '#777', fontWeight: '700' },
  value: { fontSize: 15, color: '#333', fontWeight: '800', marginTop: 4 },

  total: { fontSize: 16, fontWeight: '900', color: '#FF6B4A' },
  muted: { marginTop: 6, fontSize: 12, color: '#777' },

  sectionTitle: { marginTop: 16, marginBottom: 10, fontSize: 16, fontWeight: '900', color: '#333' },

  itemRow: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemName: { fontSize: 14, fontWeight: '800', color: '#333' },
  itemSubtotal: { fontSize: 13, fontWeight: '900', color: '#333' },

  // ✅ bottom bar
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 26,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 10,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  whatsappText: { color: 'white', fontSize: 16, fontWeight: '700' },

  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF6B4A',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  callText: { color: '#FF6B4A', fontSize: 16, fontWeight: '700' },

});
