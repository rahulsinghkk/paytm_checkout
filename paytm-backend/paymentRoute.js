
require('dotenv').config()

const formidable=require('formidable')
const express=require('express')
const router=express.Router()
const {v4:uuidv4}=require('uuid')
const https=require('https')
const firebase=require('firebase')
const PaytmChecksum=require('./PaytmChecksum')
const db = require('./firebase')




router.post('/callback',(req,res)=>
{

const form=new formidable.IncomingForm();

form.parse(req,(err,fields,file)=>
{
    








paytmChecksum = fields.CHECKSUMHASH;
delete fields.CHECKSUMHASH;

var isVerifySignature = PaytmChecksum.verifySignature(fields, process.env.PAYTM_MERCHANT_KEY, paytmChecksum);
if (isVerifySignature) {








    var paytmParams = {};
    paytmParams["MID"]     = fields.MID;
    paytmParams["ORDERID"] = fields.ORDERID;
    
    /*
    * Generate checksum by parameters we have
    * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
    */
    PaytmChecksum.generateSignature(paytmParams, process.env.PAYTM_MERCHANT_KEY).then(function(checksum){
    
        paytmParams["CHECKSUMHASH"] = checksum;
    
        var post_data = JSON.stringify(paytmParams);
    
        var options = {
    
            /* for Staging */
            hostname: 'securegw-stage.paytm.in',
    
            /* for Production */
            // hostname: 'securegw.paytm.in',
    
            port: 443,
            path: '/order/status',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': post_data.length
            }
        };
    
        var response = "";
        var post_req = https.request(options, function(post_res) {
            post_res.on('data', function (chunk) {
                response += chunk;
            });
    
            post_res.on('end', function(){
                         let result=JSON.parse(response)
                        if(result.STATUS==='TXN_SUCCESS')
                        {
                            //store in db
                            db.collection('payments').doc('mPDd5z0pNiInbSIIotfj').update({paymentHistory:firebase.firestore.FieldValue.arrayUnion(result)})
                            .then(()=>console.log("Update success"))
                            .catch(()=>console.log("Unable to update"))
                        }

                        res.redirect(`http://localhost:3000/status/${result.ORDERID}`)


            });
        });
    
        post_req.write(post_data);
        post_req.end();
    });        
            









} else {
	console.log("Checksum Mismatched");
}






})

})

router.get('/payment',(req,res)=>
{
    /* import checksum generation utility */
    var paytmParams = {};

    paytmParams.body = {
        "requestType"   : "Payment",
        "mid"           : "Muctvj23768431537109",
        "websiteName"   : "WEBSTAGING",
        "orderId"       : uuidv4(),
        "callbackUrl"   : "https://merchant.com/callback",
        "txnAmount"     : {
            "value"     : "1.00",
            "currency"  : "INR",
        },
        "userInfo"      : {
            "custId"    : "CUST_001",
        },
    };

/**
* Generate checksum by parameters we have
* Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
*/
var paytmChecksum = PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), process.env.PAYTM_MERCHANT_KEY);
paytmChecksum.then(function(checksum){
    paytmParams.head = {
                "signature"    : checksum
            };
           console.log("hello")
            var post_data = JSON.stringify(paytmParams);
        console.log(post_data)
    res.json(post_data)
}).catch(function(error){
	console.log(error);
});

})

router.get('/GCheck',(req,res)=>
{

/**
* Generate checksum by parameters we have
* Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
*/

// var params = {};

// /* initialize an array */
// params['MID'] = process.env.PAYTM_MID,
// params['WEBSITE'] = process.env.PAYTM_WEBSITE,
// params['CHANNEL_ID'] = process.env.PAYTM_CHANNEL_ID,
// params['INDUSTRY_TYPE_ID'] = process.env.PAYTM_INDUSTRY_TYPE_ID,
// params['ORDER_ID'] = uuidv4(),
// params['CUST_ID'] = process.env.PAYTM_CUST_ID,
// params['TXN_AMOUNT'] = 1,
// params['CALLBACK_URL'] = 'http://localhost:5000/api/callback',
// params['EMAIL'] = "rahul@gmail.com",
// params['MOBILE_NO'] = '9738069910'

var paytmParams = {};

paytmParams.body = {
    "requestType"   : "Payment",
    "mid"           : "Muctvj23768431537109",
    "websiteName"   : "WEBSTAGING",
    "orderId"       : "1234",
    "callbackUrl"   : "https://merchant.com/callback",
    "txnAmount"     : {
        "value"     : "1.00",
        "currency"  : "INR",
    },
    "userInfo"      : {
        "custId"    : "CUST_001",
    },
};

var paytmChecksum = PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), process.env.PAYTM_MERCHANT_KEY);

paytmChecksum.then(function(checksum){

        paytmParams.head = {
                "signature"    : checksum
            };
           console.log("hello")
            var post_data = JSON.stringify(paytmParams);
        console.log(post_data)
    res.json(post_data)
}).catch(function(error){
	console.log(error);
});

})

module.exports=router