import { TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

type ConsumedItemProps = {
  name: string;
  quantity: number;
  calories: number;
  onDelete: () => void;
};

export function ConsumedItem({ name, quantity, calories, onDelete }: ConsumedItemProps) {
  return (
    <ThemedView style={styles.listItem}>
      <ThemedText>{name}: {quantity} units, {calories} calories</ThemedText>
      <TouchableOpacity onPress={onDelete}>
        <ThemedText style={styles.deleteText}>⛔️ Delete</ThemedText>
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
