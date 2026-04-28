//Está en sistema_riego/models/Planta.js

const mongoose = require('mongoose');

const lecturaSchema = new mongoose.Schema({
    id_maceta: Number,
    humedad: Number,
    litros_hoy: { type: Number, default: 0 },
    riego_activado: { type: Boolean, default: false }, // <--- Nueva columna
    estado: String,
    fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lectura', lecturaSchema);