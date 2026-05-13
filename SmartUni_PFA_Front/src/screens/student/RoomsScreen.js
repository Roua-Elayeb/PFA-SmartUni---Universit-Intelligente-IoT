// src/screens/RoomsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { roomAPI } from '../../api';
import { colors, spacing, radius, shadow, fonts } from '../../theme';

const RoomCard = ({ room, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={() => onPress(room)} activeOpacity={0.82}>
    <View style={styles.cardLeft}>
      <Text style={styles.roomEmoji}>🚪</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.roomName}>{room.name}</Text>
        <Text style={styles.roomCapacity}>👥 {room.capacity} personnes</Text>
        {room.equipment?.length > 0 && (
          <Text style={styles.roomEquip} numberOfLines={1}>
            🔧 {room.equipment.join(', ')}
          </Text>
        )}
      </View>
    </View>
    <View style={[styles.badge, { backgroundColor: room.available ? colors.success + '22' : colors.danger + '22' }]}>
      <View style={[styles.badgeDot, { backgroundColor: room.available ? colors.success : colors.danger }]} />
      <Text style={[styles.badgeText, { color: room.available ? colors.success : colors.danger }]}>
        {room.available ? 'Libre' : 'Occupée'}
      </Text>
    </View>
  </TouchableOpacity>
);

const RoomsScreen = ({ navigation }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await roomAPI.getAll();
      setRooms(res.data.rooms || []);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger les salles.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const handleRoomPress = (room) => {
    navigation.navigate('RoomDetail', { room, onRefresh: fetchRooms });
  };

  const available = rooms.filter(r => r.available).length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Salles</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{available} disponibles</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <RoomCard room={item} onPress={handleRoomPress} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRooms(); }} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🚪</Text>
              <Text style={styles.emptyText}>Aucune salle disponible</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EDE6FF'},
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg, paddingBottom: spacing.md,
  },
  title: { fontSize: fonts.sizes.xxl, fontWeight: '800', color: colors.textPrimary },
  pill: {
    backgroundColor: colors.success + '22', borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  pillText: { color: colors.success, fontSize: fonts.sizes.sm, fontWeight: '700' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 20 },
  card: {
    backgroundColor: colors.cardBg, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', ...shadow.soft,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  roomEmoji: { fontSize: 30, marginRight: spacing.md },
  roomName: { fontSize: fonts.sizes.md, fontWeight: '700', color: colors.textPrimary },
  roomCapacity: { fontSize: fonts.sizes.sm, color: colors.textSecondary, marginTop: 2 },
  roomEquip: { fontSize: fonts.sizes.xs, color: colors.textMuted, marginTop: 2 },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  badgeDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 5 },
  badgeText: { fontSize: fonts.sizes.xs, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 52, marginBottom: spacing.md },
  emptyText: { fontSize: fonts.sizes.lg, color: colors.textSecondary, fontWeight: '600' },
});

export default RoomsScreen;