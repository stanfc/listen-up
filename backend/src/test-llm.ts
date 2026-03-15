#!/usr/bin/env node

/**
 * 測試 Gemini LLM 連線
 */

import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'

async function testLLM() {
  console.log('🧪 測試 Gemini LLM 連線...\n')

  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ 錯誤：GEMINI_API_KEY 未設定')
    process.exit(1)
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

  try {
    console.log('📤 發送簡單測試請求...')
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Say "online" if you can read this.',
      config: {}
    })

    const text = response.text?.trim()
    console.log(`\n✅ LLM 在線！`)
    console.log(`   回應：${text}`)
    console.log(`\n✨ 一切正常`)
  } catch (err: any) {
    console.error(`\n❌ LLM 無法連線：`)
    console.error(`   ${err.message}`)
    console.error(`\n💡 檢查項目：`)
    console.error(`   1. GEMINI_API_KEY 是否正確設定？`)
    console.error(`   2. API Key 是否過期或被撤銷？`)
    console.error(`   3. 消費上限（spending cap）是否足夠？`)
    process.exit(1)
  }
}

testLLM()
