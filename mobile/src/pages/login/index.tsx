import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Bell, Lock, LogIn, ShieldCheck, User } from 'lucide-react-native';
import { getApiUrl } from '../../apis/http';
import { styles, theme } from '../../styles';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('tenant101');
  const [password, setPassword] = useState('tenant123');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    setSubmitting(true);
    setError(null);
    try {
      await onLogin(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.loginScreen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.loginKeyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.loginScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.loginTopBar}>
            <View style={styles.loginBrandMark}>
              <Bell size={22} color={theme.colors.onPrimaryContainer} fill={theme.colors.onPrimaryContainer} />
            </View>
            <Text style={styles.loginBrandText}>My Room</Text>
          </View>

          <View style={styles.loginContent}>
            <View style={styles.loginCard}>
              <View style={styles.loginHeader}>
                <Text style={styles.loginTitle}>Welcome Back</Text>
                <Text style={styles.loginSubtitle}>Sign in to manage your room and security access.</Text>
              </View>

              <View style={styles.loginForm}>
                <View style={styles.loginField}>
                  <User size={20} color={theme.colors.outline} />
                  <TextInput
                    autoCapitalize="none"
                    onChangeText={setUsername}
                    placeholder="Enter your username"
                    placeholderTextColor={theme.colors.outline}
                    style={styles.loginInput}
                    value={username}
                  />
                </View>

                <View style={styles.loginField}>
                  <Lock size={20} color={theme.colors.outline} />
                  <TextInput
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor={theme.colors.outline}
                    secureTextEntry
                    style={styles.loginInput}
                    value={password}
                  />
                </View>

                {error ? <Text style={styles.loginErrorText}>{error}</Text> : null}

                <Pressable style={styles.loginButton} disabled={submitting} onPress={handleLogin}>
                  <Text style={styles.loginButtonText}>{submitting ? 'Signing In...' : 'Login'}</Text>
                  <LogIn size={20} color={theme.colors.onPrimary} />
                </Pressable>
              </View>

              <View style={styles.loginSecureNote}>
                <ShieldCheck size={16} color={theme.colors.onSurfaceVariant} fill={theme.colors.onSurfaceVariant} />
                <Text style={styles.loginSecureText}>API: {getApiUrl()}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
