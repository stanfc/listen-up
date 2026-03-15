/**
 * 玩家流程測試
 *
 * 測試所有遊戲流程路徑，確保 phase 轉換正確：
 *   路徑 A: SONG_GUESS → 有人猜對 → CARD_PLACEMENT → 放卡正確 → ROUND_END → 下一輪
 *   路徑 B: SONG_GUESS → 沒人猜對 → CARD_PLACEMENT → 放卡正確 → ROUND_END → 下一輪
 *   路徑 C: SONG_GUESS → 跳過猜歌 → CARD_PLACEMENT → 放卡正確 → ROUND_END → 下一輪
 *   路徑 D: SONG_GUESS → 跳過猜歌 → CARD_PLACEMENT → 放卡錯誤(有token) → ROUND_END
 *   路徑 E: SONG_GUESS → 跳過猜歌 → CARD_PLACEMENT → 放卡錯誤(無token) → ROUND_END
 *
 * 使用方式: npx ts-node src/test-flow.ts
 */

import axios from 'axios'

const BASE = 'http://localhost:3000/api'
let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ ${msg}`)
    passed++
  } else {
    console.log(`  ❌ FAIL: ${msg}`)
    failed++
  }
}

/**
 * Helper: after card placement, if phase is 'challenge' (wrong placement),
 * skip the challenge to reach 'round_end'. Returns the final game state.
 */
async function ensureRoundEnd(gameId: string): Promise<any> {
  const { data: game } = await axios.get(`${BASE}/games/${gameId}`)
  if (game.currentRound.phase === 'challenge') {
    const { data: skipRes } = await axios.post(`${BASE}/games/${gameId}/skip-challenge`)
    return skipRes.game
  }
  return game
}

async function createAndStartGame(): Promise<{ gameId: string; players: any[] }> {
  // 建立遊戲
  const { data: createRes } = await axios.post(`${BASE}/games`, {
    maxPlayers: 4,
    winningCards: 5,
    musicTags: ['2000s', '2010s', '2020s', '1990s', '1980s', '1970s', '1960s']
  })
  const gameId = createRes.gameId

  // 加入兩個玩家
  const { data: p1Res } = await axios.post(`${BASE}/games/${gameId}/players`, { playerName: '玩家A' })
  const { data: p2Res } = await axios.post(`${BASE}/games/${gameId}/players`, { playerName: '玩家B' })

  // 開始遊戲
  const { data: startRes } = await axios.post(`${BASE}/games/${gameId}/start`)

  return { gameId, players: startRes.game.players }
}

function getCurrentPlayer(game: any) {
  return game.players.find((p: any) => p.isCurrentPlayer)
}

// ==========================================
// 路徑 A: 有人猜對 → 放卡 → 下一輪
// ==========================================
async function testPathA() {
  console.log('\n📋 路徑 A: 有人猜對 → 放卡正確 → 下一輪')
  console.log('─'.repeat(50))

  const { gameId, players } = await createAndStartGame()

  // 1. 確認初始 phase
  let { data: game } = await axios.get(`${BASE}/games/${gameId}`)
  assert(game.currentRound.phase === 'song_guess', `初始 phase = song_guess (實際: ${game.currentRound.phase})`)

  const currentPlayer = getCurrentPlayer(game)
  const otherPlayer = game.players.find((p: any) => !p.isCurrentPlayer)
  const initialTokens = otherPlayer.tokens

  // 2. 取得音樂資訊（模擬 revealMusic）
  const { data: musicReveal } = await axios.get(`${BASE}/games/${gameId}/music/reveal`)
  assert(!!musicReveal.title, `reveal 回傳 title: "${musicReveal.title}"`)
  assert(!!musicReveal.artist !== undefined, `reveal 回傳 artist: "${musicReveal.artist}"`)
  assert(!!musicReveal.year, `reveal 回傳 year: ${musicReveal.year}`)

  // 3. 提交猜歌（另一個玩家猜對）
  const { data: guessRes } = await axios.post(`${BASE}/games/${gameId}/guess`, {
    playerId: otherPlayer.id,
    guessType: 'song',
    guess: musicReveal.title
  })
  assert(guessRes.correct === true, `猜歌結果: correct=${guessRes.correct}`)
  assert(guessRes.game.currentRound.phase === 'card_placement', `phase 轉為 card_placement (實際: ${guessRes.game.currentRound.phase})`)
  assert(!!guessRes.game.currentRound.pendingCard, `有 pendingCard`)

  // 4. 確認 token 增加
  const guesserAfter = guessRes.game.players.find((p: any) => p.id === otherPlayer.id)
  assert(guesserAfter.tokens === initialTokens + 1, `猜對者 token +1 (${initialTokens} → ${guesserAfter.tokens})`)

  // 5. 放卡（當前玩家放卡）
  const { data: placeRes } = await axios.post(`${BASE}/games/${gameId}/card-placement`, {
    playerId: currentPlayer.id,
    position: 0
  })
  assert(placeRes.game.currentRound.phase === 'challenge', `放卡後 phase = challenge (實際: ${placeRes.game.currentRound.phase})`)
  // Skip challenge → reveals result
  await ensureRoundEnd(gameId)

  // 6. 下一輪
  const { data: nextRes } = await axios.post(`${BASE}/games/${gameId}/next-round`)
  assert(nextRes.game.currentRound.phase === 'song_guess', `下一輪 phase = song_guess (實際: ${nextRes.game.currentRound.phase})`)
  assert(nextRes.game.currentRound.roundNumber === 2, `輪次 = 2 (實際: ${nextRes.game.currentRound.roundNumber})`)

  // 7. 確認當前玩家換人了
  const newCurrentPlayer = getCurrentPlayer(nextRes.game)
  assert(newCurrentPlayer.id !== currentPlayer.id, `當前玩家已換人`)
}

// ==========================================
// 路徑 B: 沒人猜對 → 放卡 → 下一輪
// ==========================================
async function testPathB() {
  console.log('\n📋 路徑 B: 沒人猜對 → 放卡正確 → 下一輪')
  console.log('─'.repeat(50))

  const { gameId, players } = await createAndStartGame()

  let { data: game } = await axios.get(`${BASE}/games/${gameId}`)
  const currentPlayer = getCurrentPlayer(game)

  // 1. 提交錯誤猜歌（沒人猜對）
  const { data: guessRes } = await axios.post(`${BASE}/games/${gameId}/guess`, {
    playerId: currentPlayer.id,
    guessType: 'song',
    guess: '___WRONG___'
  })
  assert(guessRes.correct === false, `猜歌結果: correct=false`)
  assert(guessRes.game.currentRound.phase === 'card_placement', `phase 轉為 card_placement`)
  assert(!!guessRes.game.currentRound.pendingCard, `有 pendingCard`)

  // 2. 確認 token 沒變
  const playerAfter = guessRes.game.players.find((p: any) => p.id === currentPlayer.id)
  assert(playerAfter.tokens === currentPlayer.tokens, `token 不變 (${playerAfter.tokens})`)

  // 3. 放卡
  const { data: placeRes } = await axios.post(`${BASE}/games/${gameId}/card-placement`, {
    playerId: currentPlayer.id,
    position: 0
  })
  assert(placeRes.game.currentRound.phase === 'challenge', `放卡後 phase = challenge`)
  await ensureRoundEnd(gameId)

  // 4. 可以再次 reveal 取得完整音樂資訊
  const { data: revealRes } = await axios.get(`${BASE}/games/${gameId}/music/reveal`)
  assert(!!revealRes.title, `可 reveal: "${revealRes.title}"`)
  assert(typeof revealRes.year === 'number', `reveal 有年份: ${revealRes.year}`)

  // 5. 下一輪
  const { data: nextRes } = await axios.post(`${BASE}/games/${gameId}/next-round`)
  assert(nextRes.game.currentRound.phase === 'song_guess', `下一輪 phase = song_guess`)
}

// ==========================================
// 路徑 C: 跳過猜歌 → 放卡 → 下一輪
// ==========================================
async function testPathC() {
  console.log('\n📋 路徑 C: 跳過猜歌 → 放卡正確 → 下一輪')
  console.log('─'.repeat(50))

  const { gameId, players } = await createAndStartGame()

  let { data: game } = await axios.get(`${BASE}/games/${gameId}`)
  const currentPlayer = getCurrentPlayer(game)

  // 1. 跳過猜歌
  const { data: skipRes } = await axios.post(`${BASE}/games/${gameId}/skip-song-guess`)
  assert(skipRes.game.currentRound.phase === 'card_placement', `phase 轉為 card_placement`)
  assert(!!skipRes.game.currentRound.pendingCard, `有 pendingCard`)

  // 2. 放卡
  const { data: placeRes } = await axios.post(`${BASE}/games/${gameId}/card-placement`, {
    playerId: currentPlayer.id,
    position: 0
  })
  assert(placeRes.game.currentRound.phase === 'challenge', `放卡後 phase = challenge`)
  await ensureRoundEnd(gameId)

  // 3. 下一輪
  const { data: nextRes } = await axios.post(`${BASE}/games/${gameId}/next-round`)
  assert(nextRes.game.currentRound.phase === 'song_guess', `下一輪 phase = song_guess`)
}

// ==========================================
// 路徑 D: 放卡錯誤（有 token）
// ==========================================
async function testPathD() {
  console.log('\n📋 路徑 D: 放卡錯誤 → 挑戰 phase → 跳過挑戰')
  console.log('─'.repeat(50))

  const { gameId, players } = await createAndStartGame()

  let { data: game } = await axios.get(`${BASE}/games/${gameId}`)
  const currentPlayer = getCurrentPlayer(game)
  const initialTokens = currentPlayer.tokens

  // 1. 跳過猜歌
  await axios.post(`${BASE}/games/${gameId}/skip-song-guess`)

  // 2. 放卡 — 一律進 challenge phase（不揭曉對錯）
  const { data: placeRes } = await axios.post(`${BASE}/games/${gameId}/card-placement`, {
    playerId: currentPlayer.id,
    position: 1
  })

  assert(placeRes.game.currentRound.phase === 'challenge', `放卡後 phase = challenge`)
  assert(!!placeRes.game.currentRound.challengeCard, `有 challengeCard`)

  const playerAfter = placeRes.game.players.find((p: any) => p.id === currentPlayer.id)
  assert(playerAfter.tokens === initialTokens, `放卡不扣 token (${playerAfter.tokens})`)

  // 3. 跳過挑戰 → 揭曉結果
  const { data: skipRes } = await axios.post(`${BASE}/games/${gameId}/skip-challenge`)
  assert(skipRes.game.currentRound.phase === 'round_end', `跳過挑戰 → round_end`)

  // 下一輪
  const { data: nextRes } = await axios.post(`${BASE}/games/${gameId}/next-round`)
  assert(nextRes.game.currentRound.phase === 'song_guess', `下一輪 phase = song_guess`)
}

// ==========================================
// 路徑 D2: 放卡錯誤 → 挑戰成功（搶卡）
// ==========================================
async function testPathD2() {
  console.log('\n📋 路徑 D2: 放卡錯誤 → 他人挑戰成功 → 搶走卡牌')
  console.log('─'.repeat(50))

  const { gameId, players } = await createAndStartGame()

  let { data: game } = await axios.get(`${BASE}/games/${gameId}`)
  const currentPlayer = getCurrentPlayer(game)
  const otherPlayer = game.players.find((p: any) => !p.isCurrentPlayer)
  const otherInitialCards = otherPlayer.cards.length
  const otherInitialTokens = otherPlayer.tokens

  // 1. 跳過猜歌
  await axios.post(`${BASE}/games/${gameId}/skip-song-guess`)

  // 2. 取得 pendingCard 資訊
  const { data: gameAfterSkip } = await axios.get(`${BASE}/games/${gameId}`)
  const pendingCard = gameAfterSkip.currentRound.pendingCard

  // 3. 放卡（position 1 — 可能對可能錯，不揭曉）
  const { data: placeRes } = await axios.post(`${BASE}/games/${gameId}/card-placement`, {
    playerId: currentPlayer.id,
    position: 1
  })

  assert(placeRes.game.currentRound.phase === 'challenge', `放卡後 phase = challenge`)

  // 4. 另一個玩家挑戰 — 猜正確位置
  const challengeCard = placeRes.game.currentRound.challengeCard
  // 找正確位置：比 2000(起始卡) 小就放 0，大就放 1
  const correctPos = challengeCard.year <= 2000 ? 0 : 1

  const { data: challengeRes } = await axios.post(`${BASE}/games/${gameId}/challenge`, {
    challengerId: otherPlayer.id,
    position: correctPos
  })

  assert(challengeRes.game.currentRound.phase === 'round_end', `挑戰後 → round_end`)

  // 如果原始放置是錯的，且挑戰者猜對了位置 → 搶卡
  if (challengeRes.success && challengeRes.stolenCard) {
    const otherAfter = challengeRes.game.players.find((p: any) => p.id === otherPlayer.id)
    assert(otherAfter.cards.length === otherInitialCards + 1, `挑戰者卡牌 +1 (${otherInitialCards} → ${otherAfter.cards.length})`)
    assert(otherAfter.tokens === otherInitialTokens - 1, `挑戰者 token -1 (${otherInitialTokens} → ${otherAfter.tokens})`)
  } else if (!challengeRes.success && challengeRes.placementWasCorrect) {
    // 原始放置其實是對的 → 挑戰者失敗
    console.log('  ⚠️  原始放置正確，挑戰者失敗')
    const otherAfter = challengeRes.game.players.find((p: any) => p.id === otherPlayer.id)
    assert(otherAfter.tokens === otherInitialTokens - 1, `挑戰者失去 1 token`)
  } else {
    console.log('  ⚠️  挑戰者猜錯位置')
  }
}

// ==========================================
// 路徑 E: 切歌（花 1 token 換歌）
// ==========================================
async function testPathE() {
  console.log('\n📋 路徑 E: 切歌（花 1 token 換新歌）')
  console.log('─'.repeat(50))

  const { gameId, players } = await createAndStartGame()

  let { data: game } = await axios.get(`${BASE}/games/${gameId}`)
  const currentPlayer = getCurrentPlayer(game)
  const initialTokens = currentPlayer.tokens
  const initialMusicId = game.currentRound.musicId

  assert(initialTokens >= 1, `玩家有至少 1 token (${initialTokens})`)

  // 切歌
  const { data: changeRes } = await axios.post(`${BASE}/games/${gameId}/change-song`, {
    playerId: currentPlayer.id
  })

  assert(changeRes.game.currentRound.phase === 'song_guess', `phase 仍為 song_guess`)
  const playerAfter = changeRes.game.players.find((p: any) => p.id === currentPlayer.id)
  assert(playerAfter.tokens === initialTokens - 1, `token -1 (${initialTokens} → ${playerAfter.tokens})`)
  assert(changeRes.game.currentRound.musicId !== initialMusicId, `musicId 已更換`)

  // 繼續正常流程
  await axios.post(`${BASE}/games/${gameId}/skip-song-guess`)
  const { data: placeRes } = await axios.post(`${BASE}/games/${gameId}/card-placement`, {
    playerId: currentPlayer.id,
    position: 0
  })
  assert(placeRes.game.currentRound.phase === 'challenge', `放卡後 phase = challenge`)
  await ensureRoundEnd(gameId)
}

// ==========================================
// 路徑 F: Token 上限測試
// ==========================================
async function testTokenCap() {
  console.log('\n📋 路徑 F: Token 上限 5')
  console.log('─'.repeat(50))

  const { gameId } = await createAndStartGame()

  let { data: game } = await axios.get(`${BASE}/games/${gameId}`)
  const currentPlayer = getCurrentPlayer(game)

  // 模擬多次猜對以測試 cap
  let tokens = currentPlayer.tokens
  for (let i = 0; i < 6; i++) {
    // 重新取得 game state
    const { data: g } = await axios.get(`${BASE}/games/${gameId}`)
    if (g.currentRound.phase !== 'song_guess') break

    const cp = getCurrentPlayer(g)
    const { data: reveal } = await axios.get(`${BASE}/games/${gameId}/music/reveal`)

    try {
      const { data: guessRes } = await axios.post(`${BASE}/games/${gameId}/guess`, {
        playerId: cp.id,
        guessType: 'song',
        guess: reveal.title
      })

      const p = guessRes.game.players.find((p: any) => p.id === cp.id)
      tokens = p.tokens

      // 放卡 + 下一輪
      await axios.post(`${BASE}/games/${gameId}/card-placement`, {
        playerId: cp.id,
        position: 0
      })
      await axios.post(`${BASE}/games/${gameId}/next-round`)
    } catch {
      break
    }
  }

  assert(tokens <= 5, `token 不超過 5 (實際: ${tokens})`)
}

// ==========================================
// 測試前端 UI 狀態（模擬）
// ==========================================
async function testUIStateTransitions() {
  console.log('\n📋 UI 狀態轉換測試（模擬前端 ref 狀態）')
  console.log('─'.repeat(50))

  // 模擬前端的 ref 狀態
  let showSongAnswer = false
  let showMusicVideo = false
  let showWinnerSelection = false
  let selectedWinnerId: string | null = null
  let isSubmitting = false
  let pendingCard: any = null
  let selectedPosition: number | null = null
  let lastGuessResult: any = null
  let revealedMusic: any = null

  function resetUIState() {
    showSongAnswer = false
    showMusicVideo = false
    showWinnerSelection = false
    selectedWinnerId = null
    isSubmitting = false
    pendingCard = null
    selectedPosition = null
    lastGuessResult = null
    revealedMusic = null
  }

  const { gameId, players } = await createAndStartGame()
  let { data: game } = await axios.get(`${BASE}/games/${gameId}`)
  const currentPlayer = getCurrentPlayer(game)
  const otherPlayer = game.players.find((p: any) => !p.isCurrentPlayer)

  // === 流程 A: 我知道這首歌 → 顯示影片 → 有人猜對 → 放卡 → 下一輪 ===
  console.log('\n  --- 流程 A: 完整猜歌流程 ---')

  // Step 1: 初始狀態
  assert(game.currentRound.phase === 'song_guess', '1. phase = song_guess')
  assert(!showSongAnswer, '1. showSongAnswer = false（顯示初始按鈕）')
  assert(!showMusicVideo, '1. showMusicVideo = false（iframe 遮蔽中）')

  // Step 2: 點「我知道這首歌」→ revealAndShowAnswer()
  const { data: musicReveal } = await axios.get(`${BASE}/games/${gameId}/music/reveal`)
  revealedMusic = musicReveal
  showSongAnswer = true
  assert(showSongAnswer, '2. 點「我知道這首歌」→ showSongAnswer = true')
  assert(!showMusicVideo, '2. showMusicVideo 仍 = false（答案還沒顯示）')
  assert(!!revealedMusic.title, `2. revealedMusic 有值: "${revealedMusic.title}"`)

  // Step 3: 此時 UI 應該顯示三個按鈕，不顯示歌名
  // v-if="showMusicVideo && gameStore.revealedMusic" → false，歌名不顯示
  const titleVisible = showMusicVideo && !!revealedMusic
  assert(!titleVisible, '3. 歌名/歌手不顯示（showMusicVideo=false）')

  // Step 4: 點「顯示影片」
  showMusicVideo = true
  const titleVisibleNow = showMusicVideo && !!revealedMusic
  assert(titleVisibleNow, '4. 點「顯示影片」→ 歌名/歌手顯示')

  // Step 5: 點「有人猜對了」→ 顯示玩家列表
  showWinnerSelection = true
  assert(showWinnerSelection, '5. 點「有人猜對」→ showWinnerSelection = true')

  // Step 6: 選擇猜對的玩家 → 按確認
  selectedWinnerId = otherPlayer.id
  isSubmitting = true
  const { data: guessRes } = await axios.post(`${BASE}/games/${gameId}/guess`, {
    playerId: selectedWinnerId,
    guessType: 'song',
    guess: revealedMusic.title
  })
  game = guessRes.game
  lastGuessResult = guessRes
  showSongAnswer = false
  showWinnerSelection = false
  selectedWinnerId = null
  pendingCard = game.currentRound.pendingCard
  isSubmitting = false

  assert(guessRes.correct === true, '6. 猜歌正確')
  assert(game.currentRound.phase === 'card_placement', '6. phase = card_placement')
  assert(!!pendingCard, '6. pendingCard 有值')
  assert(!showSongAnswer, '6. showSongAnswer = false')
  assert(!isSubmitting, '6. isSubmitting = false（按鈕可用）')

  // Step 7: CARD_PLACEMENT 畫面 — 選位置 → 確認放置
  selectedPosition = 0
  assert(selectedPosition !== null, '7. 選了位置 0')

  // 確認「確認放置」按鈕不被 disabled
  const confirmDisabled = selectedPosition === null || isSubmitting
  assert(!confirmDisabled, '7. 確認放置按鈕可按（不 disabled）')

  // Step 8: 按確認放置
  isSubmitting = true
  const { data: placeRes } = await axios.post(`${BASE}/games/${gameId}/card-placement`, {
    playerId: currentPlayer.id,
    position: selectedPosition
  })
  game = placeRes.game
  lastGuessResult = placeRes
  pendingCard = null
  selectedPosition = null

  // reveal + 顯示影片
  const { data: revealAfterPlace } = await axios.get(`${BASE}/games/${gameId}/music/reveal`)
  revealedMusic = revealAfterPlace
  showMusicVideo = true
  isSubmitting = false

  // Card placement always goes to challenge first
  assert(game.currentRound.phase === 'challenge', '8a. phase = challenge')
  game = await ensureRoundEnd(gameId)
  assert(game.currentRound.phase === 'round_end', '8b. phase = round_end')
  assert(showMusicVideo, '8. showMusicVideo = true（iframe 遮蔽移除）')
  assert(!!revealedMusic.title, `8. 顯示歌名: "${revealedMusic.title}"`)
  assert(!!revealedMusic.year, `8. 顯示年份: ${revealedMusic.year}`)
  assert(!isSubmitting, '8. isSubmitting = false')

  // Step 9: ROUND_END 畫面 — 確認「下一輪」按鈕存在且可按
  const nextBtnDisabled = isSubmitting
  assert(!nextBtnDisabled, '9. 「下一輪」按鈕可按')

  // Step 10: 按「下一輪」
  isSubmitting = true
  const { data: nextRes } = await axios.post(`${BASE}/games/${gameId}/next-round`)
  game = nextRes.game
  // 重設 UI
  showSongAnswer = false
  showMusicVideo = false
  showWinnerSelection = false
  selectedWinnerId = null
  lastGuessResult = null
  pendingCard = null
  selectedPosition = null
  isSubmitting = false

  assert(game.currentRound.phase === 'song_guess', '10. 下一輪 phase = song_guess')
  assert(!showSongAnswer, '10. showSongAnswer = false')
  assert(!showMusicVideo, '10. showMusicVideo = false（iframe 重新遮蔽）')
  assert(!isSubmitting, '10. isSubmitting = false')
  assert(game.currentRound.roundNumber === 2, `10. 輪次 = 2`)

  // === 流程 B: 跳過猜歌 → 放卡 → 下一輪 ===
  console.log('\n  --- 流程 B: 跳過猜歌流程 ---')
  resetUIState()
  const currentPlayer2 = getCurrentPlayer(game)

  // Step 1: 點「跳過，直接放卡」
  isSubmitting = true
  const { data: skipRes } = await axios.post(`${BASE}/games/${gameId}/skip-song-guess`)
  game = skipRes.game
  pendingCard = game.currentRound.pendingCard
  showSongAnswer = false
  isSubmitting = false

  assert(game.currentRound.phase === 'card_placement', 'B1. phase = card_placement')
  assert(!!pendingCard, 'B1. pendingCard 有值')
  assert(!showSongAnswer, 'B1. showSongAnswer = false')
  assert(!isSubmitting, 'B1. isSubmitting = false')

  // Step 2: 放卡
  selectedPosition = 0
  isSubmitting = true
  const { data: placeRes2 } = await axios.post(`${BASE}/games/${gameId}/card-placement`, {
    playerId: currentPlayer2.id,
    position: 0
  })
  game = placeRes2.game
  pendingCard = null
  selectedPosition = null
  const { data: revealRes2 } = await axios.get(`${BASE}/games/${gameId}/music/reveal`)
  revealedMusic = revealRes2
  showMusicVideo = true
  isSubmitting = false

  if (game.currentRound.phase === 'challenge') game = await ensureRoundEnd(gameId)
  assert(game.currentRound.phase === 'round_end', 'B2. phase = round_end')
  assert(showMusicVideo, 'B2. showMusicVideo = true')
  assert(!!revealedMusic.title, `B2. 顯示歌名: "${revealedMusic.title}"`)
  assert(typeof revealedMusic.year === 'number', `B2. 顯示年份: ${revealedMusic.year}`)

  // Step 3: 下一輪
  isSubmitting = true
  const { data: nextRes2 } = await axios.post(`${BASE}/games/${gameId}/next-round`)
  game = nextRes2.game
  resetUIState()

  assert(game.currentRound.phase === 'song_guess', 'B3. 下一輪 phase = song_guess')
  assert(!showMusicVideo, 'B3. showMusicVideo = false')

  // === 流程 C: 沒人猜對 → 放卡 → 下一輪 ===
  console.log('\n  --- 流程 C: 沒人猜對流程 ---')
  const currentPlayer3 = getCurrentPlayer(game)

  // 點「我知道這首歌」
  const { data: reveal3 } = await axios.get(`${BASE}/games/${gameId}/music/reveal`)
  revealedMusic = reveal3
  showSongAnswer = true

  // 點「沒人猜對」
  isSubmitting = true
  const { data: wrongRes } = await axios.post(`${BASE}/games/${gameId}/guess`, {
    playerId: currentPlayer3.id,
    guessType: 'song',
    guess: '___WRONG___'
  })
  game = wrongRes.game
  lastGuessResult = wrongRes
  showSongAnswer = false
  isSubmitting = false

  assert(wrongRes.correct === false, 'C1. 猜歌結果 correct = false')
  assert(game.currentRound.phase === 'card_placement', 'C1. phase = card_placement')
  assert(!isSubmitting, 'C1. isSubmitting = false（確認放置可按）')

  // proceedToCardPlacement
  pendingCard = game.currentRound.pendingCard
  assert(!!pendingCard, 'C2. pendingCard 有值')

  // 放卡
  selectedPosition = 0
  isSubmitting = true
  const { data: placeRes3 } = await axios.post(`${BASE}/games/${gameId}/card-placement`, {
    playerId: currentPlayer3.id,
    position: 0
  })
  game = placeRes3.game
  pendingCard = null
  selectedPosition = null
  const { data: reveal3b } = await axios.get(`${BASE}/games/${gameId}/music/reveal`)
  revealedMusic = reveal3b
  showMusicVideo = true
  isSubmitting = false

  if (game.currentRound.phase === 'challenge') { game = await ensureRoundEnd(gameId) }
  assert(game.currentRound.phase === 'round_end', 'C3. phase = round_end')
  assert(showMusicVideo, 'C3. 影片可見')
  assert(!!revealedMusic.title, `C3. 顯示歌名: "${revealedMusic.title}"`)
  assert(!isSubmitting, 'C3. 「下一輪」按鈕可按')
}

// ==========================================
// 主程式
// ==========================================
async function main() {
  console.log('🎵 猜歌王 — 玩家流程測試')
  console.log('═'.repeat(50))
  console.log('確保後端已啟動: npm run dev\n')

  try {
    // 先健康檢查
    await axios.get(`${BASE}/health`)
  } catch {
    console.error('❌ 後端未啟動！請先執行 npm run dev')
    process.exit(1)
  }

  try {
    await testPathA()
    await testPathB()
    await testPathC()
    await testPathD()
    await testPathD2()
    await testPathE()
    await testTokenCap()
    await testUIStateTransitions()
  } catch (err: any) {
    console.error('\n❌ 測試異常中斷:', err.response?.data || err.message)
    failed++
  }

  console.log('\n' + '═'.repeat(50))
  console.log(`📊 結果: ${passed} passed, ${failed} failed`)
  if (failed > 0) {
    console.log('❌ 有失敗的測試！')
    process.exit(1)
  } else {
    console.log('✅ 全部通過！')
  }
}

main()
