import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Configuración de Supabase
const SUPABASE_URL = 'https://mwxfoiglrdvxmjpfpedp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13eGZvaWdscmR2eG1qcGZwZWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTY3NjMsImV4cCI6MjA4NTc5Mjc2M30.PshDX7mDZ2FY5_PMGRHiyAwJLHPF73s_XGYYzL_oUo0'

// Crear cliente de Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Función para probar la conexión
export async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('modelos_coche')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('Error de conexión:', error);
            return false;
        }
        
        console.log('Conexión a Supabase establecida correctamente');
        return true;
    } catch (err) {
        console.error('Error al conectar con Supabase:', err);
        return false;
    }
}

// ==================== AUTENTICACIÓN ====================

// Registro de usuario con email y contraseña
export async function signUp(email, password, userData) {
    try {
        // 1. Crear usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nombre: userData.nombre,
                    telefono: userData.telefono || ''
                }
            }
        });

        if (authError) {
            console.error('Error en auth:', authError);
            return { success: false, error: authError.message };
        }

        // 2. Crear registro en tabla users (solo si el usuario se creó correctamente)
        if (authData.user) {
            const userRecord = {
                id: authData.user.id,
                email: authData.user.email,
                nombre: userData.nombre,
                telefono: userData.telefono || '',
                rol: 'user'
            };

            const { error: dbError } = await supabase
                .from('users')
                .insert([userRecord]);

            if (dbError) {
                console.error('Error guardando en tabla users:', dbError);
                // No eliminar el usuario de auth, ya que se creó correctamente
                // El usuario puede intentar crear su perfil más tarde
                return { 
                    success: true, 
                    user: authData.user,
                    warning: 'Usuario creado pero hubo un error al guardar el perfil. Por favor, contacta con soporte.',
                    message: 'Registro exitoso. Revisa tu email para confirmar la cuenta.'
                };
            }
        }

        return { 
            success: true, 
            user: authData.user,
            message: 'Registro exitoso. Revisa tu email para confirmar la cuenta.'
        };

    } catch (error) {
        console.error('Error en signUp:', error);
        return { success: false, error: 'Error inesperado durante el registro' };
    }
}

// Inicio de sesión
export async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('Error en signIn:', error);
            return { success: false, error: error.message };
        }

        return { 
            success: true, 
            user: data.user,
            session: data.session
        };

    } catch (error) {
        console.error('Error en signIn:', error);
        return { success: false, error: 'Error inesperado durante el inicio de sesión' };
    }
}

// Inicio de sesión con Google
export async function signInWithGoogle() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/vista/home.html`
            }
        });

        if (error) {
            console.error('Error en signInWithGoogle:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };

    } catch (error) {
        console.error('Error en signInWithGoogle:', error);
        return { success: false, error: 'Error inesperado con Google OAuth' };
    }
}

// Crear perfil de usuario después de OAuth
export async function createOrUpdateUserProfile(user) {
    try {
        // Verificar si ya existe en tabla users
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error verificando usuario existente:', fetchError);
            return { success: false, error: 'Error al verificar perfil' };
        }

        // Si no existe, crearlo (sin campo contraseña)
        if (!existingUser) {
            const userRecord = {
                id: user.id,
                email: user.email,
                nombre: user.user_metadata?.nombre || user.email.split('@')[0],
                telefono: user.user_metadata?.telefono || '',
                rol: 'user'
                // NOTA: Campo 'contrasena' eliminado de la tabla
            };

            const { error: insertError } = await supabase
                .from('users')
                .insert([userRecord]);

            if (insertError) {
                console.error('Error creando perfil de usuario:', insertError);
                
                // Si es error de RLS, intentar con el service role key
                if (insertError.code === '42501') {
                    console.warn('Posible error de RLS. Verifica las políticas en Supabase.');
                    return { success: false, error: 'Error de permisos. Contacta al administrador.' };
                }
                
                return { success: false, error: 'Error al crear perfil' };
            }

            console.log('Perfil de usuario creado exitosamente');
            return { success: true, action: 'created' };
        } else {
            console.log('Perfil de usuario ya existe');
            return { success: true, action: 'exists' };
        }

    } catch (error) {
        console.error('Error en createOrUpdateUserProfile:', error);
        return { success: false, error: 'Error inesperado' };
    }
}

// Cerrar sesión
export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('Error en signOut:', error);
            return { success: false, error: error.message };
        }

        return { success: true };

    } catch (error) {
        console.error('Error en signOut:', error);
        return { success: false, error: 'Error al cerrar sesión' };
    }
}

// Obtener usuario actual
export async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            // No mostrar error si simplemente no hay sesión
            if (error.message?.includes('Auth session missing')) {
                return null;
            }
            console.error('Error obteniendo usuario actual:', error);
            return null;
        }
        
        return user;
    } catch (error) {
        console.error('Error en getCurrentUser:', error);
        return null;
    }
}

// Verificar si hay sesión activa
export async function isSessionActive() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error verificando sesión:', error);
            return false;
        }

        return !!session;

    } catch (error) {
        console.error('Error en isSessionActive:', error);
        return false;
    }
}

// Escuchar cambios en la autenticación
export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
}

// Recuperar contraseña
export async function resetPassword(email) {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/vista/reset-password.html`
        });

        if (error) {
            console.error('Error en resetPassword:', error);
            return { success: false, error: error.message };
        }

        return { 
            success: true, 
            message: 'Email de recuperación enviado. Revisa tu bandeja de entrada.' 
        };

    } catch (error) {
        console.error('Error en resetPassword:', error);
        return { success: false, error: 'Error al enviar email de recuperación' };
    }
}

