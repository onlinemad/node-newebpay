
const Aes = require('aes-js')
const crypto = require('crypto')

const padding = (str) => {
  const len = str.length
  const pad = 32 - (len % 32)
  str += String.fromCharCode(pad).repeat(pad)
  return str
}

const strip_padding = (str) => {
  const pad_check = new RegExp(str.slice(-1) + '{' + str.slice(-1).charCodeAt() + '}')
  if (str.match(pad_check)) {
    return str.replace(pad_check, '')
  } else {
    return str
  }
}

const aes_encrypt = (key, iv, data) => {
  const cbc = new Aes.ModeOfOperation.cbc(Buffer.from(key), Buffer.from(iv))
  return Aes.utils.hex.fromBytes(cbc.encrypt(Aes.utils.utf8.toBytes(padding(data))))
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
 * 將交易資料透過商店 Key 及 IV 進行 AES 加密。
 * 
 * Ref. 藍新金流NewebPay_信用卡幕後授權技術串接手冊_標準版_CREDITBG_1.0.4 (page 38)
 * 
 * @returns {string} AES string
 */
_newebpay.prototype.PostData = function () {
  return aes_encrypt(this.key, this.iv, typeof this._trade_info === 'string' ? this._trade_info : (new URLSearchParams(this._trade_info)).toString())
}

/**
 * 交易資料 AES 加密
 * 
 * 將交易資料透過商店 Key 及 IV 進行 AES 加密。
 * 
 * Ref. 藍新金流Newebpay_MPG串接手冊_MPG_1.1.0 (page 31)
 * 
 * @returns {string} AES string
 */
_newebpay.prototype.encrypt = function () {
  return aes_encrypt(this.key, this.iv, typeof this._trade_info === 'string' ? this._trade_info : (new URLSearchParams(this._trade_info)).toString())
}

/**
 * 交易資料 AES 解密
 * 
 * 將交易資料透過商店 Key 及 IV 進行 AES 解密。
 * 
 * Ref. 藍新金流Newebpay_MPG串接手冊_MPG_1.1.0 (page 47)
 * 
 * @returns {object} TradeInfo object
 */
_newebpay.prototype.decrypt = function () {
  const cbc = new Aes.ModeOfOperation.cbc(Buffer.from(this.key), Buffer.from(this.iv))
  const decryptedBytes = cbc.decrypt(Aes.utils.hex.toBytes(this._trade_info))
  return strip_padding(Aes.utils.utf8.fromBytes(decryptedBytes))
}

/**
 * 交易資料 SHA256 加密
 * 
 * 將已 AES 加密的交易資料， 透過商店 Key 及 IV 進行 SHA256 編碼產生檢查碼。
 * 
 * Ref. 藍新金流Newebpay_MPG串接手冊_MPG_1.1.0 (page 31)
 *
 * @returns {string} TradeSha SHA256 string
 */
_newebpay.prototype.TradeSha = function () {
  return crypto.createHash('sha256').update(`HashKey=${this.key}&${this._trade_info}&HashIV=${this.iv}`).digest('hex').toUpperCase()
}

/**
 * 產生 CheckCode
 * 
 * 將交易資料透過 SHA256 編碼產生檢查碼。
 * 
 * 可接受一個 type 參數來改變交易參數的排列
 * 
 * **null**
 * 
 * API: https://core.newebpay.com/API/CreditCard
 * Ref. 藍新金流NewebPay_信用卡幕後授權技術串接手冊_標準版_CREDITBG_1.0.4 (page 39)
 * 
 * **winning_request**
 * 
 * API: https://inv.ezpay.com.tw/Api_winning/request
 * Ref: ezPay電子發票_中獎發票查詢串接手冊_EZP_Winning_1.0.0 (page 31)
 * 
 * **invoice_number**
 * 
 * API: https://inv.ezpay.com.tw/Api_number_management/searchNumber
 * Ref: ezPay_電子發票_字軌管理_1.0.0.pdf (page 36)
 * 
 * @param {('winning_request'|null)} type
 * @returns {string} SHA256 string
 */
_newebpay.prototype.CheckCode = function (type) {
  let str = null
  if  (type === 'winning_request') {
    str = `HashIV=${this.iv}&${this._trade_info}&HashKey=${this.key}`.replace(/%20/g, '+')
  } else {
    let hash_iv = { HashIV: this.iv }
    if (type === 'invoice_number') {
      hash_iv = { HashIv: this.iv }
    }
    str = (new URLSearchParams(Object.assign(hash_iv, Object.keys(this._trade_info).sort().reduce((r, k) => (r[k] = this._trade_info[k], r), {}), { HashKey: this.key }))).toString().replace(/%20/g, '+')
  }
  return crypto.createHash('sha256').update(str).digest('hex').toUpperCase()
}

/**
 * 產生 CheckValue
 * 
 * 將交易資料透過 SHA256 編碼產生檢查碼。
 *
 * 這個 function 可接受一個 type 參數來改變交易參數的排列，預設產生的 CheckValue 根據交易狀態查詢 API (https://core.newebpay.com/API/QueryTradeInfo) 所設計的，但是藍新金流付款的 API (https://core.spgateway.com/MPG/mpg_gateway) 在版本 1.2 之前是使用 CheckValue 來作為檢查碼，所以增加 type 來作為 backward compatibility ，目前藍新金流付款 API 版本 1.6 則不再使用 CheckValue 作為檢查碼的用途 * 
 *
 * **null**
 * 
 * API: https://core.newebpay.com/API/QueryTradeInfo
 * Ref: 藍新金流NewebPay_單筆交易狀態查詢串接手冊 V1.0.5 (page 12)
 * 
 * **mpg_gateway**
 * 
 * API: https://core.spgateway.com/MPG/mpg_gateway
 * Ref: 藍新金流Newebpay_信用卡幕後授權技術串接手冊_標準版_CREDITBG_1.0.0 (page 37)
 * 
 * **winning_request**
 * 
 * API: https://inv.ezpay.com.tw/Api_winning/request
 * Ref: ezPay電子發票_中獎發票查詢串接手冊_EZP_Winning_1.0.0
 * 
 * @param {('mpg_gateway'|'winning_request'|null)} type
 * @returns {string} SHA256 string
 */
_newebpay.prototype.CheckValue = function (type) {
  let str = null
  if (type === 'winning_request') {
    str = `HashKey=${this.key}&${this._trade_info}&HashIV=${this.iv}`.replace(/%20/g, '+')
  } else {
    let prefix = { IV: this.iv }
    let suffix = { Key: this.key }
    if (type === 'mpg_gateway') {
      prefix = { HashKey: this.key }
      suffix = { HashIV: this.iv }
    }
    str = (new URLSearchParams(Object.assign(prefix, Object.keys(this._trade_info).sort().reduce((r, k) => (r[k] = this._trade_info[k], r), {}), suffix))).toString().replace(/%20/g, '+')
  }
  return crypto.createHash('sha256').update(str).digest('hex').toUpperCase()
}

module.exports = newebpay