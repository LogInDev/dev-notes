// src/components/AIView/index.js
import React, { Component, createRef } from 'react';
import { connect } from 'react-redux';

const defaultProps = {
    isPopup: false,
    setColor: { background: '#fff', font: '#111' },
    height: '95%',
};

class AIView extends Component {
    constructor(props) {
        super(props);
        this.state = { selectedFile: null, query: '' };

        this.aiviewRef = createRef();             // fallback ref
        this.fileInputRef = createRef();
        this.inputRef = createRef();

        // 스크롤 앵커/상태
        this.isFirst = true;
        this.scrollBottom = -1;
        this.scrollTop = -1;
        this.preScroll = -1;
        this.preScrollBottom = -1;
        this.preScrollTop = -1;
        this.prevScrollHeight = -1;
        this.precurrentScrollTop = -1;
        this.isModify = false;

        // 바인딩
        this._onScroll = this._onScroll.bind(this);
        this._bootstrapFromClick = this._bootstrapFromClick.bind(this);
        this.moveScroll = this.moveScroll.bind(this);
        this.initScrollParam = this.initScrollParam.bind(this);
        this.getScrollEl = this.getScrollEl.bind(this);
    }

    componentDidMount() {
        // 1) onOpen으로 받은 popupWindow 기준으로 바인딩 시도
        this.attachScrollFromPopupWindow();

        // 2) 레이스 상황 대비 rAF 재시도 1~2회
        if (!this._scrollEl) {
            this._retryTimer = requestAnimationFrame(() => {
                this.attachScrollFromPopupWindow();
                if (!this._scrollEl) {
                    this._retryTimer2 = requestAnimationFrame(() => {
                        this.attachScrollFromPopupWindow();
                    });
                }
            });
        }

        // 3) 첫 클릭으로 팝업 문서를 부트스트랩 (최종 안전망)
        window.addEventListener('click', this._bootstrapFromClick, true);

        // ESC 닫기 지원 (팝업 문서에 keydown)
        const doc = this.props.popupWindow?.document || this.aiviewRef.current?.ownerDocument;
        this._escHandler = (e) => { if (e.key === 'Escape') this.props.onRequestClose?.(); };
        doc?.addEventListener('keydown', this._escHandler);
    }

    componentWillUnmount() {
        if (this._scrollEl) this._scrollEl.removeEventListener('scroll', this._onScroll);
        if (this._doc) this._doc.removeEventListener('scroll', this._onScroll, { capture: true });
        window.removeEventListener('click', this._bootstrapFromClick, true);
        cancelAnimationFrame?.(this._retryTimer);
        cancelAnimationFrame?.(this._retryTimer2);

        const doc = this._doc || this.aiviewRef.current?.ownerDocument;
        if (this._escHandler) doc?.removeEventListener('keydown', this._escHandler);
    }

    // 팝업 window로 스크롤 대상 바인딩
    attachScrollFromPopupWindow() {
        const popupWin = this.props.popupWindow;
        const refEl = this.aiviewRef.current;
        if (!popupWin || popupWin.closed) return;

        const doc = popupWin.document;
        const el = doc.getElementById('aiviewMsg') || refEl;
        if (!el) return;

        this._doc = doc;
        this._win = doc.defaultView;
        this._scrollEl = el;

        console.log('[AIView] bind target in popup?', this._doc !== window.document, this._scrollEl);

        // 문서 전체 캡처는 환경 따라 잡음 발생 → 우선 대상 엘리먼트에만 바인딩
        this._scrollEl.addEventListener('scroll', this._onScroll, { passive: true });

        // 최초 하단 고정
        this._scrollEl.scrollTop = this._scrollEl.scrollHeight;
    }

    // 첫 클릭으로 팝업 문서 확보 (fallback)
    _bootstrapFromClick(e) {
        if (this._doc && this._scrollEl) {
            window.removeEventListener('click', this._bootstrapFromClick, true);
            return;
        }
        const doc = e.target?.ownerDocument;
        if (!doc || doc === window.document) return;

        const el = doc.getElementById('aiviewMsg');
        if (!el) return;

        this._doc = doc;
        this._win = doc.defaultView;
        this._scrollEl = el;

        this._scrollEl.addEventListener('scroll', this._onScroll, { passive: true });
        this._scrollEl.scrollTop = this._scrollEl.scrollHeight;

        console.log('[AIView] bootstrapped via click. popup?', this._doc !== window.document);
        window.removeEventListener('click', this._bootstrapFromClick, true);
    }

    // 항상 동일한 스크롤 대상만 사용
    getScrollEl() {
        return this._scrollEl || this.aiviewRef.current || null;
    }

    // queryId 변화 시(필요하면 사용)
    UNSAFE_componentWillReceiveProps(nextProps) {
        const { queryId } = this.props;
        if (queryId !== nextProps.queryId) {
            this.scrollBottom = 0;
            this.scrollTop = -1;
            this.initScrollParam();
        }
    }

