import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@little-lemon/profile';
const ONBOARDED_KEY = '@little-lemon/isOnboarded';

export async function getUserProfile() {
  const savedProfile = await AsyncStorage.getItem(PROFILE_KEY);

  if (!savedProfile) {
    return null;
  }

  try {
    return JSON.parse(savedProfile);
  } catch (error) {
    console.warn('Could not read the saved Little Lemon profile.', error);
    return null;
  }
}

export async function getIsOnboarded() {
  return (await AsyncStorage.getItem(ONBOARDED_KEY)) === 'true';
}

export async function saveUserProfile(profile, { isOnboarded = true } = {}) {
  const normalizedProfile = {
    ...profile,
    firstName: String(profile.firstName ?? '').trim(),
    lastName: String(profile.lastName ?? '').trim(),
    email: String(profile.email ?? '').trim(),
    phone: String(profile.phone ?? '').trim(),
    avatarUri: profile.avatarUri || null,
    notifications: {
      orderStatuses: true,
      passwordChanges: true,
      specialOffers: true,
      newsletter: true,
      ...(profile.notifications || {})
    }
  };

  const entries = [[PROFILE_KEY, JSON.stringify(normalizedProfile)]];

  if (isOnboarded) {
    entries.push([ONBOARDED_KEY, 'true']);
  }

  await AsyncStorage.multiSet(entries);
  return normalizedProfile;
}

export async function clearUserData() {
  await AsyncStorage.multiRemove([PROFILE_KEY, ONBOARDED_KEY]);
}
