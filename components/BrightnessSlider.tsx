import Slider from '@react-native-community/slider';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { adjustLedBrightness, getLedBrightness } from '../services/apiService';

const BrightnessSlider = () => {
    const [brightness, setBrightness] = useState(50);

    const handleBrightnessChange = async (value: number): Promise<void> => {
        try {
            await adjustLedBrightness(value);
        } catch (error: any) {
            Toast.show({
                type: 'error',           // success | error | info
                text1: error.message ?? 'error in setting Brightness',
                position: 'bottom',
                visibilityTime: 2000,
            });
        }
    };

    const fetchLedBrightness = async (): Promise<void> => {
        try {
            const res = await getLedBrightness()
            setBrightness(res.data.brightness)
        } catch(error:any) {
            Toast.show({
                type: 'error',           // success | error | info
                text1: error.message ?? 'Error in fetching Brightness',
                position: 'bottom',
                visibilityTime: 2000,
            });
        }
    }

    useEffect(()=>{
        fetchLedBrightness()
    },[])

    return (
        <View style={styles.container}>
            <View style={styles.sliderRow}>
                <Slider
                    style={{ flex: 1, height: 40 }}
                    minimumValue={0}
                    maximumValue={100}
                    step={1}
                    value={brightness}
                    minimumTrackTintColor="#007BFF"
                    maximumTrackTintColor="rgba(0,123,255,0.3)"
                    thumbTintColor="#007BFF"
                    onValueChange={(value) => setBrightness(value)}
                    onSlidingComplete={(value) => { handleBrightnessChange(value) }}
                />
                {/* Fixed-width tooltip */}
                <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>{brightness}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingLeft: 5,
        paddingRight: 5,
        paddingTop: 10,
        paddingBottom: 10,
        width: '100%',
        borderWidth: 2,
        borderColor: '#ECEFF1',
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    sliderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 10,
    },
    tooltip: {
        marginLeft: 12,
        width: 40,
        height: 30,
        backgroundColor: '#007BFF',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tooltipText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center', // center the number
    },
});

export default BrightnessSlider;
