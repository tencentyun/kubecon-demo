var mysql = require('mysql')
var { DB_OPTIONS } = require('./config')

class Database {
  constructor() {
    if (!this.connection) {
      this.connection = mysql.createPool(DB_OPTIONS)
    }
  }
  exec(sql, params) {
    const _this = this
    return new Promise(function(resolve, reject) {
      _this.connection.query(sql, params, function(error, data) {
        if (error) {
          console.error(error)
          reject(error)
        }
        resolve(data)
      })
    })
  }
}

module.exports = Database
