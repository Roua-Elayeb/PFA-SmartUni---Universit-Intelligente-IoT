// ============================================================
//  SmartUni — ParkingScreen.js (version MQTT + ultrason)
//  Remplace src/screens/student/ParkingScreen.js
//
//  Nouveautés :
//   - Socket.IO temps réel (parking:update depuis ultrason)
//   - Badge "Voiture détectée" sur les places occupées physiquement
//   - Distingue : Libre / Réservé / Voiture garée / Réservé + voiture
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator,
  RefreshControl, Modal, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { io } from 'socket.io-client';
import { parkingAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, fonts } from '../../theme';

const BACKEND_URL  = 'http://20.50.1.5:5000';
const FLOOR_LABELS = { 0: 'Parking 1', 1: 'Parking 2', 2: 'Parking 3' };
const DURATIONS = [
  { label: '30 min', hours: 0.5 },
  { label: '1 heure', hours: 1 },
  { label: '2 heures', hours: 2 },
  { label: '3 heures', hours: 3 },
  { label: '4 heures', hours: 4 },
  { label: '8 heures', hours: 8 },
  { label: 'Toute la journée', hours: 24 },
];

// ─── Config visuelle selon état de la place ───────────────────
const getSpotConfig = (spot, userId) => {
  const isMe      = spot.reservedBy === userId || spot.reservedByName === userId;
  const hasVehicle = spot.occupiedByVehicle;
  const reserved   = !spot.available;

  if (isMe)                            return { bg: '#EDE4FF', border: '#9B7FD4', text: '#9B7FD4',   emoji: '🔵', label: 'Moi',      labelBg: '#9B7FD422' };
  if (hasVehicle && reserved)          return { bg: '#FFE8E8', border: '#F07070', text: '#F07070',   emoji: '🚗', label: 'Occupé',   labelBg: '#F0707022' };
  if (hasVehicle)                      return { bg: '#FFF3E0', border: '#FF9800', text: '#FF9800',   emoji: '🚙', label: 'Voiture',  labelBg: '#FF980022' };
  if (reserved)                        return { bg: '#FFE8E8', border: '#F07070', text: '#F07070',   emoji: '🔴', label: 'Réservé',  labelBg: '#F0707022' };
  return                                      { bg: '#E8F8F0', border: '#6DC9A0', text: '#6DC9A0',   emoji: '🟢', label: 'Libre',    labelBg: '#6DC9A022' };
};

