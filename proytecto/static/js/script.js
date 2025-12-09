document.addEventListener('DOMContentLoaded', () => {
    const inputInstrumento = document.getElementById('codigoInstrumento');
    const inputPersona = document.getElementById('codigoPersona');

    // Mapeo simple de datos simulados
    const dbPersonas = {
        'P-1001': { nombre: 'María Paz González Ríos', rol: 'Alumno' },
        'P-2002': { nombre: 'Juan Antonio López Pérez', rol: 'Docente' }
    };

    const dbInstrumentos = {
        'I-A010': { nombre: 'Telescopio Refractor' },
        'I-B025': { nombre: 'Kit de Microscopía' }
    };

    /**
     * Función que simula el escaneo del código de la persona
     */
    inputPersona.addEventListener('change', () => {
        const codigo = inputPersona.value.trim().toUpperCase();
        const persona = dbPersonas[codigo];
        
        document.getElementById('nombrePersona').textContent = persona ? persona.nombre : 'No encontrado';
        document.getElementById('rolPersona').textContent = persona ? persona.rol : '---';
        
        // Limpiar el campo para el siguiente escaneo (si se desea)
        // inputPersona.value = ''; 
        
        actualizarMensajeEstado(`Pasaporte ${codigo} cargado.`);
    });
    
    /**
     * Función que simula el escaneo del código del instrumento
     */
    inputInstrumento.addEventListener('change', () => {
        const codigo = inputInstrumento.value.trim().toUpperCase();
        const instrumento = dbInstrumentos[codigo];
        
        document.getElementById('nombreInstrumento').textContent = instrumento ? instrumento.nombre : 'No encontrado';
        document.getElementById('codigoInstrumentoDisplay').textContent = codigo;
        
        // Limpiar el campo para el siguiente escaneo (si se desea)
        // inputInstrumento.value = '';

        actualizarMensajeEstado(`Instrumento ${codigo} cargado.`);
    });
    
    /**
     * Función para actualizar el mensaje de estado
     */
    function actualizarMensajeEstado(mensaje, isError = false) {
        const statusEl = document.getElementById('statusMessage');
        statusEl.textContent = `${new Date().toLocaleTimeString()} - ${mensaje}`;
        statusEl.style.color = isError ? '#dc3545' : '#28a745';
    }

});

/**
 * Función que simula el registro de datos (donde iría la llamada a la base de datos)
 */
function simularRegistro() {
    const codigoInstrumento = document.getElementById('codigoInstrumento').value.trim();
    const codigoPersona = document.getElementById('codigoPersona').value.trim();
    const nombrePersona = document.getElementById('nombrePersona').textContent;
    const rolPersona = document.getElementById('rolPersona').textContent;
    const cantidad = document.getElementById('cantidad').value;
    
    const statusEl = document.getElementById('statusMessage');

    if (!codigoInstrumento || !codigoPersona || nombrePersona === 'No encontrado') {
        statusEl.textContent = '❌ Error: Faltan códigos o la persona no fue encontrada.';
        statusEl.style.color = '#dc3545';
        return;
    }

    const fechaHora = new Date().toLocaleString();

    // Aquí iría el código real de envío de datos (AJAX/Fetch) al servidor 
    // para guardarlos en MySQL.

    const datosARegistrar = {
        fecha: fechaHora.split(',')[0],
        hora: fechaHora.split(',')[1].trim(),
        codigo_instrumento: codigoInstrumento,
        codigo_persona: codigoPersona,
        nombre_persona: nombrePersona,
        rol: rolPersona,
        cantidad: cantidad
    };

    console.log('--- Datos Simulados para MySQL ---');
    console.log(datosARegistrar);
    
    statusEl.textContent = `✅ REGISTRO EXITOSO: ${datosARegistrar.nombre_persona} prestó ${datosARegistrar.cantidad} unidad(es) de ${codigoInstrumento} a las ${datosARegistrar.hora}.`;
    statusEl.style.color = '#28a745';

    // Limpiar campos después del registro simulado (opcional)
    document.getElementById('codigoInstrumento').value = '';
    document.getElementById('codigoPersona').value = '';
    document.getElementById('nombrePersona').textContent = '---';
    document.getElementById('rolPersona').textContent = '---';
    document.getElementById('nombreInstrumento').textContent = '---';
    document.getElementById('codigoInstrumentoDisplay').textContent = '---';
    document.getElementById('cantidad').value = '1';
    document.getElementById('codigoInstrumento').focus(); // Volver a enfocar para el próximo escaneo
}