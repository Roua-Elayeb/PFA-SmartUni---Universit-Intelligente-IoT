// src/screens/ParkingScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator,
  RefreshControl, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { parkingAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, fonts } from '../../theme';

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

const ParkingScreen = () => {
  const { user } = useAuth();
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(0);

  // Modal réservation
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[1]);

  const fetchSpots = useCallback(async () => {
    try {
      const res = await parkingAPI.getAll();
      setSpots(res.data.spots || []);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger le parking.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSpots(); }, [fetchSpots]);

  const floors = [...new Set(spots.map(s => s.floor))].sort((a, b) => a - b);
  const filteredSpots = spots.filter(s => s.floor === (floors[selectedFloor] ?? 0));
  const myReservation = spots.find(s => s.reservedByName === user?.name);
  const availableCount = filteredSpots.filter(s => s.available).length;

  const handleSpotPress = (spot) => {
    if (!spot.available && spot.reservedByName !== user?.name) {
      Alert.alert('🔴 Place occupée', `Réservée par: ${spot.reservedByName || 'Inconnu'}`);
      return;
    }
    if (!spot.available && spot.reservedByName === user?.name) {
      Alert.alert(
        '🔵 Ma réservation',
        `Voulez-vous libérer la place ${spot.spotNumber} ?`,
        [
          { text: 'Garder', style: 'cancel' },
          {
            text: 'Libérer', style: 'destructive',
            onPress: async () => {
              try {
                await parkingAPI.cancel(spot._id);
                fetchSpots();
                Alert.alert('✅ Place libérée');
              } catch (err) {
                Alert.alert('Erreur', err.response?.data?.message || 'Impossible.');
              }
            },
          },
        ]
      );
      return;
    }
    if (myReservation) {
      Alert.alert('⚠️ Réservation existante', `Vous avez déjà la place ${myReservation.spotNumber}. Libérez-la d'abord.`);
      return;
    }
    // Ouvrir le modal
    setSelectedSpot(spot);
    setSelectedDuration(DURATIONS[1]);
    setModalVisible(true);
  };

  const confirmReservation = async () => {
    if (!selectedSpot) return;
    const until = new Date();
    until.setTime(until.getTime() + selectedDuration.hours * 60 * 60 * 1000);

    try {
      await parkingAPI.reserve(selectedSpot._id, until.toISOString());
      setModalVisible(false);
      fetchSpots();
      Alert.alert(
        '✅ Réservé !',
        `Place ${selectedSpot.spotNumber}\nDurée: ${selectedDuration.label}\nJusqu'à: ${until.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
      );
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.message || 'Réservation impossible.');
    }
  };

  const getSpotConfig = (spot) => {
    if (spot.available) return { bg: '#E8F8F0', border: colors.success, text: colors.success, emoji: '🟢' };
    if (spot.reservedByName === user?.name) return { bg: '#EDE4FF', border: colors.secondary, text: colors.secondary, emoji: '🔵' };
    return { bg: '#FFE8E8', border: colors.danger, text: colors.danger, emoji: '🔴' };
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSpots(); }} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Parking</Text>
          <View style={styles.headerStats}>
            <Text style={styles.headerStatsText}>{availableCount} libres</Text>
          </View>
        </View>

        {/* Ma réservation */}
        {myReservation && (
          <TouchableOpacity
            style={styles.myResCard}
            onPress={() => handleSpotPress(myReservation)}
            activeOpacity={0.85}
          >
            <View style={styles.myResLeft}>
              <Text style={styles.myResEmoji}>🔵</Text>
              <View>
                <Text style={styles.myResTitle}>Ma place réservée</Text>
                <Text style={styles.myResInfo}>
                  <Text style={styles.myResSpot}>{myReservation.spotNumber}</Text>
                  {' — '}{FLOOR_LABELS[myReservation.floor]}
                </Text>
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
            { color: colors.success, label: 'Libre' },
            { color: colors.secondary, label: 'Ma place' },
            { color: colors.danger, label: 'Occupé' },
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
                {spots.filter(s => s.floor === floor && s.available).length} libres
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Grille */}
        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} />
        ) : (
          <View style={styles.gridContainer}>
            <View style={styles.grid}>
              {filteredSpots.map((spot) => {
                const cfg = getSpotConfig(spot);
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
                    {isMe && <Text style={styles.spotMe}>MOI</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal réservation */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🅿️ {selectedSpot?.spotNumber}</Text>
            <Text style={styles.modalSubtitle}>
              {selectedSpot ? FLOOR_LABELS[selectedSpot.floor] : ''}
            </Text>

            <Text style={styles.modalLabel}>Choisir la durée :</Text>

            <View style={styles.durationGrid}>
              {DURATIONS.map((d) => (
                <TouchableOpacity
                  key={d.label}
                  style={[
                    styles.durationBtn,
                    selectedDuration.label === d.label && styles.durationBtnActive,
                  ]}
                  onPress={() => setSelectedDuration(d)}
                >
                  <Text style={[
                    styles.durationText,
                    selectedDuration.label === d.label && styles.durationTextActive,
                  ]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedDuration && (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>
                  ⏰ Fin de réservation :{' '}
                  <Text style={styles.summaryTime}>
                    {(() => {
                      const t = new Date();
                      t.setTime(t.getTime() + selectedDuration.hours * 3600000);
                      return t.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    })()}
                  </Text>
                </Text>
              </View>
            )}

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmReservation}
              >
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg, paddingBottom: spacing.md,
  },
  title: { fontSize: fonts.sizes.xxl, fontWeight: '800', color: colors.textPrimary },
  headerStats: {
    backgroundColor: colors.success + '22', borderRadius: radius.full,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  headerStatsText: { color: colors.success, fontSize: fonts.sizes.sm, fontWeight: '700' },
  myResCard: {
    backgroundColor: colors.secondary + '18', borderRadius: radius.lg,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    padding: spacing.md, borderWidth: 1.5, borderColor: colors.secondary,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  myResLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  myResEmoji: { fontSize: 28 },
  myResTitle: { fontSize: fonts.sizes.sm, fontWeight: '700', color: colors.secondary },
  myResInfo: { fontSize: fonts.sizes.sm, color: colors.textPrimary, marginTop: 2 },
  myResSpot: { fontWeight: '800', color: colors.secondary },
  myResTime: { fontSize: fonts.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  myResCancelBtn: {
    backgroundColor: colors.danger + '22', borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  myResCancelText: { color: colors.danger, fontSize: fonts.sizes.xs, fontWeight: '700' },
  legend: {
    flexDirection: 'row', paddingHorizontal: spacing.lg,
    marginBottom: spacing.md, gap: spacing.lg,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: fonts.sizes.xs, color: colors.textSecondary, fontWeight: '600' },
  floorScroll: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  floorBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.82)', marginRight: spacing.sm,
    alignItems: 'center', minWidth: 110,
    shadowColor: '#B89EE8', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
  },
  floorBtnActive: { backgroundColor: colors.primary },
  floorBtnText: { fontSize: fonts.sizes.sm, fontWeight: '700', color: colors.textSecondary },
  floorBtnTextActive: { color: colors.white },
  floorBtnCount: { fontSize: fonts.sizes.xs, color: colors.textMuted, marginTop: 2 },
  gridContainer: { paddingHorizontal: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  spotCard: {
    width: '22%', aspectRatio: 0.85, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, padding: spacing.xs,
    shadowColor: '#B89EE8', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  spotEmoji: { fontSize: 16, marginBottom: 2 },
  spotNumber: { fontSize: 11, fontWeight: '800' },
  spotMe: { fontSize: 8, fontWeight: '800', color: colors.secondary, marginTop: 1 },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(45,32,64,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFF0F6', borderTopLeftRadius: 30,
    borderTopRightRadius: 30, padding: spacing.xl,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: fonts.sizes.xxl, fontWeight: '800',
    color: colors.textPrimary, textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: fonts.sizes.sm, color: colors.textSecondary,
    textAlign: 'center', marginBottom: spacing.lg,
  },
  modalLabel: {
    fontSize: fonts.sizes.md, fontWeight: '700',
    color: colors.textPrimary, marginBottom: spacing.sm,
  },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  durationBtn: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1.5, borderColor: colors.border,
  },
  durationBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  durationText: { fontSize: fonts.sizes.sm, fontWeight: '600', color: colors.textSecondary },
  durationTextActive: { color: colors.white },
  summaryBox: {
    backgroundColor: colors.primary + '15', borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  summaryText: { fontSize: fonts.sizes.sm, color: colors.textPrimary, textAlign: 'center' },
  summaryTime: { fontWeight: '800', color: colors.primary },
  modalBtns: { flexDirection: 'row', gap: spacing.sm },
  modalCancelBtn: {
    flex: 1, height: 52, borderRadius: radius.full,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.border,
  },
  modalCancelText: { fontWeight: '700', color: colors.textSecondary, fontSize: fonts.sizes.md },
  modalConfirmBtn: {
    flex: 2, height: 52, borderRadius: radius.full,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.primary,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  modalConfirmText: { fontWeight: '800', color: colors.white, fontSize: fonts.sizes.md },
});

export default ParkingScreen;