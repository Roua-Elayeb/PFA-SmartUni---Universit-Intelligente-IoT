// src/navigation/StudentTabs.js
import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';

import DashboardScreen    from '../screens/student/DashboardScreen';
import RoomsScreen        from '../screens/student/RoomsScreen';
import ParkingScreen      from '../screens/student/ParkingScreen';
import ReadingRoomsScreen from '../screens/student/ReadingRoomsScreen';
import AlertsScreen       from '../screens/student/AlertsScreen';
import ProfileScreen      from '../screens/student/ProfileScreen';

const Tab = createBottomTabNavigator();
const TabIcon = ({ emoji, focused }) => (
  <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
);

const StudentTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopWidth: 0,
        paddingBottom: 8,
        paddingTop: 8,
        height: 70,
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.tabInactive,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
    }}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen}
      options={{ tabBarLabel: 'Accueil', tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }} />
    <Tab.Screen name="Rooms" component={RoomsScreen}
      options={{ tabBarLabel: 'Salles', tabBarIcon: ({ focused }) => <TabIcon emoji="🚪" focused={focused} /> }} />
    <Tab.Screen name="Parking" component={ParkingScreen}
      options={{ tabBarLabel: 'Parking', tabBarIcon: ({ focused }) => <TabIcon emoji="🅿️" focused={focused} /> }} />
    <Tab.Screen name="ReadingRooms" component={ReadingRoomsScreen}
      options={{ tabBarLabel: 'Lecture', tabBarIcon: ({ focused }) => <TabIcon emoji="📚" focused={focused} /> }} />
    <Tab.Screen name="Alerts" component={AlertsScreen}
      options={{ tabBarLabel: 'Alertes', tabBarIcon: ({ focused }) => <TabIcon emoji="🔔" focused={focused} /> }} />
    <Tab.Screen name="Profile" component={ProfileScreen}
      options={{ tabBarLabel: 'Profil', tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }} />
  </Tab.Navigator>
);

export default StudentTabs;