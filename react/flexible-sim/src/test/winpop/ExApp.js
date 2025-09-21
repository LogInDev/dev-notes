// index.js - PopupHost가 Redux Provider 안에 있어야 전역 상태에 접근 가능.
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import store from './store';
import App from './App';
import PopupHost from './components/PopupHost';

ReactDOM.render(
    <Provider store={store}>
        <BrowserRouter>
            <>
                {/* ✅ 전역 팝업 호스트 - 라우트 바뀌어도 안 죽음 */}
                <PopupHost />
                <App />
            </>
        </BrowserRouter>
    </Provider>,
    document.getElementById('root')
);



// App.js (react-router-dom v5) - 핵심: PopupHost는 Switch/Routes 위에 두기. 그러면 라우트 변경에 의해 언마운트되지 않음.
import React, { Component } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import PopupHost from './components/PopupHost';
import Main from './pages/Main';
import Detail from './pages/Detail';
import NotFound from './pages/NotFound';

class App extends Component {
    render() {
        return (
            <Router>
                {/* ✅ 라우트 바깥의 전역 레이어 */}
                <PopupHost />

                {/* 전역 레이아웃이 있다면 여기 감싸도 됨 */}
                <div className="app-layout">
                    <Switch>
                        <Route exact path="/" component={Main} />
                        <Route path="/detail/:id" component={Detail} />
                        <Route component={NotFound} />
                    </Switch>
                </div>
            </Router>
        );
    }
}

export default App;


// App.js (react-router-dom v5)
import React, { Component } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import PopupHost from './components/PopupHost';
import Main from './pages/Main';
import Detail from './pages/Detail';
import NotFound from './pages/NotFound';

class App extends Component {
    render() {
        return (
            <Router>
                {/* ✅ 라우트 바깥의 전역 레이어 */}
                <PopupHost />

                {/* 전역 레이아웃이 있다면 여기 감싸도 됨 */}
                <div className="app-layout">
                    <Switch>
                        <Route exact path="/" component={Main} />
                        <Route path="/detail/:id" component={Detail} />
                        <Route component={NotFound} />
                    </Switch>
                </div>
            </Router>
        );
    }
}

export default App;
