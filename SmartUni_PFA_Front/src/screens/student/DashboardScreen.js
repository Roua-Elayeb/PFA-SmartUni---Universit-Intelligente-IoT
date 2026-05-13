// src/screens/DashboardScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  StyleSheet, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { sensorAPI, roomAPI, parkingAPI } from '../../api';
import { colors, spacing, radius, fonts } from '../../theme';

const SCHEDULE = {
  0: [],
  1: [
    { time: '08:00', end: '10:00', subject: 'Mathématiques', room: 'Salle A101', prof: 'Dr. Ben Ali', type: 'cours' },
    { time: '10:15', end: '12:00', subject: 'Algorithmique', room: 'Labo Info C301', prof: 'Dr. Mansour', type: 'tp' },
    { time: '14:00', end: '16:00', subject: 'Réseaux', room: 'Salle B201', prof: 'Dr. Chabbi', type: 'cours' },
  ],
  2: [
    { time: '09:00', end: '11:00', subject: 'Base de données', room: 'Labo Info C301', prof: 'Dr. Triki', type: 'tp' },
    { time: '13:00', end: '15:00', subject: "Systèmes d'exploitation", room: 'Salle A102', prof: 'Dr. Hamdi', type: 'cours' },
  ],
  3: [
    { time: '08:00', end: '10:00', subject: 'Génie Logiciel', room: 'Salle B202', prof: 'Dr. Slim', type: 'cours' },
    { time: '10:15', end: '12:00', subject: 'IA & ML', room: 'Salle Conf F2', prof: 'Dr. Ayed', type: 'cours' },
    { time: '14:30', end: '16:30', subject: 'Projet PFA', room: 'Salle Réunion E1', prof: 'Dr. Mansour', type: 'projet' },
  ],
  4: [
    { time: '09:00', end: '11:00', subject: 'Mathématiques', room: 'Salle A101', prof: 'Dr. Ben Ali', type: 'cours' },
    { time: '14:00', end: '16:00', subject: 'Algorithmique', room: 'Labo Info C301', prof: 'Dr. Mansour', type: 'td' },
  ],
  5: [
    { time: '08:00', end: '10:00', subject: 'Réseaux', room: 'Salle B201', prof: 'Dr. Chabbi', type: 'td' },
    { time: '10:15', end: '12:00', subject: 'Base de données', room: 'Salle A102', prof: 'Dr. Triki', type: 'cours' },
  ],
  
  6: [
    {
      time: '08:00',
      end: '10:00',
      subject: 'Nom du cours',
      room: 'Salle A101',
      prof: 'Dr. Nom',
      type: 'cours',  // cours / tp / td / projet
    },
    {
      time: '10:15',
      end: '12:00',
      subject: 'Deuxième cours',
      room: 'Labo Info C301',
      prof: 'Dr. Nom',
      type: 'tp',
    },
  ],

};

const DAYS_FR = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const TYPE_CONFIG = {
  cours:  { color: '#B89EE8', bg: '#F0E8FF', label: 'Cours' },
  tp:     { color: '#6DC9A0', bg: '#E4FFF4', label: 'TP' },
  td:     { color: '#F5C27A', bg: '#FFF8E4', label: 'TD' },
  projet: { color: '#E8709A', bg: '#FFE4EE', label: 'Projet' },
};
const SENSOR_EMOJI = {
  temperature: '🌡️', humidity: '💧', co2: '🌿',
  airQuality: '💨', pressure: '📊', noise: '🔊',
};
const STATUS_COLOR = { normal: '#6DC9A0', warning: '#F5C27A', critical: '#F07070' };

const getTimeStr = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
};

