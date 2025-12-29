// --- FUNCIONES DE PERSISTENCIA ---
function guardarEnLocalStorage() {
    try {
        localStorage.setItem('dbInstrumentos', JSON.stringify(dbInstrumentos));
        localStorage.setItem('dbPersonas', JSON.stringify(dbPersonas));
        localStorage.setItem('dbPrestamos', JSON.stringify(dbPrestamos));
        localStorage.setItem('dbDevoluciones', JSON.stringify(dbDevoluciones));
    } catch (e) {
        console.error("Error al guardar en localStorage:", e);
        actualizarMensajeEstado("⚠️ No se pudo guardar localmente.", true);
    }
}

function cargarDesdeLocalStorage() {
    try {
        const instrumentos = localStorage.getItem('dbInstrumentos');
        const personas = localStorage.getItem('dbPersonas');
        const prestamos = localStorage.getItem('dbPrestamos');
        const devoluciones = localStorage.getItem('dbDevoluciones');

        if (instrumentos) dbInstrumentos = JSON.parse(instrumentos);
        if (personas) dbPersonas = JSON.parse(personas);
        if (prestamos) dbPrestamos = JSON.parse(prestamos);
        if (devoluciones) dbDevoluciones = JSON.parse(devoluciones);
    } catch (e) {
        console.error("Error al cargar desde localStorage:", e);
        actualizarMensajeEstado("⚠️ Error al cargar datos guardados.", true);
    }
}

// --- DATOS SIMULADOS (solo se usan si no hay datos en localStorage) ---
const dbUsuarios = {
    'director@liceo.edu': { rol: 'director', password: '123' },
    'directivo@liceo.edu': { rol: 'directivo', password: '123' },
    'docente@liceo.edu': { rol: 'docente', password: '123' },
    'ethannacarate@liceovvh.cl': { rol: 'director', password: 'antofagasta' },
    'estudiante@liceo.edu': { rol: 'estudiante', password: '123' }
};

// Inicializar bases de datos
let dbInstrumentos = [];
let dbPersonas = {};
let dbPrestamos = [];
let dbDevoluciones = [];
let currentUser = null;
let currentInstrumentCode = null;
let currentPersonCode = null;

// --- Cargar datos al inicio ---
cargarDesdeLocalStorage();

// --- UTILIDADES ---
function toggleAddPersonSection(show) {
    const addPersonSec = document.getElementById('add-person-section');
    const loanSec = document.getElementById('loan-return-section');
    if (show) {
        addPersonSec.classList.remove('hidden');
        loanSec.classList.add('hidden');
    } else {
        addPersonSec.classList.add('hidden');
    }
}

function resetMainForm() {
    document.getElementById('codigoInstrumento').value = '';
    document.getElementById('codigoPersona').value = '';
    document.getElementById('nombreInstrumento').textContent = '---';
    document.getElementById('estadoInstrumento').textContent = '---';
    document.getElementById('estadoIcon').textContent = '';
    resetPersonData();
    document.getElementById('loan-form').classList.add('hidden');
    document.getElementById('return-button-container').classList.add('hidden');
    setTimeout(() => document.getElementById('codigoInstrumento').focus(), 100);
}

function resetPersonData(clearInput = true) {
    document.getElementById('nombrePersona').textContent = '---';
    document.getElementById('rolPersona').textContent = '---';
    document.getElementById('cantidad').value = 1;
    document.getElementById('autorizadoDocente').checked = false;
    document.getElementById('prestamoLargoPlazo').checked = false;
    document.getElementById('nombreDocente').value = '';
    document.getElementById('duracionPrestamo').value = 7;
    toggleDocenteField();
    toggleLargoPlazoField();
    if (clearInput) document.getElementById('codigoPersona').value = '';
}

function toggleDocenteField() {
    document.getElementById('docente-field').classList.toggle('hidden', !document.getElementById('autorizadoDocente').checked);
}

function toggleLargoPlazoField() {
    const visible = document.getElementById('prestamoLargoPlazo').checked;
    document.getElementById('largo-plazo-field').classList.toggle('hidden', !visible);
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
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        switchView(false);
        actualizarMensajeEstado(`Bienvenido. Sesión iniciada como ${currentUser.toUpperCase()}.`);
        resetMainForm();
        loadActiveLoans();
        loadReturnedHistory();
    } else {
        errorMsg.classList.remove('hidden');
        errorMsg.textContent = "Credenciales incorrectas. Inténtelo nuevamente.";
    }
}

