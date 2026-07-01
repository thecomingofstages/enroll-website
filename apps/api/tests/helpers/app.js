/**
 * tests/helpers/app.js
 *
 * Returns the Express app WITHOUT calling MongoDatabase.connect() or app.listen().
 * Supertest will bind its own port, and the test DB helper handles MongoDB.
 */

require('dotenv').config();

const express      = require('express');
const cookieParser = require('cookie-parser');

const ErrorHandler       = require('../../src/app/middleware/ErrorHandler.middleware');
const AuthRoutes         = require('../../src/app/routes/Auth.routes');
const UserRoutes         = require('../../src/app/routes/User.routes');
const ActivityRoutes     = require('../../src/app/routes/Activity.routes');
const RegistrationRoutes = require('../../src/app/routes/Registration.routes');
const AdminRoutes        = require('../../src/app/routes/Admin.routes');
const EventRoutes        = require('../../src/app/routes/Event.routes');
const StampStoreRoutes   = require('../../src/app/routes/StampStore.routes');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  const v1 = express.Router();
  v1.use('/auth',          AuthRoutes);
  v1.use('/users',         UserRoutes);
  v1.use('/activities',    ActivityRoutes);
  v1.use('/registrations', RegistrationRoutes);
  v1.use('/admin',         AdminRoutes);
  v1.use('/events',        EventRoutes);
  v1.use('/stampstore',    StampStoreRoutes);

  app.use('/v1', v1);
  app.use(ErrorHandler);
  return app;
}

module.exports = buildApp;
