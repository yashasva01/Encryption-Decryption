const express = require('express');
const encryptRouter = require('./src/router/encryptRouter');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Welcome to encryption service!');
});
app.use('/encrypt', encryptRouter);

app.listen(4500, () => {
    console.log('Server is up on port 4500');
});
