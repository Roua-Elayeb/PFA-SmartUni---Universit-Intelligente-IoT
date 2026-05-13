// src/screens/RoomDetailScreen.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { roomAPI } from '../../api';
import { colors, spacing, radius, shadow, fonts } from '../../theme';

const RoomDetailScreen = ({ route, navigation }) => {
  const { room, onRefresh } = route.params;
  const [loading, setLoading] = useState(false);

  // Formulaire de réservation simplifié
  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState(60);

  const hours = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
  const durations = [30, 60, 90, 120, 180];

  const handleReserve = async () => {
    Alert.alert(
      'Confirmer la réservation',
      `Salle: ${room.name}\nDate: ${date}\nDébut: ${startTime}\nDurée: ${duration} min`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réserver', style: 'default',
          onPress: async () => {
            setLoading(true);
            try {
              await roomAPI.reserve(room._id, { date, startTime, duration });
              Alert.alert('✅ Réservation confirmée', `La salle ${room.name} est réservée.`);
              onRefresh?.();
              navigation.goBack();
            } catch (err) {
              Alert.alert('Erreur', err.response?.data?.message || 'Réservation impossible.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = async () => {
    Alert.alert(
      'Annuler la réservation',
      `Voulez-vous annuler votre réservation pour ${room.name} ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Annuler la résa', style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await roomAPI.cancel(room._id);
              Alert.alert('✅ Réservation annulée');
              onRefresh?.();
              navigation.goBack();
            } catch (err) {
              Alert.alert('Erreur', err.response?.data?.message || 'Annulation impossible.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
        </View>

        {/* Room Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.roomEmoji}>🚪</Text>
          <Text style={styles.roomName}>{room.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: room.available ? colors.success + '22' : colors.danger + '22' }]}>
            <Text style={[styles.statusText, { color: room.available ? colors.success : colors.danger }]}>
              {room.available ? '✅ Disponible' : '🔴 Occupée'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoEmoji}>👥</Text>
              <Text style={styles.infoValue}>{room.capacity}</Text>
              <Text style={styles.infoLabel}>Capacité</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoEmoji}>🔧</Text>
              <Text style={styles.infoValue}>{room.equipment?.length || 0}</Text>
              <Text style={styles.infoLabel}>Équipements</Text>
            </View>
          </View>

          {room.equipment?.length > 0 && (
            <View style={styles.equipSection}>
              <Text style={styles.equipTitle}>Équipements disponibles</Text>
              <View style={styles.equipList}>
                {room.equipment.map((eq, i) => (
                  <View key={i} style={styles.equipChip}>
                    <Text style={styles.equipChipText}>{eq}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Reservation Form */}
        {room.available && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>📅 Réserver cette salle</Text>
            <Text style={styles.formDate}>Date : <Text style={styles.formDateValue}>{date}</Text></Text>

            {/* Heure */}
            <Text style={styles.fieldLabel}>Heure de début</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              {hours.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.timeChip, startTime === h && styles.timeChipActive]}
                  onPress={() => setStartTime(h)}
                >
                  <Text style={[styles.timeChipText, startTime === h && styles.timeChipTextActive]}>{h}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Durée */}
            <Text style={styles.fieldLabel}>Durée</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              {durations.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.timeChip, duration === d && styles.timeChipActive]}
                  onPress={() => setDuration(d)}
                >
                  <Text style={[styles.timeChipText, duration === d && styles.timeChipTextActive]}>
                    {d < 60 ? `${d}min` : `${d / 60}h`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.reserveBtn} onPress={handleReserve} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.reserveBtnText}>✅ Confirmer la réservation</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Cancel Button */}
        {!room.available && (
          <View style={styles.formCard}>
            <Text style={styles.occupiedMsg}>Cette salle est actuellement réservée.</Text>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.cancelBtnText}>🗑️ Annuler ma réservation</Text>}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EDE6FF' },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  backBtn: { padding: spacing.sm, alignSelf: 'flex-start' },
  backText: { color: colors.primary, fontWeight: '600', fontSize: fonts.sizes.md },
  infoCard: {
    backgroundColor: colors.cardBg, borderRadius: radius.xl,
    margin: spacing.lg, padding: spacing.xl,
    alignItems: 'center', ...shadow.soft,
  },
  roomEmoji: { fontSize: 52, marginBottom: spacing.sm },
  roomName: { fontSize: fonts.sizes.xxl, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  statusBadge: { borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 6, marginTop: spacing.sm, marginBottom: spacing.lg },
  statusText: { fontSize: fonts.sizes.sm, fontWeight: '700' },
  infoRow: { flexDirection: 'row', width: '100%', justifyContent: 'center', gap: spacing.xl },
  infoItem: { alignItems: 'center' },
  infoEmoji: { fontSize: 24, marginBottom: 4 },
  infoValue: { fontSize: fonts.sizes.xl, fontWeight: '800', color: colors.textPrimary },
  infoLabel: { fontSize: fonts.sizes.xs, color: colors.textSecondary },
  infoDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  equipSection: { width: '100%', marginTop: spacing.lg },
  equipTitle: { fontSize: fonts.sizes.sm, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.sm },
  equipList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  equipChip: {
    backgroundColor: colors.secondary + '22', borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  equipChipText: { color: colors.secondary, fontSize: fonts.sizes.xs, fontWeight: '600' },
  formCard: {
    backgroundColor: colors.cardBg, borderRadius: radius.xl,
    marginHorizontal: spacing.lg, padding: spacing.xl, ...shadow.soft,
  },
  formTitle: { fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  formDate: { fontSize: fonts.sizes.sm, color: colors.textSecondary, marginBottom: spacing.md },
  formDateValue: { color: colors.primary, fontWeight: '700' },
  fieldLabel: { fontSize: fonts.sizes.sm, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
  pickerScroll: { marginBottom: spacing.md },
  timeChip: {
    borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#F3EEFF', marginRight: spacing.sm, borderWidth: 1.5, borderColor: 'transparent',
  },
  timeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeChipText: { fontSize: fonts.sizes.sm, color: colors.textSecondary, fontWeight: '600' },
  timeChipTextActive: { color: colors.white },
  reserveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    height: 52, justifyContent: 'center', alignItems: 'center',
    marginTop: spacing.md, ...shadow.medium,
  },
  reserveBtnText: { color: colors.white, fontWeight: '700', fontSize: fonts.sizes.md },
  occupiedMsg: { fontSize: fonts.sizes.md, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  cancelBtn: {
    backgroundColor: colors.danger, borderRadius: radius.full,
    height: 52, justifyContent: 'center', alignItems: 'center',
  },
  cancelBtnText: { color: colors.white, fontWeight: '700', fontSize: fonts.sizes.md },
});

export default RoomDetailScreen;