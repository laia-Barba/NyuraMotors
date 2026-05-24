import { getCurrentUser, createOrUpdateUserProfile, onAuthStateChange, signOut, getUserByEmail } from '../../controlador/BBDD/SupabaseCliente.js';
import { savePersistentUser, clearPersistentUser } from '../../controlador/BBDD/AuthPersistencia.js';

class HeaderComponent extends HTMLElement {
    constructor() {
        super();
        this.currentPath = window.location.pathname;
    }

    connectedCallback() {
        console.log('[HeaderComponent] connectedCallback', {
            currentPath: window.location.pathname,
            readyState: document.readyState
        });
        this.render();
        // Esperar a que el DOM esté completamente cargado antes de inicializar auth
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    this.initAuthMenu();
                    this.initScrollEffect();
                }, 100);
            });
        } else {
            setTimeout(() => {
                this.initAuthMenu();
                this.initScrollEffect();
            }, 100);
        }
    }

    render() {
        const activeClass = (page) => {
            if (this.currentPath.includes(page) || (page === 'home.html' && (this.currentPath.endsWith('/') || this.currentPath.endsWith('home.html')))) {
                return 'active';
            }
            return '';
        };

        const showConfigurator = this.hasAttribute('show-configurator');
        const isConfiguratorPage = this.currentPath.includes('Configurador');

        let navItems = `
            <li><a href="home.html" class="${activeClass('home.html')}">Inicio</a></li>
            <li><a href="modelos.html" id="modelosLink" class="${activeClass('modelos.html')}">Modelos</a></li>
        `;

        if (showConfigurator || isConfiguratorPage) {
            navItems += `<li><span class="active">Configurador 3D</span></li>`;
        }

        navItems += `
            <li><a href="contacto.html" class="${activeClass('contacto.html')}">Contacto</a></li>
            <li id="authMenu"><a href="InicioSesion.html"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="width: 16px; height: 16px; vertical-align: -2px; margin-right: 6px;"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.41 0-8 2-8 4.5V21h16v-2.5c0-2.5-3.59-4.5-8-4.5Z"/></svg>Iniciar sesión</a></li>
        `;

        this.innerHTML = `
            <header>
                <nav>
                    <a href="home.html"><img src="../Imagenes/LogoBlancoNyura.png" alt="Nyura Motors" class="logo-img"></a>
                    <ul>
                        ${navItems}
                    </ul>
                </nav>
            </header>
        `;
    }

    async initAuthMenu() {
        console.log('[HeaderComponent] initAuthMenu iniciado');
        const authMenu = document.getElementById('authMenu');
        if (!authMenu) {
            console.warn('[HeaderComponent] No se encontró #authMenu');
            return;
        }

        // Función para actualizar el menú de autenticación
        async function updateAuthMenu(user) {
            console.log('[HeaderComponent] updateAuthMenu', {
                hasUser: !!user,
                email: user?.email || null,
                metadata: user?.user_metadata || null
            });
            if (user) {
                // Obtener datos completos del usuario incluyendo el rol
                const userData = await getUserByEmail(user.email);
                console.log('[HeaderComponent] userData desde tabla users', userData);
                const isAdmin = userData && userData.rol === 'admin';
                const displayName = user.user_metadata?.nombre || user.email.split('@')[0];

                authMenu.innerHTML = `
                    <div class="auth-dropdown">
                        <button class="auth-dropdown-toggle" onclick="toggleAuthMenu()">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="width: 16px; height: 16px; vertical-align: -2px; margin-right: 6px;">
                                <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.41 0-8 2-8 4.5V21h16v-2.5c0-2.5-3.59-4.5-8-4.5Z"/>
                            </svg>
                            ${displayName}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="width: 12px; height: 12px; margin-left: 4px;">
                                <path d="M7 10l5 5 5-5z"/>
                            </svg>
                        </button>
                        <div class="auth-dropdown-menu" id="authDropdownMenu">
                            <a href="User/perfil.html">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="width: 16px; height: 16px; margin-right: 8px;">
                                    <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.41 0-8 2-8 4.5V21h16v-2.5c0-2.5-3.59-4.5-8-4.5Z"/>
                                </svg>
                                Ver perfil
                            </a>
                            ${isAdmin ? `
                            <a href="admin/Panel.html" style="color: #dc3545;">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="width: 16px; height: 16px; margin-right: 8px;">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                Panel de Administrador
                            </a>` : ''}
                            <a href="#" onclick="handleSignOut()" style="color: #dc3545;">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="width: 16px; height: 16px; margin-right: 8px;">
                                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                </svg>
                                Cerrar sesión
                            </a>
                        </div>
                    </div>
                `;
            } else {
                authMenu.innerHTML = `
                    <a href="InicioSesion.html">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="width: 16px; height: 16px; vertical-align: -2px; margin-right: 6px;">
                            <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.41 0-8 2-8 4.5V21h16v-2.5c0-2.5-3.59-4.5-8-4.5Z"/>
                        </svg>
                        Iniciar sesión
                    </a>
                `;
            }
        }

        // Función para toggle del menú desplegable
        window.toggleAuthMenu = function() {
            const menu = document.getElementById('authDropdownMenu');
            if (menu) {
                menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            }
        };

        // Función para cerrar sesión
        window.handleSignOut = async function() {
            try {
                const result = await signOut();
                if (result.success) {
                    console.log('Sesión cerrada correctamente');
                    updateAuthMenu(null);
                } else {
                    console.error('Error al cerrar sesión:', result.error);
                    alert('Error al cerrar sesión. Intenta de nuevo.');
                }
            } catch (error) {
                console.error('Error inesperado al cerrar sesión:', error);
                alert('Error inesperado. Intenta de nuevo.');
            }
        };

        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', function(event) {
            const dropdown = document.querySelector('.auth-dropdown');
            if (dropdown && !dropdown.contains(event.target)) {
                const menu = document.getElementById('authDropdownMenu');
                if (menu) {
                    menu.style.display = 'none';
                }
            }
        });

        // Verificar estado inicial
        try {
            console.log('[HeaderComponent] Consultando sesión inicial con getCurrentUser()');
            const currentUser = await getCurrentUser();
            console.log('[HeaderComponent] Resultado getCurrentUser()', {
                hasUser: !!currentUser,
                email: currentUser?.email || null,
                id: currentUser?.id || null
            });
            await updateAuthMenu(currentUser);
        } catch (error) {
            console.error('[HeaderComponent] Error al consultar getCurrentUser()', error);
            await updateAuthMenu(null);
        }

        // Escuchar cambios en autenticación
        onAuthStateChange(async (event, session) => {
            console.log('[HeaderComponent] onAuthStateChange', {
                event,
                hasSession: !!session,
                hasUser: !!session?.user,
                email: session?.user?.email || null
            });
            if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
                console.log('[HeaderComponent] Sesión activa detectada:', session.user);
                savePersistentUser(session.user);
                const profileResult = await createOrUpdateUserProfile(session.user);
                if (profileResult.success) {
                    console.log('Perfil procesado:', profileResult.action);
                } else {
                    console.error('Error procesando perfil:', profileResult.error);
                }
                updateAuthMenu(session.user);
            } else if (event === 'SIGNED_OUT') {
                console.log('Usuario cerró sesión');
                clearPersistentUser();
                updateAuthMenu(null);
            }
        });
    }

    initScrollEffect() {
        window.addEventListener('scroll', function() {
            const header = document.querySelector('header');
            if (header) {
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            }
        });
    }
}

// Registrar el componente
customElements.define('header-component', HeaderComponent);
