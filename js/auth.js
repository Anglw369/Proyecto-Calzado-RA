// js/auth.js
import { supabase } from './supabase-config.js';

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
                talla_preferida: 0,        
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
        const nombreCompleto = data[0].nombre + " " + (data[0].apellidos || "");
        alert("¡Bienvenido, " + nombreCompleto + "!");
        
        // GUARDADO PERSISTENTE EN LOCALSTORAGE (No se borra al cerrar pestañas)
        localStorage.setItem('userId', data[0].id);
        localStorage.setItem('stepra_session', 'active'); 

        // Recuperar configuraciones temporales si existen
        const tempModelo = localStorage.getItem('temp_modelo');
        const tempColor = localStorage.getItem('temp_color');
        const tempTalla = localStorage.getItem('temp_talla');

        if (tempModelo && tempColor && tempTalla) {
            localStorage.setItem('user_modelo', tempModelo);
            localStorage.setItem('user_color', tempColor);
            localStorage.setItem('user_talla', tempTalla);

            localStorage.removeItem('temp_modelo');
            localStorage.removeItem('temp_color');
            localStorage.removeItem('temp_talla');
        }
        
        window.location.href = './app.html';
    }
}

async function guardarConfiguracionCalzado(modelo, color, talla) {
    const userId = localStorage.getItem('userId') || 'usr_utl_demo';
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
        console.error("Error al guardar configuración:", error.message);
    } else {
        console.log("Preferencia de calzado actualizada en Supabase automáticamente.");
    }
}

function cerrarSesionUsuario() {
    console.log("Destruyendo sesión de forma absoluta...");
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "login.html";
}

window.registrarUsuario = registrarUsuario;
window.loginUsuario = loginUsuario;
window.guardarConfiguracionCalzado = guardarConfiguracionCalzado;
window.cerrarSesionUsuario = cerrarSesionUsuario;