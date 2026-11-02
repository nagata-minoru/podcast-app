import type { AudioSource } from 'expo-audio'

/**
 * エピソードごとの音声。どれも scripts/make-audio.sh で、架空の原稿を macOS の読み上げで作ったもの。
 * mock.ts の再生時間（秒）は、この音声の長さ（秒未満を切り捨て）に合わせている。
 */
export const episodeAudio: Record<string, AudioSource> = {
  e1: require('../../assets/audio/e1.m4a'),
  e2: require('../../assets/audio/e2.m4a'),
  e3: require('../../assets/audio/e3.m4a'),
  e4: require('../../assets/audio/e4.m4a'),
  e5: require('../../assets/audio/e5.m4a'),
  e6: require('../../assets/audio/e6.m4a'),
}
