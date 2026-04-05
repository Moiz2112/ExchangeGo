import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [view, setView]         = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading]   = useState(false);
  const [siUser, setSiUser]     = useState('');
  const [siPass, setSiPass]     = useState('');
  const [suEmail, setSuEmail]   = useState('');
  const [suUser, setSuUser]     = useState('');
  const [suPass, setSuPass]     = useState('');

  const handleLogin = async () => {
    if (!siUser || !siPass) { Alert.alert('Error', 'Fill in all fields'); return; }
    setLoading(true);
    const res = await login(siUser, siPass);
    setLoading(false);
    if (!res.ok) Alert.alert('Login Failed', res.error);
  };

  const handleRegister = async () => {
    if (!suEmail || !suUser || !suPass) { Alert.alert('Error', 'Fill in all fields'); return; }
    setLoading(true);
    const res = await register(suEmail, suUser, suPass);
    setLoading(false);
    if (!res.ok) Alert.alert('Registration Failed', res.error);
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.logoRow}>
          <View style={s.logoDot} />
          <Text style={s.logoText}>ExchangeGO</Text>
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, view === 'signin' && s.tabActive]} onPress={() => setView('signin')}>
            <Text style={[s.tabTxt, view === 'signin' && s.tabTxtActive]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, view === 'signup' && s.tabActive]} onPress={() => setView('signup')}>
            <Text style={[s.tabTxt, view === 'signup' && s.tabTxtActive]}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {view === 'signin' ? (
          <View style={s.form}>
            <Text style={s.heading}>Welcome back</Text>
            <Text style={s.label}>USERNAME OR EMAIL</Text>
            <TextInput style={s.input} value={siUser} onChangeText={setSiUser}
              placeholder="Enter username or email" placeholderTextColor="#555"
              autoCapitalize="none" />
            <Text style={s.label}>PASSWORD</Text>
            <TextInput style={s.input} value={siPass} onChangeText={setSiPass}
              placeholder="••••••••" placeholderTextColor="#555"
              secureTextEntry autoCapitalize="none" />
            <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={s.btnTxt}>Sign In →</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.form}>
            <Text style={s.heading}>Create account</Text>
            <Text style={s.label}>EMAIL</Text>
            <TextInput style={s.input} value={suEmail} onChangeText={setSuEmail}
              placeholder="you@example.com" placeholderTextColor="#555"
              autoCapitalize="none" keyboardType="email-address" />
            <Text style={s.label}>USERNAME</Text>
            <TextInput style={s.input} value={suUser} onChangeText={setSuUser}
              placeholder="Choose a username" placeholderTextColor="#555"
              autoCapitalize="none" />
            <Text style={s.label}>PASSWORD</Text>
            <TextInput style={s.input} value={suPass} onChangeText={setSuPass}
              placeholder="At least 6 characters" placeholderTextColor="#555"
              secureTextEntry autoCapitalize="none" />
            <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={s.btnTxt}>Create Account →</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#05060f' },
  scroll:      { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 32 },
  logoDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f7931a' },
  logoText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  tabs:        { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)',
                 borderRadius: 10, padding: 3, marginBottom: 28 },
  tab:         { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive:   { backgroundColor: 'rgba(247,147,26,0.15)' },
  tabTxt:      { color: '#666', fontSize: 13, fontWeight: '600' },
  tabTxtActive:{ color: '#fff' },
  form:        { gap: 8 },
  heading:     { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  label:       { color: '#555', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 8 },
  input:       { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1,
                 borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10,
                 padding: 14, color: '#fff', fontSize: 15 },
  btn:         { backgroundColor: '#f7931a', borderRadius: 10, padding: 15,
                 alignItems: 'center', marginTop: 20 },
  btnTxt:      { color: '#000', fontSize: 15, fontWeight: '700' },
});