function logout() {
    currentUser = null;
    switchView(true);
}

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

// --- AGREGAR PERSONA ---
function registrarNuevaPersona() {
    const codigo = document.getElementById('newPersonaCodigo').value.trim().toUpperCase();
    const nombre = document.getElementById('newPersonaNombre').value.trim();
    const rol = document.getElementById('newPersonaRol').value;

    if (!codigo || !nombre || !rol) {
        actualizarMensajeEstado("❌ Por favor, complete todos los campos.", true);
        return;
    }

    if (currentUser !== 'director' && currentUser !== 'directivo') {
        actualizarMensajeEstado("❌ Solo Director/Directivos pueden registrar personas.", true);
        return;
    }

    dbPersonas[codigo] = { nombre, rol };
    guardarEnLocalStorage(); // ✅ GUARDAR
    actualizarMensajeEstado(`✅ Persona registrada: ${nombre} (${rol})`);

    toggleAddPersonSection(false);

    const instrumentoInput = document.getElementById('codigoInstrumento').value.trim().toUpperCase();
    const instrumento = dbInstrumentos.find(i => i.codigo === instrumentoInput && i.estado === 'Available');

    if (instrumento) {
        document.getElementById('codigoPersona').value = codigo;
        handlePersonScan(codigo);
        setTimeout(() => {
            document.getElementById('loan-form').classList.remove('hidden');
            document.getElementById('cantidad').focus();
        }, 150);
    } else {
        document.getElementById('codigoInstrumento').value = '';
        actualizarMensajeEstado(`✅ Persona registrada. Ahora escanee un instrumento.`);
        setTimeout(() => {
            document.getElementById('codigoInstrumento').focus();
            document.getElementById('loan-return-section').classList.remove('hidden');
        }, 150);
    }
}

// --- CATEGORÍAS DE INSTRUMENTO ---
function abrirModalAgregarInstrumento(codigo) {
    document.getElementById('newCodigo').value = codigo;
    const modal = new bootstrap.Modal(document.getElementById('addInstrumentModal'));
    modal.show();
}

function cambiarCategoria() {
    const categoria = document.getElementById('categoriaInstrumento').value;
    document.querySelectorAll('.categoria-form').forEach(el => el.classList.add('hidden'));
    if (categoria) {
        document.getElementById(`form-${categoria}`).classList.remove('hidden');
    }
}

function actualizarModelosProcesador() {
    const marca = document.getElementById('pcProcesadorMarca').value;
    const modeloSelect = document.getElementById('pcProcesadorModelo');
    modeloSelect.innerHTML = '<option value="">Seleccione modelo</option>';

    let modelos = [];
    if (marca === 'intel') {
        modelos = ['Celeron', 'Pentium', 'i3', 'i5', 'i7', 'i9', 'Xeon'];
    } else if (marca === 'amd') {
        modelos = ['Athlon', 'Ryzen 3', 'Ryzen 5', 'Ryzen 7', 'Ryzen 9', 'Threadripper'];
    } else if (marca === 'apple') {
        modelos = ['M1', 'M1 Pro', 'M1 Max', 'M2', 'M2 Pro', 'M2 Max'];
    }

    modelos.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.toLowerCase().replace(/\s+/g, '-');
        opt.textContent = m;
        modeloSelect.appendChild(opt);
    });
}

function cambiarTipoPeriferico() {
    const tipo = document.getElementById('perifericoTipo').value;
    const marcaSelect = document.getElementById('perifericoMarca');
    marcaSelect.innerHTML = '<option value="">Seleccione marca</option>';

    let marcas = [];
    if (tipo === 'mouse' || tipo === 'teclado') {
        marcas = ['Logitech', 'Redragon', 'Razer', 'Corsair', 'HP', 'Dell', 'Lenovo', 'Genius'];
    } else if (tipo === 'audifonos') {
        marcas = ['Sony', 'JBL', 'Logitech', 'HyperX', 'SteelSeries', 'Apple', 'Samsung'];
    } else if (tipo === 'parlantes') {
        marcas = ['Logitech', 'JBL', 'Sony', 'Creative', 'Edifier'];
    } else if (tipo === 'webcam') {
        marcas = ['Logitech', 'HP', 'Dell', 'Microsoft', 'Razer'];
    } else {
        marcas = ['Genérico', 'Otros'];
    }

    marcas.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.toLowerCase().replace(/\s+/g, '-');
        opt.textContent = m;
        marcaSelect.appendChild(opt);
    });
}

