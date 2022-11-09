/* eslint-env mocha */

const assert = require('chai').assert
const NewebPay = require('../index')

suite('NewebPay', () => {
  suite('PostData', () => {
    test('should generate PostData', () => {
      const key = '12345678901234567890123456789012'
      const iv = '1234567890123456'
      const payload = 'abcdefghijklmnop'
      const data = NewebPay(key, iv).TradeInfo(payload).PostData()
      assert.equal(data, 'b91d3ece42c203729b38ae004e96efb9b64c41eeb074cad7ebafa3973181d233')
    })
  })
  suite('CheckValue', () => {
    test('should generate QueryTradeInfo type CheckValue', () => {
      const key = 'abcdefg'
      const iv = '1234567'
      const trade_info = {
        MerchantOrderNo: '840f022',
        MerchantID: '1422967',
        Amt: 100
      }
      const code = NewebPay(key, iv).TradeInfo(trade_info).CheckValue()
      assert.equal(code, '379BF1DB8948EE79D8ED77A1EBCB2F57B0FD45D0376B6DA9CF85F539CEF1C127')
    })
    test('should generate mpg_gateway type CheckValue', () => {
      const key = '1A3S21DAS3D1AS65D1'
      const iv = '1AS56D1AS24D'
      const trade_info = {
        MerchantOrderNo: '20140901001',
        MerchantID: '123456',
        Amt: 200,
        TimeStamp: 1403243286,
        Version: '1.1'
      }
      const code = NewebPay(key, iv).TradeInfo(trade_info).CheckValue('mpg_gateway')
      assert.equal(code, '841F57D750FB4B04B62DDC3ECDC26F1F4028410927DD28BD5B2E34791CC434D2')
    })
    test('should generate winning_request type CheckValue', () => {
      const key = 'abcdefghijklmnopqrstuvwxyzabcdef'
      const iv = '1234567891234567'
      const trade_info = 'ff1f87895354452f58172e460f554fa85f479ed891fcd358b1e37600fbde032bde5577c672814c42653b6c921e931857c69a2b76ce6cb5f1d78ae260e8343c89'
      const code = NewebPay(key, iv).TradeInfo(trade_info).CheckValue('winning_request')
      assert.equal(code, '16F6657EEA6FAA5650F366BDB8C91BC47E0B3664AD76B9A4C3EC55255DFD2C32')
    })
  })
  suite('CheckCode', () => {
    test('should generate CheckCode', () => {
      const key = 'abcdefg'
      const iv = '1234567'
      const trade_info = {
        MerchantOrderNo: '840f022',
        MerchantID: '1422967',
        Amt: 100,
        TradeNo: '14061313541640927'
      }
      const code = NewebPay(key, iv).TradeInfo(trade_info).CheckCode()
      assert.equal(code, '62C687AF6409E46E79769FAF54F54FE7E75AAE50BAF0767752A5C337670B8EDB')
    })
    test('should generate CheckCode - application/x-www-form-urlencoded encoding case', () => {
      const key = 'abcdefg'
      const iv = '1234567'
      const trade_info = {
        MerchantID: 'ABC1422967',
        Date: '2015-01-01 00:00:00',
        UseInfo: 'ON',
        CreditInst: 'ON',
        CreditRed: 'ON'
      }
      const code = NewebPay(key, iv).TradeInfo(trade_info).CheckCode()
      assert.equal(code, '77A1EF8F23C94CB63A60A7EDF99AC3E0F4688D96AF6D4B34370D306ABD33D0F6')
    })
    test('should generate winning_request type CheckCode', () => {
      const key = 'abcdefghijklmnopqrstuvwxyzabcdef'
      const iv = '1234567891234567'
      const trade_info = '8ca0b6c96c30c5dc8d688491f60b6fec2c1e0436c16ccef38bac03e48b5f720c43f37524cf84de0f4d68f0836ea8b8b658d60e85313ab7895e704f52e8e6cd45432016083ddaf8ffa3708387833643f388a9593a2d9ea4220c6450a7c9d7ac4f5baaf1f29b1bcb6a7f754ca17739429314e1fd0ffd3e0f57cc01b89587a3965da9eeae7b8c7add142dbb9f1c79968e4a688869f1c342a401dc46e5b4899301941cb0e2c7f97be13aac25c57d5a59b822529b576738abbbb87a44c1d84d74f0e87dd5c3537d09a941176a5d38aaa9e4286f5f25418d189fd63554f3ed8d7e12a74c419c17b0359160f180dc4e3d8bb14236a5891efdf77da65a94864a417fb4934824c2c7ffb59df9db7cd5d0d1140d8a4447793b456cc9419c44f32e070815ed'
      const code = NewebPay(key, iv).TradeInfo(trade_info).CheckCode('winning_request')
      assert.equal(code, 'C8E76E4FBB29BEA8C631702FFFC9C92DA2F07205B79F4F497F0259F2041C578F')
    })
    test('should generate invoice_number type CheckCode', () => {
      const key = 'abcdefghijklmnopqrstuvwxyzabcdef'
      const iv = '1234567891234567'
      const trade_info = {
        AphabeticLetter: 'AA',
        CompanyId: 'C54352706',
        EndNumber: '00000001',
        ManagementNo: '0o455ujp8',
        StartNumber: '00000050'
      }
      const code = NewebPay(key, iv).TradeInfo(trade_info).CheckCode('invoice_number')
      assert.equal(code, '5F9F7ABDE032F78CCDF3E4FB8A53D80A09190846D906DA84B26A105857AB2490')
    })
  })
  suite('TradeInfo.encrypt', () => {
    test('should encrypt TradeInfo to AES string', () => {
      const key = '12345678901234567890123456789012'
      const iv = '1234567890123456'
      const trade_info = {
        MerchantID: 3430112,
        RespondType: 'JSON',
        TimeStamp: 1485232229,
        Version: 1.4,
        MerchantOrderNo: 'S_1485232229', 
        Amt: 40,
        ItemDesc: 'UnitTest'
      }
      const trade_info_aes = NewebPay(key, iv).TradeInfo(trade_info).encrypt()
      assert.equal(trade_info_aes, 'ff91c8aa01379e4de621a44e5f11f72e4d25bdb1a18242db6cef9ef07d80b0165e476fd1d9acaa53170272c82d122961e1a0700a7427cfa1cf90db7f6d6593bbc93102a4d4b9b66d9974c13c31a7ab4bba1d4e0790f0cbbbd7ad64c6d3c8012a601ceaa808bff70f94a8efa5a4f984b9d41304ffd879612177c622f75f4214fa')
    })
  })
  suite('TradeInfo.decrypt', () => {
    test('should decrypt AES string to TradeInfo', () => {
      const key = '12345678901234567890123456789012'
      const iv = '1234567890123456'
      const trade_info_aes = 'ff91c8aa01379e4de621a44e5f11f72e4d25bdb1a18242db6cef9ef07d80b0165e476fd1d9acaa53170272c82d122961e1a0700a7427cfa1cf90db7f6d6593bbc93102a4d4b9b66d9974c13c31a7ab4bba1d4e0790f0cbbbd7ad64c6d3c8012a601ceaa808bff70f94a8efa5a4f984b9d41304ffd879612177c622f75f4214fa'
      const trade_info = NewebPay(key, iv).TradeInfo(trade_info_aes).decrypt()
      assert.equal(trade_info, 'MerchantID=3430112&RespondType=JSON&TimeStamp=1485232229&Version=1.4&MerchantOrderNo=S_1485232229&Amt=40&ItemDesc=UnitTest')
    })
  })
  suite('TradeSha', () => {
    test('should generate TradeSha from TradeInfo', () => {
      const key = '12345678901234567890123456789012'
      const iv = '1234567890123456'
      const aes = 'ff91c8aa01379e4de621a44e5f11f72e4d25bdb1a18242db6cef9ef07d80b0165e476fd1d9acaa53170272c82d122961e1a0700a7427cfa1cf90db7f6d6593bbc93102a4d4b9b66d9974c13c31a7ab4bba1d4e0790f0cbbbd7ad64c6d3c8012a601ceaa808bff70f94a8efa5a4f984b9d41304ffd879612177c622f75f4214fa'
      const trade_sha = NewebPay(key, iv).TradeInfo(aes).TradeSha()
      assert.equal(trade_sha, 'EA0A6CC37F40C1EA5692E7CBB8AE097653DF3E91365E6A9CD7E91312413C7BB8')
    })
  })
})
