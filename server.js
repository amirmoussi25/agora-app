const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');
const jwt = require('jsonwebtoken');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Simulation de connexion MongoDB (à adapter selon votre setup)
let mongoose;
let Message;

async function initializeModels() {
  try {
    mongoose = require('mongoose');
    
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agora');
    }
    
    // Schema Message (simplifié pour le serveur)
    const messageSchema = new mongoose.Schema({
      roomId: { type: String, required: true, index: true },
      senderId: { type: Number, required: true },
      senderName: { type: String, required: true },
      senderType: { type: String, enum: ['client', 'mairie'], required: true },
      content: { type: String, required: true, maxlength: 1000 },
      type: { type: String, enum: ['text', 'system'], default: 'text' },
      isRead: { type: Boolean, default: false }
    }, { timestamps: true });
    
    Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
    console.log('MongoDB connecté et modèles initialisés');
  } catch (error) {
    console.error('Erreur initialisation MongoDB:', error);
  }
}

app.prepare().then(async () => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialiser les modèles MongoDB
  await initializeModels();

  // Initialiser Socket.IO
  const io = new SocketIOServer(server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  // Middleware d'authentification
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      console.log('🔐 Tentative connexion Socket.IO:', { 
        token: token ? `présent (${token.substring(0, 20)}...)` : 'manquant',
        origin: socket.handshake.headers.origin,
        userAgent: socket.handshake.headers['user-agent']?.substring(0, 50)
      });
      
      if (!token) {
        console.log('❌ Connexion refusée: token manquant');
        return next(new Error('Token manquant'));
      }

      console.log('🔍 Vérification JWT avec secret:', process.env.JWT_SECRET ? 'configuré' : 'manquant');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      console.log('✅ Utilisateur authentifié:', {
        email: decoded.email,
        userId: decoded.userId,
        userType: decoded.userType
      });
      next();
    } catch (error) {
      console.log('❌ Connexion refusée: token invalide', {
        error: error.message,
        name: error.name
      });
      next(new Error('Token invalide: ' + error.message));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`Utilisateur connecté: ${user.email} (${user.userType})`);

    // Rejoindre les rooms des salles
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`${user.email} a rejoint la room ${roomId}`);
    });

    // Quitter une room
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      console.log(`${user.email} a quitté la room ${roomId}`);
    });

    // Envoyer un message
    socket.on('send_message', async (data) => {
      try {
        if (!Message) {
          socket.emit('message_error', 'Service temporairement indisponible');
          return;
        }

        // Créer le message en base
        const message = new Message({
          roomId: data.roomId,
          senderId: user.userId,
          senderName: user.email.split('@')[0],
          senderType: user.userType,
          content: data.content.trim(),
          type: 'text'
        });

        await message.save();

        // Diffuser le message à tous les clients de la room
        const messageData = {
          _id: message._id.toString(),
          roomId: message.roomId,
          senderId: message.senderId,
          senderName: message.senderName,
          senderType: message.senderType,
          content: message.content,
          type: message.type,
          createdAt: message.createdAt.toISOString()
        };
        
        // Si c'est un message de synchronisation hors ligne, inclure le tempId
        if (data.tempId) {
          messageData.tempId = data.tempId;
        }
        
        console.log('Diffusion du message vers room:', data.roomId);
        io.to(data.roomId).emit('new_message', messageData);

        console.log(`Message envoyé dans room ${data.roomId} par ${user.email}`);
      } catch (error) {
        console.error('Erreur envoi message:', error);
        socket.emit('message_error', 'Erreur lors de l\'envoi du message');
      }
    });

    // Gestion de l'indicateur "en train d'écrire"
    socket.on('start_typing', (data) => {
      socket.to(data.roomId).emit('user_typing', {
        roomId: data.roomId,
        userId: user.userId,
        name: user.email.split('@')[0]
      });
      console.log(`${user.email} commence à écrire dans room ${data.roomId}`);
    });

    socket.on('stop_typing', (data) => {
      socket.to(data.roomId).emit('user_stop_typing', {
        roomId: data.roomId,
        userId: user.userId
      });
      console.log(`${user.email} arrête d'écrire dans room ${data.roomId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Utilisateur déconnecté: ${user.email}`);
    });
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`> Serveur prêt sur http://localhost:${port}`);
    console.log('> Socket.IO configuré sur /api/socketio');
  });
});