// src/screens/admin/SensorsManager.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl, TextInput, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sensorAPI } from '../../api';

const ACCENT = '#7C5CBF';
const BG = '#1A1A2E';
const CARD = '#16213E';

const STATUS_COLOR = { normal: '#6DC9A0', warning: '#F5C27A', critical: '#F07070' };
const SENSOR_EMOJI = { temperature: '🌡️', humidity: '💧', co2: '🌿', airQuality: '💨', pressure: '📊', noise: '🔊' };
const SENSOR_TYPES = ['temperature', 'humidity', 'co2', 'airQuality', 'pressure', 'noise'];
const STATUS_LIST = ['normal', 'warning', 'critical'];

const SensorsManager = () => {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);

  // Formulaire ajout capteur
  const [formDeviceId, setFormDeviceId] = useState('');
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('temperature');
  const [formValue, setFormValue] = useState('');
  const [formUnit, setFormUnit] = useState('°C');
  const [formStatus, setFormStatus] = useState('normal');

  const fetchSensors = useCallback(async () => {
    try {
      const res = await sensorAPI.getLatest();
      setSensors(res.data.sensors || []);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger les capteurs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSensors(); }, [fetchSensors]);

  const filteredSensors = filter === 'all' ? sensors : sensors.filter(s => s.status === filter);

  const handleAddReading = async () => {
    if (!formDeviceId.trim() || !formName.trim() || !formValue) {
      Alert.alert('Erreur', 'Remplissez tous les champs.');
      return;
    }
    try {
      await sensorAPI.add({
        deviceId: formDeviceId.trim(),
        name: formName.trim(),
        type: formType,
        value: parseFloat(formValue),
        unit: formUnit.trim(),
        status: formStatus,
      });
      Alert.alert('✅ Lecture ajoutée');
      setModalVisible(false);
      setFormDeviceId(''); setFormName(''); setFormValue('');
      fetchSensors();
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.message || 'Impossible d\'ajouter.');
    }
  };

  const UNIT_DEFAULTS = {
    temperature: '°C', humidity: '%', co2: 'ppm',
    airQuality: 'AQI', pressure: 'hPa', noise: 'dB',
  };

  const renderSensor = ({ item }) => (
    <View style={styles.sensorCard}>
      <View style={styles.sensorCardTop}>
        <View style={styles.sensorIconBg}>
          <Text style={{ fontSize: 24 }}>{SENSOR_EMOJI[item.type] || '📡'}</Text>
        </View>
        <View style={styles.sensorCardInfo}>
          <Text style={styles.sensorCardName}>{item.name}</Text>
          <Text style={styles.sensorCardDevice}>ID: {item.deviceId}</Text>
          <Text style={styles.sensorCardType}>{item.type}</Text>
        </View>
        <View style={styles.sensorCardRight}>
          <Text style={styles.sensorCardValue}>
            {typeof item.value === 'number' ? item.value.toFixed(1) : item.value}
          </Text>
          <Text style={styles.sensorCardUnit}>{item.unit}</Text>
          <View style={[styles.statusChip, { backgroundColor: STATUS_COLOR[item.status] + '22' }]}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[item.status] }]} />
            <Text style={[styles.statusChipText, { color: STATUS_COLOR[item.status] }]}>{item.status}</Text>
          </View>
        </View>
      </View>
      <View style={styles.sensorCardBottom}>
        <Text style={styles.sensorTimestamp}>
          🕐 {new Date(item.timestamp || item.createdAt).toLocaleString('fr-FR', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
          })}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Capteurs IoT</Text>
          <Text style={styles.headerSub}>{sensors.length} capteurs actifs</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Lecture</Text>
        </TouchableOpacity>
      </View>

      {/* Stats rapides */}
      <View style={styles.quickStats}>
        {[
          { label: 'Normal', count: sensors.filter(s => s.status === 'normal').length, color: '#6DC9A0' },
          { label: 'Attention', count: sensors.filter(s => s.status === 'warning').length, color: '#F5C27A' },
          { label: 'Critique', count: sensors.filter(s => s.status === 'critical').length, color: '#F07070' },
        ].map(({ label, count, color }) => (
          <View key={label} style={[styles.quickStatItem, { borderColor: color + '44' }]}>
            <Text style={[styles.quickStatValue, { color }]}>{count}</Text>
            <Text style={styles.quickStatLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Filtres */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {['all', 'normal', 'warning', 'critical'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
              {f === 'all' ? 'Tous' : f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={ACCENT} size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filteredSensors}
          keyExtractor={item => item._id || item.deviceId}
          renderItem={renderSensor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSensors(); }} tintColor={ACCENT} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>📡</Text>
              <Text style={styles.emptyText}>Aucun capteur</Text>
            </View>
          }
        />
      )}

      {/* Modal ajout lecture */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>📡 Ajouter une lecture</Text>

              <Text style={styles.fieldLabel}>ID Appareil</Text>
              <TextInput style={styles.fieldInput} placeholder="ex: SENSOR-001" placeholderTextColor="#555577"
                value={formDeviceId} onChangeText={setFormDeviceId} autoCapitalize="none" />

              <Text style={styles.fieldLabel}>Nom du capteur</Text>
              <TextInput style={styles.fieldInput} placeholder="ex: Temp Salle A101" placeholderTextColor="#555577"
                value={formName} onChangeText={setFormName} />

              <Text style={styles.fieldLabel}>Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {SENSOR_TYPES.map(t => (
                  <TouchableOpacity
                    key={t} style={[styles.typeChip, formType === t && styles.typeChipActive]}
                    onPress={() => { setFormType(t); setFormUnit(UNIT_DEFAULTS[t]); }}
                  >
                    <Text style={{ fontSize: 16 }}>{SENSOR_EMOJI[t]}</Text>
                    <Text style={[styles.typeChipText, formType === t && { color: '#fff' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Valeur</Text>
              <TextInput style={styles.fieldInput} placeholder="ex: 22.5" placeholderTextColor="#555577"
                value={formValue} onChangeText={setFormValue} keyboardType="numeric" />

              <Text style={styles.fieldLabel}>Unité</Text>
              <TextInput style={styles.fieldInput} placeholder="ex: °C" placeholderTextColor="#555577"
                value={formUnit} onChangeText={setFormUnit} />

              <Text style={styles.fieldLabel}>Statut</Text>
              <View style={styles.statusRow}>
                {STATUS_LIST.map(s => (
                  <TouchableOpacity
                    key={s} style={[styles.statusChipBtn, formStatus === s && { backgroundColor: STATUS_COLOR[s] + '33', borderColor: STATUS_COLOR[s] }]}
                    onPress={() => setFormStatus(s)}
                  >
                    <Text style={[styles.statusChipBtnText, formStatus === s && { color: STATUS_COLOR[s] }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddReading}>
                  <Text style={styles.modalSaveText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  addBtn: { backgroundColor: ACCENT, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  quickStats: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 12 },
  quickStatItem: {
    flex: 1, backgroundColor: CARD, borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1,
  },
  quickStatValue: { fontSize: 24, fontWeight: '800' },
  quickStatLabel: { fontSize: 11, color: '#555577', marginTop: 2 },
  filterScroll: { paddingHorizontal: 20, marginBottom: 12 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
    backgroundColor: CARD, marginRight: 8,
  },
  filterBtnActive: { backgroundColor: ACCENT },
  filterBtnText: { color: '#555577', fontWeight: '600', fontSize: 13 },
  filterBtnTextActive: { color: '#fff' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  sensorCard: { backgroundColor: CARD, borderRadius: 14, padding: 14, marginBottom: 10 },
  sensorCardTop: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  sensorIconBg: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#ffffff08', justifyContent: 'center', alignItems: 'center',
  },
  sensorCardInfo: { flex: 1 },
  sensorCardName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  sensorCardDevice: { fontSize: 11, color: '#555577', marginTop: 2 },
  sensorCardType: { fontSize: 11, color: ACCENT, marginTop: 2, textTransform: 'capitalize' },
  sensorCardRight: { alignItems: 'flex-end' },
  sensorCardValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
  sensorCardUnit: { fontSize: 11, color: '#555577' },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusChipText: { fontSize: 10, fontWeight: '700' },
  sensorCardBottom: { borderTopWidth: 1, borderTopColor: '#ffffff08', paddingTop: 8 },
  sensorTimestamp: { fontSize: 11, color: '#555577' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#555577', fontSize: 16, fontWeight: '600', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#888AAA', marginBottom: 6 },
  fieldInput: { backgroundColor: '#0F3460', borderRadius: 10, height: 48, paddingHorizontal: 14, color: '#fff', fontSize: 14, marginBottom: 14 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#0F3460', marginRight: 8 },
  typeChipActive: { backgroundColor: ACCENT },
  typeChipText: { fontSize: 12, color: '#888AAA', fontWeight: '600' },
  statusRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statusChipBtn: { flex: 1, height: 40, borderRadius: 999, backgroundColor: '#0F3460', borderWidth: 1, borderColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  statusChipBtnText: { color: '#888AAA', fontWeight: '700', fontSize: 13 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, height: 48, borderRadius: 999, backgroundColor: '#ffffff11', justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { color: '#888AAA', fontWeight: '700' },
  modalSaveBtn: { flex: 2, height: 48, borderRadius: 999, backgroundColor: ACCENT, justifyContent: 'center', alignItems: 'center' },
  modalSaveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default SensorsManager;