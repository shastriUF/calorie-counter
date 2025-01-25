import { TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

type IngredientItemProps = {
  name: string;
  calories: number;
  onDelete: () => void;
};

export default function IngredientItem({ name, calories, onDelete }: IngredientItemProps) {
  return (
    <ThemedView style={styles.listItem}>
      <ThemedText>{name}: {calories} calories</ThemedText>
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
