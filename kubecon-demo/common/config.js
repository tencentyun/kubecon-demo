exports.DB_OPTIONS = {
  host: process.env.host,
  port: process.env.port || '61192',
  user: process.env.user || 'root',
  password: process.env.password,
  database: process.env.database || 'web_test'
}

exports.SALT = process.env.salt || 'koala_example_salt'
