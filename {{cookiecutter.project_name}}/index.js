const app = require('./app')
const scf = require('scf-framework')

const server = scf.createServer(app)

exports.main_handler = (event, context) => scf.proxy(server, event, context)
