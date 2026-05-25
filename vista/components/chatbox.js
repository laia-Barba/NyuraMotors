/**
 * Chatbox - Asistente Nyura Motors
 * Integración con Groq API para recomendación de coches
 */

// Configuración de modelos disponibles en el catálogo
const CAR_MODELS = {
    daemon: {
        name: 'Nyura Daemon',
        description: 'SUV eléctrico con diseño agresivo y rendimiento excepcional',
        price: '53.800 €',
        gama: 'Sport R',
        features: ['SUV eléctrico', 'Diseño agresivo', 'Rendimiento excepcional', 'Configurador 3D disponible']
    },
    thunder_be: {
        name: 'Nyura Thunder Black Edition',
        description: 'Supercar de combustion con tecnología puntera y velocidad extrema',
        price: '79.200 €',
        gama: 'Sport',
        features: ['Supercar de combustion', 'Tecnología puntera', 'Velocidad extrema', 'Configurador 3D disponible']
    },
    thunder: {
        name: 'Nyura Thunder',
        description: 'Deportivo de combustion con aceleración brutal y diseño agresivo',
        price: '53.460 €',
        gama: 'Sport',
        features: ['Deportivo de combustion', 'Aceleración brutal', 'Diseño agresivo', 'Configurador 3D disponible']
    },
    altamira: {
        name: 'Nyura Altamira',
        description: 'Compacto pequeño perfecto para ciudad y tecnología avanzada',
        price: '29.790 €',
        gama: 'Combustión',
        features: ['Compacto pequeño', 'Perfecto para ciudad', 'Tecnología avanzada', 'Configurador 3D disponible']
    },
    spark: {
        name: 'Nyura Spark',
        description: '4x4 hibrido, perfecto para cualquier terreno',
        price: '72.300 €',
        gama: 'Eléctrica',
        features: ['4x4 hibrido', 'Perfecto para cualquier terreno', 'Configurador 3D disponible', 'Versatilidad']
    },
    vortex: {
        name: 'Nyura Vortex',
        description: 'SUV eléctrico con autonomía extendida y diseño futurista',
        price: '42.900 €',
        gama: 'Eléctrica',
        features: ['SUV eléctrico', 'Autonomía extendida', 'Diseño futurista', 'Configurador 3D disponible']
    },
    nova: {
        name: 'Nyura Nova',
        description: 'Berlina eficiente con motor de gasolina de última generación',
        price: '21.700 €',
        gama: 'Combustión',
        features: ['Berlina eficiente', 'Motor de gasolina de última generación', 'Configurador 3D disponible', 'Eficiencia']
    },
    nova_sport: {
        name: 'Nyura Nova Sport',
        description: 'Deportivo de alto rendimiento con aerodinámica avanzada',
        price: '39.450 €',
        gama: 'Sport',
        features: ['Deportivo de alto rendimiento', 'Aerodinámica avanzada', 'Configurador 3D disponible', 'Rendimiento']
    }
};

// System prompt para restringir respuestas
const SYSTEM_PROMPT = `Eres un asistente de ventas de Nyura Motors, una empresa de coches de lujo. Tu única función es recomendar vehículos del catálogo de Nyura Motors a los clientes.

CATÁLOGO DISPONIBLE:
1. Nyura Vortex - SUV eléctrico con autonomía extendida y diseño futurista (42.900 €)
2. Nyura Nova - Berlina eficiente con motor de gasolina de última generación (21.700 €)
3. Nyura Nova Sport - Deportivo de alto rendimiento con aerodinámica avanzada (39.450 €)
4. Nyura Spark - 4x4 hibrido, perfecto para cualquier terreno (72.300 €)
5. Nyura Altamira - Compacto pequeño perfecto para ciudad y tecnología avanzada (29.790 €)
6. Nyura Thunder - Deportivo de combustion con aceleración brutal y diseño agresivo (53.460 €)
7. Nyura Thunder Black Edition - Supercar de combustion con tecnología puntera y velocidad extrema (79.200 €)
8. Nyura Daemon - SUV eléctrico con diseño agresivo y rendimiento excepcional (53.800 €)

REGLAS ESTRICTAS:
- SOLO puedes hablar de estos 8 modelos
- NO puedes inventar modelos, características o precios
- NO puedes responder sobre temas ajenos a Nyura Motors
- Si el usuario pregunta sobre algo fuera del catálogo, responde educadamente que solo puedes ayudar con los modelos de Nyura Motors
- NO puedes proporcionar información técnica detallada que no esté en el catálogo
- NO puedes hacer comparaciones con otras marcas
- SIEMPRE mantén un tono profesional y servicial
- Puedes hacer preguntas para entender mejor las necesidades del cliente (presupuesto, uso, tamaño, etc.)

Cuando recomiendes un coche, incluye:
- Nombre del modelo
- Precio
- Descripción principal
- Características principales
- Por qué se adapta a las necesidades del usuario`;

