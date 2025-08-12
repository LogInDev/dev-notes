import React, { Component } from 'react';
import { Provider, connect } from 'react-redux';
import store from './store';
import TabsBar from './components/tobe/tabs/TabsBar';
import SearchBox from './components/tobe/search/SearchBox';
import MessageCommandInput from './components/tobe/command/MessageCommandInput';
import './tobe_styles.css';

class TabContent extends Component {
    render() {
        const { activeTab } = this.props;
        if (activeTab === 'chat')
            return <div id="panel-chat"  className="panel" role="tabpanel" aria-labelledby="tab-chat">채팅 내용 영역</div>;
        if (activeTab === 'notice')
            return <div id="panel-notice" className="panel" role="tabpanel" aria-labelledby="tab-notice">공지 리스트</div>;
        if (activeTab === 'files')
            return <div id="panel-files" className="panel" role="tabpanel" aria-labelledby="tab-files">파일 리스트</div>;
        return null;
    }
}
const ConnectedTabContent = connect(state => ({ activeTab: state.ui.activeTab }))(TabContent);

class Shell extends Component {
    render() {
        return (
            <div className="app">
                <header className="header">
                    <div className="left">
                        <TabsBar />
                    </div>
                    <div className="right">
                        <SearchBox />
                    </div>
                </header>

                <main className="main">
                    <ConnectedTabContent />
                </main>

                <footer className="footer">
                    <MessageCommandInput />
                </footer>
            </div>
        );
    }
}

export default function App() {
    return (
        <Provider store={store}>
            <Shell />
        </Provider>
    );
}
