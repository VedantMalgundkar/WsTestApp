import React, { useRef, useState } from 'react';
import { Button, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export type InputTile = {
  key: string;              // Unique key
  label: string;            // Label under the icon
  icon?: React.ReactNode;   // Icon at the top
};

export type InputSourceDashBoardProps = {
  containerStyle?: ViewStyle;
  boxStyle?: ViewStyle;
  labelStyle?: TextStyle;
  gap?: number;
};

const InputSourceDashBoard: React.FC<InputSourceDashBoardProps> = ({
  containerStyle,
  boxStyle,
  labelStyle,
  gap = 12,
}) => {
    const wsRef = useRef<WebSocket | null>(null);

    const tiles: [InputTile, InputTile, InputTile] = [
        {
            key: 'hdmi',
            label: 'HDMI',
            icon: <Icon name="video-input-hdmi" size={28} />,
        },
        {
            key: 'network',
            label: 'Network',
            icon: <Icon name="cloud" size={28} />,
        },
        {
            key: 'grabber',
            label: 'Grabber',
            icon: <Icon name="android" size={28} />,
        },
    ];

  // Track current selected input
  const [currentInput, setCurrentInput] = useState<InputTile | null>({
    key: 'hdmi',
    label: 'Grabber',
  });


  const connectWS = () => {
    try {
      const ws = new WebSocket("ws://192.168.0.120:8090");

      ws.onopen = () => {
        console.log("✅ Connected!");
        wsRef.current = ws;
      };

      ws.onmessage = (msg) => {
        console.log("Message:", msg.data);
        // setMessages((prev) => [...prev, msg.data]);
      };

      ws.onerror = (err:any) => {
        console.log("Error:", err.message);
        // setStatus("❌ Error: " + err.message);
      };

      ws.onclose = () => {
        console.log("🔌 Disconnected");
        wsRef.current = null;
      };
    } catch (e:any) {
      console.log("❌ Exception: " + e.toString());
    }
  };

  const sendMessage = (msg:any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
      console.log("📤 Sent: " + JSON.stringify(msg));
    } else {
      console.log("⚠️ Not connected, cannot send");
    }
  };

  const disconnectWS = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  return (
  <View style={styles.container}>
    {/* Row of 3 tiles */}
    <View style={[styles.row, { columnGap: gap }, containerStyle]}>
      {tiles?.map((tile) => {
        const isSelected = currentInput?.label === tile!.label;
        return (
          <View
            key={tile!.key}
            style={[
              styles.box,
              isSelected ? styles.boxSelected : styles.boxUnselected,
              boxStyle,
            ]}
          >
            <View style={styles.content}>
              {tile!.icon ? (
                <View style={styles.iconWrap}>
                  {React.isValidElement(tile!.icon)
                    ? React.cloneElement(tile!.icon as React.ReactElement<{ style?: any }>, {
                        style: [
                          (tile!.icon.props as any).style,
                          { color: isSelected ? '#fff' : '#0B0F14' },
                        ],
                      })
                    : tile!.icon}
                </View>
              ) : null}
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  { color: isSelected ? '#fff' : '#0B0F14' },
                  labelStyle,
                ]}
              >
                {tile!.label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>

    {/* Column of buttons */}
    <View style={styles.buttonColumn}>
      <Button title="connect" onPress={connectWS} />
      <Button title="disconnect" onPress={disconnectWS} />
      <Button
        title="start-led-stream"
        onPress={() =>
          sendMessage({
            command: "ledcolors",
            tan: 1,
            subcommand: "ledstream-start",
          })
        }
      />
      <Button
        title="stop-led-stream"
        onPress={() =>
          sendMessage({
            command: "ledcolors",
            tan: 1,
            subcommand: "ledstream-stop",
          })
        }
      />
    </View>
  </View>
);
};

export default InputSourceDashBoard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-start",
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 20, // spacing between tiles and buttons
  },
  buttonColumn: {
    flexDirection: "column",
    gap: 12, // RN >=0.71 supports `gap`
  },
  box: {
    flex: 1,
    minHeight: 90,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  boxUnselected: {
    borderWidth: 2,
    borderColor: "#ECEFF1",
    backgroundColor: "#fff",
  },
  boxSelected: {
    backgroundColor: "#007BFF",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrap: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0B0F14",
    textAlign: "center",
  },
});

