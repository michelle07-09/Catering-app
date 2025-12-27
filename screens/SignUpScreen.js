import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabaseClient';

export default function SignUpScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSignUp = async () => {
    // Validation
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Mohon isi semua field');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Password dan konfirmasi password tidak sama');
      return;
    }

    setLoading(true);

    // Sign up user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      Alert.alert('Pendaftaran Gagal', error.message);
      return;
    }

    // Create profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            full_name: fullName,
            phone: phone,
          },
        ]);

      setLoading(false);

      if (profileError) {
        Alert.alert('Error', 'Gagal membuat profile: ' + profileError.message);
      } else {
        Alert.alert(
          'Berhasil!',
          'Akun berhasil dibuat. Silakan login.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      }
    }
  };

  return (
    <LinearGradient colors={['#FF6B4A', '#FF8C6B']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <Text style={styles.logo}>🍽️</Text>
            <Text style={styles.title}>FoodExpress</Text>
            <Text style={styles.subtitle}>Catering Online Terpercaya</Text>
          </Animated.View>

          <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={styles.inactiveTab}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.inactiveTabText}>Login</Text>
              </TouchableOpacity>
              <View style={styles.activeTab}>
                <Text style={styles.activeTabText}>Sign Up</Text>
              </View>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="contoh@email.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>No. HP</Text>
              <TextInput
                style={styles.input}
                placeholder="081234567890"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Minimal 6 karakter"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <Text style={styles.label}>Konfirmasi Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Ulangi password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
                onPress={handleSignUp}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.signUpButtonText}>
                  {loading ? 'Loading...' : 'Daftar Sekarang'}
                </Text>
              </TouchableOpacity>

              <View style={styles.loginPrompt}>
                <Text style={styles.loginText}>Sudah punya akun? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  logo: {
    fontSize: 50,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activeTab: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: '#FF6B4A',
  },
  inactiveTab: {
    flex: 1,
    paddingVertical: 12,
  },
  activeTabText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B4A',
  },
  inactiveTabText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
  },
  form: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    marginTop: 5,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  signUpButton: {
    backgroundColor: '#FF6B4A',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#FF6B4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#FF6B4A',
    fontSize: 14,
    fontWeight: '600',
  },
});
