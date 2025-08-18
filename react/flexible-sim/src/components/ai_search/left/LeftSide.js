// src/components/LeftSide/LeftSide.js
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { loadHistory, loadResult } from '../../../store/actions/ai';
import { setLeftTab } from '../../../features/ui/uiSlice';
import './left.css';

class LeftSide extends Component {
    state = { filterTerm: '' };

    // ★ 누락되어 있던 ref 추가
    listRef = React.createRef();
    bottomRef = React.createRef();

    observer = null;
    _ioLock = false;

    componentDidMount() {
        console.log('[LeftSide] mount → loadHistory()');
        const { activeLeftTab, items, loadHistory } = this.props;
        if (activeLeftTab === 'ai' && (items?.length || 0) === 0) {
            loadHistory();
        }
        this.setupObserver();
    }

    componentDidUpdate(prevProps) {
        const { activeLeftTab, items, cursor } = this.props;

        // 탭 전환 시 옵저버 리셋
        if (prevProps.activeLeftTab !== activeLeftTab) {
            this.teardownObserver();
            if (activeLeftTab === 'ai' && (items?.length || 0) === 0) {
                this.props.loadHistory();
            }
            this.setupObserver();
        }

        // 히스토리 변경(아이템/커서) 시 옵저버 재설정
        if (prevProps.items !== items || prevProps.cursor !== cursor) {
            this.teardownObserver();
            this.setupObserver();
        }
    }

    componentWillUnmount() {
        this.teardownObserver();
    }

    setupObserver = () => {
        if (this.props.activeLeftTab !== 'ai') return; // DM 탭에서는 무한 스크롤 X

        const root = this.listRef.current;
        const sentinel = this.bottomRef.current;
        if (!root || !sentinel) return;

        // 더 이상 다음 페이지가 없으면 옵저버 해제
        if (this.props.cursor === null) {
            this.teardownObserver();
            return;
        }

        this.teardownObserver(); // 기존 옵저버 정리

        this.observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (!entry.isIntersecting) return;

                // 최신 상태로 가드
                const { loading, cursor } = this.props;
                if (loading) return;         // 중복 호출 방지
                if (cursor === null) return; // 더 없음
                if (this._ioLock) return;    // 짧은 락으로 연속 트리거 방지

                this._ioLock = true;
                this.props.loadHistory();
                setTimeout(() => (this._ioLock = false), 200);
            },
            { root, rootMargin: '200px 0px', threshold: 0 }
        );

        this.observer.observe(sentinel);
    };

    teardownObserver = () => {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    };

    handleTab = (tab) => {
        if (tab !== this.props.activeLeftTab) {
            this.props.setLeftTab(tab); // 인풋 값은 유지
        }
    };

    render() {
        const { items = [], loading, activeLeftTab, dmItems = [] } = this.props;
        const term = this.state.filterTerm.trim().toLowerCase();

        const filteredAI = term
            ? items.filter((it) => (it.keyword || '').toLowerCase().includes(term))
            : items;

        const filteredDM = term
            ? dmItems.filter((ch) => (ch.name || ch.title || '').toLowerCase().includes(term))
            : dmItems;

        return (
            <aside className="ai-search-left">
                {/* 탭 */}
                <div className="tabs">
                    <div
                        className={`tab ${activeLeftTab === 'dm' ? 'is-active' : ''}`}
                        onClick={() => this.handleTab('dm')}
                    >
                        DM
                    </div>
                    <div
                        className={`tab ${activeLeftTab === 'ai' ? 'is-active' : ''}`}
                        onClick={() => this.handleTab('ai')}
                    >
                        AI THREAD
                    </div>
                </div>

                {/* 공통 인풋 (탭 전환해도 유지) */}
                <div className="left-filter">
                    <input
                        placeholder={activeLeftTab === 'dm' ? 'DM 채널 검색' : 'AI 검색 기록 검색'}
                        value={this.state.filterTerm}
                        onChange={(e) => this.setState({ filterTerm: e.target.value })}
                    />
                </div>

                {/* 리스트 영역 */}
                <div ref={this.listRef} className="history-scroll native-scroll">
                    {activeLeftTab === 'ai' ? (
                        <>
                            {filteredAI.map((it) => (
                                <div
                                    key={it.id}
                                    className="history-item"
                                    onClick={() => this.props.loadResult(it.id)}
                                >
                                    <div className="history-item__text">{it.keyword}</div>
                                </div>
                            ))}
                            {/* 무한 스크롤 센티널 */}
                            <div ref={this.bottomRef} />
                            {loading && <div className="history-item">불러오는 중…</div>}
                            {!loading && filteredAI.length === 0 && (
                                <div className="history-item">검색 기록이 없습니다.</div>
                            )}
                        </>
                    ) : (
                        <>
                            {filteredDM.map((ch) => (
                                <div key={ch.id} className="history-item">
                                    <div className="history-item__text">{ch.name || ch.title}</div>
                                </div>
                            ))}
                            {filteredDM.length === 0 && (
                                <div className="history-item">DM 채널이 없습니다.</div>
                            )}
                        </>
                    )}
                </div>
            </aside>
        );
    }
}

export default connect(
    (s) => ({
        // AI 히스토리
        items: s.history?.items || [],
        cursor: s.history?.cursor,         // { createdAt, id } | null
        loading: s.history?.loading || false,
        // UI
        activeLeftTab: s.ui?.activeLeftTab || 'ai', // 'ai' | 'dm'
        // DM 리스트(없으면 빈 배열)
        dmItems: (s.dm && s.dm.items) || [],
    }),
    { loadHistory, loadResult, setLeftTab }
)(LeftSide);
