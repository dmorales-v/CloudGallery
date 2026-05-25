/**
 * AIRFORCE AI STUDIO - ADAPTADO A OPENROUTER
 */

const OPENROUTER_API_KEY = "";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Función de generación adaptada a OpenRouter
async function generarImagen() {
    // 1. Validaciones
    const promptText = promptInput.value.trim();
    if (!promptText) {
        mostrarError("El prompt no puede estar vacío.");
        return;
    }

    setLoadingState(true);

    try {
        // 2. Preparar petición para OpenRouter
        // Nota: Asegúrate de que el modelo seleccionado en el select sea, 
        // por ejemplo: "openai/dall-e-3" o "stablediffusion/sdxl"
        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://dmorales-v.github.io/CloudGallery/', // Tu URL de GitHub Pages
                'X-Title': 'CloudGallery AI',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelSelect.value,
                messages: [
                    {
                        role: "user",
                        content: promptText
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Error al conectar con OpenRouter");
        }

        const data = await response.json();

        // 3. Procesar respuesta
        // OpenRouter devuelve el contenido en choices[0].message.content
        // Si el modelo genera imágenes, la URL suele venir ahí.
        const resultUrl = data.choices[0].message.content;

        if (!resultUrl) {
            throw new Error("El modelo no devolvió una imagen válida.");
        }

        generatedImage.src = resultUrl;
        mostrarResultadoImagen();

    } catch (error) {
        mostrarError(error.message);
    } finally {
        setLoadingState(false);
    }
}

// === FUNCIONES DE APOYO (Mantén estas igual) ===
function setLoadingState(isLoading) {
    if (isLoading) {
        generateBtn.disabled = true;
        resultLoader.style.display = 'flex';
        imageWrapper.style.display = 'none';
    } else {
        generateBtn.disabled = false;
        resultLoader.style.display = 'none';
    }
}

function mostrarResultadoImagen() {
    imageWrapper.style.display = 'flex';
}

function mostrarError(mensaje) {
    resultLoader.style.display = 'none';
    errorMessage.textContent = mensaje;
    resultError.style.display = 'flex';
}

// Event Listeners básicos
generateBtn.addEventListener('click', generarImagen);

