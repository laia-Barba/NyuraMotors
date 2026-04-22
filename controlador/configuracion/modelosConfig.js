export const MODELOS_CONFIG = {
    modelos: {
        ThunderBE: {
            nombre: 'ThunderBE',
            precio: 32490,
            descripcion: 'Deportivo eléctrico de alto rendimiento',
            modelo: '../coches/ThunderBE/ThunderBE.glb',
            escalado: { exterior: 8 },
            colores: [
                { id: 'negro', nombre: 'Negro Mate', hex: '#1a1a1a', material: 'carroceria' },
                { id: 'rojo', nombre: 'Rojo Racing', hex: '#dc143c', material: 'carroceria' }
            ],
            llantas: [
                { id: 'acero', nombre: 'Acero', precio: 0 },
                { id: 'sport', nombre: 'Sport', precio: 2500 }
            ],
            paquetes: [
                {
                    id: 'tech-premium',
                    nombre: 'Tech Premium',
                    descripcion: 'Sistema Audio Premium + Asistencia Avanzada + Control por Voz',
                    precio: 6800,
                    componentes: []
                }
            ],
            camaras: {
                exterior: { fov: 75, posicion: [0, 1.5, 5], target: [0, 0.5, 0] },
                interior: { fov: 75, posicion: [0, 0.6, -0.5], target: [0, 0.6, 2] }
            }
        },
        Vortex: {
            nombre: 'Vortex',
            precio: 42900,
            descripcion: 'SUV eléctrico con autonomía extendida y diseño futurista',
            modelo: '../coches/Terramar/TerramarNegro.glb',
            escalado: { modelo: 2.1, camera: 4 },
            colores: [
                { id: 'azul', nombre: 'Azul', hex: '#1f5eff', material: 'carroceria', modelo: '../coches/Terramar/TerramarAzul.glb' },
                { id: 'gris', nombre: 'Gris', hex: '#6c757d', material: 'carroceria', modelo: '../coches/Terramar/TerramarGris.glb' },
                { id: 'negro', nombre: 'Negro', hex: '#1a1a1a', material: 'carroceria', modelo: '../coches/Terramar/TerramarNegro.glb' },
                { id: 'blanco', nombre: 'Blanco', hex: '#f8f8f8', material: 'carroceria', modelo: '../coches/Terramar/TerramarBlanco.glb' },
                { id: 'rojo', nombre: 'Rojo', hex: '#dc143c', material: 'carroceria', modelo: '../coches/Terramar/TerramarRojo.glb' }
            ],
            llantas: [
                { id: 'original', nombre: 'Original', precio: 0 },
                { id: 'serie', nombre: 'Serie', precio: 0 },
                { id: 'offroad', nombre: 'Off-Road', precio: 1500 }
            ],
            paquetes: [
                {
                    id: 'adventure',
                    nombre: 'Adventure Pack',
                    descripcion: 'Suspensión elevada y equipamiento off-road',
                    precio: 5500
                },
                {
                    id: 'luxury',
                    nombre: 'Luxury Pack',
                    descripcion: 'Asientos de cuero y acabados premium',
                    precio: 8900
                }
            ],
            moneda: 'EUR',
            camaras: {
                exterior: { fov: 75, posicion: [0, 1.5, 5], target: [0, 0.5, 0] },
                interior: { fov: 75, posicion: [0, 1.9, 0.4], target: [0, 1.3, 0] }
            },
        },
        Altamira: {
            nombre: 'Altamira',
            precio: 54900,
            descripcion: 'SUV premium con lujo y tecnología avanzada',
            modelo: '../coches/Nyura Altamira/Altamira_Negro.glb',
            escalado: { modelo: 4.75, camera: 2.8, plataforma: 1.4 },
            colores: [
                { id: 'negro', nombre: 'Negro', hex: '#1a1a1a', material: 'carroceria', modelo: '../coches/Nyura Altamira/Altamira_Negro.glb' },
                { id: 'blanco', nombre: 'Blanco', hex: '#f8f8f8', material: 'carroceria', modelo: '../coches/Nyura Altamira/Altamira_Blanco.glb' },
                { id: 'gris', nombre: 'Gris', hex: '#6c757d', material: 'carroceria', modelo: '../coches/Nyura Altamira/Altamira_Gris.glb' },
                { id: 'rojo', nombre: 'Rojo', hex: '#dc143c', material: 'carroceria', modelo: '../coches/Nyura Altamira/Altamira_Rojo.glb' }
            ],
            llantas: [
                { id: 'blanco', nombre: 'De serie', precio: 0 },
                { id: 'negro', nombre: 'Pack Dark', precio: 1200 }
            ],
            paquetes: [
                {
                    id: 'adventure',
                    nombre: 'Adventure Pack',
                    descripcion: 'Suspensión elevada y equipamiento off-road',
                    precio: 5500
                },
                {
                    id: 'luxury',
                    nombre: 'Luxury Pack',
                    descripcion: 'Asientos de cuero y acabados premium',
                    precio: 8900
                }
            ],
            moneda: 'EUR',
            camaras: {
                exterior: { fov: 75, posicion: [0, 1.5, 5], target: [0, 0.5, 0] },
                interior: { fov: 75, posicion: [0, 1.9, 0.4], target: [0, 1.3, 0] }
            }
        },
        Nova: {
            nombre: 'Nova',
            precio: 28900,
            descripcion: 'Compacto eficiente con motor de gasolina de última generación',
            modelo: '../coches/Nyura Nova/NovaNegro.glb',
            escalado: { modelo: 2.0, camera: 4.5, plataforma: 1 },
            colores: [
                { id: 'negro', nombre: 'Negro', hex: '#1a1a1a', material: 'carroceria', modelo: '../coches/Nyura Nova/NovaNegro.glb' },
                { id: 'blanco', nombre: 'Blanco', hex: '#f8f8f8', material: 'carroceria', modelo: '../coches/Nyura Nova/NovaBlanco.glb' },
                { id: 'gris', nombre: 'Gris', hex: '#6c757d', material: 'carroceria', modelo: '../coches/Nyura Nova/NovaGris.glb' },
                { id: 'azul', nombre: 'Azul', hex: '#1f5eff', material: 'carroceria', modelo: '../coches/Nyura Nova/NovaAzul.glb' },
                { id: 'rojo', nombre: 'Rojo', hex: '#dc143c', material: 'carroceria', modelo: '../coches/Nyura Nova/NovaRojo.glb' }
            ],
            llantas: [
                { id: 'blanco', nombre: 'De serie', precio: 0 },
                { id: 'negro', nombre: 'Pack Dark', precio: 800 }
            ],
            paquetes: [
                {
                    id: 'adventure',
                    nombre: 'Adventure Pack',
                    descripcion: 'Suspensión elevada y equipamiento off-road',
                    precio: 5500
                },
                {
                    id: 'luxury',
                    nombre: 'Luxury Pack',
                    descripcion: 'Asientos de cuero y acabados premium',
                    precio: 8900
                }
            ],
            moneda: 'EUR',
            camaras: {
                exterior: { fov: 75, posicion: [0, 1.5, 5], target: [0, 0.5, 0] },
                interior: { fov: 75, posicion: [0, 1.9, 0.4], target: [0, 1.3, 0] }
            }
        },
        NovaSport: {
            nombre: 'Nova Sport',
            precio: 35900,
            descripcion: 'Deportivo de alto rendimiento con aerodinámica avanzada',
            modelo: '../coches/Nyura Nova Sport/NovaSportNegro.glb',
            escalado: { modelo: 2.0, camera: 4.5, plataforma: 1 },
            colores: [
                { id: 'negro', nombre: 'Negro', hex: '#1a1a1a', material: 'carroceria', modelo: '../coches/Nyura Nova Sport/NovaSportNegro.glb' },
                { id: 'blanco', nombre: 'Blanco', hex: '#f8f8f8', material: 'carroceria', modelo: '../coches/Nyura Nova Sport/NovaSportBlanco.glb' },
                { id: 'gris', nombre: 'Gris', hex: '#6c757d', material: 'carroceria', modelo: '../coches/Nyura Nova Sport/NovaSportGris.glb' },
                { id: 'azul', nombre: 'Azul', hex: '#1f5eff', material: 'carroceria', modelo: '../coches/Nyura Nova Sport/NovaSportAzul.glb' },
                { id: 'rojo', nombre: 'Rojo', hex: '#dc143c', material: 'carroceria', modelo: '../coches/Nyura Nova Sport/NovaSportRojo.glb' }
            ],
            llantas: [
                { id: 'blanco', nombre: 'De serie', precio: 0 },
                { id: 'negro', nombre: 'Pack Dark', precio: 800 }
            ],
            paquetes: [
                {
                    id: 'adventure',
                    nombre: 'Adventure Pack',
                    descripcion: 'Suspensión elevada y equipamiento off-road',
                    precio: 5500
                },
                {
                    id: 'luxury',
                    nombre: 'Luxury Pack',
                    descripcion: 'Asientos de cuero y acabados premium',
                    precio: 8900
                }
            ],
            moneda: 'EUR',
            camaras: {
                exterior: { fov: 75, posicion: [0, 1.5, 5], target: [0, 0.5, 0] },
                interior: { fov: 75, posicion: [0, 1.9, 0.4], target: [0, 1.3, 0] }
            }
        }
    }
};
