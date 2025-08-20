import BrightnessSlider from "@/components/BrightnessSlider";
import EffectTileContainer from "@/components/EffectsContainer/EffectsContainer";
import InputSourceDashBoard from "@/components/InputSourceDashBoard";
import { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CustomColorPicker from "../../components/CustomColorPicker/CustomColorPicker";

export default function App() {
  const[hasCleared,setHasCleared] = useState<boolean>(false);

  return (
    <GestureHandlerRootView style={{flex : 1}}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <BrightnessSlider />

          <InputSourceDashBoard />
          
          <CustomColorPicker onColorClearOrChange={()=>setHasCleared((priv)=>!priv)}/>

          <EffectTileContainer hasCleared={hasCleared}/>

        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
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
