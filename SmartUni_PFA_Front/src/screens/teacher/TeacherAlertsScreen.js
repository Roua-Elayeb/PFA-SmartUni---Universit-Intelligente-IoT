// src/screens/teacher/TeacherAlertsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { alertAPI } from '../../api';

const BG = '#0F2027';
const CARD = '#1A3040';
const ACCENT = '#2196F3';

const TYPE_CONFIG = {
  urgence:   { emoji: '🔥', color: '#F44336', bg: '#F4433615', label: 'Urgence' },
  sécurité:  { emoji: '🛡️', color: '#FF9800', bg: '#FF980015', label: 'Sécurité' },
  technique: { emoji: '⚙️', color: ACCENT,    bg: ACCENT + '15', label: 'Technique' },
};

const AlertCard = ({ alert, onMarkRead }) => {
  const cfg = TYPE_CONFIG[alert.type] || TYPE_CONFIG.technique;
  const date = new Date(alert.createdAt || alert.timestamp);
  const timeStr = date.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity
      style={[styles.alertCard, !alert.isRead && styles.alertCardUnread]}
      onPress={() => !alert.isRead && onMarkRead(alert._id)}
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
          {alert.isAlarm && (
            <View style={styles.alarmBadge}>
              <Text style={styles.alarmBadgeText}>ALARME</Text>
            </View>
          )}
          {!alert.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.alertMsg} numberOfLines={2}>{alert.message}</Text>
        {alert.location && <Text style={styles.alertLocation}>📍 {alert.location}</Text>}
        <Text style={styles.alertTime}>{timeStr}</Text>
      </View>
      {!alert.isRead && (
        <TouchableOpacity style={styles.readBtn} onPress={() => onMarkRead(alert._id)}>
          <Text style={styles.readBtnText}>✓</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const TeacherAlertsScreen = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await alertAPI.getAll();
      setAlerts(res.data.alerts || []);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les alertes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleMarkRead = async (id) => {
    try {
      await alertAPI.markRead(id);
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, isRead: true } : a));
    } catch {}
  };

  const filtered = filter === 'all' ? alerts
    : filter === 'unread' ? alerts.filter(a => !a.isRead)
    : alerts.filter(a => a.type === filter);

  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        renderItem={({ item }) => <AlertCard alert={item} onMarkRead={handleMarkRead} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAlerts(); }}
            tintColor={ACCENT}
          />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Alertes</Text>
                <Text style={styles.sub}>{unreadCount} non lues</Text>
              </View>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
                <View key={type} style={[styles.statCard, { borderColor: cfg.color + '44' }]}>
                  <Text style={{ fontSize: 20 }}>{cfg.emoji}</Text>
                  <Text style={[styles.statValue, { color: cfg.color }]}>
                    {alerts.filter(a => a.type === type).length}
                  </Text>
                  <Text style={styles.statLabel}>{cfg.label}</Text>
                </View>
              ))}
            </View>

            {/* Filtres */}
            <View style={styles.filters}>
              {[
                { key: 'all', label: 'Toutes' },
                { key: 'unread', label: `Non lues (${unreadCount})` },
                { key: 'urgence', label: '🔥 Urgence' },
                { key: 'sécurité', label: '🛡️ Sécurité' },
                { key: 'technique', label: '⚙️ Technique' },
              ].map(f => (
                <TouchableOpacity key={f.key}
                  style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
                  onPress={() => setFilter(f.key)}
                >
                  <Text style={[styles.filterBtnText, filter === f.key && { color: '#fff' }]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Alertes récentes</Text>
          </>
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>🔔</Text>
              <Text style={styles.emptyText}>Aucune alerte</Text>
            </View>
          )
        }
        contentContainerStyle={styles.list}
      />
      {loading && <ActivityIndicator color={ACCENT} size="large" style={styles.loader} />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  list: { paddingHorizontal: 20, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 12, color: '#445566', marginTop: 2 },
  unreadBadge: { backgroundColor: '#F4433622', borderRadius: 999, width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F4433644' },
  unreadBadgeText: { color: '#F44336', fontSize: 14, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: CARD, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1 },
  statValue: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  statLabel: { fontSize: 10, color: '#445566', marginTop: 2 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: CARD },
  filterBtnActive: { backgroundColor: ACCENT },
  filterBtnText: { color: '#445566', fontWeight: '600', fontSize: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 12 },
  alertCard: { backgroundColor: CARD, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'center' },
  alertCardUnread: { borderLeftWidth: 3, borderLeftColor: ACCENT },
  alertIcon: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  alertContent: { flex: 1 },
  alertTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  typeBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  alarmBadge: { backgroundColor: '#F4433622', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  alarmBadgeText: { fontSize: 10, fontWeight: '800', color: '#F44336' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT },
  alertMsg: { fontSize: 13, fontWeight: '600', color: '#fff', marginBottom: 2 },
  alertLocation: { fontSize: 11, color: '#445566', marginBottom: 2 },
  alertTime: { fontSize: 11, color: '#334455' },
  readBtn: { backgroundColor: '#4CAF5022', borderRadius: 999, width: 32, height: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#4CAF5044' },
  readBtnText: { color: '#4CAF50', fontWeight: '800', fontSize: 16 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#445566', fontSize: 16, fontWeight: '600', marginTop: 12 },
  loader: { position: 'absolute', top: '50%', alignSelf: 'center' },
});

export default TeacherAlertsScreen;