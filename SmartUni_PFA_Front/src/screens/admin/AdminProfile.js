// src/screens/admin/AdminProfile.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Switch, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

const ACCENT = '#7C5CBF';
const BG = '#1A1A2E';
const CARD = '#16213E';

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

const Row = ({ emoji, label, value, onPress, isLast, rightComponent, danger }) => (
  <TouchableOpacity
    style={[styles.row, isLast && styles.rowLast]}
    onPress={onPress}
    disabled={!onPress && !rightComponent}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <Text style={styles.rowEmoji}>{emoji}</Text>
    <Text style={[styles.rowLabel, danger && { color: '#F07070' }]}>{label}</Text>
    <View style={styles.rowRight}>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {rightComponent}
      {onPress && <Text style={styles.rowChevron}>›</Text>}
    </View>
  </TouchableOpacity>
);

const AdminProfile = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Quitter le panneau admin ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSystemAction = (action) => {
    Alert.alert(
      `⚠️ ${action}`,
      'Cette action est irréversible. Confirmer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer', style: 'destructive',
          onPress: () => Alert.alert('✅ Action effectuée', `${action} terminé.`),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>👑 ADMIN</Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || 'Administrateur'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleCard}>
            <Text style={styles.roleCardText}>🏛️ Administrateur Système — SmartUni</Text>
          </View>
        </View>

        {/* Informations */}
        <Section title="COMPTE">
          <Row emoji="👤" label="Nom" value={user?.name} isLast={false} />
          <Row emoji="✉️" label="Email" value={user?.email} isLast={false} />
          <Row emoji="🎭" label="Rôle" value="Administrateur" isLast={false} />
          <Row emoji="🔑" label="Changer le mot de passe" isLast onPress={() => Alert.alert('Info', 'Fonctionnalité disponible prochainement.')} />
        </Section>

        {/* Préférences système */}
        <Section title="SYSTÈME">
          <Row emoji="🔔" label="Notifications push" isLast={false}
            rightComponent={<Switch value={notifications} onValueChange={setNotifications}
              trackColor={{ false: '#333355', true: ACCENT + '88' }} thumbColor={notifications ? ACCENT : '#555577'} />}
          />
          <Row emoji="🚨" label="Alertes critiques" isLast={false}
            rightComponent={<Switch value={criticalAlerts} onValueChange={setCriticalAlerts}
              trackColor={{ false: '#333355', true: '#F0707088' }} thumbColor={criticalAlerts ? '#F07070' : '#555577'} />}
          />
          <Row emoji="🔄" label="Actualisation auto" isLast
            rightComponent={<Switch value={autoRefresh} onValueChange={setAutoRefresh}
              trackColor={{ false: '#333355', true: ACCENT + '88' }} thumbColor={autoRefresh ? ACCENT : '#555577'} />}
          />
        </Section>

        {/* Actions système */}
        <Section title="ACTIONS SYSTÈME">
          <Row emoji="🗄️" label="Exporter les données" isLast={false}
            onPress={() => Alert.alert('Export', 'Export CSV disponible prochainement.')} />
          <Row emoji="🔃" label="Réinitialiser les capteurs" isLast={false}
            onPress={() => handleSystemAction('Réinitialisation capteurs')} />
          <Row emoji="🗑️" label="Vider le cache alertes" isLast={false}
            onPress={() => handleSystemAction('Vidage cache')} />
          <Row emoji="📊" label="Rapport système" isLast
            onPress={() => Alert.alert('Rapport', 'Génération du rapport en cours...')} />
        </Section>

        {/* Stats système */}
        <Section title="STATISTIQUES">
          <Row emoji="📱" label="Version app" value="1.0.0" isLast={false} />
          <Row emoji="🌐" label="Serveur" value="localhost:5000" isLast={false} />
          <Row emoji="🕐" label="Session" value={new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} isLast />
        </Section>

        {/* Support */}
        <Section title="SUPPORT">
          <Row emoji="📖" label="Documentation API" isLast={false}
            onPress={() => Alert.alert('API', 'http://localhost:5000/api')} />
          <Row emoji="🐛" label="Signaler un bug" isLast={false}
            onPress={() => Alert.alert('Bug', 'Envoyez un email à support@smartuni.tn')} />
          <Row emoji="ℹ️" label="À propos" isLast
            onPress={() => Alert.alert('SmartUni Admin', 'Version 1.0.0\nSystème de supervision IoT\n© 2024 SmartUni')} />
        </Section>

        {/* Déconnexion */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>🚪  Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  profileHeader: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: ACCENT, justifyContent: 'center', alignItems: 'center',
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  adminBadge: {
    position: 'absolute', bottom: -4, right: -8,
    backgroundColor: '#F5C27A', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  adminBadgeText: { fontSize: 10, fontWeight: '800', color: '#1A1A2E' },
  userName: { fontSize: 26, fontWeight: '800', color: '#fff' },
  userEmail: { fontSize: 13, color: '#555577', marginTop: 4 },
  roleCard: {
    backgroundColor: ACCENT + '22', borderRadius: 999,
    paddingHorizontal: 16, paddingVertical: 8, marginTop: 12,
    borderWidth: 1, borderColor: ACCENT + '44',
  },
  roleCardText: { color: ACCENT, fontSize: 12, fontWeight: '700' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: '#444466',
    letterSpacing: 1.5, marginBottom: 8, marginLeft: 4,
  },
  sectionCard: { backgroundColor: CARD, borderRadius: 16, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#ffffff08',
  },
  rowLast: { borderBottomWidth: 0 },
  rowEmoji: { fontSize: 18, marginRight: 12, width: 24 },
  rowLabel: { flex: 1, fontSize: 14, color: '#fff', fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontSize: 13, color: '#555577' },
  rowChevron: { fontSize: 20, color: '#444466' },
  logoutBtn: {
    backgroundColor: '#F0707022', borderRadius: 999, height: 54,
    justifyContent: 'center', alignItems: 'center',
    marginHorizontal: 20, borderWidth: 1, borderColor: '#F07070',
  },
  logoutText: { color: '#F07070', fontWeight: '800', fontSize: 15 },
});

export default AdminProfile;