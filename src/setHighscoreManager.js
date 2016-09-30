const MongoClient = require('mongodb').MongoClient

class SetHighscoreManager {
  constructor () {
    this.dbConnected = this.dbConnected.bind(this)
    this.clientRequested = this.clientRequested.bind(this)
    this.clientMessaged = this.clientMessaged.bind(this)
    this.clientClosed = this.clientClosed.bind(this)

    MongoClient.connect('mongodb://localhost/set', this.dbConnected)
  }

  dbConnected (err, db) {
    this.db = db
    this.scores = db.collection('scores')
  }

  clientRequested (ws) {
    console.log('requested')

    ws.on('message', (msg) => this.clientMessaged(ws, msg))
    ws.on('close', () => this.clientClosed(ws))
  }

  clientMessaged (ws, msg) {
    console.log(`messaged at: ${new Date()}`)
    console.log(msg)

    const message = JSON.parse(msg)

    if (message.type === 'score') {
      this.scores.insert({
        name: message.data.name,
        score: message.data.score,
        date: new Date()
      })
    } else if (message.type === 'batchScores') {
      for (const score of message.data) {
        this.scores.insert({
          name: score.name,
          score: score.score,
          date: new Date()
        })
      }
    } else if (message.type === 'scoreRequest') {
      this.sendScores(ws)
    }
  }

  clientClosed (ws) {
    console.log('closed')
  }

  getScores () {
    return Promise.all([
      new Promise((resolve, reject) => {
        this.scores.find({}, { name: 1, score: 1, _id: 0 })
          .sort({score: -1}).limit(10).toArray((err, data) => {
          resolve({ type: 'globalScores', data: data })
        })
      }),
      new Promise((resolve, reject) => {
        const date = new Date()

        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()
        const paddedMonth = month < 10 ? '0' + month : month
        const paddedDay = day < 10 ? '0' + day : day

        const dayBegin = new Date(`${year}-${paddedMonth}-${paddedDay}T00:00:00+0200`)
        const dayEnd = new Date(`${year}-${paddedMonth}-${paddedDay}T24:00:00+0200`)

        this.scores.find({ date: { $gt: dayBegin, $lt: dayEnd } }, { name: 1, score: 1, _id: 0 })
          .sort({score: -1}).limit(10).toArray((err, data) => {
          resolve({ type: 'dailyScores', data: data })
        })
      }),
      new Promise((resolve, reject) => {
        this.scores.aggregate([{$group: {_id: '$name', maxScore: {$max: '$score'}}}])
          .sort({maxScore: -1}).limit(10).toArray((err, data) => {
          resolve({ type: 'personalScores', data: data.map(score => ({name: score._id, score: score.maxScore})) })
        })
      })
    ])
  }

  sendScores (ws) {
    this.getScores().then(scoresByType => {
      ws.send(JSON.stringify({
        type: 'scoresByType',
        data: scoresByType
      }))
    })
  }
}

export default new SetHighscoreManager()
