import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';

const CART_KEY = 'cart_v1';

function rupiah(n) {
  return `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
}

export default function MenuItemDetailScreen({ navigation, route }) {
  const menuId = route?.params?.menuId;

  const [item, setItem] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItem();
  }, [menuId]);

  const fetchItem = async () => {
    if (!menuId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', menuId)
      .single();

    setLoading(false);

    if (error) {
      console.log('fetch item error:', error);
      Alert.alert('Error', 'Gagal memuat detail menu');
      navigation.goBack();
      return;
    }
    setItem(data);
  };

  const total = useMemo(() => (item ? Number(item.price || 0) * qty : 0), [item, qty]);

  const addToCart = async () => {
    if (!item) return;

    try {
      const raw = await AsyncStorage.getItem(CART_KEY);
      const cart = raw ? JSON.parse(raw) : [];

      // kalau item sudah ada, tambah qty
      const idx = cart.findIndex((x) => x.id === item.id);
      if (idx >= 0) {
        cart[idx].quantity = (cart[idx].quantity || 1) + qty;
      } else {
        cart.push({
          id: item.id,
          name: item.name,
          price: item.price,
          image_url: item.image_url,
          quantity: qty,
        });
      }

      await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart));

      Alert.alert('Berhasil', 'Menu ditambahkan ke keranjang', [
        { text: 'Lanjut Belanja' },
        { text: 'Ke Keranjang', onPress: () => navigation.navigate('Cart') },
      ]);
    } catch (e) {
      console.log('addToCart error:', e);
      Alert.alert('Error', 'Gagal menambahkan ke keranjang');
    }
  };

  if (!item) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={{ color: '#666' }}>{loading ? 'Loading...' : 'Menu tidak ditemukan'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Menu</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.headerBtn}>
          <Ionicons name="cart-outline" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: item.image_url }} style={styles.hero} />

        <View style={styles.content}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.price}>{rupiah(item.price)}</Text>

          <Text style={styles.desc}>{item.description}</Text>

          {/* Quantity */}
          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>Jumlah</Text>
            <View style={styles.qtyControl}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Ionicons name="remove" size={18} color="#FF6B4A" />
              </TouchableOpacity>

              <Text style={styles.qtyValue}>{qty}</Text>

              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQty((q) => q + 1)}
              >
                <Ionicons name="add" size={18} color="#FF6B4A" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>{rupiah(total)}</Text>
        </View>

        <TouchableOpacity style={styles.orderBtn} onPress={addToCart}>
          <Text style={styles.orderBtnText}>Pesan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

  hero: { width: '100%', height: 260 },
  content: { padding: 16 },
  name: { fontSize: 22, fontWeight: '800', color: '#222' },
  price: { marginTop: 6, fontSize: 18, fontWeight: '800', color: '#FF6B4A' },
  desc: { marginTop: 12, fontSize: 14, color: '#666', lineHeight: 20 },

  qtyRow: { marginTop: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#FFF5F3', justifyContent: 'center', alignItems: 'center',
  },
  qtyValue: { fontSize: 16, fontWeight: '800', color: '#333', minWidth: 20, textAlign: 'center' },

  bottomBar: {
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  totalLabel: { fontSize: 12, color: '#777' },
  totalPrice: { fontSize: 18, fontWeight: '900', color: '#FF6B4A', marginTop: 2 },
  orderBtn: {
    backgroundColor: '#FF6B4A',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  orderBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },
});
