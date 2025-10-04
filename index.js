const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Cargar variables de entorno desde .env
dotenv.config();

const app = express();

// Middleware
app.use(cors()); // Permite conexiones desde el frontend
app.use(bodyParser.json()); // Para parsear JSON en las requests

// Conexión a MongoDB usando la variable de entorno
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Conectado a MongoDB exitosamente');
})
.catch((error) => {
  console.error('❌ Error conectando a MongoDB:', error);
});

// Esquema de la tarea
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completed: {
    type: Boolean,
    default: false
  }
});

// Modelo de la tarea
const Task = mongoose.model('Task', taskSchema);

// === RUTAS CRUD ===

// 1. GET /tasks - Obtener todas las tareas
app.get('/tasks', async (req, res) => {
  try {
    console.log('📥 GET /tasks - Obteniendo todas las tareas');
    const tasks = await Task.find().sort({ date: 1, createdAt: -1 });
    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('❌ Error en GET /tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las tareas',
      message: error.message
    });
  }
});

// 2. GET /tasks/:id - Obtener una tarea específica
app.get('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📥 GET /tasks/${id} - Obteniendo tarea específica`);
    
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada',
        message: `No se encontró la tarea con ID: ${id}`
      });
    }
    
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('❌ Error en GET /tasks/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la tarea',
      message: error.message
    });
  }
});

// 3. POST /tasks - Crear nueva tarea
app.post('/tasks', async (req, res) => {
  try {
    const { title, date } = req.body;
    
    console.log(`📤 POST /tasks - Creando nueva tarea: "${title}"`);
    
    // Validaciones básicas
    if (!title || !date) {
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos',
        message: 'El título y la fecha son obligatorios'
      });
    }
    
    // Validar que la fecha sea futura
    const taskDate = new Date(date);
    if (taskDate < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Fecha inválida',
        message: 'La fecha debe ser futura'
      });
    }
    
    const newTask = new Task({
      title,
      date: taskDate
    });
    
    const savedTask = await newTask.save();
    
    res.status(201).json({
      success: true,
      message: 'Tarea creada exitosamente',
      data: savedTask
    });
  } catch (error) {
    console.error('❌ Error en POST /tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear la tarea',
      message: error.message
    });
  }
});

// 4. PUT /tasks/:id - Actualizar tarea
app.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, completed } = req.body;
    
    console.log(`🔄 PUT /tasks/${id} - Actualizando tarea`);
    
    // Si se envía fecha, validarla
    if (date) {
      const taskDate = new Date(date);
      if (taskDate < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Fecha inválida',
          message: 'La fecha debe ser futura'
        });
      }
    }
    
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { 
        title, 
        date: date ? new Date(date) : undefined,
        completed 
      },
      { 
        new: true, 
        runValidators: true 
      }
    );
    
    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada',
        message: `No se encontró la tarea con ID: ${id}`
      });
    }
    
    res.json({
      success: true,
      message: 'Tarea actualizada exitosamente',
      data: updatedTask
    });
  } catch (error) {
    console.error('❌ Error en PUT /tasks/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la tarea',
      message: error.message
    });
  }
});

// 5. DELETE /tasks/:id - Eliminar tarea
app.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ DELETE /tasks/${id} - Eliminando tarea`);
    
    const deletedTask = await Task.findByIdAndDelete(id);
    
    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada',
        message: `No se encontró la tarea con ID: ${id}`
      });
    }
    
    res.json({
      success: true,
      message: 'Tarea eliminada correctamente',
      data: {
        id: deletedTask._id,
        title: deletedTask.title
      }
    });
  } catch (error) {
    console.error('❌ Error en DELETE /tasks/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la tarea',
      message: error.message
    });
  }
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: '🎉 EulisT Backend funcionando correctamente!',
    version: '1.0.0',
    endpoints: {
      'GET /tasks': 'Obtener todas las tareas',
      'GET /tasks/:id': 'Obtener tarea específica',
      'POST /tasks': 'Crear nueva tarea',
      'PUT /tasks/:id': 'Actualizar tarea',
      'DELETE /tasks/:id': 'Eliminar tarea'
    }
  });
});

// Middleware para manejar rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe`
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📱 URL para probar: http://localhost:${PORT}`);
  console.log(`🔗 MongoDB conectado: ${MONGODB_URI.includes('mongodb') ? '✅' : '❌'}`);
});