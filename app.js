/**
 * Lógica completa para Img2Img con OpenRouter
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Función para convertir archivo a Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

async function generarImagen() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    const promptText = document.getElementById('promptInput').value.trim();
    const model = document.getElementById('modelSelect').value;
    const fileInput = document.getElementById('fileInput');

    if (!apiKey || !promptText || fileInput.files.length === 0) {
        alert("Por favor, ingresa tu API Key, un prompt y una imagen.");
        return;
    }

    setLoadingState(true);

    try {
        // 1. Convertir imagen subida a base64
        const base64Image = await fileToBase64(fileInput.files[0]);

        // 2. Preparar petición para modelo de Visión
        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://dmorales-v.github.io/CloudGallery/',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [{
                    role: "user",
                    content: [
                        { type: "text", text: promptText },
                        { type: "image_url", image_url: { url: base64Image } }
                    ]
                }]
            })
        });

        const data = await response.json();

        // 3. Mostrar resultado
        if (data.choices && data.choices[0].message.content) {
            document.getElementById('generatedImage').src = data.choices[0].message.content;
            document.getElementById('imageWrapper').style.display = 'block';
        }
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        setLoadingState(false);
    }
}

function setLoadingState(isLoading) {
    document.getElementById('generateBtn').disabled = isLoading;
    document.getElementById('resultLoader').style.display = isLoading ? 'flex' : 'none';
}

document.getElementById('generateBtn').addEventListener('click', generarImagen);