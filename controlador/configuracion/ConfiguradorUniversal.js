/**
 * Sistema de Configurador Universal para Múltiples Modelos
 * Permite generar configuradores dinámicamente basados en configuración
 */

import { MODELOS_CONFIG } from './modelosConfig.js';

class ConfiguradorUniversal {
    constructor(modeloId) {
        // Mapeo de modelos para asegurar IDs correctos
        const modeloMap = {
            'terramar': 'Vortex',
            'altamira': 'Altamira',
            'nova': 'Nova',
            'nova-sport': 'NovaSport'
        };
        this.modeloId = modeloMap[modeloId] || modeloId;
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
        
        // Variables para gestión de llantas
        this.originalWheelColors = []; // Guardar colores originales de las llantas
        
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

    isWheelPart(mesh, material) {
        const meshName = (mesh?.name || '').toLowerCase();
        const matName = (material?.name || '').toLowerCase();
        const isNova = String(this.modeloId || '').toLowerCase() === 'nova';

        const genericWheelMatch = (
            meshName.includes('wheel') ||
            meshName.includes('rim') ||
            meshName.includes('llanta') ||
            meshName.includes('tire') ||
            meshName.includes('tyre') ||
            matName.includes('wheel') ||
            matName.includes('rim') ||
            matName.includes('llanta') ||
            matName.includes('tire') ||
            matName.includes('tyre')
        );

        if (genericWheelMatch) return true;

        // Ajuste específico para Nova: en el GLB, la llanta (hub) usa material "chrome"
        // y el mesh suele contener "hub_mesh".
        // Lo restringimos a Nova para no afectar cromados de otros modelos.
        if (!isNova) return false;

        return (
            meshName.includes('hub') ||
            meshName.includes('hub_mesh') ||
            matName.includes('chrome')
        );
    }

    ensureUniqueWheelMaterials() {
        if (!this.model) return;

        this.model.traverse((child) => {
            if (!child.isMesh || !child.material) return;
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            const hasWheelMaterial = materials.some((mat) => this.isWheelPart(child, mat));
            if (!hasWheelMaterial) return;

            if (Array.isArray(child.material)) {
                child.material = child.material.map((mat) => {
                    if (!this.isWheelPart(child, mat)) return mat;
                    return mat?.clone ? mat.clone() : mat;
                });
            } else {
                const mat = child.material;
                if (this.isWheelPart(child, mat) && mat?.clone) {
                    child.material = mat.clone();
                }
            }
        });
    }
    
    async init() {
        try {
            await this.cargarConfiguracion();
            this.inicializarThreeJS();
            this.setupEventListeners();
            await this.cargarModeloInicial();
            // Ocultar overlay de carga inicial
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            this.startIntroAnimation();
            this.iniciarAnimacion();
        } catch (error) {
            console.error('Error al inicializar configurador:', error);
            // Ocultar overlay incluso en caso de error
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
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
            this.configuracionActual.llantas = this.configuracion.llantas?.[0]?.id || 'original';
            
            // Actualizar precio inicial
            this.actualizarPrecio();
            
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
        // Limpiar luces existentes
        this.scene.traverse((child) => {
            if (child.isLight) {
                this.scene.remove(child);
            }
        });

        // Ajustar intensidad según modelo para Nova
        const isNova = String(this.modeloId || '').toLowerCase() === 'nova';
        const ambientIntensity = isNova ? 0.4 : 0.6;
        const directionalIntensity = isNova ? 0.5 : 0.8;
        const fillIntensity = isNova ? 0.2 : 0.3;
        const accentIntensity = isNova ? 0.1 : 0.2;

        // Luz ambiental suave
        const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
        this.scene.add(ambientLight);

        // Luz direccional principal
        const directionalLight = new THREE.DirectionalLight(0xffffff, directionalIntensity);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        this.scene.add(directionalLight);

        // Luz de relleno desde arriba
        const fillLight = new THREE.DirectionalLight(0xffffff, fillIntensity);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);

        // Luz de acento lateral
        const accentLight = new THREE.DirectionalLight(0xffffff, accentIntensity);
        accentLight.position.set(5, 2, -5);
        this.scene.add(accentLight);
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
            // SIN loading overlay para cambios rápidos y optimizados

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

                    this.ensureUniqueWheelMaterials();

                    // Guardar colores originales de las llantas
                    this.saveOriginalWheelColors();
                    
                    // Ajustar escala
                    this.ajustarEscalaModelo();
                    
                    // Ajustar cámara
                    this.fitCameraToObject(this.model);

                    this.addOrUpdateGroundForObject(this.modelRoot);
                    this.modelLoaded = true;

                    // Aplicar configuración de llantas por defecto
                    this.updateModelWheels(this.configuracionActual.llantas);

                    resolve();
                },
                (progress) => {
                    console.log('Progreso de carga:', (progress.loaded / progress.total * 100) + '%');
                },
                (error) => {
                    if (loadToken !== this.modelLoadToken) return;
                    console.error('Error cargando modelo:', error);

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
        const baseRadius = Math.min(3.0, Math.max(1.4, (Math.max(size.x, size.z) / 2) + pad));
        const platformScale = this.configuracion?.escalado?.plataforma ?? 1;
        const radius = Math.max(0.5, baseRadius * platformScale);

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
        if (!this.modelLoaded) return;
        // Guardar posiciones iniciales
        const root = this.modelRoot || this.model;
        const initialRotation = root.rotation.y;
        const initialCameraPos = this.camera.position.clone();
        const farCameraPos = initialCameraPos.clone().multiplyScalar(2.5);
        const finalCameraPos = initialCameraPos.clone();

        this.camera.position.copy(farCameraPos);
        root.rotation.y = 0;

        // Si ya se ha reproducido la intro, solo cámara/rotación (sin tocar materiales)
        if (this.hasPlayedIntro) {
            const duration = 1400;
            const startTime = performance.now();
            const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

            const animateIntro = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = easeOutCubic(progress);
                this.camera.position.lerpVectors(farCameraPos, finalCameraPos, eased);
                root.rotation.y = initialRotation + (Math.PI * 2 * eased);
                if (progress > 0.9) {
                    const bounceProgress = (progress - 0.9) / 0.1;
                    const bounce = Math.sin(bounceProgress * Math.PI) * 0.015;
                    this.camera.position.y += bounce;
                }
                this.controls.update();
                if (progress < 1) {
                    requestAnimationFrame(animateIntro);
                    return;
                }
                this.camera.position.copy(finalCameraPos);
                this.controls.update();
            };
            animateIntro();
            return;
        }

        // === INTRO SOLO CÁMARA (SIN TOCAR MATERIALES) ===
        const duration = 4000; // 4 segundos para la animación completa
        const startTime = Date.now();
        const animateIntro = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Easing functions
            const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
            const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            const easeOutElastic = (t) => {
                const c4 = (2 * Math.PI) / 3;
                return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
            };
            // Fase 1: Zoom de cámara (0-50% de la animación)
            const zoomProgress = Math.min(progress / 0.5, 1);
            const easedZoom = easeOutCubic(zoomProgress);
            this.camera.position.lerpVectors(farCameraPos, finalCameraPos, easedZoom);
            // SIN FADE DE MATERIALES - solo cámara para evitar cambios en interior/asientos
            // Fase 3: Rotación suave del coche (60-100% de la animación)
            const rotationProgress = Math.min(Math.max((progress - 0.6) / 0.4, 0), 1);
            const easedRotation = easeOutCubic(rotationProgress);
            root.rotation.y = initialRotation + (Math.PI * 2 * easedRotation);
            // Fase 4: Efecto de "bounce" final (90-100% de la animación)
            if (progress > 0.9) {
                const bounceProgress = (progress - 0.9) / 0.1;
                const bounce = Math.sin(bounceProgress * Math.PI) * 0.015;
                this.camera.position.y += bounce;
            }
        // Actualizar controles
        this.controls.update();
        if (progress < 1) {
            requestAnimationFrame(animateIntro);
        } else {
            // Posición final exacta
            this.camera.position.copy(finalCameraPos);
            this.controls.update();
            // SIN EFECTOS DE MATERIALES para evitar cambios en interior/asientos
            this.hasPlayedIntro = true;
        }
    }
    // Iniciar la animación
    animateIntro();
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
        
