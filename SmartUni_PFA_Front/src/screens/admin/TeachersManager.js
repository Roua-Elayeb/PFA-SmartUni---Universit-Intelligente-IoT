// src/screens/admin/TeachersManager.js
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
const TEACHER_COLOR = '#2196F3';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAYS_FULL = { Lun: 1, Mar: 2, Mer: 3, Jeu: 4, Ven: 5, Sam: 6 };

const HOURS = [
  '08:00','08:30','09:00','09:30','10:00','10:15','10:30',
  '11:00','11:30','12:00','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30','18:00',
];

const DURATIONS = [
  { label: '1h30', value: 90 },
  { label: '2h', value: 120 },
  { label: '3h', value: 180 },
];

const COURSE_TYPES = [
  { key: 'cours', label: 'Cours', color: TEACHER_COLOR },
  { key: 'tp',    label: 'TP',    color: '#4CAF50' },
  { key: 'td',    label: 'TD',    color: '#FF9800' },
  { key: 'projet',label: 'Projet',color: '#E91E63' },
];

const ROOMS_LIST = [
  'Salle A101','Salle A102','Salle B201','Salle B202',
  'Labo Info C301','Amphi D','Salle Réunion E1','Salle Conf F2',
];

const GROUPS_LIST = [
  'Licence 1','Licence 2','Licence 3',
  'Prépa 1','Prépa 2','Prépa 3',
  'Prépa 4 — IoT','Prépa 4 — AI','Prépa 4 — GL','Prépa 4 — Cloud','Prépa 4 — Cyber Security','Prépa 4 — VR Game',
  'Prépa 5 — IoT','Prépa 5 — AI','Prépa 5 — GL','Prépa 5 — Cloud','Prépa 5 — Cyber Security','Prépa 5 — VR Game',
];

const TYPE_COLOR = { cours: TEACHER_COLOR, tp: '#4CAF50', td: '#FF9800', projet: '#E91E63' };

