import type { AudioSource } from 'expo-audio'

import { findShow } from '@/data/catalog'
import type { Episode } from '@/types'

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

/**
 * エピソードの音声を返す。同梱の音声があればそれを、なければフィードの音声の URL を使う。
 * @param episode エピソード
 * @returns 音声。どちらもなければ undefined
 */
export const audioSourceOf = (episode: Episode): AudioSource | undefined =>
  episodeAudio[episode.id] ?? (episode.audioUrl ? { uri: episode.audioUrl } : undefined)

/**
 * フィードに音声が載っていない回かを返す。こうした回は「音声なし」と示し、再生できないようにする。
 * 同梱の音声を使う架空の回は、読み込みに失敗したときの知らせに任せるため、ここでは false にする。
 * @param episode エピソード
 * @returns 音声が載っていない回なら true
 */
export const lacksAudio = (episode: Episode) => !episode.audioUrl && !!findShow(episode.showId)?.feedUrl
