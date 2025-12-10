// --- DATOS SIMULADOS ---
const dbUsuarios = {
    'director@liceo.edu': { rol: 'director', password: '123' },
    'directivo@liceo.edu': { rol: 'directivo', password: '123' },
    'docente@liceo.edu': { rol: 'docente', password: '123' },
    'ethannacarate@liceovvh.cl': { rol: 'director', password: 'antofagasta' },
    'estudiante@liceo.edu': { rol: 'estudiante', password: '123' }
};

let dbInstrumentos = [
    { codigo: 'I-A010', nombre: 'Telescopio Refractor', estado: 'Available' },
    { codigo: 'I-B025', nombre: 'Kit de Microscopía', estado: 'Available' }
];

const dbPersonas = {
    'P-1001': { nombre: 'María P. González R.', rol: 'estudiante' },
    'P-2002': { nombre: 'Juan A. López P.', rol: 'docente' },
    'P-3003': { nombre: 'Laura M. Díaz S.', rol: 'directivo' },
    'P-4004': { nombre: 'Carlos J. Soto V.', rol: 'director' }
};

let dbPrestamos = [];
let currentUser = null;
let currentInstrumentCode = null;
let currentPersonCode = null;

// --- GESTIÓN DE VISTAS ---
function switchView(isLogin) {
    const loginView = document.getElementById('login-view');
    const appView = document.getElementById('main-app-view');

    if (isLogin) {
        loginView.classList.remove('hidden');
        appView.classList.add('hidden');
    } else {
        loginView.classList.add('hidden');
        appView.classList.remove('hidden');
    }
}

function actualizarMensajeEstado(mensaje, isError = false) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = `${new Date().toLocaleTimeString()} - ${mensaje}`;
    statusEl.className = isError ? 'status-error' : 'status-success';
}

// --- LOGIN ---
function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('login-error-message');
    
    errorMsg.classList.add('hidden'); 

    const user = dbUsuarios[email];

    if (user && user.password === password) {
        currentUser = user.rol;
        document.getElementById('current-role-display').textContent = currentUser.toUpperCase();
        
        // Limpiar inputs
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';

        switchView(false); // Ir a la App
        actualizarMensajeEstado(`Bienvenido. Sesión iniciada como ${currentUser.toUpperCase()}.`);
        resetMainForm();
        loadHistoryTable();
    } else {
        errorMsg.classList.remove('hidden');
        errorMsg.textContent = "Credenciales incorrectas (Prueba: director@liceo.edu / 123)";
    }
}

function logout() {
    currentUser = null;
    switchView(true); // Volver al Login
}

// --- LÓGICA DE INVENTARIO (Añadir Nuevo) ---
function registrarNuevoInstrumento() {
    const codigo = document.getElementById('newCodigo').value.trim().toUpperCase();
    const nombre = document.getElementById('newNombre').value.trim();

    if (!codigo || !nombre) {
        actualizarMensajeEstado("❌ Falta el nombre del instrumento.", true);
        return;
    }
    
    if (currentUser !== 'director' && currentUser !== 'directivo') {
        actualizarMensajeEstado("❌ Permiso denegado: Solo Director/Directivos.", true);
        return;
    }

    dbInstrumentos.push({ codigo, nombre, estado: 'Available' });
    actualizarMensajeEstado(`✅ Instrumento guardado: ${nombre}`);
    
    // Volver al flujo normal
    toggleAddProductSection(false);
    document.getElementById('codigoInstrumento').value = codigo;
    handleInstrumentScan(codigo); // Re-escanear automáticamente
}

// --- LÓGICA PRINCIPAL (Scan) ---
function handleInstrumentScan(codigo) {
    currentInstrumentCode = codigo.trim().toUpperCase();
    const instrumento = dbInstrumentos.find(i => i.codigo === currentInstrumentCode);

    // Resetear vistas parciales
    document.getElementById('loan-form').classList.add('hidden');
    document.getElementById('return-button-container').classList.add('hidden');

    // 1. Producto Nuevo
    if (!instrumento) {
        document.getElementById('nombreInstrumento').textContent = "---";
        document.getElementById('estadoInstrumento').textContent = "DESCONOCIDO";
        
        if (currentUser === 'director' || currentUser === 'directivo') {
            document.getElementById('newCodigo').value = currentInstrumentCode;
            toggleAddProductSection(true);
            actualizarMensajeEstado(`⚠️ Código nuevo. Por favor agréguelo.`, true);
        } else {
            actualizarMensajeEstado(`❌ Código desconocido. Contacte a un superior.`, true);
        }
        return;
    } else {
        toggleAddProductSection(false);
    }
    
    // 2. Producto Existente
    document.getElementById('nombreInstrumento').textContent = instrumento.nombre;
    document.getElementById('estadoInstrumento').textContent = instrumento.estado.toUpperCase();
    
    if (instrumento.estado === 'Available') {
        document.getElementById('loan-form').classList.remove('hidden');
        document.getElementById('codigoPersona').focus();
        actualizarMensajeEstado(`Instrumento DISPONIBLE. Escanee pasaporte.`);
    } else {
        document.getElementById('return-button-container').classList.remove('hidden');
        
        const prestamo = dbPrestamos.find(p => p.codigoInstrumento === currentInstrumentCode && p.estado === 'Occupied');
        document.getElementById('loaned-by').textContent = prestamo ? prestamo.nombrePersona : "Desconocido";
        
        actualizarMensajeEstado(`Instrumento OCUPADO. Listo para devolver.`);
    }
    
    // Limpiar datos de persona previa
    resetPersonData(false);
}

