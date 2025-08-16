// src/components/AISearch/AISearch.js
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { submitSearch } from '../../../store/actions/ai';
import './search.css';

class AISearch extends Component {
    state = { value: '', open: false };
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
        // 바깥 클릭이면 닫기
        if (this.state.open && !root.contains(e.target)) this.closePopover();
    };

    handleFocus = () => this.openPopover();
    handleBlur = (e) => {
        // 포커스가 컴포넌트 밖으로 나갔을 때만 닫기
        const root = e.currentTarget;
        if (!root.contains(e.relatedTarget)) this.closePopover();
    };

    handleSubmit = () => {
        const v = (this.state.value || '').trim();
        if (!v) return;
        this.props.submitSearch(v);
        this.closePopover(); // 제출 후 닫기
    };

    handleSuggest = (label) => {
        this.setState({ value: label }, () => {
            this.props.submitSearch(label);
            this.closePopover();
        });
    };

    render() {
        const { value, open } = this.state;

        return (
            <div className="ai-search-header">
                <div
                    className={`searchbox ${open ? 'is-open' : ''}`}
                    ref={this.rootRef}
                    onFocus={this.handleFocus}
                    onBlur={this.handleBlur}
                    onClick={this.openPopover}           // 검색란 아무 곳 클릭 시 열기
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
                            {['Kafka 트러블슈팅','CSS Flex','Vert.x 라우터','SQL 튜닝','에러 로그','Flink 파이프라인']
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
            </div>
        );
    }
}

export default connect(null, { submitSearch })(AISearch);