const TeachersManager = () => {
  const [teachers, setTeachers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [teacherModalVisible, setTeacherModalVisible] = useState(false);
  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editTeacher, setEditTeacher] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Formulaire enseignant
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formSpeciality, setFormSpeciality] = useState('');

  // Formulaire cours
  const [courseDay, setCourseDay] = useState('Lun');
  const [courseTime, setCourseTime] = useState('08:00');
  const [courseDuration, setCourseDuration] = useState(90);
  const [courseSubject, setCourseSubject] = useState('');
  const [courseRoom, setCourseRoom] = useState(ROOMS_LIST[0]);
  const [courseGroup, setCourseGroup] = useState(GROUPS_LIST[0]);
  const [courseType, setCourseType] = useState('cours');

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await api.get('/auth/users');
      const list = (res.data.users || []).filter(u => u.role === 'teacher');
      setTeachers(list);
      setFiltered(list);
    } catch {
      setTeachers([]); setFiltered([]);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(teachers); return; }
    setFiltered(teachers.filter(t =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, teachers]);

  const openAddTeacher = () => {
    setEditTeacher(null);
    setFormName(''); setFormEmail(''); setFormPassword(''); setFormSpeciality('');
    setTeacherModalVisible(true);
  };

  const openEditTeacher = (teacher) => {
    setEditTeacher(teacher);
    setFormName(teacher.name);
    setFormEmail(teacher.email);
    setFormPassword('');
    setFormSpeciality(teacher.speciality || '');
    setTeacherModalVisible(true);
  };

  const handleSaveTeacher = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      Alert.alert('Erreur', 'Nom et email sont obligatoires.'); return;
    }
    try {
      if (editTeacher) {
        await api.put(`/auth/users/${editTeacher._id}`, {
          name: formName.trim(),
          email: formEmail.trim(),
          speciality: formSpeciality.trim(),
          role: 'teacher',
        });
        if (formPassword && formPassword.length >= 6) {
          await api.put(`/auth/users/${editTeacher._id}/password`, { password: formPassword });
        }
        Alert.alert('✅ Enseignant modifié');
      } else {
        if (!formPassword || formPassword.length < 6) {
          Alert.alert('Erreur', 'Mot de passe requis (6 caractères min).'); return;
        }
        await api.post('/auth/register', {
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword,
          speciality: formSpeciality.trim(),
          role: 'teacher',
        });
        Alert.alert('✅ Enseignant ajouté');
      }
      setTeacherModalVisible(false);
      fetchTeachers();
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.message || 'Opération impossible.');
    }
  };

  const handleDeleteTeacher = (teacher) => {
    Alert.alert('Supprimer', `Supprimer ${teacher.name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await api.delete(`/auth/users/${teacher._id}`); fetchTeachers(); }
        catch { Alert.alert('Erreur', 'Suppression impossible.'); }
      }},
    ]);
  };

  const handleResetPassword = (teacher) => {
    Alert.prompt('Nouveau mot de passe', `Pour ${teacher.name} :`, async (pwd) => {
      if (!pwd || pwd.length < 6) { Alert.alert('Erreur', 'Min. 6 caractères.'); return; }
      try {
        await api.put(`/auth/users/${teacher._id}/password`, { password: pwd });
        Alert.alert('✅ Mot de passe réinitialisé');
      } catch { Alert.alert('Erreur', 'Réinitialisation impossible.'); }
    });
  };

  const openAddCourse = (teacher) => {
    setSelectedTeacher(teacher);
    setCourseDay('Lun'); setCourseTime('08:00'); setCourseDuration(90);
    setCourseSubject(''); setCourseRoom(ROOMS_LIST[0]);
    setCourseGroup(GROUPS_LIST[0]); setCourseType('cours');
    setCourseModalVisible(true);
  };

  const handleSaveCourse = async () => {
    if (!courseSubject.trim()) {
      Alert.alert('Erreur', 'Le nom du cours est obligatoire.'); return;
    }
    const [sh, sm] = courseTime.split(':').map(Number);
    const endMin = sh * 60 + sm + courseDuration;
    const endH = Math.floor(endMin / 60);
    const endM = endMin % 60;
    const endTime = `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`;

    const newCourse = {
      day: DAYS_FULL[courseDay],
      dayLabel: courseDay,
      time: courseTime,
      end: endTime,
      subject: courseSubject.trim(),
      room: courseRoom,
      group: courseGroup,
      type: courseType,
      duration: courseDuration,
    };

    try {
      const currentCourses = selectedTeacher.courses || [];
      await api.put(`/auth/users/${selectedTeacher._id}`, {
        courses: [...currentCourses, newCourse],
      });
      Alert.alert('✅ Cours ajouté', `${courseSubject} — ${courseDay} ${courseTime}`);
      setCourseModalVisible(false);
      fetchTeachers();
      if (detailVisible) {
        const updated = teachers.find(t => t._id === selectedTeacher._id);
        if (updated) setSelectedTeacher({ ...updated, courses: [...(updated.courses || []), newCourse] });
      }
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.message || 'Impossible d\'ajouter le cours.');
    }
  };

  const handleDeleteCourse = async (teacher, courseIndex) => {
    Alert.alert('Supprimer ce cours ?', '', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          const newCourses = (teacher.courses || []).filter((_, i) => i !== courseIndex);
          await api.put(`/auth/users/${teacher._id}`, { courses: newCourses });
          fetchTeachers();
          setSelectedTeacher(prev => ({ ...prev, courses: newCourses }));
          Alert.alert('✅ Cours supprimé');
        } catch { Alert.alert('Erreur', 'Suppression impossible.'); }
      }},
    ]);
  };

  const openDetail = (teacher) => {
    setSelectedTeacher(teacher);
    setDetailVisible(true);
  };

  const renderTeacher = ({ item }) => (
    <TouchableOpacity style={styles.teacherCard} onPress={() => openDetail(item)} activeOpacity={0.85}>
      <View style={styles.teacherAvatar}>
        <Text style={styles.teacherAvatarText}>
          {item.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
        </Text>
      </View>
      <View style={styles.teacherInfo}>
        <Text style={styles.teacherName}>{item.name}</Text>
        <Text style={styles.teacherEmail}>{item.email}</Text>
        {item.speciality && (
          <View style={styles.specialityTag}>
            <Text style={styles.specialityTagText}>📚 {item.speciality}</Text>
          </View>
        )}
        <Text style={styles.teacherCourses}>
          {(item.courses?.length || 0)} cours assignés
        </Text>
      </View>
      <View style={styles.teacherActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openAddCourse(item)}>
          <Text style={styles.actionBtnText}>📅</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openEditTeacher(item)}>
          <Text style={styles.actionBtnText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleResetPassword(item)}>
          <Text style={styles.actionBtnText}>🔑</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F0707022' }]} onPress={() => handleDeleteTeacher(item)}>
          <Text style={styles.actionBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Enseignants</Text>
          <Text style={styles.sub}>{teachers.length} enseignants</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAddTeacher}>
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Recherche */}
      <View style={styles.searchBox}>
        <Text style={{ marginRight: 8 }}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Rechercher..." placeholderTextColor="#555577"
          value={search} onChangeText={setSearch} autoCorrect={false} />
        {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Text style={{ color: '#555577' }}>✕</Text></TouchableOpacity>}
      </View>

      {loading ? <ActivityIndicator color={ACCENT} size="large" style={{ marginTop: 60 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={i => i._id}
          renderItem={renderTeacher}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTeachers(); }} tintColor={ACCENT} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>👨‍🏫</Text>
              <Text style={styles.emptyText}>Aucun enseignant</Text>
              <Text style={styles.emptySub}>Appuyez sur + Ajouter</Text>
            </View>
          }
        />
      )}

      {/* ── Modal Ajout/Édition Enseignant ── */}
      <Modal visible={teacherModalVisible} transparent animationType="slide" onRequestClose={() => setTeacherModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {editTeacher ? '✏️ Modifier enseignant' : '👨‍🏫 Nouvel enseignant'}
              </Text>

              <Text style={styles.fieldLabel}>Nom complet</Text>
              <TextInput style={styles.fieldInput} placeholder="Dr. Prénom Nom"
                placeholderTextColor="#555577" value={formName} onChangeText={setFormName} />

              <Text style={styles.fieldLabel}>Email / CIN</Text>
              <TextInput style={styles.fieldInput} placeholder="prof@smartuni.tn"
                placeholderTextColor="#555577" value={formEmail} onChangeText={setFormEmail}
                autoCapitalize="none" keyboardType="email-address" />

              <Text style={styles.fieldLabel}>
                {editTeacher ? 'Nouveau mot de passe (laisser vide = inchangé)' : 'Mot de passe'}
              </Text>
              <TextInput style={styles.fieldInput}
                placeholder={editTeacher ? 'Laisser vide pour ne pas changer' : 'Min. 6 caractères'}
                placeholderTextColor="#555577" value={formPassword}
                onChangeText={setFormPassword} secureTextEntry />

              <Text style={styles.fieldLabel}>Spécialité / Matières principales</Text>
              <TextInput style={styles.fieldInput} placeholder="ex: Algorithmique, Base de données"
                placeholderTextColor="#555577" value={formSpeciality} onChangeText={setFormSpeciality} />

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setTeacherModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: TEACHER_COLOR }]} onPress={handleSaveTeacher}>
                  <Text style={styles.modalSaveText}>{editTeacher ? 'Modifier' : 'Ajouter'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Modal Ajout Cours ── */}
      <Modal visible={courseModalVisible} transparent animationType="slide" onRequestClose={() => setCourseModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>📅 Ajouter un cours</Text>
              {selectedTeacher && (
                <Text style={styles.modalSubtitle}>Pour : {selectedTeacher.name}</Text>
              )}

              {/* Nom du cours */}
              <Text style={styles.fieldLabel}>Nom du cours</Text>
              <TextInput style={styles.fieldInput} placeholder="ex: Algorithmique"
                placeholderTextColor="#555577" value={courseSubject} onChangeText={setCourseSubject} />

              {/* Type */}
              <Text style={styles.fieldLabel}>Type</Text>
              <View style={styles.typeRow}>
                {COURSE_TYPES.map(t => (
                  <TouchableOpacity key={t.key}
                    style={[styles.typeBtn, courseType === t.key && { backgroundColor: t.color + '33', borderColor: t.color }]}
                    onPress={() => setCourseType(t.key)}
                  >
                    <Text style={[styles.typeBtnText, courseType === t.key && { color: t.color }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Jour */}
              <Text style={styles.fieldLabel}>Jour</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {DAYS.map(d => (
                  <TouchableOpacity key={d}
                    style={[styles.chipBtn, courseDay === d && styles.chipBtnActive]}
                    onPress={() => setCourseDay(d)}
                  >
                    <Text style={[styles.chipBtnText, courseDay === d && { color: '#fff' }]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Heure */}
              <Text style={styles.fieldLabel}>Heure de début</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {HOURS.map(h => (
                  <TouchableOpacity key={h}
                    style={[styles.chipBtn, courseTime === h && styles.chipBtnActive]}
                    onPress={() => setCourseTime(h)}
                  >
                    <Text style={[styles.chipBtnText, courseTime === h && { color: '#fff' }]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Durée */}
              <Text style={styles.fieldLabel}>Durée</Text>
              <View style={styles.durationRow}>
                {DURATIONS.map(d => (
                  <TouchableOpacity key={d.value}
                    style={[styles.durationBtn, courseDuration === d.value && styles.durationBtnActive]}
                    onPress={() => setCourseDuration(d.value)}
                  >
                    <Text style={[styles.durationBtnText, courseDuration === d.value && { color: '#fff' }]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Salle */}
              <Text style={styles.fieldLabel}>Salle</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {ROOMS_LIST.map(r => (
                  <TouchableOpacity key={r}
                    style={[styles.chipBtn, courseRoom === r && styles.chipBtnActive]}
                    onPress={() => setCourseRoom(r)}
                  >
                    <Text style={[styles.chipBtnText, courseRoom === r && { color: '#fff' }]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Groupe */}
              <Text style={styles.fieldLabel}>Groupe / Classe</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {GROUPS_LIST.map(g => (
                  <TouchableOpacity key={g}
                    style={[styles.chipBtn, courseGroup === g && styles.chipBtnActive]}
                    onPress={() => setCourseGroup(g)}
                  >
                    <Text style={[styles.chipBtnText, courseGroup === g && { color: '#fff' }]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Récap */}
              <View style={styles.recapBox}>
                <Text style={styles.recapTitle}>📋 Récapitulatif</Text>
                <Text style={styles.recapText}>📚 {courseSubject || '—'}</Text>
                <Text style={styles.recapText}>📅 {courseDay} à {courseTime} ({courseDuration} min)</Text>
                <Text style={styles.recapText}>📍 {courseRoom}</Text>
                <Text style={styles.recapText}>👥 {courseGroup}</Text>
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCourseModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: TEACHER_COLOR }]} onPress={handleSaveCourse}>
                  <Text style={styles.modalSaveText}>✅ Ajouter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Modal Détail Enseignant ── */}
      <Modal visible={detailVisible} transparent animationType="slide" onRequestClose={() => setDetailVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedTeacher?.name}</Text>
                <Text style={styles.modalSubtitle}>{selectedTeacher?.email}</Text>
                {selectedTeacher?.speciality && (
                  <Text style={[styles.modalSubtitle, { color: TEACHER_COLOR }]}>📚 {selectedTeacher.speciality}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setDetailVisible(false)}>
                <Text style={{ color: '#555577', fontSize: 22 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailActions}>
              <TouchableOpacity style={[styles.detailActionBtn, { backgroundColor: TEACHER_COLOR + '22', borderColor: TEACHER_COLOR }]}
                onPress={() => { setDetailVisible(false); openAddCourse(selectedTeacher); }}>
                <Text style={[styles.detailActionText, { color: TEACHER_COLOR }]}>📅 Ajouter cours</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.detailActionBtn, { backgroundColor: ACCENT + '22', borderColor: ACCENT }]}
                onPress={() => { setDetailVisible(false); openEditTeacher(selectedTeacher); }}>
                <Text style={[styles.detailActionText, { color: ACCENT }]}>✏️ Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.detailActionBtn, { backgroundColor: '#F5C27A22', borderColor: '#F5C27A' }]}
                onPress={() => { setDetailVisible(false); handleResetPassword(selectedTeacher); }}>
                <Text style={[styles.detailActionText, { color: '#F5C27A' }]}>🔑 Mot de passe</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.detailSectionTitle}>
              📅 Planning ({selectedTeacher?.courses?.length || 0} cours)
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {(!selectedTeacher?.courses || selectedTeacher.courses.length === 0) ? (
                <View style={styles.emptyCourses}>
                  <Text style={{ fontSize: 36 }}>📅</Text>
                  <Text style={styles.emptyCoursesText}>Aucun cours assigné</Text>
                  <TouchableOpacity style={styles.addCourseBtn}
                    onPress={() => { setDetailVisible(false); openAddCourse(selectedTeacher); }}>
                    <Text style={styles.addCourseBtnText}>+ Ajouter un cours</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                [...(selectedTeacher?.courses || [])]
                  .sort((a, b) => (a.day || 0) - (b.day || 0) || a.time?.localeCompare(b.time))
                  .map((course, i) => {
                    const color = TYPE_COLOR[course.type] || TEACHER_COLOR;
                    return (
                      <View key={i} style={styles.courseItem}>
                        <View style={[styles.courseAccent, { backgroundColor: color }]} />
                        <View style={styles.courseItemContent}>
                          <View style={styles.courseItemTop}>
                            <Text style={styles.courseItemSubject}>{course.subject}</Text>
                            <View style={[styles.courseTypeBadge, { backgroundColor: color + '22' }]}>
                              <Text style={[styles.courseTypeBadgeText, { color }]}>{course.type}</Text>
                            </View>
                          </View>
                          <Text style={styles.courseItemMeta}>
                            📅 {course.dayLabel || `Jour ${course.day}`} • {course.time} — {course.end}
                          </Text>
                          <Text style={styles.courseItemMeta}>📍 {course.room}</Text>
                          <Text style={styles.courseItemMeta}>👥 {course.group}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteCourse(selectedTeacher, i)}
                          style={styles.deleteCourseBtn}>
                          <Text style={{ fontSize: 16 }}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 12, color: '#555577', marginTop: 2 },
  addBtn: { backgroundColor: TEACHER_COLOR, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 12, marginHorizontal: 20, marginBottom: 12, paddingHorizontal: 14, height: 46 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  teacherCard: { backgroundColor: CARD, borderRadius: 14, padding: 14, marginBottom: 10 },
  teacherAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: TEACHER_COLOR + '33', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  teacherAvatarText: { color: TEACHER_COLOR, fontWeight: '800', fontSize: 16 },
  teacherInfo: { marginBottom: 10 },
  teacherName: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 2 },
  teacherEmail: { fontSize: 12, color: '#8899AA', marginBottom: 4 },
  specialityTag: { backgroundColor: TEACHER_COLOR + '22', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 4 },
  specialityTagText: { color: TEACHER_COLOR, fontSize: 11, fontWeight: '600' },
  teacherCourses: { fontSize: 11, color: '#555577' },
  teacherActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { backgroundColor: '#ffffff11', borderRadius: 8, padding: 8 },
  actionBtnText: { fontSize: 16 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#555577', fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptySub: { color: '#444466', fontSize: 12, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 50 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#8899AA', marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#888AAA', marginBottom: 6 },
  fieldInput: { backgroundColor: CARD2, borderRadius: 10, height: 48, paddingHorizontal: 14, color: '#fff', fontSize: 14, marginBottom: 14 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  typeBtn: { flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor: '#ffffff11', backgroundColor: CARD2, padding: 10, alignItems: 'center' },
  typeBtnText: { fontSize: 12, color: '#888AAA', fontWeight: '700' },
  chipBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: CARD2, marginRight: 8 },
  chipBtnActive: { backgroundColor: TEACHER_COLOR },
  chipBtnText: { color: '#888AAA', fontWeight: '600', fontSize: 12 },
  durationRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  durationBtn: { flex: 1, borderRadius: 12, backgroundColor: CARD2, padding: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#ffffff11' },
  durationBtnActive: { backgroundColor: TEACHER_COLOR, borderColor: TEACHER_COLOR },
  durationBtnText: { color: '#888AAA', fontWeight: '600', fontSize: 13 },
  recapBox: { backgroundColor: CARD2, borderRadius: 12, padding: 14, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: TEACHER_COLOR },
  recapTitle: { fontSize: 12, fontWeight: '700', color: TEACHER_COLOR, marginBottom: 8 },
  recapText: { fontSize: 12, color: '#8899AA', marginBottom: 4 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, height: 48, borderRadius: 999, backgroundColor: '#ffffff11', justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { color: '#888AAA', fontWeight: '700' },
  modalSaveBtn: { flex: 2, height: 48, borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  modalSaveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  detailActions: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  detailActionBtn: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1 },
  detailActionText: { fontSize: 12, fontWeight: '700' },
  detailSectionTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 12 },
  emptyCourses: { alignItems: 'center', paddingVertical: 30 },
  emptyCoursesText: { color: '#555577', fontSize: 14, marginTop: 8 },
  addCourseBtn: { backgroundColor: TEACHER_COLOR + '22', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, marginTop: 12, borderWidth: 1, borderColor: TEACHER_COLOR },
  addCourseBtnText: { color: TEACHER_COLOR, fontWeight: '700', fontSize: 13 },
  courseItem: { backgroundColor: CARD2, borderRadius: 12, marginBottom: 10, flexDirection: 'row', overflow: 'hidden' },
  courseAccent: { width: 4 },
  courseItemContent: { flex: 1, padding: 12 },
  courseItemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  courseItemSubject: { fontSize: 13, fontWeight: '700', color: '#fff', flex: 1 },
  courseTypeBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  courseTypeBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  courseItemMeta: { fontSize: 11, color: '#8899AA', marginBottom: 2 },
  deleteCourseBtn: { padding: 12, justifyContent: 'center' },
});

export default TeachersManager;