import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [userName, setUserName] = useState('');
  const scrollX = new Animated.Value(0);

  useEffect(() => {
    fetchUserProfile();
    fetchCategories();
    fetchMenuItems();
  }, []);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setUserName(data.full_name);
      }
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true });
    
    if (data) setCategories(data);
  };

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true)
      .limit(10);
    
    if (data) setMenuItems(data);
  };

  const renderCategoryCard = (category, index) => {
    const inputRange = [
      (index - 1) * CARD_WIDTH,
      index * CARD_WIDTH,
      (index + 1) * CARD_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        key={category.id}
        onPress={() => navigation.navigate('MenuDetail', { categoryId: category.id })}
        activeOpacity={0.9}
      >
        <Animated.View
          style={[
            styles.categoryCard,
            {
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
          <Image
            source={{ uri: category.image_url }}
            style={styles.categoryImage}
          />
          <View style={styles.categoryOverlay}>
            <Text style={styles.categoryName}>{category.name}</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Halo, {userName || 'User'}! 👋</Text>
          <Text style={styles.headerSubtitle}>Mau pesan apa hari ini?</Text>
        </View>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Ionicons name="cart" size={24} color="#FF6B4A" />
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>0</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategori Menu</Text>
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
            snapToInterval={CARD_WIDTH + 15}
            decelerationRate="fast"
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          >
            {categories.map((category, index) => renderCategoryCard(category, index))}
          </Animated.ScrollView>
        </View>

        {/* Popular Menu Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Menu Populer</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuCard}
              onPress={() => navigation.navigate('MenuDetail', { menuId: item.id })}
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
                  <TouchableOpacity style={styles.addButton}>
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
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 15,
  },
  categoryCard: {
    width: CARD_WIDTH,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 15,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  categoryName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
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
