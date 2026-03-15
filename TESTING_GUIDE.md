# Testing Guide - Hitster Game Refactoring

## Build Status
✅ **Backend**: Compiles successfully with `npm run build`
✅ **Frontend**: Compiles successfully with `npm run build`

## Starting the Application

### 1. Start Backend Server
```bash
cd backend
npm run dev
# or
npm start
```
The backend will run on `http://localhost:3000`

### 2. Start Frontend Dev Server
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173` and proxy API requests to `http://localhost:3000`

## Game Flow Testing

### Phase 1: Game Setup
1. ✅ Open http://localhost:5173
2. ✅ Game automatically initializes with 4 players
3. ✅ Verify game room code is displayed
4. ✅ Verify players list shows 4 players with correct initial state (0 cards, 2 tokens)

### Phase 2: First Round
1. ✅ Audio player shows and music auto-plays
2. ✅ Only two buttons appear:
   - "🎯 我知道这首歌！" (I know this song!)
   - "⏭️ 跳过，直接放卡" (Skip, place card directly)

### Phase 3: Option A - Submit Song Guess
1. ✅ Click "我知道这首歌！"
2. ✅ Input field appears for song name entry
3. ✅ Enter correct song name → Shows "+1 token" message
4. ✅ Enter wrong song name → Shows "Wrong!" message, no penalty
5. ✅ After result display, automatically progresses to card placement

### Phase 4: Option B - Skip Song Guess
1. ✅ Click "⏭️ 跳过，直接放卡"
2. ✅ Skips immediately to card placement without attempting guess
3. ✅ No tokens awarded

### Phase 5: Card Placement
1. ✅ Timeline displays with proper alternation: [+] [card] [+] [card] [+]
2. ✅ Each card shows its year
3. ✅ Green [+] buttons allow selection of insertion position
4. ✅ Selected position highlighted in red
5. ✅ "要放置的卡牌" section shows the song to be placed
6. ✅ Click "确认放置" to place the card

### Phase 6: Card Placement Result
- **Correct Placement**:
  ✅ Card added to timeline in correct position (ascending year order)
  ✅ Message shows "Card placement correct!"
  ✅ Auto-progresses to next round

- **Wrong Placement**:
  ✅ If player has tokens: -1 token, message shows "Wrong placement! You lost 1 token."
  ✅ If player has no tokens: lose oldest card, message shows "Wrong placement! You lost your oldest card."
  ✅ Auto-progresses to next round

### Phase 7: Round End & Next Round
1. ✅ Round end screen shows with "准备下一轮..." message
2. ✅ "下一轮" button appears
3. ✅ Click to start next round
4. ✅ New music plays
5. ✅ Player order rotates correctly

## Game Win Condition
- ✅ When a player collects the winning number of cards (default: 5)
- ✅ Game displays winner screen with:
  - Trophy emoji and "游戏结束！" (Game Over!)
  - Winner name: "XX 获胜！" (XX Wins!)
  - Final ranking with card counts
  - "开始新游戏" (Start New Game) button

## Edge Cases to Test

### Multi-Player Dynamics
- [ ] Player 1 guesses correctly, gets +1 token
- [ ] Player 2 guesses wrong, still proceeds to card placement
- [ ] Player 3 skips song guess
- [ ] Verify each player has independent card timeline
- [ ] Verify tokens are individual per player

### Card Placement Accuracy
- [ ] Place card at the beginning [+]
- [ ] Place card in the middle [+]
- [ ] Place card at the end [+]
- [ ] Verify year validation works correctly
  - [ ] Card with year 1995 between 1990 and 2000 → Correct
  - [ ] Card with year 1995 between 1980 and 1990 → Wrong
  - [ ] Card with year 1995 between 2000 and 2010 → Wrong

### Winning Condition
- [ ] Play until first player reaches 5 cards
- [ ] Verify game ends with correct winner
- [ ] Verify "开始新游戏" button resets the game

## Expected Behavior Changes from Original

### OLD Behavior (Removed)
- ❌ YEAR_GUESS phase after correct song guess
- ❌ Player had to guess year accurately to get card
- ❌ Wrong year resulted in ROUND_END with no card
- ❌ Multiple phases per round

### NEW Behavior (Implemented)
- ✅ Song guess is optional bonus (+1 token if correct)
- ✅ Card is automatically created from current music
- ✅ Placement is based on year comparison, not manual input
- ✅ Direct path: SONG_GUESS → CARD_PLACEMENT → ROUND_END
- ✅ Can skip song guess entirely

## Troubleshooting

### Build Issues
If you encounter build errors:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install`
3. Run `npm run build` again

### Runtime Errors
- Check browser console for JavaScript errors (F12)
- Check backend terminal for API errors
- Verify API is running on http://localhost:3000
- Verify frontend can reach API (check Network tab in DevTools)

### Port Conflicts
- Backend default: 3000
- Frontend default: 5173
- Change in respective config files if ports are in use

## API Endpoints Changed

### Modified
- `POST /api/games/:gameId/guess` - Only accepts song guesses now
- `POST /api/games/:gameId/card-placement` - Only requires position, not card

### New
- `POST /api/games/:gameId/skip-song-guess` - Skip song guess phase

### Removed
- Year guess endpoint (was part of /guess endpoint before)

## File Changes Summary
- ✅ 7 main files modified
- ✅ 1 backend function deleted (processYearGuess)
- ✅ 1 backend function added (skipSongGuess)
- ✅ 1 type enum removed (GuessType.YEAR)
- ✅ 1 phase enum removed (GamePhase.YEAR_GUESS)
- ✅ Frontend UI completely refactored for new flow
- ✅ Timeline display bug fixed

---

For detailed implementation information, see [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
