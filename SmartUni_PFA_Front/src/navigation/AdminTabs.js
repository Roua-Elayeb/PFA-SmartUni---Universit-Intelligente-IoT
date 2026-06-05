// src/navigation/AdminTabs.js
import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import TeachersManager from '../screens/admin/TeachersManager';
import AdminDashboard  from '../screens/admin/AdminDashboard';
import StudentsManager from '../screens/admin/StudentsManager';
import SensorsManager  from '../screens/admin/SensorsManager';
import RoomsManager    from '../screens/admin/RoomsManager';
import ParkingManager  from '../screens/admin/ParkingManager';
import AlertsManager   from '../screens/admin/AlertsManager';
import AdminProfile    from '../screens/admin/AdminProfile';

const Tab = createBottomTabNavigator();
const TabIcon = ({ emoji, focused }) => (
  <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
);

const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#1A1A2E',
        borderTopWidth: 0,
        paddingBottom: 8,
        paddingTop: 8,
        height: 70,
      },
      tabBarActiveTintColor: '#7C5CBF',
      tabBarInactiveTintColor: '#555577',
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
    }}
  >
    <Tab.Screen name="AdminDashboard" component={AdminDashboard}
      options={{ tabBarLabel: 'Dashboard', tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} /> }} />
    <Tab.Screen name="Students" component={StudentsManager}
      options={{ tabBarLabel: 'Étudiants', tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} /> }} />
    <Tab.Screen name="Teachers" component={TeachersManager}
      options={{ tabBarLabel: 'Profs', tabBarIcon: ({ focused }) => <TabIcon emoji="👨‍🏫" focused={focused} /> }} />
    <Tab.Screen name="Sensors" component={SensorsManager}
      options={{ tabBarLabel: 'Capteurs', tabBarIcon: ({ focused }) => <TabIcon emoji="📡" focused={focused} /> }} />
    <Tab.Screen name="Rooms" component={RoomsManager}
      options={{ tabBarLabel: 'Salles', tabBarIcon: ({ focused }) => <TabIcon emoji="🚪" focused={focused} /> }} />
    <Tab.Screen name="AdminParking" component={ParkingManager}
      options={{ tabBarLabel: 'Parking', tabBarIcon: ({ focused }) => <TabIcon emoji="🅿️" focused={focused} /> }} />
    <Tab.Screen name="AdminAlerts" component={AlertsManager}
      options={{ tabBarLabel: 'Alertes', tabBarIcon: ({ focused }) => <TabIcon emoji="🚨" focused={focused} /> }} />
    <Tab.Screen name="AdminProfile" component={AdminProfile}
      options={{ tabBarLabel: 'Profil', tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} /> }} />
  </Tab.Navigator>
);

export default AdminTabs;