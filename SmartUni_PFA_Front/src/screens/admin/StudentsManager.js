// src/screens/admin/StudentsManager.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl, TextInput, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api';

const ACCENT = '#7C5CBF';
const BG = '#1A1A2E';
const CARD = '#16213E';
const CARD2 = '#0F3460';

const LEVELS = {
  licence: {
    label: 'Licence', emoji: '🎓', color: '#6DC9A0',
    years: [
      { value: 'L1', label: '1ère année', specialties: null },
      { value: 'L2', label: '2ème année', specialties: null },
      { value: 'L3', label: '3ème année', specialties: null },
    ],
  },
  prepa: {
    label: 'Prépa', emoji: '📚', color: '#F5C27A',
    years: [
      { value: 'P1', label: '1ère année', specialties: null },
      { value: 'P2', label: '2ème année', specialties: null },
      { value: 'P3', label: '3ème année', specialties: null },
      { value: 'P4', label: '4ème année', specialties: ['IoT', 'AI', 'Cyber Security', 'Cloud', 'VR Game', 'GL'] },
      { value: 'P5', label: '5ème année', specialties: ['IoT', 'AI', 'Cyber Security', 'Cloud', 'VR Game', 'GL'] },
    ],
  },
};

const SPECIALTY_COLORS = {
  'IoT': '#6DC9A0', 'AI': '#B89EE8', 'Cyber Security': '#F07070',
  'Cloud': '#5BC4F5', 'VR Game': '#F5C27A', 'GL': '#E8709A',
};
const SPECIALTY_EMOJI = {
  'IoT': '📡', 'AI': '🤖', 'Cyber Security': '🛡️',
  'Cloud': '☁️', 'VR Game': '🎮', 'GL': '💻',
};
const ALL_SPECIALTIES = ['IoT', 'AI', 'Cyber Security', 'Cloud', 'VR Game', 'GL'];

const getLevelLabel = (student) => {
  if (!student.level) return null;
  for (const [, lvl] of Object.entries(LEVELS)) {
    const year = lvl.years.find(y => y.value === student.level);
    if (year) return `${lvl.label} — ${year.label}`;
  }
  return student.level;
};

const FILTER_GROUPS = [
  { key: 'all',            label: 'Tous' },
  { key: 'L',             label: '🎓 Licence' },
  { key: 'L1',            label: 'L1' },
  { key: 'L2',            label: 'L2' },
  { key: 'L3',            label: 'L3' },
  { key: 'P',             label: '📚 Prépa' },
  { key: 'P1',            label: 'P1' },
  { key: 'P2',            label: 'P2' },
  { key: 'P3',            label: 'P3' },
  { key: 'P4',            label: 'P4' },
  { key: 'P5',            label: 'P5' },
  { key: 'IoT',           label: '📡 IoT' },
  { key: 'AI',            label: '🤖 AI' },
  { key: 'Cyber Security',label: '🛡️ Cyber' },
  { key: 'Cloud',         label: '☁️ Cloud' },
  { key: 'VR Game',       label: '🎮 VR Game' },
  { key: 'GL',            label: '💻 GL' },
];

