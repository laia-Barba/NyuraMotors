const AUTH_USER_KEY = 'nyura_auth_user';

export function savePersistentUser(user) {
    if (!user) return;

    const userData = {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata || {},
        aud: user.aud || null,
        role: user.role || null,
        savedAt: new Date().toISOString()
    };

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
    console.log('[AuthPersistencia] Usuario guardado en localStorage', {
        hasUser: true,
        email: userData.email,
        id: userData.id
    });
}

export function getPersistentUser() {
    try {
        const rawUser = localStorage.getItem(AUTH_USER_KEY);
        if (!rawUser) {
            console.log('[AuthPersistencia] No hay usuario persistente en localStorage');
            return null;
        }

        const user = JSON.parse(rawUser);
        console.log('[AuthPersistencia] Usuario recuperado de localStorage', {
            hasUser: !!user,
            email: user?.email || null,
            id: user?.id || null,
            savedAt: user?.savedAt || null
        });

        return user;
    } catch (error) {
        console.error('[AuthPersistencia] Error leyendo usuario persistente', error);
        clearPersistentUser();
        return null;
    }
}

export function clearPersistentUser() {
    localStorage.removeItem(AUTH_USER_KEY);
    console.log('[AuthPersistencia] Usuario persistente eliminado');
}
