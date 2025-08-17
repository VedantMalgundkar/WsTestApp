import React, { useEffect, useState } from 'react';
import { Button, TouchableOpacity, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type { ColorFormatsObject } from 'reanimated-color-picker';
import ColorPicker, { colorKit, HueCircular, Panel1 } from 'reanimated-color-picker';
import { applyColor, getCurrentActiveInput, stopEffect } from '../../services/apiService';
import { colorPickerStyle } from './colorPickerStyle';
import Divider from './Divider';

// generate 6 random colors for swatches
const customSwatches = new Array(6).fill('#fff').map(() => colorKit.randomRgbColor().hex());

export default function Example() {
  const [resultColor, setResultColor] = useState(customSwatches[0]);

  const currentColor = useSharedValue(customSwatches[0]);

  const rgbToHex = (rgb: number[]) =>
    `#${rgb.map(x => x.toString(16).padStart(2, '0')).join('')}`;

  function hexToRgb(hex: string): number[] {
    hex = hex.replace(/^#/, "");

    if (hex.length === 3) {
      hex = hex.split("").map(c => c + c).join("");
    }

    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return [r, g, b];
  }

  // runs on the ui thread on color change
  const onColorChange = (color: ColorFormatsObject) => {
    'worklet';
    currentColor.value = color.hex;
  };

  const callColorApi = async (rgbArray: number[]) => {
    try {
      const res = await applyColor(rgbArray);
    } catch (error: any) {
      console.error("applyColor failed:", error);

      Toast.show({
        type: 'error',
        text1: error.message ?? 'Error in Fetching Current Input',
        position: 'bottom',
        visibilityTime: 2000,
      });

      // fallback to black
      currentColor.value = "#000000";
      setResultColor("#000000");
    }
  }

  // runs on the js thread on color pick
  const onColorPick = async (color: ColorFormatsObject) => {
    console.log("ran onColorPick with >>>>>", color.rgb);
    // update local shared value
    currentColor.value = color.hex;
    setResultColor(color.hex);

    // convert "rgb(30, 176, 91)" → [30,176,91]
    const rgbArray = color.rgb
      .replace(/[^\d,]/g, "") // keep only numbers & commas
      .split(",")
      .map(num => parseInt(num.trim(), 10));

    console.log("RGB Array:", rgbArray);
    callColorApi(rgbArray);

  };

  const fetchCurrentInputSource = async () => {
    try {
      const res = await getCurrentActiveInput();
      if (res.data.componentId.toLowerCase() == 'color') {
        const rgbColor = res.data.value.RGB;
        setResultColor(rgbToHex(rgbColor));
      }
      console.log({ res });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.message ?? 'Error in Fetching Current Input',
        position: 'bottom',
        visibilityTime: 2000,
      });
    }
  };

  // Action for the last swatch (cross button)
  const handleClearColor = async () => {
    try {
      await stopEffect(100);
      setResultColor('#FFFFFF00');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message ?? "failed to reset Led color/Effect", position: 'bottom' });
    }
  };

  const handleCustomSwatchePress = (swatch: string) => {
    currentColor.value = swatch;
    setResultColor(swatch);
    const rbgArray = hexToRgb(swatch);
    callColorApi(rbgArray);
  };

  useEffect(() => {
    fetchCurrentInputSource();
  }, []);

  return (
    <View style={colorPickerStyle.pickerContainer}>
      <ColorPicker
        value={resultColor}
        sliderThickness={20}
        thumbSize={24}
        onChange={onColorChange}
        onCompleteJS={onColorPick}
        style={colorPickerStyle.picker}
        boundedThumb
      >
        <HueCircular containerStyle={{ justifyContent: 'center' }} thumbShape='pill'>
          <Panel1 style={{ borderRadius: 16, width: '70%', height: '70%', alignSelf: 'center' }} />
        </HueCircular>

        <Divider />

        <View
          style={[
            colorPickerStyle.swatchesContainer,
            { justifyContent: 'space-between' },
          ]}
        >
          {customSwatches.map((swatch, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                colorPickerStyle.swatchStyle,
                { backgroundColor: swatch },
              ]}
              onPress={() => {
                handleCustomSwatchePress(swatch);
              }}
            />
          ))}

          <TouchableOpacity
            style={colorPickerStyle.crossButton}
            onPress={handleClearColor}
          >
            <Icon name="close" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        <Button title="fetch input" onPress={fetchCurrentInputSource} />
      </ColorPicker>
    </View>
  );
}