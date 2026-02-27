// --- DATOS DE USUARIOS (solo en memoria) ---
const USUARIOS = {
    'director@liceo.edu': { rol: 'director', password: '123' },
    'directivo@liceo.edu': { rol: 'directivo', password: '123' },
    'docente@liceo.edu': { rol: 'docente', password: '123' },
    'estudiante@liceo.edu': { rol: 'estudiante', password: '123' }
};

// --- CARGAR DATOS DESDE LOCALSTORAGE ---
let articulos = JSON.parse(localStorage.getItem('articulos_tecnologicos')) || [];
let personas = JSON.parse(localStorage.getItem('personas')) || {
    'P-001': { nombre: 'Ana Pérez', rol: 'estudiante' },
    'P-002': { nombre: 'Juan López', rol: 'docente' },
    'P-003': { nombre: 'María Díaz', rol: 'director' }
};
let prestamos = JSON.parse(localStorage.getItem('prestamos')) || [];

let currentUser = null;
let currentArticleCode = null;
let currentPersonCode = null;
let categoriaSeleccionada = null;

// --- GUARDAR EN LOCALSTORAGE ---
function guardarDatos() {
    localStorage.setItem('articulos_tecnologicos', JSON.stringify(articulos));
    localStorage.setItem('personas', JSON.stringify(personas));
    localStorage.setItem('prestamos', JSON.stringify(prestamos));
}

// --- UTILIDADES ---
function actualizarMensaje(mensaje, isError = false) {
    // En un sistema real, podrías mostrar notificaciones
    console.log(mensaje);
}

function resetFormulario() {
    document.getElementById('codigoArticulo').value = '';
    document.getElementById('codigoPersona').value = '';
    document.getElementById('articulo-data').classList.add('hidden');
    document.getElementById('persona-data').classList.add('hidden');
    document.getElementById('registrarBtn').classList.add('hidden');
}

// --- LOGIN ---
function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('login-error-message');
    
    const user = USUARIOS[email];
    if (user && user.password === password) {
        currentUser = user.rol;
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('main-app-view').classList.remove('hidden');
        resetFormulario();
        cargarHistorial();
    } else {
        errorMsg.classList.remove('hidden');
    }
}

function logout() {
    currentUser = null;
    document.getElementById('main-app-view').classList.add('hidden');
    document.getElementById('login-view').classList.remove('hidden');
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
}

// --- MODAL DE ARTÍCULOS ---
function abrirModalArticulo(codigo = '') {
    document.getElementById('newArticleCode').value = codigo;
    
    // Resetear selección
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active', 'btn-primary');
    });
    document.querySelectorAll('.category-form').forEach(form => {
        form.classList.add('hidden');
    });
    
    const modal = new bootstrap.Modal(document.getElementById('addArticleModal'));
    modal.show();
}

// --- SELECCIÓN DE CATEGORÍA ---
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.category-btn').forEach(b => {
            b.classList.remove('active', 'btn-primary');
        });
        this.classList.add('active', 'btn-primary');
        categoriaSeleccionada = this.dataset.category;
        
        document.querySelectorAll('.category-form').forEach(form => {
            form.classList.add('hidden');
        });
        document.getElementById(`form-${categoriaSeleccionada}`).classList.remove('hidden');
    });
});

