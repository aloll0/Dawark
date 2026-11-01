/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port, webpack: true });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  const io = new Server(server, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Attach global IO instance for API routes if needed
  global.io = io;

  io.on('connection', (socket) => {
    socket.on('join_clinic', ({ clinicId }) => {
      if (clinicId) {
        socket.join(`clinic:${clinicId}`);
      }
    });

    socket.on('leave_clinic', ({ clinicId }) => {
      if (clinicId) {
        socket.leave(`clinic:${clinicId}`);
      }
    });

    socket.on('join_ticket', ({ ticketId }) => {
      if (ticketId) {
        socket.join(`ticket:${ticketId}`);
      }
    });

    socket.on('leave_ticket', ({ ticketId }) => {
      if (ticketId) {
        socket.leave(`ticket:${ticketId}`);
      }
    });

    socket.on('queue_action', (data) => {
      // Broadcast to all clients in the clinic room
      if (data?.clinicId) {
        io.to(`clinic:${data.clinicId}`).emit('queue_updated', data);
      }
      if (data?.ticketId) {
        io.to(`ticket:${data.ticketId}`).emit('ticket_status_changed', data);
      }
    });
  });

  server.listen(port, () => {
    console.log(`> Dawrak Next.js + Socket.io Server ready on http://${hostname}:${port}`);
  });
});