const CourseCard = ({ course, isCurrent }) => {
  const cfg = TYPE_CONFIG[course.type] || TYPE_CONFIG.cours;
  return (
    <View style={[styles.courseCard, isCurrent && styles.courseCardActive]}>
      {isCurrent && (
        <View style={styles.liveChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>EN COURS</Text>
        </View>
      )}
      <View style={styles.courseRow}>
        <View style={styles.courseTime}>
          <Text style={styles.courseTimeText}>{course.time}</Text>
          <View style={styles.courseTimeLine} />
          <Text style={styles.courseTimeText}>{course.end}</Text>
        </View>
        <View style={[styles.courseInfo, isCurrent && { borderLeftColor: cfg.color }]}>
          <View style={styles.courseTop}>
            <Text style={styles.courseSubject} numberOfLines={1}>{course.subject}</Text>
            <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.typeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
          <Text style={styles.courseRoom}>📍 {course.room}</Text>
          <Text style={styles.courseProf}>👨‍🏫 {course.prof}</Text>
        </View>
      </View>
    </View>
  );
};

const SensorCard = ({ sensor }) => (
  <View style={styles.sensorCard}>
    <View style={[styles.sensorDot, { backgroundColor: STATUS_COLOR[sensor.status] || STATUS_COLOR.normal }]} />
    <Text style={styles.sensorEmoji}>{SENSOR_EMOJI[sensor.type] || '📡'}</Text>
    <Text style={styles.sensorValue}>
      {typeof sensor.value === 'number' ? sensor.value.toFixed(1) : sensor.value}
      <Text style={styles.sensorUnit}> {sensor.unit}</Text>
    </Text>
    <Text style={styles.sensorName} numberOfLines={1}>{sensor.name}</Text>
  </View>
);

const DashboardScreen = () => {
  const { user } = useAuth();
  const [sensors, setSensors] = useState([]);
  const [myRoom, setMyRoom] = useState(null);
  const [myParking, setMyParking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const now = new Date();
  const dayIndex = now.getDay();
  const todaySchedule = SCHEDULE[dayIndex] || [];
  const timeNow = getTimeStr();
  const currentCourse = todaySchedule.find(c => c.time <= timeNow && c.end >= timeNow) || null;
  const nextCourse = todaySchedule.find(c => c.time > timeNow) || null;
  const dateStr = `${DAYS_FR[dayIndex]} ${now.getDate()} ${MONTHS_FR[now.getMonth()]}`;

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const fetchData = useCallback(async () => {
    try {
      const [s, r, p] = await Promise.allSettled([
        sensorAPI.getLatest(),
        roomAPI.getAll(),
        parkingAPI.getAll(),
      ]);
      if (s.status === 'fulfilled') setSensors(s.value.data.sensors || []);
      if (r.status === 'fulfilled') {
        const rooms = r.value.data.rooms || [];
        setMyRoom(rooms.find(rm => rm.reservations?.some(res => res.userName === user?.name)) || null);
      }
      if (p.status === 'fulfilled') {
        setMyParking((p.value.data.spots || []).find(sp => sp.reservedByName === user?.name) || null);
      }
    } catch (e) {
      console.error(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const criticalCount = sensors.filter(s => s.status === 'critical').length;
  const warningCount  = sensors.filter(s => s.status === 'warning').length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour 👋</Text>
            <Text style={styles.userName}>{user?.name || 'Étudiant'}</Text>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ── 1. Résumé Personnel ── */}
          {(myRoom || myParking) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📋 Mes réservations actives</Text>
              <View style={styles.resumeRow}>
                {myRoom && (
                  <View style={styles.resumeItem}>
                    <Text style={styles.resumeEmoji}>🚪</Text>
                    <View>
                      <Text style={styles.resumeLabel}>Salle réservée</Text>
                      <Text style={styles.resumeValue}>{myRoom.name}</Text>
                    </View>
                  </View>
                )}
                {myParking && (
                  <View style={[styles.resumeItem, myRoom && styles.resumeBorder]}>
                    <Text style={styles.resumeEmoji}>🅿️</Text>
                    <View>
                      <Text style={styles.resumeLabel}>Place parking</Text>
                      <Text style={styles.resumeValue}>{myParking.spotNumber}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ── 2. Emploi du temps ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 Emploi du temps</Text>
            <Text style={styles.sectionSub}>{dateStr}</Text>
          </View>

          <View style={styles.scheduleBox}>
            {todaySchedule.length === 0 ? (
              <View style={styles.empty}>
                <Text style={{ fontSize: 40 }}>🎉</Text>
                <Text style={styles.emptyTitle}>Pas de cours aujourd'hui !</Text>
                <Text style={styles.emptySub}>Bonne journée 😊</Text>
              </View>
            ) : (
              <>
                {currentCourse && <CourseCard course={currentCourse} isCurrent />}
                {nextCourse && !currentCourse && (
                  <>
                    <Text style={styles.subLabel}>⏭️ Prochain cours</Text>
                    <CourseCard course={nextCourse} isCurrent={false} />
                  </>
                )}
                <Text style={styles.subLabel}>Programme complet</Text>
                {todaySchedule.map((c, i) => <CourseCard key={i} course={c} isCurrent={false} />)}
              </>
            )}
          </View>

          {/* ── 3. Capteurs par salle ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🌡️ Environnement</Text>
            <Text style={styles.sectionSub}>{currentCourse ? currentCourse.room : 'Campus'}</Text>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} size="large" style={{ marginVertical: 30 }} />
          ) : sensors.length === 0 ? (
            <View style={[styles.empty, { marginHorizontal: spacing.lg }]}>
              <Text style={{ fontSize: 36 }}>📡</Text>
              <Text style={styles.emptyTitle}>Aucun capteur connecté</Text>
              <Text style={styles.emptySub}>Démarrez le backend</Text>
            </View>
          ) : (
            <View style={styles.sensorsBox}>
              {criticalCount > 0 && (
                <View style={styles.alertBanner}>
                  <Text style={styles.alertText}>🚨 {criticalCount} capteur{criticalCount > 1 ? 's' : ''} critique{criticalCount > 1 ? 's' : ''} !</Text>
                </View>
              )}
              {warningCount > 0 && criticalCount === 0 && (
                <View style={[styles.alertBanner, { backgroundColor: '#FFF8E4', borderLeftColor: '#F5C27A' }]}>
                  <Text style={[styles.alertText, { color: '#F5C27A' }]}>⚠️ {warningCount} avertissement{warningCount > 1 ? 's' : ''}</Text>
                </View>
              )}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {sensors.map(s => <SensorCard key={s._id || s.deviceId} sensor={s} />)}
              </ScrollView>
              <View style={styles.legendRow}>
                {[
                  { c: STATUS_COLOR.normal,   l: `${sensors.filter(s=>s.status==='normal').length} normaux` },
                  { c: STATUS_COLOR.warning,  l: `${warningCount} attention` },
                  { c: STATUS_COLOR.critical, l: `${criticalCount} critiques` },
                ].map(({ c, l }) => (
                  <View key={l} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: c }]} />
                    <Text style={styles.legendText}>{l}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        </Animated.View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EDE6FF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, marginBottom: spacing.md,
  },
  greeting: { fontSize: fonts.sizes.sm, color: '#8A7A9B' },
  userName: { fontSize: fonts.sizes.xxl, fontWeight: '800', color: '#2D2040' },
  dateText: { fontSize: fonts.sizes.xs, color: '#B8ACCC', marginTop: 2 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: fonts.sizes.md },
  card: {
    backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: radius.xl,
    marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.lg,
    shadowColor: '#B89EE8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 3,
  },
  cardTitle: { fontSize: fonts.sizes.sm, fontWeight: '700', color: '#2D2040', marginBottom: spacing.md },
  resumeRow: { flexDirection: 'row' },
  resumeItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  resumeBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(184,172,204,0.3)', paddingLeft: spacing.md },
  resumeEmoji: { fontSize: 28 },
  resumeLabel: { fontSize: fonts.sizes.xs, color: '#8A7A9B' },
  resumeValue: { fontSize: fonts.sizes.sm, fontWeight: '800', color: '#2D2040' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.sm,
  },
  sectionTitle: { fontSize: fonts.sizes.lg, fontWeight: '700', color: '#2D2040' },
  sectionSub: { fontSize: fonts.sizes.xs, color: '#B8ACCC' },
  scheduleBox: { paddingHorizontal: spacing.lg },
  subLabel: { fontSize: fonts.sizes.xs, fontWeight: '700', color: '#B8ACCC', marginBottom: 4, marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: radius.xl, marginBottom: spacing.md,
  },
  emptyTitle: { fontSize: fonts.sizes.lg, fontWeight: '700', color: '#2D2040', marginTop: spacing.sm },
  emptySub: { fontSize: fonts.sizes.sm, color: '#8A7A9B', marginTop: 4 },
  courseCard: {
    backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    shadowColor: '#B89EE8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  courseCardActive: { borderWidth: 1.5, borderColor: '#E8709A' },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: spacing.sm },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E8709A' },
  liveText: { fontSize: 10, fontWeight: '800', color: '#E8709A', letterSpacing: 1 },
  courseRow: { flexDirection: 'row', gap: spacing.md },
  courseTime: { alignItems: 'center', width: 40 },
  courseTimeText: { fontSize: 10, fontWeight: '700', color: '#8A7A9B' },
  courseTimeLine: { width: 1, flex: 1, backgroundColor: 'rgba(184,172,204,0.4)', marginVertical: 3 },
  courseInfo: { flex: 1, borderLeftWidth: 3, borderLeftColor: 'rgba(184,172,204,0.3)', paddingLeft: spacing.sm },
  courseTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  courseSubject: { fontSize: fonts.sizes.md, fontWeight: '700', color: '#2D2040', flex: 1 },
  typeBadge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 4 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  courseRoom: { fontSize: fonts.sizes.xs, color: '#8A7A9B', marginBottom: 2 },
  courseProf: { fontSize: fonts.sizes.xs, color: '#B8ACCC' },
  sensorsBox: { paddingHorizontal: spacing.lg },
  alertBanner: {
    backgroundColor: '#FFE8E8', borderRadius: radius.md,
    marginBottom: spacing.sm, padding: spacing.md,
    borderLeftWidth: 4, borderLeftColor: '#F07070',
  },
  alertText: { fontSize: fonts.sizes.sm, fontWeight: '700', color: '#F07070' },
  sensorCard: {
    backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: radius.lg,
    padding: spacing.md, marginRight: spacing.sm, minWidth: 100,
    alignItems: 'center', marginBottom: spacing.sm, position: 'relative',
    shadowColor: '#B89EE8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
  },
  sensorDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4 },
  sensorEmoji: { fontSize: 26, marginBottom: 4 },
  sensorValue: { fontSize: fonts.sizes.lg, fontWeight: '800', color: '#2D2040' },
  sensorUnit: { fontSize: fonts.sizes.xs, color: '#8A7A9B', fontWeight: '400' },
  sensorName: { fontSize: 10, color: '#8A7A9B', marginTop: 2, textAlign: 'center' },
  legendRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: fonts.sizes.xs, color: '#8A7A9B' },
});

export default DashboardScreen;