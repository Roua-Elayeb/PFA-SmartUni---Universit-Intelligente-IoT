// src/screens/ReadingRoomsScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated, RefreshControl,
  Modal, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, fonts } from '../../theme';

const { width } = Dimensions.get('window');

// ── Configuration des 3 salles de lecture ────────────────────────────────────
const READING_ROOMS = [
  {
    id: 'DS',
    name: 'Salle DS',
    fullName: 'Droit & Sciences',
    totalSeats: 48,
    floors: 1,
    cameraId: 'CAM-DS-01',
    color: '#E8709A',
    lightColor: '#FFE4EE',
    emoji: '⚖️',
  },
  {
    id: 'BS',
    name: 'Salle BS',
    fullName: 'Bio & Sciences',
    totalSeats: 60,
    floors: 1,
    cameraId: 'CAM-BS-01',
    color: '#6DC9A0',
    lightColor: '#E4FFF4',
    emoji: '🔬',
  },
  {
    id: 'POLY',
    name: 'Salle POLY',
    fullName: 'Polytechnique',
    totalSeats: 72,
    floors: 2,
    cameraId: 'CAM-POLY-01',
    color: '#B89EE8',
    lightColor: '#F0E8FF',
    emoji: '⚙️',
  },
];

// ── Simulation détection caméra (remplace par vrai API) ──────────────────────
const simulateCameraDetection = (room) => {
  const occupied = Math.floor(Math.random() * (room.totalSeats * 0.9));
  const available = room.totalSeats - occupied;
  const occupancyRate = Math.round((occupied / room.totalSeats) * 100);

  let status;
  if (occupancyRate >= 90) status = 'full';
  else if (occupancyRate >= 70) status = 'busy';
  else if (occupancyRate >= 40) status = 'moderate';
  else status = 'available';

  // Simulation des rangées de sièges
  const rows = [];
  const seatsPerRow = Math.ceil(room.totalSeats / 6);
  let seatIndex = 0;
  for (let r = 0; r < 6; r++) {
    const row = [];
    for (let s = 0; s < seatsPerRow && seatIndex < room.totalSeats; s++) {
      row.push({ id: seatIndex, occupied: seatIndex < occupied });
      seatIndex++;
    }
    rows.push(row);
  }

  return { occupied, available, occupancyRate, status, rows, lastUpdate: new Date() };
};

