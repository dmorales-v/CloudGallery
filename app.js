/**
 * AIRFORCE AI STUDIO — app.js
 * API: OpenRouter /api/v1/chat/completions
 * Modos: text2img · img2img · img2vid
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ─── Mapa de modelos del selector → IDs reales de OpenRouter ──────────────────
const IMAGE_MODELS = {
    "flux-2-dev": "black-forest-labs/flux-1-dev",         // Flux 1 Dev (img generation)
    "flux.1-schnell": "black-forest-labs/flux-1-schnell",     // Flux 1 Schnell
    "flux.1-dev": "black-forest-labs/flux-1-dev",
    "flux-2-pro": "black-forest-labs/flux.2-pro",
    "imagen-3": "google/gemini-2.5-flash-image",        // Mejor alternativa disponible
    "imagen-4": "google/gemini-3.1-flash-image-preview",
    "z-image": "black-forest-labs/flux.2-flex",        // Flex para estilos artísticos
    "flux-2-flex": "black-forest-labs/flux.2-flex",
};

// Modelos de video (OpenRouter soporta generación de video vía chat completions)
const VIDEO_MODELS = {
    "kling": "kling-ai/kling-video-1.5-std",
    "luma": "luma/ray-flash-2-720p",
    "pika": "pika/pika-2.2",
};

// ─── Estado Global ─────────────────────────────────────────────────────────────
let currentMode = "text2img";

// ─── INICIALIZACIÓN ────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initAccordion();
    initAspectRatio();
    initSliders();
    initDropzone();
    initApiKeyToggle();
    initDownload();

    document.getElementById("generateBtn").addEventListener("click", generar);
    document.getElementById("retryBtn").addEventListener("click", generar);
});

// ─── TABS DE MODO ──────────────────────────────────────────────────────────────
function initTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentMode = btn.dataset.mode;
            updateUIForMode(currentMode);
        });
    });
}

function updateUIForMode(mode) {
    const badge = document.getElementById("activeModeBadge");
    const uploadGroup = document.getElementById("uploadGroup");
    const modelGroup = document.getElementById("modelGroup");
    const videoModelGroup = document.getElementById("videoModelGroup");
    const negPromptGroup = document.getElementById("negativePromptGroup");
    const strengthGroup = document.getElementById("strengthGroup");
    const motionGroup = document.getElementById("motionGroup");
    const aspectGroup = document.getElementById("aspectRatioGroup");
    const promptLabel = document.getElementById("promptLabel");
    const generateBtnText = document.getElementById("generateBtnText");
    const placeholderTitle = document.getElementById("placeholderTitle");
    const placeholderDesc = document.getElementById("placeholderDesc");
    const placeholderIcon = document.getElementById("placeholderIcon");

    // Ocultar todo primero
    [uploadGroup, videoModelGroup, strengthGroup, motionGroup].forEach(el => {
        el.classList.add("hidden-control");
    });
    modelGroup.classList.remove("hidden-control");
    negPromptGroup.classList.remove("hidden-control");
    aspectGroup.classList.remove("hidden-control");

    badge.className = "mode-badge";

    if (mode === "text2img") {
        badge.classList.add("mode-badge-text2img");
        badge.textContent = "TEXTO A IMAGEN";
        promptLabel.innerHTML = '<i class="fa-solid fa-comment-dots"></i> Escribe tu Prompt';
        generateBtnText.textContent = "Generar Imagen";
        placeholderIcon.className = "fa-regular fa-image";
        placeholderTitle.textContent = "Tu obra de arte aparecerá aquí";
        placeholderDesc.textContent = 'Escribe un prompt, ajusta las opciones y haz clic en "Generar Imagen".';

    } else if (mode === "img2img") {
        badge.classList.add("mode-badge-img2img");
        badge.textContent = "IMAGEN A IMAGEN";
        uploadGroup.classList.remove("hidden-control");
        strengthGroup.classList.remove("hidden-control");
        promptLabel.innerHTML = '<i class="fa-solid fa-comment-dots"></i> Describe la modificación';
        generateBtnText.textContent = "Transformar Imagen";
        placeholderIcon.className = "fa-solid fa-wand-magic-sparkles";
        placeholderTitle.textContent = "Imagen transformada aquí";
        placeholderDesc.textContent = "Sube una imagen de referencia, describe los cambios y haz clic en Transformar.";

    } else if (mode === "img2vid") {
        badge.classList.add("mode-badge-img2vid");
        badge.textContent = "IMAGEN A VIDEO";
        uploadGroup.classList.remove("hidden-control");
        modelGroup.classList.add("hidden-control");
        videoModelGroup.classList.remove("hidden-control");
        negPromptGroup.classList.add("hidden-control");
        aspectGroup.classList.add("hidden-control");
        motionGroup.classList.remove("hidden-control");
        promptLabel.innerHTML = '<i class="fa-solid fa-comment-dots"></i> Describe el movimiento';
        generateBtnText.textContent = "Generar Video";
        placeholderIcon.className = "fa-solid fa-film";
        placeholderTitle.textContent = "Tu video aparecerá aquí";
        placeholderDesc.textContent = "Sube una imagen, describe el movimiento deseado y haz clic en Generar Video.";
    }

    showState("placeholder");
}

// ─── GENERACIÓN PRINCIPAL ──────────────────────────────────────────────────────
async function generar() {
    const apiKey = document.getElementById("apiKeyInput").value.trim();
    const prompt = document.getElementById("promptInput").value.trim();
    const fileInput = document.getElementById("fileInput");

    if (!apiKey) { showError("Introduce tu API Key de OpenRouter (sk-or-...)."); return; }
    if (!prompt) { showError("Escribe un prompt para describir la imagen o movimiento."); return; }

    const needsImage = currentMode === "img2img" || currentMode === "img2vid";
    if (needsImage && (!fileInput.files || fileInput.files.length === 0)) {
        showError("Este modo requiere que subas una imagen de referencia.");
        return;
    }

    setLoadingState(true);

    try {
        if (currentMode === "img2vid") {
            await generarVideo(apiKey, prompt, fileInput);
        } else {
            await generarImagen(apiKey, prompt, fileInput);
        }
    } catch (err) {
        console.error(err);
        showError(err.message || "Error desconocido. Verifica tu API Key y conexión.");
    } finally {
        setLoadingState(false);
    }
}

// ─── GENERACIÓN DE IMAGEN (text2img / img2img) ─────────────────────────────────
async function generarImagen(apiKey, prompt, fileInput) {
    const modelKey = document.getElementById("modelSelect").value;
    const modelId = IMAGE_MODELS[modelKey] || "black-forest-labs/flux-1-schnell";
    const aspectRatio = document.getElementById("aspectRatioInput").value;
    const negPrompt = document.getElementById("negativePrompt").value.trim();

    // Construir el contenido del mensaje
    const messageContent = [];

    // En img2img añadimos la imagen de referencia + strength
    if (currentMode === "img2img" && fileInput.files.length > 0) {
        const base64 = await toBase64(fileInput.files[0]);
        messageContent.push({ type: "image_url", image_url: { url: base64 } });
    }

    // Prompt de texto (incluyendo negative prompt si existe)
    let finalPrompt = prompt;
    if (negPrompt) finalPrompt += `\n\nNegative prompt: ${negPrompt}`;
    messageContent.push({ type: "text", text: finalPrompt });

    // Payload para OpenRouter
    const payload = {
        model: modelId,
        messages: [{ role: "user", content: messageContent }],
        modalities: ["image"],
        image_config: { aspect_ratio: aspectRatio }
    };

    // Strength solo para img2img
    if (currentMode === "img2img") {
        const strength = parseFloat(document.getElementById("strengthRange").value);
        payload.image_config.strength = strength;
    }

    const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://dmorales-v.github.io/CloudGallery/",
            "X-Title": "AirForce AI Studio"
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        const errMsg = data?.error?.message || `HTTP ${response.status}`;
        throw new Error(`Error de API: ${errMsg}`);
    }

    // Extraer imagen de la respuesta OpenRouter
    const message = data?.choices?.[0]?.message;
    if (!message) throw new Error("Respuesta inesperada de la API.");

    // La imagen puede venir en message.images o en message.content (Gemini)
    let imageUrl = null;

    if (message.images && message.images.length > 0) {
        imageUrl = message.images[0]?.image_url?.url;
    } else if (Array.isArray(message.content)) {
        const imgBlock = message.content.find(b => b.type === "image_url");
        if (imgBlock) imageUrl = imgBlock.image_url?.url;
    }

    if (!imageUrl) {
        throw new Error("El modelo no devolvió ninguna imagen. Prueba con otro modelo o prompt.");
    }

    document.getElementById("generatedImage").src = imageUrl;
    showState("image");
}

// ─── GENERACIÓN DE VIDEO (img2vid) ────────────────────────────────────────────
async function generarVideo(apiKey, prompt, fileInput) {
    const videoModelKey = document.getElementById("videoModelSelect").value;
    const modelId = VIDEO_MODELS[videoModelKey] || "luma/ray-flash-2-720p";
    const base64 = await toBase64(fileInput.files[0]);

    const payload = {
        model: modelId,
        messages: [{
            role: "user",
            content: [
                { type: "image_url", image_url: { url: base64 } },
                { type: "text", text: prompt }
            ]
        }],
        modalities: ["video"]
    };

    const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://dmorales-v.github.io/CloudGallery/",
            "X-Title": "AirForce AI Studio"
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        const errMsg = data?.error?.message || `HTTP ${response.status}`;
        throw new Error(`Error de API: ${errMsg}`);
    }

    const message = data?.choices?.[0]?.message;
    if (!message) throw new Error("Respuesta inesperada de la API.");

    // Buscar URL de video en la respuesta
    let videoUrl = null;
    if (message.video) videoUrl = message.video?.url;
    if (!videoUrl && Array.isArray(message.content)) {
        const vidBlock = message.content.find(b => b.type === "video_url");
        if (vidBlock) videoUrl = vidBlock.video_url?.url;
    }

    if (!videoUrl) {
        throw new Error("El modelo no devolvió ningún video. Verifica que el modelo esté disponible en tu plan.");
    }

    document.getElementById("generatedVideo").src = videoUrl;
    showState("video");
}

// ─── UI HELPERS ────────────────────────────────────────────────────────────────
function showState(state) {
    document.getElementById("resultPlaceholder").style.display = "none";
    document.getElementById("resultLoader").style.display = "none";
    document.getElementById("imageWrapper").style.display = "none";
    document.getElementById("videoWrapper").style.display = "none";
    document.getElementById("resultError").style.display = "none";

    if (state === "placeholder") {
        document.getElementById("resultPlaceholder").style.display = "flex";
    } else if (state === "loading") {
        document.getElementById("resultLoader").style.display = "flex";
    } else if (state === "image") {
        document.getElementById("imageWrapper").style.display = "flex";
    } else if (state === "video") {
        document.getElementById("videoWrapper").style.display = "flex";
    } else if (state === "error") {
        document.getElementById("resultError").style.display = "flex";
    }
}

function showError(msg) {
    document.getElementById("errorMessage").textContent = msg;
    showState("error");
}

function setLoadingState(loading) {
    const btn = document.getElementById("generateBtn");
    const spinner = document.getElementById("btnSpinner");
    const btnText = document.getElementById("generateBtnText");

    btn.disabled = loading;
    spinner.style.display = loading ? "block" : "none";

    if (loading) {
        showState("loading");
        animateLoader();
    }
}

function animateLoader() {
    const messages = [
        "Inicializando neuronas...",
        "Calculando píxeles...",
        "Aplicando magia...",
        "Casi listo...",
    ];
    let i = 0;
    const el = document.getElementById("loaderStatusText");
    const interval = setInterval(() => {
        if (!document.getElementById("resultLoader").style.display.includes("flex")) {
            clearInterval(interval);
            return;
        }
        el.textContent = messages[i % messages.length];
        i++;
    }, 1800);
}

// ─── UTILIDADES ────────────────────────────────────────────────────────────────
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
        reader.readAsDataURL(file);
    });
}

// ─── ACORDEÓN ──────────────────────────────────────────────────────────────────
function initAccordion() {
    const btn = document.getElementById("accordionBtn");
    const item = btn.closest(".accordion-item");
    btn.addEventListener("click", () => item.classList.toggle("active"));
}

// ─── ASPECT RATIO ──────────────────────────────────────────────────────────────
function initAspectRatio() {
    document.querySelectorAll(".aspect-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".aspect-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById("aspectRatioInput").value = btn.dataset.ratio;
        });
    });
}

// ─── SLIDERS ───────────────────────────────────────────────────────────────────
function initSliders() {
    const sliders = [
        { id: "stepsRange", output: "stepsValue", decimals: 0 },
        { id: "strengthRange", output: "strengthValue", decimals: 2 },
        { id: "motionRange", output: "motionValue", decimals: 0 },
    ];
    sliders.forEach(({ id, output, decimals }) => {
        const slider = document.getElementById(id);
        const label = document.getElementById(output);
        if (!slider || !label) return;
        slider.addEventListener("input", () => {
            label.textContent = parseFloat(slider.value).toFixed(decimals);
        });
    });
}

// ─── DROPZONE ──────────────────────────────────────────────────────────────────
function initDropzone() {
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("fileInput");
    const preview = document.getElementById("uploadPreview");
    const previewImg = document.getElementById("previewImg");
    const filename = document.getElementById("previewFilename");
    const filesize = document.getElementById("previewSize");
    const removeBtn = document.getElementById("removeUploadBtn");

    // Click para abrir selector
    dropzone.addEventListener("click", () => fileInput.click());

    // Drag & drop
    dropzone.addEventListener("dragover", e => { e.preventDefault(); dropzone.classList.add("dragover"); });
    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
    dropzone.addEventListener("drop", e => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelected(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener("change", () => {
        if (fileInput.files.length) handleFileSelected(fileInput.files[0]);
    });

    removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        fileInput.value = "";
        preview.style.display = "none";
        dropzone.style.display = "flex";
    });

    function handleFileSelected(file) {
        const url = URL.createObjectURL(file);
        previewImg.src = url;
        filename.textContent = file.name;
        filesize.textContent = (file.size / 1024).toFixed(1) + " KB";
        preview.style.display = "flex";
        dropzone.style.display = "none";
    }
}

// ─── API KEY TOGGLE ────────────────────────────────────────────────────────────
function initApiKeyToggle() {
    const btn = document.getElementById("toggleApiKeyBtn");
    const input = document.getElementById("apiKeyInput");
    const icon = document.getElementById("toggleApiKeyIcon");
    if (!btn) return;
    btn.addEventListener("click", () => {
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        icon.className = isPassword ? "fa-solid fa-eye" : "fa-solid fa-eye-slash";
    });
}

// ─── DESCARGA ──────────────────────────────────────────────────────────────────
function initDownload() {
    const downloadBtn = document.getElementById("downloadBtn");
    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            const img = document.getElementById("generatedImage");
            if (!img.src) return;
            const a = document.createElement("a");
            a.href = img.src;
            a.download = `airforce-ai-${Date.now()}.png`;
            a.click();
        });
    }

    const downloadVideoBtn = document.getElementById("downloadVideoBtn");
    if (downloadVideoBtn) {
        downloadVideoBtn.addEventListener("click", () => {
            const video = document.getElementById("generatedVideo");
            if (!video.src) return;
            const a = document.createElement("a");
            a.href = video.src;
            a.download = `airforce-ai-video-${Date.now()}.mp4`;
            a.click();
        });
    }
}
