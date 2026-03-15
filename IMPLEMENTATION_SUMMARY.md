# Hitster Game Refactoring - Implementation Summary

## Changes Overview

The game flow has been refactored from the original implementation (SONG_GUESS → YEAR_GUESS → CARD_PLACEMENT) to the correct Hitster rules (SONG_GUESS → CARD_PLACEMENT).

### Game Flow

```
[播放歌曲]
    ↓
[SONG_GUESS 階段]（可選加分）
    ├─ "我知道這首歌！" → 輸入歌名+藝術家
    │   ├─ 猜對 → +1 代幣，進入 CARD_PLACEMENT
    │   └─ 猜錯 → 無懲罰，進入 CARD_PLACEMENT
    └─ "跳過" → 直接進入 CARD_PLACEMENT
    ↓
[CARD_PLACEMENT 階段]
    - 時間線顯示現有卡牌（交替顯示：[+] [卡] [+] [卡] [+]）
    - 選擇插入位置
    - 確認放置 → 後端判斷年份是否符合位置
    ├─ 正確 → 保留卡牌 + ROUND_END
    └─ 錯誤 → 扣代幣 or 失卡 + ROUND_END
    ↓
[ROUND_END]（揭露答案：歌名、年份）
    - 下一輪按鈕
```

## Backend Changes

### 1. `/backend/src/types.ts`
- ✅ Removed `GamePhase.YEAR_GUESS` enum value
- ✅ Removed `GuessType.YEAR` enum value
- ✅ Removed `correctGuessYear` from `GameRound` interface
- ✅ Added `pendingCard?: Card` to `GameRound` interface

### 2. `/backend/src/gameLogic.ts`
- ✅ Modified `processSongGuess()`:
  - Now creates `pendingCard` from current music
  - If correct: +1 token, sets `correctGuessPlayer`, moves to CARD_PLACEMENT
  - If wrong: no penalty, moves directly to CARD_PLACEMENT
  - No longer transitions through YEAR_GUESS

- ✅ Deleted `processYearGuess()` function entirely

- ✅ Added `skipSongGuess()` function:
  - Creates `pendingCard` without attempting song guess
  - Moves directly to CARD_PLACEMENT

- ✅ Modified `processCardPlacement()`:
  - Now uses `game.currentRound.pendingCard` instead of receiving card as parameter
  - Validates card position against left/right neighbor cards
  - Clears `pendingCard` after placement

### 3. `/backend/src/api.ts`
- ✅ Modified `POST /api/games/:gameId/guess`:
  - Only accepts `guessType: 'song'`
  - Removed handling for `GuessType.YEAR`

- ✅ Added `POST /api/games/:gameId/skip-song-guess`:
  - New endpoint for skipping song guess
  - Calls `gameLogic.skipSongGuess()`
  - Returns game state with pendingCard set

- ✅ Modified `POST /api/games/:gameId/card-placement`:
  - Now only requires `playerId` and `position`
  - No longer requires `card` in request body
  - Backend uses `pendingCard` from current round

## Frontend Changes

### 1. `/frontend/src/types/index.ts`
- ✅ Removed `YEAR_GUESS` from `GamePhase` enum
- ✅ Removed `YEAR` from `GuessType` enum

### 2. `/frontend/src/api/client.ts`
- ✅ Added `skipSongGuess(gameId: string)` method
- ✅ Method calls `POST /games/:gameId/skip-song-guess`

### 3. `/frontend/src/stores/gameStore.ts`
- ✅ Removed `submitYearGuess()` action
- ✅ Added `skipSongGuess()` action
  - Calls `apiService.skipSongGuess()`
  - Updates game state with response

- ✅ Modified `submitCardPlacement()` signature:
  - Changed from `(playerId, card, position)` to `(playerId, position)`
  - Backend now provides card via `pendingCard`

### 4. `/frontend/src/components/QuickGame.vue`
- ✅ Replaced Song Guess Section:
  - Two main buttons: "我知道這首歌！" and "跳過，直接放卡"
  - "我知道這首歌！" shows input for song guess
  - Input accepts song name (artist is optional, compares by title only)
  - Can proceed to card placement after submitting or showing result

- ✅ Removed Year Guess Section:
  - Entire `v-if="gameStore.currentPhase === 'year_guess'"` block removed

- ✅ Fixed Timeline Display Bug:
  - Created `timelineItems` computed property
  - Properly alternates: [insert-0] [card-0] [insert-1] [card-1] [insert-2] ...
  - Uses unique keys for proper Vue rendering

- ✅ Updated Card Placement Logic:
  - Uses `pendingCard` from `gameStore.currentGame?.currentRound.pendingCard`
  - Card placement only sends `position`, not card object
  - Updated refs: `newCard` → `pendingCard`, `yearGuess` → `songGuessInput`

- ✅ Added Methods:
  - `skipSongGuessDirect()`: Calls skip-song-guess API
  - `proceedToCardPlacement()`: Transitions to card placement after result
  - `submitSongGuess()`: Submits song guess input
  - Updated `confirmCardPlacement()`: Only sends position parameter

## Testing Checklist

- [ ] Backend server starts without errors
- [ ] Frontend application loads correctly
- [ ] Create new game
- [ ] Add 2-4 players
- [ ] Start game
- [ ] Music plays in first round
- [ ] "我知道這首歌！" button shows input field
- [ ] Entering correct song name → +1 token
- [ ] Entering wrong song name → no penalty, continue
- [ ] "跳過，直接放卡" button → skips directly to card placement
- [ ] Timeline displays cards correctly with [+] [card] [+] alternation
- [ ] Selecting insert position works
- [ ] Confirming card placement works
- [ ] Correct placement → card added to timeline, next round
- [ ] Wrong placement → token loss or card loss, next round
- [ ] Game ends when player reaches winning card count
- [ ] Next round button works and plays next song

## Database Schema Changes

`GameRound` structure change:
```typescript
// Before
{
  roundNumber: number
  currentPlayer: string
  musicId: string
  phase: GamePhase
  usedMusicIds: string[]
  correctGuessPlayer?: string
  correctGuessYear?: number  // ❌ REMOVED
}

// After
{
  roundNumber: number
  currentPlayer: string
  musicId: string
  phase: GamePhase
  usedMusicIds: string[]
  correctGuessPlayer?: string
  pendingCard?: Card  // ✅ NEW
}
```

## Notes

1. The validation function `validateYearGuess()` in backend still exists but is no longer called - can be left for backwards compatibility or removed if desired
2. GameBoard.vue (legacy component) is not used by the main app - kept unchanged to avoid breaking any alternate implementations
3. The year tolerance functions in database.ts are no longer used but kept for potential future use
