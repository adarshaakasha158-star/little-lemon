import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Header from '../components/Header';
import Filters from '../components/Filters';
import MenuItem from '../components/MenuItem';
import theme from '../constants/theme';
import { cacheMenuItems, getCachedMenuItems } from '../utils/database';
import { fetchMenuItems, getDishImageUrl } from '../utils/menuService';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=85';

function withImageUrl(items) {
  return items.map((item) => ({ ...item, imageUrl: getDishImageUrl(item.image) }));
}

export default function Home({ navigation, userProfile }) {
  const [items, setItems] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadMenu = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setLoadError('');

    let cachedItems = [];
    try {
      cachedItems = await getCachedMenuItems();
      if (cachedItems.length > 0) {
        setItems(withImageUrl(cachedItems));
      }
    } catch (error) {
      console.warn('The local menu cache could not be read.', error);
    }

    try {
      const freshItems = await fetchMenuItems();
      setItems(withImageUrl(freshItems));
      setOffline(false);

      try {
        await cacheMenuItems(freshItems);
      } catch (error) {
        console.warn('The latest menu could not be saved for offline use.', error);
      }
    } catch (error) {
      console.warn('The online menu could not be refreshed.', error);
      if (cachedItems.length > 0) {
        setOffline(true);
      } else {
        setLoadError('We could not load the menu. Check your connection and try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMenu({ showLoading: true });
  }, [loadMenu]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchText.trim().toLowerCase()), 500);
    return () => clearTimeout(timeout);
  }, [searchText]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const categoryMatch =
        selectedCategories.length === 0 || selectedCategories.includes(item.category);
      const searchMatch =
        debouncedSearch.length === 0 ||
        item.name.toLowerCase().includes(debouncedSearch) ||
        item.description.toLowerCase().includes(debouncedSearch);
      return categoryMatch && searchMatch;
    });
  }, [items, selectedCategories, debouncedSearch]);

  const toggleCategory = useCallback((category) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((value) => value !== category)
        : [...current, category]
    );
  }, []);

  const listHeader = (
    <View>
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

      <View style={styles.searchContainer}>
        <View accessibilityElementsHidden importantForAccessibility="no" style={styles.searchIcon}>
          <View style={styles.searchLens} />
          <View style={styles.searchHandle} />
        </View>
        <TextInput
          accessibilityLabel="Search the menu"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          onChangeText={setSearchText}
          placeholder="Search fresh Mediterranean dishes"
          placeholderTextColor="#737B77"
          returnKeyType="search"
          style={styles.searchInput}
          value={searchText}
        />
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionEyebrow}>EXPLORE OUR MENU</Text>
        <Text style={styles.sectionTitle}>Order for pickup</Text>
        <Filters selectedCategories={selectedCategories} onToggleCategory={toggleCategory} />
      </View>

      {offline && (
        <View style={styles.offlineNotice}>
          <Text style={styles.offlineNoticeText}>Offline menu · Showing your saved dishes</Text>
        </View>
      )}
      {loading && items.length === 0 && (
        <View style={styles.loadingState}>
          <ActivityIndicator color={theme.colors.green} />
          <Text style={styles.stateText}>Loading the menu…</Text>
        </View>
      )}
      {!!loadError && items.length === 0 && (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable accessibilityRole="button" onPress={() => loadMenu({ showLoading: true })} style={styles.retryButton}>
            <Text style={styles.retryLabel}>Try again</Text>
          </Pressable>
        </View>
      )}
      {!loading && !loadError && filteredItems.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No dishes found</Text>
          <Text style={styles.stateText}>
            {items.length === 0
              ? 'The menu is empty right now. Pull down to refresh.'
              : 'Try a different search or category.'}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <Header profile={userProfile} onPressProfile={() => navigation.navigate('Profile')} />
      <FlatList
        data={loadError && items.length === 0 ? [] : filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MenuItem item={item} />}
        ListHeaderComponent={listHeader}
        ListFooterComponent={<View style={styles.listFooter} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadMenu({ showLoading: false })}
            tintColor={theme.colors.green}
            colors={[theme.colors.green]}
          />
        }
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
        updateCellsBatchingPeriod={40}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md
  },
  hero: {
    minHeight: 202,
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
    padding: theme.spacing.md
  },
  heroTitle: {
    color: theme.colors.yellow,
    fontSize: 30,
    fontWeight: '900'
  },
  heroCity: {
    marginTop: 1,
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '700'
  },
  heroDescription: {
    maxWidth: 350,
    marginTop: 8,
    color: theme.colors.white,
    fontSize: 13,
    lineHeight: 18
  },
  searchContainer: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    backgroundColor: '#E8EBE8'
  },
  searchIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchLens: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: theme.colors.green,
    borderRadius: 7
  },
  searchHandle: {
    position: 'absolute',
    top: 16,
    left: 17,
    width: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.colors.green,
    transform: [{ rotate: '45deg' }]
  },
  searchInput: {
    flex: 1,
    minHeight: 50,
    color: theme.colors.charcoal,
    fontSize: 14
  },
  sectionBlock: {
    paddingTop: 22,
    paddingBottom: 14
  },
  sectionEyebrow: {
    color: theme.colors.green,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5
  },
  sectionTitle: {
    marginTop: 3,
    marginBottom: 14,
    color: theme.colors.charcoal,
    fontSize: 23,
    fontWeight: '800'
  },
  offlineNotice: {
    marginBottom: 7,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.lightOrange
  },
  offlineNoticeText: {
    color: theme.colors.charcoal,
    fontSize: 12,
    fontWeight: '700'
  },
  loadingState: {
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9
  },
  stateText: {
    marginTop: 5,
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  errorState: {
    alignItems: 'center',
    paddingVertical: 22
  },
  errorText: {
    color: theme.colors.danger,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20
  },
  retryButton: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.green
  },
  retryLabel: {
    color: theme.colors.white,
    fontWeight: '700'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 22
  },
  emptyTitle: {
    color: theme.colors.charcoal,
    fontSize: 16,
    fontWeight: '800'
  },
  listFooter: {
    height: 16
  }
});
