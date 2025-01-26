import { TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

type ConsumedItemProps = {
  name: string;
  quantity: number;
  calories: number;
  unit: string;
  onDelete: () => void;
};

export default function ConsumedItemEntry({ name, quantity, calories, unit, onDelete }: ConsumedItemProps) {
  return (
    <ThemedView style={styles.listItem}>
      <ThemedText>{name}: {quantity} {unit}, {calories} calories</ThemedText>
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
  deleteText: {
    color: 'red',
    marginLeft: 10,
  },
});
