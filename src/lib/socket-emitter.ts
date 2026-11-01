import { Server } from 'socket.io';

declare global {
  // eslint-disable-next-line no-var
  var io: Server | undefined;
}

export function broadcastQueueUpdate(clinicId: string, event: string, payload: unknown) {
  if (typeof global !== 'undefined' && global.io) {
    global.io.to(`clinic:${clinicId}`).emit(event, payload);
  }
}

export function broadcastTicketUpdate(ticketId: string, event: string, payload: unknown) {
  if (typeof global !== 'undefined' && global.io) {
    global.io.to(`ticket:${ticketId}`).emit(event, payload);
  }
}
