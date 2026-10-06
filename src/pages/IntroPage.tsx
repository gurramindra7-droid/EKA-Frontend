import IntroScreen from '../components/intro/IntroScreen'

export default function IntroPage({ onEnter }: { onEnter: () => void }) {
  return <IntroScreen onEnter={onEnter} />
}
