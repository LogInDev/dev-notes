// src/components/AISearch/AISearch.js
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { submitSearch } from '../../../store/actions/ai';
import './search.css';
import NewWindow from 'react-new-window';
import AIView from '../AIView';

class AISearch extends Component {
    state = { value: '', open: false, popon: false, popupWindow: null };
    rootRef = React.createRef();

    componentDidMount() {
        document.addEventListener('mousedown', this.handleDocumentMouseDown, { passive: true });
    }
    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleDocumentMouseDown);
    }

    openPopover = () => this.setState({ open: true });
    closePopover = () => this.setState({ open: false });

    handleDocumentMouseDown = (e) => {
        const root = this.rootRef.current;
        if (!root) return;
        if (this.state.open && !root.contains(e.target)) this.closePopover();
    };

    handleFocus = () => this.openPopover();
    handleBlur = (e) => {
        const root = e.currentTarget;
        if (!root.contains(e.relatedTarget)) this.closePopover();
    };

    handleSubmit = () => {
        const { popupWindow } = this.state;
        // 이미 열려 있으면 새로 열지 말고 포커스만
        if (popupWindow && !popupWindow.closed) {
            popupWindow.focus();
            return;
        }
        this.setState({ popon: true });
    };

    handleSuggest = (label) => {
        this.setState({ value: label }, () => {
            this.props.submitSearch(label);
            this.closePopover();
        });
    };

    // 팝업 window 획득
    handlePopupOpen = (win) => {
        this.setState({ popupWindow: win }, () => {
            // 팝업 문서 레이아웃(높이) 보장: 스크롤이 실제로 생기도록
            try {
                const doc = win.document;
                const style = doc.createElement('style');
                style.textContent = `
          html, body { height: 100%; margin: 0; }
          #root, #app { height: 100%; }
        `;
                doc.head.appendChild(style);
            } catch (e) { /* noop */ }
        });
    };

    // 사용자 X 버튼 등으로 닫았을 때 동기화
    handlePopupUnload = () => {
        this.setState({ popupWindow: null, popon: false, open: false });
    };

    // 자식에서 닫기 요청(버튼/ESC)
    handleRequestClose = () => {
        const { popupWindow } = this.state;
        this.setState({ popon: false, popupWindow: null }, () => {
            try { if (popupWindow && !popupWindow.closed) popupWindow.close(); } catch (e) {}
        });
    };

    render() {
        const { value, open, popon, popupWindow } = this.state;

        return (
            <div className="ai-search-header">
                <div
                    className={`searchbox ${open ? 'is-open' : ''}`}
                    ref={this.rootRef}
                    onFocus={this.handleFocus}
                    onBlur={this.handleBlur}
                    onClick={this.openPopover}
                    aria-expanded={open}
                    aria-haspopup="listbox"
                    aria-controls="ai-search-popover"
                >
                    <input
                        className="searchbox__input"
                        placeholder="검색어 입력…"
                        value={value}
                        onChange={(e) => this.setState({ value: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') this.handleSubmit(); }}
                    />
                    <button className="searchbox__icon" onClick={this.handleSubmit} aria-label="검색">🔎</button>

                    <div id="ai-search-popover" className="search-popover" hidden={!open}>
                        <div className="suggest-buttons">
                            {['Kafka 트러블슈팅', 'CSS Flex', 'Vert.x 라우터', 'SQL 튜닝', '에러 로그', 'Flink 파이프라인']
                                .map((label, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className="suggest-button"
                                        onClick={() => this.handleSuggest(label)}
                                    >
                                        {label}
                                    </button>
                                ))}
                        </div>

                        <div className="recent-searches">
                            <button type="button" className="recent-chip">최근 검색 1</button>
                            <button type="button" className="recent-chip">최근 검색 2</button>
                            <button type="button" className="recent-chip">최근 검색 3</button>
                        </div>
                    </div>
                </div>

                {popon && (
                    <NewWindow
                        title="AI 결과"
                        copyStyles
                        features={{ width: 960, height: 720, menubar: 'no', toolbar: 'no' }}
                        onOpen={this.handlePopupOpen}
                        onUnload={this.handlePopupUnload}
                    >
                        <AIView
                            isPopup
                            popupWindow={popupWindow}
                            onRequestClose={this.handleRequestClose}
                        />
                    </NewWindow>
                )}
            </div>
        );
    }
}

export default connect(null, { submitSearch })(AISearch);
