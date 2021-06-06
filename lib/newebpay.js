
const Aes = require('aes-js')
const crypto = require('crypto')
const qs = require('querystring')

const padding = (str) => {
  let len = str.length
  let pad = 32 - (len % 32)
  str += String.fromCharCode(pad).repeat(pad)
  return str
}

const strip_padding = (str) => {
  return new Promise((resolve) => {
    let pad_check = new RegExp(str.slice(-1) + '{' + str.slice(-1).charCodeAt() + '}')
    if (str.match(pad_check)) {
      return resolve(str.replace(pad_check, ''))
    } else {
      return resolve(str)
    }
  })
}

const aes_encrypt = (key, iv, data) => {
  return new Promise((resolve) => {
    let cbc = new Aes.ModeOfOperation.cbc(Buffer.from(key), Buffer.from(iv))
    return resolve(Aes.utils.hex.fromBytes(cbc.encrypt(Aes.utils.utf8.toBytes(padding(data)))))
  })
}

const _newebpay = function (key, iv) {
  this.key = key
  this.iv = iv
  this._trade_info = null
}

/**
 * NewebPay 建構子
 * 
 * @param {string} key 
 * @param {string} iv 
 * @returns NewebPay instance
 */
const newebpay = function (key, iv) {
  return new _newebpay(key, iv)
}

/**
 * 設定交易資料
 * 
 * @param {object|string} data Trade object or trade AES string
 * @returns {this}
 */
 _newebpay.prototype.TradeInfo = function (data) {
  this._trade_info = data
  return this
}

/**
 * 加密 PostData
 * 
 * Ref. 藍新金流NewebPay_信用卡幕後授權技術串接手冊_標準版_CREDITBG_1.0.4 (page 38)
 * 
 * @returns {string} AES string
 */
_newebpay.prototype.PostData = function () {
  return aes_encrypt(this.key, this.iv, typeof this._trade_info === 'string' ? this._trade_info : qs.stringify(this._trade_info))
}

/**
 * 交易資料 AES 加密
 * 
 * 將交易資料參數透過商店 Key 及 IV 進行 AES 加密
 * 
 * Ref. 藍新金流Newebpay_MPG串接手冊_MPG_1.1.0 (page 31)
 * 
 * @returns {string} AES string
 */
_newebpay.prototype.encrypt = function () {
  return aes_encrypt(this.key, this.iv, typeof this._trade_info === 'string' ? this._trade_info : qs.stringify(this._trade_info))
}

/**
 * 交易資料 AES 解密
 * 
 * 將交易資料 string 透過 商店 Key 及 IV 進行 AES 解密
 * 
 * Ref. 藍新金流Newebpay_MPG串接手冊_MPG_1.1.0 (page 47)
 * 
 * @returns {object} TradeInfo object
 */
_newebpay.prototype.decrypt = function () {
  let cbc = new Aes.ModeOfOperation.cbc(Buffer.from(this.key), Buffer.from(this.iv))
  let decryptedBytes = cbc.decrypt(Aes.utils.hex.toBytes(this._trade_info))
  return Promise.resolve(strip_padding(Aes.utils.utf8.fromBytes(decryptedBytes)))
}

/**
 * 交易資料 SHA256 加密
 * 
 * 將交易資料經過上述 AES 加密過的字串， 透過商店 Key 及 IV 進行 SHA256 加密。
 * 
 * Ref. 藍新金流Newebpay_MPG串接手冊_MPG_1.1.0 (page 31)
 *
 * @returns {string} TradeSha SHA256 string
 */
_newebpay.prototype.TradeSha = function () {
  return Promise.resolve(crypto.createHash('sha256').update(`HashKey=${this.key}&${this._trade_info}&HashIV=${this.iv}`).digest('hex').toUpperCase())
}

/**
 * 產生 CheckCode
 * 
 * Ref. 藍新金流NewebPay_信用卡幕後授權技術串接手冊_標準版_CREDITBG_1.0.4 (page 40)
 * 
 * @returns {string} SHA256 string
 */
_newebpay.prototype.CheckCode = function () {
  return crypto.createHash('sha256').update(qs.stringify(Object.assign({ HashIV: this.iv }, Object.keys(this._trade_info).sort().reduce((r, k) => (r[k] = this._trade_info[k], r), {}), { HashKey: this.key })).replace(/%20/g, '+')).digest('hex').toUpperCase()
}

/**
 * 產生 CheckValue
 * 
 * 這裡有兩個 API 會使用到 CheckValue ，但是這兩個 API 產生 CheckValue 參數的排列順序不同，所以透 type 參數識別
 * 
 * API mpg_gateway https://core.spgateway.com/MPG/mpg_gateway
 * Ref. 藍新金流Newebpay_信用卡幕後授權技術串接手冊_標準版_CREDITBG_1.0.0 (page 37)
 * 
 * API QueryTradeInfo https://core.newebpay.com/API/QueryTradeInfo
 * Ref. 藍新金流NewebPay_單筆交易狀態查詢串接手冊 V1.0.5 (page 12)
 * 
 * @param {('mpg_gateway'|'QueryTradeInfo')} type 
 * @returns {string} SHA256 string
 */
_newebpay.prototype.CheckValue = function (type) {
  let str = null
  if (type === 'mpg_gateway') {
    str = qs.stringify(Object.assign({ HashKey: this.key }, Object.keys(this._trade_info).sort().reduce((r, k) => (r[k] = this._trade_info[k], r), {}), { HashIV: this.iv })).replace(/%20/g, '+')
  } else if (type == 'QueryTradeInfo') {
    str = qs.stringify(Object.assign({ IV: this.iv }, Object.keys(this._trade_info).sort().reduce((r, k) => (r[k] = this._trade_info[k], r), {}), { Key: this.key })).replace(/%20/g, '+')
  }
  return crypto.createHash('sha256').update(str).digest('hex').toUpperCase()
}

module.exports = newebpay