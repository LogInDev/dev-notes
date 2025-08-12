import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { setActiveTab } from '../../../features/ui/uiSlice';
import './TabsBar.css'; // 선택

class TabsBar extends Component {
    onClick = (key) => {
        if (key !== this.props.activeTab) this.props.setActiveTab(key);
    };

    onKeyDown = (e, idx) => {
        const { tabs, activeTab, setActiveTab } = this.props;
        const current = tabs.findIndex(t => t.key === activeTab);
        const last = tabs.length - 1;

        switch (e.key) {
            case 'ArrowRight':
                setActiveTab(tabs[(current + 1) % tabs.length].key);
                e.preventDefault();
                break;
            case 'ArrowLeft':
                setActiveTab(tabs[(current - 1 + tabs.length) % tabs.length].key);
                e.preventDefault();
                break;
            case 'Home':
                setActiveTab(tabs[0].key);
                e.preventDefault();
                break;
            case 'End':
                setActiveTab(tabs[last].key);
                e.preventDefault();
                break;
            default:
                break;
        }
    };

    render() {
        const { tabs, activeTab } = this.props;
        return (
            <div className="tabs-bar" role="tablist" aria-label="cube tabs">
                {tabs.map((t, i) => {
                    const isActive = activeTab === t.key;
                    return (
                        <button
                            key={t.key}
                            id={`tab-${t.key}`}                // ★ 패널과 연결될 id
                            type="button"                      // ★ 폼 submit 방지
                            className={`tab-btn ${isActive ? 'active' : ''}`}
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`panel-${t.key}`}
                            tabIndex={isActive ? 0 : -1}       // ★ 포커스는 활성 탭
                            onKeyDown={(e) => this.onKeyDown(e, i)}
                            onClick={() => this.onClick(t.key)}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>
        );
    }
}

TabsBar.propTypes = {
    tabs: PropTypes.array.isRequired,
    activeTab: PropTypes.string.isRequired,
    setActiveTab: PropTypes.func.isRequired,
};

const mapState = state => ({
    tabs: state.ui.tabs,
    activeTab: state.ui.activeTab,
});

export default connect(mapState, { setActiveTab })(TabsBar);
