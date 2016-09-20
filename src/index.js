import config from './config'
import setHighscoreManager from './setHighscoreManager'

const app = require('express')()
const ews = require('express-ws')(app)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/set', (req, res) => {
  res.send('Hello Set!')
})

app.ws('/set', (ws, req) => {
  setHighscoreManager.clientRequested(ws)
})

app.listen(config.port, () => {
  console.log(`App listening on port ${config.port}!`)
})