function toggleAlmacenamientoDual() {
    const tipo = document.getElementById('pcAlmacenamientoTipo').value;
    const ssdGroup = document.getElementById('pcSSDGroup');
    const hddGroup = document.getElementById('pcHDDGroup');

    ssdGroup.classList.add('hidden');
    hddGroup.classList.add('hidden');

    if (tipo === 'SSD') {
        ssdGroup.classList.remove('hidden');
    } else if (tipo === 'HDD') {
        hddGroup.classList.remove('hidden');
    } else if (tipo === 'SSD+HDD') {
        ssdGroup.classList.remove('hidden');
        hddGroup.classList.remove('hidden');
    }
}

// --- GUARDAR INSTRUMENTO ---
function guardarNuevoInstrumento() {
    const codigo = document.getElementById('newCodigo').value.trim().toUpperCase();
    const categoria = document.getElementById('categoriaInstrumento').value;

    if (!codigo || !categoria) {
        actualizarMensajeEstado("❌ Seleccione una categoría e ingrese el código.", true);
        return;
    }

    if (dbInstrumentos.some(i => i.codigo === codigo)) {
        actualizarMensajeEstado("❌ Código de barras ya registrado en el sistema.", true);
        return;
    }

    if (currentUser !== 'director' && currentUser !== 'directivo') {
        actualizarMensajeEstado("❌ Permiso denegado: Solo Director/Directivos.", true);
        return;
    }

    let detalles = {};
    let nombreVisual = "";

    if (categoria === 'computadora') {
        const tipo = document.getElementById('pcTipo').value;
        const marca = document.getElementById('pcMarca').value;
        const ram = document.getElementById('pcRAM').value;
        const almTipo = document.getElementById('pcAlmacenamientoTipo').value;
        const estadoEq = document.getElementById('pcEstado').value;
        const procMarca = document.getElementById('pcProcesadorMarca').value;
        const procModelo = document.getElementById('pcProcesadorModelo').value;
        const so = document.getElementById('pcSO').value;

        if (!tipo || !marca || !ram || !almTipo || !procMarca || !procModelo || !estadoEq) {
            actualizarMensajeEstado("❌ Complete todas las especificaciones de la computadora.", true);
            return;
        }

        let almacenamiento = {};
        let almacenamientoStr = '';
        if (almTipo === 'SSD') {
            const ssdCap = document.getElementById('pcSSDCap').value;
            if (!ssdCap) {
                actualizarMensajeEstado("❌ Seleccione la capacidad del SSD.", true);
                return;
            }
            almacenamiento = { tipo: 'SSD', ssd: ssdCap };
            almacenamientoStr = `SSD ${ssdCap}`;
        } else if (almTipo === 'HDD') {
            const hddCap = document.getElementById('pcHDDCap').value;
            if (!hddCap) {
                actualizarMensajeEstado("❌ Seleccione la capacidad del HDD.", true);
                return;
            }
            almacenamiento = { tipo: 'HDD', hdd: hddCap };
            almacenamientoStr = `HDD ${hddCap}`;
        } else if (almTipo === 'SSD+HDD') {
            const ssdCap = document.getElementById('pcSSDCap').value;
            const hddCap = document.getElementById('pcHDDCap').value;
            if (!ssdCap || !hddCap) {
                actualizarMensajeEstado("❌ Seleccione la capacidad del SSD y HDD.", true);
                return;
            }
            almacenamiento = { tipo: 'SSD+HDD', ssd: ssdCap, hdd: hddCap };
            almacenamientoStr = `SSD+HDD`;
        }

        detalles = {
            tipo,
            marca,
            ram,
            almacenamiento,
            procesador: { marca: procMarca, modelo: procModelo },
            so,
            estado: estadoEq
        };

        const tipoNombres = { 'all-in-one': 'All-in-One', 'laptop': 'Laptop', 'desktop': 'Desktop' };
        const marcaNombres = {
            'dell': 'Dell', 'hp': 'HP', 'lenovo': 'Lenovo', 'acer': 'Acer',
            'asus': 'ASUS', 'apple': 'Apple', 'otros': 'Otro'
        };
        nombreVisual = `${tipoNombres[tipo]} ${marcaNombres[marca] || marca} (${ram}, ${almacenamientoStr})`;
    }
    else if (categoria === 'monitor') {
        const marca = document.getElementById('monitorMarca').value;
        const pulgadas = document.getElementById('monitorPulgadas').value;
        const estadoMon = document.getElementById('monitorEstado').value;
        if (!marca || !pulgadas || !estadoMon) {
            actualizarMensajeEstado("❌ Complete marca, pulgadas y estado del monitor.", true);
            return;
        }

        const entradas = [];
        if (document.getElementById('entradaHDMI').checked) entradas.push('HDMI');
        if (document.getElementById('entradaVGA').checked) entradas.push('VGA');
        if (document.getElementById('entradaDP').checked) entradas.push('DisplayPort');
        if (document.getElementById('entradaUSBC').checked) entradas.push('USB-C');

        detalles = { 
            marca, 
            pulgadas, 
            entradas: entradas.join(', ') || 'Ninguna',
            estado: estadoMon 
        };

        const marcaNombres = {
            'dell': 'Dell', 'hp': 'HP', 'lenovo': 'Lenovo', 'samsung': 'Samsung',
            'lg': 'LG', 'acer': 'Acer', 'asus': 'ASUS', 'otros': 'Otro'
        };
        nombreVisual = `Monitor ${marcaNombres[marca] || marca} ${pulgadas}"`;
    }
    else if (categoria === 'periferico') {
        const tipo = document.getElementById('perifericoTipo').value;
        const marca = document.getElementById('perifericoMarca').value;
        const conectividad = document.getElementById('perifericoConectividad').value;
        const estado = document.getElementById('perifericoEstado').value;

        if (!tipo || !marca || !conectividad) {
            actualizarMensajeEstado("❌ Complete todas las especificaciones del periférico.", true);
            return;
        }

        detalles = { tipo, marca, conectividad, estado };

        const tipoNombres = {
            'mouse': 'Mouse', 'teclado': 'Teclado', 'audifonos': 'Audífonos',
            'parlantes': 'Parlantes', 'webcam': 'Webcam'
        };
        const marcaNombres = {
            'logitech': 'Logitech', 'redragon': 'Redragon', 'razer': 'Razer',
            'corsair': 'Corsair', 'hp': 'HP', 'dell': 'Dell', 'lenovo': 'Lenovo',
            'genius': 'Genius', 'sony': 'Sony', 'jbl': 'JBL', 'hyperx': 'HyperX',
            'steelseries': 'SteelSeries', 'apple': 'Apple', 'samsung': 'Samsung',
            'creative': 'Creative', 'edifier': 'Edifier', 'microsoft': 'Microsoft',
            'genérico': 'Genérico', 'otros': 'Otro'
        };
        nombreVisual = `${tipoNombres[tipo]} ${marcaNombres[marca] || marca}`;
    }

    dbInstrumentos.push({
        codigo: codigo,
        nombre: nombreVisual,
        categoria: categoria,
        detalles: detalles,
        estado: 'Available'
    });

    guardarEnLocalStorage(); // ✅ GUARDAR
    bootstrap.Modal.getInstance(document.getElementById('addInstrumentModal')).hide();
    actualizarMensajeEstado(`✅ Instrumento guardado: ${nombreVisual}`);

    document.getElementById('codigoInstrumento').value = codigo;
    handleInstrumentScan(codigo);

    setTimeout(() => {
        document.getElementById('loan-form').classList.remove('hidden');
        document.getElementById('codigoPersona').focus();
    }, 150);
}

