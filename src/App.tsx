import MoteurTest from '@/debug/MoteurTest'

const App = (): React.JSX.Element => {
  if (new URLSearchParams(location.search).has('debug')) return <MoteurTest />
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-2xl font-semibold">Skyjo Scan</h1>
      <p className="text-muted-foreground">Compteur de points Skyjo hors ligne — en construction.</p>
    </main>
  )
}

export default App
