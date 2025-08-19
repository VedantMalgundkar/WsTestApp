import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { applyEffect, getCurrentActiveInput, getLedEffects, stopEffect } from "../../services/apiService";
import EffectsTile from './EffectsTile';

type Effect = {
    name: string;
};

type EffectTileContainerProps = {
    hasCleared: boolean;
};

export default function EffectTileContainer({ hasCleared }: EffectTileContainerProps) {
    const [effects, setEffects] = useState<Effect[] | null>(null);
    const [activeEffect, setActiveEffect] = useState<Effect | null>(null);

    const fetchCurrentInputSource = async () => {
        try {
            const res = await getCurrentActiveInput();
            if (res.data.componentId.toLowerCase().includes('effect')) {
                const effect = res.data.value;
                setActiveEffect({ name: effect });
            }
        } catch (error: any) {
            console.log(error);
        }
    };

    const fetchLedEffects = async () => {

        try {
            const res = await getLedEffects();
            setEffects(res.data)
        } catch (error) {
            console.log(error);
        }

    }

    const ApplyLedEffects = async (effect: string) => {
        try {
            if (activeEffect?.name == effect) {
                await stopEffect(100);
                setActiveEffect(null);
            } else {
                await applyEffect(effect);
                setActiveEffect({ name: effect })
            }
        } catch (error:any) {
            Toast.show({ type: 'error', text1: error.message ?? "Failed to apply or clear Led Effect", position: 'bottom' });
        }

    }

    useEffect(() => {
        fetchLedEffects();
        fetchCurrentInputSource();
    }, [])

    useEffect(() => {
        setActiveEffect(null);
    }, [hasCleared])

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Classic Effects</Text>

            {effects?.map((item: Effect) => (
                <EffectsTile
                    key={item.name}
                    title={item.name}
                    isActive={item.name == activeEffect?.name}
                    onPress={() => { ApplyLedEffects(item.name) }}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "column",
        gap: 17,
        paddingBottom: 10,
    },
    header: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: "600"
    },
});
