// src/screens/admin/AlertsManager.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl, TextInput, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { alertAPI } from '../../api';

const ACCENT = '#7C5CBF';
const BG = '#1A1A2E';
const CARD = '#16213E';

const TYPE_CONFIG = {
  urgence:   { emoji: '🔥', color: '#F07070', bg: '#F0707022', label: 'Urgence' },
  sécurité:  { emoji: '🛡️', color: '#F5C27A', bg: '#F5C27A22', label: 'Sécurité' },
  technique: { emoji: '⚙️', color: ACCENT,    bg: ACCENT + '22', label: 'Technique' },
};

const AlertsManager = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);

  // Formulaire
  const [formType, setFormType] = useState('urgence');
  const [formMessage, setFormMessage] = useState('');
  const [formLocation, setFormLocation] = useState('');

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await alertAPI.getAll();
      setAlerts(res.data.alerts || []);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger les alertes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const filtered = filter === 'all' ? alerts
    : filter === 'unread' ? alerts.filter(a => !a.isRead)
    : alerts.filter(a => a.type === filter);

  const handleCreateAlert = async () => {
    if (!formMessage.trim()) {
      Alert.alert('Erreur', 'Le message est obligatoire.');
      return;
    }
    try {
      await alertAPI.create({ type: formType, message: formMessage.trim(), location: formLocation.trim() });
      Alert.alert('✅ Alerte créée');
      setModalVisible(false);
      setFormMessage(''); setFormLocation('');
      fetchAlerts();
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.message || 'Impossible de créer.');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await alertAPI.markRead(id);
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, isRead: true } : a));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    const unread = alerts.filter(a => !a.isRead);
    if (unread.length === 0) { Alert.alert('Info', 'Toutes les alertes sont déjà lues.'); return; }
    try {
      await Promise.all(unread.map(a => alertAPI.markRead(a._id)));
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
      Alert.alert('✅ Toutes marquées comme lues');
    } catch {}
  };

  const handleTriggerAlarm = () => {
    Alert.alert('🚨 ALARME GÉNÉRALE', 'Déclencher une alarme pour TOUT le campus ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: '🚨 DÉCLENCHER', style: 'destructive',
        onPress: async () => {
          try {
            await alertAPI.triggerAlarm('🚨 ALARME GÉNÉRALE — Déclenchée par l\'administration');
            fetchAlerts();
            Alert.alert('✅ Alarme déclenchée', 'Tous les utilisateurs notifiés.');
          } catch (e) {
            Alert.alert('Erreur', 'Impossible de déclencher.');
          }
        },
      },
    ]);
  };

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const renderAlert = ({ item }) => {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.technique;
    return (
      <TouchableOpacity
        style={[styles.alertCard, !item.isRead && styles.alertCardUnread]}
        onPress={() => !item.isRead && handleMarkRead(item._id)}
        activeOpacity={0.85}
      >
        <View style={[styles.alertIcon, { backgroundColor: cfg.bg }]}>
          <Text style={{ fontSize: 22 }}>{cfg.emoji}</Text>
        </View>
        <View style={styles.alertContent}>
          <View style={styles.alertTop}>
            <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.typeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            {item.isAlarm && (
              <View style={styles.alarmBadge}>
                <Text style={styles.alarmBadgeText}>ALARME</Text>
              </View>
            )}
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.alertMsg} numberOfLines={2}>{item.message}</Text>
          {item.location && <Text style={styles.alertLocation}>📍 {item.location}</Text>}
          <Text style={styles.alertTime}>
            {new Date(item.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {!item.isRead && (
          <TouchableOpacity style={styles.readBtn} onPress={() => handleMarkRead(item._id)}>
            <Text style={styles.readBtnText}>✓</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Alertes</Text>
          <Text style={styles.headerSub}>{unreadCount} non lues</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Créer</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
          <View key={type} style={[styles.statItem, { borderColor: cfg.color + '44' }]}>
            <Text style={{ fontSize: 20 }}>{cfg.emoji}</Text>
            <Text style={[styles.statValue, { color: cfg.color }]}>
              {alerts.filter(a => a.type === type).length}
            </Text>
            <Text style={styles.statLabel}>{cfg.label}</Text>
          </View>
        ))}
      </View>

      {/* Boutons actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.alarmBtn} onPress={handleTriggerAlarm}>
          <Text style={styles.alarmBtnText}>🚨 Alarme générale</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.readAllBtn} onPress={handleMarkAllRead}>
          <Text style={styles.readAllBtnText}>✓ Tout lire</Text>
        </TouchableOpacity>
      </View>

      {/* Filtres */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {[
          { key: 'all', label: 'Toutes' },
          { key: 'unread', label: `Non lues (${unreadCount})` },
          { key: 'urgence', label: '🔥 Urgence' },
          { key: 'sécurité', label: '🛡️ Sécurité' },
          { key: 'technique', label: '⚙️ Technique' },
        ].map(f => (
          <TouchableOpacity key={f.key} style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]} onPress={() => setFilter(f.key)}>
            <Text style={[styles.filterBtnText, filter === f.key && { color: '#fff' }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={ACCENT} size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderAlert}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} tintColor={ACCENT} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>🔔</Text>
              <Text style={styles.emptyText}>Aucune alerte</Text>
            </View>
          }
        />
      )}

      {/* Modal créer alerte */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🔔 Créer une alerte</Text>

            <Text style={styles.fieldLabel}>Type d'alerte</Text>
            <View style={styles.typeRow}>
              {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeBtn, formType === type && { backgroundColor: cfg.bg, borderColor: cfg.color }]}
                  onPress={() => setFormType(type)}
                >
                  <Text style={{ fontSize: 18 }}>{cfg.emoji}</Text>
                  <Text style={[styles.typeBtnText, formType === type && { color: cfg.color }]}>{cfg.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput
              style={[styles.fieldInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
              placeholder="Description de l'alerte..." placeholderTextColor="#555577"
              value={formMessage} onChangeText={setFormMessage} multiline
            />

            <Text style={styles.fieldLabel}>Localisation (optionnel)</Text>
            <TextInput style={styles.fieldInput} placeholder="ex: Bâtiment A, Salle 101" placeholderTextColor="#555577"
              value={formLocation} onChangeText={setFormLocation} />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCreateAlert}>
                <Text style={styles.modalSaveText}>Créer</Text>
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
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: '#555577', marginTop: 2 },
  addBtn: { backgroundColor: ACCENT, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 12 },
  statItem: { flex: 1, backgroundColor: CARD, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1 },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  statLabel: { fontSize: 10, color: '#555577', marginTop: 2 },
  actionsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 12 },
  alarmBtn: {
    flex: 2, backgroundColor: '#F0707022', borderRadius: 999, height: 44,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F07070',
  },
  alarmBtnText: { color: '#F07070', fontWeight: '800', fontSize: 13 },
  readAllBtn: {
    flex: 1, backgroundColor: '#6DC9A022', borderRadius: 999, height: 44,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#6DC9A0',
  },
  readAllBtnText: { color: '#6DC9A0', fontWeight: '700', fontSize: 13 },
  filterScroll: { paddingHorizontal: 20, marginBottom: 12 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: CARD, marginRight: 8 },
  filterBtnActive: { backgroundColor: ACCENT },
  filterBtnText: { color: '#555577', fontWeight: '600', fontSize: 12 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  alertCard: {
    backgroundColor: CARD, borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: 'row', gap: 12, alignItems: 'center',
  },
  alertCardUnread: { borderLeftWidth: 3, borderLeftColor: ACCENT },
  alertIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  alertContent: { flex: 1 },
  alertTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  typeBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  alarmBadge: { backgroundColor: '#F0707033', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  alarmBadgeText: { fontSize: 10, fontWeight: '800', color: '#F07070' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT },
  alertMsg: { fontSize: 13, fontWeight: '600', color: '#fff', marginBottom: 2 },
  alertLocation: { fontSize: 11, color: '#555577', marginBottom: 2 },
  alertTime: { fontSize: 11, color: '#444466' },
  readBtn: { backgroundColor: '#6DC9A022', borderRadius: 999, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  readBtnText: { color: '#6DC9A0', fontWeight: '800', fontSize: 16 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#555577', fontSize: 16, fontWeight: '600', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#888AAA', marginBottom: 6 },
  fieldInput: { backgroundColor: '#0F3460', borderRadius: 10, height: 48, paddingHorizontal: 14, color: '#fff', fontSize: 14, marginBottom: 14 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  typeBtn: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#ffffff11', backgroundColor: '#0F3460', padding: 10, alignItems: 'center', gap: 4 },
  typeBtnText: { fontSize: 11, color: '#888AAA', fontWeight: '600' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, height: 48, borderRadius: 999, backgroundColor: '#ffffff11', justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { color: '#888AAA', fontWeight: '700' },
  modalSaveBtn: { flex: 2, height: 48, borderRadius: 999, backgroundColor: ACCENT, justifyContent: 'center', alignItems: 'center' },
  modalSaveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default AlertsManager;