// --- GUARDAR NUEVO ARTÍCULO ---
function guardarNuevoArticulo() {
    const codigo = document.getElementById('newArticleCode').value.trim().toUpperCase();
    if (!codigo || !categoriaSeleccionada) {
        alert('Por favor, complete todos los campos.');
        return;
    }

    if (articulos.some(a => a.codigo === codigo)) {
        alert('Este código ya está registrado.');
        return;
    }

    let detalles = {};
    let nombre = '';

    switch(categoriaSeleccionada) {
        case 'computadora':
            const pcTipo = document.getElementById('pcTipo').value;
            const pcMarca = document.getElementById('pcMarca').value;
            const pcRAM = document.getElementById('pcRAM').value;
            if (!pcTipo || !pcMarca || !pcRAM) {
                alert('Complete los campos obligatorios.');
                return;
            }
            detalles = {
                tipo: pcTipo,
                marca: pcMarca,
                procesador: document.getElementById('pcProcesador').value,
                ram: pcRAM,
                almacenamiento: document.getElementById('pcAlmacenamiento').value,
                so: document.getElementById('pcSO').value,
                estado: document.querySelector('input[name="pcEstado"]:checked').value
            };
            nombre = `${pcMarca} ${pcTipo} (${pcRAM})`;
            break;
            
        case 'monitor':
            const monitorMarca = document.getElementById('monitorMarca').value;
            const monitorPulgadas = document.getElementById('monitorPulgadas').value;
            if (!monitorMarca || !monitorPulgadas) {
                alert('Complete los campos obligatorios.');
                return;
            }
            const entradas = [];
            if (document.getElementById('entradaHDMI').checked) entradas.push('HDMI');
            if (document.getElementById('entradaVGA').checked) entradas.push('VGA');
            if (document.getElementById('entradaDP').checked) entradas.push('DisplayPort');
            if (document.getElementById('entradaUSBC').checked) entradas.push('USB-C');
            
            detalles = {
                marca: monitorMarca,
                pulgadas: monitorPulgadas,
                entradas: entradas.join(', '),
                estado: document.querySelector('input[name="monitorEstado"]:checked').value
            };
            nombre = `Monitor ${monitorMarca} ${monitorPulgadas}"`;
            break;
            
        case 'periferico':
            const perifTipo = document.getElementById('perifericoTipo').value;
            const perifMarca = document.getElementById('perifericoMarca').value;
            if (!perifTipo || !perifMarca) {
                alert('Complete los campos obligatorios.');
                return;
            }
            detalles = {
                tipo: perifTipo,
                marca: perifMarca,
                estado: document.querySelector('input[name="perifericoEstado"]:checked').value
            };
            nombre = `${perifTipo} ${perifMarca}`;
            break;
            
        case 'impresora':
            const impTipo = document.getElementById('impresoraTipo').value;
            const impMarca = document.getElementById('impresoraMarca').value;
            if (!impTipo || !impMarca) {
                alert('Complete los campos obligatorios.');
                return;
            }
            detalles = {
                tipo: impTipo,
                marca: impMarca,
                estado: document.querySelector('input[name="impresoraEstado"]:checked').value
            };
            nombre = `Impresora ${impMarca} ${impTipo}`;
            break;
            
        case 'tablet':
            const tabTipo = document.getElementById('tabletTipo').value;
            const tabMarca = document.getElementById('tabletMarca').value;
            if (!tabTipo || !tabMarca) {
                alert('Complete los campos obligatorios.');
                return;
            }
            detalles = {
                tipo: tabTipo,
                marca: tabMarca,
                almacenamiento: document.getElementById('tabletAlmacenamiento').value,
                ram: document.getElementById('tabletRAM').value,
                estado: document.querySelector('input[name="tabletEstado"]:checked').value
            };
            nombre = `${tabMarca} ${tabTipo}`;
            break;
            
        case 'red':
            const redTipo = document.getElementById('redTipo').value;
            const redMarca = document.getElementById('redMarca').value;
            if (!redTipo || !redMarca) {
                alert('Complete los campos obligatorios.');
                return;
            }
            detalles = {
                tipo: redTipo,
                marca: redMarca,
                estado: document.querySelector('input[name="redEstado"]:checked').value
            };
            nombre = `${redTipo} ${redMarca}`;
            break;
            
        default:
            alert('Categoría no válida.');
            return;
    }

    articulos.push({
        codigo,
        nombre,
        categoria: categoriaSeleccionada,
        detalles,
        estado: 'disponible'
    });

    guardarDatos();
    bootstrap.Modal.getInstance(document.getElementById('addArticleModal')).hide();
    alert(`✅ Artículo guardado: ${nombre}`);
    
    // Si se estaba escaneando este código, cargarlo
    if (currentArticleCode === codigo) {
        handleArticuloScan(codigo);
    }
}

