// simulador.js
// Este script simula al ESP32 mandando datos al servidor cada 3 segundos

const enviarDatos = async () => {
    // Generamos datos aleatorios para la simulación
    const humedadAleatoria = Math.floor(Math.random() * (80 - 20 + 1)) + 20; // Entre 20% y 80%
    const litrosAleatorios = (Math.random() * 2).toFixed(2); // Entre 0 y 2 litros

    const payload = {
        id_maceta: 1, // Simulando la maceta 1
        humedad: humedadAleatoria,
        litros: parseFloat(litrosAleatorios),
        estado: humedadAleatoria > 40 ? "Excelente" : "Requiere atención"
    };

    try {
        // Hacemos el POST al backend que ya tienes corriendo
        const respuesta = await fetch('http://localhost:3000/api/sensores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await respuesta.json();
        console.log(`📡 Enviado: Humedad ${humedadAleatoria}%. Respuesta del servidor:`, data.mensaje);
    } catch (error) {
        console.error("❌ Error conectando al servidor. ¿Está corriendo server.js?:", error.message);
    }
};

console.log("Iniciando simulación del ESP32... (Presiona Ctrl+C para detener)");

// Ejecuta la función por primera vez inmediatamente, y luego cada 3 segundos
enviarDatos();
setInterval(enviarDatos, 3000);