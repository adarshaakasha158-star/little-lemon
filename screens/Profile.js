import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import theme from '../constants/theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_NOTIFICATIONS = {
  orderStatuses: true,
  passwordChanges: true,
  specialOffers: true,
  newsletter: true
};
const NOTIFICATION_OPTIONS = [
  { key: 'orderStatuses', label: 'Order statuses' },
  { key: 'passwordChanges', label: 'Password changes' },
  { key: 'specialOffers', label: 'Special offers' },
  { key: 'newsletter', label: 'Newsletter' }
];

function makeDraft(profile) {
  return {
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    email: profile?.email ?? '',
    phone: profile?.phone ?? '',
    avatarUri: profile?.avatarUri ?? null,
    notifications: {
      ...DEFAULT_NOTIFICATIONS,
      ...(profile?.notifications ?? {})
    }
  };
}

function getInitials(profile) {
  const initials = `${profile.firstName?.trim()?.[0] ?? ''}${profile.lastName?.trim()?.[0] ?? ''}`;
  return initials.toUpperCase() || 'LL';
}

function cloneDraft(draft) {
  return {
    ...draft,
    notifications: { ...draft.notifications }
  };
}

export default function Profile({ userProfile, onProfileSaved, onLogout }) {
  const [draft, setDraft] = useState(() => makeDraft(userProfile));
  const [savedDraft, setSavedDraft] = useState(() => makeDraft(userProfile));
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const nextDraft = makeDraft(userProfile);
    setDraft(nextDraft);
    setSavedDraft(cloneDraft(nextDraft));
  }, [userProfile]);

  const initials = useMemo(() => getInitials(draft), [draft.firstName, draft.lastName]);

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setError('');
  }

  function togglePreference(key, value) {
    setDraft((current) => ({
      ...current,
      notifications: { ...current.notifications, [key]: value }
    }));
  }

  async function changeAvatar() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo access needed', 'Allow photo library access to choose a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        updateField('avatarUri', result.assets[0].uri);
      }
    } catch (pickerError) {
      console.error('Could not open the photo library.', pickerError);
      Alert.alert('Could not open photos', 'Please try again in a moment.');
    }
  }

  async function saveChanges() {
    if (saving) {
      return;
    }

    const nextProfile = {
      ...draft,
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim()
    };

    if (!nextProfile.firstName) {
      setError('First name is required.');
      return;
    }
    if (!EMAIL_PATTERN.test(nextProfile.email)) {
      setError('Enter a valid email address.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const savedProfile = await onProfileSaved(nextProfile);
      const updatedDraft = makeDraft(savedProfile ?? nextProfile);
      setDraft(updatedDraft);
      setSavedDraft(cloneDraft(updatedDraft));
      Alert.alert('Changes saved', 'Your Little Lemon profile has been updated.');
    } catch (saveError) {
      console.error('Could not save Little Lemon profile changes.', saveError);
      setError('Your changes could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function discardChanges() {
    setDraft(cloneDraft(savedDraft));
    setError('');
  }

  function confirmLogout() {
    Alert.alert(
      'Log out?',
      'This will clear your saved profile from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            if (loggingOut) {
              return;
            }
            setLoggingOut(true);
            try {
              await onLogout();
            } catch (logoutError) {
              console.error('Could not clear Little Lemon profile data.', logoutError);
              Alert.alert('Could not log out', 'Your saved details could not be cleared. Please try again.');
            } finally {
              setLoggingOut(false);
            }
          }
        }
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.intro}>Manage your personal information and email preferences.</Text>

          <View style={styles.avatarPanel}>
            <View style={styles.avatar}>
              {draft.avatarUri ? (
                <Image source={{ uri: draft.avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
            </View>
            <View style={styles.avatarActions}>
              <Pressable accessibilityRole="button" onPress={changeAvatar} style={styles.smallAction}>
                <Text style={styles.smallActionLabel}>Change</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={!draft.avatarUri}
                onPress={() => updateField('avatarUri', null)}
                style={[styles.smallAction, !draft.avatarUri && styles.smallActionDisabled]}
              >
                <Text style={[styles.smallActionLabel, !draft.avatarUri && styles.smallActionLabelDisabled]}>
                  Remove
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal information</Text>
            <FormField
              label="First Name"
              value={draft.firstName}
              onChangeText={(value) => updateField('firstName', value)}
              autoComplete="given-name"
              autoCapitalize="words"
            />
            <FormField
              label="Last Name"
              value={draft.lastName}
              onChangeText={(value) => updateField('lastName', value)}
              autoComplete="family-name"
              autoCapitalize="words"
            />
            <FormField
              label="Email Address"
              value={draft.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
            />
            <FormField
              label="Phone Number"
              value={draft.phone}
              onChangeText={(value) => updateField('phone', value)}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Email notifications</Text>
            <Text style={styles.sectionHint}>Choose the updates you’d like to receive.</Text>
            {NOTIFICATION_OPTIONS.map((option) => (
              <View key={option.key} style={styles.preferenceRow}>
                <Text style={styles.preferenceLabel}>{option.label}</Text>
                <Switch
                  accessibilityLabel={option.label}
                  value={Boolean(draft.notifications[option.key])}
                  onValueChange={(value) => togglePreference(option.key, value)}
                  trackColor={{ false: '#C7CECA', true: '#93A49D' }}
                  thumbColor={draft.notifications[option.key] ? theme.colors.green : '#F5F5F5'}
                />
              </View>
            ))}
          </View>

          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

          <Pressable
            accessibilityRole="button"
            disabled={saving || loggingOut}
            onPress={saveChanges}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.primaryButtonLabel}>{saving ? 'Saving…' : 'Save changes'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={saving || loggingOut}
            onPress={discardChanges}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.secondaryButtonLabel}>Discard changes</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={saving || loggingOut}
            onPress={confirmLogout}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.logoutLabel}>{loggingOut ? 'Logging out…' : 'Log out'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormField({ label, value, onChangeText, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor="#858B88"
        style={styles.input}
        value={value}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  flex: {
    flex: 1
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl
  },
  intro: {
    marginBottom: 18,
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  avatarPanel: {
    minHeight: 106,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.white
  },
  avatar: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.green,
    borderRadius: 38,
    backgroundColor: theme.colors.yellow
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  avatarInitials: {
    color: theme.colors.green,
    fontSize: 24,
    fontWeight: '800'
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 10
  },
  smallAction: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.light
  },
  smallActionDisabled: {
    opacity: 0.55
  },
  smallActionLabel: {
    color: theme.colors.green,
    fontSize: 13,
    fontWeight: '700'
  },
  smallActionLabelDisabled: {
    color: theme.colors.muted
  },
  section: {
    marginBottom: 18,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.white
  },
  sectionTitle: {
    marginBottom: 15,
    color: theme.colors.charcoal,
    fontSize: 18,
    fontWeight: '800'
  },
  sectionHint: {
    marginTop: -9,
    marginBottom: 8,
    color: theme.colors.muted,
    fontSize: 13
  },
  field: {
    marginBottom: 13
  },
  fieldLabel: {
    marginBottom: 7,
    color: theme.colors.charcoal,
    fontSize: 13,
    fontWeight: '700'
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    color: theme.colors.charcoal,
    fontSize: 15,
    backgroundColor: '#FCFCFB'
  },
  preferenceRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border
  },
  preferenceLabel: {
    color: theme.colors.charcoal,
    fontSize: 14,
    fontWeight: '600'
  },
  error: {
    marginBottom: 12,
    color: theme.colors.danger,
    fontSize: 13
  },
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.yellow
  },
  primaryButtonLabel: {
    color: theme.colors.charcoal,
    fontSize: 15,
    fontWeight: '800'
  },
  secondaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.colors.green,
    borderRadius: theme.radius.sm,
    backgroundColor: 'transparent'
  },
  secondaryButtonLabel: {
    color: theme.colors.green,
    fontSize: 15,
    fontWeight: '700'
  },
  logoutButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderRadius: theme.radius.sm,
    backgroundColor: '#FBEAE8'
  },
  logoutLabel: {
    color: theme.colors.danger,
    fontSize: 15,
    fontWeight: '800'
  },
  buttonPressed: {
    opacity: 0.78
  }
});
