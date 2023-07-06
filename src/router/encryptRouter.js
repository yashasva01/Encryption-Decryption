const express = require('express');
const router = express.Router();
const encryptController = require('../controller/encryptController');


// router.get('/encryptData', (req, res) => {
//     res.send('Encrypt data');
// });

router.post('/encryptData', encryptController.encryptData)
// router.post('/encryptDataOffset', encryptController.encryptDataOffset)


module.exports = router;