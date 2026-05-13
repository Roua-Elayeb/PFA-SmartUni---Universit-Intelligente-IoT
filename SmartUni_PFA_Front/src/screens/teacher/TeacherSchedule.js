// src/screens/teacher/TeacherSchedule.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BG = '#0F2027';
const CARD = '#1A3040';
const ACCENT = '#2196F3';

const DAYS = [
  { key: 1, label: 'Lun' },
  { key: 2, label: 'Mar' },
  { key: 3, label: 'Mer' },
  { key: 4, label: 'Jeu' },
  { key: 5, label: 'Ven' },
  { key: 6, label: 'Sam' },
];

const SCHEDULE = {
  1: [
    { time: '08:00', end: '10:00', subject: 'Algorithmique', room: 'Labo Info C301', group: 'Prépa 2 — GL', type: 'cours' },
    { time: '10:15', end: '12:00', subject: 'Structures de données', room: 'Salle A101', group: 'Prépa 3 — IoT', type: 'td' },
    { time: '14:00', end: '16:00', subject: 'Projet PFA', room: 'Salle Réunion E1', group: 'Prépa 5 — AI', type: 'projet' },
  ],
  2: [
    { time: '09:00', end: '11:00', subject: 'Base de données', room: 'Labo Info C301', group: 'Licence 2', type: 'tp' },
    { time: '13:00', end: '15:00', subject: 'Algorithmique', room: 'Salle B201', group: 'Prépa 1', type: 'cours' },
  ],
  3: [
    { time: '08:00', end: '10:00', subject: 'Génie Logiciel', room: 'Salle B202', group: 'Prépa 4 — GL', type: 'cours' },
    { time: '14:30', end: '16:30', subject: 'IA & ML', room: 'Salle Conf F2', group: 'Prépa 5 — AI', type: 'td' },
  ],
  4: [
    { time: '09:00', end: '11:00', subject: 'Structures de données', room: 'Salle A101', group: 'Licence 3', type: 'cours' },
    { time: '14:00', end: '16:00', subject: 'Base de données', room: 'Labo Info C301', group: 'Prépa 2', type: 'tp' },
  ],
  5: [
    { time: '08:00', end: '10:00', subject: 'Algorithmique', room: 'Salle A102', group: 'Prépa 1', type: 'cours' },
  ],
  6: [],
};

const TYPE_CONFIG = {
  cours:  { color: '#2196F3', bg: '#2196F322', label: 'Cours' },
  tp:     { color: '#4CAF50', bg: '#4CAF5022', label: 'TP' },
  td:     { color: '#FF9800', bg: '#FF980022', label: 'TD' },
  projet: { color: '#E91E63', bg: '#E91E6322', label: 'Projet' },
};

const TeacherSchedule = () => {
  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(today >= 1 && today <= 6 ? today : 1);
  const dayCourses = SCHEDULE[selectedDay] || [];

  const totalHours = dayCourses.reduce((acc, c) => {
    const [sh, sm] = c.time.split(':').map(Number);
    const [eh, em] = c.end.split(':').map(Number);
    return acc + (eh + em / 60) - (sh + sm / 60);
  }, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Planning</Text>
        <View style={styles.headerRight}>
          <Text style={styles.hoursText}>{totalHours}h aujourd'hui</Text>
        </View>
      </View>

      {/* Sélecteur jours */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
        {DAYS.map(d => (
          <TouchableOpacity
            key={d.key}
            style={[styles.dayBtn, selectedDay === d.key && styles.dayBtnActive, d.key === today && styles.dayBtnToday]}
            onPress={() => setSelectedDay(d.key)}
          >
            <Text style={[styles.dayBtnText, selectedDay === d.key && styles.dayBtnTextActive]}>{d.label}</Text>
            {SCHEDULE[d.key]?.length > 0 && (
              <View style={[styles.dayDot, selectedDay === d.key && { backgroundColor: '#fff' }]} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {dayCourses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🎉</Text>
            <Text style={styles.emptyText}>Pas de cours ce jour</Text>
          </View>
        ) : (
          dayCourses.map((course, i) => {
            const cfg = TYPE_CONFIG[course.type] || TYPE_CONFIG.cours;
            const isNow = (() => {
              const now = new Date();
              const t = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
              return selectedDay === today && course.time <= t && course.end >= t;
            })();
            return (
              <View key={i} style={[styles.courseCard, isNow && { borderColor: cfg.color, borderWidth: 1.5 }]}>
                <View style={[styles.courseAccent, { backgroundColor: cfg.color }]} />
                <View style={styles.courseLeft}>
                  <Text style={styles.courseTime}>{course.time}</Text>
                  <View style={styles.courseTimeLine} />
                  <Text style={styles.courseTime}>{course.end}</Text>
                </View>
                <View style={styles.courseContent}>
                  {isNow && (
                    <View style={styles.nowChip}>
                      <Text style={styles.nowChipText}>EN COURS</Text>
                    </View>
                  )}
                  <Text style={styles.courseSubject}>{course.subject}</Text>
                  <Text style={styles.courseMeta}>📍 {course.room}</Text>
                  <Text style={styles.courseMeta}>👥 {course.group}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.typeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerRight: { backgroundColor: ACCENT + '22', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  hoursText: { color: ACCENT, fontSize: 12, fontWeight: '700' },
  daysScroll: { paddingHorizontal: 20, marginBottom: 16 },
  dayBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: CARD, marginRight: 10, alignItems: 'center', minWidth: 60 },
  dayBtnActive: { backgroundColor: ACCENT },
  dayBtnToday: { borderWidth: 1, borderColor: ACCENT + '66' },
  dayBtnText: { fontSize: 13, fontWeight: '700', color: '#445566' },
  dayBtnTextActive: { color: '#fff' },
  dayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: ACCENT, marginTop: 4 },
  list: { paddingHorizontal: 20 },
  courseCard: { backgroundColor: CARD, borderRadius: 14, marginBottom: 12, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: 'transparent' },
  courseAccent: { width: 4 },
  courseLeft: { alignItems: 'center', paddingVertical: 14, paddingHorizontal: 10, width: 52 },
  courseTime: { fontSize: 10, fontWeight: '700', color: '#8899AA' },
  courseTimeLine: { width: 1, flex: 1, backgroundColor: '#ffffff11', marginVertical: 4 },
  courseContent: { flex: 1, padding: 14 },
  nowChip: { backgroundColor: '#4CAF5022', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6 },
  nowChipText: { fontSize: 10, fontWeight: '800', color: '#4CAF50', letterSpacing: 1 },
  courseSubject: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 6 },
  courseMeta: { fontSize: 12, color: '#8899AA', marginBottom: 3 },
  typeBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 6 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#445566', fontSize: 16, fontWeight: '600', marginTop: 12 },
});

export default TeacherSchedule;