// --- ESCANEO DE INSTRUMENTO ---
function handleInstrumentScan(codigo) {
    actualizarMensajeEstado("Procesando instrumento...");
    currentInstrumentCode = codigo.trim().toUpperCase();
    const instrumento = dbInstrumentos.find(i => i.codigo === currentInstrumentCode);

    document.getElementById('loan-form').classList.add('hidden');
    document.getElementById('return-button-container').classList.add('hidden');

    if (!instrumento) {
        document.getElementById('nombreInstrumento').textContent = "---";
        document.getElementById('estadoInstrumento').textContent = "DESCONOCIDO";
        document.getElementById('estadoIcon').textContent = "";

        if (currentUser === 'director' || currentUser === 'directivo') {
            abrirModalAgregarInstrumento(currentInstrumentCode);
            actualizarMensajeEstado(`⚠️ Instrumento no registrado. Regístrelo.`, true);
        } else {
            actualizarMensajeEstado(`❌ Instrumento desconocido. Contacte a un superior.`, true);
        }
        return;
    }

    document.getElementById('nombreInstrumento').textContent = instrumento.nombre;
    const estadoIcon = document.getElementById('estadoIcon');
    const estadoFisico = instrumento.detalles?.estado || 'desconocido';
    document.getElementById('estadoInstrumento').textContent = estadoFisico.charAt(0).toUpperCase() + estadoFisico.slice(1);

    if (instrumento.estado === 'Available') {
        estadoIcon.innerHTML = '<i class="fas fa-circle text-success"></i>';
        document.getElementById('loan-form').classList.remove('hidden');
        setTimeout(() => document.getElementById('codigoPersona').focus(), 100);
        actualizarMensajeEstado(`Instrumento DISPONIBLE. Escanee identificador de persona.`);
    } else {
        estadoIcon.innerHTML = '<i class="fas fa-circle text-danger"></i>';
        document.getElementById('return-button-container').classList.remove('hidden');

        const prestamo = dbPrestamos.find(p => p.codigoInstrumento === currentInstrumentCode && p.estado === 'Occupied');
        document.getElementById('loaned-by').textContent = prestamo ? prestamo.nombrePersona : "Desconocido";
        actualizarMensajeEstado(`Instrumento OCUPADO. Listo para devolver.`);
    }
    resetPersonData(false);
}

