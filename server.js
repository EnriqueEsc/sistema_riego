require('dotenv').config(); // Cargar variables de entorno
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Planta = require('./models/Planta'); // Importamos tu modelo

const app = express();

app.use(cors());
app.use(express.json()); 
app.use(express.static('public')); 

// ---------------------------------------------------------
// CONEXIÓN A MONGODB ATLAS
// ---------------------------------------------------------
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Conectado exitosamente a MongoDB Atlas'))
    .catch(err => console.error('Error conectando a MongoDB:', err));

// ---------------------------------------------------------
// ENDPOINTS PARA EL ESP32
// ---------------------------------------------------------

// 1. El ESP32 manda datos aquí (POST) y se guardan en la DB
app.post('/api/sensores', async (req, res) => {
    try {
        const { id_maceta, humedad, litros, estado } = req.body;
        
        // 1. Guardar la lectura en el historial
        const nuevaLectura = new Planta({ id_maceta, humedad, litros_hoy: litros, estado });
        await nuevaLectura.save();
        
        // 2. LÓGICA DE AUTOMATIZACIÓN
        const config = await Configuracion.findOne({ id_usuario: 1 });
        
        if (config && config.riego_automatico) {
            // Si la humedad reportada es menor al umbral que pusiste en la app
            if (humedad < config.umbral_humedad) {
                // Encolamos la orden automáticamente sin que el usuario pulse nada
                comandoPendiente = {
                    comando: "REGAR",
                    id_maceta: id_maceta,
                    tiempo: 5 // 5 segundos de bomba, por ejemplo
                };
                console.log(`¡Riego Automático Disparado! Humedad (${humedad}%) cayó debajo del umbral (${config.umbral_humedad}%)`);
            }
        }
        
        res.status(200).json({ mensaje: "Datos procesados" });
    } catch (error) {
        res.status(500).json({ error: "Error interno" });
    }
});

let comandoPendiente = null; 

app.get('/api/comandos', (req, res) => {
    if (comandoPendiente) {
        res.json(comandoPendiente);
        comandoPendiente = null; 
    } else {
        res.json({}); 
    }
});

// ---------------------------------------------------------
// ENDPOINTS PARA LA GUI
// ---------------------------------------------------------

app.post('/api/regar', (req, res) => {
    const { id_maceta, tiempo_segundos } = req.body;
    
    comandoPendiente = {
        comando: "REGAR",
        id_maceta: id_maceta,
        tiempo: tiempo_segundos
    };
    
    console.log(`Orden de riego encolada para maceta ${id_maceta}`);
    res.status(200).json({ mensaje: "Orden enviada al robot" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Endpoint para obtener las últimas 10 lecturas para las gráficas
app.get('/api/historial', async (req, res) => {
    try {
        const historial = await Planta.find().sort({ fecha: -1 }).limit(10);
        // Los invertimos para que el más reciente salga a la derecha en la gráfica
        res.json(historial.reverse());
    } catch (error) {
        res.status(500).json({ error: "Error al obtener historial" });
    }
});

// ---------------------------------------------------------
// ENDPOINTS DE CONFIGURACIÓN (TUS PREFERENCIAS)
// ---------------------------------------------------------

// Obtener la configuración actual
app.get('/api/configuracion', async (req, res) => {
    let config = await Configuracion.findOne({ id_usuario: 1 });
    if (!config) {
        config = await Configuracion.create({ id_usuario: 1, umbral_humedad: 20, riego_automatico: true });
    }
    res.json(config);
});

// Guardar nueva configuración desde el Dashboard
app.post('/api/configuracion', async (req, res) => {
    const { umbral_humedad, riego_automatico } = req.body;
    await Configuracion.findOneAndUpdate(
        { id_usuario: 1 }, 
        { umbral_humedad, riego_automatico }, 
        { upsert: true }
    );
    res.json({ mensaje: "Preferencias actualizadas" });
});

// Endpoint para analíticas (Pantalla 2)
app.get('/api/analytics', async (req, res) => {
    try {
        const sieteDiasAtras = new Date();
        sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);

        const registros = await Planta.find({ fecha: { $gte: sieteDiasAtras } });

        // Cálculos
        const totalLitros = registros.reduce((acc, reg) => acc + (reg.litros_hoy || 0), 0);
        const numDias = 7;
        const promedioDia = totalLitros / numDias;
        const promedioPlanta = totalLitros / 4; // Suponiendo tu cuadrícula de 4 macetas
        const totalRiegos = registros.length; // Simplificado: cada registro es una toma/riego

        res.json({
            sesiones_semana: totalRiegos,
            total_litros: totalLitros.toFixed(2),
            promedio_dia: promedioDia.toFixed(2),
            promedio_planta: promedioPlanta.toFixed(2),
            estado_general: "Excelente"
        });
    } catch (error) {
        res.status(500).json({ error: "Error en analíticas" });
    }
});