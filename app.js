/**
 * Lógica completa para CloudGallery con OpenRouter
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Función principal de generación
async function generarImagen() {
    // 1. Obtener valores de la interfaz
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    const promptText = document.getElementById('promptInput').value.trim();
    const model = document.getElementById('modelSelect').value;

    // Validación básica
    if (!apiKey) {
        alert("Por favor, ingresa tu API Key.");
        return;
    }
    if (!promptText) {
        alert("Escribe algo para generar.");
        return;
    }

    setLoadingState(true);

    try {
        // 2. Realizar la llamada a OpenRouter
        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://dmorales-v.github.io/CloudGallery/',
                'X-Title': 'CloudGallery AI',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: promptText }]
            })
        });

        // 3. Procesar errores de respuesta
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || "Error al conectar con OpenRouter");
        }

        const data = await response.json();

        // 4. Extraer URL de la respuesta
        // Nota: Si el modelo devuelve texto, este código lo mostrará. 
        // Si es un modelo de imagen, el resultado suele ser una URL.
        const result = data.choices[0].message.content;

        const imgElement = document.getElementById('generatedImage');
        imgElement.src = result;
        document.getElementById('imageWrapper').style.display = 'block';

    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        setLoadingState(false);
    }
}

// Control del estado de carga (Spinner)
function setLoadingState(isLoading) {
    const btn = document.getElementById('generateBtn');
    const loader = document.getElementById('resultLoader');

    btn.disabled = isLoading;
    loader.style.display = isLoading ? 'flex' : 'none';
}

// Inicialización de eventos
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('generateBtn').addEventListener('click', generarImagen);
});