// --- ESCANEO DE ARTÍCULO ---
function handleArticuloScan(codigo) {
    const codigoLimpio = codigo.trim().toUpperCase();
    currentArticleCode = codigoLimpio;
    
    const articulo = articulos.find(a => a.codigo === codigoLimpio);
    
    if (!articulo) {
        if (confirm('Artículo no encontrado. ¿Registrar nuevo?')) {
            abrirModalArticulo(codigoLimpio);
        }
        return;
    }
    
    if (articulo.estado !== 'disponible') {
        alert('Este artículo ya está prestado.');
        return;
    }
    
    document.getElementById('nombreArticulo').textContent = articulo.nombre;
    document.getElementById('estadoArticulo').textContent = 
        articulo.detalles.estado.charAt(0).toUpperCase() + articulo.detalles.estado.slice(1);
    document.getElementById('articulo-data').classList.remove('hidden');
    
    // Si ya hay persona, mostrar botón
    if (currentPersonCode) {
        document.getElementById('registrarBtn').classList.remove('hidden');
    }
}

// --- ESCANEO DE PERSONA ---
function handlePersonScan(codigo) {
    const codigoLimpio = codigo.trim().toUpperCase();
    currentPersonCode = codigoLimpio;
    
    const persona = personas[codigoLimpio];
    
    if (!persona) {
        alert('Persona no registrada.');
        return;
    }
    
    document.getElementById('nombrePersona').textContent = persona.nombre;
    document.getElementById('rolPersona').textContent = persona.rol;
    document.getElementById('persona-data').classList.remove('hidden');
    
    // Si ya hay artículo disponible, mostrar botón
    const articulo = articulos.find(a => a.codigo === currentArticleCode && a.estado === 'disponible');
    if (articulo) {
        document.getElementById('registrarBtn').classList.remove('hidden');
    }
}

// --- REGISTRAR PRÉSTAMO ---
function registrarPrestamo() {
    if (!currentArticleCode || !currentPersonCode) {
        alert('Complete ambos códigos.');
        return;
    }
    
    const articulo = articulos.find(a => a.codigo === currentArticleCode);
    const persona = personas[currentPersonCode];
    
    if (!articulo || !persona) {
        alert('Datos inválidos.');
        return;
    }
    
    if (articulo.estado !== 'disponible') {
        alert('El artículo ya está prestado.');
        return;
    }
    
    // Registrar préstamo
    prestamos.push({
        id: Date.now(),
        fecha: new Date().toLocaleString('es-ES'),
        articuloCodigo: currentArticleCode,
        articuloNombre: articulo.nombre,
        personaCodigo: currentPersonCode,
        personaNombre: persona.nombre,
        personaRol: persona.rol,
        estadoArticulo: articulo.detalles.estado
    });
    
    // Marcar artículo como prestado
    articulo.estado = 'prestado';
    
    guardarDatos();
    alert('✅ Préstamo registrado exitosamente.');
    resetFormulario();
    cargarHistorial();
}

// --- CARGAR HISTORIAL ---
function cargarHistorial() {
    const tbody = document.getElementById('historial-body');
    tbody.innerHTML = '';
    
    // Mostrar últimos 10 préstamos
    const ultimos = prestamos.slice(-10).reverse();
    
    ultimos.forEach(p => {
        const row = tbody.insertRow();
        const estadoBadge = {
            'bueno': '<span class="badge bg-success">Bueno</span>',
            'regular': '<span class="badge bg-warning text-dark">Regular</span>',
            'malo': '<span class="badge bg-danger">Malo</span>'
        }[p.estadoArticulo] || '<span class="badge bg-secondary">Desconocido</span>';
        
        row.innerHTML = `
            <td>${p.fecha}</td>
            <td>${p.articuloNombre}</td>
            <td>${p.personaNombre} <small>(${p.personaRol})</small></td>
            <td>${estadoBadge}</td>
        `;
    });
}

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', function() {
    // Cargar historial si hay usuario
    if (currentUser) {
        cargarHistorial();
    }
});