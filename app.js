const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');
require('./services/database');

const app = express();
dotenv.config();
app.use(express.json());

// Aqui se puede crear usuarios con asignación de créditos según el plan
app.post('/Crear_Usuario', async (req, res) => {
  try {
    const { nombre, plan } = req.body;
    let creditos, CostoEnvio;

    if (plan === 1) {
      creditos = 30;
      CostoEnvio = 135 / 30;
    } else if (plan === 2) {
      creditos = 40;
      CostoEnvio = 160 / 40;
    } else if (plan === 3) {
      creditos = 60;
      CostoEnvio = 180 / 60;
    } else {
      return res.status(400).json({ mensaje: 'Plan no reconocido. Por favor selecciona 1, 2 o 3.' });
    }

    const usuario = new Usuario({ nombre, creditos, CostoEnvio });
    await usuario.save();
    res.status(201).json({ mensaje: 'El usuario se ha creado con éxito', usuario });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo crear el usuario', detalles: error.message });
  }
});

// Aqui se puede ver los créditos de un usuario
app.get('/credito/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ mensaje: 'El usuario especificado no existe' });

    res.json({
      nombre: usuario.nombre,
      creditosDisponibles: usuario.creditos,
      CostoEnvio: usuario.CostoEnvio
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Fallo interno al obtener créditos', detalles: error.message });
  }
});

// Aqui se podra registrar un nuevo envío
app.post('/envio/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ mensaje: 'El usuario especificado no existe' });

    const {
      nombre, direccion, telefono, referencia, observacion,
      descripcion, peso, bultos, fecha_entrega
    } = req.body;

    const envioData = { nombre, direccion, telefono, referencia, observacion };
    const productoData = { descripcion, peso, bultos, fecha_entrega };

    // Aqui usaremos el metodo de encapsulado
    usuario.registrarEnvio(envioData, productoData);

    await usuario.save();
    res.json({ mensaje: 'El envío fue registrado con éxito' });
  } catch (error) {
    res.status(400).json({ mensaje: 'Registro de envío fallido', detalles: error.message });
  }
});

// Aqui se pueden consultar todos los envíos de un usuario
app.get('/envios/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ mensaje: 'El usuario especificado no existe' });

    res.json({ envios: usuario.envios });
  } catch (error) {
    res.status(500).json({ mensaje: 'Fallo al consultar envíos', detalles: error.message });
  }
});

// Aqui se podra eliminar envío y devolver créditos
app.delete('/envio/:userId/:envioId', async (req, res) => {
  try {
    const { userId, envioId } = req.params;
    const usuario = await Usuario.findById(userId);
    if (!usuario) return res.status(404).json({ mensaje: 'El usuario especificado no existe' });

    // Aqui usaremos el metodo de encapsulado
    usuario.eliminarEnvio(envioId);

    await usuario.save();
    res.json({ mensaje: 'El envío ha sido eliminado y los créditos reembolsados' });
  } catch (error) {
    res.status(400).json({ mensaje: 'No se pudo eliminar el envío', detalles: error.message });
  }
});

// Aqui se iniciara el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});

