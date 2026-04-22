/**
 * Generador HTML Dinámico para Configuradores
 * Crea la estructura HTML basada en la configuración JSON
 */

class GeneradorHTML {
    constructor(configuracion) {
        this.config = configuracion;
    }
    
    generarHTML() {
        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nyura Motors - Configurador 3D ${this.config.nombre}</title>
    <link rel="stylesheet" href="EstiloPrincipal.css">
    <link rel="stylesheet" href="header-unique.css">
    <link rel="stylesheet" href="configurador3d.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&family=Poppins:wght@500;700;800&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <nav>
            <!-- Logo como imagen -->
            <a href="home.html"><img src="../Imagenes/LogoBlancoNyura.png" alt="Nyura Motors" class="logo-img"></a>
            <ul>
                <li><a href="home.html">Inicio</a></li>
                <li><a href="modelos.html" id="modelosLink">Modelos</a></li>
                <li><a href="Configurador3D.html" class="active">Configurador 3D</a></li>
                <li><a href="contacto.html">Contacto</a></li>
                <li id="authMenu"><a href="InicioSesion.html"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="width: 16px; height: 16px; vertical-align: -2px; margin-right: 6px;"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.41 0-8 2-8 4.5V21h16v-2.5c0-2.5-3.59-4.5-8-4.5Z"/></svg>Iniciar sesión</a></li>
            </ul>
        </nav>
    </header>
    <main class="configurator-container" style="margin-top: 60px;">
        <div class="configurator-layout">
            <!-- Panel izquierdo - Visualizador 3D -->
            <div class="viewer-panel">
                <!-- Botones de selección de cámara -->
                <div class="camera-selector">
                    <button class="camera-btn active" data-camera="exterior" id="exteriorCameraBtn">
                        Exterior
                    </button>
                    <button class="camera-btn" data-camera="interior" id="interiorCameraBtn">
                        Interior
                    </button>
                </div>
                <div id="canvas-container">
                    <div class="loading-overlay" id="loadingOverlay">
                        <div class="loading-spinner"></div>
                        <p>Cargando modelo 3D...</p>
                    </div>
                </div>
            </div>
            <!-- Vista Interior (oculta por defecto) -->
            <div class="interior-view" id="interiorView" style="display: none;">
                <!-- Botón para volver a vista exterior -->
                <div class="back-to-exterior">
                    <button class="back-btn" id="backToExteriorBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px; margin-right: 6px;">
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                        </svg>
                        Volver al Exterior
                    </button>
                </div>
                <div id="interior-canvas-container">
                    <div class="loading-overlay" id="interiorLoadingOverlay">
                        <div class="loading-spinner"></div>
                        <p>Cargando vista interior...</p>
                    </div>
                </div>
            </div>
            <!-- Panel derecho - Configuración por Pasos -->
            <div class="config-panel">
                <div class="config-header">
                    <h3>Personaliza tu 
                        <br>
                        ${this.config.nombre}</h3>
                    <div class="price-display">
                        <span class="price-label">Precio</span>
                        <span class="price-value">${this.formatearPrecio(this.config.precio)}</span>
                    </div>
                    
                    <!-- Indicador de Pasos -->
                    <div class="step-indicator">
                        <div class="step active" data-step="1">
                            <span class="step-number">1</span>
                            <span class="step-title">Color</span>
                        </div>
                        <div class="step" data-step="2">
                            <span class="step-number">2</span>
                            <span class="step-title">Llantas</span>
                        </div>
                        <div class="step" data-step="3">
                            <span class="step-number">3</span>
                            <span class="step-title">Paquetes</span>
                        </div>
                    </div>
                </div>
                
                <!-- Contenido de Pasos -->
                <div class="step-content">
                    ${this.generarPasoColores()}
                    ${this.generarPasoLlantas()}
                    ${this.generarPasoPaquetes()}
                </div>
                
                <!-- Botones de Acción -->
                <div class="action-buttons">
                    <button class="nav-btn nav-prev" id="bottomPrevBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
                            <path d="M15.41 7.41L14 6l-1.41 1.41L14 8.17l1.42 1.41L15.41 10l1.41 1.41L14 12.17l1.42 1.42L15.41 14l1.41 1.41L14 15.17l1.42 1.42z"/>
                        </svg>
                        Anterior
                    </button>
                    <button class="nav-btn nav-next" id="bottomNextBtn">
                        Siguiente
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
                            <path d="M8.59 16.59L10 18l1.41 1.41L10 15.83l-1.42-1.41L8.59 14l-1.41-1.41L10 11.83l1.42-1.42L8.59 10l-1.41-1.41L10 8.17l1.42-1.42L8.59 6l1.41-1.41L10 4.83l1.42-1.42z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </main>
    
    <!-- Footer (compartido) -->
    ${this.generarFooter()}
    
    <!-- Popup de confirmación personalizado -->
    <div id="exitConfirmationPopup" class="exit-confirmation-popup">
        <div class="popup-content">
            <h3>¿Salir de vista interior?</h3>
            <p>¿Estás seguro de que quieres salir de la vista interior y volver a la vista exterior?</p>
            <div class="popup-buttons">
                <button class="popup-btn cancel-btn" id="cancelExitBtn">Cancelar</button>
                <button class="popup-btn confirm-btn" id="confirmExitBtn">Salir</button>
            </div>
        </div>
    </div>

    <!-- Three.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    <script type="module">
        import { getCurrentUser, createOrUpdateUserProfile, onAuthStateChange, signOut, getUserByEmail } from '../controlador/BBDD/SupabaseCliente.js';
        import { ConfiguradorUniversal } from '../controlador/configuracion/ConfiguradorUniversal.js';
        
        // Inicializar configurador para este modelo
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                const modeloId = '${this.obtenerModeloId()}';
                const configurador = await ConfiguradorUniversal.crear(modeloId);
                window.configurador = configurador;
            } catch (error) {
                console.error('Error al inicializar configurador:', error);
            }
        });
    </script>
