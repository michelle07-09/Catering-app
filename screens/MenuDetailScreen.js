import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';

export default function MenuDetailScreen({ navigation, route }) {
  const { categoryId, showAllCategories } = route.params || {};
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(categoryId || null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchMenuItems(selectedCategory);
    } else if (showAllCategories) {
      fetchAllMenuItems();
    }
  }, [selectedCategory, showAllCategories]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true });
    
    if (data) {
      setCategories(data);
      if (!selectedCategory && data.length > 0 && !showAllCategories) {
        setSelectedCategory(data[0].id);
      }
    }
  };

  const fetchMenuItems = async (catId) => {
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('category_id', catId)
      .eq('is_available', true)
      .order('name', { ascending: true });
    
    if (data) setMenuItems(data);
  };

  const fetchAllMenuItems = async () => {
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true)
      .order('name', { ascending: true });
    
    if (data) setMenuItems(data);
  };

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }

    Alert.alert('Berhasil!', `${item.name} ditambahkan ke keranjang`);
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
        <Text style={styles.headerTitle}>Menu</Text>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart', { cartItems: cart })}
        >
          <Ionicons name="cart-outline" size={24} color="#333" />
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Categories Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesFilter}
        contentContainerStyle={styles.categoriesFilterContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryFilterButton,
              selectedCategory === category.id && styles.categoryFilterButtonActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text
              style={[
                styles.categoryFilterText,
                selectedCategory === category.id && styles.categoryFilterTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Menu Items Grid */}
      <ScrollView
        style={styles.menuContainer}
        contentContainerStyle={styles.menuContent}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>Belum ada menu tersedia</Text>
          </View>
        ) : (
          <View style={styles.menuGrid}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItemCard}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.menuItemImage}
                />
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.menuItemDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <View style={styles.menuItemFooter}>
                    <Text style={styles.menuItemPrice}>
                      Rp {item.price.toLocaleString('id-ID')}
                    </Text>
                    <TouchableOpacity
                      style={styles.addToCartButton}
                      onPress={() => addToCart(item)}
                    >
                      <Ionicons name="add" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
  cartButton: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF6B4A',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoriesFilter: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoriesFilterContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  categoryFilterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  categoryFilterButtonActive: {
    backgroundColor: '#FF6B4A',
  },
  categoryFilterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryFilterTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  menuContainer: {
    flex: 1,
  },
  menuContent: {
    padding: 15,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItemCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItemImage: {
    width: '100%',
    height: 120,
  },
  menuItemInfo: {
    padding: 12,
  },
  menuItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 11,
    color: '#666',
    marginBottom: 8,
  },
  menuItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B4A',
  },
  addToCartButton: {
    backgroundColor: '#FF6B4A',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
