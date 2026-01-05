import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabaseClient';

const CART_KEY = 'cart_v1';

export default function CartScreen({ navigation, route }) {
  const [cartItems, setCartItems] = useState([]);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(() => {
  const d = new Date();
  d.setDate(d.getDate() + 2);     
  d.setHours(0, 0, 0, 0);         
  return d;                       
});


const [showPicker, setShowPicker] = useState(false);

const toISODateOnly = (input) => {
  if (!input) return null;

  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};



  // 1) Load cart: prioritas dari params (kalau datang dari MenuDetail), lalu simpan ke storage
  useEffect(() => {
    const incoming = route.params?.cartItems;
    if (Array.isArray(incoming)) {
      setCartItems(incoming);
      AsyncStorage.setItem(CART_KEY, JSON.stringify(incoming)).catch(() => {});
    }
  }, [route.params?.cartItems]);

  // 2) Setiap kali screen difokuskan, reload cart dari storage (biar konsisten)
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const raw = await AsyncStorage.getItem(CART_KEY);
          if (!mounted) return;
          const parsed = raw ? JSON.parse(raw) : [];
          setCartItems(Array.isArray(parsed) ? parsed : []);
        } catch {
          // ignore
        }
      })();
      return () => {
        mounted = false;
      };
    }, [])
  );

  const persistCart = async (next) => {
    setCartItems(next);
    try {
      await AsyncStorage.setItem(CART_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const updateQuantity = (itemId, change) => {
    const next = cartItems.map((item) => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, (item.quantity || 1) + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    persistCart(next);
  };

  const removeItem = (itemId) => {
    Alert.alert('Hapus Item', 'Yakin ingin menghapus item ini dari keranjang?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          const next = cartItems.filter((item) => item.id !== itemId);
          persistCart(next);
        },
      },
    ]);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = Number(item.price || 0);
      const qty = Number(item.quantity || 1);
      return total + price * qty;
    }, 0);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Keranjang Kosong', 'Silakan tambahkan menu terlebih dahulu');
      return;
    }

    setLoadingCheckout(true);
    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const user = userRes?.user;
      if (!user?.id) {
        Alert.alert('Belum Login', 'Silakan login terlebih dahulu.');
        setLoadingCheckout(false);
        return;
      }

      const total = calculateTotal();

      // 1) Insert ke orders
      const { data: orderRow, error: orderErr } = await supabase
        .from('orders')
        .insert([
          {
            user_id: user.id,
            total_amount: total,
            status: 'pending', 
            scheduled_date: toISODateOnly(scheduledDate),

          },
        ])
        .select('id')
        .single();

      if (orderErr) throw orderErr;

      // 2) Insert ke order_items (bulk)
      const orderId = orderRow.id;
      const orderItemsPayload = cartItems.map((item) => ({
        order_id: orderId,
        menu_item_id: item.id, // item.id dari menu_items
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0),
      }));

      const { error: itemsErr } = await supabase
        .from('order_items')
        .insert(orderItemsPayload);

      if (itemsErr) throw itemsErr;

      // 3) Clear cart
      await persistCart([]);
      setLoadingCheckout(false);

      Alert.alert('Berhasil!', 'Pesanan kamu berhasil dibuat ✅', [
  {
    text: 'Lanjut Bayar',
    onPress: () =>
      navigation.navigate('Payment', { orderId, totalAmount: total }),
  },
]);


    } catch (err) {
      setLoadingCheckout(false);
      console.log('Checkout error:', err?.message || err);
      Alert.alert('Gagal Checkout', err?.message || 'Terjadi kesalahan saat membuat pesanan');
    }
  };

  const DraggableCartItem = ({ item }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const itemOpacity = useRef(new Animated.Value(1)).current;

    const onGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: translateX } }],
      { useNativeDriver: true }
    );

    const onHandlerStateChange = (event) => {
  if (event.nativeEvent.state === State.END) {
    const { translationX } = event.nativeEvent;

    if (translationX < -100) {
      Alert.alert('Hapus Item', 'Apakah anda ingin menghapus menu ini?', [
        {
          text: 'Batal',
          style: 'cancel',
          onPress: () => {
            // balikkan posisi item
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }).start();
          },
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            // baru animasi keluar lalu hapus dari cart
            Animated.parallel([
              Animated.timing(translateX, {
                toValue: -400,
                duration: 250,
                useNativeDriver: true,
              }),
              Animated.timing(itemOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }),
            ]).start(() => {
              const next = cartItems.filter((x) => x.id !== item.id);
              persistCart(next);
            });
          },
        },
      ]);
    } else {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }
};

    return (
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View
          style={[
            styles.cartItemContainer,
            { transform: [{ translateX }], opacity: itemOpacity },
          ]}
        >
          <View style={styles.deleteIndicator}>
            <Ionicons name="trash" size={24} color="white" />
            <Text style={styles.deleteText}>Geser untuk hapus</Text>
          </View>

          <View style={styles.cartItem}>
            <Image source={{ uri: item.image_url }} style={styles.cartItemImage} />
            <View style={styles.cartItemInfo}>
              <Text style={styles.cartItemName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.cartItemPrice}>
                Rp {Number(item.price || 0).toLocaleString('id-ID')}
              </Text>

              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.id, -1)}
                >
                  <Ionicons name="remove" size={16} color="#FF6B4A" />
                </TouchableOpacity>

                <Text style={styles.quantityText}>{item.quantity || 1}</Text>

                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.id, 1)}
                >
                  <Ionicons name="add" size={16} color="#FF6B4A" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.itemTotal}>
              Rp {(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString('id-ID')}
            </Text>
          </View>
        </Animated.View>
      </PanGestureHandler>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Keranjang Saya</Text>
        <View style={{ width: 40 }} />
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyCart}>
          <Ionicons name="cart-outline" size={100} color="#ccc" />
          <Text style={styles.emptyCartTitle}>Keranjang Kosong</Text>
          <Text style={styles.emptyCartText}>Belum ada menu yang ditambahkan</Text>
          <TouchableOpacity style={styles.shopButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.shopButtonText}>Mulai Belanja</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.cartList}
            contentContainerStyle={styles.cartListContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.swipeHint}>💡 Tip: Geser ke kiri untuk menghapus item</Text>
            {cartItems.map((item) => (
              <DraggableCartItem key={item.id} item={item} />
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Pembayaran:</Text>
              <Text style={styles.totalAmount}>
                Rp {calculateTotal().toLocaleString('id-ID')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.dateRow}
              onPress={() => setShowPicker(true)}
              activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="calendar-outline" size={18} color="#FF6B4A" />
                  <Text style={styles.dateLabel}>Tanggal Catering</Text>
                </View>
                <Text style={styles.dateValue}>{toISODateOnly(scheduledDate)}</Text>
              </TouchableOpacity>

              {showPicker && (
                <DateTimePicker
                  value={scheduledDate}
                  mode="date"
                  display="default"
                  minimumDate={(() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1); // minimal H+1
                    d.setHours(0, 0, 0, 0);
                    return d;
                  })()}
                  onChange={(_e, selected) => {
                    setShowPicker(false);
                    if (selected) {
                      selected.setHours(0, 0, 0, 0);
                      setScheduledDate(selected);
                    }
                  }}
                />
              )}

            
            <TouchableOpacity
              style={[styles.checkoutButton, loadingCheckout && { opacity: 0.7 }]}
              onPress={handleCheckout}
              activeOpacity={0.8}
              disabled={loadingCheckout}
            >
              {loadingCheckout ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.checkoutButtonText}>Buat Pesanan</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
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
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },

  emptyCart: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyCartTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 20 },
  emptyCartText: { fontSize: 14, color: '#666', marginTop: 10, textAlign: 'center' },
  shopButton: {
    backgroundColor: '#FF6B4A',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 30,
  },
  shopButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },

  cartList: { flex: 1 },
  cartListContent: { padding: 15 },
  swipeHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    backgroundColor: '#FFF9E6',
    padding: 10,
    borderRadius: 8,
  },
  cartItemContainer: { marginBottom: 15, position: 'relative' },
  deleteIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  deleteText: { color: 'white', fontSize: 10, marginTop: 5 },

  cartItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cartItemImage: { width: 80, height: 80, borderRadius: 10 },
  cartItemInfo: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  cartItemName: { fontSize: 14, fontWeight: '600', color: '#333' },
  cartItemPrice: { fontSize: 12, color: '#666' },

  quantityContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF5F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B4A',
  },
  quantityText: { fontSize: 14, fontWeight: '600', color: '#333', minWidth: 20, textAlign: 'center' },
  itemTotal: { fontSize: 16, fontWeight: 'bold', color: '#FF6B4A', marginLeft: 10 },

  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: 30,
  },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalLabel: { fontSize: 16, color: '#666' },
  totalAmount: { fontSize: 24, fontWeight: 'bold', color: '#FF6B4A' },
  checkoutButton: {
    backgroundColor: '#FF6B4A',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  checkoutButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  dateRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#FFF5F3',
  padding: 12,
  borderRadius: 12,
  marginBottom: 12,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF6B4A',
  },

});
