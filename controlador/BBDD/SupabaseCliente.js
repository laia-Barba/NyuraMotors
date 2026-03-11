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


export async function getUsers() {

    return await getData('users', '*');

} // <--- Added missing closing brace


export async function getUsersForAdmin() {
    try {
        console.log('getUsersForAdmin: Usando Service Role Key para obtener todos los usuarios...');
        
        // Usar Service Role Key para bypass RLS
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
        const serviceRoleSupabase = createClient(
            'https://mwxfoiglrdvxmjpfpedp.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13eGZvaWdscmR2eG1qcGZwZWRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIxNjc2MywiZXhwIjoyMDg1NzkyNzYzfQ.yT2ZOE12JlmuUCrL276NKBJ3GBtj8072xg2daIoMUd0',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );
        
        const { data, error } = await serviceRoleSupabase
            .from('users')
            .select('*');
        
        console.log('getUsersForAdmin: Respuesta:', { data, error });
        
        if (error) {
            console.error('getUsersForAdmin: Error:', error);
            return [];
        }
        
        console.log('getUsersForAdmin: Usuarios obtenidos:', data?.length || 0);
        return data || [];
        
    } catch (error) {
        console.error('getUsersForAdmin: Error inesperado:', error);
        return [];
    }
}

// Función para actualizar rol de usuario (para administradores, usa Service Role Key)
export async function updateUserRoleForAdmin(userId, newRole) {
    try {
        console.log('updateUserRoleForAdmin: Actualizando rol del usuario:', userId, 'a:', newRole);
        
        // Usar Service Role Key para bypass RLS
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
        const serviceRoleSupabase = createClient(
            'https://mwxfoiglrdvxmjpfpedp.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13eGZvaWdscmR2eG1qcGZwZWRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIxNjc2MywiZXhwIjoyMDg1NzkyNzYzfQ.yT2ZOE12JlmuUCrL276NKBJ3GBtj8072xg2daIoMUd0',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );
        
        const { data, error } = await serviceRoleSupabase
            .from('users')
            .update({ rol: newRole })
            .eq('id', userId);
        
        console.log('updateUserRoleForAdmin: Respuesta:', { data, error });
        
        if (error) {
            console.error('updateUserRoleForAdmin: Error:', error);
            return { success: false, error: error.message };
        }
        
        console.log('updateUserRoleForAdmin: Rol actualizado exitosamente');
        return { success: true, data };
        
    } catch (error) {
        console.error('updateUserRoleForAdmin: Error inesperado:', error);
        return { success: false, error: 'Error inesperado' };
    }
}

export async function testUsersTable() {
    try {
        console.log('testUsersTable: Verificando acceso a tabla users...');
        
        // Intentar leer un solo registro de la tabla users
        const { data, error } = await supabase
            .from('users')
            .select('id, email, nombre')
            .limit(1);
        
        console.log('testUsersTable: Respuesta:', { data, error });
        
        if (error) {
            console.error('testUsersTable: Error accediendo a tabla users:', error);
            return { success: false, error: error.message };
        }
        
        console.log('testUsersTable: Tabla users accesible correctamente');
        return { success: true, data };
    } catch (error) {
        console.error('Error en testUsersTable:', error);
        return { success: false, error: 'Error inesperado' };
    }
}

// Función para cerrar sesión
export async function logout() {
    try {
        console.log('logout: Cerrando sesión...');
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('Error cerrando sesión:', error);
            return { success: false, error: error.message };
        }
        
        console.log('logout: Sesión cerrada exitosamente');
        return { success: true };
    } catch (error) {
        console.error('Error en logout:', error);
        return { success: false, error: 'Error inesperado' };
    }
}

