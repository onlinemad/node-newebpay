# node-newebpay

藍新金流 NewebPay Node.js module

## Install

```js
npm i node-newebpay
```

## Test

```js
mocha test/newebpay.test.js
```

## Usage

### TradeInfo(trade_info).encrypt()

將交易資料透過商店 Key 及 IV 進行 AES 加密。

```js
const NewebPay = require('node-newebpay')

let key = '12345678901234567890123456789012'
let iv = '1234567890123456'
let trade_info = {
  MerchantID: 3430112,
  RespondType: 'JSON',
  TimeStamp: 1485232229,
  Version: 1.4,
  MerchantOrderNo: 'S_1485232229', 
  Amt: 40,
  ItemDesc: 'UnitTest'
}
let trade_info_aes = NewebPay(key, iv).TradeInfo(trade_info).encrypt()
console.log(trade_info_aes) //  ff91c8aa01379e4de621a44e5f11f72e4d25bdb1a18242db6cef9ef07d80b0165e476fd1d9acaa53170272c82d122961e1a0700a7427cfa1cf90db7f6d6593bbc93102a4d4b9b66d9974c13c31a7ab4bba1d4e0790f0cbbbd7ad64c6d3c8012a601ceaa808bff70f94a8efa5a4f984b9d41304ffd879612177c622f75f4214fa
```

### TradeInfo(trade_info).decrypt()

將交易資料透過商店 Key 及 IV 進行 AES 解密。

```js
const NewebPay = require('node-newebpay')

let key = '12345678901234567890123456789012'
let iv = '1234567890123456'
let trade_info_aes = 'ff91c8aa01379e4de621a44e5f11f72e4d25bdb1a18242db6cef9ef07d80b0165e476fd1d9acaa53170272c82d122961e1a0700a7427cfa1cf90db7f6d6593bbc93102a4d4b9b66d9974c13c31a7ab4bba1d4e0790f0cbbbd7ad64c6d3c8012a601ceaa808bff70f94a8efa5a4f984b9d41304ffd879612177c622f75f4214fa'
let trade_info = NewebPay(key, iv).TradeInfo(trade_info_aes).decrypt()

console.log(trade_info) // MerchantID=3430112&RespondType=JSON&TimeStamp=1485232229&Version=1.4&MerchantOrderNo=S_1485232229&Amt=40&ItemDesc=UnitTest
```

### TradeInfo(trade_info).TradeSha()

將已 AES 加密的交易資料， 透過商店 Key 及 IV 進行 SHA256 編碼產生檢查碼。

```js
const NewebPay = require('node-newebpay')

let key = '12345678901234567890123456789012'
let iv = '1234567890123456'
let aes = 'ff91c8aa01379e4de621a44e5f11f72e4d25bdb1a18242db6cef9ef07d80b0165e476fd1d9acaa53170272c82d122961e1a0700a7427cfa1cf90db7f6d6593bbc93102a4d4b9b66d9974c13c31a7ab4bba1d4e0790f0cbbbd7ad64c6d3c8012a601ceaa808bff70f94a8efa5a4f984b9d41304ffd879612177c622f75f4214fa'
let trade_sha = NewebPay(key, iv).TradeInfo(aes).TradeSha()
console.log(trade_sha) // EA0A6CC37F40C1EA5692E7CBB8AE097653DF3E91365E6A9CD7E91312413C7BB8
```

### TradeInfo(trade_info).CheckValue(type?)

將交易資料透過 SHA256 編碼產生檢查碼。

這個 function 可接受一個 type 參數來改變交易參數的排列，預設產生的 CheckValue 根據交易狀態查詢 API (https://core.newebpay.com/API/QueryTradeInfo) 所設計的，但是藍新金流付款的 API (https://core.spgateway.com/MPG/mpg_gateway) 在版本 1.2 之前是使用 CheckValue 來作為檢查碼，所以增加 type 來作為 backward compatibility ，目前藍新金流付款 API 版本 1.6 則不再使用 CheckValue 作為檢查碼的用途。

#### 1.3 增加 winning_request type

因為查詢中獎發票 API（https://inv.ezpay.com.tw/Api_winning/request）所使用的 CheckValue 又有不同的排列方式，所以增加 type 來支援這個 API。

```js
const NewebPay = require('node-newebpay')

let key = 'abcdefg'
let iv = '1234567'
let trade_info = {
  MerchantOrderNo: '840f022',
  MerchantID: '1422967',
  Amt: 100
}
let code = NewebPay(key, iv).TradeInfo(trade_info).CheckValue('QueryTradeInfo')

console.log(code) // 379BF1DB8948EE79D8ED77A1EBCB2F57B0FD45D0376B6DA9CF85F539CEF1C127
```

### TradeInfo(payload).PostData()

將交易資料透過商店 Key 及 IV 進行 AES 加密。

其實同 `TradeInfo(trade_info).encrypt()` 只是幕後授權 API 用 `PostData` 作為欄位的名稱。

```js
const NewebPay = require('node-newebpay')

let key = '12345678901234567890123456789012'
let iv = '1234567890123456'
let payload = 'abcdefghijklmnop'
let data = NewebPay(key, iv).TradeInfo(payload).PostData()

console.log(data) // b91d3ece42c203729b38ae004e96efb9b64c41eeb074cad7ebafa3973181d233
```

### TradeInfo(payload).CheckCode(type?)

將交易資料透過 SHA256 編碼產生檢查碼。

其實同 `TradeInfo(trade_info).CheckValue()` 只是幕後授權 API 用 `CheckCode` 作為欄位的名稱，同時欄位排列不同。

#### 1.3.3 增加 invoice_number type

因為電子發票字軌管理 API（https://inv.ezpay.com.tw/Api_number_management/searchNumber）所使用的 CheckCode 又有不同的排列方式，所以增加 type 來支援這個 API。

#### 1.3.1 增加 winning_request type

因為查詢中獎發票 API（https://inv.ezpay.com.tw/Api_winning/request）所使用的 CheckCode 又有不同的排列方式，所以增加 type 來支援這個 API。

```js
const NewebPay = require('node-newebpay')

let key = 'abcdefg'
let iv = '1234567'
let trade_info = {
  MerchantOrderNo: '840f022',
  MerchantID: '1422967',
  Amt: 100,
  TradeNo: '14061313541640927'
}
let code = NewebPay(key, iv).TradeInfo(trade_info).CheckCode()
console.log(code) // 62C687AF6409E46E79769FAF54F54FE7E75AAE50BAF0767752A5C337670B8EDB
```