import './instrument';
import * as Sentry from '@sentry/node';
import http from 'http';
import app from './app';
import prisma from './config/database';
import { initializeWebSocket } from './websocket/socket';
import { shutdownAnalytics } from './services/analytics.service';
const PORT = process.env.PORT || 3000;

let httpServer: http.Server;

async function main() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    httpServer = http.createServer(app);

    initializeWebSocket(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('WebSocket server ready');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`Received ${signal}. Shutting down gracefully...`);

  // Stop accepting new connections
  if (httpServer) {
    httpServer.close(() => {
      console.log('HTTP server closed');
    });
  }

  try {
    if (process.env.SENTRY_DSN) {
      await Sentry.close(2000);
    }
    await shutdownAnalytics();
    await prisma.$disconnect();
    console.log('Cleanup complete');
  } catch (err) {
    console.error('Error during shutdown:', err);
  }

  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  if (process.env.SENTRY_DSN) {
    if (reason instanceof Error) {
      Sentry.captureException(reason);
    } else {
      Sentry.captureMessage(String(reason), { level: 'error' });
    }
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  gracefulShutdown('uncaughtException');
});
