// js/auth.js
import { supabase } from './supabase-config.js';

// 1. FUNCIÓN PARA REGISTRAR NUEVOS USUARIOS (MÉTODO CORREGIDO)
async function registrarUsuario(nombre, apellidos, correo, password, telefono, genero) {
    if(!nombre || !apellidos || !correo || !password || !telefono || !genero) {
        return alert("Por favor llena todos los campos obligatorios.");
    }

    const { data, error } = await supabase
        .from('usuarios')
        .insert([
            { 
                nombre: nombre, 
                apellidos: apellidos,
                correo: correo, 
                password: password,
                telefono: telefono,
                genero: genero,
                talla_preferida: 0,        // Se iniciará en cero hasta que la API mida el pie
                largo_pie: 0, 
                ancho_pie: 0,
                ultimo_modelo: 'Ninguno', 
                ultimo_color: 'Predeterminado'
            }
        ]);

    if (error) {
        alert("Error al registrar: " + error.message);
    } else {
        alert("¡Cuenta creada con éxito!");
        window.location.reload(); 
    }
}

// 2. FUNCIÓN PARA INICIAR SESIÓN (Muestra nombre y apellido en el saludo)
async function loginUsuario(correo, password) {
    if(!correo || !password) return alert("Por favor llena todos los campos");

    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo', correo)
        .eq('password', password);

    if (error || !data || data.length === 0) {
        alert("Correo o contraseña incorrectos o el usuario no existe.");
    } else {
        // Concatenamos nombre y apellido para el mensaje de bienvenida
        const nombreCompleto = data[0].nombre + " " + (data[0].apellidos || "");
        alert("¡Bienvenido, " + nombreCompleto + "!");
        
        sessionStorage.setItem('userId', data[0].id); 
        window.location.href = './app.html'; 
    }
}

// 3. FUNCIÓN PARA GUARDAR PREFERENCIAS DESDE EL PROBADOR EN TIEMPO REAL
async function guardarConfiguracionCalzado(modelo, color, talla) {
    const userId = sessionStorage.getItem('userId');
    if(!userId) return console.error("No se encontró un usuario activo en la sesión.");

    const { data, error } = await supabase
        .from('usuarios')
        .update({ 
            ultimo_modelo: modelo, 
            ultimo_color: color,
            talla_preferida: parseFloat(talla) // Aquí es donde la cámara inyectará la talla final
        })
        .eq('id', userId);

    if (error) {
        console.error("Error al guardar configuración:", error.message);
    } else {
        console.log("Preferencia de calzado actualizada en Supabase automáticamente.");
    }
}

// Hacer las funciones accesibles globalmente
window.registrarUsuario = registrarUsuario;
window.loginUsuario = loginUsuario;
window.guardarConfiguracionCalzado = guardarConfiguracionCalzado;