    componentDidUpdate() {
        const node = this.getScrollEl();
        if (!node) return;

        const currentScrollHeight = node.scrollHeight;
        const currentScrollTop = node.scrollTop;

        if (this.isModify) {
            this.isModify = false;
            return;
        }
        if (this.precurrentScrollTop - currentScrollTop > 150) return;

        if (this.scrollBottom > -1 || this.scrollTop > -1) {
            let scrollHeight = 0;
            if (this.scrollBottom > -1) {
                scrollHeight = node.scrollHeight - this.scrollBottom;
                if (scrollHeight > -1) this.preScroll = scrollHeight;
            } else if (this.scrollTop > -1) {
                this.preScroll = this.scrollTop;
            }

            this.preScrollBottom = this.scrollBottom;
            this.preScrollTop = this.scrollTop;

            this.moveScroll(this.preScroll > -1 ? this.preScroll : 0);
        } else if (this.prevScrollHeight + 20 < currentScrollHeight) {
            let scrollHeight = 0;
            if (this.preScrollBottom > -1) {
                scrollHeight = node.scrollHeight - this.preScrollBottom;
                if (scrollHeight > -1) this.preScroll = scrollHeight;
            } else if (this.preScrollTop > -1) {
                this.preScroll = this.preScrollTop;
            }
            this.moveScroll(this.preScroll > -1 ? this.preScroll : 0);
        }
    }

    initScrollParam() {
        this.preTop = undefined;
        this.preBottom = undefined;
    }

    _onScroll(e) {
        const target = this.getScrollEl() || e.currentTarget || e.target;

        const top = target.scrollTop || 0;
        const view = target.clientHeight || target.offsetHeight || 0;
        const height = target.scrollHeight || 0;

        console.log('[AIView][popup] scroll =', { top, view, height });

        if (top === 0) {
            // loadPrev()
        } else if (Math.round(top + view) >= height) {
            // loadNext()
        }
    }

    // slimscroll 없이, 스크롤 이동/앵커 복원
    moveScroll(height) {
        const node = this.getScrollEl();
        if (!node) return;

        if (typeof height === 'number') {
            node.scrollTop = height;
        } else {
            node.scrollTop = node.scrollHeight;
        }

        this.prevScrollHeight = node.scrollHeight;
        this.precurrentScrollTop = node.scrollTop;

        if (this.scrollBottom === -1 && this.scrollTop === -1) {
            this.preScrollTop = typeof height === 'number' ? height : node.scrollTop;
        }

        if (this.isFirst) this.isFirst = false;

        this.scrollBottom = -1;
        this.scrollTop = -1;
    }

    handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) this.setState({ selectedFile: file });
    };

    searchQuery = () => {
        this.setState({ query: '' });
    };

    handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.searchQuery();
        }
    };

    render() {
        const { query, selectedFile } = this.state;
        const { setColor, isPopup, height, queryId, hideDetail } = this.props;
        const { background, font } = setColor;

        return (
            <div
                className={hideDetail ? 'hidden' : 'right'}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    padding: '15px',
                    height: '100%',
                    backgroundColor: isPopup ? '#fff' : background,
                }}
            >
                {/* Header */}
                <div style={{ height: '5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '15px', fontWeight: 'bold' }}>✨AI 결과</span>
                    <button
                        type="button"
                        onClick={() => this.props.onRequestClose?.()}
                        aria-label="닫기"
                        style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer' }}
                        title="닫기(Esc)"
                    >
                        ✖
                    </button>
                </div>
                <div
                    style={{
                        backgroundColor: '#fff',
                        borderTop: '1px solid #8c8c8c',
                        margin: '8px 0 16px',
                    }}
                />

                {/* Body */}
                <div
                    style={{
                        display: 'flex',
                        marginTop: '10px',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        flex: 1,
                        height: isPopup ? (typeof height === 'number' ? `${height - 90}px` : '100%') : height,
                    }}
                >
                    {/* 스크롤 영역 */}
                    <div
                        ref={this.aiviewRef}
                        id="aiviewMsg" // 팝업 문서에서 이 id로 직접 찾음
                        className="aiview"
                        style={{
                            fontSize: '15px',
                            lineHeight: '1.5',
                            color: isPopup ? '#111' : font,
                            flex: 1,
                            overflowY: 'auto',
                        }}
                    >
                        <br />
                        CurrentID : {queryId} <br />
                        안녕하세요 <br />
                        Pizza입니다. <br />
                        무엇을 도와드릴까요? <br />
                        <br />
                        현재 테스트 진행중입니다.<br />
                        <br />
                        {Array.from({ length: 100 }).map((_, i) => <div key={i}>row {i + 1}</div>)}
                    </div>

                    {/* 입력 영역 */}
                    <div style={{ display: 'flex' }} className="search_ai">
                        <button type="button" onClick={() => this.fileInputRef.current.click()}>파일</button>
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={this.handleFileChange}
                            ref={this.fileInputRef}
                            style={{ display: 'none' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            {selectedFile && <p>선택된 파일: {selectedFile.name}</p>}
                            <input
                                ref={this.inputRef}
                                type="text"
                                style={{ width: '100%' }}
                                placeholder="검색어를 입력하세요"
                                name="queryInput"
                                value={query}
                                onChange={(e) => this.setState({ query: e.target.value })}
                                onKeyDown={this.handleKeyDown}
                            />
                        </div>
                        <button onClick={this.searchQuery}>🔎</button>
                    </div>
                </div>
            </div>
        );
    }
}

AIView.defaultProps = defaultProps;
export default connect(() => ({}), null)(AIView);
