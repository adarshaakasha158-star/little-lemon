import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Header from '../components/Header';
import theme from '../constants/theme';
import { saveUserProfile } from '../utils/storage';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85';

export default function Onboarding({ onComplete }) {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const emailInput = useRef(null);
  const isValid = useMemo(
    () => firstName.trim().length > 0 && EMAIL_PATTERN.test(email.trim()),
    [firstName, email]
  );

  async function handleContinue() {
    if (!isValid || submitting) {
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const profile = {
      firstName: firstName.trim(),
      lastName: '',
      email: email.trim(),
      phone: '',
      avatarUri: null,
      notifications: {
        orderStatuses: true,
        passwordChanges: true,
        specialOffers: true,
        newsletter: true
      }
    };

    try {
      const savedProfile = await saveUserProfile(profile, { isOnboarded: true });
      await onComplete(savedProfile);
    } catch (error) {
      console.error('Could not complete Little Lemon onboarding.', error);
      setSubmitError('Your details could not be saved. Please try again.');
      Alert.alert('Could not continue', 'Please check your connection to device storage and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <Header rightElement={<View style={styles.headerSpacer} />} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ImageBackground
            source={{ uri: HERO_IMAGE }}
            imageStyle={styles.heroImage}
            style={styles.hero}
          >
            <View style={styles.heroShade} />
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Little Lemon</Text>
              <Text style={styles.heroCity}>Chicago</Text>
              <Text style={styles.heroDescription}>
                We are a family-owned Mediterranean restaurant, focused on traditional recipes served with a modern twist.
              </Text>
            </View>
          </ImageBackground>

          <View style={styles.welcomeBlock}>
            <Text style={styles.welcomeTitle}>Let’s get to know you</Text>
            <Text style={styles.welcomeHint}>Create your profile to start exploring our menu.</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              accessibilityLabel="First Name"
              autoCapitalize="words"
              autoComplete="given-name"
              autoCorrect={false}
              onChangeText={(value) => {
                setFirstName(value);
                setSubmitError('');
              }}
              onSubmitEditing={() => emailInput.current?.focus()}
              placeholder="Enter your first name"
              placeholderTextColor="#858B88"
              returnKeyType="next"
              style={styles.input}
              value={firstName}
            />

            <Text style={[styles.label, styles.emailLabel]}>Email Address *</Text>
            <TextInput
              ref={emailInput}
              accessibilityLabel="Email Address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={(value) => {
                setEmail(value);
                setSubmitError('');
              }}
              onSubmitEditing={handleContinue}
              placeholder="you@example.com"
              placeholderTextColor="#858B88"
              returnKeyType="go"
              style={styles.input}
              value={email}
            />
            {!!email.trim() && !EMAIL_PATTERN.test(email.trim()) && (
              <Text style={styles.fieldError}>Enter a valid email address.</Text>
            )}
          </View>

          {!!submitError && <Text accessibilityRole="alert" style={styles.submitError}>{submitError}</Text>}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !isValid || submitting }}
            disabled={!isValid || submitting}
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.nextButton,
              (!isValid || submitting) && styles.nextButtonDisabled,
              pressed && isValid && !submitting && styles.nextButtonPressed
            ]}
          >
            <Text style={[styles.nextButtonLabel, (!isValid || submitting) && styles.nextButtonLabelDisabled]}>
              {submitting ? 'Saving…' : 'Next'}
            </Text>
          </Pressable>
          <Text style={styles.requiredNote}>* Required fields</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingBottom: theme.spacing.xl
  },
  headerSpacer: {
    width: 40,
    height: 40
  },
  hero: {
    minHeight: 228,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.green
  },
  heroImage: {
    borderRadius: theme.radius.lg
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(21, 38, 32, 0.58)'
  },
  heroCopy: {
    padding: theme.spacing.lg
  },
  heroTitle: {
    color: theme.colors.yellow,
    fontSize: 32,
    fontWeight: '900'
  },
  heroCity: {
    marginTop: 1,
    color: theme.colors.white,
    fontSize: 19,
    fontWeight: '700'
  },
  heroDescription: {
    maxWidth: 350,
    marginTop: 9,
    color: theme.colors.white,
    fontSize: 14,
    lineHeight: 20
  },
  welcomeBlock: {
    marginTop: 26,
    marginBottom: 18
  },
  welcomeTitle: {
    color: theme.colors.charcoal,
    fontSize: 22,
    fontWeight: '800'
  },
  welcomeHint: {
    marginTop: 6,
    color: theme.colors.muted,
    fontSize: 14
  },
  form: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.white
  },
  label: {
    marginBottom: 8,
    color: theme.colors.charcoal,
    fontSize: 14,
    fontWeight: '700'
  },
  emailLabel: {
    marginTop: 18
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    color: theme.colors.charcoal,
    fontSize: 16,
    backgroundColor: '#FCFCFB'
  },
  fieldError: {
    marginTop: 6,
    color: theme.colors.danger,
    fontSize: 12
  },
  submitError: {
    marginTop: 12,
    color: theme.colors.danger,
    fontSize: 13
  },
  nextButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.yellow
  },
  nextButtonDisabled: {
    backgroundColor: theme.colors.disabled
  },
  nextButtonPressed: {
    opacity: 0.78
  },
  nextButtonLabel: {
    color: theme.colors.charcoal,
    fontSize: 16,
    fontWeight: '800'
  },
  nextButtonLabelDisabled: {
    color: '#626A66'
  },
  requiredNote: {
    marginTop: 10,
    color: theme.colors.muted,
    textAlign: 'center',
    fontSize: 12
  }
});
