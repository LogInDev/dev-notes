// App.jsx (React Router v5 예시)
<Switch>
  <Route path="/ai/thread/:id" component={AiThreadPage} />
  {/* ... */}
</Switch>

// AiThreadPage.jsx
import { useParams } from 'react-router-dom';

export default function AiThreadPage() {
  const { id } = useParams();
  // id 기반으로 fetch → AiThreadView 컴포넌트 렌더
  return <AiThreadView threadId={id} />;
}

function OpenPopupButton({ threadId }) {
  const openPopup = () => {
    window.open(
      `/ai/thread/${threadId}`,
      '_blank',
      'width=960,height=740,toolbar=no,menubar=no,scrollbars=yes,resizable=yes'
    );
  };

  return <button onClick={openPopup}>새 창으로 보기</button>;
}