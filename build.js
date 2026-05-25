const fs = require('fs');
const path = require('path');

try {
    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

    // Reemplazar la etiqueta link por el contenido CSS en línea
    html = html.replace(
        '<link rel="stylesheet" href="style.css">',
        `<style>\n${css}\n</style>`
    );

    // Reemplazar la etiqueta script src por el contenido JS en línea
    html = html.replace(
        '<script src="app.js"></script>',
        `<script>\n${js}\n</script>`
    );

    // Guardar el archivo compilado
    fs.writeFileSync(path.join(__dirname, 'index_single.html'), html, 'utf8');
    console.log('¡Éxito! Se ha generado "index_single.html" con todos los recursos inyectados.');
} catch (err) {
    console.error('Error al compilar el archivo único:', err);
}
