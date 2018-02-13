// Dev server with livereload
const connect  = require('connect')
const static = require('serve-static')

const server = connect()

server.use(static(__dirname))

server.listen(3000, undefined, undefined, () => console.log('Server listening on port 3000'))

const livereload = require('livereload')
const lrserver = livereload.createServer()
lrserver.watch(__dirname)