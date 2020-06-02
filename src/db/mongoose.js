const mongoose = require('mongoose')

mongoose
    .connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    })
    .then((result) => {
        // console.log(result)
    })
    .catch((error) => {
        console.log(error)
    })
