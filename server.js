
import path from 'path';
import express from 'express';
import graphQLHTTP from 'express-graphql';
import {Schema} from './schema/schema';
import Parse from 'parse/node';
import {ParseServer} from 'parse-server';
import ParseDashboard from 'parse-dashboard';
//import morgan from 'morgan';
import {
  SERVER_PORT,
  SERVER_HOST,
  APP_ID,
  MASTER_KEY,
  DATABASE_URI,
  SERVER_URL,
  GRAPHIQL_ENABLED,
  IS_DEVELOPMENT
} from './env';

Parse.serverURL = SERVER_URL;
Parse.initialize(APP_ID);
Parse.masterKey = MASTER_KEY;
Parse.Cloud.useMasterKey();

function getSchema() {
  if (!IS_DEVELOPMENT) {
    return Schema;
  }

  delete require.cache[require.resolve('./schema/schema.js')];
  return require('./schema/schema.js').Schema;
}

const server = express();

//server.use(morgan('dev'));

server.use(
  '/parse',
  new ParseServer({
    databaseURI: DATABASE_URI,
    cloud: path.resolve(__dirname, 'cloud.js'),
    appId: APP_ID,
    masterKey: MASTER_KEY,
    //fileKey: '',
    serverURL: SERVER_URL,
  })
);

server.use(
  '/dashboard',
  ParseDashboard({
    'allowInsecureHTTP': true,
    apps: [
      {
        serverURL: '/parse',
        appId: APP_ID,
        masterKey: MASTER_KEY,
        appName: 'AMF-App',
      }
    ],
    'users': [
      {
        'user':'admin',
        'pass':'$2a$08$UAS/umTbvoW1k5CwRJdlk.RfPon1TCXtqb2moDe81SpwWfSG5uR32'
      }
    ],
    'useEncryptedPasswords': true
  }, true)
);

server.use(
  '/graphql',
  graphQLHTTP((request) => {
    return {
      graphiql: GRAPHIQL_ENABLED,
      pretty: GRAPHIQL_ENABLED,
      schema: getSchema(),
      rootValue: Math.random(), // TODO: Check credentials, assign user
    };
  })
);

//server.use('/', (req, res) => res.redirect('/graphql'));

server.listen(SERVER_PORT, () => console.log(
  `Server is now running in ${process.env.NODE_ENV || 'development'} mode on http://${SERVER_HOST}:${SERVER_PORT}`
));
