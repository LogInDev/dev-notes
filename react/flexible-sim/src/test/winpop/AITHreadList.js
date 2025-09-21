// AIThreadList.jsx (요지)
import { openPopup } from '../../store/popupWindows';

openAIPopup = (e) => {
    e.preventDefault();
    const id = String(e.currentTarget.dataset.id);

    // 이미 열려있으면 포커스만
    const it = this.props.popupWindows[id];
    if (it?.win && !it.win.closed) {
        try { it.win.focus(); } catch(e){}
        return;
    }

    // 전역 팝업 오픈 (호스트가 렌더링)
    this.props.openPopup(id, { /* 필요 payload */ });
};

// ...
<li data-id={idx} onContextMenu={this.openAIPopup}> ... </li>
