import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'




// Configuración de Supabase

export const SUPABASE_URL = 'https://mwxfoiglrdvxmjpfpedp.supabase.co'

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13eGZvaWdscmR2eG1qcGZwZWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTY3NjMsImV4cCI6MjA4NTc5Mjc2M30.PshDX7mDZ2FY5_PMGRHiyAwJLHPF73s_XGYYzL_oUo0'


// Crear cliente de Supabase

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

function getPublicBaseUrl() {

    const origin = window.location.origin;

    // En GitHub Pages el proyecto vive bajo /<repo>/
    // Ej: https://laia-barba.github.io/NyuraMotors/
    // Para este proyecto específico, hardcodeamos el repo name para OAuth
    if (origin.includes('github.io')) {
        return `${origin}/NyuraMotors`;
    }

    // Para Live Server o localhost, verificar si estamos en NyuraMotors subdirectorio
    const pathname = window.location.pathname;
    if (pathname.includes('/NyuraMotors/')) {
        return `${origin}/NyuraMotors`;
    }

    return origin;

}


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

                // NOTA: Campo 'contrasena' eliminado de la tabla

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

                redirectTo: `${getPublicBaseUrl()}/vista/home.html`

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

            redirectTo: `${getPublicBaseUrl()}/vista/reset-password.html`

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
    try {
        const modelos = await getData('modelos_coche', '*', { id });
        return modelos.length > 0 ? modelos[0] : null;
    } catch (error) {
        console.error('Error obteniendo modelo:', error);
        return null;
    }
}

// COLORES

export async function getColores() {

    return await getData('colores', '*');

}



export async function getColorById(id) {
    const colores = await getData('colores', '*', { id });
    return colores.length > 0 ? colores[0] : null;
}

// FORM_CONTACTO
export async function getFormContactos(estado = null, orderBy = 'desc') {
    try {
        console.log('getFormContactos: Obteniendo contactos con filtro:', estado, 'orden:', orderBy);
        
        let query = supabase
            .from('form_contacto')
            .select('*');
        
        // Aplicar filtro de estado si existe
        if (estado) {
            console.log('getFormContactos: Aplicando filtro estado:', estado);
            query = query.eq('estado', estado);
        }
        
        // Ordenar por fecha_registro según el parámetro orderBy
        // 'asc' = ascendente (más antiguos primero)
        // 'desc' = descendente (más nuevos primero)
        const ascending = orderBy === 'asc';
        query = query.order('fecha_registro', { ascending });
        
        const { data, error } = await query;
        
        console.log('getFormContactos: Respuesta:', { data, error });
        
        if (error) {
            console.error('getFormContactos: Error:', error);
            return [];
        }
        
        console.log('getFormContactos: Contactos obtenidos:', data?.length || 0);
        return data || [];
        
    } catch (error) {
        console.error('getFormContactos: Error inesperado:', error);
        return [];
    }
}

export async function getContactoById(id) {
    const contactos = await getData('form_contacto', '*', { id });
    return contactos.length > 0 ? contactos[0] : null;
}

export async function updateContacto(id, updateData) {
    try {
        console.log('updateContacto: Actualizando contacto:', id, 'con datos:', updateData);
        
        // Usar Supabase directamente para evitar problemas de scope
        const { data, error } = await supabase
            .from('form_contacto')
            .update(updateData)
            .eq('id', id);
        
        console.log('updateContacto: Respuesta:', { data, error });
        
        if (error) {
            console.error('updateContacto: Error:', error);
            return { success: false, error: error.message };
        }
        
        console.log('updateContacto: Contacto actualizado exitosamente');
        return { success: true, data };
        
    } catch (error) {
        console.error('updateContacto: Error inesperado:', error);
        return { success: false, error: 'Error inesperado' };
    }
}

export async function deleteContacto(id) {
    return await deleteData('form_contacto', { id });
}

// LLANTAS

export async function getLlantas() {

    return await getData('llantas', '*');

}

export async function getLlantaById(id) {

    const llantas = await getData('llantas', '*', { id });

    return llantas.length > 0 ? llantas[0] : null;

}

// PAQUETES

export async function getPaquetes() {

    return await getData('paquetes', '*');

}

export async function getPaqueteById(id) {

    const paquetes = await getData('paquetes', '*', { id });

    return paquetes.length > 0 ? paquetes[0] : null;

}

