// ============================================================
//  SmartUni — AdminDashboard.js (version MQTT temps réel)
//  Remplace src/screens/admin/AdminDashboard.js
//  Ajoute : mise à jour en temps réel via Socket.IO/MQTT
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity,
  StyleSheet, ActivityIndicator, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { sensorAPI, roomAPI, parkingAPI, alertAPI } from '../../api';
import { useMQTT } from '../../hooks/useMQTT';  // ← NOUVEAU

const ACCENT = '#7C5CBF';
const BG     = '#1A1A2E';
const CARD   = '#16213E';

const STATUS_COLOR  = { normal: '#6DC9A0', warning: '#F5C27A', critical: '#F07070' };
const SENSOR_EMOJI  = { temperature: '🌡️', humidity: '💧', co2: '🌿', airQuality: '💨', pressure: '📊', noise: '🔊' };

// ── Composants ──────────────────────────────────────────────────────────────

const StatCard = ({ emoji, value, label, color, sub }) => (
  <View style={[styles.statCard, { borderTopColor: color }]}>
    <Text style={styles.statEmoji}>{emoji}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {sub && <Text style={styles.statSub}>{sub}</Text>}
  </View>
);

const SensorRow = ({ sensor }) => (
  <View style={styles.sensorRow}>
    <Text style={styles.sensorEmoji}>{SENSOR_EMOJI[sensor.type] || '📡'}</Text>
    <View style={styles.sensorInfo}>
      <Text style={styles.sensorName}>{sensor.name}</Text>
      <Text style={styles.sensorDevice}>{sensor.deviceId}</Text>
    </View>
    <View style={styles.sensorRight}>
      <Text style={styles.sensorValue}>
        {typeof sensor.value === 'number' ? sensor.value.toFixed(1) : sensor.value} {sensor.unit}
      </Text>
      <View style={[styles.sensorStatus, { backgroundColor: STATUS_COLOR[sensor.status] + '33' }]}>
        <View style={[styles.sensorDot, { backgroundColor: STATUS_COLOR[sensor.status] }]} />
        <Text style={[styles.sensorStatusText, { color: STATUS_COLOR[sensor.status] }]}>{sensor.status}</Text>
      </View>
    </View>
  </View>
);

