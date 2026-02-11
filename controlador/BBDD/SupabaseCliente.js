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



// Funciones específicas para NyuraMotors

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