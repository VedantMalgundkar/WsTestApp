import React, { useEffect, useRef, useState } from 'react';
import { Button, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export interface Priority {
  active: boolean;
  componentId: "VIDEOGRABBER" | "COLOR" | "PROTOSERVER" | "EFFECT";
  origin: string;
  owner?: string;
  priority: number;
  visible: boolean;
  isFallBack?: boolean;

  value?: {
    HSL?: number[];
    RGB?: number[];
  };
}

export interface InputTile extends Priority {
  key: string;
  label?: string;
  icon?: React.ReactNode;
}

export interface WsBaseResponse {
  command: string;
  success: boolean;
  tan: number;
}

// priorities-update
export interface WsPrioritiesUpdate extends WsBaseResponse {
  command: "priorities-update";
  data: {
    priorities: Priority[];
    priorities_autoselect: boolean;
  };
}

// ledcolors-ledstream-update
export interface WsLedStreamUpdate extends WsBaseResponse {
  command: "ledcolors-ledstream-update";
  result: {
    leds: number[];
  };
}

export type WsResponse =
  | WsPrioritiesUpdate
  | WsLedStreamUpdate

export type InputSourceDashBoardProps = {
  containerStyle?: ViewStyle;
  boxStyle?: ViewStyle;
  labelStyle?: TextStyle;
  gap?: number;
};

interface LedPositionData {
  group: number;
  hmax: number;
  hmin: number;
  vmax: number;
  vmin: number;
};

export interface TrfLedPosition extends LedPositionData {
  color: number[];
  led_ind: number;
}

interface TransformPositionResult {
  leds: TrfLedPosition[];
  directions: {
    top: TrfLedPosition[];
    bottom: TrfLedPosition[];
    left: TrfLedPosition[];
    right: TrfLedPosition[];
  };
}

interface TransformPositionFunction {
  (
    ledPositions: LedPositionData[],
    ledColorFlat: number[],
    callbackToResetLedPositions: () => Promise<LedPositionData[]>,
    TOP_THRESHOLD?: number,
    BOTTOM_THRESHOLD?: number,
    LEFT_THRESHOLD?: number,
    RIGHT_THRESHOLD?: number
  ): Promise<TransformPositionResult>;
}

type directions = { top: TrfLedPosition[]; bottom: TrfLedPosition[]; left: TrfLedPosition[]; right: TrfLedPosition[] };

const InputSourceDashBoard: React.FC<InputSourceDashBoardProps> = ({
  containerStyle,
  boxStyle,
  labelStyle,
  gap = 12,
}) => {
    const wsRef = useRef<WebSocket | null>(null);
    const ledPositionRef = useRef<LedPositionData[] | null>(null);

    const tiles: [InputTile, InputTile, InputTile] = [
        {
            key: 'hdmi',
            label: 'HDMI',
            icon: <Icon name="video-input-hdmi" size={28} />,
            
            componentId: "VIDEOGRABBER", 
            origin: "System", 
            owner: "USB Video: USB Video (video0)", 
            priority: 240, 
            visible: false,
            active: false,
        },
        {
            key: 'network',
            label: 'Network',
            icon: <Icon name="cloud" size={28} />,
            
            componentId: "COLOR",
            origin: "JsonRpc@::1",
            priority: 100,
            value: {"HSL": [], "RGB": []},
            visible: false,
            active: false,
        },
        {
            key: 'grabber',
            label: 'Grabber',
            icon: <Icon name="android" size={28} />,

            componentId: "PROTOSERVER", 
            origin: "Proto@::ffff:192.168.0.118", 
            priority: 50, 
            visible: false,
            active: false,
        }
    ];

  // Track current selected input
  const [currentInput, setCurrentInput] = useState<Priority | null>(null);

  const baseUrl = "http://192.168.0.120:8090";

  async function getLedPositionData(): Promise<LedPositionData[]> {
    const url = `${baseUrl}/json-rpc`;

    const payload = {
      command: "serverinfo",
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log("getLedPositionData >>>>",data.info.leds.length);

    if (data?.info?.leds) {
      ledPositionRef.current = data.info.leds;
    }
    return data.info.leds
  }

  const transformPosition: TransformPositionFunction = async (
    ledPositions,
    ledColorFlat,
    callbackToResetLedPositions,
    TOP_THRESHOLD = 0.05,
    BOTTOM_THRESHOLD = 0.95,
    LEFT_THRESHOLD = 0.05,
    RIGHT_THRESHOLD = 0.95
  ): Promise<TransformPositionResult> => {

    let ledPositionsCopy = ledPositions;

    const leds = [];
    const directions: directions = {
      top: [],
      bottom: [],
      left: [],
      right: [],
    };

    if (ledPositionsCopy.length != (ledColorFlat.length / 3)) {

      // console.log("hit iffff >>>>>");
      ledPositionsCopy = await callbackToResetLedPositions()
      // console.log("new leds >>>>",ledPositionsCopy.length);
    }

    for (let i = 0, j = 0; i < ledPositionsCopy.length; i++, j += 3) {
      const led = {
        ...ledPositionsCopy[i],
        color: ledColorFlat.slice(j, j + 3),
        led_ind: i,
      };
      leds.push(led);

      // Apply direction conditions
      if (0.05 < led.hmin && led.hmin < 0.95 && led.vmin <= TOP_THRESHOLD) {
        directions.top.push(led);
      }
      if (0.05 < led.hmin && led.hmin < 0.95 && led.vmax >= BOTTOM_THRESHOLD) {
        directions.bottom.push(led);
      }
      if (0.05 < led.vmin && led.vmin < 0.95 && led.hmin <= LEFT_THRESHOLD) {
        directions.left.push(led);
      }
      if (0.05 < led.vmin && led.vmin < 0.95 && led.hmax >= RIGHT_THRESHOLD) {
        directions.right.push(led);
      }
    }

    return {
      leds,
      directions,
    };
  };

  function checkTopBottomLedForFallback(topLeds: TrfLedPosition[], bottomLeds: TrfLedPosition[]) : boolean {
    const noOfTopLeds = topLeds.length;
    const noOfBottomLeds = bottomLeds.length;

    if (!topLeds || !bottomLeds) {
      return false;
    }

    let topFallbackColors: { [key: string]: number } = {
      "255,255,6": 0,   // Bright yellow (slightly greenish)
      "255,0,255": 0,   // Pure magenta
      "0,10,255": 0,    // Deep blue (slightly purplish)
      "0,255,0": 0,     // Pure green
      "6,255,255": 0,   // Cyan / aqua
      "255,11,0": 0     // Bright red (slightly orange)
    };

    let bottomFallbackColors: { [key: string]: number } = {
      "255,255,6": 0,
      "255,0,255": 0,
      "0,10,255": 0,
      "0,255,0": 0,
      "6,255,255": 0,
      "255,11,0": 0
    };

    const loopTil = Math.max(noOfTopLeds, noOfBottomLeds);

    for (let ledInd = 0; ledInd < loopTil; ledInd++) {

      if (ledInd < noOfTopLeds) {
        const currTopColor = topLeds[ledInd]?.color?.join(",") ?? null;
        if (currTopColor && currTopColor in topFallbackColors) {
          topFallbackColors[currTopColor]++;
        }
      }
      
      if (ledInd < noOfBottomLeds) {
        const currBottomColor = bottomLeds[ledInd]?.color?.join(",") ?? null;
        if (currBottomColor && currBottomColor in bottomFallbackColors) {
          bottomFallbackColors[currBottomColor]++;
        }
      }
    }

    const minTopColorsFreq = Math.floor(noOfTopLeds * 0.09);
    const minBottomColorsFreq = Math.floor(noOfBottomLeds * 0.09);

    const areTheseTopColorsFallback = Object.values(topFallbackColors).every(
      freq => freq >= minTopColorsFreq
    );

    const areTheseBottomColorsFallback = Object.values(bottomFallbackColors).every(
      freq => freq >= minBottomColorsFreq
    );

    return areTheseTopColorsFallback && areTheseBottomColorsFallback;
  }

  const checkHdmiFallBack = async (ledPosition: LedPositionData[], ledcolors: number[]):Promise<boolean | undefined> => {
    if(!ledPosition) return;
    const trfLedPosition = await transformPosition(ledPosition,ledcolors,getLedPositionData);
    const isItFallback = checkTopBottomLedForFallback(trfLedPosition.directions.top,trfLedPosition.directions.bottom);
    return isItFallback
  }

  const decideIsSelectedComponent = (source1: string ,source2: string) : boolean => {
    if (source1.toLowerCase() == "color" && (source2.toLowerCase() == "color" || source2.toLowerCase() == "effect")){
      return true
    }
    return source1.toLowerCase() == source2.toLowerCase();
  }

  useEffect(()=>{
    getLedPositionData()
  },[])

  const connectWS = () => {
    try {
      const ws = new WebSocket("ws://192.168.0.120:8090");

      ws.onopen = () => {
        console.log("✅ Connected!");
        wsRef.current = ws;
      };

      ws.onmessage = async (msg) => {
        
        const wsResponse: WsResponse = JSON.parse(msg.data);
      
        handleWsResponse(wsResponse);
      };

      ws.onerror = (err:any) => {
        console.log("Error:", JSON.stringify(err));
      };

      ws.onclose = () => {
        console.log("🔌 Disconnected");
        wsRef.current = null;
      };
    } catch (e:any) {
      console.log("❌ Exception: " + e.toString());
    }
  };

  async function handleWsResponse(wsResponse: WsResponse) {
    switch (wsResponse.command) {
      case "priorities-update":
        
        const priorities = wsResponse.data.priorities;
        const activePriority = priorities.find(
          (p) => p.componentId !== "VIDEOGRABBER" && p.visible
        );

        if (activePriority) {
          setCurrentInput(activePriority);
        } else {
          setCurrentInput(null);
        }
        break;

      case "ledcolors-ledstream-update":
        const flatColors = wsResponse.result.leds;

          if(ledPositionRef.current) {
            const isFallback = await checkHdmiFallBack(ledPositionRef.current,flatColors);
            // console.log("falback check >>>",isFallback);

            if(!isFallback) {
              setCurrentInput({
                componentId: "VIDEOGRABBER", 
                origin: "System", 
                owner: "USB Video: USB Video (video0)", 
                priority: 240, 
                visible: false,
                active: false,
              });
            } else {
              setCurrentInput(null);
            }
          }

        break;
    }
  }

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
        // const isSelected = currentInput?.label === tile!.label;
        const isSelected = currentInput && decideIsSelectedComponent(tile.componentId, currentInput.componentId);

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
      <Button title="getLedPosition" onPress={getLedPositionData} />
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
      <Button
        title="sub input update"
        onPress={() =>
          sendMessage({
          command: "serverinfo",
          tan: 1,
          subscribe: ["priorities-update"],
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