// --- ESCANEO DE PERSONA ---
function handlePersonScan(codigo) {
    actualizarMensajeEstado("Procesando persona...");
    currentPersonCode = codigo.trim().toUpperCase();
    const persona = dbPersonas[currentPersonCode];

    if (!persona) {
        document.getElementById('nombrePersona').textContent = "NO REGISTRADA";
        document.getElementById('rolPersona').textContent = "---";
        
        if (currentUser === 'director' || currentUser === 'directivo') {
            document.getElementById('newPersonaCodigo').value = currentPersonCode;
            toggleAddPersonSection(true);
            actualizarMensajeEstado(`⚠️ Persona no registrada. Regístrela.`, true);
        } else {
            actualizarMensajeEstado(`❌ Persona no registrada. Solo personal autorizado puede registrar.`, true);
        }
        return;
    }

    document.getElementById('nombrePersona').textContent = persona.nombre;
    document.getElementById('rolPersona').textContent = persona.rol.toUpperCase();
    actualizarMensajeEstado(`Persona cargada: ${persona.nombre}`);
}

// --- PRÉSTAMO ---
function registrarPrestamo() {
    if (!currentInstrumentCode || !currentPersonCode) {
        actualizarMensajeEstado("❌ Faltan datos (Instrumento o Persona).", true);
        return;
    }

    const personaInfo = dbPersonas[currentPersonCode];
    if (!personaInfo) {
        actualizarMensajeEstado("❌ Persona no registrada.", true);
        return;
    }

    const instrumento = dbInstrumentos.find(i => i.codigo === currentInstrumentCode);
    if (!instrumento) {
        actualizarMensajeEstado("❌ Instrumento no encontrado.", true);
        return;
    }

    const cantidad = document.getElementById('cantidad').value;
    const autorizado = document.getElementById('autorizadoDocente').checked;
    const nombreDocente = autorizado ? document.getElementById('nombreDocente').value.trim() : "";
    const prestamoLargo = document.getElementById('prestamoLargoPlazo').checked;
    const duracion = prestamoLargo ? parseInt(document.getElementById('duracionPrestamo').value) : 1;

    if (personaInfo.rol === 'estudiante' && !autorizado) {
        actualizarMensajeEstado("❌ Los estudiantes requieren autorización de un docente.", true);
        return;
    }

    if (prestamoLargo && currentUser !== 'director') {
        actualizarMensajeEstado("❌ Solo el Director puede autorizar préstamos a largo plazo.", true);
        return;
    }

    if (autorizado && !nombreDocente) {
        actualizarMensajeEstado("❌ Por favor, ingrese el nombre del docente autorizante.", true);
        return;
    }

    const estadoInstrumento = instrumento.detalles?.estado || 'desconocido';

    const nuevoPrestamo = {
        id: Date.now(),
        fecha: new Date().toLocaleString('es-ES'),
        codigoInstrumento: currentInstrumentCode,
        nombreInstrumento: instrumento.nombre,
        estadoInstrumento: estadoInstrumento,
        nombrePersona: personaInfo.nombre,
        rolPersona: personaInfo.rol,
        cantidad: cantidad,
        autorizadoPor: nombreDocente || "—",
        duracionDias: duracion,
        estado: 'Occupied'
    };

    dbPrestamos.push(nuevoPrestamo);
    instrumento.estado = 'Occupied';

    guardarEnLocalStorage(); // ✅ GUARDAR
    actualizarMensajeEstado(`✅ Préstamo registrado exitosamente.`);
    resetMainForm();
    loadActiveLoans();
    loadReturnedHistory();
}