// ==================== FUNCIONES CRUD BÁSICAS ====================

// Función genérica para obtener datos
export async function getData(table, columns = '*', filters = {}) {
    try {
        let query = supabase.from(table).select(columns);
        
        // Aplicar filtros si existen
        Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
        });
        
        const { data, error } = await query;
        
        if (error) {
            console.error(`Error obteniendo datos de ${table}:`, error);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error(`Error en getData para ${table}:`, error);
        return [];
    }
}

// Función genérica para insertar datos
export async function insertData(table, data) {
    try {
        const { result, error } = await supabase
            .from(table)
            .insert([data]);
        
        if (error) {
            console.error(`Error insertando en ${table}:`, error);
            return { success: false, error: error.message };
        }
        
        return { success: true, data: result };
    } catch (error) {
        console.error(`Error en insertData para ${table}:`, error);
        return { success: false, error: 'Error inesperado' };
    }
}

// Función genérica para actualizar datos
export async function updateData(table, updateData, filters) {
    try {
        let query = supabase.from(table).update(updateData);
        
        // Aplicar filtros
        Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
        });
        
        const { data, error } = await query;
        
        if (error) {
            console.error(`Error actualizando ${table}:`, error);
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        console.error(`Error en updateData para ${table}:`, error);
        return { success: false, error: 'Error inesperado' };
    }
}

// Función genérica para eliminar datos
export async function deleteData(table, filters) {
    try {
        let query = supabase.from(table).delete();
        
        // Aplicar filtros
        Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
        });
        
        const { data, error } = await query;
        
        if (error) {
            console.error(`Error eliminando de ${table}:`, error);
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        console.error(`Error en deleteData para ${table}:`, error);
        return { success: false, error: 'Error inesperado' };
    }
}

// ==================== FUNCIONES ESPECÍFICAS PARA NYURAMOTORS ====================

// USERS
export async function createUser(userData) {
    return await insertData('users', userData);
}

export async function getUserByEmail(email) {
    const users = await getData('users', '*', { email });
    return users.length > 0 ? users[0] : null;
}

export async function updateUser(userId, userData) {
    return await updateData('users', userData, { id: userId });
}

// MODELOS_COCHE
export async function getModelos(gama = null) {
    if (gama) {
        return await getData('modelos_coche', '*', { gama, activo: true });
    }
    return await getData('modelos_coche', '*', { activo: true });
}

export async function getModeloById(id) {
    const modelos = await getData('modelos_coche', '*', { id });
    return modelos.length > 0 ? modelos[0] : null;
}

// COLORES
export async function getColores() {
    return await getData('colores', '*');
}

export async function getColorById(id) {
    const colores = await getData('colores', '*', { id });
    return colores.length > 0 ? colores[0] : null;
}

// LLANTAS
export async function getLlantas() {
    return await getData('llantas', '*');
}

export async function getLlantaById(id) {
    const llantas = await getData('llantas', '*', { id });
    return llantas.length > 0 ? llantas[0] : null;
}

// CONFIGURACIONES
export async function createConfiguracion(configData) {
    return await insertData('configuraciones', configData);
}

export async function getConfiguracionesByUser(userId) {
    return await getData('configuraciones', '*', { user_id: userId });
}

export async function getConfiguracionById(id) {
    const configs = await getData('configuraciones', '*', { id });
    return configs.length > 0 ? configs[0] : null;
}

export async function updateConfiguracion(id, configData) {
    return await updateData('configuraciones', configData, { id });
}

export async function deleteConfiguracion(id) {
    return await deleteData('configuraciones', { id });
}

// FEEDBACK
export async function createFeedback(feedbackData) {
    return await insertData('feedback', feedbackData);
}

export async function getFeedbackByUser(userId) {
    return await getData('feedback', '*', { user_id: userId });
}

// FORM_CONTACTO
export async function createFormContacto(contactData) {
    return await insertData('form_contacto', contactData);
}

export async function getFormContactos(estado = null) {
    if (estado) {
        return await getData('form_contacto', '*', { estado });
    }
    return await getData('form_contacto', '*');
}

export async function updateFormContactoEstado(id, estado) {
    return await updateData('form_contacto', { estado }, { id });
}

// Función para obtener configuración completa con detalles
export async function getConfiguracionCompleta(configId) {
    try {
        const config = await getConfiguracionById(configId);
        if (!config) return null;

        const [modelo, colorExt, colorInt, llantas] = await Promise.all([
            getModeloById(config.modelo_coche_id),
            getColorById(config.color_exterior_id),
            getColorById(config.color_interior_id),
            getLlantaById(config.llantas_id)
        ]);

        return {
            ...config,
            modelo,
            color_exterior: colorExt,
            color_interior: colorInt,
            llantas
        };
    } catch (error) {
        console.error('Error obteniendo configuración completa:', error);
        throw error;
    }
}