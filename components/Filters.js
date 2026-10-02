import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import theme from '../constants/theme';

export const MENU_CATEGORIES = [
  { label: 'Starters', value: 'starters' },
  { label: 'Mains', value: 'mains' },
  { label: 'Desserts', value: 'desserts' },
  { label: 'Drinks', value: 'drinks' }
];

export default function Filters({ selectedCategories, onToggleCategory }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      accessibilityLabel="Menu category filters"
    >
      {MENU_CATEGORIES.map((category) => {
        const selected = selectedCategories.includes(category.value);

        return (
          <Pressable
            key={category.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onToggleCategory(category.value)}
            style={({ pressed }) => [
              styles.pill,
              selected && styles.pillSelected,
              pressed && styles.pillPressed
            ]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{category.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingRight: theme.spacing.md,
    gap: theme.spacing.sm
  },
  pill: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: theme.radius.pill,
    backgroundColor: '#E5E8E5'
  },
  pillSelected: {
    backgroundColor: theme.colors.green
  },
  pillPressed: {
    opacity: 0.78
  },
  label: {
    color: theme.colors.green,
    fontSize: 14,
    fontWeight: '700'
  },
  labelSelected: {
    color: theme.colors.light
  }
});