</body>
</html>`;
    }
    
    generarPasoColores() {
        let html = `
                    <!-- Paso 1: Color -->
                    <div class="step-panel active" id="step1">
                        <h4>1. Elige tu Color Exterior</h4>
                        <div class="color-options">`;
        
        this.config.colores.forEach(color => {
            const activeClass = color.id === this.config.colores[0].id ? 'active' : '';
            html += `
                            <div class="color-option ${activeClass}" data-color="${color.id}" title="${color.nombre}">
                                <div class="color-swatch" style="background: ${color.gradiente};"></div>
                                <span>${color.nombre}</span>
                            </div>`;
        });
        
        html += `
                        </div>
                    </div>`;
        
        return html;
    }
    
    generarPasoLlantas() {
        let html = `
                    <!-- Paso 2: Llantas -->
                    <div class="step-panel" id="step2">
                        <h4>2. Elige tus Llantas</h4>
                        <div class="wheel-options">`;
        
        this.config.llantas.forEach((llanta, index) => {
            const activeClass = index === 0 ? 'active' : '';
            const precio = llanta.precio > 0 ? `+${this.formatearPrecio(llanta.precio)}` : 'Incluido';
            html += `
                            <div class="wheel-option ${activeClass}" data-wheel="${llanta.id}">
                                <div class="wheel-preview">
                                    <div class="wheel-icon">
                                        <img src="${llanta.imagen}" alt="${llanta.nombre}" style="width: 100%; height: 100%; object-fit: contain; background: white; border-radius: 4px;">
                                    </div>
                                </div>
                                <div class="wheel-info">
                                    <span class="wheel-name">${llanta.nombre}</span>
                                    <span class="wheel-price">${precio}</span>
                                </div>
                            </div>`;
        });
        
        html += `
                        </div>
                    </div>`;
        
        return html;
    }
    
    generarPasoPaquetes() {
        let html = `
                    <!-- Paso 3: Paquetes -->
                    <div class="step-panel" id="step3">
                        <h4>3. Elige tus Paquetes Tecnológicos</h4>
                        <div class="package-options">`;
        
        this.config.paquetes.forEach(paquete => {
            const precio = `+${this.formatearPrecio(paquete.precio)}`;
            const caracteristicas = paquete.caracteristicas.map(car => `<span>· ${car}</span>`).join('');
            
            html += `
                            <div class="package-option">
                                <div class="package-header">
                                    <input type="checkbox" id="package-${paquete.id}" class="package-checkbox">
                                    <label for="package-${paquete.id}" class="package-label">
                                        <span class="package-name">${paquete.nombre}</span>
                                        <span class="package-price">${precio}</span>
                                    </label>
                                </div>
                                <div class="package-features">
                                    ${caracteristicas}
                                </div>
                            </div>`;
        });
        
        html += `
                        </div>
                    </div>`;
        
        return html;
    }
    
    generarFooter() {
        return `
    <footer>
    <div class="footer-content">
        <!-- Nyura Motors -->
        <div class="footer-section">
            <img src="../Imagenes/LogoBlancoNyura.png" alt="Nyura Motors" class="logo-img" style="height: 143px; opacity: 0.9;">
            <p>El futur de la mobilitat elèctrica. Disseny innovador, rendiment superior i tecnologia punta.</p>
        </div>

        <!-- Enllaços principals -->
        <div class="footer-section">
            <h3>Paginas de Nyura Motors</h3>
            <div class="footer-links">
                <a href="home.html">Home</a>
                <a href="modelos.html">Modelos</a>
                <a href="Configurador3D.html">Configurador 3D</a>
                <a href="contacto.html">Contacto</a>
            </div>
        </div>

        <!-- Contacte & Xarxes -->
        <div class="footer-section">
            <h3>Contacte</h3>
            <p>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: -3px;">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                contacto@nyuramotors.com<br>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: -3px;">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                +34 612 345 678<br>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: -3px;">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Carrer de Caracas, 11. Sant Andreu, 08030 Barcelona
            </p>
            <div class="social-links">
                <a href="#" aria-label="Twitter">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
                        <path d="M22.46 6c-.85.38-1.75.64-2.7.76 1-.6 1.76-1.55 2.12-2.68-.93.55-1.96.95-3.06 1.17-.88-.94-2.13-1.53-3.51-1.53-2.66 0-4.81 2.16-4.81 4.81 0 .38.04.75.13 1.1-4-.2-7.58-2.11-9.96-5.02-.42.72-.66 1.56-.66 2.46 0 1.68.85 3.16 2.14 4.02-.79-.02-1.53-.24-2.18-.6v.06c0 2.35 1.67 4.31 3.88 4.76-.41.11-.84.17-1.28.17-.31 0-.62-.03-.92-.08.63 1.96 2.45 3.39 4.61 3.43-1.69 1.32-3.83 2.1-6.15 2.1-.4 0-.8-.02-1.19-.07 2.19 1.4 4.78 2.22 7.57 2.22 9.07 0 14.02-7.52 14.02-14.02 0-.21 0-.43-.01-.64.96-.69 1.79-1.56 2.45-2.55z"/>
                    </svg>
                </a>
                <a href="#" aria-label="Instagram">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
                        <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
                    </svg>
                </a>
                <a href="#" aria-label="YouTube">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
                        <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.08L22 12c0 2.19-.1 3.8-.28 4.83-.13.47-.35.83-.66 1.1-.31.27-.7.44-1.19.51-.5.07-1.33.13-2.5.17-1.17.04-2.22.06-3.15.06L12 18c-3.33 0-5.5-.1-6.5-.3-.5-.07-.88-.24-1.19-.51-.31-.27-.53-.63-.66-1.1C3.1 15.8 3 14.19 3 12c0-2.19.1-3.8.28-4.83.13-.47.35-.83.66-1.1.31-.27.7-.44 1.19-.51.5-.07 1.33-.13 2.5-.17 1.17-.04 2.22-.06 3.15-.06L12 6c3.33 0 5.5.1 6.5.3.5.07.88.24 1.19.51.31.27.53.63.66 1.1z"/>
                    </svg>
                </a>
                <a href="#" aria-label="LinkedIn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.68 1.68 0 0 0-1.68 1.69c0 .93.76 1.68 1.68 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                    </svg>
                </a>
            </div>
        </div>
    </div>
    
    <div class="footer-bottom">
        <p>&copy; 2026 Nyura Motors. Tots els drets reservats. | 
           <a href="#" style="color: #4A6FFF;">Política de Privacitat</a> | 
           <a href="#" style="color: #4A6FFF;">Condicions d'ús</a> | 
           <a href="#" style="color: #4A6FFF;">Cookies</a>
        </p>
    </div>
</footer>`;
    }
    
    formatearPrecio(precio) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: this.config.moneda
        }).format(precio);
    }
    
    obtenerModeloId() {
        // Extraer el ID del modelo del nombre del archivo o configuración
        const nombreLower = this.config.nombre.toLowerCase().replace(/\s+/g, '');
        return nombreLower;
    }
    
    // Método estático para generar HTML desde configuración
    static generarDesdeConfiguracion(configuracion) {
        const generador = new GeneradorHTML(configuracion);
        return generador.generarHTML();
    }
}

// Exportar para uso global
window.GeneradorHTML = GeneradorHTML;
