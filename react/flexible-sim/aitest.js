// ...imports 동일...

class AIThreadList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openPopups: [],          // ['1','2', ...]
      popupWindow: {},         // { '1': Window, '2': Window, ... }
      currentId: '0',
      nextNum: 0,
    };
    // ...기타 바인딩 동일...
  }

  // ====== 팝업 열기(우클릭) ======
  openAIPopup = (e) => {
    e.preventDefault();
    const id = String(e.currentTarget.dataset.id);

    // 이미 열려있으면 포커스
    const win = this.state.popupWindow[id];
    if (win && !win.closed) {
      try { win.focus(); } catch {}
      return;
    }

    this.props.setAIQueryId(id);
    this.setState((s) => ({
      openPopups: s.openPopups.includes(id) ? s.openPopups : [...s.openPopups, id],
      currentId: id,
    }));
  };

  // ====== 팝업이 실제 open 된 순간 window 보관(id별) ======
  handleOpen = (id, win) => {
    this.setState((s) => ({
      popupWindow: { ...s.popupWindow, [id]: win },
    }), () => {
      try {
        const doc = win.document;
        const style = doc.createElement('style');
        style.textContent = `
          html, body { height: 100%; margin: 0; }
          #root, #app { height: 100%; }
        `;
        doc.head.appendChild(style);
      } catch (e) {
        console.error('팝업 스타일 주입 실패:', e.message);
      }
    });
  };

  // ====== 팝업 닫기(코드/버튼) ======
  closePopup = (id) => {
    this.setState((s) => {
      // window 닫기 시도
      const win = s.popupWindow[id];
      if (win && !win.closed) {
        try { win.close(); } catch {}
      }
      // 상태 정리
      const nextMap = { ...s.popupWindow };
      delete nextMap[id];
      return {
        popupWindow: nextMap,
        openPopups: s.openPopups.filter((x) => x !== id),
      };
    });
  };

  // ====== onUnload: 사용자가 X로 닫았을 때 ======
  handlePopupUnload = (id) => {
    this.setState((s) => {
      const nextMap = { ...s.popupWindow };
      delete nextMap[id];
      return {
        popupWindow: nextMap,
        openPopups: s.openPopups.filter((x) => x !== id),
      };
    });
  };

  // ...스크롤 초기화/슬림스크롤 코드는 그대로...

  render() {
    const { openPopups, currentId, nextNum, popupWindow } = this.state;
    const arr = Array.from({ length: 10 }, (_, i) => i * nextNum + 1);

    return (
      <div style={{ height:'calc(100% - 30px)' }}>
        <ul className="list2" id="aithread">
          {arr.map((_, idx) => (
            <li
              data-id={idx}
              key={idx}
              onClick={this.openAIView}
              onContextMenu={this.openAIPopup}
            >
              <div className="con">
                <div className="arrow_box">channelName</div>
                <a className={currentId === String(idx) ? 'on' : ''} title="channelName">
                  <span>channelName - {idx}</span>
                  <span>data.last_message</span>
                </a>
              </div>
            </li>
          ))}
        </ul>

        {openPopups.map((id, i) => (
          <NewWindow
            copyStyles
            key={id}
            title={`AI Assistant #${id}`}
            features={this.getPopupFeatures(i)}
            onOpen={(win) => this.handleOpen(id, win)}          {/* ✅ id 클로저 */}
            onUnload={() => this.handlePopupUnload(id)}         {/* ✅ 함수로 전달 */}
          >
            <Provider store={store}>
              <AIViewPopup
                popupId={String(id)}
                popupWindow={popupWindow[id]}
                height={this.popHeight}
                isPopup={true}
                onClose={() => this.closePopup(id)}             {/* ✅ 내부 버튼 닫기 */}
              />
            </Provider>
          </NewWindow>
        ))}
      </div>
    );
  }
}

export default connect(null, { setAIQueryId, clickDetailTabItem })(AIThreadList);