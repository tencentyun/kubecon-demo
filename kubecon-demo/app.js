/**
 * Module dependencies.
 */

const express = require('express')
const path = require('path')
const session = require('express-session')
const methodOverride = require('method-override')
const hash = require('pbkdf2-password')()
const MySQLStore = require('express-mysql-session')(session)
const { DB_OPTIONS, SALT } = require('./common/config')

const Database = require('./common/db')
const db = new Database()

const app = (module.exports = express())

app.set('view engine', 'ejs')

app.set('views', [path.join(__dirname, 'views')])

app.use(express.static(path.join(__dirname, 'public')))

const sessionStore = new MySQLStore(DB_OPTIONS)
app.use(
  session({
    key: 'tse_example_session_id',
    secret: 'session_cookie_secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false
  })
)

app.use(express.urlencoded({ extended: true }))

app.use(function(req, res, next) {
  const err = req.session.error
  const msg = req.session.success
  delete req.session.error
  delete req.session.success
  res.locals.message = ''
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>'
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>'
  next()
})

app.use(methodOverride('_method'))

const getPath = (path = '') => {
  return '/test' + path
}

const getRedirectPath = path => {
  return '/release/' + getPath(path)
}
app.get(getPath('/'), function(req, res) {
  if (req.session.user) {
    res.redirect(getRedirectPath('/user/' + req.session.user.id))
  } else {
    res.redirect(getRedirectPath('/login'))
  }
})

app.get(getPath('/logout'), function(req, res) {
  req.session.destroy(function() {
    res.redirect(getRedirectPath('/'))
  })
})

app.get(getPath('/login'), function(req, res) {
  res.render('login', { basePath: getRedirectPath() })
})

function getUserInfo(name, hash) {
  const sql = 'select * from user where name = ? and hash = ?'
  const params = [name, hash]
  return db.exec(sql, params)
}

function authenticate(name, pass, fn) {
  hash({ password: pass, salt: SALT }, function(err, pass, salt, hash) {
    if (err) return fn(err)
    getUserInfo(name, hash).then(
      function(data) {
        if (data && data[0]) {
          return fn(null, data[0])
        }
        fn(new Error('用户不存在'))
      },
      function(err) {
        return fn(err)
      }
    )
  })
}

app.post(getPath('/login'), function(req, res) {
  authenticate(req.body.username, req.body.password, function(err, user) {
    if (err) {
      req.session.error = err.message
      res.redirect(getRedirectPath('/login'))
    } else {
      req.session.regenerate(function() {
        req.session.user = user
        req.session.success = user.name + '登录成功！'
        res.redirect(getRedirectPath('/user/' + user.id))
      })
    }
  })
})
app.get(getPath('/register'), function(req, res) {
  res.render('register', { basePath: getRedirectPath() })
})
app.post(getPath('/register'), function(req, res) {
  const registerError = function(msg) {
    req.session.error = msg
    return res.redirect(getRedirectPath('/register'))
  }
  const { username, password, checkpassword } = req.body
  if (!username) {
    return registerError('请输入用户名')
  }
  if (!password || password.length < 6) {
    return registerError('请输入6位以上密码')
  }
  if (password !== checkpassword) {
    return registerError('两次密码输入不一致')
  }
  hash({ password, salt: SALT }, function(err, pass, salt, hash) {
    if (err) {
      return registerError('用户创建失败')
    }
    const sql = 'insert into user (name, hash) values (?, ?)'
    const params = [username, hash]
    db.exec(sql, params).then(
      function(data) {
        getUserInfo(username, hash).then(
          function(data) {
            if (data && data[0]) {
              req.session.user = data[0]
              req.session.message = '注册成功！'
              return res.redirect(getRedirectPath('/user/' + data[0].id))
            }
            return registerError('用户创建失败')
          },
          function(err) {
            return registerError('用户创建失败:' + err.message)
          }
        )
      },
      function(err) {
        return registerError('用户创建失败:' + err.message)
      }
    )
  })
})

app.get(getPath('/user/:id'), function(req, res) {
  const id = req.params.id
  if (req.session.user && req.session.user.id == id) {
    res.render('user', { user: req.session.user, basePath: getRedirectPath() })
  } else {
    res.render('login', { basePath: getRedirectPath() })
  }
})

app.use(function(err, req, res, next) {
  // error page
  res.status(500).render('5xx')
})

app.use(function(req, res, next) {
  res.status(404).render('404', { url: req.originalUrl })
})

// const port = process.env.TENCENTCLOUD_SERVER_PORT || 3000
// app.listen(port, function() {
//   console.log('Express started on port ' + port)
// })

module.exports = app
