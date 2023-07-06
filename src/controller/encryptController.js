const encryption = require('../services/encryptionService');
// const encryption1 = require('../services/encryptionService1');

const encryptData = async (req, res) => {
    const { data } = req.body;
    const { standards } = req.body;
    const encryptedData = await encryption.encryptData(data,standards);
    res.send(encryptedData);
}

// const encryptDataOffset = async (req, res) => {
//     const { data } = req.body;
//     const { standards } = req.body;
//     // const encData = await encryption1.encryptDataOffset(data,standards);
//     res.send(encData);
// }

module.exports = {
    encryptData,
    // encryptDataOffset
}