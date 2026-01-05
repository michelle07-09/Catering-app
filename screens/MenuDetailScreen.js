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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';
import { useFocusEffect } from '@react-navigation/native';
import { getCart, addToCart } from '../utils/cart';


export default function MenuDetailScreen({ navigation, route }) {
  const { category, showAllCategories } = route.params || {};

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(category || null);
  const [menuItems, setMenuItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const cart = await getCart();
        setCartCount(
          cart.reduce((sum, item) => sum + (item.quantity || 1), 0)
        );
      })();
    }, [])
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchMenuItemsByCategory(selectedCategory);
    } else if (showAllCategories) {
      fetchAllMenuItems();
    } else {
      // default: load all kalau belum ada kategori
      fetchAllMenuItems();
    }
  }, [selectedCategory, showAllCategories]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('category');

    if (error) {
      console.log('Error fetch categories:', error);
      return;
    }

    const unique = Array.from(
      new Set((data || []).map((x) => x.category).filter(Boolean))
    );

    setCategories(unique);

    // set default category kalau belum ada
    if (!selectedCategory && unique.length > 0 && !showAllCategories) {
      setSelectedCategory(unique[0]);
    }
  };

  const fetchMenuItemsByCategory = async (cat) => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('category', cat)
      .order('name', { ascending: true });

    if (error) {
      console.log('Error fetch menu by category:', error);
      setMenuItems([]);
      return;
    }

    setMenuItems(data || []);
  };

  const fetchAllMenuItems = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.log('Error fetch all menu:', error);
      setMenuItems([]);
      return;
    }

    setMenuItems(data || []);
  };

  

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Menu</Text>

        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Ionicons name="cart-outline" size={24} color="#333" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#FF6B4A" />
          <TextInput
            placeholder="Cari menu..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholderTextColor="#FF6B4A"
          />
      </View>

      


      {/* Categories Filter */}
      {categories.length > 0 && (
  <View style={styles.categoriesWrapper}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesFilterContent}
    >
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat}
          style={[
            styles.categoryFilterButton,
            selectedCategory === cat && styles.categoryFilterButtonActive,
          ]}
          onPress={() => setSelectedCategory(cat)}
        >
          <Text
            style={[
              styles.categoryFilterText,
              selectedCategory === cat && styles.categoryFilterTextActive,
            ]}
          >
            {cat}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
)}


      {/* Menu Items Grid */}
      <ScrollView
        style={styles.menuContainer}
        contentContainerStyle={styles.categoriesFilterContent}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>Belum ada menu tersedia</Text>
          </View>
        ) : (
          <View style={styles.menuGrid}>
            {menuItems
            .filter((item) =>
              item.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItemCard}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('MenuItemDetail', { menuId: item.id })}
              >
                <Image source={{ uri: item.image_url }} style={styles.menuItemImage} />
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.menuItemDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <View style={styles.menuItemFooter}>
                    <Text style={styles.menuItemPrice}>
                      Rp {Number(item.price || 0).toLocaleString('id-ID')}
                    </Text>
                    <TouchableOpacity
                      style={styles.addToCartButton}
                      onPress={async () => {
                        await addToCart(item);
                        const cart = await getCart();
                        setCartCount(cart.reduce((s, i) => s + i.quantity, 0));
                      }}
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
    borderBottomWidth: 2,
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
  categoriesWrapper: {
  backgroundColor: 'white',
  height: 60,                 
  justifyContent: 'center',
  borderBottomWidth: 1,
  borderBottomColor: '#f0f0f0',
},
  categoriesFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 0,
    gap: 8,
    alignItems: 'center',
  },
 categoryFilterButton: {
  height: 35,                 
  paddingHorizontal: 20,
  borderRadius: 25,
  backgroundColor: '#f5f5f5',
  marginRight: 3,
  justifyContent: 'center',
  alignItems: 'center',
},

  categoryFilterButtonActive: {
    backgroundColor: '#FF6B4A',
  },
  categoryFilterText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  categoryFilterTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  menuContainer: {
    backgroundColor: 'transparent',
    paddingTop: 8,
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
    justifyContent: 'flex-start',
    paddingHorizontal: 15,
    rowGap: 15,
    columnGap: 12,
  },
  menuItemCard: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 0,
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
    searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    fontSize: 14,
  },

});

