// src/screens/admin/RoomsManager.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl, TextInput, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { roomAPI } from '../../api';

const ACCENT = '#7C5CBF';
const BG = '#1A1A2E';
const CARD = '#16213E';

const RoomsManager = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailRoom, setDetailRoom] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // Formulaire
  const [formName, setFormName] = useState('');
  const [formCapacity, setFormCapacity] = useState('');
  const [formEquipment, setFormEquipment] = useState('');

  const fetchRooms = useCallback(async () => {
    try {
      const res = await roomAPI.getAll();
      setRooms(res.data.rooms || []);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger les salles.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const filtered = filter === 'all' ? rooms
    : filter === 'available' ? rooms.filter(r => r.available)
    : rooms.filter(r => !r.available);

  const handleAddRoom = async () => {
    if (!formName.trim() || !formCapacity) {
      Alert.alert('Erreur', 'Nom et capacité sont obligatoires.');
      return;
    }
    try {
      const equipment = formEquipment.split(',').map(e => e.trim()).filter(Boolean);
      await roomAPI.addRoom?.({ name: formName.trim(), capacity: parseInt(formCapacity), equipment });
      Alert.alert('✅ Salle ajoutée');
      setModalVisible(false);
      setFormName(''); setFormCapacity(''); setFormEquipment('');
      fetchRooms();
    } catch (e) {
      Alert.alert('Info', 'Endpoint d\'ajout non disponible. Ajoutez via le backend.');
    }
  };

  const handleForceCancel = async (room) => {
    Alert.alert(
      'Annuler toutes les réservations',
      `Libérer la salle ${room.name} ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Confirmer', style: 'destructive',
          onPress: async () => {
            try {
              await roomAPI.cancel(room._id);
              fetchRooms();
              Alert.alert('✅ Salle libérée');
            } catch (e) {
              Alert.alert('Erreur', 'Impossible d\'annuler.');
            }
          },
        },
      ]
    );
  };

  const openDetail = async (room) => {
    try {
      const res = await roomAPI.getReservations(room._id);
      setDetailRoom({ ...room, reservations: res.data.reservations || [] });
    } catch {
      setDetailRoom({ ...room, reservations: room.reservations || [] });
    }
    setDetailVisible(true);
  };

  const renderRoom = ({ item }) => (
    <TouchableOpacity style={styles.roomCard} onPress={() => openDetail(item)} activeOpacity={0.85}>
      <View style={styles.roomCardTop}>
        <View style={styles.roomIconBg}>
          <Text style={{ fontSize: 28 }}>🚪</Text>
        </View>
        <View style={styles.roomInfo}>
          <Text style={styles.roomName}>{item.name}</Text>
          <View style={styles.roomMeta}>
            <Text style={styles.roomMetaText}>👥 {item.capacity}</Text>
            <Text style={styles.roomMetaText}>🔧 {item.equipment?.length || 0} équip.</Text>
            <Text style={styles.roomMetaText}>📋 {item.reservations?.length || 0} résa</Text>
          </View>
          {item.equipment?.length > 0 && (
            <Text style={styles.roomEquip} numberOfLines={1}>
              {item.equipment.slice(0, 3).join(' • ')}
            </Text>
          )}
        </View>
        <View style={styles.roomCardRight}>
          <View style={[styles.statusBadge, {
            backgroundColor: item.available ? '#6DC9A022' : '#F0707022'
          }]}>
            <Text style={[styles.statusBadgeText, {
              color: item.available ? '#6DC9A0' : '#F07070'
            }]}>
              {item.available ? 'Libre' : 'Occupée'}
            </Text>
          </View>
          {!item.available && (
            <TouchableOpacity style={styles.forceBtn} onPress={() => handleForceCancel(item)}>
              <Text style={styles.forceBtnText}>Libérer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Salles</Text>
          <Text style={styles.headerSub}>
            {rooms.filter(r => r.available).length}/{rooms.length} disponibles
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Salle</Text>
        </TouchableOpacity>
      </View>

      {/* Résumé */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryItem, { borderColor: '#6DC9A044' }]}>
          <Text style={[styles.summaryValue, { color: '#6DC9A0' }]}>{rooms.filter(r => r.available).length}</Text>
          <Text style={styles.summaryLabel}>Libres</Text>
        </View>
        <View style={[styles.summaryItem, { borderColor: '#F0707044' }]}>
          <Text style={[styles.summaryValue, { color: '#F07070' }]}>{rooms.filter(r => !r.available).length}</Text>
          <Text style={styles.summaryLabel}>Occupées</Text>
        </View>
        <View style={[styles.summaryItem, { borderColor: ACCENT + '44' }]}>
          <Text style={[styles.summaryValue, { color: ACCENT }]}>
            {rooms.reduce((acc, r) => acc + (r.reservations?.length || 0), 0)}
          </Text>
          <Text style={styles.summaryLabel}>Réservations</Text>
        </View>
      </View>

      {/* Filtres */}
      <View style={styles.filters}>
        {[
          { key: 'all', label: 'Toutes' },
          { key: 'available', label: '✅ Libres' },
          { key: 'occupied', label: '🔴 Occupées' },
        ].map(f => (
          <TouchableOpacity key={f.key} style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]} onPress={() => setFilter(f.key)}>
            <Text style={[styles.filterBtnText, filter === f.key && { color: '#fff' }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={ACCENT} size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderRoom}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRooms(); }} tintColor={ACCENT} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Aucune salle</Text></View>}
        />
      )}

      {/* Modal Ajout */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🚪 Nouvelle salle</Text>
            <Text style={styles.fieldLabel}>Nom de la salle</Text>
            <TextInput style={styles.fieldInput} placeholder="ex: Salle A101" placeholderTextColor="#555577" value={formName} onChangeText={setFormName} />
            <Text style={styles.fieldLabel}>Capacité</Text>
            <TextInput style={styles.fieldInput} placeholder="ex: 30" placeholderTextColor="#555577" value={formCapacity} onChangeText={setFormCapacity} keyboardType="numeric" />
            <Text style={styles.fieldLabel}>Équipements (séparés par virgule)</Text>
            <TextInput style={styles.fieldInput} placeholder="Projecteur, WiFi, Tableau" placeholderTextColor="#555577" value={formEquipment} onChangeText={setFormEquipment} />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddRoom}>
                <Text style={styles.modalSaveText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Détail réservations */}
      <Modal visible={detailVisible} transparent animationType="slide" onRequestClose={() => setDetailVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={styles.detailHeader}>
              <Text style={styles.modalTitle}>📋 {detailRoom?.name}</Text>
              <TouchableOpacity onPress={() => setDetailVisible(false)}>
                <Text style={{ color: '#555577', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Réservations ({detailRoom?.reservations?.length || 0})</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {detailRoom?.reservations?.length === 0 ? (
                <Text style={styles.emptyText}>Aucune réservation</Text>
              ) : (
                detailRoom?.reservations?.map((res, i) => (
                  <View key={i} style={styles.resItem}>
                    <Text style={styles.resUser}>👤 {res.userName}</Text>
                    <Text style={styles.resTime}>📅 {res.date} à {res.startTime} — {res.duration} min</Text>
                  </View>
                ))
              )}
            </ScrollView>
            {detailRoom && !detailRoom.available && (
              <TouchableOpacity style={styles.forceCancelBtn} onPress={() => { setDetailVisible(false); handleForceCancel(detailRoom); }}>
                <Text style={styles.forceCancelText}>🗑️ Forcer l'annulation</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: '#555577', marginTop: 2 },
  addBtn: { backgroundColor: ACCENT, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 12 },
  summaryItem: { flex: 1, backgroundColor: CARD, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1 },
  summaryValue: { fontSize: 24, fontWeight: '800' },
  summaryLabel: { fontSize: 11, color: '#555577', marginTop: 2 },
  filters: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: CARD },
  filterBtnActive: { backgroundColor: ACCENT },
  filterBtnText: { color: '#555577', fontWeight: '600', fontSize: 12 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  roomCard: { backgroundColor: CARD, borderRadius: 14, padding: 14, marginBottom: 10 },
  roomCardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  roomIconBg: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#ffffff08', justifyContent: 'center', alignItems: 'center' },
  roomInfo: { flex: 1 },
  roomName: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 4 },
  roomMeta: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  roomMetaText: { fontSize: 11, color: '#555577' },
  roomEquip: { fontSize: 11, color: ACCENT },
  roomCardRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  forceBtn: { backgroundColor: '#F0707022', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  forceBtnText: { color: '#F07070', fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#555577', fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#888AAA', marginBottom: 6 },
  fieldInput: { backgroundColor: '#0F3460', borderRadius: 10, height: 48, paddingHorizontal: 14, color: '#fff', fontSize: 14, marginBottom: 14 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, height: 48, borderRadius: 999, backgroundColor: '#ffffff11', justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { color: '#888AAA', fontWeight: '700' },
  modalSaveBtn: { flex: 2, height: 48, borderRadius: 999, backgroundColor: ACCENT, justifyContent: 'center', alignItems: 'center' },
  modalSaveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  resItem: { backgroundColor: '#0F3460', borderRadius: 10, padding: 12, marginBottom: 8 },
  resUser: { color: '#fff', fontWeight: '600', fontSize: 13 },
  resTime: { color: '#888AAA', fontSize: 12, marginTop: 4 },
  forceCancelBtn: { backgroundColor: '#F0707022', borderRadius: 999, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  forceCancelText: { color: '#F07070', fontWeight: '800', fontSize: 14 },
});

export default RoomsManager;