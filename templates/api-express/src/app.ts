import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'healthy' }));

{% if includeAuth %}
// Authentication middleware placeholder
app.use('/protected', (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

app.get('/protected', (_req, res) => res.json({ message: 'authenticated' }));
{% endif %}

export default app;
