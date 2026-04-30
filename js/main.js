const video = document.getElementById('webcam');

async function iniciarCamara() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: "environment" } }
        });
        video.srcObject = stream;
    } catch (err) {
        console.error("No se pudo usar la cámara trasera, intentando cámara genérica:", err);
        // Intento secundario si la cámara exacta falla
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => video.srcObject = stream);
    }
}

iniciarCamara();