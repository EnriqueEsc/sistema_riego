let chartInstance = null;

// Forzar a Chart.js a usar texto blanco en todo
Chart.defaults.color = '#ffffff';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)'; // Líneas de la cuadrícula más sutiles

// Actualizar el estado principal y el "Último riego"
// Actualizar el estado principal y el "Último riego"
async function actualizarEstado() {
    try {
        const res = await fetch('/api/historial');
        const datos = await res.json();
        
        if (datos && datos.length > 0) {
            const ultimo = datos[datos.length - 1];
            
            document.getElementById('val-humedad').innerText = `${ultimo.humedad}%`;
            document.getElementById('val-litros').innerText = `${ultimo.litros_hoy} lts`;
            document.getElementById('val-estado').innerText = ultimo.estado;
            
            // Solo actualizamos el ID que sí existe en tu nuevo diseño
            const fechaString = new Date(ultimo.fecha).toLocaleString('es-MX');
            document.getElementById('txt-ultimo-riego').innerText = fechaString;
        }
    } catch (error) {
        console.error("❌ Error cargando estado:", error);
    }
}

// Modificar mostrarPantalla para incluir Analytics y Tabla
async function mostrarPantalla(tipo) {
    const pantallas = ['pantalla-estado', 'pantalla-graficas', 'pantalla-preferencias', 'pantalla-analytics', 'pantalla-tabla'];
    pantallas.forEach(p => document.getElementById(p).style.display = 'none');

    if (tipo === 'estado') document.getElementById('pantalla-estado').style.display = 'block';
    if (tipo === 'preferencias') {
        document.getElementById('pantalla-preferencias').style.display = 'block';
        cargarPreferencias();
    }
    
    if (tipo === 'analytics') {
        document.getElementById('pantalla-analytics').style.display = 'block';
        const res = await fetch('/api/analytics');
        const ana = await res.json();
        document.getElementById('ana-sesiones').innerText = ana.sesiones_semana;
        document.getElementById('ana-total').innerText = `${ana.total_litros} lts`;
        document.getElementById('ana-dia').innerText = `${ana.promedio_dia} lts`;
        document.getElementById('ana-planta').innerText = `${ana.promedio_planta} lts`;
    }

    if (tipo === 'tabla') {
        document.getElementById('pantalla-tabla').style.display = 'block';
        const res = await fetch('/api/historial');
        const registros = await res.json();
        const cuerpo = document.getElementById('tabla-cuerpo');
        cuerpo.innerHTML = '';
        registros.forEach(r => {
            const fila = `<tr>
                <td style="padding: 5px;">${new Date(r.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                <td style="padding: 5px;">${r.humedad}%</td>
                <td style="padding: 5px;">${r.litros_hoy}</td>
            </tr>`;
            cuerpo.innerHTML += fila;
        });
    }

    if (tipo === 'grafica-humedad' || tipo === 'grafica-consumo') {
        document.getElementById('pantalla-graficas').style.display = 'block';

        const res = await fetch('/api/historial');
        const historial = await res.json();

        const labels = historial.map(d => new Date(d.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        
        if (chartInstance) chartInstance.destroy(); 

        const ctx = document.getElementById('miGrafica').getContext('2d');
        
        if (tipo === 'grafica-humedad') {
            document.getElementById('titulo-grafica').innerText = "Historial de Humedad (%)";
            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Humedad %',
                        data: historial.map(d => d.humedad),
                        borderColor: '#00d2ff',
                        backgroundColor: 'rgba(0, 210, 255, 0.2)',
                        fill: true
                    }]
                },
                options: { scales: { y: { beginAtZero: true, max: 100 } } }
            });
        } else {
            document.getElementById('titulo-grafica').innerText = "Consumo Diario (Lts)";
            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Litros',
                        data: historial.map(d => d.litros_hoy),
                        backgroundColor: '#ffffff'
                    }]
                }
            });
        }
    }
}

async function regarPlanta() {
    const res = await fetch('/api/regar', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id_maceta: 1, tiempo_segundos: 5 })
    });
    const data = await res.json();
    alert(data.mensaje);
}


// Cargar datos actuales de Mongo a la UI
async function cargarPreferencias() {
    const res = await fetch('/api/configuracion');
    const config = await res.json();
    document.getElementById('input-umbral').value = config.umbral_humedad;
    document.getElementById('check-automatico').checked = config.riego_automatico;
}

// Mandar los cambios de vuelta a Mongo
async function guardarPreferencias() {
    const umbral = document.getElementById('input-umbral').value;
    const automatico = document.getElementById('check-automatico').checked;
    
    await fetch('/api/configuracion', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ umbral_humedad: umbral, riego_automatico: automatico })
    });
    
    alert("Preferencias guardadas");
    mostrarPantalla('estado');
}

// Cargar estado inicial
actualizarEstado();
setInterval(actualizarEstado, 5000); // Actualizar cada 5 seg