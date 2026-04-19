/**
 * Sistema de Configurador Universal para Múltiples Modelos
 * Permite generar configuradores dinámicamente basados en configuración JSON
 */

class ConfiguradorUniversal {
    constructor(modeloId) {
        this.modeloId = modeloId;
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
        
        this.init();
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
            const response = await fetch('../controlador/configuracion/modelos.json');
            const data = await response.json();
            this.configuracion = data.modelos[this.modeloId];
            
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
        const colorSeleccionado = this.configuracion.colores.find(c => c.id === this.configuracionActual.color);
        if (colorSeleccionado) {
            await this.cargarModelo(colorSeleccionado.modelo);
        }
    }
    
    async cargarModelo(modeloPath) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.GLTFLoader();
            
            // Eliminar modelo anterior si existe
            if (this.model) {
                this.scene.remove(this.model);
                this.model = null;
                this.modelRoot = null;
            }
            
            loader.load(
                modeloPath,
                (gltf) => {
                    this.model = gltf.scene;
                    this.modelRoot = this.model;
                    this.scene.add(this.model);
                    
                    // Ajustar escala
                    this.ajustarEscalaModelo();
                    
                    // Ajustar cámara
                    this.fitCameraToObject(this.model);
                    
                    this.modelLoaded = true;
                    resolve();
                },
                (progress) => {
                    console.log('Progreso de carga:', (progress.loaded / progress.total * 100) + '%');
                },
                (error) => {
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
        const escala = this.configuracion.escalado.exterior / maxDim;
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
        const distance = this.configuracion.escalado.exterior * Math.max(fitHeightDistance, fitWidthDistance);
        
        this.camera.position.set(center.x, center.y + size.y * 0.5, center.z + distance);
        this.camera.near = Math.max(0.01, distance / 100);
        this.camera.far = Math.max(1000, distance * 100);
        this.camera.updateProjectionMatrix();
        
        this.controls.update();
    }
    
    async seleccionarColor(colorId) {
        const color = this.configuracion.colores.find(c => c.id === colorId);
        if (!color || color.id === this.configuracionActual.color) return;
        
        this.configuracionActual.color = colorId;
        
        // Actualizar UI
        document.querySelectorAll('.color-option').forEach(el => {
            el.classList.toggle('active', el.dataset.color === colorId);
        });
        
        // Cargar nuevo modelo
        await this.cargarModelo(color.modelo);
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