        // Actualizar modelo 3D de llantas
        this.updateModelWheels(llantaId);
        
        this.actualizarPrecio();
    }
    
    updateModelWheels(wheelType) {
        console.log('Cambiando tipo de llantas a:', wheelType);
        if (!this.modelLoaded || !this.model) return;
        
        let wheelsFound = 0;
        let wheelsChanged = 0;
        
        // Recorrer todo el modelo y buscar llantas
        this.model.traverse((child) => {
            if (!child.isMesh || !child.material) return;
            const materials = Array.isArray(child.material) ? child.material : [child.material];

            materials.forEach((mat) => {
                const isWheel = this.isWheelPart(child, mat);
                
                if (isWheel) {
                    wheelsFound++;
                    console.log('LLANTA ENCONTRADA:', (child.name || ''));
                    
                    if (mat.color) {
                        if (wheelType === 'original') {
                            // Restaurar colores originales
                            this.restoreOriginalWheels();
                            wheelsChanged++;
                            console.log('Restaurando llantas a estado original:', (child.name || ''));
                            return;
                        }

                        if (wheelType === 'blanco') {
                            mat.color.setHex(0xffffff);
                            mat.roughness = 0.35;
                            mat.metalness = 0.0;
                        } else if (wheelType === 'negro') {
                            mat.color.setHex(0x000000);
                            mat.roughness = 1.0;
                            mat.metalness = 0.0;
                        } else if (wheelType === 'gris') {
                            mat.color.setHex(0x777777);
                            mat.roughness = 0.65;
                            mat.metalness = 0.15;
                        } else if (wheelType === 'serie') {
                            // Para serie (acero), aplicar negro completamente oscuro
                            mat.color.setHex(0x000000);
                            mat.roughness = 1.0;
                            mat.metalness = 0.0;
                        } else if (wheelType === 'offroad') {
                            // Para offroad, aplicar color gris oscuro metalizado
                            mat.color.setHex(0x444444);
                            mat.roughness = 0.5;
                            mat.metalness = 0.8;
                        }

                        if (mat.emissive) {
                            mat.emissive.setHex(0x000000);
                            mat.emissiveIntensity = 0;
                        }
                        if (wheelType === 'negro' || wheelType === 'serie') {
                            if (typeof mat.envMapIntensity === 'number') {
                                mat.envMapIntensity = 0;
                            }
                        }
                        mat.needsUpdate = true;
                        wheelsChanged++;
                    }
                }
            });
        });
        
        console.log(`Llantas encontradas: ${wheelsFound}, Llantas cambiadas: ${wheelsChanged}`);
        console.log(`Tipo de llantas cambiado a ${wheelType}`);
    }
    
    saveOriginalWheelColors() {
        // Limpiar colores originales anteriores
        this.originalWheelColors = [];
        
        if (!this.model) return;
        
        this.model.traverse((child) => {
            if (!child.isMesh || !child.material) return;
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            
            materials.forEach((mat) => {
                const isWheel = this.isWheelPart(child, mat);
                
                if (isWheel && mat.color) {
                    this.originalWheelColors.push({
                        mesh: child,
                        material: mat,
                        originalColor: mat.color.getHex(),
                        originalRoughness: mat.roughness,
                        originalMetalness: mat.metalness
                    });
                }
            });
        });
        
        console.log('Colores originales de llantas guardados:', this.originalWheelColors.length);
    }
    
    restoreOriginalWheels() {
        console.log('Restaurando colores originales de llantas...');
        let wheelsRestored = 0;
        
        this.originalWheelColors.forEach((wheelData) => {
            if (wheelData.material && wheelData.material.color) {
                wheelData.material.color.setHex(wheelData.originalColor);
                wheelData.material.roughness = wheelData.originalRoughness;
                wheelData.material.metalness = wheelData.originalMetalness;
                wheelData.material.needsUpdate = true;
                wheelsRestored++;
            }
        });
        
        console.log(`Llantas restauradas: ${wheelsRestored}`);
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
    
        
    showInteriorView() {
        const layout = document.querySelector('.configurator-layout');
        const viewerPanel = document.querySelector('.viewer-panel');
        const configPanel = document.querySelector('.config-panel');
        const interiorView = document.getElementById('interiorView');
        const exteriorBtn = document.getElementById('exteriorCameraBtn');
        const interiorBtn = document.getElementById('interiorCameraBtn');
        const exteriorContainer = document.getElementById('canvas-container');
        const interiorContainer = document.getElementById('interior-canvas-container');
        
        viewerPanel.style.display = 'none';
        if (configPanel) configPanel.style.display = 'none';
        interiorView.style.display = 'block';
        
        // Expandir interior para ocupar todo el ancho
        if (layout) {
            layout.style.alignItems = 'stretch';
        }
        if (interiorView) {
            interiorView.style.flex = '1 1 auto';
            interiorView.style.width = '100%';
            interiorView.style.maxWidth = '100%';
        }
        
        exteriorBtn.classList.remove('active');
        interiorBtn.classList.add('active');
        
        this.currentCameraMode = 'interior';
        
        if (!this.interiorLoaded) {
            this.initInteriorView();
        }
    }
    
    showExteriorView() {
        const layout = document.querySelector('.configurator-layout');
        const viewerPanel = document.querySelector('.viewer-panel');
        const configPanel = document.querySelector('.config-panel');
        const interiorView = document.getElementById('interiorView');
        const exteriorBtn = document.getElementById('exteriorCameraBtn');
        const interiorBtn = document.getElementById('interiorCameraBtn');
        const exteriorContainer = document.getElementById('canvas-container');
        const interiorContainer = document.getElementById('interior-canvas-container');
        
        viewerPanel.style.display = 'block';
        if (configPanel) configPanel.style.display = 'block';
        interiorView.style.display = 'none';
        
        // Restaurar estilos de layout
        if (layout) {
            layout.style.alignItems = '';
        }
        if (interiorView) {
            interiorView.style.flex = '';
            interiorView.style.width = '';
            interiorView.style.maxWidth = '';
        }
        
        exteriorBtn.classList.add('active');
        interiorBtn.classList.remove('active');
        
        this.currentCameraMode = 'exterior';
        
        // Detener animación interior
        if (this.interiorAnimationId) {
            cancelAnimationFrame(this.interiorAnimationId);
            this.interiorAnimationId = null;
        }
        
        // Resetear variables del sistema interior
        this.interiorLoaded = false;
        
        // Limpiar contenedor interior
        if (interiorContainer) {
            interiorContainer.innerHTML = '<div class="loading-overlay" id="interiorLoadingOverlay"><div class="loading-spinner"></div><p>Cargando vista interior...</p></div>';
        }
        
        // Asegurar que el renderer exterior esté en su contenedor
        if (this.renderer && exteriorContainer && !exteriorContainer.contains(this.renderer.domElement)) {
            exteriorContainer.innerHTML = '';
            exteriorContainer.appendChild(this.renderer.domElement);
        }
        
        // Ajustar tamaño del renderer exterior
        if (this.renderer && exteriorContainer) {
            const width = Math.max(1, exteriorContainer.clientWidth);
            const height = Math.max(1, exteriorContainer.clientHeight);
            this.renderer.setSize(width, height);
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
        
        // Restaurar controles exteriores
        if (this.controls) {
            this.controls.enableRotate = true;
            this.controls.enablePan = false;
            this.controls.enableZoom = false;
            this.controls.object = this.camera;
            this.controls.update();
        }
    }
    
    initInteriorView() {
        const container = document.getElementById('interior-canvas-container');
        const loadingOverlay = document.getElementById('interiorLoadingOverlay');
        
        // Crear escena independiente para interior
        this.interiorScene = new THREE.Scene();
        this.interiorScene.background = null;
        
        // Variables para rotación de cabeza
        this.rotationX = 0;
        this.rotationY = Math.PI;
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        
        // Crear cámara independiente para interior
        this.interiorCamera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        const camaraConfig = this.configuracion.camaras.interior;
        this.interiorCamera.position.set(...camaraConfig.posicion);
        this.interiorCamera.lookAt(...camaraConfig.target);
        
        // Crear renderer independiente para interior
        this.interiorRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.interiorRenderer.setPixelRatio(window.devicePixelRatio);
        this.interiorRenderer.setSize(container.clientWidth, container.clientHeight);
        this.interiorRenderer.shadowMap.enabled = true;
        this.interiorRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.interiorRenderer.setClearColor(0x000000, 0);
        this.interiorRenderer.physicallyCorrectLights = true;
        this.interiorRenderer.outputEncoding = THREE.sRGBEncoding;
        this.interiorRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.interiorRenderer.toneMappingExposure = 1.65;
        
        container.innerHTML = '';
        container.appendChild(this.interiorRenderer.domElement);
        
        // Sistema de rotación de cabeza
        this.setupInteriorControls();
        
        // Configurar iluminación para interior
        this.setupInteriorLighting();
        
        // Cargar el modelo para vista interior
        this.loadInteriorModel();
        
        // Ocultar loading
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        this.interiorLoaded = true;
    }
    
    setupInteriorControls() {
        const canvas = this.interiorRenderer.domElement;
        
        canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const deltaX = e.clientX - this.previousMousePosition.x;
            const deltaY = e.clientY - this.previousMousePosition.y;
            
            // Rotación horizontal (cabeza de lado a lado)
            this.rotationY += deltaX * 0.005;
            
            // Rotación vertical (mira arriba/abajo)
            this.rotationX += -deltaY * 0.005;
            
            // Limitar rotación vertical a ±30 grados
            this.rotationX = Math.max(-Math.PI/6, Math.min(Math.PI/6, this.rotationX));
            
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });
    }
    
    setupInteriorLighting() {
        // Iluminación base para interior
        const interiorAmbient = new THREE.AmbientLight(0xffffff, 1.2);
        this.interiorScene.add(interiorAmbient);
        
        const interiorDirectional = new THREE.DirectionalLight(0xffffff, 2.0);
        interiorDirectional.position.set(5, 5, 5);
        this.interiorScene.add(interiorDirectional);
    }
    
    loadInteriorModel() {
        // Usar el mismo modelo que el exterior pero configurado para vista interior
        const colorSeleccionado = this.configuracion.colores?.find(c => c.id === this.configuracionActual.color);
        const modeloPath = colorSeleccionado?.modelo || this.configuracion.modelo;
        
        const loader = new THREE.GLTFLoader();
        loader.load(
            modeloPath,
            (gltf) => {
                // Eliminar modelo anterior si existe
                if (this.interiorModel) {
                    this.interiorScene.remove(this.interiorModel);
                }
                
                this.interiorModel = gltf.scene;
                
                // Posicionar y escalar modelo para vista interior
                this.interiorModel.position.set(0, 0, 0);
                this.interiorModel.rotation.y = Math.PI; // Girar para vista interior
                
                // Escalar el modelo apropiadamente para interior
                const box = new THREE.Box3().setFromObject(this.interiorModel);
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 8 / maxDim; // Ajustar escala para vista interior
                this.interiorModel.scale.multiplyScalar(scale);
                
                this.interiorScene.add(this.interiorModel);
                
                // Iniciar animación de interior
                this.animateInterior();
            },
            (progress) => {
                console.log('Interior loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading interior model:', error);
            }
        );
    }
    
    animateInterior() {
        this.interiorAnimationId = requestAnimationFrame(() => this.animateInterior());
        
        // Aplicar rotación de cabeza a la cámara
        if (this.interiorCamera) {
            // Posición base fija
            const basePosition = new THREE.Vector3(...this.configuracion.camaras.interior.posicion);
            this.interiorCamera.position.copy(basePosition);
            
            // Calcular punto de mira basado en rotación de cabeza
            const lookDirection = new THREE.Vector3(0, 0, 1);
            const upAxis = new THREE.Vector3(0, 1, 0);
            
            // Yaw (giro izquierda/derecha) sobre el eje Y global
            const yawQuat = new THREE.Quaternion().setFromAxisAngle(upAxis, this.rotationY);
            lookDirection.applyQuaternion(yawQuat);
            
            // Pitch (arriba/abajo) sobre el eje X LOCAL tras aplicar yaw
            const rightAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(yawQuat).normalize();
            lookDirection.applyAxisAngle(rightAxis, this.rotationX);
            
            // Calcular punto final de mira
            const target = new THREE.Vector3(...this.configuracion.camaras.interior.target);
            const finalTarget = target.clone().add(lookDirection);
            
            this.interiorCamera.lookAt(finalTarget);
        }
        
        if (this.interiorRenderer && this.interiorScene && this.interiorCamera) {
            this.interiorRenderer.render(this.interiorScene, this.interiorCamera);
        }
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
