/**
 * LÓGICA DEFINITIVA PARA CLOUD GALLERY (Soporta Texto, Imagen y Video)
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Helper para convertir imagen a Base64
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });
}

async function generar() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    const prompt = document.getElementById('promptInput').value.trim();
    const model = document.getElementById('modelSelect').value;

    // Detectamos en qué modo está la web (según tu captura, hay 3 tabs)
    // Asumimos que tienes una variable 'currentMode' o clases activas
    const mode = document.querySelector('.tab-btn.active')?.getAttribute('data-mode') || 'text2img';

    setLoadingState(true);

    try {
        let payload = { model: model, messages: [] };

        if (mode === 'text2img') {
            payload.messages = [{ role: "user", content: prompt }];
        } else {
            // Modo Imagen a Imagen / Video: Requiere enviar la imagen subida
            const fileInput = document.getElementById('fileInput');
            if (!fileInput.files[0]) throw new Error("Por favor sube una imagen primero.");

            const base64Image = await fileToBase64(fileInput.files[0]);
            payload.messages = [{
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: base64Image } }
                ]
            }];
        }

        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://dmorales-v.github.io/CloudGallery/',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // Mostrar resultado
        const result = data.choices[0].message.content;
        const img = document.getElementById('generatedImage');
        img.src = result;
        document.getElementById('imageWrapper').style.display = 'block';

    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        setLoadingState(false);
    }
}

// Conectar botón
document.getElementById('generateBtn').addEventListener('click', generar);