export async function getConfiguracionesByUser(userId) {
    try {
        const { data, error } = await supabase
            .from('configuraciones')
            .select(`
                id,
                user_id,
                modelo_coche_id,
                color_exterior_id,
                color_interior_id,
                llantas_id,
                precio_total,
                nombre,
                fecha_creacion,
                configuracion_paquetes (
                    paquete_id,
                    paquetes (
                        id,
                        nombre,
                        descripcion,
                        precio
                    )
                )
            `)
            .eq('user_id', userId)
            .order('fecha_creacion', { ascending: false });
        
        if (error) {
            console.error('Error obteniendo configuraciones del usuario:', error);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('Error en getConfiguracionesByUser:', error);
        return [];
    }
}

// Función para obtener todas las configuraciones
export async function getConfiguraciones() {
    try {
        const { data, error } = await supabase
            .from('configuraciones')
            .select(`
                id,
                user_id,
                modelo_coche_id,
                color_exterior_id,
                color_interior_id,
                llantas_id,
                precio_total,
                nombre,
                fecha_creacion,
                configuracion_paquetes (
                    paquete_id,
                    paquetes (
                        id,
                        nombre,
                        descripcion,
                        precio
                    )
                )
            `)
            .order('fecha_creacion', { ascending: false });
        
        if (error) {
            console.error('Error obteniendo configuraciones:', error);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('Error en getConfiguraciones:', error);
        return [];
    }
}

export async function getConfiguracionById(id) {
    try {
        const { data, error } = await supabase
            .from('configuraciones')
            .select(`
                id,
                user_id,
                modelo_coche_id,
                color_exterior_id,
                color_interior_id,
                llantas_id,
                precio_total,
                nombre,
                fecha_creacion,
                configuracion_paquetes (
                    paquete_id,
                    paquetes (
                        id,
                        nombre,
                        descripcion,
                        precio
                    )
                )
            `)
            .eq('id', id)
            .single();
        
        if (error) {
            console.error('Error obteniendo configuración:', error);
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('Error en getConfiguracionById:', error);
        return null;
    }
}

export async function updateConfiguracion(id, configData) {
    try {
        // Mapear campo imagen a Imagenes_Modelos si existe
        const dataToUpdate = { ...configData };
        if (dataToUpdate.imagen !== undefined) {
            dataToUpdate.Imagenes_Modelos = dataToUpdate.imagen;
            delete dataToUpdate.imagen;
        }

        const { data, error } = await supabase
            .from('configuraciones')
            .update(dataToUpdate)
            .eq('id', id);

        if (error) {
            console.error('Error actualizando configuración:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error en updateConfiguracion:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteConfiguracion(id) {

    return await deleteData('configuraciones', { id });

}

// Reemplaza los paquetes asociados a una configuración (tabla puente configuracion_paquetes)
export async function setConfiguracionPaquetes(configuracionId, paqueteIds = []) {
    try {
        const ids = (paqueteIds || []).map((id) => Number(id)).filter((n) => Number.isFinite(n));

        // Primero eliminar paquetes existentes
        const { error: delRes } = await supabase
            .from('configuracion_paquetes')
            .delete()
            .eq('configuracion_id', configuracionId);

        if (delRes) {
            console.warn('setConfiguracionPaquetes: error eliminando paquetes:', delRes);
            return { success: false, error: delRes };
        }

        if (ids.length > 0) {
            const rows = ids.map((paqueteId) => ({
                configuracion_id: configuracionId,
                paquete_id: paqueteId
            }));

            const { error: insRes } = await supabase
                .from('configuracion_paquetes')
                .insert(rows);

            if (insRes) {
                console.warn('setConfiguracionPaquetes: error insertando paquetes:', insRes);
                return { success: false, error: insRes };
            }
        }

        return { success: true };
    } catch (error) {
        console.error('setConfiguracionPaquetes: error inesperado:', error);
        return { success: false, error: error.message };
    }
}

// FEEDBACK

export async function createFeedback(feedbackData) {

    return await insertData('feedback', feedbackData);

}



export async function getFeedbackByUser(userId) {

    return await getData('feedback', '*', { user_id: userId });

}

export async function updateFormContactoEstado(id, estado) {
    return await updateData('form_contacto', { estado }, { id });
}

// FUNCIONES CRUD PARA MODELOS

// Obtener todos los modelos con sus colores
export async function getModels() {
    try {
        const selectWithImage = `
            id,
            nombre,
            gama,
            precio,
            Imagenes_Modelos,
            descripcion_corta,
            activo,
            modelo_colores (
                color_id,
                colores (
                    id,
                    nombre,
                    hex,
                    precio_extra
                )
            ),
            modelo_llantas (
                llanta_id,
                llantas (
                    id,
                    nombre,
                    medida,
                    precio_extra
                )
            ),
            modelo_paquetes (
                paquete_id,
                paquetes (
                    id,
                    nombre,
                    descripcion,
                    precio
                )
            )
        `;

        const attempt = async (select) => {
            return await supabase
                .from('modelos_coche')
                .select(select)
                .order('id', { ascending: false });
        };

        let { data, error } = await attempt(selectWithImage);

        if (error) {
            console.error('Error obteniendo modelos (select con imagen):', error);

            const msg = (error.message || '').toLowerCase();
            const details = (error.details || '').toLowerCase();
            const hint = (error.hint || '').toLowerCase();
            const looksLikeMissingImageColumn = msg.includes('imagenes_modelos') || details.includes('imagenes_modelos') || hint.includes('imagenes_modelos');

            if (looksLikeMissingImageColumn) {
                ({ data, error } = await attempt(selectWithoutImage));
                if (error) {
                    console.error('Error obteniendo modelos (select sin imagen):', error);
                    return { success: false, error: error.message };
                }
                return { success: true, data };
            }

            return { success: false, error: error.message };
        }

        // Mapear Imagenes_Modelos a imagen para compatibilidad con el frontend
        if (data) {
            data = data.map(model => {
                console.log('Raw model from DB:', model);
                const mappedModel = {
                    ...model,
                    imagen: model.Imagenes_Modelos
                };
                console.log('Mapped model for frontend:', mappedModel);
                return mappedModel;
            });
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error inesperado obteniendo modelos:', error);
        return { success: false, error: error.message };
    }
}

// Crear un nuevo modelo
export async function createModel(modelData) {
    try {
        // Mapear campo imagen a Imagenes_Modelos si existe
        const dataToInsert = { ...modelData };
        if (dataToInsert.imagen !== undefined) {
            dataToInsert.Imagenes_Modelos = dataToInsert.imagen;
            delete dataToInsert.imagen;
        }

        const { data, error } = await supabase
            .from('modelos_coche')
            .insert([dataToInsert])
            .select();

        if (error) {
            console.error('Error creando modelo (intento con todos los campos):', error);

            // Si el error menciona una columna que no existe (ej: descripcion_corta), reintentar sin esos campos
            const msg = (error.message || '').toLowerCase();
            const details = (error.details || '').toLowerCase();
            const hint = (error.hint || '').toLowerCase();
            const looksLikeMissingColumn = msg.includes('could not find') && (msg.includes('column') || msg.includes('descripcion_corta'));

            if (looksLikeMissingColumn) {
                // Crear copia sin campos problemáticos
                const safeData = { ...dataToInsert };
                delete safeData.descripcion_corta;

                const { data: data2, error: error2 } = await supabase
                    .from('modelos_coche')
                    .insert([safeData])
                    .select();

                if (error2) {
                    console.error('Error creando modelo (intento sin campos problemáticos):', error2);
                    return { success: false, error: error2.message };
                }

                return { success: true, data: data2[0] };
            }

            return { success: false, error: error.message };
        }

        // Mapear Imagenes_Modelos a imagen para compatibilidad con el frontend
        if (data && data[0]) {
            data[0] = {
                ...data[0],
                imagen: data[0].Imagenes_Modelos
            };
        }

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error inesperado creando modelo:', error);
        return { success: false, error: error.message };
    }
}

// Actualizar un modelo existente
export async function updateModel(id, modelData) {
    try {
        // Mapear campo imagen a Imagenes_Modelos si existe
        const dataToUpdate = { ...modelData };
        if (dataToUpdate.imagen !== undefined) {
            dataToUpdate.Imagenes_Modelos = dataToUpdate.imagen;
            delete dataToUpdate.imagen;
        }

        console.log('updateModel - Enviando a BBDD:', {
            id,
            dataToUpdate,
            Imagenes_Modelos: dataToUpdate.Imagenes_Modelos
        });

        const { data, error } = await supabase
            .from('modelos_coche')
            .update(dataToUpdate)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error actualizando modelo:', error);
            console.error('Error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return { success: false, error: error.message };
        }

        console.log('updateModel - Respuesta de BBDD:', { data, error });

        // Verificar si hay datos en la respuesta
        if (data && data.length > 0) {
            console.log('updateModel - Datos actualizados:', data[0]);
            console.log('updateModel - Verificando Imagenes_Modelos:', data[0].Imagenes_Modelos);
        } else {
            console.warn('updateModel - ADVERTENCIA: No hay datos en la respuesta de BBDD');
        }

        // Mapear Imagenes_Modelos a imagen para compatibilidad con el frontend
        if (data && data[0]) {
            data[0] = {
                ...data[0],
                imagen: data[0].Imagenes_Modelos
            };
            console.log('updateModel - Modelo mapeado para frontend:', {
                id: data[0].id,
                nombre: data[0].nombre,
                imagen: data[0].imagen
            });
        } else {
            console.warn('updateModel - ADVERTENCIA: No hay datos para mapear');
        }

        return { success: true, data: data && data.length > 0 ? data[0] : null };
    } catch (error) {
        console.error('Error inesperado actualizando modelo:', error);
        return { success: false, error: error.message };
    }
}

// Eliminar un modelo
export async function deleteModel(id) {
    try {
        // Primero eliminar todas las configuraciones asociadas al modelo
        const { error: configError } = await supabase
            .from('configuraciones')
            .delete()
            .eq('modelo_coche_id', id);

        if (configError) {
            console.error('Error eliminando configuraciones asociadas:', configError);
            return { success: false, error: 'No se pudieron eliminar las configuraciones asociadas: ' + configError.message };
        }

        // Luego eliminar el modelo
        const { error } = await supabase
            .from('modelos_coche')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error eliminando modelo:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Error inesperado eliminando modelo:', error);
        return { success: false, error: error.message };
    }
}

// Activar/Desactivar un modelo
export async function toggleModelStatus(id, activo) {
    try {
        const { data, error } = await supabase
            .from('modelos_coche')
            .update({ activo })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error actualizando estado del modelo:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error inesperado actualizando estado del modelo:', error);
        return { success: false, error: error.message };
    }
}

// Reemplaza los colores asociados a un modelo (tabla puente modelo_colores)
export async function setModelColors(modelId, colorIds = []) {
    try {
        const normalizedModelId = Number(modelId);
        const ids = (colorIds || []).map((id) => Number(id)).filter((n) => Number.isFinite(n));

        const fkCandidates = ['modelo_coche_id', 'modelo_id'];

        const attempt = async (fkColumn) => {
            // Primero intentar eliminar colores existentes
            const delRes = await supabase
                .from('modelo_colores')
                .delete()
                .eq(fkColumn, normalizedModelId);

            if (delRes.error) {
                console.warn(`setModelColors: error eliminando colores con FK ${fkColumn}:`, delRes.error);
                return { success: false, error: delRes.error };
            }

            // Si no hay colores que agregar, terminar aquí
            if (ids.length === 0) {
                return { success: true };
            }

            // Insertar nuevos colores
            const rows = ids.map((colorId) => ({
                [fkColumn]: normalizedModelId,
                color_id: colorId
            }));

            const insRes = await supabase
                .from('modelo_colores')
                .insert(rows);

            if (insRes.error) {
                console.warn(`setModelColors: error insertando colores con FK ${fkColumn}:`, insRes.error);
                return { success: false, error: insRes.error };
            }

            return { success: true };
        };

        let lastErr = null;
        for (const fk of fkCandidates) {
            const res = await attempt(fk);
            if (res.success) {
                return { success: true };
            }
            lastErr = res.error;
        }

        // Si ambos intentos fallaron, intentar un enfoque más simple
        console.warn('setModelColors: ambos FK fallaron, intentando enfoque simple');
        try {
            // Verificar si ya existen colores para este modelo
            const { data: existingData, error: checkError } = await supabase
                .from('modelo_colores')
                .select('color_id')
                .or(`modelo_id.eq.${normalizedModelId},modelo_coche_id.eq.${normalizedModelId}`);

            if (checkError) {
                console.warn('setModelColors: error verificando colores existentes:', checkError);
            } else if (existingData && existingData.length > 0) {
                // Si existen, intentar eliminar con ambas columnas
                await supabase
                    .from('modelo_colores')
                    .delete()
                    .or(`modelo_id.eq.${normalizedModelId},modelo_coche_id.eq.${normalizedModelId}`);
            }

            // Insertar nuevos colores
            if (ids.length > 0) {
                const rows = ids.map((colorId) => ({
                    modelo_id: normalizedModelId,
                    color_id: colorId
                }));

                const { error: insertError } = await supabase
                    .from('modelo_colores')
                    .insert(rows);

                if (insertError) {
                    console.error('setModelColors: error en inserción final:', insertError);
                    return { success: false, error: insertError.message };
                }
            }

            return { success: true };
        } catch (fallbackError) {
            console.error('setModelColors: error en fallback:', fallbackError);
            return { success: false, error: fallbackError.message };
        }
    } catch (error) {
        console.error('setModelColors: error inesperado:', error);
        return { success: false, error: error.message };
    }
}

// Reemplaza las llantas asociadas a un modelo (tabla puente modelo_llantas)
export async function setModelLlantas(modelId, llantaIds = []) {
    try {
        const normalizedModelId = Number(modelId);
        const ids = (llantaIds || []).map((id) => Number(id)).filter((n) => Number.isFinite(n));

        const fkCandidates = ['modelo_coche_id', 'modelo_id'];

        const attempt = async (fkColumn) => {
            // Primero intentar eliminar llantas existentes
            const delRes = await supabase
                .from('modelo_llantas')
                .delete()
                .eq(fkColumn, normalizedModelId);

            if (delRes.error) {
                console.warn(`setModelLlantas: error eliminando llantas con FK ${fkColumn}:`, delRes.error);
                return { success: false, error: delRes.error };
            }

            // Si no hay llantas que agregar, terminar aquí
            if (ids.length === 0) {
                return { success: true };
            }

            // Insertar nuevas llantas
            const rows = ids.map((llantaId) => ({
                [fkColumn]: normalizedModelId,
                llanta_id: llantaId
            }));

            const insRes = await supabase
                .from('modelo_llantas')
                .insert(rows);

            if (insRes.error) {
                console.warn(`setModelLlantas: error insertando llantas con FK ${fkColumn}:`, insRes.error);
                return { success: false, error: insRes.error };
            }

            return { success: true };
        };

        let lastErr = null;
        for (const fk of fkCandidates) {
            const res = await attempt(fk);
            if (res.success) {
                return { success: true };
            }
            lastErr = res.error;
        }

        // Si ambos intentos fallaron, intentar un enfoque más simple
        console.warn('setModelLlantas: ambos FK fallaron, intentando enfoque simple');
        try {
            // Verificar si ya existen llantas para este modelo
            const { data: existingData, error: checkError } = await supabase
                .from('modelo_llantas')
                .select('llanta_id')
                .or(`modelo_id.eq.${normalizedModelId},modelo_coche_id.eq.${normalizedModelId}`);

            if (checkError) {
                console.warn('setModelLlantas: error verificando llantas existentes:', checkError);
            } else if (existingData && existingData.length > 0) {
                // Si existen, intentar eliminar con ambas columnas
                await supabase
                    .from('modelo_llantas')
                    .delete()
                    .or(`modelo_id.eq.${normalizedModelId},modelo_coche_id.eq.${normalizedModelId}`);
            }

            // Insertar nuevas llantas
            if (ids.length > 0) {
                const rows = ids.map((llantaId) => ({
                    modelo_id: normalizedModelId,
                    llanta_id: llantaId
                }));

                const { error: insertError } = await supabase
                    .from('modelo_llantas')
                    .insert(rows);

                if (insertError) {
                    console.error('setModelLlantas: error en inserción final:', insertError);
                    return { success: false, error: insertError.message };
                }
            }

            return { success: true };
        } catch (fallbackError) {
            console.error('setModelLlantas: error en fallback:', fallbackError);
            return { success: false, error: fallbackError.message };
        }
    } catch (error) {
        console.error('setModelLlantas: error inesperado:', error);
        return { success: false, error: error.message };
    }
}

// Reemplaza los paquetes asociados a un modelo (tabla puente modelo_paquetes)
export async function setModelPaquetes(modelId, paqueteIds = []) {
    try {
        const normalizedModelId = Number(modelId);
        const ids = (paqueteIds || []).map((id) => Number(id)).filter((n) => Number.isFinite(n));

        // Intentar con modelo_coche_id primero
        const fkColumn = 'modelo_coche_id';
        const { error: delRes } = await supabase
            .from('modelo_paquetes')
            .delete()
            .eq(fkColumn, normalizedModelId);

        if (delRes) {
            console.warn(`setModelPaquetes: error eliminando paquetes con FK ${fkColumn}:`, delRes);
            return { success: false, error: delRes };
        }

        if (ids.length > 0) {
            const rows = ids.map((paqueteId) => ({
                [fkColumn]: normalizedModelId,
                paquete_id: paqueteId
            }));

            const { error: insRes } = await supabase
                .from('modelo_paquetes')
                .insert(rows);

            if (insRes) {
                console.warn(`setModelPaquetes: error insertando paquetes con FK ${fkColumn}:`, insRes);
                return { success: false, error: insRes };
            }
        }

        return { success: true };
    } catch (error) {
        console.error('setModelPaquetes: error inesperado:', error);
        return { success: false, error: error.message };
    }
}

// Subir imagen de modelo a Supabase Storage (bucket "imagenes-modelos")
export async function uploadModelImage(file, modelId = null, modelName = null, oldImageUrl = null) {
    try {
        if (!file || !file.type.startsWith('image/')) {
            return { success: false, error: 'El archivo debe ser una imagen válida' };
        }

        const bucketName = 'imagenes-modelos';
        
        // Eliminar imagen vieja si existe
        if (oldImageUrl) {
            await deleteOldImage(oldImageUrl, modelName);
        }

        // Generar nombre de archivo con el nombre del coche
        let safeFileName;
        if (modelName) {
            // Limpiar el nombre del coche para usarlo como nombre de archivo
            const cleanModelName = modelName
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');
            safeFileName = cleanModelName;
        } else {
            safeFileName = modelId ? String(modelId).replace(/[^a-zA-Z0-9]/g, '_') : 'new';
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${safeFileName}.${fileExt}`;
        const filePath = fileName;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true // Permitir sobreescribir si ya existe
            });

        if (uploadError) {
            console.error('Error subiendo imagen a Storage:', uploadError);
            return { success: false, error: uploadError.message };
        }

        const { data: publicData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        const publicUrl = publicData?.publicUrl;
        if (!publicUrl) {
            return { success: false, error: 'No se pudo obtener la URL pública de la imagen subida' };
        }

        return { success: true, publicUrl, fileName };
    } catch (error) {
        console.error('uploadModelImage: error inesperado:', error);
        return { success: false, error: error.message };
    }
}

// Eliminar imagen vieja del bucket
async function deleteOldImage(imageUrl, modelName) {
    try {
        console.log('deleteOldImage - Intentando eliminar:', imageUrl);
        
        if (!imageUrl) {
            console.log('deleteOldImage - No hay URL de imagen vieja, saltando');
            return;
        }

        // Eliminar la imagen específica
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const cleanFileName = fileName.split('?')[0];

        console.log('deleteOldImage - Archivo específico a eliminar:', cleanFileName);

        const { error } = await supabase.storage
            .from('imagenes-modelos')
            .remove([cleanFileName]);

        if (error) {
            console.warn('No se pudo eliminar la imagen específica:', error);
        } else {
            console.log('Imagen específica eliminada:', cleanFileName);
        }

        // También eliminar cualquier otra imagen con el nombre del modelo
        if (modelName) {
            const cleanModelName = modelName
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');

            console.log('deleteOldImage - Buscando imágenes con nombre de modelo:', cleanModelName);

            // Listar todos los archivos del bucket
            const { data: files, error: listError } = await supabase.storage
                .from('imagenes-modelos')
                .list('', { limit: 100 });

            if (listError) {
                console.warn('Error listando archivos:', listError);
                return;
            }

            // Encontrar archivos que coincidan con el nombre del modelo
            const modelFiles = files.filter(file => 
                file.name.startsWith(cleanModelName + '.') || 
                file.name.includes(cleanModelName + '_')
            );

            console.log('deleteOldImage - Archivos del modelo encontrados:', modelFiles);

            if (modelFiles.length > 0) {
                const filesToDelete = modelFiles.map(f => f.name);
                const { error: deleteError } = await supabase.storage
                    .from('imagenes-modelos')
                    .remove(filesToDelete);

                if (deleteError) {
                    console.warn('Error eliminando archivos del modelo:', deleteError);
                } else {
                    console.log('Archivos del modelo eliminados:', filesToDelete);
                }
            }
        }
    } catch (error) {
        console.warn('Error eliminando imagen vieja:', error);
    }
}