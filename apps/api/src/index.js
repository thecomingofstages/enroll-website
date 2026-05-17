require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi    = require('swagger-ui-express');
const yaml         = require('js-yaml');
const fs           = require('fs');
const path         = require('path');

const { MongoDatabase } = require('./app/database/init');
const AppConf           = require('./app/config/app.conf');
const ErrorHandler      = require('./app/middleware/ErrorHandler.middleware');
const Logger            = require('./app/utils/Logger.util');

// Routes
const AuthRoutes         = require('./app/routes/Auth.routes');
const UserRoutes         = require('./app/routes/User.routes');
const ActivityRoutes     = require('./app/routes/Activity.routes');
const RegistrationRoutes = require('./app/routes/Registration.routes');
const AdminRoutes        = require('./app/routes/Admin.routes');
const EventRoutes        = require('./app/routes/Event.routes');

const app = express();

// ── Core middleware ──────────────────────────────────────────────
// app.use(cors({ origin: AppConf.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Swagger UI ───────────────────────────────────────────────────
const swaggerDoc = yaml.load(fs.readFileSync(path.join(__dirname, 'swagger.yaml'), 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
  customSiteTitle: 'TCOS API Docs',
}));

// ── Health check ─────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ service: 'TCOS API', status: 'running', version: '1.0.0' }));

// ── API routes (versioned) ───────────────────────────────────────
const v1 = express.Router();

v1.use('/auth',          AuthRoutes);
v1.use('/users',         UserRoutes);
v1.use('/activities',    ActivityRoutes);
v1.use('/registrations', RegistrationRoutes);
v1.use('/admin',         AdminRoutes);
v1.use('/events',        EventRoutes);

app.use('/v1', v1);

// ── Global error handler (must be last) ─────────────────────────
app.use(ErrorHandler);

// ── Boot ─────────────────────────────────────────────────────────
async function bootstrap() {
  await MongoDatabase.connect();
  app.listen(AppConf.PORT, () => {
    Logger.info(`TCOS API running on port ${AppConf.PORT}`);
    Logger.info(`Swagger UI → http://localhost:${AppConf.PORT}/api-docs`);
  });
}

bootstrap();
