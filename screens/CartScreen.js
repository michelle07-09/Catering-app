import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

export default function CartScreen({ navigation, route }) {
  const [cartItems, setCartItems] = useState(route.params?.cartItems || []);

  const updateQuantity = (itemId, change) => {
    setCartItems(cartItems.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeItem = (itemId) => {
    Alert.alert(
      'Hapus Item',
      'Yakin ingin menghapus item ini dari keranjang?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            setCartItems(cartItems.filter(item => item.id !== itemId));
          },
        },
      ]
    );
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Keranjang Kosong', 'Silakan tambahkan menu terlebih dahulu');
      return;
    }
    navigation.navigate('Payment', {
      cartItems,
      totalAmount: calculateTotal(),
    });
  };

  const DraggableCartItem = ({ item, index }) => {
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
          // Swipe left to delete
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -400,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(itemOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            removeItem(item.id);
          });
        } else {
          // Snap back
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
            {
              transform: [{ translateX }],
              opacity: itemOpacity,
            },
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
                Rp {item.price.toLocaleString('id-ID')}
              </Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.id, -1)}
                >
                  <Ionicons name="remove" size={16} color="#FF6B4A" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.id, 1)}
                >
                  <Ionicons name="add" size={16} color="#FF6B4A" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.itemTotal}>
              Rp {(item.price * item.quantity).toLocaleString('id-ID')}
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Keranjang Saya</Text>
        <View style={{ width: 40 }} />
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyCart}>
          <Ionicons name="cart-outline" size={100} color="#ccc" />
          <Text style={styles.emptyCartTitle}>Keranjang Kosong</Text>
          <Text style={styles.emptyCartText}>
            Belum ada menu yang ditambahkan
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('Home')}
          >
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
            <Text style={styles.swipeHint}>
              💡 Tip: Geser ke kiri untuk menghapus item
            </Text>
            {cartItems.map((item, index) => (
              <DraggableCartItem key={item.id} item={item} index={index} />
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
              style={styles.checkoutButton}
              onPress={handleCheckout}
              activeOpacity={0.8}
            >
              <Text style={styles.checkoutButtonText}>Lanjut ke Pembayaran</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </>
      )}
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
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyCartTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyCartText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  shopButton: {
    backgroundColor: '#FF6B4A',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 30,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cartList: {
    flex: 1,
  },
  cartListContent: {
    padding: 15,
  },
  swipeHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    backgroundColor: '#FFF9E6',
    padding: 10,
    borderRadius: 8,
  },
  cartItemContainer: {
    marginBottom: 15,
    position: 'relative',
  },
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
  deleteText: {
    color: 'white',
    fontSize: 10,
    marginTop: 5,
  },
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
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#666',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
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
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 20,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B4A',
    marginLeft: 10,
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: 30,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B4A',
  },
  checkoutButton: {
    backgroundColor: '#FF6B4A',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
