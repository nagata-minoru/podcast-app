import { PlayerScreen } from '@/screens/PlayerScreen'

/**
 * 再生画面のルート。本体は screens/PlayerScreen.tsx に置く。
 * ミニプレイヤーから `/player?tab=<タブ名>` で開き、番組名から番組詳細へ移るときの戻り先のタブを受け取る。
 * @returns 再生画面
 */
const Player = () => <PlayerScreen />

export default Player
