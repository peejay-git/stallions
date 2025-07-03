"use client";

import { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';

export default function ParticleBackground() {
    const particlesInit = useCallback(async (engine: any): Promise<void> => {
        await loadSlim(engine);
    }, []);

    return (
        <Particles
            id="tsparticles"
            init={particlesInit}
            options={{
                fullScreen: { enable: false },
                background: { color: { value: 'transparent' } },
                particles: {
                    number: { value: 60, density: { enable: true, area: 800 } },
                    color: { value: '#ffffff' },
                    shape: { type: 'circle' },
                    size: {
                        value: { min: 0.5, max: 1.8 },
                        animation: { enable: true, speed: 2, minimumValue: 0.3, sync: false },
                    },
                    opacity: {
                        value: 0.25,
                        random: true,
                        animation: {
                            enable: true,
                            speed: 0.8,
                            minimumValue: 0.1,
                            sync: false,
                        },
                    },
                    move: {
                        enable: true,
                        speed: 0.2,
                        direction: 'none',
                        random: true,
                        straight: false,
                        outModes: { default: 'out' },
                    },
                },
                detectRetina: true,
            }}
            className="absolute inset-0 z-0"
        />
    );
}
