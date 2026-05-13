// src/navigation/index.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

import LoginScreen      from '../screens/student/LoginScreen';
import studentTabs      from './studentTabs';
import AdminTabs        from './AdminTabs';
import TeacherTabs      from './TeacherTabs';
import RoomDetailScreen from '../screens/student/RoomDetailScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EDE6FF' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : user.role === 'admin' ? (
          <Stack.Screen name="AdminMain" component={AdminTabs} />
        ) : user.role === 'teacher' ? (
          <Stack.Screen name="TeacherMain" component={TeacherTabs} />
        ) : (
          <>
            <Stack.Screen name="Main" component={StudentTabs} />
            <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;