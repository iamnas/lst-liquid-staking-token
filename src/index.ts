require('dotenv').config();
import express from 'express';
import { burnTokens, mintTokens, sendNativeTokens } from './mintTokens';

const app = express();


app.post('/helius', async(req, res) => {

    console.log(req.body);
    
    const fromAddress = req.body.fromAddress;
    const toAddress = req.body.toAddress;
    const amount = req.body.amount;
    const type = "received_native_sol";

    if (type === "received_native_sol") {
        await mintTokens(fromAddress, toAddress, amount);
    } else {
        // What could go wrong here?
        await burnTokens(fromAddress, amount);
        await sendNativeTokens(fromAddress, amount);
    }

    res.send('Transaction successful');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});