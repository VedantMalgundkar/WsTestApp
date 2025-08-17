import BrightnessSlider from "@/components/BrightnessSlider";
import { SafeAreaView, StyleSheet } from "react-native";
import { GestureHandlerRootView, ScrollView } from "react-native-gesture-handler";
import CustomColorPicker from "../../components/CustomColorPicker/CustomColorPicker";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <BrightnessSlider />
          <CustomColorPicker />
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: 20,
    gap: 20,            // adds spacing between items (RN 0.71+)
    paddingBottom: 60,  // so last item isn't cut off
  },
});
