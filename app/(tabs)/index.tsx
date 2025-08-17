import BrightnessSlider from "@/components/BrightnessSlider";
import RainbowTile from "@/components/EffectsTile";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import CustomColorPicker from "../../components/CustomColorPicker/CustomColorPicker";

const effects = [
  { id: "1", title: "Effect 1", isActive: true },
  { id: "2", title: "Effect 2", isActive: false },
  { id: "3", title: "Effect 3", isActive: true },
];



export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <BrightnessSlider />
        <CustomColorPicker />

        {effects.map((item) => (
          <RainbowTile
            key={item.id}
            title={item.title}
            isActive={item.isActive}
            onPress={() => console.log("Tapped:", item.title)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 60,
  },
});