// ── Composant SeatMap ─────────────────────────────────────────────────────────
const SeatMap = ({ rows, color }) => (
  <View style={seatStyles.container}>
    {/* Tableau / Écran */}
    <View style={[seatStyles.screen, { backgroundColor: color + '33', borderColor: color }]}>
      <Text style={[seatStyles.screenText, { color }]}>📋 Tableau</Text>
    </View>

    {/* Rangées de sièges */}
    <View style={seatStyles.rows}>
      {rows.map((row, ri) => (
        <View key={ri} style={seatStyles.row}>
          <Text style={seatStyles.rowLabel}>{String.fromCharCode(65 + ri)}</Text>
          <View style={seatStyles.seats}>
            {row.map((seat) => (
              <View
                key={seat.id}
                style={[
                  seatStyles.seat,
                  seat.occupied
                    ? seatStyles.seatOccupied
                    : [seatStyles.seatFree, { borderColor: color }],
                ]}
              >
                {seat.occupied && <Text style={seatStyles.seatIcon}>👤</Text>}
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>

    {/* Légende */}
    <View style={seatStyles.legend}>
      <View style={seatStyles.legendItem}>
        <View style={[seatStyles.legendDot, { borderColor: color, backgroundColor: 'transparent', borderWidth: 2 }]} />
        <Text style={seatStyles.legendText}>Libre</Text>
      </View>
      <View style={seatStyles.legendItem}>
        <View style={[seatStyles.legendDot, { backgroundColor: '#C4B5D9' }]} />
        <Text style={seatStyles.legendText}>Occupé</Text>
      </View>
    </View>
  </View>
);

const seatStyles = StyleSheet.create({
  container: { padding: spacing.md },
  screen: {
    borderRadius: radius.sm, borderWidth: 2, padding: 8,
    alignItems: 'center', marginBottom: spacing.md,
  },
  screenText: { fontSize: fonts.sizes.xs, fontWeight: '700' },
  rows: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowLabel: { fontSize: 10, fontWeight: '700', color: '#B8ACCC', width: 14 },
  seats: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', flex: 1 },
  seat: {
    width: 22, height: 22, borderRadius: 4,
    justifyContent: 'center', alignItems: 'center',
  },
  seatFree: { backgroundColor: 'transparent', borderWidth: 1.5 },
  seatOccupied: { backgroundColor: '#C4B5D9' },
  seatIcon: { fontSize: 10 },
  legend: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: fonts.sizes.xs, color: '#8A7A9B' },
});

// ── Composant RoomCard ────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  available: { label: 'Disponible', color: '#6DC9A0', bg: '#E4FFF4', emoji: '✅' },
  moderate:  { label: 'Modéré',     color: '#F5C27A', bg: '#FFF8E4', emoji: '🟡' },
  busy:      { label: 'Chargé',     color: '#F07070', bg: '#FFE8E8', emoji: '🟠' },
  full:      { label: 'Complet',    color: '#E8709A', bg: '#FFE4EE', emoji: '🔴' },
};

const RoomCard = ({ room, data, onPress, pulseAnim }) => {
  const statusCfg = STATUS_CONFIG[data?.status || 'available'];
  const occupancyRate = data?.occupancyRate || 0;

  return (
    <TouchableOpacity style={styles.roomCard} onPress={() => onPress(room, data)} activeOpacity={0.85}>
      {/* Header */}
      <View style={styles.roomCardHeader}>
        <View style={[styles.roomIconBg, { backgroundColor: room.lightColor }]}>
          <Text style={styles.roomIcon}>{room.emoji}</Text>
        </View>
        <View style={styles.roomCardInfo}>
          <Text style={styles.roomCardName}>{room.name}</Text>
          <Text style={styles.roomCardFull}>{room.fullName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Text style={styles.statusEmoji}>{statusCfg.emoji}</Text>
          <Text style={[styles.statusLabel, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.roomStats}>
        <View style={styles.roomStatItem}>
          <Text style={[styles.roomStatValue, { color: room.color }]}>{data?.available ?? '—'}</Text>
          <Text style={styles.roomStatLabel}>Places libres</Text>
        </View>
        <View style={styles.roomStatDivider} />
        <View style={styles.roomStatItem}>
          <Text style={[styles.roomStatValue, { color: '#8A7A9B' }]}>{data?.occupied ?? '—'}</Text>
          <Text style={styles.roomStatLabel}>Occupées</Text>
        </View>
        <View style={styles.roomStatDivider} />
        <View style={styles.roomStatItem}>
          <Text style={[styles.roomStatValue, { color: '#2D2040' }]}>{room.totalSeats}</Text>
          <Text style={styles.roomStatLabel}>Total</Text>
        </View>
      </View>

      {/* Barre de progression */}
      <View style={styles.progressBg}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: `${occupancyRate}%`,
              backgroundColor: statusCfg.color,
            },
          ]}
        />
      </View>
      <View style={styles.progressLabels}>
        <Text style={styles.progressLeft}>0%</Text>
        <Text style={[styles.progressCenter, { color: statusCfg.color }]}>{occupancyRate}% occupé</Text>
        <Text style={styles.progressRight}>100%</Text>
      </View>

      {/* Camera info */}
      <View style={styles.cameraRow}>
        <Animated.View style={[styles.cameraDot, { opacity: pulseAnim, backgroundColor: room.color }]} />
        <Text style={styles.cameraText}>📷 {room.cameraId} — En direct</Text>
        {data?.lastUpdate && (
          <Text style={styles.updateTime}>
            {data.lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ── Screen Principal ──────────────────────────────────────────────────────────
const ReadingRoomsScreen = () => {
  const [roomData, setRoomData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedData, setSelectedData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);

  // Animation pulse caméra
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Fetch données caméra
  const fetchCameraData = useCallback(() => {
    const newData = {};
    READING_ROOMS.forEach(room => {
      newData[room.id] = simulateCameraDetection(room);
    });
    setRoomData(newData);
    setLastRefresh(new Date());
    setRefreshing(false);
  }, []);

  // Auto-refresh toutes les 10 secondes
  useEffect(() => {
    fetchCameraData();
    intervalRef.current = setInterval(fetchCameraData, 10000);
    return () => clearInterval(intervalRef.current);
  }, [fetchCameraData]);

  const handleRoomPress = (room, data) => {
    setSelectedRoom(room);
    setSelectedData(data);
    setModalVisible(true);
  };

  const totalAvailable = Object.values(roomData).reduce((acc, d) => acc + (d?.available || 0), 0);
  const totalSeats = READING_ROOMS.reduce((acc, r) => acc + r.totalSeats, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCameraData(); }} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Salles de lecture</Text>
            <Text style={styles.subtitle}>Détection en temps réel</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchCameraData}>
            <Text style={styles.refreshBtnText}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Résumé global */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryValue}>{totalAvailable}</Text>
            <Text style={styles.summaryLabel}>places libres au total</Text>
          </View>
          <View style={styles.summaryRight}>
            {READING_ROOMS.map(room => {
              const d = roomData[room.id];
              const cfg = STATUS_CONFIG[d?.status || 'available'];
              return (
                <View key={room.id} style={styles.summaryRoomChip}>
                  <Text style={styles.summaryRoomEmoji}>{room.emoji}</Text>
                  <Text style={styles.summaryRoomName}>{room.id}</Text>
                  <Text style={[styles.summaryRoomStatus, { color: cfg.color }]}>{cfg.emoji}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Dernière mise à jour */}
        <View style={styles.updateRow}>
          <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
          <Text style={styles.updateText}>
            Mis à jour à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Text>
          <Text style={styles.autoText}>• Auto 10s</Text>
        </View>

        {/* Cards des salles */}
        <View style={styles.cards}>
          {READING_ROOMS.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              data={roomData[room.id]}
              onPress={handleRoomPress}
              pulseAnim={pulseAnim}
            />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal détail salle */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedRoom && selectedData && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={[styles.modalIconBg, { backgroundColor: selectedRoom.lightColor }]}>
                    <Text style={{ fontSize: 32 }}>{selectedRoom.emoji}</Text>
                  </View>
                  <View style={styles.modalHeaderInfo}>
                    <Text style={styles.modalTitle}>{selectedRoom.name}</Text>
                    <Text style={styles.modalSubtitle}>{selectedRoom.fullName}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Status */}
                {(() => {
                  const cfg = STATUS_CONFIG[selectedData.status];
                  return (
                    <View style={[styles.modalStatus, { backgroundColor: cfg.bg }]}>
                      <Text style={{ fontSize: 24 }}>{cfg.emoji}</Text>
                      <Text style={[styles.modalStatusText, { color: cfg.color }]}>
                        {cfg.label} — {selectedData.available} places disponibles
                      </Text>
                    </View>
                  );
                })()}

                {/* Stats */}
                <View style={styles.modalStats}>
                  {[
                    { value: selectedData.available, label: 'Libres', color: '#6DC9A0' },
                    { value: selectedData.occupied, label: 'Occupées', color: '#F07070' },
                    { value: selectedData.occupancyRate + '%', label: 'Taux', color: selectedRoom.color },
                  ].map(({ value, label, color }) => (
                    <View key={label} style={styles.modalStatItem}>
                      <Text style={[styles.modalStatValue, { color }]}>{value}</Text>
                      <Text style={styles.modalStatLabel}>{label}</Text>
                    </View>
                  ))}
                </View>

                {/* Plan de la salle */}
                <Text style={styles.mapTitle}>📐 Plan de la salle</Text>
                <ScrollView style={styles.mapScroll} showsVerticalScrollIndicator={false}>
                  <SeatMap rows={selectedData.rows} color={selectedRoom.color} />
                </ScrollView>

                {/* Camera info */}
                <View style={[styles.cameraInfoBox, { backgroundColor: selectedRoom.lightColor }]}>
                  <Text style={styles.cameraInfoText}>
                    📷 {selectedRoom.cameraId} • Dernière détection : {selectedData.lastUpdate.toLocaleTimeString('fr-FR')}
                  </Text>
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
  safe: { flex: 1, backgroundColor: '#EDE6FF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg, paddingBottom: spacing.sm,
  },
  title: { fontSize: fonts.sizes.xxl, fontWeight: '800', color: '#2D2040' },
  subtitle: { fontSize: fonts.sizes.sm, color: '#8A7A9B', marginTop: 2 },
  refreshBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#B89EE8', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  refreshBtnText: { fontSize: 20 },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: radius.xl,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    padding: spacing.lg, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#B89EE8', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 10, elevation: 3,
  },
  summaryLeft: { alignItems: 'center' },
  summaryValue: { fontSize: 42, fontWeight: '800', color: '#E8709A' },
  summaryLabel: { fontSize: fonts.sizes.xs, color: '#8A7A9B', marginTop: 2 },
  summaryRight: { gap: spacing.sm },
  summaryRoomChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F8F4FF', borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  summaryRoomEmoji: { fontSize: 14 },
  summaryRoomName: { fontSize: fonts.sizes.sm, fontWeight: '800', color: '#2D2040' },
  summaryRoomStatus: { fontSize: 14 },
  updateRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, marginBottom: spacing.md, gap: 6,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6DC9A0' },
  updateText: { fontSize: fonts.sizes.xs, color: '#8A7A9B' },
  autoText: { fontSize: fonts.sizes.xs, color: '#B8ACCC' },
  cards: { paddingHorizontal: spacing.lg, gap: spacing.md },
  roomCard: {
    backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: '#B89EE8', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
  },
  roomCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  roomIconBg: {
    width: 52, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  roomIcon: { fontSize: 26 },
  roomCardInfo: { flex: 1 },
  roomCardName: { fontSize: fonts.sizes.lg, fontWeight: '800', color: '#2D2040' },
  roomCardFull: { fontSize: fonts.sizes.xs, color: '#8A7A9B', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  statusEmoji: { fontSize: 12 },
  statusLabel: { fontSize: fonts.sizes.xs, fontWeight: '700' },
  roomStats: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  roomStatItem: { alignItems: 'center' },
  roomStatValue: { fontSize: fonts.sizes.xxl, fontWeight: '800' },
  roomStatLabel: { fontSize: fonts.sizes.xs, color: '#8A7A9B', marginTop: 2 },
  roomStatDivider: { width: 1, backgroundColor: 'rgba(184,172,204,0.3)' },
  progressBg: {
    height: 8, backgroundColor: '#F0EBF8',
    borderRadius: radius.full, overflow: 'hidden', marginBottom: 4,
  },
  progressFill: { height: '100%', borderRadius: radius.full },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  progressLeft: { fontSize: 10, color: '#B8ACCC' },
  progressCenter: { fontSize: 10, fontWeight: '700' },
  progressRight: { fontSize: 10, color: '#B8ACCC' },
  cameraRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderTopWidth: 1, borderTopColor: 'rgba(184,172,204,0.2)',
    paddingTop: spacing.sm,
  },
  cameraDot: { width: 8, height: 8, borderRadius: 4 },
  cameraText: { fontSize: fonts.sizes.xs, color: '#8A7A9B', flex: 1 },
  updateTime: { fontSize: 10, color: '#B8ACCC' },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(45,32,64,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFF0F6', borderTopLeftRadius: 30,
    borderTopRightRadius: 30, padding: spacing.xl,
    paddingBottom: 40, maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, marginBottom: spacing.md,
  },
  modalIconBg: {
    width: 60, height: 60, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  modalHeaderInfo: { flex: 1 },
  modalTitle: { fontSize: fonts.sizes.xl, fontWeight: '800', color: '#2D2040' },
  modalSubtitle: { fontSize: fonts.sizes.sm, color: '#8A7A9B' },
  modalClose: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F0EBF8', justifyContent: 'center', alignItems: 'center',
  },
  modalCloseText: { fontSize: 14, color: '#8A7A9B', fontWeight: '700' },
  modalStatus: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  modalStatusText: { fontSize: fonts.sizes.md, fontWeight: '700' },
  modalStats: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md,
  },
  modalStatItem: { alignItems: 'center' },
  modalStatValue: { fontSize: fonts.sizes.xxl, fontWeight: '800' },
  modalStatLabel: { fontSize: fonts.sizes.xs, color: '#8A7A9B', marginTop: 2 },
  mapTitle: {
    fontSize: fonts.sizes.md, fontWeight: '700',
    color: '#2D2040', marginBottom: spacing.sm,
  },
  mapScroll: { maxHeight: 280 },
  cameraInfoBox: {
    borderRadius: radius.md, padding: spacing.sm,
    marginTop: spacing.md, alignItems: 'center',
  },
  cameraInfoText: { fontSize: fonts.sizes.xs, color: '#8A7A9B', textAlign: 'center' },
});

export default ReadingRoomsScreen;