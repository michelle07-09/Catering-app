import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = 'cart_v1';

export async function getCart() {
  const raw = await AsyncStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function setCart(cart) {
  await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export async function addToCart(item) {
  const cart = await getCart();
  const existing = cart.find((c) => c.id === item.id);

  let next;
  if (existing) {
    next = cart.map((c) =>
      c.id === item.id
        ? { ...c, quantity: (c.quantity || 1) + 1 }
        : c
    );
  } else {
    next = [...cart, { ...item, quantity: 1 }];
  }

  await setCart(next);
  return next;
}

export async function clearCart() {
  await AsyncStorage.removeItem(CART_KEY);
}
