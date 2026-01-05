import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>

        <Text style={styles.title}>Tentang Aplikasi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.appName}>FoodExpress</Text>
        <Text style={styles.version}>Versi 1.0.0</Text>

        <Text style={styles.sectionTitle}>Deskripsi</Text>
        <Text style={styles.text}>
          FoodExpress adalah aplikasi pemesanan catering online yang memudahkan
          pengguna memilih menu, menentukan tanggal pemesanan, serta memantau status
          pesanan secara real-time.
        </Text>

        <Text style={styles.sectionTitle}>Fitur</Text>
        <Text style={styles.text}>• Pemesanan menu catering</Text>
        <Text style={styles.text}>• Pilih tanggal acara</Text>
        <Text style={styles.text}>• Keranjang & pembayaran</Text>
        <Text style={styles.text}>• Riwayat & detail pesanan</Text>
        <Text style={styles.text}>• Hubungi catering via WhatsApp/Telepon</Text>

        <Text style={styles.sectionTitle}>Teknologi</Text>
        <Text style={styles.text}>• React Native (Expo)</Text> 
        <Text style={styles.text}>• Supabase (Auth & Database)</Text> 
        <Text style={styles.sectionTitle}>Pengembang</Text> 
        <Text style={styles.text}>• A. Nurul Aqeela Amin (18223019)</Text> 
        <Text style={styles.text}>• Michelle Hamdani (18223037)</Text>

        <Text style={styles.footer}>© 2026 FoodExpress</Text>
      </ScrollView>
    </View>
  );
}

/* ⬇️⬇️⬇️ INI YANG KAMU LUPA */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    padding: 20,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FF6B4A',
    textAlign: 'center',
    marginTop: 20,
  },
  version: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    color: '#333',
  },
  text: {
    fontSize: 14,
    color: '#555',
    marginTop: 6,
    lineHeight: 20,
  },
  footer: {
    marginTop: 40,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