const ParkingScreen = () => {
  const { user } = useAuth();
  const [spots,          setSpots]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [selectedFloor,  setSelectedFloor]  = useState(0);
  const [modalVisible,   setModalVisible]   = useState(false);
  const [selectedSpot,   setSelectedSpot]   = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[1]);
  const [isConnected,    setIsConnected]    = useState(false);
  const [entryAlert,     setEntryAlert]     = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Socket.IO temps réel ──────────────────────────────────
  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket'], reconnection: true });

    socket.on('connect',    () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Mise à jour ultrason depuis ESP32
    socket.on('parking:update', ({ spots: updatedSpots }) => {
      setSpots(prev => prev.map(p => {
        const updated = updatedSpots.find(u => u._id === p._id || u.spotNumber === p.spotNumber);
        return updated ? { ...p, ...updated } : p;
      }));
    });

    // Voiture à l'entrée détectée
    socket.on('parking:entry', () => {
      setEntryAlert(true);
      setTimeout(() => setEntryAlert(false), 4000);
    });

    return () => socket.disconnect();
  }, []);

  // ── Pulse animation ────────────────────────────────────────
  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, []);

  // ── Charger données ────────────────────────────────────────
  const fetchSpots = useCallback(async () => {
    try {
      const res = await parkingAPI.getAll();
      setSpots(res.data.spots || []);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger le parking.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSpots(); }, [fetchSpots]);

  const floors        = [...new Set(spots.map(s => s.floor))].sort((a, b) => a - b);
  const filteredSpots = spots.filter(s => s.floor === (floors[selectedFloor] ?? 0));
  const myReservation = spots.find(s => s.reservedByName === user?.name);
  const availableCount = filteredSpots.filter(s => s.available && !s.occupiedByVehicle).length;
  const vehicleCount   = filteredSpots.filter(s => s.occupiedByVehicle).length;

  // ── Appui sur une place ────────────────────────────────────
  const handleSpotPress = (spot) => {
    const cfg    = getSpotConfig(spot, user?.name);
    const isMe   = spot.reservedByName === user?.name;

    if (spot.occupiedByVehicle && !isMe) {
      Alert.alert('🚗 Voiture détectée', `Place ${spot.spotNumber} — une voiture est garée ici.`);
      return;
    }
    if (!spot.available && !isMe) {
      Alert.alert('🔴 Place réservée', `Réservée par : ${spot.reservedByName || 'Inconnu'}`);
      return;
    }
    if (isMe) {
      Alert.alert('🔵 Ma réservation', `Libérer la place ${spot.spotNumber} ?`, [
        { text: 'Garder', style: 'cancel' },
        { text: 'Libérer', style: 'destructive', onPress: async () => {
          try { await parkingAPI.cancel(spot._id); fetchSpots(); }
          catch (e) { Alert.alert('Erreur', e.response?.data?.message || 'Impossible.'); }
        }},
      ]);
      return;
    }
    if (myReservation) {
      Alert.alert('⚠️ Réservation active', `Vous avez déjà la place ${myReservation.spotNumber}.`);
      return;
    }
    setSelectedSpot(spot);
    setSelectedDuration(DURATIONS[1]);
    setModalVisible(true);
  };

  // ── Confirmer réservation ──────────────────────────────────
  const confirmReservation = async () => {
    if (!selectedSpot) return;
    const until = new Date();
    until.setTime(until.getTime() + selectedDuration.hours * 3600000);
    try {
      await parkingAPI.reserve(selectedSpot._id, until.toISOString());
      setModalVisible(false);
      fetchSpots();
      Alert.alert('✅ Réservé !', `Place ${selectedSpot.spotNumber}\nJusqu'à ${until.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.message || 'Réservation impossible.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSpots(); }} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Parking</Text>
            <View style={styles.liveRow}>
              <Animated.View style={[styles.liveDot, { opacity: pulseAnim, backgroundColor: isConnected ? '#6DC9A0' : '#ccc' }]} />
              <Text style={styles.liveText}>{isConnected ? 'Temps réel actif' : 'Mode statique'}</Text>
            </View>
          </View>
          <View style={styles.headerBadges}>
            <View style={[styles.badge, { backgroundColor: '#E8F8F0' }]}>
              <Text style={[styles.badgeText, { color: '#6DC9A0' }]}>{availableCount} libres</Text>
            </View>
            {vehicleCount > 0 && (
              <View style={[styles.badge, { backgroundColor: '#FFF3E0' }]}>
                <Text style={[styles.badgeText, { color: '#FF9800' }]}>{vehicleCount} voitures</Text>
              </View>
            )}
          </View>
        </View>

        {/* Alerte entrée voiture */}
        {entryAlert && (
          <View style={styles.entryAlert}>
            <Text style={styles.entryAlertText}>🚗  Voiture détectée à l'entrée !</Text>
          </View>
        )}

        {/* Ma réservation */}
        {myReservation && (
          <TouchableOpacity style={styles.myResCard} onPress={() => handleSpotPress(myReservation)} activeOpacity={0.85}>
            <View style={styles.myResLeft}>
              <Text style={styles.myResEmoji}>🔵</Text>
              <View>
                <Text style={styles.myResTitle}>Ma place réservée</Text>
                <Text style={styles.myResInfo}>
                  <Text style={styles.myResSpot}>{myReservation.spotNumber}</Text>
                  {' — '}{FLOOR_LABELS[myReservation.floor]}
                </Text>
                {myReservation.occupiedByVehicle && (
                  <Text style={styles.vehicleDetected}>🚗 Voiture garée détectée</Text>
                )}
                {myReservation.reservedUntil && (
                  <Text style={styles.myResTime}>
                    ⏰ Jusqu'à {new Date(myReservation.reservedUntil).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.myResCancelBtn}>
              <Text style={styles.myResCancelText}>Libérer</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Légende */}
        <View style={styles.legend}>
          {[
            { color: '#6DC9A0', label: 'Libre' },
            { color: '#9B7FD4', label: 'Ma place' },
            { color: '#FF9800', label: 'Voiture' },
            { color: '#F07070', label: 'Réservé' },
          ].map(({ color, label }) => (
            <View key={label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Sélecteur parking */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorScroll}>
          {floors.map((floor, i) => (
            <TouchableOpacity
              key={floor}
              style={[styles.floorBtn, selectedFloor === i && styles.floorBtnActive]}
              onPress={() => setSelectedFloor(i)}
            >
              <Text style={[styles.floorBtnText, selectedFloor === i && styles.floorBtnTextActive]}>
                {FLOOR_LABELS[floor] || `Parking ${floor + 1}`}
              </Text>
              <Text style={[styles.floorBtnCount, selectedFloor === i && { color: '#fff' }]}>
                {spots.filter(s => s.floor === floor && s.available && !s.occupiedByVehicle).length} libres
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Grille des places */}
        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} />
        ) : (
          <View style={styles.gridContainer}>
            <View style={styles.grid}>
              {filteredSpots.map((spot) => {
                const cfg  = getSpotConfig(spot, user?.name);
                const isMe = spot.reservedByName === user?.name;
                return (
                  <TouchableOpacity
                    key={spot._id}
                    style={[styles.spotCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
                    onPress={() => handleSpotPress(spot)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.spotEmoji}>{cfg.emoji}</Text>
                    <Text style={[styles.spotNumber, { color: cfg.text }]}>{spot.spotNumber}</Text>
                    <View style={[styles.spotLabelBg, { backgroundColor: cfg.labelBg }]}>
                      <Text style={[styles.spotLabel, { color: cfg.text }]}>{cfg.label}</Text>
                    </View>
                    {isMe && <Text style={styles.spotMe}>MOI</Text>}
                    {spot.occupiedByVehicle && (
                      <View style={styles.ultrasonBadge}>
                        <Text style={styles.ultrasonText}>📡</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.ultrasonNote}>📡 = voiture détectée par ultrason</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal réservation */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🅿️ {selectedSpot?.spotNumber}</Text>
            <Text style={styles.modalSubtitle}>{selectedSpot ? FLOOR_LABELS[selectedSpot.floor] : ''}</Text>
            <Text style={styles.modalLabel}>Durée de réservation :</Text>
            <View style={styles.durationGrid}>
              {DURATIONS.map((d) => (
                <TouchableOpacity
                  key={d.label}
                  style={[styles.durationBtn, selectedDuration.label === d.label && styles.durationBtnActive]}
                  onPress={() => setSelectedDuration(d)}
                >
                  <Text style={[styles.durationText, selectedDuration.label === d.label && styles.durationTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedDuration && (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>
                  ⏰ Fin :{' '}
                  <Text style={styles.summaryTime}>
                    {(() => { const t = new Date(); t.setTime(t.getTime() + selectedDuration.hours * 3600000); return t.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); })()}
                  </Text>
                </Text>
              </View>
            )}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmReservation}>
                <Text style={styles.modalConfirmText}>✅ Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EDE6FF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { fontSize: fonts.sizes.xxl, fontWeight: '800', color: colors.textPrimary },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: fonts.sizes.xs, color: colors.textMuted },
  headerBadges: { gap: 6, alignItems: 'flex-end' },
  badge: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { fontSize: fonts.sizes.xs, fontWeight: '700' },
  entryAlert: { backgroundColor: '#FF980022', borderRadius: radius.lg, marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: 12, borderLeftWidth: 3, borderLeftColor: '#FF9800' },
  entryAlertText: { color: '#FF9800', fontWeight: '700', fontSize: fonts.sizes.sm },
  myResCard: { backgroundColor: colors.secondary + '18', borderRadius: radius.lg, marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.md, borderWidth: 1.5, borderColor: colors.secondary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  myResLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  myResEmoji: { fontSize: 28 },
  myResTitle: { fontSize: fonts.sizes.sm, fontWeight: '700', color: colors.secondary },
  myResInfo: { fontSize: fonts.sizes.sm, color: colors.textPrimary, marginTop: 2 },
  myResSpot: { fontWeight: '800', color: colors.secondary },
  vehicleDetected: { fontSize: fonts.sizes.xs, color: '#FF9800', marginTop: 2, fontWeight: '600' },
  myResTime: { fontSize: fonts.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  myResCancelBtn: { backgroundColor: colors.danger + '22', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  myResCancelText: { color: colors.danger, fontSize: fonts.sizes.xs, fontWeight: '700' },
  legend: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginBottom: spacing.sm, gap: 14, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: fonts.sizes.xs, color: colors.textSecondary, fontWeight: '600' },
  floorScroll: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  floorBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.82)', marginRight: spacing.sm, alignItems: 'center', minWidth: 110 },
  floorBtnActive: { backgroundColor: colors.primary },
  floorBtnText: { fontSize: fonts.sizes.sm, fontWeight: '700', color: colors.textSecondary },
  floorBtnTextActive: { color: '#fff' },
  floorBtnCount: { fontSize: fonts.sizes.xs, color: colors.textMuted, marginTop: 2 },
  gridContainer: { paddingHorizontal: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  spotCard: { width: '22%', aspectRatio: 0.8, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center', borderWidth: 2, padding: 4, position: 'relative' },
  spotEmoji: { fontSize: 16, marginBottom: 1 },
  spotNumber: { fontSize: 11, fontWeight: '800' },
  spotLabelBg: { borderRadius: radius.full, paddingHorizontal: 5, paddingVertical: 2, marginTop: 2 },
  spotLabel: { fontSize: 8, fontWeight: '700' },
  spotMe: { fontSize: 8, fontWeight: '800', color: colors.secondary, marginTop: 1 },
  ultrasonBadge: { position: 'absolute', top: 3, right: 3 },
  ultrasonText: { fontSize: 9 },
  ultrasonNote: { fontSize: fonts.sizes.xs, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(45,32,64,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFF0F6', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: spacing.xl, paddingBottom: 40 },
  modalTitle: { fontSize: fonts.sizes.xxl, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  modalSubtitle: { fontSize: fonts.sizes.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  modalLabel: { fontSize: fonts.sizes.md, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  durationBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1.5, borderColor: colors.border },
  durationBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  durationText: { fontSize: fonts.sizes.sm, fontWeight: '600', color: colors.textSecondary },
  durationTextActive: { color: '#fff' },
  summaryBox: { backgroundColor: colors.primary + '15', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  summaryText: { fontSize: fonts.sizes.sm, color: colors.textPrimary, textAlign: 'center' },
  summaryTime: { fontWeight: '800', color: colors.primary },
  modalBtns: { flexDirection: 'row', gap: spacing.sm },
  modalCancelBtn: { flex: 1, height: 52, borderRadius: radius.full, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.border },
  modalCancelText: { fontWeight: '700', color: colors.textSecondary, fontSize: fonts.sizes.md },
  modalConfirmBtn: { flex: 2, height: 52, borderRadius: radius.full, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary },
  modalConfirmText: { fontWeight: '800', color: '#fff', fontSize: fonts.sizes.md },
});

export default ParkingScreen;