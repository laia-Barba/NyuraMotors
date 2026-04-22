/**
 * Sistema de Configurador Universal para Múltiples Modelos
 * Permite generar configuradores dinámicamente basados en configuración
 */

import { MODELOS_CONFIG } from './modelosConfig.js';

class ConfiguradorUniversal {
    constructor(modeloId) {
        // Mapeo mínimo para no afectar a otros modelos que no estén definidos aquí
        this.modeloId = (modeloId === 'terramar') ? 'Vortex' : modeloId;
        this.configuracion = null;
        this.configuracionActual = {
            color: null,
            llantas: null,
            paquetes: []
        };
        this.precioBase = 0;
        
        // Variables de Three.js
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.model = null;
        this.modelRoot = null;
        this.controls = null;
        this.animationId = null;
        this.modelLoaded = false;

        this.groundMesh = null;
        this.grassTexture = null;

        this.currentModelPath = null;
        
        // Variables de sistema interior
        this.interiorScene = null;
        this.interiorCamera = null;
        this.interiorRenderer = null;
        this.interiorModel = null;
        this.interiorLoaded = false;
        this.interiorAnimationId = null;
        this.currentCameraMode = 'exterior';
        
        // Variables de rotación de cabeza
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.rotationX = 0;
        this.rotationY = Math.PI;

        this.isRotating = true;
        this.introAnimationId = null;
        this.introAnimationRunning = false;

        this.hasPlayedIntro = false;

        this.modelLoadToken = 0;
        
        // No llamar init() aquí: el método estático crear() se encarga de inicializar
    }
    
    async init() {
        try {
            await this.cargarConfiguracion();
            this.inicializarThreeJS();
            this.setupEventListeners();
            this.cargarModeloInicial();
            this.iniciarAnimacion();
        } catch (error) {
            console.error('Error al inicializar configurador:', error);
        }
    }
    
    async cargarConfiguracion() {
        try {
            this.configuracion = MODELOS_CONFIG.modelos[this.modeloId];
            
            if (!this.configuracion) {
                throw new Error(`Modelo ${this.modeloId} no encontrado`);
            }
            
            this.precioBase = this.configuracion.precio;
            this.configuracionActual.color = this.configuracion.colores[0].id;
            this.configuracionActual.llantas = this.configuracion.llantas[0].id;
            
        } catch (error) {
            console.error('Error cargando configuración:', error);
            throw error;
        }
    }
    
    inicializarThreeJS() {
        // Crear escena
        this.scene = new THREE.Scene();
        this.scene.background = null;
        
        // Configurar cámara
        const camaraConfig = this.configuracion.camaras.exterior;
        this.camera = new THREE.PerspectiveCamera(
            camaraConfig.fov, 
            1, 
            0.1, 
            1000
        );
        this.camera.position.set(...camaraConfig.posicion);
        this.camera.lookAt(...camaraConfig.target);
        
        // Configurar renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.physicallyCorrectLights = true;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.65;
        
        // Añadir renderer al DOM
        const container = document.getElementById('canvas-container');
        container.appendChild(this.renderer.domElement);
        this.updateRendererSize();
        
        // Configurar controles
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.enableRotate = true;
        this.controls.enablePan = false;
        this.controls.enableZoom = false;
        this.controls.minPolarAngle = Math.PI * 0.15;
        this.controls.maxPolarAngle = Math.PI * 0.52;
        this.controls.autoRotate = false;
        this.controls.target.set(...this.configuracion.camaras.exterior.target);
        this.controls.update();
        
        // Iluminación
        this.setupLighting();
    }
    
    setupLighting() {
        // Iluminación base
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
        this.scene.add(ambientLight);
        
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x6b7380, 1.05);
        hemiLight.position.set(0, 12, 0);
        this.scene.add(hemiLight);
        
        // Luz principal
        const keyLight = new THREE.DirectionalLight(0xffffff, 3.4);
        keyLight.position.set(7, 10, 8);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 60;
        keyLight.shadow.bias = -0.00015;
        this.scene.add(keyLight);
        
        // Luces de relleno
        const fillLight = new THREE.DirectionalLight(0xffffff, 2.2);
        fillLight.position.set(-8, 6, 6);
        this.scene.add(fillLight);
        
        const rimLight = new THREE.DirectionalLight(0xffffff, 1.8);
        rimLight.position.set(-6, 8, -10);
        this.scene.add(rimLight);
        
        const pointLight = new THREE.PointLight(0xffffff, 1.6, 40);
        pointLight.position.set(0, 5, 10);
        this.scene.add(pointLight);
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Botones de cámara
        document.getElementById('exteriorCameraBtn')?.addEventListener('click', () => this.showExteriorView());
        document.getElementById('interiorCameraBtn')?.addEventListener('click', () => this.showInteriorView());
        document.getElementById('backToExteriorBtn')?.addEventListener('click', () => this.showExteriorView());
        
