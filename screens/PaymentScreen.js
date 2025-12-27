import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';

export default function PaymentScreen({ navigation, route }) {
  const { cartItems, totalAmount } = route.params;
  const [selectedPayment, setSelectedPayment] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const paymentMethods = [
    { id: 'cash', name: 'Cash on Delivery', icon: 'cash' },
    { id: 'transfer', name: 'Transfer Bank', icon: 'card' },
    { id: 'ewallet', name: 'E-Wallet', icon: 'phone-portrait' },
  ];

  const handlePayment = async () => {
    if (!selectedPayment) {
      Alert.alert('Error', 'Pilih metode pembayaran terlebih dahulu');
      return;
    }

    if (!deliveryAddress.trim()) {
      Alert.alert('Error', 'Alamat pengiriman harus diisi');
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'Silakan login terlebih dahulu');
        return;
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: user.id,
            total_amount: totalAmount,
            status: 'pending',
            payment_method: selectedPayment,
            delivery_address: deliveryAddress,
            notes: notes,
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setLoading(false);

      Alert.alert(
        'Pesanan Berhasil!',
        'Pesanan Anda telah diterima dan sedang diproses.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MainTabs', { screen: 'Home' }),
          },
        ]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Gagal memproses pesanan: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pembayaran</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Pesanan</Text>
          <View style={styles.summaryCard}>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.summaryItem}>
                <Text style={styles.summaryItemName}>
                  {item.name} x{item.quantity}
                </Text>
                <Text style={styles.summaryItemPrice}>
                  Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                </Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>
                Rp {totalAmount.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Masukkan alamat lengkap pengiriman"
            placeholderTextColor="#999"
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catatan (Opsional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tambahkan catatan untuk pesanan Anda"
            placeholderTextColor="#999"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentOption,
                selectedPayment === method.id && styles.paymentOptionSelected,
              ]}
              onPress={() => setSelectedPayment(method.id)}
              activeOpacity={0.7}
            >
              <View style={styles.paymentOptionLeft}>
                <View
                  style={[
                    styles.radio,
                    selectedPayment === method.id && styles.radioSelected,
                  ]}
                >
                  {selectedPayment === method.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Ionicons
                  name={method.icon}
                  size={24}
                  color={selectedPayment === method.id ? '#FF6B4A' : '#666'}
                />
                <Text
                  style={[
                    styles.paymentOptionText,
                    selectedPayment === method.id && styles.paymentOptionTextSelected,
                  ]}
                >
                  {method.name}
                </Text>
              </View>
              {selectedPayment === method.id && (
                <Ionicons name="checkmark-circle" size={24} color="#FF6B4A" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total Pembayaran</Text>
          <Text style={styles.footerTotalAmount}>
            Rp {totalAmount.toLocaleString('id-ID')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.payButtonText}>
            {loading ? 'Memproses...' : 'Bayar Sekarang'}
          </Text>
        </TouchableOpacity>
      </View>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryItemName: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  summaryItemPrice: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B4A',
  },
  textArea: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentOptionSelected: {
    borderColor: '#FF6B4A',
    backgroundColor: '#FFF9F7',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#FF6B4A',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B4A',
  },
  paymentOptionText: {
    fontSize: 14,
    color: '#666',
  },
  paymentOptionTextSelected: {
    color: '#333',
    fontWeight: '600',
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: 30,
  },
  footerTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  footerTotalLabel: {
    fontSize: 14,
    color: '#666',
  },
  footerTotalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B4A',
  },
  payButton: {
    backgroundColor: '#FF6B4A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
