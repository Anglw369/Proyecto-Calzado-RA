// js/auth.js
import { supabase } from './supabase-config.js';

// 1. FUNCIÓN PARA REGISTRAR NUEVOS USUARIOS (CON DATOS AMPLIADOS)
async function registrarUsuario(nombre, correo, password, telefono, genero, talla) {
    if(!nombre || !correo || !password || !telefono || !genero || !talla) {
        return alert("Por favor llena todos los campos obligatorios.");
    }

    const { data, error } = await supabase
        .from('usuarios')
        .insert([
            { 
                nombre: nombre, 
                correo: correo, 
                password: password,
                telefono: telefono,
                genero: genero,
                talla_preferida: parseFloat(talla),
                largo_pie: 0, 
                ancho_pie: 0,
                ultimo_modelo: 'Ninguno', // Valores iniciales por defecto
                ultimo_color: 'Predeterminado'
            }
        ]);

    if (error) {
        alert("Error al registrar de forma profesional: " + error.message);
    } else {
        alert("¡Cuenta profesional creada con éxito en la nube!");
        window.location.reload(); // Recarga la página para proceder al login
    }
}

// 2. FUNCIÓN PARA INICIAR SESIÓN (SE QUEDA IGUAL)
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
        alert("¡Bienvenido, " + data[0].nombre + "!");
        sessionStorage.setItem('userId', data[0].id); 
        window.location.href = './app.html'; // Redirección corregida a la raíz
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
            talla_preferida: parseFloat(talla)
        })
        .eq('id', userId);

    if (error) {
        console.error("Error al guardar configuración en caliente:", error.message);
    } else {
        console.log("Preferencia de calzado actualizada en Supabase automáticamente.");
    }
}

// Hacer las funciones accesibles globalmente desde el HTML y otros scripts
window.registrarUsuario = registrarUsuario;
window.loginUsuario = loginUsuario;
window.guardarConfiguracionCalzado = guardarConfiguracionCalzado;