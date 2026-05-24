import express, { Request, Response } from 'express';
import { createClient } from 'redis';

const app = express();
app.use(express.json());

const redisClient = createClient({
    url: 'redis://redis-service:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

app.post('/api/routes', async (req: Request, res: Response) => {
    const { domain, targetUrl } = req.body;

    if (!domain || !targetUrl) {
        return res.status(400).json({ error: "Missing 'domain' or 'targetUrl'" });
    }

    try {
        const routeKey = `route:${domain}`;

        await redisClient.set(routeKey, targetUrl);
        console.log(`Saved: ${domain} -> ${targetUrl}`);

        await redisClient.publish('minipaas-updates', 'reload');
        console.log(`Published reload signal to Gateway`);

        return res.status(201).json({ 
            message: "Route successfully registered and gateway reloaded.",
            domain,
            targetUrl
        });
    } catch (error) {
        console.error("Failed to update route", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', async () => {
    await redisClient.connect();
    console.log(`Control Plane API running on port ${PORT}`);
});