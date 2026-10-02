import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import theme from '../constants/theme';

function getInitials(profile) {
  const first = profile?.firstName?.trim()?.[0] ?? '';
  const last = profile?.lastName?.trim()?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || 'LL';
}

export default function Header({ profile, onPressProfile, rightElement }) {
  return (
    <View style={styles.container}>
      <View style={styles.sideSlot} />
      <View style={styles.brand} accessibilityLabel="Little Lemon">
        <Text style={styles.brandText}>LITTLE LEMON</Text>
        <Text style={styles.brandAccent}>MEDITERRANEAN KITCHEN</Text>
      </View>
      <View style={[styles.sideSlot, styles.rightSlot]}>
        {rightElement ?? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open your profile"
            onPress={onPressProfile}
            style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
          >
            {profile?.avatarUri ? (
              <Image source={{ uri: profile.avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{getInitials(profile)}</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background
  },
  sideSlot: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rightSlot: {
    alignItems: 'flex-end'
  },
  brand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandText: {
    color: theme.colors.charcoal,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.4
  },
  brandAccent: {
    marginTop: 2,
    color: theme.colors.green,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.2
  },
  avatar: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.green,
    backgroundColor: theme.colors.yellow
  },
  avatarPressed: {
    opacity: 0.75
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  avatarInitials: {
    color: theme.colors.green,
    fontSize: 14,
    fontWeight: '800'
  }
});
