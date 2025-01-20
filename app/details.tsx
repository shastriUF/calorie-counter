import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';

export default function DetailsScreen() {
  return (
    <View style={styles.container}>
      <Text>Details</Text>
      <Link href="/" asChild>
        <Pressable>
          <Text>Go Home</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