const StudentsManager = () => {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editStudent, setEditStudent] = useState(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formCycle, setFormCycle] = useState('licence');
  const [formYear, setFormYear] = useState('L1');
  const [formSpecialty, setFormSpecialty] = useState('');

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
      if (filterLevel === 'L') {
        // Tous les étudiants Licence
        result = result.filter(s => s.level?.startsWith('L'));
      } else if (filterLevel === 'P') {
        // Tous les étudiants Prépa
        result = result.filter(s => s.level?.startsWith('P'));
      } else if (ALL_SPECIALTIES.includes(filterLevel)) {
        // Filtre par spécialité
        result = result.filter(s => s.specialty === filterLevel);
      } else {
        // Filtre exact par année : L1, L2, L3, P1, P2, P3, P4, P5
        result = result.filter(s => s.level === filterLevel);
      }
    }

    if (search.trim()) {
      result = result.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFiltered(result);
  }, [filterLevel, search, students]);

  const getCurrentYearObj = () => LEVELS[formCycle]?.years.find(y => y.value === formYear);

  const handleCycleChange = (cycle) => {
    setFormCycle(cycle);
    setFormYear(LEVELS[cycle].years[0].value);
    setFormSpecialty('');
  };

  const openAddModal = () => {
    setEditStudent(null);
    setFormName(''); setFormEmail(''); setFormPassword('');
    setFormCycle('licence'); setFormYear('L1'); setFormSpecialty('');
    setModalVisible(true);
  };

  const openEditModal = (student) => {
    setEditStudent(student);
    setFormName(student.name);
    setFormEmail(student.email);
    setFormPassword('');
    const cycle = student.level?.startsWith('L') ? 'licence' : 'prepa';
    setFormCycle(cycle);
    setFormYear(student.level || LEVELS[cycle].years[0].value);
    setFormSpecialty(student.specialty || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      Alert.alert('Erreur', 'Nom et CIN/Email sont obligatoires.'); return;
    }
    const yearObj = getCurrentYearObj();
    if (yearObj?.specialties?.length > 0 && !formSpecialty) {
      Alert.alert('Erreur', 'Veuillez choisir une spécialité.'); return;
    }
    const data = {
      name: formName.trim(),
      email: formEmail.trim(),
      level: formYear,
      specialty: formSpecialty || '',
      role: 'user',
    };
    try {
      if (editStudent) {
        await api.put(`/auth/users/${editStudent._id}`, data);
        Alert.alert('✅ Étudiant modifié');
      } else {
        if (!formPassword || formPassword.length < 6) {
          Alert.alert('Erreur', 'Mot de passe requis (6 caractères min).'); return;
        }
        await api.post('/auth/register', { ...data, password: formPassword });
        Alert.alert('✅ Étudiant ajouté');
      }
      setModalVisible(false);
      fetchStudents();
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.message || 'Opération impossible.');
    }
  };

  const handleDelete = (student) => {
    Alert.alert('Supprimer', `Supprimer ${student.name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try { await api.delete(`/auth/users/${student._id}`); fetchStudents(); }
          catch { Alert.alert('Erreur', 'Suppression impossible.'); }
        },
      },
    ]);
  };

  const renderStudent = ({ item }) => {
    const lvlLabel = getLevelLabel(item);
    const spColor = item.specialty ? (SPECIALTY_COLORS[item.specialty] || ACCENT) : null;
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
            {lvlLabel && (
              <View style={[styles.tag, { backgroundColor: (isLicence ? '#6DC9A0' : '#F5C27A') + '22' }]}>
                <Text style={[styles.tagText, { color: isLicence ? '#6DC9A0' : '#F5C27A' }]}>
                  {isLicence ? '🎓' : '📚'} {lvlLabel}
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
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
            <Text style={{ fontSize: 16 }}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F0707022' }]} onPress={() => handleDelete(item)}>
            <Text style={{ fontSize: 16 }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Étudiants</Text>
          <Text style={styles.headerSub}>{filtered.length}/{students.length} affichés</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: '#6DC9A044' }]}>
          <Text style={{ fontSize: 20 }}>🎓</Text>
          <Text style={[styles.statValue, { color: '#6DC9A0' }]}>
            {students.filter(s => s.level?.startsWith('L')).length}
          </Text>
          <Text style={styles.statLabel}>Licence</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#F5C27A44' }]}>
          <Text style={{ fontSize: 20 }}>📚</Text>
          <Text style={[styles.statValue, { color: '#F5C27A' }]}>
            {students.filter(s => s.level?.startsWith('P')).length}
          </Text>
          <Text style={styles.statLabel}>Prépa</Text>
        </View>
        <View style={[styles.statCard, { borderColor: ACCENT + '44' }]}>
          <Text style={{ fontSize: 20 }}>👥</Text>
          <Text style={[styles.statValue, { color: ACCENT }]}>{students.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Recherche */}
      <View style={styles.searchBox}>
        <Text style={{ marginRight: 8 }}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom ou CIN..."
          placeholderTextColor="#555577"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: '#555577', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {FILTER_GROUPS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filterLevel === f.key && styles.filterBtnActive]}
            onPress={() => setFilterLevel(f.key)}
          >
            <Text style={[styles.filterBtnText, filterLevel === f.key && { color: '#fff' }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste */}
      {loading ? (
        <ActivityIndicator color={ACCENT} size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderStudent}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchStudents(); }}
              tintColor={ACCENT}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>👥</Text>
              <Text style={styles.emptyText}>Aucun étudiant trouvé</Text>
              <Text style={styles.emptySub}>Modifiez les filtres ou ajoutez un étudiant</Text>
            </View>
          }
        />
      )}

      {/* Modal Ajout/Édition */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {editStudent ? '✏️ Modifier étudiant' : '➕ Nouvel étudiant'}
              </Text>

              <Text style={styles.fieldLabel}>Nom complet</Text>
              <TextInput style={styles.fieldInput} placeholder="Prénom Nom"
                placeholderTextColor="#555577" value={formName} onChangeText={setFormName} />

              <Text style={styles.fieldLabel}>CIN / Email</Text>
              <TextInput style={styles.fieldInput} placeholder="12345678 ou email@uni.tn"
                placeholderTextColor="#555577" value={formEmail} onChangeText={setFormEmail}
                autoCapitalize="none" />

              {!editStudent && (
                <>
                  <Text style={styles.fieldLabel}>Mot de passe</Text>
                  <TextInput style={styles.fieldInput} placeholder="Min. 6 caractères"
                    placeholderTextColor="#555577" value={formPassword}
                    onChangeText={setFormPassword} secureTextEntry />
                </>
              )}

              {/* Cycle */}
              <Text style={styles.fieldLabel}>Cycle</Text>
              <View style={styles.cycleRow}>
                {Object.entries(LEVELS).map(([key, lvl]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.cycleBtn,
                      formCycle === key && { backgroundColor: lvl.color + '33', borderColor: lvl.color },
                    ]}
                    onPress={() => handleCycleChange(key)}
                  >
                    <Text style={{ fontSize: 22 }}>{lvl.emoji}</Text>
                    <Text style={[styles.cycleBtnText, formCycle === key && { color: lvl.color }]}>
                      {lvl.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Année */}
              <Text style={styles.fieldLabel}>Année</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {LEVELS[formCycle].years.map(year => (
                  <TouchableOpacity
                    key={year.value}
                    style={[styles.yearBtn, formYear === year.value && styles.yearBtnActive]}
                    onPress={() => { setFormYear(year.value); setFormSpecialty(''); }}
                  >
                    <Text style={[styles.yearBtnText, formYear === year.value && { color: '#fff' }]}>
                      {year.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Spécialité */}
              {getCurrentYearObj()?.specialties && (
                <>
                  <Text style={styles.fieldLabel}>Spécialité</Text>
                  <View style={styles.specialtyGrid}>
                    {getCurrentYearObj().specialties.map(sp => {
                      const color = SPECIALTY_COLORS[sp] || ACCENT;
                      return (
                        <TouchableOpacity
                          key={sp}
                          style={[
                            styles.specialtyBtn,
                            formSpecialty === sp && { backgroundColor: color + '33', borderColor: color },
                          ]}
                          onPress={() => setFormSpecialty(sp)}
                        >
                          <Text style={{ fontSize: 20 }}>{SPECIALTY_EMOJI[sp]}</Text>
                          <Text style={[styles.specialtyBtnText, formSpecialty === sp && { color }]}>
                            {sp}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave}>
                  <Text style={styles.modalSaveText}>{editStudent ? 'Modifier' : 'Ajouter'}</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: '#555577', marginTop: 2 },
  addBtn: { backgroundColor: ACCENT, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: CARD, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#555577', marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 12, marginHorizontal: 20, marginBottom: 10, paddingHorizontal: 14, height: 46 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  filterScroll: { paddingHorizontal: 20, marginBottom: 12 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: CARD, marginRight: 8 },
  filterBtnActive: { backgroundColor: ACCENT },
  filterBtnText: { color: '#555577', fontWeight: '600', fontSize: 12 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  studentCard: { backgroundColor: CARD, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  studentAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: ACCENT + '44', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  studentAvatarText: { color: ACCENT, fontWeight: '800', fontSize: 14 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  studentCin: { fontSize: 12, color: '#888AAA', marginBottom: 6 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 6, flexShrink: 0 },
  actionBtn: { backgroundColor: '#ffffff11', borderRadius: 8, padding: 8 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#555577', fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptySub: { color: '#444466', fontSize: 12, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 50 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#888AAA', marginBottom: 6 },
  fieldInput: { backgroundColor: CARD2, borderRadius: 10, height: 48, paddingHorizontal: 14, color: '#fff', fontSize: 14, marginBottom: 14 },
  cycleRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  cycleBtn: { flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: '#ffffff11', backgroundColor: CARD2, padding: 12, alignItems: 'center', gap: 6 },
  cycleBtnText: { fontSize: 13, color: '#888AAA', fontWeight: '700' },
  yearBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: CARD2, marginRight: 8 },
  yearBtnActive: { backgroundColor: ACCENT },
  yearBtnText: { color: '#888AAA', fontWeight: '600', fontSize: 13 },
  specialtyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  specialtyBtn: { width: '30%', borderRadius: 14, borderWidth: 1.5, borderColor: '#ffffff11', backgroundColor: CARD2, padding: 10, alignItems: 'center', gap: 4 },
  specialtyBtnText: { fontSize: 11, color: '#888AAA', fontWeight: '600', textAlign: 'center' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, height: 48, borderRadius: 999, backgroundColor: '#ffffff11', justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { color: '#888AAA', fontWeight: '700' },
  modalSaveBtn: { flex: 2, height: 48, borderRadius: 999, backgroundColor: ACCENT, justifyContent: 'center', alignItems: 'center' },
  modalSaveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default StudentsManager;