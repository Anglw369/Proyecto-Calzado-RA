// Función para cambiar color (Alcance del proyecto)
function cambiarColor(colorHex) {
    const modelViewer = document.querySelector("#shoe-viewer");
    const [material] = modelViewer.model.materials;
    material.pbrMetallicRoughness.setBaseColorFactor(colorHex);
}

// Función para cambiar talla/escala (Alcance del proyecto)
function cambiarEscala(escala) {
    const modelViewer = document.querySelector("#shoe-viewer");
    modelViewer.scale = `${escala} ${escala} ${escala}`;
}