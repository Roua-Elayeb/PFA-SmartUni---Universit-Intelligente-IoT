// src/screens/teacher/TeacherStudents.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api';

const BG = '#0F2027';
const CARD = '#1A3040';
const ACCENT = '#2196F3';

const SPECIALTY_COLORS = {
  'IoT': '#4CAF50', 'AI': '#9C27B0', 'Cyber Security': '#F44336',
  'Cloud': '#2196F3', 'VR Game': '#FF9800', 'GL': '#E91E63',
};

const SPECIALTY_EMOJI = {
  'IoT': '📡', 'AI': '🤖', 'Cyber Security': '🛡️',
  'Cloud': '☁️', 'VR Game': '🎮', 'GL': '💻',
};

const FILTERS = [
  { key: 'all', label: 'Tous' },
  { key: 'L', label: '🎓 Licence' },
  { key: 'L1', label: 'L1' }, { key: 'L2', label: 'L2' }, { key: 'L3', label: 'L3' },
  { key: 'P', label: '📚 Prépa' },
  { key: 'P1', label: 'P1' }, { key: 'P2', label: 'P2' }, { key: 'P3', label: 'P3' },
  { key: 'P4', label: 'P4' }, { key: 'P5', label: 'P5' },
  { key: 'IoT', label: '📡 IoT' }, { key: 'AI', label: '🤖 AI' },
  { key: 'Cyber Security', label: '🛡️ Cyber' }, { key: 'Cloud', label: '☁️ Cloud' },
  { key: 'VR Game', label: '🎮 VR' }, { key: 'GL', label: '💻 GL' },
];

const ALL_SPECIALTIES = ['IoT', 'AI', 'Cyber Security', 'Cloud', 'VR Game', 'GL'];

const getLevelLabel = (level) => {
  const map = { L1:'Licence 1', L2:'Licence 2', L3:'Licence 3', P1:'Prépa 1', P2:'Prépa 2', P3:'Prépa 3', P4:'Prépa 4', P5:'Prépa 5' };
  return map[level] || level || '—';
};

const TeacherStudents = () => {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  const fetchStudents = useCallback(async () => {
    try {
      const res = await api.get('/auth/users');
      const users = (res.data.users || []).filter(u => u.role === 'user');
      setStudents(users);
      setFiltered(users);
    } catch {
      setStudents([]); setFiltered([]);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    let result = students;
    if (filterLevel !== 'all') {
      if (filterLevel === 'L') result = result.filter(s => s.level?.startsWith('L'));
      else if (filterLevel === 'P') result = result.filter(s => s.level?.startsWith('P'));
      else if (ALL_SPECIALTIES.includes(filterLevel)) result = result.filter(s => s.specialty === filterLevel);
      else result = result.filter(s => s.level === filterLevel);
    }
    if (search.trim()) {
      result = result.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
  }, [filterLevel, search, students]);

  const renderStudent = ({ item }) => {
    const spColor = item.specialty ? (SPECIALTY_COLORS[item.specialty] || ACCENT) : ACCENT;
    const spEmoji = item.specialty ? (SPECIALTY_EMOJI[item.specialty] || '📌') : null;
    const isLicence = item.level?.startsWith('L');

    return (
      <View style={styles.studentCard}>
        <View style={styles.studentAvatar}>
          <Text style={styles.studentAvatarText}>
            {item.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
          </Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentCin}>{item.email}</Text>
          <View style={styles.tagsRow}>
            {item.level && (
              <View style={[styles.tag, { backgroundColor: (isLicence ? '#4CAF50' : '#FF9800') + '22' }]}>
                <Text style={[styles.tagText, { color: isLicence ? '#4CAF50' : '#FF9800' }]}>
                  {isLicence ? '🎓' : '📚'} {getLevelLabel(item.level)}
                </Text>
              </View>
            )}
            {item.specialty && (
              <View style={[styles.tag, { backgroundColor: spColor + '22' }]}>
                <Text style={[styles.tagText, { color: spColor }]}>{spEmoji} {item.specialty}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mes étudiants</Text>
          <Text style={styles.sub}>{filtered.length}/{students.length} affichés</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.miniStat, { borderColor: '#4CAF5044' }]}>
            <Text style={[styles.miniStatVal, { color: '#4CAF50' }]}>{students.filter(s => s.level?.startsWith('L')).length}</Text>
            <Text style={styles.miniStatLabel}>Licence</Text>
          </View>
          <View style={[styles.miniStat, { borderColor: '#FF980044' }]}>
            <Text style={[styles.miniStatVal, { color: '#FF9800' }]}>{students.filter(s => s.level?.startsWith('P')).length}</Text>
            <Text style={styles.miniStatLabel}>Prépa</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Text style={{ marginRight: 8, fontSize: 16 }}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Rechercher..." placeholderTextColor="#445566"
          value={search} onChangeText={setSearch} autoCorrect={false} />
        {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Text style={{ color: '#445566' }}>✕</Text></TouchableOpacity>}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.key} style={[styles.filterBtn, filterLevel === f.key && styles.filterBtnActive]} onPress={() => setFilterLevel(f.key)}>
            <Text style={[styles.filterBtnText, filterLevel === f.key && { color: '#fff' }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? <ActivityIndicator color={ACCENT} size="large" style={{ marginTop: 60 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderStudent}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStudents(); }} tintColor={ACCENT} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>👥</Text>
              <Text style={styles.emptyText}>Aucun étudiant trouvé</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 12, color: '#445566', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8 },
  miniStat: { backgroundColor: CARD, borderRadius: 10, padding: 8, alignItems: 'center', borderWidth: 1, minWidth: 52 },
  miniStatVal: { fontSize: 16, fontWeight: '800' },
  miniStatLabel: { fontSize: 9, color: '#445566', marginTop: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 12, marginHorizontal: 20, marginBottom: 10, paddingHorizontal: 14, height: 46 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  filterScroll: { paddingHorizontal: 20, marginBottom: 12 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: CARD, marginRight: 8 },
  filterBtnActive: { backgroundColor: ACCENT },
  filterBtnText: { color: '#445566', fontWeight: '600', fontSize: 12 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  studentCard: { backgroundColor: CARD, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  studentAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: ACCENT + '33', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  studentAvatarText: { color: ACCENT, fontWeight: '800', fontSize: 14 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  studentCin: { fontSize: 12, color: '#8899AA', marginBottom: 6 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#445566', fontSize: 16, fontWeight: '600', marginTop: 12 },
});

export default TeacherStudents;