// --- DEVOLUCIÓN ---
function confirmarDevolucion() {
    const prestamoIndex = dbPrestamos.findIndex(p => p.codigoInstrumento === currentInstrumentCode && p.estado === 'Occupied');
    if (prestamoIndex === -1) {
        actualizarMensajeEstado("❌ Préstamo no encontrado.", true);
        return;
    }

    const prestamo = dbPrestamos.splice(prestamoIndex, 1)[0];
    prestamo.fechaDevolucion = new Date().toLocaleString('es-ES');
    prestamo.estado = 'Returned';
    dbDevoluciones.push(prestamo);

    const inst = dbInstrumentos.find(i => i.codigo === currentInstrumentCode);
    if (inst) inst.estado = 'Available';

    guardarEnLocalStorage(); // ✅ GUARDAR
    actualizarMensajeEstado(`✅ Devolución registrada exitosamente.`);
    resetMainForm();
    loadActiveLoans();
    loadReturnedHistory();
}

// --- CARGAR HISTORIALES ---
function loadActiveLoans() {
    const tbody = document.getElementById('active-loans-body');
    tbody.innerHTML = '';
    dbPrestamos.forEach(p => {
        const estadoBadge = {
            'bueno': '<span class="badge bg-success">Bueno</span>',
            'regular': '<span class="badge bg-warning text-dark">Regular</span>',
            'malo': '<span class="badge bg-danger">Malo</span>'
        }[p.estadoInstrumento] || '<span class="badge bg-secondary">Desconocido</span>';

        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${p.fecha}</td>
            <td>${p.nombreInstrumento}</td>
            <td>${estadoBadge}</td>
            <td>${p.nombrePersona} <small>(${p.rolPersona})</small></td>
            <td>${p.cantidad}</td>
            <td>${p.autorizadoPor}</td>
            <td>${p.duracionDias}</td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="devolverDesdeLista('${p.codigoInstrumento}')">
                    <i class="fas fa-undo"></i> Devolver
                </button>
            </td>
        `;
    });
}

function devolverDesdeLista(codigo) {
    currentInstrumentCode = codigo;
    confirmarDevolucion();
}

function loadReturnedHistory() {
    const tbody = document.getElementById('returned-history-body');
    tbody.innerHTML = '';
    [...dbDevoluciones].reverse().forEach(p => {
        const estadoBadge = {
            'bueno': '<span class="badge bg-success">Bueno</span>',
            'regular': '<span class="badge bg-warning text-dark">Regular</span>',
            'malo': '<span class="badge bg-danger">Malo</span>'
        }[p.estadoInstrumento] || '<span class="badge bg-secondary">Desconocido</span>';

        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${p.fechaDevolucion}</td>
            <td>${p.nombreInstrumento}</td>
            <td>${estadoBadge}</td>
            <td>${p.nombrePersona} <small>(${p.rolPersona})</small></td>
            <td>${p.cantidad}</td>
            <td>${p.autorizadoPor}</td>
            <td>${p.duracionDias}</td>
        `;
    });
}

// --- FILTROS ---
function filterTable(type) {
    const nameFilter = document.getElementById(`filter-${type}-name`).value.toLowerCase();
    const dateFilter = document.getElementById(`filter-${type}-date`).value;
    const tbodyId = type === 'active' ? 'active-loans-body' : 'returned-history-body';
    const rows = document.querySelectorAll(`#${tbodyId} tr`);

    rows.forEach(row => {
        const nameCell = row.cells[3]?.textContent.toLowerCase() || '';
        const dateCell = row.cells[0]?.textContent || '';

        const matchesName = nameCell.includes(nameFilter);
        let matchesDate = true;
        if (dateFilter) {
            const parts = dateCell.split(/[,\s]+/)[0].split('/');
            if (parts.length === 3) {
                const [day, month, year] = parts;
                const rowDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                matchesDate = rowDateStr === dateFilter;
            }
        }

        row.style.display = (matchesName && matchesDate) ? '' : 'none';
    });
}

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', function () {
    const currentUrl = window.location.pathname + window.location.search;
    const navItem = document.getElementById('nav-agregar-db');
    
    if (navItem && currentUrl.includes('/admin/agregar-nuevo')) {
        navItem.classList.add('active');
        switchView(false);
        setTimeout(() => {
            abrirModalAgregarInstrumento('');
        }, 300);
    } else {
        switchView(true);
    }
});