// src/screens/admin/ParkingManager.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl, ScrollView, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { parkingAPI } from '../../api';

const ACCENT = '#7C5CBF';
const BG = '#1A1A2E';
const CARD = '#16213E';
const FLOOR_LABELS = { 0: 'Parking 1', 1: 'Parking 2', 2: 'Parking 3' };

const ParkingManager = () => {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [filter, setFilter] = useState('all');
  const [detailSpot, setDetailSpot] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const fetchSpots = useCallback(async () => {
    try {
      const res = await parkingAPI.getAll();
      setSpots(res.data.spots || []);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger le parking.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSpots(); }, [fetchSpots]);

  const floors = [...new Set(spots.map(s => s.floor))].sort((a, b) => a - b);
  const floorSpots = spots.filter(s => s.floor === (floors[selectedFloor] ?? 0));

  const filteredSpots = filter === 'all' ? floorSpots
    : filter === 'available' ? floorSpots.filter(s => s.available)
    : floorSpots.filter(s => !s.available);

  const totalAvailable = spots.filter(s => s.available).length;
  const totalOccupied = spots.filter(s => !s.available).length;

  const handleForceCancel = (spot) => {
    Alert.alert(
      '🔓 Libérer la place',
      `Libérer la place ${spot.spotNumber} réservée par ${spot.reservedByName || 'Inconnu'} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Libérer', style: 'destructive',
          onPress: async () => {
            try {
              await parkingAPI.cancel(spot._id);
              fetchSpots();
              setDetailVisible(false);
              Alert.alert('✅ Place libérée');
            } catch (e) {
              Alert.alert('Erreur', e.response?.data?.message || 'Impossible de libérer.');
            }
          },
        },
      ]
    );
  };

  const openDetail = (spot) => {
    setDetailSpot(spot);
    setDetailVisible(true);
  };

  const getSpotConfig = (spot) => {
    if (spot.available) return { bg: '#6DC9A022', border: '#6DC9A0', text: '#6DC9A0', emoji: '🟢' };
    return { bg: '#F0707022', border: '#F07070', text: '#F07070', emoji: '🔴' };
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSpots(); }} tintColor={ACCENT} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Parking</Text>
            <Text style={styles.headerSub}>{spots.length} places au total</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => { setRefreshing(true); fetchSpots(); }}>
            <Text style={styles.refreshBtnText}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Stats globales */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: '#6DC9A044' }]}>
            <Text style={[styles.statValue, { color: '#6DC9A0' }]}>{totalAvailable}</Text>
            <Text style={styles.statLabel}>Libres</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#F0707044' }]}>
            <Text style={[styles.statValue, { color: '#F07070' }]}>{totalOccupied}</Text>
            <Text style={styles.statLabel}>Occupées</Text>
          </View>
          <View style={[styles.statCard, { borderColor: ACCENT + '44' }]}>
            <Text style={[styles.statValue, { color: ACCENT }]}>
              {Math.round((totalOccupied / (spots.length || 1)) * 100)}%
            </Text>
            <Text style={styles.statLabel}>Taux occup.</Text>
          </View>
        </View>

        {/* Réservations actives */}
        {totalOccupied > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔴 Places occupées</Text>
            <View style={styles.card}>
              {spots.filter(s => !s.available).map((spot, i, arr) => (
                <TouchableOpacity key={spot._id} style={styles.occupiedRow} onPress={() => openDetail(spot)}>
                  <View style={styles.occupiedLeft}>
                    <Text style={styles.occupiedSpot}>{spot.spotNumber}</Text>
                    <Text style={styles.occupiedFloor}>{FLOOR_LABELS[spot.floor]}</Text>
                  </View>
                  <View style={styles.occupiedCenter}>
                    <Text style={styles.occupiedBy}>👤 {spot.reservedByName || 'Inconnu'}</Text>
                    {spot.reservedUntil && (
                      <Text style={styles.occupiedUntil}>
                        ⏰ Jusqu'à {new Date(spot.reservedUntil).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity style={styles.freeBtn} onPress={() => handleForceCancel(spot)}>
                    <Text style={styles.freeBtnText}>Libérer</Text>
                  </TouchableOpacity>
                  {i < arr.length - 1 && <View style={styles.divider} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Sélecteur parking */}
        <Text style={styles.sectionTitle}>🗺️ Vue par parking</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorScroll}>
          {floors.map((floor, i) => (
            <TouchableOpacity
              key={floor}
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

        {/* Filtres */}
        <View style={styles.filters}>
          {[
            { key: 'all', label: 'Toutes' },
            { key: 'available', label: '🟢 Libres' },
            { key: 'occupied', label: '🔴 Occupées' },
          ].map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterBtnText, filter === f.key && { color: '#fff' }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Grille des places */}
        {loading ? (
          <ActivityIndicator color={ACCENT} size="large" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.gridContainer}>
            <View style={styles.grid}>
              {filteredSpots.map((spot) => {
                const cfg = getSpotConfig(spot);
                return (
                  <TouchableOpacity
                    key={spot._id}
                    style={[styles.spotCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
                    onPress={() => openDetail(spot)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.spotEmoji}>{cfg.emoji}</Text>
                    <Text style={[styles.spotNumber, { color: cfg.text }]}>{spot.spotNumber}</Text>
                    {!spot.available && (
                      <Text style={styles.spotUser} numberOfLines={1}>
                        {spot.reservedByName?.split(' ')[0] || '—'}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            {filteredSpots.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Aucune place</Text>
              </View>
            )}
          </View>
        )}

        {/* Légende */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#6DC9A0' }]} />
            <Text style={styles.legendText}>Libre</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F07070' }]} />
            <Text style={styles.legendText}>Occupée</Text>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Modal détail place */}
      <Modal visible={detailVisible} transparent animationType="slide" onRequestClose={() => setDetailVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {detailSpot && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>🅿️ Place {detailSpot.spotNumber}</Text>
                  <TouchableOpacity onPress={() => setDetailVisible(false)}>
                    <Text style={{ color: '#555577', fontSize: 20 }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalFloor}>{FLOOR_LABELS[detailSpot.floor]}</Text>

                <View style={[styles.modalStatus, {
                  backgroundColor: detailSpot.available ? '#6DC9A022' : '#F0707022',
                }]}>
                  <Text style={{ fontSize: 28 }}>{detailSpot.available ? '🟢' : '🔴'}</Text>
                  <View>
                    <Text style={[styles.modalStatusText, { color: detailSpot.available ? '#6DC9A0' : '#F07070' }]}>
                      {detailSpot.available ? 'Disponible' : 'Occupée'}
                    </Text>
                    {!detailSpot.available && (
                      <Text style={styles.modalStatusSub}>Réservée par {detailSpot.reservedByName}</Text>
                    )}
                  </View>
                </View>

                {!detailSpot.available && (
                  <View style={styles.detailInfo}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Étudiant</Text>
                      <Text style={styles.detailValue}>{detailSpot.reservedByName || '—'}</Text>
                    </View>
                    {detailSpot.reservedUntil && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Fin réservation</Text>
                        <Text style={styles.detailValue}>
                          {new Date(detailSpot.reservedUntil).toLocaleString('fr-FR', {
                            day: '2-digit', month: 'short',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.modalBtns}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setDetailVisible(false)}>
                    <Text style={styles.modalCancelText}>Fermer</Text>
                  </TouchableOpacity>
                  {!detailSpot.available && (
                    <TouchableOpacity style={styles.modalFreeBtn} onPress={() => handleForceCancel(detailSpot)}>
                      <Text style={styles.modalFreeBtnText}>🔓 Libérer la place</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: '#555577', marginTop: 2 },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: CARD, justifyContent: 'center', alignItems: 'center',
  },
  refreshBtnText: { fontSize: 18 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: CARD, borderRadius: 14,
    padding: 14, alignItems: 'center', borderWidth: 1,
  },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#555577', marginTop: 2 },
  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#888AAA', paddingHorizontal: 20, marginBottom: 10 },
  card: { backgroundColor: CARD, borderRadius: 14, overflow: 'hidden' },
  occupiedRow: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  occupiedLeft: { width: 60 },
  occupiedSpot: { fontSize: 14, fontWeight: '800', color: '#fff' },
  occupiedFloor: { fontSize: 10, color: '#555577', marginTop: 2 },
  occupiedCenter: { flex: 1 },
  occupiedBy: { fontSize: 13, fontWeight: '600', color: '#fff' },
  occupiedUntil: { fontSize: 11, color: '#555577', marginTop: 2 },
  freeBtn: {
    backgroundColor: '#F0707022', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#F07070',
  },
  freeBtnText: { color: '#F07070', fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#ffffff08', marginHorizontal: 14 },
  floorScroll: { paddingHorizontal: 20, marginBottom: 12 },
  floorBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14,
    backgroundColor: CARD, marginRight: 10, alignItems: 'center', minWidth: 110,
  },
  floorBtnActive: { backgroundColor: ACCENT },
  floorBtnText: { fontSize: 13, fontWeight: '700', color: '#888AAA' },
  floorBtnCount: { fontSize: 11, color: '#444466', marginTop: 2 },
  filters: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 14 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: CARD },
  filterBtnActive: { backgroundColor: ACCENT },
  filterBtnText: { color: '#555577', fontWeight: '600', fontSize: 12 },
  gridContainer: { paddingHorizontal: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  spotCard: {
    width: '22%', aspectRatio: 0.85, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, padding: 4,
  },
  spotEmoji: { fontSize: 14, marginBottom: 2 },
  spotNumber: { fontSize: 11, fontWeight: '800' },
  spotUser: { fontSize: 9, color: '#888AAA', marginTop: 1, textAlign: 'center' },
  legend: {
    flexDirection: 'row', paddingHorizontal: 20,
    gap: 20, marginTop: 14,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#555577' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#555577', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  modalFloor: { fontSize: 13, color: '#555577', marginBottom: 16 },
  modalStatus: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 14, padding: 16, marginBottom: 16,
  },
  modalStatusText: { fontSize: 16, fontWeight: '800' },
  modalStatusSub: { fontSize: 12, color: '#888AAA', marginTop: 2 },
  detailInfo: { backgroundColor: '#0F3460', borderRadius: 14, padding: 14, marginBottom: 16, gap: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 12, color: '#555577' },
  detailValue: { fontSize: 13, fontWeight: '700', color: '#fff' },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, height: 48, borderRadius: 999, backgroundColor: '#ffffff11', justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { color: '#888AAA', fontWeight: '700' },
  modalFreeBtn: { flex: 2, height: 48, borderRadius: 999, backgroundColor: '#F0707022', borderWidth: 1, borderColor: '#F07070', justifyContent: 'center', alignItems: 'center' },
  modalFreeBtnText: { color: '#F07070', fontWeight: '800', fontSize: 14 },
});

export default ParkingManager;