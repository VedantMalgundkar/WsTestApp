import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";

type RainbowTileProps = {
  title: string;
  isActive: boolean;
  onPress: () => void;
  style?: ViewStyle;
};


export default function RainbowTile({ title, isActive, onPress, style }: RainbowTileProps) {
  return (
    <View style={style}>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.tile,
          {
            borderColor: isActive ? "#007BFF" : "#ECEFF1",
            borderWidth: 2,
            padding:10,
          },
        ]}
        activeOpacity={0.7}
      >
        <Text style={styles.title}>{title}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '100%',
    backgroundColor: "white",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontWeight: "600",
    textAlign: "center",
  },
});
