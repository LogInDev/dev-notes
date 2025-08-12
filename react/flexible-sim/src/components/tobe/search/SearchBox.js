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
        document.addEventListener('mousedown', this.handleDocClick);
    }
    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleDocClick);
    }
    handleDocClick = (e) => {
        if (!this.wrapperRef.current) return;
        if (!this.wrapperRef.current.contains(e.target)) {
            if (this.props.isOpenDropdown) this.props.setDropdownOpen(false);
        }
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
                                    <button onClick={() => this.onClickRecent(item)}>{item}</button>
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
