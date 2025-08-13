import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { setQuery, addRecent, executeSearch, setDropdownOpen, clearRecents } from '../../../features/search/searchSlice';

class SearchBox extends Component {
    wrapperRef = createRef();

    state = {
        // 간단 필터링 결과만 내부 계산
    };

    componentDidMount() {
        // 문서 어디든 클릭/터치 시작 시 먼저 가로챈다(캡처 단계)
        document.addEventListener('pointerdown', this.handleDocPointerDown, true);
        document.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('blur', this.closeDropdown);
    }

    componentWillUnmount() {
        document.removeEventListener('pointerdown', this.handleDocPointerDown, true);
        document.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('blur', this.closeDropdown);
    }
    // ✅ 바깥 클릭 감지 (포털/쉐도우DOM까지 안전)
    handleDocPointerDown = (e) => {
        const root = this.wrapperRef.current;
        if (!root) return;
        const path = typeof e.composedPath === 'function' ? e.composedPath() : null;
        const clickedInside = root.contains(e.target) || (path && path.includes(root));
        if (!clickedInside && this.props.isOpenDropdown) {
            this.props.setDropdownOpen(false);
        }
    };

    // ✅ ESC 로 닫기
    handleKeyDown = (e) => {
        if (e.key === 'Escape' && this.props.isOpenDropdown) {
            this.props.setDropdownOpen(false);
        }
    };

    // ✅ 창 전환 시 닫기
    closeDropdown = () => {
        if (this.props.isOpenDropdown) this.props.setDropdownOpen(false);
    };

    onFocus = () => {
        if (this.props.recents.length > 0) this.props.setDropdownOpen(true);
    };

    onChange = (e) => {
        this.props.setQuery(e.target.value);
        if (!this.props.isOpenDropdown && this.props.recents.length > 0) {
            this.props.setDropdownOpen(true);
        }
    };

    onKeyDown = (e) => {
        if (e.key === 'Enter') {
            const q = this.props.query.trim();
            if (!q) return;
            this.props.addRecent(q);
            this.props.executeSearch(q); // 여기서 실제 검색 트리거(실무에선 Saga/Thunk/Socket 등)
            this.props.setDropdownOpen(false);
        } else if (e.key === 'Escape') {
            this.props.setDropdownOpen(false);
        }
    };

    onClickRecent = (q) => {
        this.props.setQuery(q);
        this.props.addRecent(q);
        this.props.executeSearch(q);
        this.props.setDropdownOpen(false);
    };

    render() {
        const { query, recents, isOpenDropdown } = this.props;
        const filtered = recents.filter(v => !query || v.toLowerCase().includes(query.toLowerCase()));
        return (
            <div className="search-wrap" ref={this.wrapperRef}>
                <input
                    className="search-input"
                    value={query}
                    onChange={this.onChange}
                    onKeyDown={this.onKeyDown}
                    onFocus={this.onFocus}
                    placeholder="검색어를 입력하세요"
                />
                {isOpenDropdown && filtered.length > 0 && (
                    <div className="search-dropdown">
                        <div className="search-dropdown-header">
                            최근 검색어
                            <button className="clear-btn" onClick={this.props.clearRecents}>전체삭제</button>
                        </div>
                        <ul>
                            {filtered.map(item => (
                                <li key={item}>
                                    <button // ✅ 드롭다운 아이템 클릭 시 인풋 blur로 먼저 닫히는 문제 방지
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => this.onClickRecent(item)}
                                    >{item}</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    }
}

SearchBox.propTypes = {
    query: PropTypes.string.isRequired,
    recents: PropTypes.array.isRequired,
    isOpenDropdown: PropTypes.bool.isRequired,
    setQuery: PropTypes.func.isRequired,
    addRecent: PropTypes.func.isRequired,
    executeSearch: PropTypes.func.isRequired,
    setDropdownOpen: PropTypes.func.isRequired,
    clearRecents: PropTypes.func.isRequired,
};

const mapState = state => ({
    query: state.search.query,
    recents: state.search.recents,
    isOpenDropdown: state.search.isOpenDropdown,
});

export default connect(mapState, { setQuery, addRecent, executeSearch, setDropdownOpen, clearRecents })(SearchBox);
