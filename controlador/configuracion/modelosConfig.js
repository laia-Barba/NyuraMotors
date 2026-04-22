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
                { id: 'serie', nombre: 'Serie', precio: 0 },
                { id: 'offroad', nombre: 'Off-Road', precio: 1500 }
            ],
            paquetes: [],
            camaras: {
                exterior: { fov: 75, posicion: [0, 1.5, 5], target: [0, 0.5, 0] },
                interior: { fov: 75, posicion: [0, 0.6, -0.5], target: [0, 0.6, 2] }
            }
        }
    }
};
