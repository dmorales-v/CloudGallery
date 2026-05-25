/**
 * LÓGICA ESTRICTA: IMAGEN A IMAGEN OBLIGATORIO
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

async function generar() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    const prompt = document.getElementById('promptInput').value.trim();
    const fileInput = document.getElementById('fileInput');
    const model = document.getElementById('modelSelect').value || "openai/gpt-4o";

    // VALIDACIÓN OBLIGATORIA
    if (!apiKey) { alert("Introduce tu API Key"); return; }
    if (!fileInput.files || fileInput.files.length === 0) {
        alert("¡Error! Debes subir una imagen para comenzar.");
        return;
    }
    if (!prompt) { alert("Escribe qué quieres modificar en la imagen"); return; }

    setLoadingState(true);

    try {
        const base64 = await toBase64(fileInput.files[0]);

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
                messages: [{
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: base64 } }
                    ]
                }]
            })
        });

        const data = await response.json();

        if (data.choices && data.choices[0].message.content) {
            const resultUrl = data.choices[0].message.content;
            document.getElementById('generatedImage').src = resultUrl;
            document.getElementById('imageWrapper').style.display = 'block';
        } else {
            throw new Error("El modelo no devolvió una imagen.");
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