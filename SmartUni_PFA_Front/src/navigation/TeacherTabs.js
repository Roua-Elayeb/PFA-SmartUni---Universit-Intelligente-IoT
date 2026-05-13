// src/navigation/TeacherTabs.js
import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import TeacherDashboard from '../screens/teacher/TeacherDashboard';
import TeacherSchedule  from '../screens/teacher/TeacherSchedule';
import TeacherRooms     from '../screens/teacher/TeacherRooms';
import TeacherStudents  from '../screens/teacher/TeacherStudents';
import TeacherSensors   from '../screens/teacher/TeacherSensors';
import TeacherProfile   from '../screens/teacher/TeacherProfile';
import TeacherParkingScreen from '../screens/teacher/TeacherParkingScreen';
import TeacherAlertsScreen  from '../screens/teacher/TeacherAlertsScreen';

const Tab = createBottomTabNavigator();
const TabIcon = ({ emoji, focused }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
);

const TeacherTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#0F2027',
        borderTopWidth: 0,
        paddingBottom: 8,
        paddingTop: 8,
        height: 70,
        shadowColor: '#1B6CA8',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 10,
      },
      tabBarActiveTintColor: '#2196F3',
      tabBarInactiveTintColor: '#445566',
      tabBarLabelStyle: { fontSize: 9, fontWeight: '600', marginTop: 2 },
    }}
  >
    <Tab.Screen name="TeacherDashboard" component={TeacherDashboard}
      options={{ tabBarLabel: 'Accueil', tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }} />
    <Tab.Screen name="TeacherSchedule" component={TeacherSchedule}
      options={{ tabBarLabel: 'Planning', tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} /> }} />
    <Tab.Screen name="TeacherRooms" component={TeacherRooms}
      options={{ tabBarLabel: 'Salles', tabBarIcon: ({ focused }) => <TabIcon emoji="🚪" focused={focused} /> }} />
    <Tab.Screen name="TeacherParking" component={TeacherParkingScreen}
      options={{ tabBarLabel: 'Parking', tabBarIcon: ({ focused }) => <TabIcon emoji="🅿️" focused={focused} /> }} />
    <Tab.Screen name="TeacherStudents" component={TeacherStudents}
      options={{ tabBarLabel: 'Étudiants', tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} /> }} />
    <Tab.Screen name="TeacherSensors" component={TeacherSensors}
      options={{ tabBarLabel: 'Capteurs', tabBarIcon: ({ focused }) => <TabIcon emoji="🌡️" focused={focused} /> }} />
    <Tab.Screen name="TeacherAlerts" component={TeacherAlertsScreen}
      options={{ tabBarLabel: 'Alertes', tabBarIcon: ({ focused }) => <TabIcon emoji="🔔" focused={focused} /> }} />
    <Tab.Screen name="TeacherProfile" component={TeacherProfile}
      options={{ tabBarLabel: 'Profil', tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }} />
  </Tab.Navigator>
);

export default TeacherTabs;