// Función para eliminar cuenta de usuario
export async function deleteAccount(userId) {
    try {
        console.log('deleteAccount: Eliminando cuenta del usuario:', userId);
        
        // Usar Service Role Key para eliminar el usuario de Auth
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
        const serviceRoleSupabase = createClient(
            'https://mwxfoiglrdvxmjpfpedp.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13eGZvaWdscmR2eG1qcGZwZWRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIxNjc2MywiZXhwIjoyMDg1NzkyNzYzfQ.yT2ZOE12JlmuUCrL276NKBJ3GBtj8072xg2daIoMUd0',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );
        
        // 1. Eliminar de la tabla users
        const { error: tableError } = await serviceRoleSupabase
            .from('users')
            .delete()
            .eq('id', userId);
        
        if (tableError) {
            console.error('Error eliminando de tabla users:', tableError);
            return { success: false, error: 'Error eliminando datos del usuario' };
        }
        
        // 2. Eliminar de Supabase Auth
        const { error: authError } = await serviceRoleSupabase.auth.admin.deleteUser(userId);
        
        if (authError) {
            console.error('Error eliminando de Auth:', authError);
            return { success: false, error: 'Error eliminando cuenta de autenticación' };
        }
        
        console.log('deleteAccount: Cuenta eliminada exitosamente');
        return { success: true };
    } catch (error) {
        console.error('Error en deleteAccount:', error);
        return { success: false, error: 'Error inesperado' };
    }
}

// Función específica para actualizar perfil de usuario (con Service Role Key correcta)
export async function updateUserProfile(userId, userData) {
    try {
        console.log('updateUserProfile: Actualizando perfil con datos:', userData);
        
        // Usar Service Role Key correcta para operaciones de escritura
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
        const serviceRoleSupabase = createClient(
            'https://mwxfoiglrdvxmjpfpedp.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13eGZvaWdscmR2eG1qcGZwZWRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIxNjc2MywiZXhwIjoyMDg1NzkyNzYzfQ.yT2ZOE12JlmuUCrL276NKBJ3GBtj8072xg2daIoMUd0',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );
        
        // 1. Actualizar en tabla users
        const query = serviceRoleSupabase
            .from('users')
            .update(userData)
            .eq('id', userId);
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout: La llamada a Supabase tardó demasiado tiempo')), 5000);
        });
        
        const { data, error } = await Promise.race([query, timeoutPromise]);
        
        console.log('updateUserProfile: Respuesta tabla users:', { data, error });
        
        if (error) {
            if (error.message.includes('Timeout')) {
                console.error('updateUserProfile: ERROR - La llamada a Supabase se quedó colgada');
                return { success: false, error: 'La actualización tardó demasiado tiempo. Verifica tu conexión.' };
            }
            console.error('Error actualizando perfil de usuario en tabla users:', error);
            return { success: false, error: error.message };
        }
        
        // 2. Actualizar metadatos en Supabase Auth
        try {
            console.log('updateUserProfile: Actualizando metadatos en Supabase Auth...');
            
            // Extraer nombre para los metadatos
            const nombreParts = userData.nombre.split(' ');
            const authMetadata = {
                nombre: userData.nombre,
                telefono: userData.telefono,
                full_name: userData.nombre,
                first_name: nombreParts[0] || '',
                last_name: nombreParts.slice(1).join(' ') || '',
                phone: userData.telefono
            };
            
            console.log('updateUserProfile: Metadatos a actualizar en Auth:', authMetadata);
            
            const { error: authError } = await serviceRoleSupabase.auth.admin.updateUserById(
                userId,
                { 
                    user_metadata: authMetadata,
                    phone: userData.telefono,
                    email: userData.email
                }
            );
            
            if (authError) {
                console.warn('updateUserProfile: Error actualizando Auth (no crítico):', authError);
                // No fallar si solo falla la actualización de Auth
            } else {
                console.log('updateUserProfile: Metadatos de Auth actualizados exitosamente');
            }
        } catch (authUpdateError) {
            console.warn('updateUserProfile: Error en actualización de Auth (no crítico):', authUpdateError);
            // No fallar si solo falla la actualización de Auth
        }
        
        console.log('updateUserProfile: Actualización completa exitosa');
        return { success: true, data };
    } catch (error) {
        console.error('Error en updateUserProfile:', error);
        return { success: false, error: 'Error inesperado' };
    }
}

// MODELOS_COCHE
export async function getModelos(gama = null) {
    const filters = gama ? { gama, activo: true } : { activo: true };
    return await getData('modelos_coche', '*', filters);
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

// Función para obtener todas las configuraciones
export async function getConfiguraciones() {
    return await getData('configuraciones', '*');
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