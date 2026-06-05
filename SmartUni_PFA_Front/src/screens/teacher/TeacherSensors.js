// ============================================================
//  SmartUni — TeacherSensors_MQTT.js
//  Remplace src/screens/teacher/TeacherSensors.js
//  Utilise useMQTT() pour les mises à jour en temps réel
// ============================================================

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, RefreshControl, StyleSheet,
  ActivityIndicator, Animated, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMQTT } from '../../hooks/useMQTT';

const BG     = '#0F2027';
const CARD   = '#1A3040';
const ACCENT = '#2196F3';

const STATUS_COLOR = { normal: '#4CAF50', warning: '#FF9800', critical: '#F44336' };
const STATUS_BG    = { normal: '#4CAF5022', warning: '#FF980022', critical: '#F4433622' };
const SENSOR_EMOJI = { temperature:'🌡️', humidity:'💧', co2:'🌿', airQuality:'💨', pressure:'📊', noise:'🔊' };
const SENSOR_UNITS = { temperature:'°C', humidity:'%', co2:'ppm', airQuality:'AQI', pressure:'hPa', noise:'dB' };

const getBarWidth = (sensor) => {
  const maxValues = { temperature:40, humidity:100, co2:2000, airQuality:200, pressure:1050, noise:100 };
  const max = maxValues[sensor.type] || 100;
  return Math.min((sensor.value / max) * 100, 100);
};

