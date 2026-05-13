// src/screens/LoginScreen.js
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import GradientBackground from '../../components/GradientBackground';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, shadow, fonts } from '../../theme';

const LoginScreen = () => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const cinRef = useRef('');
  const passwordRef = useRef('');

  const handleLogin = async () => {
    const cin = cinRef.current.trim();
    const password = passwordRef.current;

    if (!cin || !password) {
      Alert.alert('Champs manquants', 'Veuillez entrer votre CIN et mot de passe.');
      return;
    }
    if (cin.length < 8) {
      Alert.alert('CIN invalide', 'Le numéro CIN doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);
    try {
      await login(cin, password);
    } catch (err) {
      Alert.alert(
        'Connexion échouée',
        err.response?.data?.message || 'CIN ou mot de passe incorrect.'
      );
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
          {/* Logo */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🎓</Text>
            </View>
            <Text style={styles.appTitle}>SmartUni</Text>
            <Text style={styles.appSubtitle}>Espace Étudiant</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Connexion</Text>
            <Text style={styles.cardSubtitle}>
              Utilisez votre numéro CIN et mot de passe fournis par l'administration
            </Text>

            {/* CIN */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Numéro CIN</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🪪</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 12345678"
                  placeholderTextColor={colors.textMuted}
                  onChangeText={(t) => { cinRef.current = t; }}
                  keyboardType="default"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                />
              </View>
            </View>

            {/* Mot de passe */}
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

            {/* Info box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ℹ️ Vos identifiants ont été fournis par l'administration de la faculté. Contactez-la en cas de problème.
              </Text>
            </View>

            {/* Bouton connexion */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.loginBtnText}>Se connecter</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            Problème de connexion ? Contactez l'administration
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md, ...shadow.soft,
  },
  logoEmoji: { fontSize: 44 },
  appTitle: { fontSize: fonts.sizes.xxxl, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  appSubtitle: { fontSize: fonts.sizes.sm, color: colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: colors.cardBg, borderRadius: radius.xl,
    padding: spacing.xl, ...shadow.medium,
  },
  cardTitle: { fontSize: fonts.sizes.xxl, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  cardSubtitle: { fontSize: fonts.sizes.sm, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 20 },
  inputWrapper: { marginBottom: spacing.md },
  inputLabel: { fontSize: fonts.sizes.sm, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F4FF', borderRadius: radius.md,
    paddingHorizontal: spacing.md, borderWidth: 1.5,
    borderColor: colors.border, height: 52,
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, fontSize: fonts.sizes.md, color: colors.textPrimary, height: '100%' },
  infoBox: {
    backgroundColor: colors.secondary + '18', borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md,
    borderLeftWidth: 3, borderLeftColor: colors.secondary,
  },
  infoText: { fontSize: fonts.sizes.xs, color: colors.textSecondary, lineHeight: 18 },
  loginBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    height: 54, justifyContent: 'center', alignItems: 'center',
    marginTop: spacing.sm, ...shadow.medium,
  },
  loginBtnText: { color: colors.white, fontSize: fonts.sizes.md, fontWeight: '700', letterSpacing: 0.3 },
  footer: {
    textAlign: 'center', fontSize: fonts.sizes.xs,
    color: colors.textMuted, marginTop: spacing.lg,
  },
});

export default LoginScreen;