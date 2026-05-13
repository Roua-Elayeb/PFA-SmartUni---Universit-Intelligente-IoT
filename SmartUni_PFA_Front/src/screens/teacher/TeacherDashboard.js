// src/screens/teacher/TeacherDashboard.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, RefreshControl, StyleSheet,
  ActivityIndicator, Animated, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { sensorAPI, roomAPI, alertAPI } from '../../api';

const BG = '#0F2027';
const CARD = '#1A3040';
const CARD2 = '#0D2535';
const ACCENT = '#2196F3';

const DAYS_FR = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

const SCHEDULE = {
  0: [],
  1: [
    { time: '08:00', end: '10:00', subject: 'Algorithmique', room: 'Labo Info C301', group: 'Prépa 2 — GL', type: 'cours' },
    { time: '10:15', end: '12:00', subject: 'Structures de données', room: 'Salle A101', group: 'Prépa 3 — IoT', type: 'td' },
    { time: '14:00', end: '16:00', subject: 'Projet PFA', room: 'Salle Réunion E1', group: 'Prépa 5 — AI', type: 'projet' },
  ],
  2: [
    { time: '09:00', end: '11:00', subject: 'Base de données', room: 'Labo Info C301', group: 'Licence 2', type: 'tp' },
    { time: '13:00', end: '15:00', subject: 'Algorithmique', room: 'Salle B201', group: 'Prépa 1', type: 'cours' },
  ],
  3: [
    { time: '08:00', end: '10:00', subject: 'Génie Logiciel', room: 'Salle B202', group: 'Prépa 4 — GL', type: 'cours' },
    { time: '14:30', end: '16:30', subject: 'IA & ML', room: 'Salle Conf F2', group: 'Prépa 5 — AI', type: 'td' },
  ],
  4: [
    { time: '09:00', end: '11:00', subject: 'Structures de données', room: 'Salle A101', group: 'Licence 3', type: 'cours' },
    { time: '14:00', end: '16:00', subject: 'Base de données', room: 'Labo Info C301', group: 'Prépa 2', type: 'tp' },
  ],
  5: [
    { time: '08:00', end: '10:00', subject: 'Algorithmique', room: 'Salle A102', group: 'Prépa 1', type: 'cours' },
  ],
  6: [],
};

const TYPE_CONFIG = {
  cours:  { color: '#2196F3', bg: '#2196F322', label: 'Cours' },
  tp:     { color: '#4CAF50', bg: '#4CAF5022', label: 'TP' },
  td:     { color: '#FF9800', bg: '#FF980022', label: 'TD' },
  projet: { color: '#E91E63', bg: '#E91E6322', label: 'Projet' },
};

