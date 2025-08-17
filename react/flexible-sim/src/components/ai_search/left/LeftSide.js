// src/components/LeftSide/LeftSide.js
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { loadHistory, loadResult } from '../../../store/actions/ai';
import { setLeftTab } from '../../../features/ui/uiSlice';
import './left.css';

class LeftSide extends Component {
    state = { filterTerm: '' };
    bottomRef = React.createRef();
    observer = null;

    componentDidMount() {
        console.log('[LeftSide] mount → loadHistory()');
        if (this.props.activeLeftTab === 'ai' && this.props.items.length === 0) {
            this.props.loadHistory();
        }
        this.setupObserver();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.activeLeftTab !== this.props.activeLeftTab) {
            this.teardownObserver();
            this.setupObserver();
            if (this.props.activeLeftTab === 'ai' && this.props.items.length === 0) {
                this.props.loadHistory();
            }
        }
    }

    componentWillUnmount() {
        this.teardownObserver();
    }

    setupObserver = () => {
        if (this.props.activeLeftTab !== 'ai') return; // DM에서는 무한 스크롤 X
        this.observer = new IntersectionObserver(
            (entries) => {
                const { loading, cursor } = this.props;
                if (entries[0].isIntersecting && !loading && cursor) {
                    this.props.loadHistory();
                }
            },
            { threshold: 0, rootMargin: '200px 0px' }
        );
        if (this.bottomRef.current) this.observer.observe(this.bottomRef.current);
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
        const { items, loading, activeLeftTab, dmItems = [] } = this.props;
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
                <div className="history-scroll native-scroll">
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
        items: s.history.items,                 // AI 히스토리
        cursor: s.history.cursor,
        loading: s.history.loading,
        activeLeftTab: s.ui.activeLeftTab,      // 'ai' | 'dm'
        dmItems: (s.dm && s.dm.items) || [],    // DM 리스트(없으면 빈 배열)
    }),
    { loadHistory, loadResult, setLeftTab }
)(LeftSide);
