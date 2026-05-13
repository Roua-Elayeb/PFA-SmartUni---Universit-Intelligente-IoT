import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import GradientBackground from '../../components/GradientBackground';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, shadow, fonts } from '../../theme';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // useRef évite le re-render à chaque frappe = clavier reste ouvert
  const nameRef = useRef('');
  const emailRef = useRef('');
  const passwordRef = useRef('');
  const confirmRef = useRef('');

  const handleRegister = async () => {
    const name = nameRef.current;
    const email = emailRef.current;
    const password = passwordRef.current;
    const confirm = confirmRef.current;

    if (!name.trim() || !email.trim() || !password || !confirm) {
      Alert.alert('Champs manquants', 'Veuillez remplir tous les champs.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.message || 'Inscription impossible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← Retour</Text>
            </TouchableOpacity>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>✨</Text>
            </View>
            <Text style={styles.appTitle}>Créer un compte</Text>
            <Text style={styles.appSubtitle}>Rejoignez SmartUni</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Nom complet</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Jean Dupont"
                  placeholderTextColor={colors.textMuted}
                  onChangeText={(t) => { nameRef.current = t; }}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="votre@email.com"
                  placeholderTextColor={colors.textMuted}
                  onChangeText={(t) => { emailRef.current = t; }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Mot de passe</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  onChangeText={(t) => { passwordRef.current = t; }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.inputIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔐</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  onChangeText={(t) => { confirmRef.current = t; }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerBtn, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.registerBtnText}>Créer mon compte</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLinkText}>
                Déjà un compte ? <Text style={styles.loginLinkBold}>Se connecter</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  header: { alignItems: 'center', marginBottom: 32 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 16, padding: 8 },
  backText: { color: '#E8709A', fontWeight: '600', fontSize: 15 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  logoEmoji: { fontSize: 34 },
  appTitle: { fontSize: 26, fontWeight: '800', color: '#2D2040' },
  appSubtitle: { fontSize: 13, color: '#8A7A9B', marginTop: 4 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 30, padding: 24,
  },
  inputWrapper: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#2D2040', marginBottom: 6 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F4FF', borderRadius: 16,
    paddingHorizontal: 16, borderWidth: 1.5,
    borderColor: 'rgba(232,112,154,0.15)', height: 52,
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: '#2D2040', height: '100%' },
  registerBtn: {
    backgroundColor: '#B89EE8', borderRadius: 999,
    height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 16,
  },
  registerBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  loginLink: { marginTop: 24, alignItems: 'center' },
  loginLinkText: { fontSize: 13, color: '#8A7A9B' },
  loginLinkBold: { color: '#E8709A', fontWeight: '700' },
});

export default RegisterScreen;