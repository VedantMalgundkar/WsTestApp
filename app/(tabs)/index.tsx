import BrightnessSlider from "@/components/BrightnessSlider";
import EffectTileContainer from "@/components/EffectsContainer/EffectsContainer";
import { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import CustomColorPicker from "../../components/CustomColorPicker/CustomColorPicker";

export default function App() {
  const[hasCleared,setHasCleared] = useState<boolean>(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <BrightnessSlider />
        
        <CustomColorPicker onColorClear={()=>setHasCleared((priv)=>!priv)}/>

        <EffectTileContainer hasCleared={hasCleared}/>

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
