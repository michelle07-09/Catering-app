import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';
import { useFocusEffect } from '@react-navigation/native';
import { getCart, addToCart } from '../utils/cart';


export default function HomeScreen({ navigation }) {
  const [menuItems, setMenuItems] = useState([]);
  const [userName, setUserName] = useState('');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetchUserProfile();
    fetchMenuItems();
  }, []);
  useFocusEffect(
  React.useCallback(() => {
    (async () => {
      const cart = await getCart();
      const totalQty = cart.reduce(
        (sum, item) => sum + (item.quantity || 1),
        0
      );
      setCartCount(totalQty);
    })();
  }, [])
);


  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setUserName(data.full_name);
    }
  };

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.log('Error fetch menu:', error);
    } else {
      setMenuItems(data);
    }
  };



  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Halo, {userName || 'User'}! 👋
          </Text>
          <Text style={styles.headerSubtitle}>
            Mau pesan apa hari ini?
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Ionicons name="cart" size={24} color="#FF6B4A" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Menu Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Menu Populer</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>

          </View>

          {menuItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuCard}
              onPress={() =>
                navigation.navigate('MenuItemDetail', { menuId: item.id })
              }
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: item.image_url }}
                style={styles.menuImage}
              />

              <View style={styles.menuInfo}>
                <Text style={styles.menuName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.menuDescription} numberOfLines={2}>
                  {item.description}
                </Text>

                <View style={styles.menuFooter}>
                  <Text style={styles.menuPrice}>
                    Rp {item.price.toLocaleString('id-ID')}
                  </Text>

                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={async () => {
                      const next = await addToCart(item);
                      const totalQty = next.reduce((s, i) => s + i.quantity, 0);
                      setCartCount(totalQty);
                    }}
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cartButton: {
    position: 'relative',
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#FFF5F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B4A',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  seeAll: {
    fontSize: 14,
    color: '#FF6B4A',
    fontWeight: '600',
  },
  
  menuCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  menuInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  menuName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  menuDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  menuFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  menuPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B4A',
  },
  addButton: {
    backgroundColor: '#FF6B4A',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

