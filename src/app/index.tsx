import { Redirect } from 'expo-router'

/**
 * 起動時はホームタブを開く。
 * @returns ホームへのリダイレクト
 */
const Index = () => <Redirect href="/home" />

export default Index
