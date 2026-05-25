/**
 * Componente de Modal Personalizado
 * Reemplaza alert() y confirm() con modales estilizados
 */

// Crear elementos del modal si no existen
function ensureModalElements() {
    if (!document.getElementById('custom-modal')) {
        const modalHTML = `
            <div id="custom-modal" class="custom-modal">
                <div class="custom-modal-backdrop"></div>
                <div class="custom-modal-content">
                    <div class="custom-modal-header">
                        <h3 id="custom-modal-title" class="custom-modal-title"></h3>
                        <button class="custom-modal-close" onclick="closeCustomModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="custom-modal-body">
                        <p id="custom-modal-message" class="custom-modal-message"></p>
                    </div>
                    <div class="custom-modal-footer">
                        <button id="custom-modal-cancel" class="custom-modal-btn custom-modal-btn-cancel" style="display: none;">Cancelar</button>
                        <button id="custom-modal-confirm" class="custom-modal-btn custom-modal-btn-confirm">Aceptar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
}

// Mostrar modal de alerta (solo aceptar)
export function showAlert(title, message, onConfirm = null) {
    ensureModalElements();
    
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('custom-modal-title');
    const messageEl = document.getElementById('custom-modal-message');
    const cancelBtn = document.getElementById('custom-modal-cancel');
    const confirmBtn = document.getElementById('custom-modal-confirm');
    
    titleEl.textContent = title || 'Mensaje';
    messageEl.textContent = message || '';
    cancelBtn.style.display = 'none';
    confirmBtn.textContent = 'Aceptar';
    
    modal.classList.add('custom-modal--active');
    
    const handleConfirm = () => {
        closeCustomModal();
        if (onConfirm) onConfirm();
    };
    
    confirmBtn.onclick = handleConfirm;
    document.querySelector('.custom-modal-backdrop').onclick = handleConfirm;
}

// Mostrar modal de confirmación (aceptar/cancelar)
export function showConfirm(title, message, onConfirm, onCancel = null) {
    ensureModalElements();
    
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('custom-modal-title');
    const messageEl = document.getElementById('custom-modal-message');
    const cancelBtn = document.getElementById('custom-modal-cancel');
    const confirmBtn = document.getElementById('custom-modal-confirm');
    
    titleEl.textContent = title || 'Confirmar';
    messageEl.textContent = message || '';
    cancelBtn.style.display = 'block';
    cancelBtn.textContent = 'Cancelar';
    confirmBtn.textContent = 'Confirmar';
    
    modal.classList.add('custom-modal--active');
    
    const handleConfirm = () => {
        closeCustomModal();
        if (onConfirm) onConfirm();
    };
    
    const handleCancel = () => {
        closeCustomModal();
        if (onCancel) onCancel();
    };
    
    confirmBtn.onclick = handleConfirm;
    cancelBtn.onclick = handleCancel;
    document.querySelector('.custom-modal-backdrop').onclick = handleCancel;
}

// Cerrar modal
window.closeCustomModal = function() {
    const modal = document.getElementById('custom-modal');
    if (modal) {
        modal.classList.remove('custom-modal--active');
    }
};

// Cerrar con tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeCustomModal();
    }
});
