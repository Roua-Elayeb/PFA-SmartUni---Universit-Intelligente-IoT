// src/screens/teacher/TeacherParkingScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator,
  RefreshControl, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { parkingAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

const BG = '#0F2027';
const CARD = '#1A3040';
const CARD2 = '#0D2535';
const ACCENT = '#2196F3';

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

const TeacherParkingScreen = () => {
  const { user } = useAuth();
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[1]);

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
      Alert.alert('🔵 Ma réservation', `Voulez-vous libérer la place ${spot.spotNumber} ?`, [
        { text: 'Garder', style: 'cancel' },
        { text: 'Libérer', style: 'destructive', onPress: async () => {
          try { await parkingAPI.cancel(spot._id); fetchSpots(); Alert.alert('✅ Place libérée'); }
          catch (e) { Alert.alert('Erreur', e.response?.data?.message || 'Impossible.'); }
        }},
      ]);
      return;
    }
    if (myReservation) {
      Alert.alert('⚠️ Réservation existante', `Vous avez déjà la place ${myReservation.spotNumber}. Libérez-la d'abord.`);
      return;
    }
    setSelectedSpot(spot);
    setSelectedDuration(DURATIONS[1]);
    setModalVisible(true);
  };

  const confirmReservation = async () => {
    if (!selectedSpot) return;
    const until = new Date();
    until.setTime(until.getTime() + selectedDuration.hours * 3600000);
    try {
      await parkingAPI.reserve(selectedSpot._id, until.toISOString());
      setModalVisible(false);
      fetchSpots();
      Alert.alert('✅ Réservé !', `Place ${selectedSpot.spotNumber}\nDurée: ${selectedDuration.label}\nJusqu'à: ${until.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.message || 'Réservation impossible.');
    }
  };

  const getSpotConfig = (spot) => {
    if (spot.available) return { bg: '#4CAF5022', border: '#4CAF50', text: '#4CAF50', emoji: '🟢' };
    if (spot.reservedByName === user?.name) return { bg: ACCENT + '22', border: ACCENT, text: ACCENT, emoji: '🔵' };
    return { bg: '#F4433622', border: '#F44336', text: '#F44336', emoji: '🔴' };
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSpots(); }} tintColor={ACCENT} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Parking</Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{availableCount} libres</Text>
          </View>
        </View>

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
          {[{ color: '#4CAF50', label: 'Libre' }, { color: ACCENT, label: 'Ma place' }, { color: '#F44336', label: 'Occupé' }].map(({ color, label }) => (
            <View key={label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Sélecteur parking */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorScroll}>
          {floors.map((floor, i) => (
            <TouchableOpacity key={floor}
              style={[styles.floorBtn, selectedFloor === i && styles.floorBtnActive]}
              onPress={() => setSelectedFloor(i)}
            >
              <Text style={[styles.floorBtnText, selectedFloor === i && { color: '#fff' }]}>
                {FLOOR_LABELS[floor] || `Parking ${floor + 1}`}
              </Text>
              <Text style={[styles.floorBtnCount, selectedFloor === i && { color: '#ffffffaa' }]}>
                {spots.filter(s => s.floor === floor && s.available).length} libres
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Grille */}
        {loading ? (
          <ActivityIndicator color={ACCENT} size="large" style={{ marginTop: 60 }} />
        ) : (
          <View style={styles.gridContainer}>
            <View style={styles.grid}>
              {filteredSpots.map((spot) => {
                const cfg = getSpotConfig(spot);
                const isMe = spot.reservedByName === user?.name;
                return (
                  <TouchableOpacity key={spot._id}
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
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🅿️ {selectedSpot?.spotNumber}</Text>
            <Text style={styles.modalSubtitle}>{selectedSpot ? FLOOR_LABELS[selectedSpot.floor] : ''}</Text>
            <Text style={styles.modalLabel}>Choisir la durée :</Text>
            <View style={styles.durationGrid}>
              {DURATIONS.map((d) => (
                <TouchableOpacity key={d.label}
                  style={[styles.durationBtn, selectedDuration.label === d.label && styles.durationBtnActive]}
                  onPress={() => setSelectedDuration(d)}
                >
                  <Text style={[styles.durationText, selectedDuration.label === d.label && { color: '#fff' }]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>
                ⏰ Fin :{' '}
                <Text style={[styles.summaryTime, { color: ACCENT }]}>
                  {(() => {
                    const t = new Date();
                    t.setTime(t.getTime() + selectedDuration.hours * 3600000);
                    return t.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  })()}
                </Text>
              </Text>
            </View>
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
  safe: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  pill: { backgroundColor: '#4CAF5022', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#4CAF5044' },
  pillText: { color: '#4CAF50', fontSize: 12, fontWeight: '700' },
  myResCard: { backgroundColor: ACCENT + '18', borderRadius: 14, marginHorizontal: 20, marginBottom: 12, padding: 14, borderWidth: 1.5, borderColor: ACCENT + '44', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  myResLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  myResEmoji: { fontSize: 28 },
  myResTitle: { fontSize: 12, fontWeight: '700', color: ACCENT },
  myResInfo: { fontSize: 13, color: '#fff', marginTop: 2 },
  myResSpot: { fontWeight: '800', color: ACCENT },
  myResTime: { fontSize: 11, color: '#445566', marginTop: 2 },
  myResCancelBtn: { backgroundColor: '#F4433622', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#F4433644' },
  myResCancelText: { color: '#F44336', fontSize: 11, fontWeight: '700' },
  legend: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12, gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#8899AA' },
  floorScroll: { paddingHorizontal: 20, marginBottom: 12 },
  floorBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, backgroundColor: CARD, marginRight: 10, alignItems: 'center', minWidth: 110 },
  floorBtnActive: { backgroundColor: ACCENT },
  floorBtnText: { fontSize: 13, fontWeight: '700', color: '#8899AA' },
  floorBtnCount: { fontSize: 11, color: '#445566', marginTop: 2 },
  gridContainer: { paddingHorizontal: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  spotCard: { width: '22%', aspectRatio: 0.85, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, padding: 4 },
  spotEmoji: { fontSize: 14, marginBottom: 2 },
  spotNumber: { fontSize: 11, fontWeight: '800' },
  spotMe: { fontSize: 9, fontWeight: '800', color: ACCENT, marginTop: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: CARD, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' },
  modalSubtitle: { fontSize: 13, color: '#8899AA', textAlign: 'center', marginBottom: 20 },
  modalLabel: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 12 },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  durationBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: CARD2, borderWidth: 1.5, borderColor: '#ffffff11' },
  durationBtnActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  durationText: { fontSize: 13, fontWeight: '600', color: '#8899AA' },
  summaryBox: { backgroundColor: ACCENT + '15', borderRadius: 12, padding: 12, marginBottom: 20 },
  summaryText: { fontSize: 13, color: '#fff', textAlign: 'center' },
  summaryTime: { fontWeight: '800' },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, height: 50, borderRadius: 999, backgroundColor: '#ffffff11', justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { color: '#8899AA', fontWeight: '700' },
  modalConfirmBtn: { flex: 2, height: 50, borderRadius: 999, backgroundColor: ACCENT, justifyContent: 'center', alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default TeacherParkingScreen;