class Chatbox {
    constructor() {
        this.isOpen = false;
        this.apiKey = null;
        this.isTyping = false;
        this.conversationHistory = [
            {
                role: 'system',
                content: 'Eres un asistente de ventas de Nyura Motors. Solo recomienda estos 8 modelos: Vortex, Nova, Nova Sport, Spark, Altamira, Thunder, Thunder Black Edition, Daemon. No inventes información. Responde siempre en máximo 3 frases. Sé conciso y directo.'
            }
        ];
        this.init();
    }

    async init() {
        // Cargar API key de Groq desde archivo JSON
        try {
            const response = await fetch('components/chatbox-config.json');
            const config = await response.json();
            this.apiKey = config.GROQ_API_KEY || 'gsk_your_api_key_here';
            console.log('API Key cargada:', this.apiKey ? 'Sí' : 'No');
            console.log('API Key length:', this.apiKey.length);
        } catch (error) {
            console.error('Error cargando configuración:', error);
            this.apiKey = 'gsk_your_api_key_here';
        }
        
        // Cargar elementos del DOM
        this.chatbox = document.getElementById('chatbox');
        this.chatbot = document.getElementById('chatbot');
        this.bubble = document.getElementById('chatbox-bubble');
        this.display = document.getElementById('chatbox-display');
        this.input = document.getElementById('chatbox-input');

        // Event listeners
        if (this.input) {
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Ocultar bocadillo después de 5 segundos
        setTimeout(() => {
            if (this.bubble) {
                this.bubble.style.opacity = '0';
                this.bubble.style.visibility = 'hidden';
            }
        }, 5000);
    }

    updateDisplay(content) {
        if (this.display) {
            this.display.innerHTML = `<p>${this.escapeHtml(content)}</p>`;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async sendMessage() {
        const message = this.input.value.trim();
        
        if (!message || this.isTyping) return;
        
        // Mostrar el mensaje del usuario
        this.updateDisplay(`Tú: ${message}`);
        this.input.value = '';
        
        this.isTyping = true;
        this.input.disabled = true;
        
        // Mostrar indicador de escritura
        this.updateDisplay('Escribiendo...');
        
        try {
            const response = await this.callGroqAPI(message);
            this.updateDisplay(response);
        } catch (error) {
            console.error('Error en chatbox:', error);
            this.updateDisplay('Lo siento, ha ocurrido un error. Por favor, intenta de nuevo más tarde.');
        } finally {
            this.isTyping = false;
            this.input.disabled = false;
            this.input.focus();
        }
    }

    async callGroqAPI(userMessage) {
        // Validación de entrada para evitar ataques
        if (!this.validateInput(userMessage)) {
            return 'Lo siento, no puedo procesar ese mensaje. Por favor, formula tu pregunta de otra manera.'
        }

        // Añadir mensaje del usuario al historial
        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: this.conversationHistory,
                temperature: 0.7,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'No se pudo leer el error' }));
            console.error('Error API Groq:', response.status, errorData);
            throw new Error(`Error en API: ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage = data.choices[0].message.content;
        
        // Añadir respuesta del asistente al historial
        this.conversationHistory.push({
            role: 'assistant',
            content: assistantMessage
        });
        
        // Validar que la respuesta sea sobre los modelos del catálogo
        if (!this.validateResponse(assistantMessage)) {
            return 'Lo siento, solo puedo ayudarte con información sobre los modelos de Nyura Motors: Vortex, Thunder, Altamira, Nova y Daemon. ¿Te gustaría saber más sobre alguno de ellos?';
        }
        
        return assistantMessage;
    }

    validateInput(message) {
        // Validaciones básicas de seguridad
        const forbiddenPatterns = [
            /<script>/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /eval\(/i,
            /document\./i,
            /window\./i,
            /alert\(/i
        ];

        for (const pattern of forbiddenPatterns) {
            if (pattern.test(message)) {
                return false;
            }
        }

        // Limitar longitud del mensaje
        if (message.length > 1000) {
            return false;
        }

        return true;
    }

    validateResponse(response) {
        // Validar que la respuesta mencione solo modelos del catálogo
        const modelNames = Object.keys(CAR_MODELS).map(k => CAR_MODELS[k].name.toLowerCase());
        const responseLower = response.toLowerCase();
        
        // Si la respuesta menciona algún modelo del catálogo, es válida
        const mentionsCatalog = modelNames.some(name => responseLower.includes(name.toLowerCase()));
        
        // Si no menciona ningún modelo, verificar que no esté hablando de cosas ajenas
        if (!mentionsCatalog) {
            // Palabras prohibidas en respuestas
            const forbiddenWords = ['ferrari', 'porsche', 'bmw', 'mercedes', 'audi', 'tesla', 'toyota', 'honda'];
            const mentionsForbidden = forbiddenWords.some(word => responseLower.includes(word));
            
            if (mentionsForbidden) {
                return false;
            }
        }
        
        return true;
    }
}

// Inicializar chatbox inmediatamente cuando se carga el script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new Chatbox();
    });
} else {
    // El DOM ya está cargado, inicializar inmediatamente
    new Chatbox();
}
