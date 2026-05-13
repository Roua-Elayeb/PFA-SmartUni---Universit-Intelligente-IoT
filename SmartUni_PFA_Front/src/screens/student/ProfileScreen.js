// src/screens/ProfileScreen.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Switch, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, shadow, fonts } from '../../theme';

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

const Row = ({ emoji, label, value, onPress, isLast, rightComponent }) => (
  <TouchableOpacity
    style={[styles.row, isLast && styles.rowLast]}
    onPress={onPress}
    disabled={!onPress && !rightComponent}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <Text style={styles.rowEmoji}>{emoji}</Text>
    <Text style={styles.rowLabel}>{label}</Text>
    <View style={styles.rowRight}>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {rightComponent}
      {onPress && <Text style={styles.rowChevron}>›</Text>}
    </View>
  </TouchableOpacity>
);

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Étudiant'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>🎓 Étudiant</Text>
          </View>
        </View>

        {/* Informations */}
        <Section title="Informations">
          <Row emoji="👤" label="Nom" value={user?.name} isLast={false} />
          <Row emoji="✉️" label="Email" value={user?.email} isLast />
        </Section>

        {/* Préférences */}
        <Section title="Préférences">
          <Row
            emoji="🔔"
            label="Notifications"
            isLast={false}
            rightComponent={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.border, true: colors.primary + '88' }}
                thumbColor={notifications ? colors.primary : colors.textMuted}
              />
            }
          />
          <Row
            emoji="🌙"
            label="Mode sombre"
            isLast
            rightComponent={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: colors.border, true: colors.secondary + '88' }}
                thumbColor={darkMode ? colors.secondary : colors.textMuted}
              />
            }
          />
        </Section>

        {/* Support */}
        <Section title="Support">
          <Row
            emoji="❓" label="Aide & FAQ" isLast={false}
            onPress={() => Alert.alert('Aide', 'Documentation SmartUni v1.0')}
          />
          <Row
            emoji="🔐" label="Politique de confidentialité" isLast={false}
            onPress={() => Alert.alert('Confidentialité', 'Vos données sont sécurisées.')}
          />
          <Row emoji="ℹ️" label="Version" value="1.0.0" isLast />
        </Section>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>🚪  Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EDE6FF' },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md, ...shadow.medium,
  },
  avatarText: { color: colors.white, fontSize: fonts.sizes.xxxl, fontWeight: '800' },
  userName: { fontSize: fonts.sizes.xxl, fontWeight: '800', color: colors.textPrimary },
  userEmail: { fontSize: fonts.sizes.sm, color: colors.textSecondary, marginTop: 4 },
  roleBadge: {
    backgroundColor: colors.secondary + '22', borderRadius: radius.full,
    paddingHorizontal: 14, paddingVertical: 6, marginTop: spacing.sm,
  },
  roleText: { color: colors.secondary, fontSize: fonts.sizes.sm, fontWeight: '700' },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fonts.sizes.sm, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: spacing.sm, marginLeft: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.cardBg, borderRadius: radius.xl,
    ...shadow.soft, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowEmoji: { fontSize: 20, marginRight: spacing.md, width: 28 },
  rowLabel: { flex: 1, fontSize: fonts.sizes.md, color: colors.textPrimary, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontSize: fonts.sizes.sm, color: colors.textSecondary },
  rowChevron: { fontSize: 22, color: colors.textMuted, marginLeft: 2 },
  logoutBtn: {
    backgroundColor: colors.danger, borderRadius: radius.full,
    height: 54, justifyContent: 'center', alignItems: 'center',
    marginHorizontal: spacing.lg,
    shadowColor: colors.danger, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  logoutText: { color: colors.white, fontWeight: '800', fontSize: fonts.sizes.md },
});

export default ProfileScreen;