// src/screens/teacher/TeacherRooms.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { roomAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

const BG = '#0F2027';
const CARD = '#1A3040';
const CARD2 = '#0D2535';
const ACCENT = '#2196F3';

const HOURS = ['08:00','09:00','10:00','10:15','11:00','12:00','13:00','14:00','14:30','15:00','16:00','16:30','17:00','18:00'];
const DURATIONS = [
  { label: '45 min', value: 45 },
  { label: '1h30', value: 90 },
  { label: '2h', value: 120 },
  { label: '3h', value: 180 },
];

const TeacherRooms = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [startTime, setStartTime] = useState('08:00');
  const [duration, setDuration] = useState(90);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await roomAPI.getAll();
      setRooms(res.data.rooms || []);
    } catch { Alert.alert('Erreur', 'Impossible de charger les salles.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const filtered = filter === 'all' ? rooms
    : filter === 'available' ? rooms.filter(r => r.available)
    : rooms.filter(r => !r.available);

  const myReservation = rooms.find(r =>
    r.reservations?.some(res => res.userName === user?.name)
  );

  const handleReserve = async () => {
    if (!selectedRoom) return;
    const date = new Date().toISOString().split('T')[0];
    try {
      await roomAPI.reserve(selectedRoom._id, { date, startTime, duration });
      setModalVisible(false);
      fetchRooms();
      Alert.alert('✅ Salle réservée', `${selectedRoom.name} réservée à ${startTime}`);
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.message || 'Réservation impossible.');
    }
  };

  const handleCancel = (room) => {
    Alert.alert('Annuler la réservation', `Libérer ${room.name} ?`, [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui', style: 'destructive', onPress: async () => {
        try { await roomAPI.cancel(room._id); fetchRooms(); }
        catch { Alert.alert('Erreur', 'Annulation impossible.'); }
      }},
    ]);
  };

  const renderRoom = ({ item }) => {
    const isMyRoom = item.reservations?.some(r => r.userName === user?.name);
    return (
      <View style={styles.roomCard}>
        <View style={styles.roomCardTop}>
          <View style={styles.roomIconBg}><Text style={{ fontSize: 26 }}>🚪</Text></View>
          <View style={styles.roomInfo}>
            <Text style={styles.roomName}>{item.name}</Text>
            <View style={styles.roomMeta}>
              <Text style={styles.roomMetaText}>👥 {item.capacity}</Text>
              <Text style={styles.roomMetaText}>🔧 {item.equipment?.length || 0}</Text>
            </View>
            {item.equipment?.length > 0 && (
              <Text style={styles.roomEquip} numberOfLines={1}>
                {item.equipment.slice(0,3).join(' • ')}
              </Text>
            )}
          </View>
          <View style={styles.roomCardRight}>
            <View style={[styles.statusBadge, { backgroundColor: item.available ? '#4CAF5022' : '#F4433622' }]}>
              <Text style={[styles.statusBadgeText, { color: item.available ? '#4CAF50' : '#F44336' }]}>
                {item.available ? 'Libre' : isMyRoom ? 'Ma salle' : 'Occupée'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.roomCardActions}>
          {item.available && (
            <TouchableOpacity style={styles.reserveBtn} onPress={() => { setSelectedRoom(item); setModalVisible(true); }}>
              <Text style={styles.reserveBtnText}>📅 Réserver</Text>
            </TouchableOpacity>
          )}
          {isMyRoom && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item)}>
              <Text style={styles.cancelBtnText}>🗑️ Annuler ma résa</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Salles</Text>
          <Text style={styles.sub}>{rooms.filter(r => r.available).length}/{rooms.length} disponibles</Text>
        </View>
      </View>

      {myReservation && (
        <View style={styles.myResCard}>
          <Text style={styles.myResTitle}>📌 Ma salle réservée</Text>
          <Text style={styles.myResName}>{myReservation.name}</Text>
          <TouchableOpacity onPress={() => handleCancel(myReservation)}>
            <Text style={styles.myResCancelText}>Libérer</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.filters}>
        {[{k:'all',l:'Toutes'},{k:'available',l:'✅ Libres'},{k:'occupied',l:'🔴 Occupées'}].map(f => (
          <TouchableOpacity key={f.k} style={[styles.filterBtn, filter === f.k && styles.filterBtnActive]} onPress={() => setFilter(f.k)}>
            <Text style={[styles.filterBtnText, filter === f.k && { color: '#fff' }]}>{f.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator color={ACCENT} size="large" style={{ marginTop: 60 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={i => i._id}
          renderItem={renderRoom}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRooms(); }} tintColor={ACCENT} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Aucune salle</Text></View>}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>📅 Réserver {selectedRoom?.name}</Text>
            <Text style={styles.fieldLabel}>Heure de début</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {HOURS.map(h => (
                <TouchableOpacity key={h} style={[styles.timeChip, startTime === h && styles.timeChipActive]} onPress={() => setStartTime(h)}>
                  <Text style={[styles.timeChipText, startTime === h && { color: '#fff' }]}>{h}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.fieldLabel}>Durée</Text>
            <View style={styles.durationRow}>
              {DURATIONS.map(d => (
                <TouchableOpacity key={d.value} style={[styles.durationBtn, duration === d.value && styles.durationBtnActive]} onPress={() => setDuration(d.value)}>
                  <Text style={[styles.durationBtnText, duration === d.value && { color: '#fff' }]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleReserve}>
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
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 12, color: '#445566', marginTop: 2 },
  myResCard: { backgroundColor: ACCENT + '22', borderRadius: 12, marginHorizontal: 20, marginBottom: 12, padding: 14, borderWidth: 1, borderColor: ACCENT + '44', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  myResTitle: { fontSize: 12, fontWeight: '700', color: ACCENT },
  myResName: { fontSize: 14, fontWeight: '800', color: '#fff', flex: 1, marginLeft: 8 },
  myResCancelText: { color: '#F44336', fontWeight: '700', fontSize: 12 },
  filters: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: CARD },
  filterBtnActive: { backgroundColor: ACCENT },
  filterBtnText: { color: '#445566', fontWeight: '600', fontSize: 12 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  roomCard: { backgroundColor: CARD, borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
  roomCardTop: { flexDirection: 'row', padding: 14, gap: 12, alignItems: 'flex-start' },
  roomIconBg: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#ffffff08', justifyContent: 'center', alignItems: 'center' },
  roomInfo: { flex: 1 },
  roomName: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 4 },
  roomMeta: { flexDirection: 'row', gap: 12 },
  roomMetaText: { fontSize: 11, color: '#445566' },
  roomEquip: { fontSize: 11, color: ACCENT, marginTop: 3 },
  roomCardRight: { alignItems: 'flex-end' },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  roomCardActions: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 12 },
  reserveBtn: { flex: 1, backgroundColor: ACCENT + '22', borderRadius: 999, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: ACCENT + '44' },
  reserveBtnText: { color: ACCENT, fontWeight: '700', fontSize: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#F4433622', borderRadius: 999, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#F4433644' },
  cancelBtnText: { color: '#F44336', fontWeight: '700', fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#445566', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#8899AA', marginBottom: 8 },
  timeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: CARD2, marginRight: 8 },
  timeChipActive: { backgroundColor: ACCENT },
  timeChipText: { color: '#8899AA', fontWeight: '600', fontSize: 12 },
  durationRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  durationBtn: { flex: 1, borderRadius: 12, backgroundColor: CARD2, padding: 10, alignItems: 'center' },
  durationBtnActive: { backgroundColor: ACCENT },
  durationBtnText: { color: '#8899AA', fontWeight: '600', fontSize: 12 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, height: 48, borderRadius: 999, backgroundColor: '#ffffff11', justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { color: '#8899AA', fontWeight: '700' },
  modalConfirmBtn: { flex: 2, height: 48, borderRadius: 999, backgroundColor: ACCENT, justifyContent: 'center', alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

export default TeacherRooms;