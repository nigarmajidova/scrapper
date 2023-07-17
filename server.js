require('dotenv').config()
const express = require('express');
const app =express()
const path= require('path')
const { logger } = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler')
const PORT =process.env.PORT || 3500


app.use(logger)

console.log(process.env.NODE_ENV)

console.log('Im running')

app.use('/', require('./routes/scrapperRoute'))

//app.use('/', require('./routes/root'))
app.listen(PORT, ()=> console.log(`Server running on ${PORT}`))