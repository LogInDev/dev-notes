import Player from './components/Player.jsx';
import TimerChanllenger from './components/TimerChallenger.jsx';

function App() {
  return (
    <>
      <Player />
      <div id="challenges">
        <TimerChanllenger title="Easy" targetTime={1} />
        <TimerChanllenger title="Not easy" targetTime={5} />
        <TimerChanllenger title="Getting tough" targetTime={10} />
        <TimerChanllenger title="Pros Only" targetTime={15} />
      </div>
    </>
  );
}

export default App;
