componentDidMount() {
  const node = this.refs.chatlistin3;
  if (node) node.addEventListener('slimscroll', this.onSlimscroll);

  if (global.externalParam) {
    let { type } = global.externalParam;
    if (type === 'Hytube') {
      window.addEventListener('message', this.receiveMsgFromParent);
    }
  }

  // ✅ 팝업 최초 오픈 시에도 맨 아래로 내려주기
  const { messages } = this.props;
  if (messages && messages.list && messages.list.length > 0) {
    // DOM 렌더링이 끝난 뒤에 스크롤해야 해서 setTimeout or requestAnimationFrame 사용
    setTimeout(() => {
      // “맨 아래로 보내겠다” 플래그
      this.scrollBottom = 0;
      // height를 안 넘기면 slimscroll 내부에서 '100000'으로 처리 → 맨 아래
      this.moveScroll();
    }, 0);
  }
}


} else if (this.prevScrollHeight + 20 < currentScrollHeight) {
  // ...
}