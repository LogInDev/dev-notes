
# React 16.14 클래스형 컴포넌트 정리 노트

## 1. props
- **정의**: 부모 컴포넌트에서 자식 컴포넌트로 전달되는 읽기 전용 데이터
- **특징**
  - 변경 불가능 (immutable)
  - 값이 바뀌면 해당 props를 참조하는 자식 컴포넌트가 리렌더링됨
- **실무 활용 예시**
  - 채팅방에서 `MessageItem`이 부모로부터 `message` 객체를 받아 표시
  - `AIView` 컴포넌트가 `threadId`를 props로 전달받아 해당 쓰레드만 렌더링

```jsx
<MessageItem message={msg} isMine={msg.userId === currentUser.id} />
```

---

## 2. state
- **정의**: 컴포넌트 내부에서 관리되는 동적인 데이터
- **특징**
  - 변경 가능 (mutable)
  - `setState()` 호출 시 컴포넌트가 리렌더링됨
- **실무 활용 예시**
  - 입력창에 입력되는 텍스트 관리
  - 로딩 여부, 팝업 오픈 여부 같은 UI 상태 관리

```jsx
this.state = {
  query: '',
  loading: false,
  openPopup: false,
};

handleChange(e) {
  this.setState({ query: e.target.value });
}
```

---

## 3. 인스턴스 변수 (`this.variable`)
- **정의**: state에 넣을 필요 없이, 리렌더링에 영향을 주지 않는 값
- **특징**
  - `this.variable = 값` 형식으로 선언
  - 값이 변해도 리렌더링을 유발하지 않음
- **실무 활용 예시**
  - scroll 위치 값 저장
  - socket 연결 객체 캐싱

```jsx
constructor(props) {
  super(props);
  this.scrollTop = 0; // 렌더링 영향 없음
  this.socket = null; // 소켓 연결 저장
}
```

---

## 4. 생명주기 메서드

### 4.1 componentDidMount
- **정의**: 컴포넌트가 최초 마운트된 직후 실행
- **실무 활용 예시**
  - 최초 데이터 로딩 (API, 소켓 연결)
  - DOM 참조 초기화

```jsx
componentDidMount() {
  this.socket = Socket.connect();
  this.loadMessages();
}
```

### 4.2 componentDidUpdate
- **정의**: props 또는 state가 업데이트된 직후 실행
- **실무 활용 예시**
  - 특정 props가 바뀔 때 추가 요청 실행
  - 스크롤 위치 조정

```jsx
componentDidUpdate(prevProps, prevState) {
  if (prevProps.threadId !== this.props.threadId) {
    this.loadMessages();
  }
}
```

### 4.3 componentWillUnmount
- **정의**: 컴포넌트가 DOM에서 제거되기 직전에 실행
- **실무 활용 예시**
  - 소켓 연결 해제
  - 타이머, 이벤트 리스너 제거

```jsx
componentWillUnmount() {
  if (this.socket) this.socket.disconnect();
}
```

---

## 5. props vs state vs 인스턴스 변수
| 구분 | 특징 | 렌더링 영향 | 실무 예시 |
|------|------|-------------|-----------|
| props | 부모 → 자식 전달 데이터 | 값 변경 시 리렌더링 | `threadId`, `message` |
| state | 내부 동적 데이터 | `setState` 시 리렌더링 | `query`, `loading`, `openPopup` |
| 인스턴스 변수 | 단순 참조 값 | 리렌더링 없음 | `scrollTop`, `socket` |

---

## 6. 실무 시나리오 예시

### 채팅창(AIView)
1. **props**  
   - 부모로부터 전달받은 `threadId`  
2. **state**  
   - 입력 중인 `query`, 로딩 상태(`loading`)  
3. **인스턴스 변수**  
   - `scrollTop` (스크롤 위치 캐싱)  
   - `socket` (실시간 통신 객체)  
4. **생명주기 활용**
   - `componentDidMount`: 소켓 연결, 초기 메시지 불러오기  
   - `componentDidUpdate`: 쓰레드 변경 시 메시지 새로 로딩  
   - `componentWillUnmount`: 소켓 연결 종료  

---

# 결론
- **props**: 외부 데이터 주입 (변경 불가, 리렌더링 O)  
- **state**: 내부 UI 상태 관리 (변경 가능, 리렌더링 O)  
- **인스턴스 변수**: 단순 참조/캐싱용 (리렌더링 X)  
- **생명주기 메서드**: 데이터 로딩, 이벤트 연결/해제, UI 업데이트 타이밍 제어  

이 패턴을 따라가면 실무에서 유지보수성과 성능을 모두 챙길 수 있음.
