// src/screens/teacher/TeacherProfile.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Switch, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

const BG = '#0F2027';
const CARD = '#1A3040';
const ACCENT = '#2196F3';

const Row = ({ emoji, label, value, onPress, isLast, rightComponent, danger }) => (
  <TouchableOpacity
    style={[styles.row, isLast && styles.rowLast]}
    onPress={onPress}
    disabled={!onPress && !rightComponent}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <Text style={styles.rowEmoji}>{emoji}</Text>
    <Text style={[styles.rowLabel, danger && { color: '#F44336' }]}>{label}</Text>
    <View style={styles.rowRight}>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {rightComponent}
      {onPress && <Text style={styles.rowChevron}>›</Text>}
    </View>
  </TouchableOpacity>
);

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

const TeacherProfile = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [sensorAlerts, setSensorAlerts] = useState(true);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'EN';

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Quitter l\'espace enseignant ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header profil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.teacherBadge}>
              <Text style={styles.teacherBadgeText}>👨‍🏫 ENSEIGNANT</Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || 'Enseignant'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleCard}>
            <Text style={styles.roleCardText}>🏛️ Corps enseignant — SmartUni</Text>
          </View>
        </View>

        {/* Mes cours */}
        <View style={styles.coursesCard}>
          <Text style={styles.coursesTitle}>📚 Mes matières</Text>
          <View style={styles.coursesTags}>
            {['Algorithmique', 'Structures de données', 'Base de données', 'Génie Logiciel', 'IA & ML', 'Projet PFA'].map(m => (
              <View key={m} style={styles.courseTag}>
                <Text style={styles.courseTagText}>{m}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Informations */}
        <Section title="COMPTE">
          <Row emoji="👤" label="Nom" value={user?.name} isLast={false} />
          <Row emoji="✉️" label="Email" value={user?.email} isLast={false} />
          <Row emoji="🎭" label="Rôle" value="Enseignant" isLast={false} />
          <Row emoji="🔑" label="Changer le mot de passe" isLast
            onPress={() => Alert.alert('Info', 'Contactez l\'administration.')} />
        </Section>

        {/* Préférences */}
        <Section title="PRÉFÉRENCES">
          <Row emoji="🔔" label="Notifications push" isLast={false}
            rightComponent={
              <Switch value={notifications} onValueChange={setNotifications}
                trackColor={{ false: '#1A3040', true: ACCENT + '88' }}
                thumbColor={notifications ? ACCENT : '#445566'} />
            }
          />
          <Row emoji="🌡️" label="Alertes capteurs" isLast
            rightComponent={
              <Switch value={sensorAlerts} onValueChange={setSensorAlerts}
                trackColor={{ false: '#1A3040', true: '#FF980088' }}
                thumbColor={sensorAlerts ? '#FF9800' : '#445566'} />
            }
          />
        </Section>

        {/* Planning */}
        <Section title="PLANNING">
          <Row emoji="📅" label="Mes cours cette semaine" value="8 cours" isLast={false} />
          <Row emoji="⏰" label="Heures hebdomadaires" value="16h" isLast={false} />
          <Row emoji="👥" label="Groupes encadrés" value="6 groupes" isLast />
        </Section>

        {/* Support */}
        <Section title="SUPPORT">
          <Row emoji="📖" label="Documentation" isLast={false}
            onPress={() => Alert.alert('Doc', 'SmartUni v1.0')} />
          <Row emoji="🐛" label="Signaler un problème" isLast={false}
            onPress={() => Alert.alert('Support', 'support@smartuni.tn')} />
          <Row emoji="ℹ️" label="Version" value="1.0.0" isLast />
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
  profileHeader: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  avatarContainer: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: ACCENT, justifyContent: 'center', alignItems: 'center',
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  teacherBadge: { position: 'absolute', bottom: -4, right: -12, backgroundColor: '#4CAF50', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  teacherBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 24, fontWeight: '800', color: '#fff' },
  userEmail: { fontSize: 13, color: '#445566', marginTop: 4 },
  roleCard: { backgroundColor: ACCENT + '22', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, marginTop: 10, borderWidth: 1, borderColor: ACCENT + '44' },
  roleCardText: { color: ACCENT, fontSize: 12, fontWeight: '700' },
  coursesCard: { backgroundColor: CARD, borderRadius: 16, marginHorizontal: 20, marginBottom: 20, padding: 16 },
  coursesTitle: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 10 },
  coursesTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  courseTag: { backgroundColor: ACCENT + '22', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: ACCENT + '44' },
  courseTagText: { color: ACCENT, fontSize: 11, fontWeight: '600' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#445566', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 },
  sectionCard: { backgroundColor: CARD, borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#ffffff08' },
  rowLast: { borderBottomWidth: 0 },
  rowEmoji: { fontSize: 18, marginRight: 12, width: 24 },
  rowLabel: { flex: 1, fontSize: 14, color: '#fff', fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontSize: 13, color: '#445566' },
  rowChevron: { fontSize: 20, color: '#445566' },
  logoutBtn: { backgroundColor: '#F4433622', borderRadius: 999, height: 52, justifyContent: 'center', alignItems: 'center', marginHorizontal: 20, borderWidth: 1, borderColor: '#F44336' },
  logoutText: { color: '#F44336', fontWeight: '800', fontSize: 14 },
});

export default TeacherProfile;