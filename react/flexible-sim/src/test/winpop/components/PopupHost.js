// components/PopupHost.js
import React, { Component } from 'react';
import { connect } from 'react-redux';
import NewWindow from 'react-new-window';
import { closePopup, registerPopupWin } from '../store/popupWindows';
import { Provider } from 'react-redux';
import store from '../index';
import AIViewPopup from './popup/AIViewPopup';

class PopupHost extends Component {
    handleOpen = (id, win) => {
        // 팝업 초기 스타일 주입 & beforeunload로 상태 정리
        try {
            const doc = win.document;
            const style = doc.createElement('style');
            style.textContent = `html,body,#root{height:100%;margin:0;}`;
            doc.head.appendChild(style);
            win.addEventListener('beforeunload', () => this.props.closePopup(id));
        } catch (e) {}
        this.props.registerPopupWin(id, win);
    };

    getFeatures = (i) => {
        const baseLeft = 120, baseTop = 80, step = 30;
        return {
            width: 900, height: 700,
            left: baseLeft + i*step, top: baseTop + i*step,
            menubar: 'no', toolbar: 'no'
        };
    };

    render() {
        const ids = Object.keys(this.props.items);
        if (ids.length === 0) return null;

        return ids.map((id, i) => {
            const it = this.props.items[id];
            return (
                <NewWindow
                    key={id}
                    title={`AI Assistant #${id}`}
                    copyStyles
                    features={this.getFeatures(i)}
                    onOpen={(win) => this.handleOpen(id, win)}
                    onUnload={() => this.props.closePopup(id)}
                >
                    {/* 팝업 window가 준비되면 자식 렌더 */}
                    {it.win && (
                        <Provider store={store}>
                            <AIViewPopup
                                popupId={id}
                                popupWindow={it.win}
                                height={700}
                                onClose={() => this.props.closePopup(id)}
                            />
                        </Provider>
                    )}
                </NewWindow>
            );
        });
    }
}

export default connect(
    (s) => ({ items: s.popupWindows.items }),
    { closePopup, registerPopupWin }
)(PopupHost);
