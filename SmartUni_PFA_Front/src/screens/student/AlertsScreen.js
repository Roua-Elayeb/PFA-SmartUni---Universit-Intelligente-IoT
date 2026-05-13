// src/screens/AlertsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { alertAPI } from '../../api';
import { colors, spacing, radius, shadow, fonts } from '../../theme';

const TYPE_CONFIG = {
  urgence:   { emoji: '🔥', color: colors.danger,    bg: colors.danger + '15'    },
  sécurité:  { emoji: '🛡️', color: colors.warning,   bg: colors.warning + '15'   },
  technique: { emoji: '⚙️', color: colors.secondary, bg: colors.secondary + '15' },
};

const AlertCard = ({ alert, onMarkRead }) => {
  const cfg = TYPE_CONFIG[alert.type] || { emoji: '🔔', color: colors.primary, bg: colors.primary + '15' };
  const date = new Date(alert.createdAt || alert.timestamp);
  const timeStr = date.toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

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
        <View style={styles.alertRow}>
          <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.typeText, { color: cfg.color }]}>{alert.type}</Text>
          </View>
          {!alert.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.alertMessage} numberOfLines={2}>{alert.message}</Text>
        {alert.location && <Text style={styles.alertLocation}>📍 {alert.location}</Text>}
        <Text style={styles.alertTime}>{timeStr}</Text>
      </View>
    </TouchableOpacity>
  );
};

const AlertsScreen = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await alertAPI.getAll();
      setAlerts(res.data.alerts || []);
    } catch (err) {
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

  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <AlertCard alert={item} onMarkRead={handleMarkRead} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAlerts(); }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Alertes</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount} non lues</Text>
                </View>
              )}
            </View>
            <Text style={styles.sectionTitle}>Alertes récentes</Text>
          </>
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={styles.emptyText}>Aucune alerte pour l'instant</Text>
            </View>
          )
        }
        contentContainerStyle={styles.list}
      />
      {loading && (
        <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EDE6FF' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 30 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: spacing.lg, marginBottom: spacing.md,
  },
  title: { fontSize: fonts.sizes.xxl, fontWeight: '800', color: colors.textPrimary },
  unreadBadge: {
    backgroundColor: colors.danger + '22', borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  unreadBadgeText: { color: colors.danger, fontSize: fonts.sizes.sm, fontWeight: '700' },
  sectionTitle: {
    fontSize: fonts.sizes.lg, fontWeight: '700',
    color: colors.textPrimary, marginBottom: spacing.md,
  },
  alertCard: {
    backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    flexDirection: 'row', gap: spacing.md,
    shadowColor: '#B89EE8', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  alertCardUnread: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  alertIcon: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  alertContent: { flex: 1 },
  alertRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  typeBadge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  typeText: { fontSize: fonts.sizes.xs, fontWeight: '700', textTransform: 'capitalize' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  alertMessage: { fontSize: fonts.sizes.sm, color: colors.textPrimary, fontWeight: '500', marginBottom: 2 },
  alertLocation: { fontSize: fonts.sizes.xs, color: colors.textSecondary, marginBottom: 2 },
  alertTime: { fontSize: fonts.sizes.xs, color: colors.textMuted },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyEmoji: { fontSize: 52, marginBottom: spacing.md },
  emptyText: { fontSize: fonts.sizes.lg, color: colors.textSecondary, fontWeight: '600' },
  loader: { position: 'absolute', top: '50%', alignSelf: 'center' },
});

export default AlertsScreen;