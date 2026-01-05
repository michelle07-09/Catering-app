import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import MenuDetailScreen from './screens/MenuDetailScreen';
import CartScreen from './screens/CartScreen';
import PaymentScreen from './screens/PaymentScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import MenuItemDetailScreen from './screens/MenuItemDetailScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';
import AboutScreen from './screens/AboutScreen';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Menu') iconName = focused ? 'restaurant' : 'restaurant-outline';
          else if (route.name === 'History') iconName = focused ? 'time' : 'time-outline';
          else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B4A',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Menu"
        component={MenuDetailScreen}
        initialParams={{ showAllCategories: true }}
      />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let mounted = true;

    const timeoutId = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 3000);

    const init = async () => {
      try {
        const skipOnce = await AsyncStorage.getItem('SKIP_AUTO_SIGNIN_ONCE');
        const { data } = await supabase.auth.getSession();

        if (!mounted) return;

        if (skipOnce === '1') {
          await AsyncStorage.removeItem('SKIP_AUTO_SIGNIN_ONCE');
          setSession(null);
        } else {
          setSession(data?.session ?? null);
        }
      } catch {
        if (mounted) setSession(null);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!mounted) return;

      const skipOnce = await AsyncStorage.getItem('SKIP_AUTO_SIGNIN_ONCE');

      
      if (skipOnce === '1' && event === 'SIGNED_IN') {
        await AsyncStorage.removeItem('SKIP_AUTO_SIGNIN_ONCE');
        setSession(null);
        return;
      }

      setSession(nextSession ?? null);
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  // ✅ render splash HARUS DI SINI (bukan di useEffect)
  if (isLoading) return <SplashScreen />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!session ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="MenuDetail" component={MenuDetailScreen} />
              <Stack.Screen name="Cart" component={CartScreen} />
              <Stack.Screen name="Payment" component={PaymentScreen} />
              <Stack.Screen name="MenuItemDetail" component={MenuItemDetailScreen} />
              <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
              <Stack.Screen name="About" component={AboutScreen} />

            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
