# CarbonTax Parse Server

This is an app to monitor energy usage...

**Development**

Update `env.js` in root of project with DEV settings:

```
  SERVER_PORT: usually 8080
  SERVER_HOST: usually 'localhost' or IP of DEV server
  APP_ID: replace with App Name: e.g 'app-name'
  MASTER_KEY: replace with master key, you can create a hash @ https://www.bcrypt-generator.com/
  DATABASE_URI: replace with Mongo DB URI: e.g 'mongodb://localhost:27017/app-name'
  SERVER_URL: `http://${_SERVER_HOST}:${_SERVER_PORT}/parse`
```