const STATUS_COLOR = { normal: '#4CAF50', warning: '#FF9800', critical: '#F44336' };

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [sensors, setSensors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const now = new Date();
  const dayIndex = now.getDay();
  const todaySchedule = SCHEDULE[dayIndex] || [];
  const timeNow = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const currentCourse = todaySchedule.find(c => c.time <= timeNow && c.end >= timeNow);
  const nextCourse = todaySchedule.find(c => c.time > timeNow);
  const dateStr = `${DAYS_FR[dayIndex]} ${now.getDate()} ${MONTHS_FR[now.getMonth()]}`;

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'EN';

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [s, r, a] = await Promise.allSettled([
        sensorAPI.getLatest(),
        roomAPI.getAll(),
        alertAPI.getAll(),
      ]);
      if (s.status === 'fulfilled') setSensors(s.value.data.sensors || []);
      if (r.status === 'fulfilled') setRooms(r.value.data.rooms || []);
      if (a.status === 'fulfilled') setAlerts(a.value.data.alerts || []);
    } catch (e) {
      console.error(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentRoomSensors = currentCourse
    ? sensors.filter(s => s.name?.toLowerCase().includes(
        currentCourse.room.split(' ')[1]?.toLowerCase() || ''
      ))
    : sensors.slice(0, 3);

  const unreadAlerts = alerts.filter(a => !a.isRead).length;
  const criticalSensors = sensors.filter(s => s.status === 'critical').length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={ACCENT} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Espace enseignant</Text>
            <Text style={styles.headerTitle}>Bonjour, {user?.name?.split(' ')[0] || 'Enseignant'}</Text>
            <Text style={styles.headerDate}>{dateStr}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        {/* Alertes critiques */}
        {criticalSensors > 0 && (
          <View style={styles.criticalBanner}>
            <Text style={styles.criticalText}>⚠️ {criticalSensors} capteur(s) critique(s) dans vos salles</Text>
          </View>
        )}

        {/* Cours en cours */}
        {currentCourse ? (
          <View style={styles.currentCard}>
            <View style={styles.currentCardTop}>
              <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
              <Text style={styles.liveText}>EN COURS</Text>
            </View>
            <Text style={styles.currentSubject}>{currentCourse.subject}</Text>
            <View style={styles.currentMeta}>
              <Text style={styles.currentMetaText}>📍 {currentCourse.room}</Text>
              <Text style={styles.currentMetaText}>👥 {currentCourse.group}</Text>
              <Text style={styles.currentMetaText}>⏰ jusqu'à {currentCourse.end}</Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: TYPE_CONFIG[currentCourse.type]?.bg }]}>
              <Text style={[styles.typeBadgeText, { color: TYPE_CONFIG[currentCourse.type]?.color }]}>
                {TYPE_CONFIG[currentCourse.type]?.label}
              </Text>
            </View>
          </View>
        ) : nextCourse ? (
          <View style={[styles.currentCard, { borderColor: TYPE_CONFIG[nextCourse.type]?.color + '44' }]}>
            <Text style={styles.nextLabel}>⏭️ Prochain cours</Text>
            <Text style={styles.currentSubject}>{nextCourse.subject}</Text>
            <View style={styles.currentMeta}>
              <Text style={styles.currentMetaText}>📍 {nextCourse.room}</Text>
              <Text style={styles.currentMetaText}>⏰ {nextCourse.time} — {nextCourse.end}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.currentCard, { alignItems: 'center' }]}>
            <Text style={{ fontSize: 32 }}>🎉</Text>
            <Text style={styles.noCoursText}>Pas de cours aujourd'hui</Text>
          </View>
        )}

        {/* Stats rapides */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: '#2196F344' }]}>
            <Text style={styles.statEmoji}>📅</Text>
            <Text style={[styles.statValue, { color: ACCENT }]}>{todaySchedule.length}</Text>
            <Text style={styles.statLabel}>Cours aujourd'hui</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#4CAF5044' }]}>
            <Text style={styles.statEmoji}>🚪</Text>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              {rooms.filter(r => r.available).length}
            </Text>
            <Text style={styles.statLabel}>Salles libres</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#FF980044' }]}>
            <Text style={styles.statEmoji}>🔔</Text>
            <Text style={[styles.statValue, { color: '#FF9800' }]}>{unreadAlerts}</Text>
            <Text style={styles.statLabel}>Alertes</Text>
          </View>
        </View>

        {/* Capteurs salle actuelle */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🌡️ Environnement</Text>
          <Text style={styles.sectionSub}>{currentCourse ? currentCourse.room : 'Campus'}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={ACCENT} size="large" style={{ marginVertical: 20 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sensorsScroll}>
            {(currentRoomSensors.length > 0 ? currentRoomSensors : sensors).map(s => (
              <View key={s._id || s.deviceId} style={styles.sensorCard}>
                <View style={[styles.sensorDot, { backgroundColor: STATUS_COLOR[s.status] || '#4CAF50' }]} />
                <Text style={styles.sensorEmoji}>
                  {{ temperature:'🌡️', humidity:'💧', co2:'🌿', airQuality:'💨', pressure:'📊', noise:'🔊' }[s.type] || '📡'}
                </Text>
                <Text style={styles.sensorValue}>
                  {typeof s.value === 'number' ? s.value.toFixed(1) : s.value}
                </Text>
                <Text style={styles.sensorUnit}>{s.unit}</Text>
                <Text style={styles.sensorName} numberOfLines={1}>{s.name}</Text>
              </View>
            ))}
            {sensors.length === 0 && (
              <Text style={{ color: '#445566', padding: 20 }}>Aucun capteur connecté</Text>
            )}
          </ScrollView>
        )}

        {/* Alertes récentes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔔 Alertes récentes</Text>
        </View>
        <View style={styles.card}>
          {alerts.slice(0, 3).map((alert, i) => (
            <View key={alert._id}>
              <View style={styles.alertRow}>
                <Text style={{ fontSize: 18 }}>
                  {alert.type === 'urgence' ? '🔥' : alert.type === 'sécurité' ? '🛡️' : '⚙️'}
                </Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.alertMsg} numberOfLines={1}>{alert.message}</Text>
                  <Text style={styles.alertTime}>
                    {new Date(alert.createdAt).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </Text>
                </View>
                {!alert.isRead && <View style={styles.unreadDot} />}
              </View>
              {i < 2 && <View style={styles.divider} />}
            </View>
          ))}
          {alerts.length === 0 && (
            <Text style={{ color: '#445566', padding: 14, textAlign: 'center' }}>Aucune alerte</Text>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 20, marginBottom: 16 },
  headerSub: { fontSize: 12, color: ACCENT, fontWeight: '600', marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerDate: { fontSize: 12, color: '#445566', marginTop: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: ACCENT, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  criticalBanner: { backgroundColor: '#F4433622', borderRadius: 12, marginHorizontal: 20, marginBottom: 12, padding: 12, borderLeftWidth: 4, borderLeftColor: '#F44336' },
  criticalText: { color: '#F44336', fontWeight: '700', fontSize: 13 },
  currentCard: { backgroundColor: CARD, borderRadius: 16, marginHorizontal: 20, marginBottom: 16, padding: 16, borderWidth: 1, borderColor: ACCENT + '44' },
  currentCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  liveText: { fontSize: 11, fontWeight: '800', color: '#4CAF50', letterSpacing: 1 },
  nextLabel: { fontSize: 11, color: ACCENT, fontWeight: '700', marginBottom: 6 },
  currentSubject: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 10 },
  currentMeta: { gap: 4, marginBottom: 10 },
  currentMetaText: { fontSize: 12, color: '#8899AA' },
  typeBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  noCoursText: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 8 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: CARD, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1 },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#445566', marginTop: 2, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  sectionSub: { fontSize: 11, color: '#445566' },
  sensorsScroll: { paddingHorizontal: 20, marginBottom: 16 },
  sensorCard: { backgroundColor: CARD, borderRadius: 14, padding: 14, marginRight: 10, minWidth: 100, alignItems: 'center', position: 'relative' },
  sensorDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4 },
  sensorEmoji: { fontSize: 24, marginBottom: 4 },
  sensorValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  sensorUnit: { fontSize: 11, color: '#445566' },
  sensorName: { fontSize: 10, color: '#8899AA', marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: CARD, borderRadius: 16, marginHorizontal: 20, marginBottom: 16 },
  alertRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  alertMsg: { fontSize: 13, fontWeight: '600', color: '#fff' },
  alertTime: { fontSize: 11, color: '#445566', marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT },
  divider: { height: 1, backgroundColor: '#ffffff08', marginHorizontal: 14 },
});

export default TeacherDashboard;