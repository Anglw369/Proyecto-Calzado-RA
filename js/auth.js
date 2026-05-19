// js/auth.js
import { supabase } from './supabase-config.js';

// 1. FUNCIÓN PARA REGISTRAR NUEVOS USUARIOS
async function registrarUsuario(nombre, correo, password) {
    if(!nombre || !correo || !password) return alert("Por favor llena todos los campos");

    const { data, error } = await supabase
        .from('usuarios') // Verifica que tu tabla en Supabase se llame exactamente así
        .insert([
            { 
                nombre: nombre, 
                correo: correo, 
                password: password,
                largo_pie: 0, // Valores base para cuando metamos la medición de IA
                ancho_pie: 0 
            }
        ]);

    if (error) {
        alert("Error al registrar: " + error.message);
    } else {
        alert("¡Usuario registrado con éxito en la nube!");
        window.location.reload(); // Recarga para que pueda usar el login inmediatamente
    }
}

// 2. FUNCIÓN PARA INICIAR SESIÓN
async function loginUsuario(correo, password) {
    if(!correo || !password) return alert("Por favor llena todos los campos");

    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo', correo)
        .eq('password', password);

    // Revisamos si la base de datos encontró coincidencia
    if (error || !data || data.length === 0) {
        alert("Correo o contraseña incorrectos o el usuario no existe.");
    } else {
        alert("¡Bienvenido, " + data[0].nombre + "!");
        
        // Guardamos el ID en la sesión para saber de quién es el pie que mediremos en la cámara
        sessionStorage.setItem('userId', data[0].id); 
        
        // Te manda directo al probador de cámara (app.html)
        window.location.href = 'app.html'; 
    }
}

// Hacer las funciones visibles para los eventos 'onclick' de tus botones HTML
window.registrarUsuario = registrarUsuario;
window.loginUsuario = loginUsuario;