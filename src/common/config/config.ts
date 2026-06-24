export const config = {
    port: process.env.PORT || 5000,
    internalSecretKey:
        process.env.INTERNAL_SECRET_KEY || 'default-secret-key-change-me',
    mongodbUri:
        process.env.MONGODB_URI || 'mongodb://localhost:27017/defaultdb',
    clientHost: process.env.CLIENT_HOST || 'http://localhost:3000',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || '',
    },
    resend: {
        apiKey: process.env.RESEND_API_KEY || '',
        fromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    },
    corsOptions: {
        origin: process.env.CLIENT_HOST
            ? process.env.CLIENT_HOST.split(',')
            : ['http://localhost:3000'],
        credentials: true,
    },
    socketOptions: {
        cors: {
            origin: process.env.CLIENT_HOST
                ? process.env.CLIENT_HOST.split(',')
                : ['http://localhost:3000'],
            credentials: true,
        },
    },
};
