import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

type ConsumedItemProps = {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  meal: string;
  onDelete: () => void;
};

export default function ConsumedItemEntry({ name, quantity, calories, unit, meal, onDelete }: ConsumedItemProps) {
  return (
    <ThemedView style={styles.listItem}>
      <View style={styles.itemInfo}>
        <ThemedText>{name}: {quantity} {unit}, {calories} calories</ThemedText>
        <ThemedText style={styles.mealTag}>{meal}</ThemedText>
      </View>
      <TouchableOpacity onPress={onDelete}>
        <ThemedText style={styles.deleteText}>
          <Ionicons name="trash" /> Delete
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    marginBottom: 10,
  },
  itemInfo: {
    flex: 1,
  },
  mealTag: {
    fontSize: 12,
    color: '#0a7ea4',
    marginTop: 4,
  },
  deleteText: {
    color: 'red',
    marginLeft: 10,
  },
});