        // Navegación por pasos
        this.setupStepNavigation();
        
        // Eventos de configuración
        this.setupConfiguracionEventListeners();
    }
    
    setupConfiguracionEventListeners() {
        // Colores
        this.configuracion.colores.forEach(color => {
            const elemento = document.querySelector(`[data-color="${color.id}"]`);
            if (elemento) {
                elemento.addEventListener('click', () => this.seleccionarColor(color.id));
            }
        });
        
        // Llantas
        this.configuracion.llantas.forEach(llanta => {
            const elemento = document.querySelector(`[data-wheel="${llanta.id}"]`);
            if (elemento) {
                elemento.addEventListener('click', () => this.seleccionarLlanta(llanta.id));
            }
        });
        
        // Paquetes
        this.configuracion.paquetes.forEach(paquete => {
            const checkbox = document.getElementById(`package-${paquete.id}`);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => this.togglePaquete(paquete.id, e.target.checked));
            }
        });
    }
    
    setupStepNavigation() {
        const steps = Array.from(document.querySelectorAll('.step-indicator .step'));
        const panels = Array.from(document.querySelectorAll('.step-panel'));
        const bottomPrevBtn = document.getElementById('bottomPrevBtn');
        const bottomNextBtn = document.getElementById('bottomNextBtn');
        
        if (steps.length === 0 || panels.length === 0) return;
        
        const maxStep = Math.max(...steps.map((s) => Number(s.dataset.step) || 0));
        let currentStep = Number((document.querySelector('.step-indicator .step.active')?.dataset.step) || 1);
        if (!Number.isFinite(currentStep) || currentStep < 1) currentStep = 1;
        
        const setActiveStep = (stepNumber) => {
            const step = Math.min(Math.max(1, Number(stepNumber) || 1), maxStep);
            currentStep = step;
            
            steps.forEach((s) => s.classList.toggle('active', Number(s.dataset.step) === step));
            panels.forEach((p) => p.classList.toggle('active', p.id === `step${step}`));
            
            if (bottomPrevBtn) bottomPrevBtn.disabled = step <= 1;
            if (bottomNextBtn) bottomNextBtn.disabled = step >= maxStep;
        };
        
        if (bottomPrevBtn) {
            bottomPrevBtn.addEventListener('click', () => setActiveStep(currentStep - 1));
        }
        if (bottomNextBtn) {
            bottomNextBtn.addEventListener('click', () => setActiveStep(currentStep + 1));
        }
        
        steps.forEach((s) => {
            s.addEventListener('click', () => setActiveStep(s.dataset.step));
        });
        
        setActiveStep(currentStep);
    }
    
    async cargarModeloInicial() {
        if (!this.configuracion) {
            throw new Error(`Configuración inválida para '${this.modeloId}'`);
        }

        const colorSeleccionado = this.configuracion.colores?.find(c => c.id === this.configuracionActual.color);
        const modeloPath = colorSeleccionado?.modelo || this.configuracion.modelo;
        if (!modeloPath) {
            throw new Error(`Configuración inválida para '${this.modeloId}': falta 'modelo'`);
        }

        await this.cargarModelo(modeloPath);
    }
    
    async cargarModelo(modeloPath) {
        if (typeof modeloPath !== 'string' || !modeloPath.trim()) {
            throw new Error(`Ruta de modelo inválida para '${this.modeloId}': ${modeloPath}`);
        }
        const loadToken = ++this.modelLoadToken;
        return new Promise((resolve, reject) => {
            const loader = new THREE.GLTFLoader();
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'flex';
            }

            console.log(`[ConfiguradorUniversal] Cargando modelo: ${modeloPath}`);

            this.modelLoaded = false;
            this.introAnimationRunning = false;
            if (this.introAnimationId) {
                cancelAnimationFrame(this.introAnimationId);
                this.introAnimationId = null;
            }
            
            // Eliminar modelo anterior si existe
            if (this.model) {
                this.scene.remove(this.model);
                this.model = null;
                this.modelRoot = null;
            }
            
            loader.load(
                modeloPath,
                (gltf) => {
                    // Si se ha lanzado otra carga posterior, ignorar esta
                    if (loadToken !== this.modelLoadToken) {
                        gltf?.scene?.traverse?.((child) => {
                            if (child.geometry) child.geometry.dispose?.();
                            const mats = child.material ? (Array.isArray(child.material) ? child.material : [child.material]) : [];
                            mats.forEach((m) => m?.dispose?.());
                        });
                        return;
                    }

                    this.model = gltf.scene;
                    this.modelRoot = this.model;
                    this.scene.add(this.model);
                    this.currentModelPath = modeloPath;
                    
                    // Ajustar escala
                    this.ajustarEscalaModelo();
                    
                    // Ajustar cámara
                    this.fitCameraToObject(this.model);

                    this.addOrUpdateGroundForObject(this.modelRoot);
                    this.modelLoaded = true;

                    // Intro en cada carga, sin mutar materiales (solo cámara/rotación)
                    this.startIntroAnimation();

                    if (loadingOverlay) {
                        loadingOverlay.style.display = 'none';
                    }
                    resolve();
                },
                (progress) => {
                    console.log('Progreso de carga:', (progress.loaded / progress.total * 100) + '%');
                },
                (error) => {
                    if (loadToken !== this.modelLoadToken) return;
                    console.error('Error cargando modelo:', error);

                    if (loadingOverlay) {
                        loadingOverlay.style.display = 'none';
                        const text = loadingOverlay.querySelector('p');
                        if (text) text.textContent = 'Error cargando modelo 3D';
                    }
                    reject(error);
                }
            );
        });
    }
    
    ajustarEscalaModelo() {
        if (!this.model) return;
        
        const box = new THREE.Box3().setFromObject(this.model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const modelScale = this.configuracion?.escalado?.modelo ?? this.configuracion?.escalado?.exterior ?? 8;
        const escala = modelScale / maxDim;
        this.model.scale.multiplyScalar(escala);
    }
    
    fitCameraToObject(object3D) {
        const box = new THREE.Box3().setFromObject(object3D);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        this.controls.target.copy(center);
        
        const fov = THREE.MathUtils.degToRad(this.camera.fov);
        const fitHeightDistance = (size.y / 2) / Math.tan(fov / 2);
        const fitWidthDistance = (size.x / 2) / (Math.tan(fov / 2) * this.camera.aspect);
        const cameraFit = this.configuracion?.escalado?.camera ?? 4.35;
        const distance = cameraFit * Math.max(fitHeightDistance, fitWidthDistance);
        
        this.camera.position.set(center.x, center.y + size.y * 0.5, center.z + distance);
        this.camera.near = Math.max(0.01, distance / 100);
        this.camera.far = Math.max(1000, distance * 100);
        this.camera.updateProjectionMatrix();
        
        this.controls.update();
    }

    addOrUpdateGroundForObject(object3D) {
        if (!this.scene || !object3D) return;

        if (this.groundMesh) {
            this.scene.remove(this.groundMesh);
            this.groundMesh.traverse?.((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
                    else child.material.dispose();
                }
            });
            this.groundMesh = null;
        }

        const box = new THREE.Box3().setFromObject(object3D);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const pad = 0.15;
        const radius = Math.min(3.0, Math.max(1.4, (Math.max(size.x, size.z) / 2) + pad));

        if (!this.grassTexture) {
            const textureLoader = new THREE.TextureLoader();
            const grassUrl = new URL('../../Imagenes/grass.jpg', import.meta.url);
            this.grassTexture = textureLoader.load(String(grassUrl), (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(2, 2);
            });
        }

        const geometry = new THREE.CircleGeometry(radius, 64);
        const material = new THREE.MeshStandardMaterial({
            map: this.grassTexture,
            roughness: 0.1,
            metalness: 0.0,
        });
        const base = new THREE.Mesh(geometry, material);
        base.rotation.x = -Math.PI / 2;
        base.receiveShadow = true;
        base.castShadow = false;

        const ringInner = radius * 0.995;
        const ringOuter = radius * 1.01;
        const ringGeometry = new THREE.RingGeometry(ringInner, ringOuter, 128);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(1, 0, 0),
            side: THREE.DoubleSide,
            toneMapped: false,
        });
        const colorRing = new THREE.Mesh(ringGeometry, ringMaterial);
        colorRing.rotation.x = -Math.PI / 2;
        colorRing.position.y = 0.003;
        colorRing.receiveShadow = true;
        colorRing.castShadow = false;

        this.groundMesh = new THREE.Group();
        this.groundMesh.add(base);
        this.groundMesh.add(colorRing);
        this.groundMesh.position.set(center.x, box.min.y - 0.02, center.z);
        this.scene.add(this.groundMesh);
    }

    startIntroAnimation() {
        if (!this.camera || !this.controls) return;
        if (!this.modelLoaded || !this.modelRoot) return;
        if (this.introAnimationRunning) return;

        this.introAnimationRunning = true;

        const duration = 1400;
        const startTime = performance.now();

        const root = this.modelRoot || this.model;
        const initialRotation = root.rotation.y;
        const initialCameraPos = this.camera.position.clone();
        const farCameraPos = initialCameraPos.clone().multiplyScalar(2.25);
        const finalCameraPos = initialCameraPos.clone();

        this.camera.position.copy(farCameraPos);
        root.rotation.y = initialRotation;

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        const animateIntro = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const eased = easeOutCubic(progress);
            this.camera.position.lerpVectors(farCameraPos, finalCameraPos, eased);

            // Giro tipo Thunder durante la intro
            root.rotation.y = initialRotation + (Math.PI * 2 * eased);

            if (progress > 0.9) {
                const bounceProgress = (progress - 0.9) / 0.1;
                const bounce = Math.sin(bounceProgress * Math.PI) * 0.015;
                this.camera.position.y += bounce;
            }

            this.controls.update();

            if (progress < 1) {
                this.introAnimationId = requestAnimationFrame(animateIntro);
                return;
            }

            this.camera.position.copy(finalCameraPos);
            this.controls.update();

            this.introAnimationRunning = false;
            this.introAnimationId = null;
            this.hasPlayedIntro = true;
        };

        this.introAnimationId = requestAnimationFrame(animateIntro);
    }
    
    async seleccionarColor(colorId) {
        const color = this.configuracion.colores.find(c => c.id === colorId);
        if (!color || color.id === this.configuracionActual.color) return;
        
        this.configuracionActual.color = colorId;
        
        // Actualizar UI
        document.querySelectorAll('.color-option').forEach(el => {
            el.classList.toggle('active', el.dataset.color === colorId);
        });

        // Si el color tiene un GLB específico, siempre recargar ese modelo
        if (color.modelo) {
            await this.cargarModelo(color.modelo);
        }

        this.actualizarPrecio();
    }
    
    seleccionarLlanta(llantaId) {
        const llanta = this.configuracion.llantas.find(l => l.id === llantaId);
        if (!llanta) return;
        
        this.configuracionActual.llantas = llantaId;
        
        // Actualizar UI
        document.querySelectorAll('.wheel-option').forEach(el => {
            el.classList.toggle('active', el.dataset.wheel === llantaId);
        });
        
        this.actualizarPrecio();
    }
    
    togglePaquete(paqueteId, activado) {
        const index = this.configuracionActual.paquetes.indexOf(paqueteId);
        
        if (activado && index === -1) {
            this.configuracionActual.paquetes.push(paqueteId);
        } else if (!activado && index !== -1) {
            this.configuracionActual.paquetes.splice(index, 1);
        }
        
        this.actualizarPrecio();
    }
    
    actualizarPrecio() {
        let precioTotal = this.precioBase;
        
        // Sumar precio de llantas
        const llanta = this.configuracion.llantas.find(l => l.id === this.configuracionActual.llantas);
        if (llanta) {
            precioTotal += llanta.precio;
        }
        
        // Sumar precio de paquetes
        this.configuracionActual.paquetes.forEach(paqueteId => {
            const paquete = this.configuracion.paquetes.find(p => p.id === paqueteId);
            if (paquete) {
                precioTotal += paquete.precio;
            }
        });
        
        // Actualizar UI
        const precioElement = document.querySelector('.price-value');
        if (precioElement) {
            precioElement.textContent = this.formatearPrecio(precioTotal);
        }
    }
    
    formatearPrecio(precio) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: this.configuracion.moneda
        }).format(precio);
    }
    
    // Métodos de vista (similar a los existentes pero adaptados)
    showExteriorView() {
        // Implementación similar a la existente
        this.currentCameraMode = 'exterior';
        // Resetear interiorLoaded
        this.interiorLoaded = false;
        // Resto de la lógica...
    }
    
    showInteriorView() {
        // Implementación similar a la existente
        this.currentCameraMode = 'interior';
        if (!this.interiorLoaded) {
            this.initInteriorView();
        }
    }
    
    initInteriorView() {
        // Implementación similar a la existente pero usando configuración
        const camaraConfig = this.configuracion.camaras.interior;
        // Resto de la lógica...
    }
    
    updateRendererSize() {
        if (!this.renderer || !this.camera) return;
        
        const container = document.getElementById('canvas-container');
        if (!container) return;
        
        const width = Math.max(1, container.clientWidth);
        const height = Math.max(1, container.clientHeight);
        
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
    
    onWindowResize() {
        this.updateRendererSize();
    }
    
    iniciarAnimacion() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);

            // Rotación automática del modelo (solo en vista exterior)
            if (this.isRotating && this.modelLoaded && this.currentCameraMode === 'exterior') {
                const root = this.modelRoot || this.model;
                if (root) {
                    root.rotation.y += 0.005;
                }
            }
            
            if (this.controls) {
                this.controls.update();
            }
            
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        };
        
        animate();
    }
    
    // Método estático para inicializar el configurador
    static async crear(modeloId) {
        const configurador = new ConfiguradorUniversal(modeloId);
        await configurador.init();
        return configurador;
    }
}

// Exportar para ES6 modules y uso global
export { ConfiguradorUniversal };
window.ConfiguradorUniversal = ConfiguradorUniversal;
