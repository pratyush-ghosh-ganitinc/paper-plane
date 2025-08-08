import { PaperPlaneGame } from './components/PaperPlaneGame';
import './App.css';

function App() {
  const handleGameStart = () => {
    console.log('Paper Plane Game Started!');
  };

  const handleGameStop = () => {
    console.log('Paper Plane Game Stopped!');
  };

  return (
    <div className="App">
      <PaperPlaneGame 
        onGameStart={handleGameStart}
        onGameStop={handleGameStop}
      />
    </div>
  );
}

export default App;
