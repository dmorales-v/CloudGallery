/**
 * Lógica unificada para CloudGallery (OpenRouter)
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

async function generar() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    const prompt = document.getElementById('promptInput').value.trim();
    const fileInput = document.getElementById('fileInput');

    // 1. Modelo por defecto para evitar errores si no seleccionan nada
    const model = document.getElementById('modelSelect').value || "openai/dall-e-3";

    if (!apiKey) { alert("Introduce tu API Key de OpenRouter"); return; }
    if (!prompt) { alert("Escribe un prompt"); return; }

    setLoadingState(true);

    try {
        let bodyPayload = {
            model: model,
            messages: [{ role: "user", content: prompt }]
        };

        // 2. Si hay imagen subida, la convertimos a base64 y la incluimos
        if (fileInput.files && fileInput.files[0]) {
            const base64 = await toBase64(fileInput.files[0]);
            bodyPayload.messages[0].content = [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: base64 } }
            ];
        }

        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://dmorales-v.github.io/CloudGallery/',
                'X-Title': 'CloudGallery AI',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyPayload)
        });

        const data = await response.json();

        // 3. Mostrar resultado
        if (data.choices && data.choices[0].message.content) {
            const resultUrl = data.choices[0].message.content;
            document.getElementById('generatedImage').src = resultUrl;
            document.getElementById('imageWrapper').style.display = 'block';
        } else {
            throw new Error("El modelo no generó una respuesta válida.");
        }

    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        setLoadingState(false);
    }
}

function toBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

function setLoadingState(loading) {
    document.getElementById('generateBtn').disabled = loading;
    document.getElementById('resultLoader').style.display = loading ? 'flex' : 'none';
}

document.getElementById('generateBtn').addEventListener('click', generar);