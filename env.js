'use strict';

module.exports = {
  SERVER_PORT: process.env.PORT || 8080,
  SERVER_HOST: process.env.HOST || 'localhost',
  APP_ID: process.env.APP_ID || 'replace-with-app-name',
  MASTER_KEY: process.env.MASTER_KEY || 'replace-with-master-key',
  DATABASE_URI: process.env.MONGODB_URI || process.env.DATABASE_URI || 'replace-with-db-uri',
  SERVER_URL: process.env.SERVER_URL || `http://${this.SERVER_HOST}:${this.SERVER_PORT}/parse`,
  GRAPHIQL_ENABLED: process.env.GRAPHIQL_ENABLED !== 'disabled' || true,
  IS_DEVELOPMENT: process.env.NODE_ENV !== 'production' || true,
  GCM_SENDER_ID: process.env.GCM_SENDER_ID || 'replace-with-gcm-app-number',
  GCM_API_KEY: process.env.GCM_API_KEY || 'replace-with-gcm-server-api-key',
  DASHBOARD_USERID: process.env.DASHBOARD_USERID || 'replace-with-dashboard-user-id',
  DASHBOARD_PASSWORD: process.env.DASHBOARD_PASSWORD || 'replace-with-dashboard-password-hash',
};
