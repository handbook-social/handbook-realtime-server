import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './common/config/config';
import { authMiddleware } from './middlwares/auth.middleware';
import { prepare } from './prepare';
import { redisService } from './services/redis.service';
import { SocketManager } from './socket/socket.manager';
import { initEmailWorker } from './queues/email.worker';
import logger from './common/logger';
import promClient from 'prom-client';

// Collect default metrics for Prometheus
promClient.collectDefaultMetrics();

// Define global type augmentation for IO
declare global {
    var ioInstance: Server | undefined;
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: config.corsOptions.origin,
        methods: ['GET', 'POST'],
    },
});

global.ioInstance = io;

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors(config.corsOptions));

io.use(authMiddleware);

prepare(io);

io.on('connection', async (socket) => {
    await SocketManager.handleConnection(socket, io);
});

import internalRouter from './routes/internal.route';

// Middleware
app.use(express.json());

// Routes
app.use('/internal', internalRouter);

app.get('/', (req, res) => {
    res.send('Realtime Server is running (VPS Version)');
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
});

const server = httpServer.listen(config.port, () => {
    logger.info(`Server is running on port ${config.port}`);

    // Initialize email worker after server starts (lazy connection)
    initEmailWorker();
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    logger.info(`\n${signal} received. Shutting down gracefully...`);

    server.close(async () => {
        logger.info('HTTP server closed');

        try {
            // Disconnect Redis
            await redisService.disconnect();
            logger.info('Graceful shutdown completed');
            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown:', error as Error);
            process.exit(1);
        }
    });

    // Force close after 10 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at: ' + promise + ' reason: ' + reason);
    gracefulShutdown('unhandledRejection');
});
