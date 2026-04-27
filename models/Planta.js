//Está en sistema_riego/models/Planta.js

const mongoose = require('mongoose');

const lecturaSchema = new mongoose.Schema({
    id_maceta: Number,
    humedad: Number,
    litros_hoy: Number,
    estado: String,
    fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lectura', lecturaSchema);