function handlePersonScan(codigo) {
    currentPersonCode = codigo.trim().toUpperCase();
    const persona = dbPersonas[currentPersonCode];

    if (!persona) {
        document.getElementById('nombrePersona').textContent = "NO ENCONTRADO";
        document.getElementById('rolPersona').textContent = "---";
        actualizarMensajeEstado(`❌ Pasaporte inválido.`, true);
        return;
    }

    document.getElementById('nombrePersona').textContent = persona.nombre;
    document.getElementById('rolPersona').textContent = persona.rol.toUpperCase();
    actualizarMensajeEstado(`Pasaporte cargado: ${persona.nombre}`);
}

// --- REGISTRAR PRÉSTAMO ---
function registrarPrestamo() {
    // Validaciones
    if (!currentInstrumentCode || !currentPersonCode) {
        actualizarMensajeEstado("❌ Faltan datos (Instrumento o Persona).", true);
        return;
    }

    const cantidad = document.getElementById('cantidad').value;
    const authDocente = document.getElementById('autorizadoDocente').checked;
    const largoPlazo = document.getElementById('prestamoLargoPlazo').checked;
    const personaInfo = dbPersonas[currentPersonCode];

    // Regla de negocio: Estudiante necesita autorización
    if (personaInfo.rol === 'estudiante' && !authDocente) {
        actualizarMensajeEstado("❌ Estudiantes requieren autorización del Docente.", true);
        return;
    }

    // Regla de negocio: Largo plazo requiere Director
    if (largoPlazo && currentUser !== 'director') {
        actualizarMensajeEstado("❌ Préstamos largos requieren autorización del DIRECTOR.", true);
        return;
    }

    // Guardar
    const nuevoPrestamo = {
        fecha: new Date().toLocaleString(),
        codigoInstrumento: currentInstrumentCode,
        nombreInstrumento: dbInstrumentos.find(i => i.codigo === currentInstrumentCode).nombre,
        nombrePersona: personaInfo.nombre,
        rolPersona: personaInfo.rol,
        cantidad: cantidad,
        auth: authDocente ? 'SÍ' : 'NO',
        estado: 'Occupied'
    };

    dbPrestamos.push(nuevoPrestamo);
    
    // Actualizar estado instrumento
    dbInstrumentos.find(i => i.codigo === currentInstrumentCode).estado = 'Occupied';

    actualizarMensajeEstado(`✅ Préstamo registrado exitosamente.`);
    resetMainForm();
    loadHistoryTable();
}

// --- DEVOLUCIÓN ---
function confirmarDevolucion() {
    // Actualizar préstamo
    const prestamo = dbPrestamos.find(p => p.codigoInstrumento === currentInstrumentCode && p.estado === 'Occupied');
    if (prestamo) prestamo.estado = 'Available';

    // Actualizar inventario
    const inst = dbInstrumentos.find(i => i.codigo === currentInstrumentCode);
    if (inst) inst.estado = 'Available';

    actualizarMensajeEstado(`✅ Devolución exitosa. Instrumento Disponible.`);
    resetMainForm();
    loadHistoryTable();
}

// --- UTILIDADES ---
function toggleAddProductSection(show) {
    const addSec = document.getElementById('add-product-section');
    const loanSec = document.getElementById('loan-return-section');
    
    if (show) {
        addSec.classList.remove('hidden');
        loanSec.classList.add('hidden');
    } else {
        addSec.classList.add('hidden');
        loanSec.classList.remove('hidden');
    }
}

function resetMainForm() {
    document.getElementById('codigoInstrumento').value = '';
    document.getElementById('codigoPersona').value = '';
    document.getElementById('nombreInstrumento').textContent = '---';
    document.getElementById('estadoInstrumento').textContent = '---';
    
    resetPersonData();
    
    document.getElementById('loan-form').classList.add('hidden');
    document.getElementById('return-button-container').classList.add('hidden');
    document.getElementById('codigoInstrumento').focus();
}

function resetPersonData(clearInput = true) {
    document.getElementById('nombrePersona').textContent = '---';
    document.getElementById('rolPersona').textContent = '---';
    document.getElementById('cantidad').value = 1;
    document.getElementById('autorizadoDocente').checked = false;
    document.getElementById('prestamoLargoPlazo').checked = false;
    if (clearInput) document.getElementById('codigoPersona').value = '';
}

function loadHistoryTable() {
    const tbody = document.querySelector('#history-table tbody');
    tbody.innerHTML = '';

    // Ordenar: más recientes primero
    const reversedHistory = [...dbPrestamos].reverse();

    reversedHistory.forEach(p => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${p.fecha}</td>
            <td>${p.nombreInstrumento}</td>
            <td>${p.nombrePersona} <br><small>(${p.rolPersona})</small></td>
            <td>${p.cantidad}</td>
            <td>${p.auth}</td>
            <td class="status-${p.estado}">${p.estado}</td>
        `;
    });
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    switchView(true); // Forzar inicio en Login
});