// ── Écran principal ──────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const { user } = useAuth();
  const [rooms,    setRooms]    = useState([]);
  const [parking,  setParking]  = useState([]);
  const [alerts,   setAlerts]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── MQTT temps réel ──────────────────────────────────────────────
  const { sensors, newAlert, clearAlert, isConnected, lastUpdate } = useMQTT();

  // Notification automatique si alerte critique MQTT
  useEffect(() => {
    if (newAlert?.status === 'critical') {
      Alert.alert(
        '🚨 Alerte Critique',
        newAlert.sensor ? `${newAlert.sensor.name} : ${newAlert.sensor.value}${newAlert.sensor.unit}` : 'Capteur critique détecté',
        [{ text: 'OK', onPress: clearAlert }]
      );
    }
  }, [newAlert]);

  // ── Animation pulse ──────────────────────────────────────────────
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // ── Charger données non-MQTT depuis API ──────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [r, p, a] = await Promise.allSettled([
        roomAPI.getAll(),
        parkingAPI.getAll(),
        alertAPI.getAll(),
      ]);
      if (r.status === 'fulfilled') setRooms(r.value.data.rooms    || []);
      if (p.status === 'fulfilled') setParking(p.value.data.spots  || []);
      if (a.status === 'fulfilled') setAlerts(a.value.data.alerts  || []);
    } catch (e) {
      console.error(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTriggerAlarm = () => {
    Alert.alert('🚨 Alarme Générale', 'Déclencher une alarme pour tout le campus ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'DÉCLENCHER', style: 'destructive',
        onPress: async () => {
          try {
            await alertAPI.triggerAlarm('🚨 ALARME GÉNÉRALE — Déclenchée par l\'administrateur');
            Alert.alert('✅ Alarme déclenchée', 'Tous les ESP32 ont reçu la commande MQTT.');
            fetchData();
          } catch (e) {
            Alert.alert('Erreur', 'Impossible de déclencher l\'alarme.');
          }
        },
      },
    ]);
  };

  const criticalSensors  = sensors.filter(s => s.status === 'critical');
  const warningSensors   = sensors.filter(s => s.status === 'warning');
  const availableRooms   = rooms.filter(r => r.available).length;
  const availableParking = parking.filter(p => p.available).length;
  const unreadAlerts     = alerts.filter(a => !a.isRead).length;
  const now = new Date();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={ACCENT} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Panneau d'administration</Text>
            <Text style={styles.headerTitle}>Bonjour, {user?.name?.split(' ')[0]} 👑</Text>
            <Text style={styles.headerDate}>
              {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <View style={styles.rightHeader}>
            {/* Badge MQTT connecté/déconnecté */}
            <View style={[styles.mqttBadge, { backgroundColor: isConnected ? '#6DC9A022' : '#F0707022' }]}>
              <Animated.View style={[styles.mqttDot, { backgroundColor: isConnected ? '#6DC9A0' : '#F07070', opacity: pulseAnim }]} />
              <Text style={[styles.mqttText, { color: isConnected ? '#6DC9A0' : '#F07070' }]}>
                {isConnected ? 'MQTT LIVE' : 'MQTT OFF'}
              </Text>
            </View>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ADMIN</Text>
            </View>
          </View>
        </View>

        {/* Dernière MAJ MQTT */}
        {lastUpdate && (
          <Text style={styles.lastUpdate}>
            ⚡ Dernière MAJ MQTT : {lastUpdate.toLocaleTimeString('fr-FR')}
          </Text>
        )}

        {/* Alertes critiques */}
        {criticalSensors.length > 0 && (
          <View style={styles.criticalBanner}>
            <Text style={styles.criticalBannerText}>
              🚨 {criticalSensors.length} capteur{criticalSensors.length > 1 ? 's' : ''} en état critique !
            </Text>
            <Text style={styles.criticalBannerSub}>Action immédiate requise</Text>
          </View>
        )}

        {/* Stats globales */}
        <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
          <StatCard emoji="📡" value={sensors.length} label="Capteurs" color={ACCENT} sub={`${criticalSensors.length} critiques`} />
          <StatCard emoji="🚪" value={availableRooms} label="Salles libres" color="#6DC9A0" sub={`${rooms.length} total`} />
          <StatCard emoji="🅿️" value={availableParking} label="Places libres" color="#F5C27A" sub={`${parking.length} total`} />
          <StatCard emoji="🔔" value={unreadAlerts} label="Alertes" color="#F07070" sub="non lues" />
          <StatCard emoji="⚠️" value={warningSensors.length} label="Attention" color="#F5C27A" sub="capteurs" />
        </ScrollView>

        {/* Bouton alarme */}
        <TouchableOpacity style={styles.alarmBtn} onPress={handleTriggerAlarm} activeOpacity={0.85}>
          <Text style={styles.alarmBtnText}>🚨  DÉCLENCHER ALARME GÉNÉRALE</Text>
        </TouchableOpacity>

        {/* Capteurs MQTT temps réel */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Capteurs MQTT en direct</Text>
          <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
        </View>

        {loading && sensors.length === 0 ? (
          <ActivityIndicator color={ACCENT} size="large" style={{ marginVertical: 30 }} />
        ) : sensors.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>📡 En attente des données MQTT...</Text>
            <Text style={styles.emptySubText}>Vérifiez que l'ESP32 est allumé</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {sensors.map((sensor, i) => (
              <View key={sensor._id || sensor.deviceId}>
                <SensorRow sensor={sensor} />
                {i < sensors.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        )}

        {/* Alertes récentes */}
        <Text style={styles.sectionTitle}>Alertes récentes</Text>
        <View style={styles.card}>
          {alerts.slice(0, 5).map((alert, i) => (
            <View key={alert._id}>
              <View style={styles.alertRow}>
                <Text style={styles.alertEmoji}>
                  {alert.type === 'urgence' ? '🔥' : alert.type === 'sécurité' ? '🛡️' : '⚙️'}
                </Text>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertMsg} numberOfLines={1}>{alert.message}</Text>
                  <Text style={styles.alertTime}>
                    {new Date(alert.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                {!alert.isRead && <View style={styles.unreadDot} />}
              </View>
              {i < Math.min(alerts.length, 5) - 1 && <View style={styles.divider} />}
            </View>
          ))}
          {alerts.length === 0 && <Text style={styles.emptyText}>Aucune alerte</Text>}
        </View>

        {/* Occupation salles */}
        <Text style={styles.sectionTitle}>Occupation des salles</Text>
        <View style={styles.card}>
          {rooms.slice(0, 6).map((room, i) => (
            <View key={room._id}>
              <View style={styles.roomRow}>
                <Text style={styles.roomEmoji}>🚪</Text>
                <Text style={styles.roomName} numberOfLines={1}>{room.name}</Text>
                <View style={[styles.roomBadge, { backgroundColor: room.available ? '#6DC9A022' : '#F0707022' }]}>
                  <Text style={[styles.roomBadgeText, { color: room.available ? '#6DC9A0' : '#F07070' }]}>
                    {room.available ? 'Libre' : 'Occupée'}
                  </Text>
                </View>
              </View>
              {i < Math.min(rooms.length, 6) - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 20, marginBottom: 4,
  },
  headerSub:   { fontSize: 12, color: '#7C5CBF', fontWeight: '600', marginBottom: 2 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerDate:  { fontSize: 12, color: '#555577', marginTop: 2 },
  rightHeader: { alignItems: 'flex-end', gap: 8 },
  adminBadge:  { backgroundColor: ACCENT, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  adminBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  mqttBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  mqttDot:   { width: 7, height: 7, borderRadius: 4 },
  mqttText:  { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  lastUpdate: { fontSize: 11, color: '#6DC9A0', paddingHorizontal: 20, marginBottom: 8 },
  criticalBanner: {
    backgroundColor: '#F0707022', borderRadius: 12,
    marginHorizontal: 20, marginBottom: 16, padding: 14,
    borderLeftWidth: 4, borderLeftColor: '#F07070',
  },
  criticalBannerText: { color: '#F07070', fontWeight: '800', fontSize: 14 },
  criticalBannerSub:  { color: '#F07070', fontSize: 12, opacity: 0.7, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', paddingHorizontal: 20, marginBottom: 10, marginTop: 8 },
  sectionRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10, marginTop: 8, gap: 8 },
  liveDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6DC9A0' },
  statsScroll:  { paddingHorizontal: 20, marginBottom: 16 },
  statCard: {
    backgroundColor: CARD, borderRadius: 16, padding: 16,
    marginRight: 12, minWidth: 100, alignItems: 'center', borderTopWidth: 3,
  },
  statEmoji:  { fontSize: 24, marginBottom: 6 },
  statValue:  { fontSize: 28, fontWeight: '800' },
  statLabel:  { fontSize: 11, color: '#888AAA', marginTop: 2 },
  statSub:    { fontSize: 10, color: '#555577', marginTop: 2 },
  alarmBtn: {
    backgroundColor: '#F07070', borderRadius: 999,
    marginHorizontal: 20, marginBottom: 20, height: 52,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#F07070', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  alarmBtnText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  card: { backgroundColor: CARD, borderRadius: 16, marginHorizontal: 20, marginBottom: 16, padding: 4 },
  sensorRow:       { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  sensorEmoji:     { fontSize: 24 },
  sensorInfo:      { flex: 1 },
  sensorName:      { fontSize: 13, fontWeight: '700', color: '#fff' },
  sensorDevice:    { fontSize: 11, color: '#555577', marginTop: 2 },
  sensorRight:     { alignItems: 'flex-end' },
  sensorValue:     { fontSize: 14, fontWeight: '800', color: '#fff' },
  sensorStatus:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  sensorDot:       { width: 6, height: 6, borderRadius: 3 },
  sensorStatusText: { fontSize: 10, fontWeight: '700' },
  alertRow:  { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  alertEmoji: { fontSize: 22 },
  alertInfo:  { flex: 1 },
  alertMsg:   { fontSize: 13, fontWeight: '600', color: '#fff' },
  alertTime:  { fontSize: 11, color: '#555577', marginTop: 2 },
  unreadDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT },
  roomRow:  { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  roomEmoji: { fontSize: 20 },
  roomName:  { flex: 1, fontSize: 13, fontWeight: '600', color: '#fff' },
  roomBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  roomBadgeText: { fontSize: 11, fontWeight: '700' },
  divider:   { height: 1, backgroundColor: '#ffffff08', marginHorizontal: 14 },
  empty:     { padding: 20, alignItems: 'center' },
  emptyText:    { color: '#555577', fontSize: 14 },
  emptySubText: { color: '#333355', fontSize: 12, marginTop: 4 },
});

export default AdminDashboard;