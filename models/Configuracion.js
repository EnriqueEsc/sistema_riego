const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    id_usuario: { type: Number, default: 1 }, // Solo para tener un registro único
    umbral_humedad: { type: Number, default: 20 },
    riego_automatico: { type: Boolean, default: true }
});

module.exports = mongoose.model('Configuracion', configSchema);