const TeacherSensors = () => {
  const { sensors, isConnected, lastUpdate } = useMQTT();
  const [filter, setFilter]     = useState('all');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const filtered = filter === 'all'
    ? sensors
    : sensors.filter(s => s.status === filter || s.type === filter);

  const criticalCount = sensors.filter(s => s.status === 'critical').length;
  const warningCount  = sensors.filter(s => s.status === 'warning').length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Environnement</Text>
            <View style={styles.liveRow}>
              <Animated.View style={[styles.liveDot, {
                opacity: pulseAnim,
                backgroundColor: isConnected ? '#4CAF50' : '#F44336',
              }]} />
              <Text style={styles.liveText}>
                {isConnected
                  ? `MQTT Live — ${lastUpdate ? lastUpdate.toLocaleTimeString('fr-FR') : '...'}`
                  : 'MQTT déconnecté'}
              </Text>
            </View>
          </View>
        </View>

        {/* Alertes */}
        {criticalCount > 0 && (
          <View style={[styles.alertBanner, { borderLeftColor: '#F44336', backgroundColor: '#F4433622' }]}>
            <Text style={[styles.alertBannerText, { color: '#F44336' }]}>
              🚨 {criticalCount} capteur(s) critique(s) via MQTT
            </Text>
          </View>
        )}
        {warningCount > 0 && criticalCount === 0 && (
          <View style={[styles.alertBanner, { borderLeftColor: '#FF9800', backgroundColor: '#FF980022' }]}>
            <Text style={[styles.alertBannerText, { color: '#FF9800' }]}>
              ⚠️ {warningCount} capteur(s) en attention
            </Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Normaux',  count: sensors.filter(s=>s.status==='normal').length,   color: '#4CAF50' },
            { label: 'Attention',count: warningCount,  color: '#FF9800' },
            { label: 'Critiques',count: criticalCount, color: '#F44336' },
            { label: 'Total',    count: sensors.length, color: ACCENT },
          ].map(({ label, count, color }) => (
            <View key={label} style={[styles.statCard, { borderColor: color + '44' }]}>
              <Text style={[styles.statValue, { color }]}>{count}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Filtres */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {[
            { key:'all',label:'Tous' }, { key:'normal',label:'✅ Normal' },
            { key:'warning',label:'⚠️ Attention' }, { key:'critical',label:'🚨 Critique' },
            { key:'temperature',label:'🌡️ Temp' }, { key:'humidity',label:'💧 Humidité' },
            { key:'co2',label:'🌿 CO₂' }, { key:'noise',label:'🔊 Bruit' },
          ].map(f => (
            <TouchableOpacity key={f.key} style={[styles.filterBtn, filter===f.key && styles.filterBtnActive]} onPress={() => setFilter(f.key)}>
              <Text style={[styles.filterBtnText, filter===f.key && { color:'#fff' }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Liste capteurs */}
        {sensors.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📡</Text>
            <Text style={styles.emptyText}>En attente MQTT...</Text>
          </View>
        ) : (
          <View style={styles.sensorsList}>
            {filtered.map(sensor => {
              const sc = STATUS_COLOR[sensor.status] || STATUS_COLOR.normal;
              const sb = STATUS_BG[sensor.status]    || STATUS_BG.normal;
              return (
                <View key={sensor._id || sensor.deviceId} style={styles.sensorCard}>
                  <View style={styles.sensorTop}>
                    <View style={[styles.sensorIconBg, { backgroundColor: sb }]}>
                      <Text style={{ fontSize: 24 }}>{SENSOR_EMOJI[sensor.type] || '📡'}</Text>
                    </View>
                    <View style={styles.sensorInfo}>
                      <Text style={styles.sensorName}>{sensor.name}</Text>
                      <Text style={styles.sensorDevice}>ID: {sensor.deviceId}</Text>
                      <Text style={[styles.sensorType, { color: ACCENT }]}>{sensor.type}</Text>
                    </View>
                    <View style={styles.sensorRight}>
                      <Text style={[styles.sensorValue, { color: sc }]}>
                        {typeof sensor.value === 'number' ? sensor.value.toFixed(1) : sensor.value}
                      </Text>
                      <Text style={styles.sensorUnit}>{sensor.unit || SENSOR_UNITS[sensor.type]}</Text>
                      <View style={[styles.statusChip, { backgroundColor: sb }]}>
                        <View style={[styles.statusDot, { backgroundColor: sc }]} />
                        <Text style={[styles.statusText, { color: sc }]}>{sensor.status}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${getBarWidth(sensor)}%`, backgroundColor: sc }]} />
                  </View>
                  <Text style={styles.timestamp}>
                    ⚡ MQTT live
                  </Text>
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor: BG },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', paddingHorizontal:20, paddingTop:20, paddingBottom:12 },
  title:  { fontSize:24, fontWeight:'800', color:'#fff' },
  liveRow: { flexDirection:'row', alignItems:'center', gap:6, marginTop:4 },
  liveDot: { width:8, height:8, borderRadius:4 },
  liveText: { fontSize:11, color:'#445566' },
  alertBanner: { borderRadius:12, marginHorizontal:20, marginBottom:12, padding:12, borderLeftWidth:4 },
  alertBannerText: { fontWeight:'700', fontSize:13 },
  statsRow: { flexDirection:'row', paddingHorizontal:20, gap:8, marginBottom:12 },
  statCard: { flex:1, backgroundColor:CARD, borderRadius:12, padding:10, alignItems:'center', borderWidth:1 },
  statValue: { fontSize:20, fontWeight:'800' },
  statLabel: { fontSize:10, color:'#445566', marginTop:2 },
  filterScroll: { paddingHorizontal:20, marginBottom:12 },
  filterBtn: { paddingHorizontal:14, paddingVertical:8, borderRadius:999, backgroundColor:CARD, marginRight:8 },
  filterBtnActive: { backgroundColor:ACCENT },
  filterBtnText: { color:'#445566', fontWeight:'600', fontSize:12 },
  sensorsList: { paddingHorizontal:20 },
  sensorCard: { backgroundColor:CARD, borderRadius:14, padding:14, marginBottom:10 },
  sensorTop: { flexDirection:'row', gap:12, marginBottom:10 },
  sensorIconBg: { width:48, height:48, borderRadius:14, justifyContent:'center', alignItems:'center' },
  sensorInfo: { flex:1 },
  sensorName: { fontSize:13, fontWeight:'700', color:'#fff' },
  sensorDevice: { fontSize:11, color:'#445566', marginTop:2 },
  sensorType: { fontSize:11, marginTop:2, textTransform:'capitalize' },
  sensorRight: { alignItems:'flex-end' },
  sensorValue: { fontSize:22, fontWeight:'800' },
  sensorUnit: { fontSize:11, color:'#445566' },
  statusChip: { flexDirection:'row', alignItems:'center', gap:4, borderRadius:999, paddingHorizontal:8, paddingVertical:3, marginTop:4 },
  statusDot: { width:6, height:6, borderRadius:3 },
  statusText: { fontSize:10, fontWeight:'700' },
  barBg: { height:4, backgroundColor:'#ffffff11', borderRadius:2, overflow:'hidden', marginBottom:6 },
  barFill: { height:'100%', borderRadius:2 },
  timestamp: { fontSize:11, color:'#6DC9A0' },
  empty: { alignItems:'center', paddingTop:80 },
  emptyText: { color:'#445566', fontSize:16, fontWeight:'600', marginTop:12 },
});

export default TeacherSensors;