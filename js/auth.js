// js/auth.js
import { supabase } from './supabase-config.js';

async function registrarUsuario(nombre, apellidos, correo, password, telefono, genero) {
    if(!nombre || !apellidos || !correo || !password || !telefono || !genero) {
        return alert("Por favor llena todos los campos obligatorios.");
    }

    // Usar Supabase Auth para registrar al usuario (evitar almacenar contraseñas en texto plano)
    const { data: signData, error: signError } = await supabase.auth.signUp({ email: correo, password });
    if (signError) {
        return alert('Error en registro: ' + signError.message);
    }

    const userId = signData?.user?.id || null;

    // Crear perfil en la tabla usuarios sin guardar la contraseña
    const { data, error } = await supabase
        .from('usuarios')
        .insert([
            { 
                id: userId,
                nombre: nombre, 
                apellidos: apellidos,
                correo: correo, 
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
        alert("Error al guardar perfil: " + error.message);
    } else {
        alert("¡Cuenta creada con éxito! Revisa tu correo para confirmar la cuenta si aplica.");
        window.location.reload(); 
    }
}

async function loginUsuario(correo, password) {
    if(!correo || !password) return alert("Por favor llena todos los campos");

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: correo, password });
    if (signInError) {
        return alert('Error al iniciar sesión: ' + signInError.message);
    }

    const user = signInData?.user;
    if (!user) return alert('No se encontró usuario válido.');

    // Recuperar perfil desde la tabla usuarios
    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .limit(1);

    const profile = (data && data[0]) ? data[0] : null;

    const nombreCompleto = profile ? (profile.nombre + ' ' + (profile.apellidos || '')) : (user.email || 'Usuario');

    alert("¡Bienvenido, " + nombreCompleto + "!");

    // GUARDADO PERSISTENTE EN LOCALSTORAGE (Datos de sesión y de usuario)
    localStorage.setItem('userId', user.id);
    localStorage.setItem('stepra_session', 'active'); 
    localStorage.setItem('user_display_name', nombreCompleto);
    localStorage.setItem('user_display_email', user.email || correo);

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