import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import theme from '../constants/theme';

export default function MenuItem({ item }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [item.imageUrl]);

  return (
    <View style={styles.card} accessible accessibilityLabel={`${item.name}, $${Number(item.price).toFixed(2)}`}>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
        <Text numberOfLines={2} style={styles.description}>{item.description}</Text>
        <Text style={styles.price}>${Number(item.price).toFixed(2)}</Text>
      </View>
      {item.imageUrl && !imageFailed ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel={`${item.name} dish`}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Text style={styles.lemon}>🍋</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 132,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    gap: 14
  },
  copy: {
    flex: 1,
    justifyContent: 'center'
  },
  name: {
    color: theme.colors.charcoal,
    fontSize: 17,
    fontWeight: '800'
  },
  description: {
    marginTop: 6,
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  price: {
    marginTop: 10,
    color: theme.colors.green,
    fontSize: 15,
    fontWeight: '800'
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: theme.radius.md,
    backgroundColor: '#E5E8E5'
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  lemon: {
    fontSize: 32
  }
});
